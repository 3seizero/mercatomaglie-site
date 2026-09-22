#!/usr/bin/env python3
"""
Import degli elenchi SUAP (PDF del 07/09/2026) nei file seed JSON.

Uso:
    python3 scripts/import-suap.py [--library "../Library/Elenchi"] [--out data/seed]

Richiede `pdftotext` (poppler). Legge i 9 PDF, li normalizza e scrive:
    data/seed/mercati.json                 - i 3 mercati
    data/seed/posteggi.json                - tutti i posteggi (257 area + coperto + ortofrutta)
    data/seed/espositori.json              - anagrafica PUBBLICA (denominazione, referente, settore…)
    data/seed/espositori_riservati.json    - CF / P.IVA / indirizzi (NON committare: è in .gitignore)
    data/seed/REPORT.md                    - conteggi e anomalie da verificare
"""
import argparse, json, os, re, subprocess, sys, unicodedata
from collections import OrderedDict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# --------------------------------------------------------------------------
# Sorgenti
# --------------------------------------------------------------------------
AREA = [
    ("A", "Abbigliamento / biancheria",       "Area Mercatale/ELENCO settore A (ABBIGLIAMENTO).pdf"),
    ("B", "Abbigliamento usato",              "Area Mercatale/ELENCO settore B (ABBIGLIAMENTO USATO).pdf"),
    ("C", "Alimentare",                       "Area Mercatale/ELENCO settore C (ALIMENTARE).pdf"),
    ("D", "Calzature",                        "Area Mercatale/ELENCO settore D (CALZATURE).pdf"),
    ("E", "Casalinghi / ferramenta / fiori",  "Area Mercatale/ELENCO settore E (CASALINGHI-FERRAM-FIORI)).pdf"),
]
COPERTO_BOX    = "Mercato Coperrto Centro/ELENCO BOX Mercato Centro.pdf"
COPERTO_PANCHE = "Mercato Coperrto Centro/ELENCO CONCESSIONI - Panche Mercato Centro.pdf"
IMM_BOX        = "Mercato Ortofrutticolo Piazza Immacolata/Elenco BOX mercato P.zza Immacolata.pdf"
IMM_SETT       = "Mercato Ortofrutticolo Piazza Immacolata/Elenco mercato settimanale ortofrutticolo P.ZZA IMMACOLATA.pdf"

MERCATI = [
    {"id": "area-mercatale", "nome": "Area Mercatale", "tipo": "settimanale", "hasMappa": True,
     "indirizzo": None, "giorni": ["ogni sabato"], "orari": "6:00 – 13:00", "giorniSettimana": [6], "apertura": "06:00", "chiusura": "13:00",
     "note": "Nuova Area Mercatale, 5 settori merceologici (A–E). Indirizzo da confermare."},
    {"id": "coperto", "nome": "Mercato Coperto Centro", "tipo": "coperto", "hasMappa": False,
     "indirizzo": "Via Toma Nuzzichi, Maglie", "giorni": ["tutti i giorni"], "orari": "6:00 – 13:00", "giorniSettimana": [1,2,3,4,5,6,0], "apertura": "06:00", "chiusura": "13:00",
     "note": "8 box (prodotti ittici / carni) + 10 panche prodotti agricoli."},
    {"id": "ortofrutticolo", "nome": "Mercato Ortofrutticolo", "tipo": "settimanale", "hasMappa": False,
     "indirizzo": "Piazza Immacolata, Maglie", "giorni": ["ogni mercoledì"], "orari": "6:00 – 13:00", "giorniSettimana": [3], "apertura": "06:00", "chiusura": "13:00",
     "note": "Mercato settimanale (gli elenchi SUAP lo indicano come mercato del sabato: confermato mercoledì da Carlo il 22/09/2026)."},
]

# --------------------------------------------------------------------------
# Utilità
# --------------------------------------------------------------------------
def pdftotext(path):
    out = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True, check=True)
    return out.stdout

ACRONYMS = {"S.R.L.", "S.R.L", "SRL", "SRLS", "S.N.C.", "S.N.C", "SNC", "S.A.S.", "S.A.S", "SAS",
            "S.P.A.", "SPA", "&", "C.", "C", "DI", "DE", "E", "F.A", "RDN", "DEDI", "P.ZZA"}
PARTICLES = {"di", "e", "&", "da"}

def titlecase(s):
    """Title case che rispetta apostrofi (CALO' -> Calo'), particelle e sigle societarie."""
    def one(tok):
        if tok.upper() in ACRONYMS and tok.upper() not in {"DI", "DE", "E", "C"}:
            return tok.upper()
        low = tok.lower()
        if low in PARTICLES:
            return low
        # M'HAMED -> M'Hamed ; CALO' -> Calo'
        parts = re.split(r"(['’])", low)
        out = []
        for p in parts:
            if p in ("'", "’") or p == "":
                out.append(p)
            else:
                out.append(p[0].upper() + p[1:])
        return "".join(out)
    toks = s.split()
    res = [one(t) for t in toks]
    if res:
        res[0] = res[0][0].upper() + res[0][1:]  # la prima parola sempre maiuscola
    return " ".join(res)

def split_cognome_nome(s):
    """'DE PASCALI Fabrizio' -> ('DE PASCALI','Fabrizio'); 'STICCHI ROBERTO' -> ('STICCHI ROBERTO', None)."""
    toks = s.split()
    i = 0
    while i < len(toks) and toks[i] == toks[i].upper():
        i += 1
    if i == len(toks) and len(toks) == 2:
        return toks[0], toks[1]
    if i == 0 or i == len(toks):
        return s, None
    return " ".join(toks[:i]), " ".join(toks[i:])

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s

def check_piva(p):
    if not re.fullmatch(r"\d{11}", p):
        return False
    tot = 0
    for i, ch in enumerate(p):
        d = int(ch)
        if i % 2 == 0:
            tot += d
        else:
            d *= 2
            tot += d - 9 if d > 9 else d
    return tot % 10 == 0

_ODD = {'0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
        'A':1,'B':0,'C':5,'D':7,'E':9,'F':13,'G':15,'H':17,'I':19,'J':21,'K':2,'L':4,'M':18,
        'N':20,'O':11,'P':3,'Q':6,'R':8,'S':12,'T':14,'U':16,'V':10,'W':22,'X':25,'Y':24,'Z':23}
def check_cf(cf):
    if not re.fullmatch(r"[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]", cf):
        return False
    tot = 0
    for i, ch in enumerate(cf[:15]):
        if i % 2 == 0:
            tot += _ODD[ch]
        else:
            tot += int(ch) if ch.isdigit() else ord(ch) - ord('A')
    return chr(ord('A') + tot % 26) == cf[15]

def parse_superficie(raw):
    """'9x5' -> {w:9,h:5,mq:45}; '4,5x5'; '22'; '4x3 + banco'; '13 + banco'."""
    if raw is None:
        return None
    r = raw.strip()
    m = re.match(r"^(\d+(?:[.,]\d+)?)\s*[xX]\s*(\d+(?:[.,]\d+)?)", r)
    if m:
        w = float(m.group(1).replace(",", ".")); h = float(m.group(2).replace(",", "."))
        d = {"raw": raw, "w": w, "h": h, "mq": round(w * h, 2)}
    else:
        m = re.match(r"^(\d+(?:[.,]\d+)?)", r)
        d = {"raw": raw, "w": None, "h": None, "mq": float(m.group(1).replace(",", ".")) if m else None}
    if "banco" in r.lower():
        d["banco"] = True
    return d

def extract_ids(tokens):
    """Estrae (cf, piva) dai token finali di una riga. Ritorna (cf, piva, tokens_rimanenti)."""
    cf = piva = None
    if tokens and re.fullmatch(r"\d{10,12}", tokens[-1]):
        piva = tokens.pop()
    if tokens and ((re.fullmatch(r"[A-Z0-9]{15,16}", tokens[-1]) and re.search(r"[A-Z]", tokens[-1])) or re.fullmatch(r"\d{10,12}", tokens[-1])):
        cf = tokens.pop()
    return cf, piva, tokens

# --------------------------------------------------------------------------
# Registro espositori (dedup per CF / P.IVA / nome)
# --------------------------------------------------------------------------
class Registro:
    def __init__(self):
        self.by_key = OrderedDict()
        self.ids = Counter()
        self.riservati = {}
        self.issues = []

    def add(self, *, cognome_nome, denominazione, cf, piva, indirizzo, mercato, settore, categoria, tipo, source):
        cognome_nome = " ".join(cognome_nome.split()) if cognome_nome else ""
        denominazione = " ".join(denominazione.split()) if denominazione else ""
        key = cf or piva or ("nome:" + slugify(cognome_nome or denominazione))
        if key in self.by_key:
            e = self.by_key[key]
            if mercato not in e["mercati"]:
                e["mercati"].append(mercato)
            if settore and settore not in e["settori"]:
                e["settori"].append(settore)
            if cognome_nome and slugify(cognome_nome) != slugify(e["_cognome_nome"]):
                self.issues.append(f"{source}: stesso CF/P.IVA {key} con nome diverso: '{e['_cognome_nome']}' vs '{cognome_nome}'")
            return e["id"]

        cognome, nome = split_cognome_nome(cognome_nome) if cognome_nome else (None, None)
        if nome:
            referente = f"{titlecase(nome)} {titlecase(cognome)}"
        elif cognome_nome:
            referente = titlecase(cognome_nome)
        else:
            referente = None
        base = slugify(cognome_nome or denominazione) or "espositore"
        self.ids[base] += 1
        eid = base if self.ids[base] == 1 else f"{base}-{self.ids[base]}"
        den = titlecase(denominazione) if denominazione else referente
        e = OrderedDict([
            ("id", eid),
            ("denominazione", den),
            ("alias", None),
            ("referente", referente),
            ("tipo", tipo),                # concessionario | produttore | operatori-vari
            ("categoria", categoria),
            ("mercati", [mercato]),
            ("settori", [settore] if settore else []),
            ("whatsapp", None),
            ("telegram", None),
            ("descrizione", None),
            ("foto", None),
            ("_cognome_nome", cognome_nome),
        ])
        self.by_key[key] = e
        self.riservati[eid] = OrderedDict([
            ("id", eid),
            ("cognomeNome", cognome_nome or None),
            ("cognome", titlecase(cognome) if cognome and nome else None),
            ("nome", titlecase(nome) if nome else None),
            ("denominazioneOriginale", denominazione or None),
            ("codiceFiscale", cf),
            ("partitaIva", piva),
            ("indirizzo", indirizzo),
            ("fonte", source),
        ])
        if cf and not check_cf(cf) and not (cf.isdigit()):
            self.issues.append(f"{source}: C.F. non valido '{cf}' ({cognome_nome})")
        if cf and cf.isdigit() and cf != piva:
            self.issues.append(f"{source}: C.F. numerico diverso dalla P.IVA '{cf}' vs '{piva}' ({cognome_nome})")
        if piva and not check_piva(piva):
            self.issues.append(f"{source}: P.IVA non valida '{piva}' ({len(piva)} cifre) ({cognome_nome} / {denominazione})")
        return eid

    def public(self):
        out = []
        for e in self.by_key.values():
            d = OrderedDict((k, v) for k, v in e.items() if not k.startswith("_"))
            out.append(d)
        return out

# --------------------------------------------------------------------------
# Parser: Area Mercatale (settori A–E)
# --------------------------------------------------------------------------
ROW_RE = re.compile(r"^\s*(\d{1,3})\s+(\S.*)$")

def parse_area(text, settore, categoria, source, reg, posteggi, issues):
    n_rows = 0
    for line in text.splitlines():
        m = ROW_RE.match(line)
        if not m:
            continue
        ordine, rest = int(m.group(1)), m.group(2).rstrip()
        toks = rest.split()
        if len(toks) < 3:
            continue
        # da destra: superficie, posteggio (eventuale 'bis'), fila (eventuale 'bis')
        sup = toks.pop()
        if not re.match(r"^\d", sup):
            continue  # riga di intestazione o data
        def pop_num():
            v = toks.pop()
            if v.lower() == "bis":
                v = toks.pop() + " bis"
            return v
        numero_raw = pop_num()
        fila_raw = pop_num()
        numero = numero_raw.replace(" bis", "bis")
        fila = fila_raw.replace(" bis", "bis")
        middle = toks
        vacante = middle and middle[0].upper() == "VACANTE"
        eid = None
        if not vacante:
            cf, piva, middle = extract_ids(middle)
            # ricostruisco cognome/nome e denominazione dalla riga originale (separati da 2+ spazi)
            mid_str = " ".join(middle)
            # riprendo dalla riga originale la parte centrale per usare la doppia spaziatura
            seg = rest
            for tail in [sup, numero_raw, fila_raw, piva or "", cf or ""]:
                if tail:
                    seg = re.sub(r"\s*" + re.escape(tail) + r"\s*$", "", seg)
            cols = [c for c in re.split(r"\s{2,}", seg.strip()) if c]
            if len(cols) >= 2:
                cognome_nome, denominazione = cols[0], " ".join(cols[1:])
            else:
                cognome_nome, denominazione = mid_str, ""
                issues.append(f"{source} riga {ordine}: denominazione non separabile da '{mid_str}'")
            if not cf and not piva:
                issues.append(f"{source} riga {ordine}: nessun CF/P.IVA per '{cognome_nome}'")
            eid = reg.add(cognome_nome=cognome_nome, denominazione=denominazione, cf=cf, piva=piva,
                          indirizzo=None, mercato="area-mercatale", settore=settore, categoria=categoria,
                          tipo="concessionario", source=f"{source} riga {ordine}")
        pid = f"{settore}-{numero}"
        if any(p["id"] == pid for p in posteggi):
            issues.append(f"{source}: posteggio duplicato {pid}")
        posteggi.append(OrderedDict([
            ("id", pid),
            ("mercato", "area-mercatale"),
            ("settore", settore),
            ("fila", fila),
            ("numero", numero),
            ("etichetta", f"Settore {settore} · fila {fila_raw} · n. {numero_raw}"),
            ("tipo", "posteggio"),
            ("superficie", parse_superficie(sup)),
            ("espositoreId", eid),
            ("stato", "vacante" if vacante else "assegnato"),
            ("ordineElenco", ordine),
            ("mapId", None),   # P001–P251 della mappa v1: da riconciliare (Fase 0.3)
        ]))
        n_rows += 1
    return n_rows

# --------------------------------------------------------------------------
# Parser: elenchi a blocchi (Coperto box, Immacolata box)
# --------------------------------------------------------------------------
def blocks(text):
    """Raggruppa le righe in blocchi che iniziano con un numero d'ordine."""
    out, cur = [], None
    for line in text.splitlines():
        if re.match(r"^\s*\d{1,3}\s", line) or re.match(r"^\s*\d{1,3}\s*$", line):
            if cur: out.append(cur)
            cur = [line]
        elif cur is not None and line.strip():
            if re.match(r"^\s*(Comune di Maglie|\d{2}/\d{2}/\d{4})", line):
                out.append(cur); cur = None
            else:
                cur.append(line)
    if cur: out.append(cur)
    return out

def parse_coperto_box(text, reg, posteggi, issues):
    src = "Coperto BOX"
    for b in blocks(text):
        flat = " ".join(" ".join(b).split())
        m = re.match(r"^(\d+)\s+(.*)$", flat)
        ordine, rest = int(m.group(1)), m.group(2)
        mbox = re.search(r"Box n\.\s*(\d+)", rest)
        msup = re.search(r"Box n\.\s*\d+\s+(\d+x\d+)", rest)
        numero = mbox.group(1)
        sup = msup.group(1) if msup else None
        articolo = None
        ma = re.search(r"(Prodotti ittici|VENDITA SETTIMANALE CARNE)", rest)
        if ma: articolo = ma.group(1)
        eid, stato, tipo = None, "assegnato", "concessionario"
        if "VACANTE" in rest:
            stato = "vacante"
        elif rest.startswith("OPERATORI VARI"):
            eid = reg.add(cognome_nome="", denominazione="Operatori vari - vendita settimanale carni", cf=None, piva=None,
                          indirizzo=None, mercato="coperto", settore="box", categoria="Carni", tipo="operatori-vari",
                          source=f"{src} riga {ordine}")
        else:
            # riga 1: [DENOMINAZIONE?] articolo Box n. X sup ; riga 2: COGNOME Nome [DENOMINAZIONE] CF PIVA
            l1 = " ".join(b[0].split()); l1 = re.sub(r"^\d+\s+", "", l1)
            l1 = re.sub(r"(Prodotti ittici|VENDITA SETTIMANALE CARNE).*$", "", l1).strip()
            l2 = " ".join(b[1:]) if len(b) > 1 else ""
            cols = [c for c in re.split(r"\s{2,}", l2.strip()) if c]
            cf, piva, ids_toks = extract_ids(cols[-2:] if len(cols) >= 2 else cols[-1:])
            cols = cols[:len(cols) - (2 - len(ids_toks))] if len(cols) >= 2 else []
            # se un id era nella stessa colonna
            cognome_nome = cols[0] if cols else ""
            den = " ".join(cols[1:]) if len(cols) > 1 else l1
            eid = reg.add(cognome_nome=cognome_nome, denominazione=den, cf=cf, piva=piva, indirizzo=None,
                          mercato="coperto", settore="box", categoria="Prodotti ittici" if articolo == "Prodotti ittici" else articolo,
                          tipo="concessionario", source=f"{src} riga {ordine}")
        posteggi.append(OrderedDict([
            ("id", f"COP-BOX-{numero}"), ("mercato", "coperto"), ("settore", "box"), ("fila", None),
            ("numero", numero), ("etichetta", f"Box n. {numero}"), ("tipo", "box"),
            ("superficie", parse_superficie(sup)), ("articolo", articolo),
            ("espositoreId", eid), ("stato", stato), ("ordineElenco", ordine), ("mapId", None),
        ]))

def parse_coperto_panche(text, reg, posteggi, issues):
    src = "Coperto PANCHE"
    for line in text.splitlines():
        m = re.match(r"^\s*(\d{1,2})\s+(.*?)\s+(\d{1,2})\s+(Prodotti agricoli)\s*$", line)
        if not m:
            continue
        ordine, mid, posto, articolo = int(m.group(1)), m.group(2), m.group(3), m.group(4)
        eid, stato = None, "assegnato"
        if mid.strip().upper().startswith("VACANTE"):
            stato = "vacante"
        else:
            cols = [c for c in re.split(r"\s{2,}", mid.strip()) if c]
            cognome_nome = cols[0]
            indirizzo = " ".join(cols[1:]) if len(cols) > 1 else None
            eid = reg.add(cognome_nome=cognome_nome, denominazione="", cf=None, piva=None, indirizzo=indirizzo,
                          mercato="coperto", settore="panche", categoria="Prodotti agricoli", tipo="produttore",
                          source=f"{src} riga {ordine}")
        posteggi.append(OrderedDict([
            ("id", f"COP-PANCA-{posto}"), ("mercato", "coperto"), ("settore", "panche"), ("fila", None),
            ("numero", posto), ("etichetta", f"Panca n. {posto}"), ("tipo", "panca"),
            ("superficie", None), ("articolo", articolo),
            ("espositoreId", eid), ("stato", stato), ("ordineElenco", ordine), ("mapId", None),
        ]))

def parse_imm_box(text, reg, posteggi, issues):
    src = "Immacolata BOX"
    for b in blocks(text):
        flat = " ".join(" ".join(b).split())
        m = re.match(r"^(\d+)\s*(.*)$", flat)
        ordine, rest = int(m.group(1)), m.group(2)
        mbox = re.search(r"Box (deposito )?n\.\s*(\d+)", rest)
        mban = re.search(r"banco vendita n\.\s*(\d+)", rest)
        msup = re.search(r"(?:Box (?:deposito )?n\.\s*\d+|banco vendita n\.\s*\d+)\s+(.+)$", rest)
        sup = None
        if msup:
            s = msup.group(1).strip()
            s = re.sub(r"^banco vendita n\.\s*\d+\s*", "", s)
            sup = s or None
        eid, stato = None, "assegnato"
        if "VACANTE" in rest:
            stato = "vacante"
        else:
            # riga 1 può contenere solo la denominazione; riga 2: COGNOME NOME [DEN] CF PIVA Box...
            joined = " ".join(b)
            pre = re.split(r"\s+Box (?:deposito )?n\.", joined)[0]
            pre = re.sub(r"^\s*\d+\s*", "", pre)
            cols = [c for c in re.split(r"\s{2,}|\n", pre.strip()) if c.strip()]
            cols = [" ".join(c.split()) for c in cols]
            cf, piva, _ = extract_ids(cols[-2:])
            cols = [c for c in cols if c not in (cf, piva)]
            # l'ultima colonna testuale è il cognome/nome, le precedenti la denominazione
            if len(cols) >= 2 and re.fullmatch(r"[A-Z' ]+", cols[-1]) and len(cols[-1].split()) <= 3 and cols[0] != cols[-1]:
                cognome_nome, den = cols[-1], " ".join(cols[:-1])
            else:
                cognome_nome, den = cols[0], " ".join(cols[1:])
            if den == cognome_nome:
                den = ""
            eid = reg.add(cognome_nome=cognome_nome, denominazione=den, cf=cf, piva=piva, indirizzo=None,
                          mercato="ortofrutticolo", settore="box", categoria="Ortofrutta", tipo="concessionario",
                          source=f"{src} riga {ordine}")
        if not mbox and not mban:
            issues.append(f"{src} riga {ordine}: nessun box/banco indicato (stato {stato})")
            pid, etich, tipo, numero = f"IMM-BOX-riga{ordine}", f"(senza box, riga {ordine})", "box", None
        else:
            numero = mbox.group(2) if mbox else None
            deposito = bool(mbox and mbox.group(1))
            pid = f"IMM-BOX-{numero}" if numero else f"IMM-BANCO-{mban.group(1)}"
            etich = ("Box deposito n. " if deposito else "Box n. ") + numero if numero else f"Banco vendita n. {mban.group(1)}"
            if mban:
                etich += f" + banco vendita n. {mban.group(1)}"
            tipo = "box-deposito" if deposito else "box"
        posteggi.append(OrderedDict([
            ("id", pid), ("mercato", "ortofrutticolo"), ("settore", "box"), ("fila", None),
            ("numero", numero), ("etichetta", etich), ("tipo", tipo),
            ("bancoVendita", mban.group(1) if mban else None),
            ("superficie", parse_superficie(sup)), ("articolo", None),
            ("espositoreId", eid), ("stato", stato), ("ordineElenco", ordine), ("mapId", None),
        ]))

def parse_imm_sett(text, reg, posteggi, issues):
    src = "Immacolata SETTIMANALE"
    pending = None
    for line in text.splitlines():
        m = re.match(r"^\s*(\d{1,2})\s+(\S.*)$", line)
        if m and not re.match(r"^\s*\d{2}/", line):
            ordine, rest = int(m.group(1)), m.group(2).rstrip()
            toks = rest.split()
            if not re.match(r"^\d+x\d+$", toks[-1]):
                # riga spezzata: la denominazione continua nella riga successiva
                pending = (ordine, rest)
                continue
            _emit(src, ordine, rest, reg, posteggi, issues)
        elif pending and line.strip():
            ordine, first = pending
            _emit(src, ordine, first + "  " + line.strip(), reg, posteggi, issues)
            pending = None

def _emit(src, ordine, rest, reg, posteggi, issues):
    toks = rest.split()
    sup = toks.pop()
    numero = toks.pop()
    seg = rest[:rest.rfind(numero)].rstrip()
    seg = seg[:len(seg)]
    cols = [c for c in re.split(r"\s{2,}", seg.strip()) if c]
    articolo = None
    if cols and re.fullmatch(r"(frutta e verdura|Ortofrutta|fiori)", cols[-1], re.I):
        articolo = cols.pop().lower()
    eid, stato, note = None, "assegnato", None
    if cols and cols[0].upper().startswith("VACANTE"):
        stato = "vacante"
        if len(cols) > 1 and "AGRICOLTORI" in cols[1].upper():
            note = "riservato agli agricoltori"
    else:
        cf, piva, _ = extract_ids(cols[-2:])
        cols = [c for c in cols if c not in (cf, piva)]
        cognome_nome = cols[0]
        den = " ".join(cols[1:])
        cat = {"fiori": "Fiori"}.get(articolo, "Ortofrutta")
        eid = reg.add(cognome_nome=cognome_nome, denominazione="" if den.upper() == cognome_nome.upper() else den,
                      cf=cf, piva=piva, indirizzo=None, mercato="ortofrutticolo", settore="settimanale",
                      categoria=cat, tipo="concessionario", source=f"{src} riga {ordine}")
    posteggi.append(OrderedDict([
        ("id", f"IMM-{numero}"), ("mercato", "ortofrutticolo"), ("settore", "settimanale"), ("fila", None),
        ("numero", numero), ("etichetta", f"Posteggio n. {numero}"), ("tipo", "posteggio"),
        ("superficie", parse_superficie(sup)), ("articolo", articolo), ("note", note),
        ("espositoreId", eid), ("stato", stato), ("ordineElenco", ordine), ("mapId", None),
    ]))

# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--library", default=os.path.join(ROOT, "..", "Library", "Elenchi"))
    ap.add_argument("--out", default=os.path.join(ROOT, "data", "seed"))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    reg, posteggi, issues = Registro(), [], []
    counts = OrderedDict()

    for settore, cat, rel in AREA:
        txt = pdftotext(os.path.join(args.library, rel))
        n = parse_area(txt, settore, cat, f"Settore {settore}", reg, posteggi, issues)
        counts[f"Area Mercatale settore {settore}"] = n
    parse_coperto_box(pdftotext(os.path.join(args.library, COPERTO_BOX)), reg, posteggi, issues)
    parse_coperto_panche(pdftotext(os.path.join(args.library, COPERTO_PANCHE)), reg, posteggi, issues)
    parse_imm_box(pdftotext(os.path.join(args.library, IMM_BOX)), reg, posteggi, issues)
    parse_imm_sett(pdftotext(os.path.join(args.library, IMM_SETT)), reg, posteggi, issues)

    issues.extend(reg.issues)
    espositori = reg.public()

    # posteggi multipli per espositore
    multi = Counter(p["espositoreId"] for p in posteggi if p["espositoreId"])
    multi = {k: v for k, v in multi.items() if v > 1}

    def dump(name, obj):
        with open(os.path.join(args.out, name), "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write("\n")

    meta = {"fonte": "Elenchi SUAP Comune di Maglie del 07/09/2026", "generato": "scripts/import-suap.py"}
    dump("mercati.json", {"_meta": meta, "mercati": MERCATI})
    dump("posteggi.json", {"_meta": meta, "posteggi": posteggi})
    dump("espositori.json", {"_meta": {**meta, "nota": "Solo campi pubblici. CF/P.IVA/indirizzi in espositori_riservati.json (non committato)."},
                             "espositori": espositori})
    dump("espositori_riservati.json", {"_meta": {**meta, "ATTENZIONE": "Dati personali (CF, P.IVA, indirizzi). Non committare, non pubblicare."},
                                       "espositori": list(reg.riservati.values())})

    # report
    lines = ["# Report import elenchi SUAP", "", f"Fonte: {meta['fonte']}. Generato da `{meta['generato']}`.", "",
             "## Conteggi", "", "| Elenco | Posteggi | Assegnati | Vacanti |", "|---|---|---|---|"]
    def row(label, sel):
        a = sum(1 for p in sel if p["stato"] == "assegnato"); v = sum(1 for p in sel if p["stato"] == "vacante")
        lines.append(f"| {label} | {len(sel)} | {a} | {v} |")
    for settore, cat, _ in AREA:
        row(f"Area Mercatale — settore {settore} ({cat})", [p for p in posteggi if p["mercato"] == "area-mercatale" and p["settore"] == settore])
    row("**Area Mercatale — totale**", [p for p in posteggi if p["mercato"] == "area-mercatale"])
    row("Coperto — box", [p for p in posteggi if p["mercato"] == "coperto" and p["settore"] == "box"])
    row("Coperto — panche", [p for p in posteggi if p["mercato"] == "coperto" and p["settore"] == "panche"])
    row("Ortofrutticolo — box", [p for p in posteggi if p["mercato"] == "ortofrutticolo" and p["settore"] == "box"])
    row("Ortofrutticolo — settimanale", [p for p in posteggi if p["mercato"] == "ortofrutticolo" and p["settore"] == "settimanale"])
    row("**Totale**", posteggi)
    lines += ["", f"Espositori distinti: **{len(espositori)}** (dedup per C.F. / P.IVA / nome).", ""]
    per_m = Counter()
    for e in espositori:
        for m_ in e["mercati"]: per_m[m_] += 1
    lines += [f"- {m_}: {n}" for m_, n in per_m.items()]
    lines += ["", "## Espositori con più posteggi", ""]
    for eid, n in sorted(multi.items(), key=lambda x: -x[1]):
        ps = [p["id"] for p in posteggi if p["espositoreId"] == eid]
        lines.append(f"- {eid}: {n} posteggi ({', '.join(ps)})")
    lines += ["", "## Anomalie da verificare", ""]
    lines += [f"- {i}" for i in issues] or ["- nessuna"]
    lines += ["", "## Da fare (Fase 0.3)", "",
              "- `mapId` è `null` per tutti i posteggi dell'area mercatale: manca la riconciliazione con P001–P251 della mappa v1 (serve il DWG o la mappatura manuale).",
              "- Mancano gli elenchi dei settori 'opere del proprio ingegno', 'prodotti vari' e 'vendita uova' presenti in legenda.",
              "- Giorni/orari/indirizzi ufficiali dei 3 mercati (vedi mercati.json)."]
    with open(os.path.join(args.out, "REPORT.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"posteggi: {len(posteggi)}  espositori: {len(espositori)}  anomalie: {len(issues)}")
    for i in issues:
        print(" -", i)

if __name__ == "__main__":
    main()
