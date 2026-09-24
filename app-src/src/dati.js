// Livello dati v3: anagrafiche dal bundle (fallback) e dai riassunti pubblico/{mercato} (live),
// presenze del giorno (stato/{mercato}), impostazioni e calendario per mercato, login e ruoli.
// L'indice è l'espositore: ogni espositore ha `posteggi[]`; il posteggio non conosce l'assegnatario.
import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, onSnapshot, runTransaction, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth, firebaseReady } from "./firebase.js";
import { POSTAZIONI_MAPPA, GEO, PLANIMETRIA_URI, SVG_VIEWBOX, SVG_W, SVG_H } from "./data/mappa.js";
import { MERCATI, POSTEGGI, ESPOSITORI, SETTORI } from "./data/seed.js";

export { MERCATI, POSTEGGI, ESPOSITORI, SETTORI, POSTAZIONI_MAPPA, GEO, PLANIMETRIA_URI, SVG_VIEWBOX, SVG_W, SVG_H };

// ---------------------------------------------------------------- utilità
export const isoData = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const oggi = () => isoData(new Date());
export const docId = (id) => String(id).replace(/\//g, "_");        // "A-55/56" -> "A-55_56"
const minuti = (hhmm) => { const [h, m] = String(hhmm || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
const adesso = (now) => now.getHours() * 60 + now.getMinutes();
export const oraLocale = (d = new Date()) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const ESP_BY_ID = Object.fromEntries(ESPOSITORI.map((e) => [e.id, e]));
const POST_BY_ID = Object.fromEntries(POSTEGGI.map((p) => [p.id, p]));
// assegnazioni del bundle: posteggio -> espositore (fissi)
const BUNDLE_ASSEGN = {};
for (const e of ESPOSITORI) if (e.tipo !== "spuntista" && e.attivo !== false) for (const pid of e.posteggi || []) BUNDLE_ASSEGN[pid] = e.id;

export const espositoreById = (id) => ESP_BY_ID[id] || null;
export const posteggioById = (id) => POST_BY_ID[id] || null;
export const nomePubblico = (e) => (e ? (e.riservato ? "Espositore" : (e.alias && e.alias.trim()) || e.denominazione || "") : "");

// ---------------------------------------------------------------- impostazioni per mercato
export const IMPOSTAZIONI_DEFAULT = {
  "area-mercatale": { registroPresenze: true, oraLimiteSpunta: "10:00", oraAzzeramento: "14:00", assenzeMassime: 20 },
  coperto: { registroPresenze: false, oraLimiteSpunta: "10:00", oraAzzeramento: "14:00", assenzeMassime: 20 },
  ortofrutticolo: { registroPresenze: false, oraLimiteSpunta: "10:00", oraAzzeramento: "14:00", assenzeMassime: 20 },
};
export function useImpostazioni() {
  const [imp, setImp] = useState(IMPOSTAZIONI_DEFAULT);
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubs = MERCATI.map((m) => onSnapshot(doc(db, "impostazioni", m.id), (snap) => {
      const d = snap.data(); if (!d) return;
      setImp((prev) => ({ ...prev, [m.id]: { ...IMPOSTAZIONI_DEFAULT[m.id], ...d } }));
    }, () => {}));
    return () => unsubs.forEach((u) => u());
  }, []);
  return imp;
}

// ---------------------------------------------------------------- calendario (giornate spostate, soppresse, straordinarie)
export function useCalendario() {
  const [cal, setCal] = useState([]);
  useEffect(() => {
    if (!firebaseReady) return;
    return onSnapshot(collection(db, "calendario"), (snap) => setCal(snap.docs.map((d) => ({ _id: d.id, ...d.data() }))), () => {});
  }, []);
  return cal;
}
/** Voce di calendario che riguarda un mercato in una data (data originale o nuova). */
export const voceCalendario = (cal, mercatoId, iso) => (cal || []).find((c) => c.mercato === mercatoId && (c.data === iso || (c.tipo === "spostato" && c.dataNuova === iso))) || null;
/** Quel giorno il mercato si svolge? Tiene conto di giorni della settimana e calendario. */
export function giornoDiMercato(m, cal, date = new Date()) {
  if (!m || !m.giorniSettimana) return true;
  const iso = isoData(date);
  const v = voceCalendario(cal, m.id, iso);
  if (v) {
    if (v.tipo === "soppresso") return false;
    if (v.tipo === "straordinario") return true;
    if (v.tipo === "spostato") return v.dataNuova === iso;   // il giorno originale non si svolge, quello nuovo sì
  }
  return m.giorniSettimana.includes(date.getDay());
}
/** Il mercato è aperto adesso? */
export function mercatoAperto(m, now = new Date(), cal = []) {
  if (!m || !m.giorniSettimana || !m.apertura || !m.chiusura) return true;
  if (!giornoDiMercato(m, cal, now)) return false;
  const hm = adesso(now);
  return hm >= minuti(m.apertura) && hm < minuti(m.chiusura);
}
const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
/** Testo della prossima apertura: "sabato alle 7:00" / "domani alle 7:00" / "oggi alle 7:00" */
export function prossimaApertura(m, now = new Date(), cal = []) {
  if (!m || !m.giorniSettimana) return "";
  for (let d = 0; d < 15; d++) {
    const dt = new Date(now); dt.setDate(now.getDate() + d);
    if (!giornoDiMercato(m, cal, dt)) continue;
    if (d === 0 && adesso(now) >= minuti(m.apertura)) continue;
    const ora = m.apertura.replace(/^0/, "");
    return (d === 0 ? "oggi alle " : d === 1 ? "domani alle " : GIORNI[dt.getDay()] + " alle ") + ora;
  }
  return "";
}
const dataIt = (iso) => { const [y, mo, d] = iso.split("-").map(Number); const dt = new Date(y, mo - 1, d); return `${GIORNI[dt.getDay()]} ${d}/${String(mo).padStart(2, "0")}`; };
/** Avvisi da mostrare nell'app: voci di calendario dei prossimi 8 giorni (o di oggi). */
export function avvisiCalendario(cal, mercatoId, now = new Date()) {
  const da = isoData(now); const lim = new Date(now); lim.setDate(now.getDate() + 8); const a = isoData(lim);
  return (cal || []).filter((c) => c.mercato === mercatoId && [c.data, c.dataNuova].some((x) => x && x >= da && x <= a)).map((c) => {
    if (c.avviso) return c.avviso;
    if (c.tipo === "soppresso") return `${dataIt(c.data)}: il mercato non si svolge${c.motivo ? ` (${c.motivo})` : ""}.`;
    if (c.tipo === "spostato") return `Il mercato di ${dataIt(c.data)} è spostato a ${dataIt(c.dataNuova)}${c.motivo ? ` (${c.motivo})` : ""}.`;
    if (c.tipo === "straordinario") return `Apertura straordinaria ${dataIt(c.data)}${c.motivo ? ` (${c.motivo})` : ""}.`;
    return "";
  }).filter(Boolean);
}

/** Mercati: dati del bundle sovrascritti da Firestore mercati/{id}. */
export function useMercati() {
  const [mercati, setMercati] = useState(MERCATI);
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubs = MERCATI.map((m) => onSnapshot(doc(db, "mercati", m.id), (snap) => {
      const d = snap.data(); if (!d) return;
      setMercati((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...d } : x)));
    }, () => {}));
    return () => unsubs.forEach((u) => u());
  }, []);
  return mercati;
}
/** Stato apertura di tutti i mercati (si aggiorna ogni minuto). */
export function useAperture(mercati = MERCATI, cal = []) {
  const calc = () => Object.fromEntries(mercati.map((m) => [m.id, mercatoAperto(m, new Date(), cal)]));
  const [ap, setAp] = useState(calc);
  useEffect(() => { setAp(calc()); const t = setInterval(() => setAp(calc()), 60000); return () => clearInterval(t); }, [mercati, cal]); // eslint-disable-line react-hooks/exhaustive-deps
  return ap;
}

// ---------------------------------------------------------------- presenze del giorno
/** { [espositoreId]: {posteggioId, ora, metodo, da, tipo, mercato} } — vuoto dopo l'ora di azzeramento. */
export function usePresenze(impostazioni = IMPOSTAZIONI_DEFAULT) {
  const [raw, setRaw] = useState({});
  const [online, setOnline] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 60000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubs = MERCATI.map((m) =>
      onSnapshot(doc(db, "stato", m.id), (snap) => {
        setOnline(true);
        const d = snap.data();
        setRaw((prev) => ({ ...prev, [m.id]: d && d.data === oggi() ? d.presenti || {} : {} }));
      }, () => setOnline(false))
    );
    return () => unsubs.forEach((u) => u());
  }, []);
  const presenze = {};
  const hm = adesso(new Date()); void tick;
  for (const m of MERCATI) {
    const imp = impostazioni[m.id] || IMPOSTAZIONI_DEFAULT[m.id];
    if (imp && imp.oraAzzeramento && hm >= minuti(imp.oraAzzeramento)) continue;   // dopo l'azzeramento tutti assenti
    for (const [eid, v] of Object.entries(raw[m.id] || {})) presenze[eid] = { ...v, mercato: m.id };
  }
  return { presenze, online };
}

/** Riassunti pubblico/{mercato}: { espositori:{id:{…}}, posteggi:{id:{espositoreId,stato,note}} } */
export function usePubblico() {
  const [live, setLive] = useState(null);
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubs = MERCATI.map((m) =>
      onSnapshot(doc(db, "pubblico", m.id), (snap) => {
        const d = snap.data(); if (!d) return;
        setLive((prev) => ({ espositori: { ...(prev?.espositori || {}), ...(d.espositori || {}) }, posteggi: { ...(prev?.posteggi || {}), ...(d.posteggi || {}) }, mercati: { ...(prev?.mercati || {}), [m.id]: true } }));
      }, () => {})
    );
    return () => unsubs.forEach((u) => u());
  }, []);
  return live;
}

/** Richiesta self-service (dal link QR): finisce in richieste/, approvata dal SUAP. */
export async function inviaRichiesta({ token, espositoreId, alias, referente, whatsapp, telegram, descrizione }) {
  if (!firebaseReady) throw new Error("Backend non configurato");
  await addDoc(collection(db, "richieste"), {
    token, espositoreId, alias: alias || "", referente: referente || "", whatsapp: whatsapp || "", telegram: telegram || "", descrizione: descrizione || "",
    consenso: true, creato: serverTimestamp(), stato: "in-attesa",
  });
}
/** Risolve un token QR: { espositoreId, attivo } oppure null. */
export async function lookupQr(token) {
  if (!firebaseReady || !token) return null;
  const snap = await getDoc(doc(db, "qr", token));
  return snap.exists() ? snap.data() : null;
}

/** Registra (o annulla) una presenza certificata. Solo staff: le regole Firestore lo impongono.
 *  Scrive la vista del giorno stato/{mercato} e il record presenze/{data}_{mercato}_{esp}. */
export async function setPresenza({ mercatoId, espositoreId, posteggioId, presente, operatore, metodo = "elenco", posizione = null, tipo = "fisso" }) {
  if (!firebaseReady) throw new Error("Firebase non configurato");
  const giorno = oggi();
  const op = operatore ? { uid: operatore.uid || null, nome: operatore.nome || "", cognome: operatore.cognome || "", email: operatore.email || null } : null;
  const ref = doc(db, "stato", mercatoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() && snap.data().data === giorno ? snap.data().presenti || {} : {};
    const presenti = { ...cur };
    if (presente) {
      for (const [k, v] of Object.entries(presenti)) if (v.tipo === "spuntista" && v.posteggioId === posteggioId && k !== espositoreId && tipo === "spuntista") throw new Error("Posteggio già occupato oggi da un altro spuntista");
      presenti[espositoreId] = { posteggioId: posteggioId || null, ora: oraLocale(), metodo, da: op, tipo };
    } else delete presenti[espositoreId];
    tx.set(ref, { data: giorno, presenti, aggiornato: serverTimestamp() });
  });
  const pref = doc(db, "presenze", `${giorno}_${mercatoId}_${docId(espositoreId)}`);
  if (presente) {
    await setDoc(pref, { data: giorno, mercato: mercatoId, espositoreId, tipoEspositore: tipo, posteggioId: posteggioId || null, metodo, operatore: op, posizione, oraLocale: oraLocale(), ora: serverTimestamp(), annullata: false });
  } else {
    await setDoc(pref, { data: giorno, mercato: mercatoId, espositoreId, annullata: true, annullataDa: op, annullataOra: serverTimestamp(), annullataOraLocale: oraLocale() }, { merge: true });
  }
}

/** Utente Firebase, ruolo e anagrafica staff (staff/{uid}: role, nome, cognome, telefono). */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profilo, setProfilo] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  useEffect(() => {
    if (!firebaseReady) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        let p = null;
        try { const sd = await getDoc(doc(db, "staff", u.uid)); p = sd.exists() ? sd.data() : null; } catch { p = null; }
        if (!p || !p.role) { try { const t = await u.getIdTokenResult(true); if (t.claims.role) p = { ...(p || {}), role: t.claims.role }; } catch { /* nessun claim */ } }
        setProfilo(p ? { uid: u.uid, email: u.email, ...p } : null);
      } else setProfilo(null);
      setLoading(false);
    });
  }, []);
  const login = useCallback(async (email, password) => {
    if (!firebaseReady) throw new Error("Firebase non configurato");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);
  const logout = useCallback(() => (firebaseReady ? signOut(auth) : Promise.resolve()), []);
  const role = profilo && profilo.attivo !== false ? profilo.role || null : null;
  const isStaff = ["admin", "operatore", "suap"].includes(role);
  const puoRegistrare = role === "admin" || role === "operatore";   // le presenze le certificano solo gli operatori di controllo
  const operatore = user ? { uid: user.uid, email: user.email, nome: profilo?.nome || "", cognome: profilo?.cognome || "" } : null;
  const nomeOperatore = operatore ? [operatore.nome, operatore.cognome].filter(Boolean).join(" ") || operatore.email : "";
  return { user, role, profilo, operatore, nomeOperatore, isStaff, puoRegistrare, isAdmin: role === "admin", isSuap: role === "admin" || role === "suap", loading, login, logout };
}

// ---------------------------------------------------------------- costruzione viste
const liveEsp = (id, live) => (id ? ((live && live.espositori[id]) || ESP_BY_ID[id] || null) : null);
/** Campi pubblici di un espositore, rispettando la privacy (riservato: niente nome, contatti, descrizione). */
function pubblica(e) {
  if (!e) return null;
  if (e.riservato || e.visibile === false) return { id: e.id, tipo: e.tipo || "fisso", riservato: true, nome: "Espositore", titolare: "", whatsapp: "", telegram: "", descrizione: "", foto: null, denominazione: "", categoria: e.categoria || "" };
  return { id: e.id, tipo: e.tipo || "fisso", riservato: false, nome: nomePubblico(e), titolare: e.referente || "", whatsapp: e.whatsapp || "", telegram: e.telegram || "", descrizione: e.descrizione || "", foto: e.foto || null, denominazione: e.denominazione || "", categoria: e.categoria || "" };
}
const assegnatario = (pid, live) => (live && live.posteggi[pid] ? live.posteggi[pid].espositoreId || null : BUNDLE_ASSEGN[pid] || null);
/** Spuntista presente oggi su quel posteggio (se c'è). */
const spuntistaSu = (pid, presenze) => Object.entries(presenze).find(([, v]) => v.tipo === "spuntista" && v.posteggioId === pid)?.[0] || null;

/** Postazioni dell'area mercatale per la mappa: geometria + espositore (fisso o spuntista del giorno) + presenza. */
export function buildPostazioni(presenze, live) {
  return POSTAZIONI_MAPPA.map((g) => {
    const p = POST_BY_ID[g.id] || null;
    const fissoId = assegnatario(g.id, live);
    const spId = spuntistaSu(g.id, presenze);
    const e = pubblica(liveEsp(spId || fissoId, live));
    const presente = !!(e && presenze[e.id]);
    const pres = e ? presenze[e.id] : null;
    return {
      id: g.id, shape: "poly", points: g.points, cx: g.cx, cy: g.cy, lat: g.lat, lon: g.lon,
      settore: g.settore, numero: g.numero, fila: p ? p.fila : null,
      postazione: `${g.settore} ${g.numero}`,
      etichetta: p ? p.etichetta : `Settore ${g.settore} · n. ${g.numero}`,
      espositoreId: e ? e.id : null, fissoId, spuntista: !!spId,
      nome: e ? e.nome : "", titolare: e ? e.titolare : "", riservato: !!(e && e.riservato), tipo: e ? e.tipo : null,
      categoria: spId ? (e.categoria || "Spuntista") : (SETTORI[g.settore] || g.settore),
      whatsapp: e ? e.whatsapp : "", telegram: e ? e.telegram : "", descrizione: e ? e.descrizione : "", foto: e ? e.foto : null, denominazione: e ? e.denominazione : "",
      presente, oraPresenza: pres ? pres.ora : null,
      inElenco: g.inElenco, note: live && live.posteggi[g.id] ? live.posteggi[g.id].note || "" : "",
    };
  });
}

/** Elenco per Coperto / Ortofrutticolo: posteggi del mercato con espositore. */
export function buildElenco(mercatoId, presenze, live) {
  return POSTEGGI.filter((p) => p.mercato === mercatoId).map((p) => {
    const eid = assegnatario(p.id, live);
    const e = pubblica(liveEsp(eid, live));
    return {
      id: p.id, etichetta: p.etichetta, numero: p.numero, tipo: p.tipo, settore: p.settore,
      nome: e ? e.nome : "", titolare: e ? e.titolare : "", categoria: e ? e.categoria || p.articolo || "" : (p.articolo || ""),
      whatsapp: e ? e.whatsapp : "", telegram: e ? e.telegram : "", descrizione: e ? e.descrizione : "", foto: e ? e.foto : null, denominazione: e ? e.denominazione : "",
      riservato: !!(e && e.riservato), note: live && live.posteggi[p.id] ? live.posteggi[p.id].note || "" : "", stato: eid ? "assegnato" : "vacante",
      espositoreId: e ? e.id : null, presente: !!(e && presenze[e.id]),
    };
  });
}

/** Spuntisti dell'anno (area mercatale): denominazione, presenza e posteggio di oggi. */
export function buildSpuntisti(presenze, live) {
  const g = oggi();
  const fonte = live ? Object.values(live.espositori) : ESPOSITORI;
  const visti = new Set();
  const out = [];
  for (const e of [...fonte, ...ESPOSITORI]) {
    if (!e || e.tipo !== "spuntista" || visti.has(e.id)) continue;
    visti.add(e.id);
    if (e.attivo === false) continue;
    if (e.scadenza && e.scadenza < g) continue;
    const pub = pubblica(e);
    const pres = presenze[e.id] || null;
    out.push({ id: e.id, nome: pub.nome, riservato: pub.riservato, categoria: e.categoria || "Spuntista", titolare: pub.titolare, whatsapp: pub.whatsapp, telegram: pub.telegram, descrizione: pub.descrizione, presente: !!pres, posteggioId: pres ? pres.posteggioId : null, oraPresenza: pres ? pres.ora : null, scadenza: e.scadenza || null });
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome));
}

/** Posteggi dell'area mercatale assegnabili a uno spuntista adesso: vacanti, oppure di un fisso non presentato entro l'ora limite. */
export function posteggiPerSpuntisti(postazioni, impostazioni, now = new Date()) {
  const imp = impostazioni["area-mercatale"] || IMPOSTAZIONI_DEFAULT["area-mercatale"];
  const dopoLimite = adesso(now) >= minuti(imp.oraLimiteSpunta || "10:00");
  return postazioni.filter((p) => {
    if (p.spuntista) return false;                       // già occupato oggi da uno spuntista
    if (!p.fissoId) return true;                         // vacante
    return dopoLimite && !p.presente;                    // fisso assente dopo l'ora limite
  }).map((p) => ({ id: p.id, etichetta: p.etichetta, postazione: p.postazione, settore: p.settore, motivo: p.fissoId ? `assente: ${p.nome || "titolare"}` : "libero" }));
}
/** Dopo l'ora limite di spunta il fisso che non si è presentato risulta assente: non è più registrabile. */
export const dopoOraLimite = (impostazioni, mercatoId = "area-mercatale", now = new Date()) => {
  const imp = impostazioni[mercatoId] || IMPOSTAZIONI_DEFAULT[mercatoId] || {};
  return adesso(now) >= minuti(imp.oraLimiteSpunta || "10:00");
};
