// Accesso a Firestore/Auth per il pannello di gestione (modello v3: l'indice è l'espositore).
import { useEffect, useState, useCallback } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  collection, doc, onSnapshot, setDoc, updateDoc, getDoc, getDocs, query, where, serverTimestamp, writeBatch, deleteField, deleteDoc, arrayRemove,
} from "firebase/firestore";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail, createUserWithEmailAndPassword,
} from "firebase/auth";
import { db, auth, app, firebaseReady, storage, FOTO_ABILITATE } from "./firebase.js";
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export { firebaseReady, FOTO_ABILITATE };
export const MERCATI = [
  { id: "area-mercatale", nome: "Area Mercatale" },
  { id: "coperto", nome: "Mercato Coperto Centro" },
  { id: "ortofrutticolo", nome: "Mercato Ortofrutticolo" },
];
export const SETTORI = { A: "Abbigliamento", B: "Abbigliamento usato", C: "Alimentare", D: "Calzature", E: "Casalinghi e fiori", PV: "Altre attività", UOVA: "Altre attività", ALTRE: "Altre attività", box: "Box", panche: "Panche", settimanale: "Settimanale" };
export const TIPI = [["fisso", "Fisso (concessione di posteggio)"], ["spuntista", "Spuntista (elenco annuale)"]];
export const QUALIFICHE = ["concessionario", "produttore", "operatori-vari", "produttore-agricolo", "coltivatore-diretto", "opere-ingegno"];
export const RUOLI = ["admin", "suap", "operatore"];
export const IMPOSTAZIONI_DEFAULT = { registroPresenze: true, oraLimiteSpunta: "10:00", oraAzzeramento: "14:00", assenzeMassime: 18, inizioRegistro: "2026-09-26" };   // assenze CONSECUTIVE massime; le giornate prima di inizioRegistro non contano
export const SCADENZA_FISSI = "2040-12-31";
export const TIPI_CALENDARIO = [["soppresso", "Soppresso (non si svolge)"], ["spostato", "Spostato ad altra data"], ["straordinario", "Apertura straordinaria"]];
// STESSA LOGICA di scripts/firebase/pubblico.mjs
const PUB = ["id", "tipo", "denominazione", "alias", "referente", "categoria", "mercati", "settori", "whatsapp", "telegram", "descrizione", "foto", "posteggi", "scadenza"];

export const slugify = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const docId = (id) => String(id).replace(/\//g, "_");
export const oggi = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const nomePub = (e) => (e ? (e.alias && e.alias.trim()) || e.denominazione || e.id : "");
export const scaduto = (e) => !!(e && e.scadenza && e.scadenza < oggi());

/** Utente, ruolo e anagrafica (documento staff/{uid}, con fallback ai custom claims). */
export function useAdminAuth() {
  const [user, setUser] = useState(null);
  const [profilo, setProfilo] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  useEffect(() => {
    if (!firebaseReady) { setLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      let p = null;
      if (u) {
        try { const sd = await getDoc(doc(db, "staff", u.uid)); p = sd.exists() ? sd.data() : null; } catch { p = null; }
        if (!p || !p.role) { try { const t = await u.getIdTokenResult(); if (t.claims.role) p = { ...(p || {}), role: t.claims.role }; } catch { /* nessun claim */ } }
      }
      setProfilo(p); setLoading(false);
    });
  }, []);
  const login = useCallback((email, pw) => signInWithEmailAndPassword(auth, email.trim(), pw), []);
  const logout = useCallback(() => signOut(auth), []);
  const cambiaPassword = useCallback(async (attuale, nuova) => {
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, attuale));
    await updatePassword(u, nuova);
    await setDoc(doc(db, "staff", u.uid), { cambioPassword: false, _aggiornato: serverTimestamp() }, { merge: true });
    setProfilo((p) => (p ? { ...p, cambioPassword: false } : p));
  }, []);
  const role = profilo && profilo.attivo !== false ? profilo.role || null : null;
  const nome = profilo ? [profilo.nome, profilo.cognome].filter(Boolean).join(" ") : "";
  return { user, role, profilo, nome, loading, login, logout, cambiaPassword, deveCambiarePassword: !!(profilo && profilo.cambioPassword), isAdmin: role === "admin", isSuap: role === "admin" || role === "suap" };
}

/** Collezione in tempo reale (array di documenti). */
export function useCollection(name, enabled = true) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!firebaseReady || !enabled) return;
    return onSnapshot(collection(db, name), (snap) => { setRows(snap.docs.map((d) => ({ _id: d.id, ...d.data() }))); setError(null); setLoaded(true); }, (e) => setError(e.message));
  }, [name, enabled]);
  return { rows, error, loaded };
}
/** Documento singolo in tempo reale. */
export function useDocumento(coll, id, enabled = true) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!firebaseReady || !enabled || !id) return;
    return onSnapshot(doc(db, coll, id), (snap) => setData(snap.exists() ? { _id: snap.id, ...snap.data() } : null), () => {});
  }, [coll, id, enabled]);
  return data;
}

/** Riassunti pubblico/{mercato} per l'app pubblica, ricalcolati da espositori (con posteggi[]) e posteggi. */
export function costruisciPubblico(espositori, posteggi) {
  const out = {};
  for (const m of MERCATI) {
    const P = {};
    for (const p of posteggi.filter((p) => p.mercato === m.id)) P[p.id] = { espositoreId: null, stato: "vacante", note: p.note || null };
    const E = {};
    for (const e of espositori) {
      if (e.attivo === false) continue;
      const tipo = e.tipo === "spuntista" ? "spuntista" : "fisso";
      const inMercato = tipo === "fisso" ? (e.posteggi || []).some((pid) => P[pid]) : (e.mercati || ["area-mercatale"]).includes(m.id);
      if (!inMercato) continue;
      if (tipo === "fisso") for (const pid of e.posteggi || []) if (P[pid]) { P[pid].espositoreId = e.id; P[pid].stato = "assegnato"; }
      if (e.visibile === false) {
        E[e.id] = { id: e.id, tipo, riservato: true, categoria: e.categoria || null, settori: e.settori || [], posteggi: tipo === "fisso" ? (e.posteggi || []).filter((pid) => P[pid]) : [], scadenza: e.scadenza || null };
      } else {
        E[e.id] = { tipo };
        for (const k of PUB) if (e[k] !== undefined && e[k] !== null) E[e.id][k] = e[k];
        if (tipo === "fisso") E[e.id].posteggi = (e.posteggi || []).filter((pid) => P[pid]);
      }
    }
    out[m.id] = { mercato: m.id, espositori: E, posteggi: P };
  }
  return out;
}
export async function rebuildPubblico(espositori, posteggi) {
  const batch = writeBatch(db);
  for (const [m, d] of Object.entries(costruisciPubblico(espositori, posteggi))) batch.set(doc(db, "pubblico", m), { ...d, aggiornato: serverTimestamp() });
  await batch.commit();
}

const clean = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));

/** Salva la scheda (pubblica + riservata). `pub` contiene anche tipo, qualifica, visibile, scadenza, email, attivo. */
export async function salvaEspositore(id, pub, ris, canRis) {
  const b = writeBatch(db);
  const p = clean(pub);
  if (p.scadenza === "") p.scadenza = null;
  b.set(doc(db, "espositori", docId(id)), { ...p, id, _aggiornato: serverTimestamp() }, { merge: true });
  if (canRis && ris) b.set(doc(db, "espositori_riservati", docId(id)), { ...clean(ris), id, _aggiornato: serverTimestamp() }, { merge: true });
  await b.commit();
}
export async function nuovoEspositore(pub, ris, canRis, esistenti) {
  const base = slugify(pub.referente || pub.denominazione) || "espositore";
  let id = base, n = 1;
  const ids = new Set(esistenti.map((e) => e.id));
  while (ids.has(id)) { n += 1; id = `${base}-${n}`; }
  await salvaEspositore(id, { tipo: "fisso", qualifica: "concessionario", attivo: true, visibile: true, mercati: ["area-mercatale"], settori: [], posteggi: [], ...pub, scadenza: pub.scadenza || (pub.tipo === "spuntista" ? null : SCADENZA_FISSI) }, ris, canRis);
  return id;
}
export const archiviaEspositore = (id, attivo) => updateDoc(doc(db, "espositori", docId(id)), { attivo, _aggiornato: serverTimestamp() });

/** Assegna un posteggio a un espositore fisso (e lo toglie a chi lo aveva). Restituisce l'elenco espositori aggiornato. */
export async function assegnaPosteggio(espositori, espositoreId, posteggioId) {
  const b = writeBatch(db);
  const agg = espositori.map((e) => {
    if (e.id === espositoreId) {
      const posteggi = [...new Set([...(e.posteggi || []), posteggioId])];
      b.set(doc(db, "espositori", docId(e.id)), { posteggi, _aggiornato: serverTimestamp() }, { merge: true });
      return { ...e, posteggi };
    }
    if ((e.posteggi || []).includes(posteggioId)) {
      b.set(doc(db, "espositori", docId(e.id)), { posteggi: arrayRemove(posteggioId), _aggiornato: serverTimestamp() }, { merge: true });
      return { ...e, posteggi: e.posteggi.filter((x) => x !== posteggioId) };
    }
    return e;
  });
  await b.commit();
  return agg;
}
export async function liberaPosteggio(espositori, espositoreId, posteggioId) {
  await setDoc(doc(db, "espositori", docId(espositoreId)), { posteggi: arrayRemove(posteggioId), _aggiornato: serverTimestamp() }, { merge: true });
  return espositori.map((e) => (e.id === espositoreId ? { ...e, posteggi: (e.posteggi || []).filter((x) => x !== posteggioId) } : e));
}
export async function notaPosteggio(posteggioId, note) {
  await updateDoc(doc(db, "posteggi", docId(posteggioId)), { note: note ? note.trim() : deleteField(), _aggiornato: serverTimestamp() });
}

/** Staff: creazione utente con un'istanza Firebase secondaria (non tocca la sessione corrente). */
export async function creaStaff({ email, password, nome, cognome, telefono, role }) {
  const cfg = app.options;
  const second = getApps().find((a) => a.name === "secondaria") || initializeApp(cfg, "secondaria");
  const sAuth = getAuth(second);
  const cred = await createUserWithEmailAndPassword(sAuth, email.trim(), password);
  const uid = cred.user.uid;
  await signOut(sAuth);
  await setDoc(doc(db, "staff", uid), { email: email.trim(), nome: (nome || "").trim(), cognome: (cognome || "").trim(), telefono: (telefono || "").trim(), role, attivo: true, cambioPassword: true, creato: serverTimestamp() });
  return uid;
}
export const aggiornaStaff = (uid, data) => updateDoc(doc(db, "staff", uid), { ...data, _aggiornato: serverTimestamp() });
export const inviaReset = (email) => sendPasswordResetEmail(auth, email);

/** QR: genera (o rigenera) il token di un espositore. Revoca l'eventuale token precedente. */
export function nuovoToken() {
  const a = new Uint8Array(15); crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function generaToken(espositoreId, tokenPrecedente) {
  const token = nuovoToken();
  const b = writeBatch(db);
  if (tokenPrecedente) b.set(doc(db, "qr", tokenPrecedente), { attivo: false, revocato: serverTimestamp() }, { merge: true });
  b.set(doc(db, "qr", token), { espositoreId, attivo: true, creato: serverTimestamp() });
  b.set(doc(db, "espositori_riservati", docId(espositoreId)), { id: espositoreId, qrToken: token, qrCreato: serverTimestamp() }, { merge: true });
  await b.commit();
  return token;
}
export async function revocaToken(espositoreId, token) {
  const b = writeBatch(db);
  b.set(doc(db, "qr", token), { attivo: false, revocato: serverTimestamp() }, { merge: true });
  b.set(doc(db, "espositori_riservati", docId(espositoreId)), { qrToken: deleteField() }, { merge: true });
  await b.commit();
}
// URL pubblico dell'app, ricavato da dove gira il pannello (…/admin/ -> …/app/): i QR escono con il dominio corrente
export const APP_URL = new URL("../app/", window.location.href).href;
export const urlQr = (token) => `${APP_URL}#/v/${token}`;

/** Richieste self-service: approva (applica i campi all'espositore) o rifiuta. */
export const CAMPI_RICHIESTA = ["alias", "referente", "whatsapp", "telegram", "descrizione"];
export async function approvaRichiesta(r, campi, utente) {
  const b = writeBatch(db);
  const upd = {}; for (const k of campi) upd[k] = (r[k] || "").trim();
  b.set(doc(db, "espositori", docId(r.espositoreId)), { ...upd, id: r.espositoreId, consensoPubblicazione: true, _aggiornato: serverTimestamp() }, { merge: true });
  b.set(doc(db, "richieste", r._id), { stato: "approvata", gestitaDa: utente, gestita: serverTimestamp(), campiApplicati: campi }, { merge: true });
  await b.commit();
  return upd;
}
export const rifiutaRichiesta = (r, utente, motivo) => setDoc(doc(db, "richieste", r._id), { stato: "rifiutata", gestitaDa: utente, gestita: serverTimestamp(), motivo: motivo || "" }, { merge: true });

/** Foto (solo con FOTO_ABILITATE) */
async function ridimensiona(file, max = 1200, q = 0.82) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, "image/jpeg", q));
}
export async function caricaFoto(espositoreId, file, indice) {
  if (!storage) throw new Error("Le foto non sono abilitate (serve il piano Blaze e VITE_FOTO=1)");
  const blob = await ridimensiona(file);
  const r = sRef(storage, `espositori/${docId(espositoreId)}/${indice}-${Date.now()}.jpg`);
  await uploadBytes(r, blob, { contentType: "image/jpeg", cacheControl: "public,max-age=31536000" });
  return getDownloadURL(r);
}
export async function eliminaFoto(url) { if (!storage) return; try { await deleteObject(sRef(storage, url)); } catch { /* già assente */ } }
export const salvaFotoEspositore = (espositoreId, foto) => setDoc(doc(db, "espositori", docId(espositoreId)), { foto, _aggiornato: serverTimestamp() }, { merge: true });

/** Mercati: indirizzo, giorni, orari, note (solo admin per regole). */
export const salvaMercato = (id, data) => setDoc(doc(db, "mercati", id), { ...data, id, _aggiornato: serverTimestamp() }, { merge: true });
export const GIORNI = [[1, "Lun"], [2, "Mar"], [3, "Mer"], [4, "Gio"], [5, "Ven"], [6, "Sab"], [0, "Dom"]];
export function testoGiorni(gs) {
  const set = new Set(gs);
  if (set.size === 7) return "tutti i giorni";
  if (set.size === 6 && !set.has(0)) return "da lunedì a sabato";
  const nomi = { 1: "lunedì", 2: "martedì", 3: "mercoledì", 4: "giovedì", 5: "venerdì", 6: "sabato", 0: "domenica" };
  const ord = [1, 2, 3, 4, 5, 6, 0].filter((g) => set.has(g)).map((g) => nomi[g]);
  return ord.length === 1 ? "ogni " + ord[0] : ord.join(", ");
}
export const testoOrario = (a, c) => `${a.replace(/^0/, "")} – ${c.replace(/^0/, "")}`;

/** Impostazioni per mercato e calendario (suap/admin). */
export const salvaImpostazioni = (mercatoId, data) => setDoc(doc(db, "impostazioni", mercatoId), { ...data, id: mercatoId, _aggiornato: serverTimestamp() }, { merge: true });
export const salvaVoceCalendario = (v) => setDoc(doc(db, "calendario", `${v.mercato}_${v.data}`), { ...v, _aggiornato: serverTimestamp() });
export const eliminaVoceCalendario = (id) => deleteDoc(doc(db, "calendario", id));

/** Presenze in un intervallo di date (inclusivo). */
export async function caricaPresenze(da, a) {
  const snap = await getDocs(query(collection(db, "presenze"), where("data", ">=", da), where("data", "<=", a)));
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}
/** Contatori assenze consecutive: scrive `assenze` sui documenti espositori che cambiano (batch). */
export async function salvaContatoriAssenze(voci) {
  let b = writeBatch(db); let n = 0;
  for (const { id, assenze } of voci) { b.set(doc(db, "espositori", docId(id)), { assenze }, { merge: true }); if (++n === 400) { await b.commit(); b = writeBatch(db); n = 0; } }
  if (n) await b.commit();
  return voci.length;
}
export const annullaPresenza = (id, operatore, motivo) => setDoc(doc(db, "presenze", id), { annullata: true, annullataDa: operatore, annullataOra: serverTimestamp(), motivoAnnullamento: motivo || "" }, { merge: true });
export { getApp };
