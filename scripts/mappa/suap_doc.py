"""Genera docs/segnalazioni-suap/: ritagli, piantina annotata e HTML del documento per il SUAP."""
import json, math, os, base64, io
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
SP = os.path.dirname(os.path.abspath(__file__))
ROOT = '/Users/cipertre/Library/CloudStorage/Dropbox-3seizero/Carlo Contino Circolone/Lavoro/Progetti in Corso/Maglie/Comune di Maglie/Area Mercatale/mercatomaglie-site'
OUT = f'{ROOT}/docs/segnalazioni-suap'
os.makedirs(OUT, exist_ok=True)

stalls = {s['id']: s for s in json.load(open(f'{SP}/stalls.json'))}
quads = {q['idx']: q for q in json.load(open(f'{SP}/quads.json'))}
posteggi = {p['id']: p for p in json.load(open(f'{ROOT}/data/seed/posteggi.json'))['posteggi']}
espos = {e['id']: e for e in json.load(open(f'{ROOT}/data/seed/espositori.json'))['espositori']}
img600 = Image.open(f'{SP}/p600-1.png').convert('RGB'); S = 600/72
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 28)
fontS = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 20)

def upright_angle(pts):
    best = None
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i+1) % len(pts)]
        L = math.hypot(x2-x1, y2-y1); a = (math.degrees(math.atan2(y2-y1, x2-x1)) + 90) % 180 - 90
        if best is None or L > best[0]: best = (L, a)
    return 90 - best[1]

def crop(cx, cy, ang, w=420, h=300, R=320, marks=()):
    c = img600.crop((int(cx*S-R), int(cy*S-R), int(cx*S+R), int(cy*S+R)))
    d = ImageDraw.Draw(c)
    for (px, py, col) in marks:
        d.ellipse((px*S-(cx*S-R)-70, py*S-(cy*S-R)-70, px*S-(cx*S-R)+70, py*S-(cy*S-R)+70), outline=col, width=6)
    c = c.rotate(ang, resample=Image.BICUBIC, fillcolor='white').crop((R-w//2, R-h//2, R+w//2, R+h//2))
    return c

def b64(im, q=80):
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q); return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

def stall_crop(sid, marks_extra=()):
    s = stalls[sid]; ang = upright_angle(s['pts'])
    return crop(s['cx'], s['cy'], ang, marks=[(s['cx'], s['cy'], '#d00')] + list(marks_extra))

def elenco(sid):
    p = posteggi.get(sid)
    if not p: return None
    e = espos.get(p['espositoreId']) if p['espositoreId'] else None
    return {'fila': p['fila'], 'sup': p['superficie']['raw'] if p['superficie'] else '-', 'stato': p['stato'], 'esp': e['denominazione'] if e else 'VACANTE', 'ordine': p['ordineElenco']}

# --------- sezione A: posteggi
rows = []
def add(sid, tipo, piantina, elenco_txt, nota, im):
    rows.append({'id': sid, 'tipo': tipo, 'piantina': piantina, 'elenco': elenco_txt, 'nota': nota, 'img': b64(im)})

# A-47
add('A-47', 'Presente in piantina, assente in elenco', 'Settore A, fila 8, tra 46 e 48, etichetta 5x5',
    'Non compare nell\'Allegato 1 (fila 8: 44, 45, 46, 48, 49, 50)', 'È vacante? Va inserito in elenco o è stato soppresso?', stall_crop('A-47'))
s118 = stalls['A-118bis']
# superfici
for sid, pian in (('A-52', '8x5 (etichetta e misura vettoriale)'), ('A-63', '6x5'), ('A-139', '8x5'), ('A-163', '6x5'), ('A-140', '5x5'), ('A-164', '6x5'),
                  ('A-142', '8x4'), ('C-8', '8x5'), ('C-9', '8x5')):
    e = elenco(sid)
    add(sid, 'Superficie diversa', f'{pian}', f'{e["sup"]} (fila {e["fila"]}, n. {e["ordine"]}, {e["esp"]})',
        'Quale vale? La piantina è del 2017, l\'elenco del 2026.', stall_crop(sid))

# --------- sezione B: settori senza elenco (PV, uova)
extra_imgs = {}
pv = json.load(open(f'{ROOT}/data/seed/posteggi-mappa.json'))['posteggi']
# ritaglio zona tensostruttura: centro tra PV-1..3 nel CAD (pt): usa coordinate note
extra_imgs['pv'] = b64(crop(790, 300, 90 - (-46), w=520, h=380, R=420, marks=[(758, 268, '#d00'), (770, 280, '#d00'), (830, 322, '#d00')]))
extra_imgs['uova'] = b64(crop(933, 348, 44, w=420, h=300, R=320, marks=[(933, 348, '#d00')]))

# --------- piantina annotata (100 dpi, copia)
pl = Image.open(f'{SP}/piantina100-1.png').convert('RGB'); k = 100/72
d = ImageDraw.Draw(pl)
def mark(x, y, label, col='#d00'):
    d.ellipse((x*k-22, y*k-22, x*k+22, y*k+22), outline=col, width=4)
    tw = d.textlength(label, font=fontS)
    d.rectangle((x*k+24, y*k-14, x*k+30+tw, y*k+12), fill='white', outline=col)
    d.text((x*k+27, y*k-12), label, fill=col, font=fontS)
for r in rows:
    mark(stalls[r['id']]['cx'], stalls[r['id']]['cy'], r['id'])
mark(775, 285, 'PV 1-2', '#080'); mark(830, 322, 'PV 3', '#080'); mark(933, 348, 'UOVA', '#080')
d.text((40, 1120), 'Rosso: posteggi con incongruenza (vedi tabella). Verde: posteggi senza elenco SUAP.', fill='black', font=font)
pl.save(f'{OUT}/piantina-annotata.png')
pl_b64 = b64(pl, 85)

# --------- HTML
def esc(t): return str(t).replace('&', '&amp;').replace('<', '&lt;')
trs = ''.join(f'''<tr><td class="id">{esc(r["id"])}<div class="tipo">{esc(r["tipo"])}</div></td>
<td><img src="{r["img"]}"></td><td>{esc(r["piantina"])}</td><td>{esc(r["elenco"])}</td><td>{esc(r["nota"])}</td><td class="chk"></td></tr>''' for r in rows)
html = f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Segnalazioni SUAP - Area Mercatale Maglie</title>
<style>
@page {{ size: A4; margin: 14mm 12mm 16mm 12mm; }}
@page annex {{ size: A4 landscape; margin: 10mm; }}
body {{ font-family: Helvetica, Arial, sans-serif; font-size: 10.5pt; color: #222; }}
h1 {{ font-size: 17pt; margin: 0 0 2mm; }} h2 {{ font-size: 13pt; margin: 8mm 0 3mm; border-bottom: 1.5px solid #c8862a; padding-bottom: 1mm; }}
.sub {{ color: #555; margin-bottom: 5mm; }}
table {{ border-collapse: collapse; width: 100%; }} th, td {{ border: 1px solid #bbb; padding: 4px 6px; vertical-align: top; text-align: left; }}
th {{ background: #f5f0e8; font-size: 9.5pt; }} td {{ font-size: 9.5pt; }}
td.id {{ font-weight: bold; white-space: nowrap; }} .tipo {{ font-weight: normal; color: #a04020; font-size: 8.5pt; white-space: normal; }}
td img {{ width: 42mm; height: auto; display: block; }} td.chk {{ width: 22mm; }}
tr {{ page-break-inside: avoid; }}
ul {{ margin: 2mm 0 0 5mm; padding: 0; }} li {{ margin-bottom: 1.5mm; }}
.box {{ border: 1px solid #bbb; padding: 3mm; margin-top: 3mm; page-break-inside: avoid; }}
.box img {{ width: 60mm; float: right; margin-left: 4mm; }}
.land {{ page: annex; page-break-before: always; }} .land img {{ height: 160mm; width: auto; display: block; margin: 0 auto; }} .land h2 {{ margin-top: 0; }}
.small {{ font-size: 8.5pt; color: #555; }}
</style></head><body>
<h1>Area Mercatale di Maglie — segnalazioni e chiarimenti per il SUAP</h1>
<div class="sub">Confronto tra gli <b>elenchi posteggi SUAP del 07/09/2026</b> (Allegati 1–5, box e panche del Mercato Coperto, box e mercato settimanale di Piazza Immacolata) e la <b>piantina «Nuova Area Mercatale — individuazione postazioni e settori merceologici» del 02/01/2017</b>.<br>
Preparato da 3seizero per la web app dei mercati, {__import__('datetime').date.today().strftime('%d/%m/%Y')}. L'ultima colonna è per le annotazioni durante l'incontro.</div>

<h2>A. Posteggi dell'area mercatale</h2>
<div class="small">Il ritaglio mostra il posteggio nella piantina (cerchiato in rosso). Le misure «vettoriali» sono prese dal disegno CAD alla scala della tavola (verificata: 9x5 in etichetta = 9x5 m disegnati).</div>
<table><thead><tr><th>Posteggio</th><th>Piantina</th><th>Cosa dice la piantina (2017)</th><th>Cosa dice l'elenco (2026)</th><th>Domanda</th><th>Risposta SUAP</th></tr></thead>
<tbody>{trs}</tbody></table>
<div class="small" style="margin-top:2mm">Nota: i posteggi di fine fila (es. 131, 135, 136, 138, B-4, E-9, E-22) sono trapezoidali; il lato lungo disegnato è maggiore di quello in elenco, non è un'incongruenza.</div>

<h2>B. Settori presenti in piantina senza elenco</h2>
<div class="box"><img src="{extra_imgs['pv']}"><b>Tre posteggi a contorno nero dietro la tensostruttura</b> (n. 1 e 2 con etichetta 6x5, n. 3 con etichetta 10x10). In legenda il nero corrisponde ad «Attività espositiva prodotti vari». Non c'è un elenco SUAP per questo settore.<br><br>Domande: sono ancora attivi? Chi li occupa? Esiste un elenco? Le misure reali sono quelle dell'etichetta o quelle disegnate (circa 4,5x3,8 e 6,7x6,7)?<div style="clear:both"></div></div>
<div class="box"><img src="{extra_imgs['uova']}"><b>Posteggio temporaneo vendita uova</b> (cerchio magenta accanto alla fila 23). Non c'è un elenco SUAP.<br><br>Domande: è ancora previsto? Chi lo occupa e in quali giornate?<div style="clear:both"></div></div>
<div class="box"><b>Opere del proprio ingegno</b>: in legenda c'è il colore, ma nella tavola non risultano posteggi con quel colore e non c'è un elenco. Sono previsti posteggi per questo settore? Dove?</div>

<h2>C. Dati anagrafici da verificare negli elenchi</h2>
<ul>
<li><b>Allegato 1 (settore A), n. 135, Antonaci Luigi, posteggio 83:</b> il codice fiscale riportato ha 15 caratteri («NTNGU95S07D862L»), manca una lettera.</li>
<li><b>Allegato 4 (settore D), n. 41, Nocera Gian Carlo, posteggio 44:</b> la partita IVA riportata ha 12 cifre («049434440752»), una di troppo.</li>
<li><b>Mercato Coperto, box n. 15, Adriatica Società Cooperativa:</b> codice fiscale e partita IVA riportati con 10 cifre («0144280757»), manca una cifra.</li>
<li><b>Box Piazza Immacolata, riga n. 7:</b> risulta «VACANTE» ma senza numero di box o banco. A cosa si riferisce?</li>
<li><b>Allegato 1, n. 10, Notaro Cesario Antonio:</b> la denominazione è scritta «NOTARO CESARI ANTONIO» (probabile refuso).</li>
</ul>

<h2>D. Informazioni necessarie per la web app</h2>
<ul>
<li><b>Giorni, orari e indirizzo ufficiali</b> dei tre mercati: Area Mercatale, Mercato Coperto «Centro» (Piazza Mercato), Mercato ortofrutticolo. Per quest'ultimo l'offerta approvata cita «Via Toma Nuzzichi nei giorni feriali», gli elenchi «Piazza Immacolata, mercato settimanale del sabato»: quale vale?</li>
<li><b>La piantina del 2017 è ancora quella vigente?</b> Esistono modifiche successive (nuovi posteggi, soppressioni, rinumerazioni)? È disponibile il file <b>DWG/DXF</b> originale dell'ufficio tecnico?</li>
<li><b>Mercato Coperto</b>: il box n. 17 risulta «operatori vari – vendita settimanale carni»: chi sono gli operatori e in quale giorno?</li>
<li><b>Panche Mercato Coperto</b>: gli assegnatari sono produttori agricoli senza partita IVA in elenco: hanno una denominazione da usare al pubblico?</li>
<li><b>Contatti degli espositori</b> (WhatsApp/Telegram, alias): non sono negli elenchi. Il SUAP può raccoglierli alla registrazione, con consenso alla pubblicazione? Serve l'informativa privacy.</li>
<li><b>Registrazione degli occasionali</b>: conferma della procedura (registrazione preventiva al SUAP con rilascio del QR) e dell'ufficio/operatore che farà i controlli il sabato.</li>
</ul>

<div class="land"><h2>Allegato — piantina con i punti segnalati</h2>
<img src="{pl_b64}"></div>
</body></html>'''
open(f'{OUT}/segnalazioni-suap.html', 'w', encoding='utf-8').write(html)
print('html ok', len(rows), 'righe')
