// Accesso a Firestore/Auth per il pannello di gestione.
import { useEffect, useState, useCallback } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  collection, doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp, writeBatch, deleteField,
} from "firebase/firestore";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail, createUserWithEmailAndPassword,
} from "firebase/auth";
import { db, auth, app, firebaseReady } from "./firebase.js";

export { firebaseReady };
export const MERCATI = [
  { id: "area-mercatale", nome: "Area Mercatale" },
  { id: "coperto", nome: "Mercato Coperto Centro" },
  { id: "ortofrutticolo", nome: "Mercato Ortofrutticolo" },
];
export const SETTORI = { A: "Abbigliamento", B: "Abbigliamento usato", C: "Alimentare", D: "Calzature", E: "Casalinghi e fiori", PV: "Prodotti vari", UOVA: "Vendita uova", box: "Box", panche: "Panche", settimanale: "Settimanale" };
export const TIPI = ["concessionario", "occasionale", "produttore", "operatori-vari"];
export const RUOLI = ["admin", "suap", "operatore"];
const PUB = ["id", "denominazione", "alias", "referente", "tipo", "categoria", "mercati", "settori", "whatsapp", "telegram", "descrizione", "foto", "attivo"];

export const slugify = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const docId = (id) => String(id).replace(/\//g, "_");

/** Utente e ruolo (documento staff/{uid}, con fallback ai custom claims). */
export function useAdminAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  useEffect(() => {
    if (!firebaseReady) { setLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      let r = null;
      if (u) {
        try { const sd = await getDoc(doc(db, "staff", u.uid)); r = sd.exists() ? sd.data().role || null : null; } catch { r = null; }
        if (!r) { try { const t = await u.getIdTokenResult(); r = t.claims.role || null; } catch { r = null; } }
      }
      setRole(r); setLoading(false);
    });
  }, []);
  const login = useCallback((email, pw) => signInWithEmailAndPassword(auth, email.trim(), pw), []);
  const logout = useCallback(() => signOut(auth), []);
  const cambiaPassword = useCallback(async (attuale, nuova) => {
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, attuale));
    await updatePassword(u, nuova);
  }, []);
  return { user, role, loading, login, logout, cambiaPassword, isAdmin: role === "admin", isSuap: role === "admin" || role === "suap" };
}

/** Collezione in tempo reale (array di documenti). */
export function useCollection(name, enabled = true) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!firebaseReady || !enabled) return;
    return onSnapshot(collection(db, name), (snap) => { setRows(snap.docs.map((d) => ({ _id: d.id, ...d.data() }))); setError(null); }, (e) => setError(e.message));
  }, [name, enabled]);
  return { rows, error };
}

/** Riassunti pubblico/{mercato} per l'app pubblica: ricalcolati dai dati completi. */
export async function rebuildPubblico(espositori, posteggi) {
  const batch = writeBatch(db);
  for (const m of MERCATI) {
    const P = {};
    for (const p of posteggi.filter((p) => p.mercato === m.id)) P[p.id] = { espositoreId: p.espositoreId || null, stato: p.stato || null, note: p.note || null };
    const ids = new Set(Object.values(P).map((p) => p.espositoreId).filter(Boolean));
    const E = {};
    for (const e of espositori.filter((e) => ids.has(e.id))) {
      E[e.id] = {};
      for (const k of PUB) if (e[k] !== undefined && e[k] !== null) E[e.id][k] = e[k];
    }
    batch.set(doc(db, "pubblico", m.id), { mercato: m.id, espositori: E, posteggi: P, aggiornato: serverTimestamp() });
  }
  await batch.commit();
}

const clean = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));

export async function salvaEspositore(id, pub, ris, canRis) {
  const b = writeBatch(db);
  b.set(doc(db, "espositori", docId(id)), { ...clean(pub), id, _aggiornato: serverTimestamp() }, { merge: true });
  if (canRis && ris) b.set(doc(db, "espositori_riservati", docId(id)), { ...clean(ris), id, _aggiornato: serverTimestamp() }, { merge: true });
  await b.commit();
}

export async function nuovoEspositore(pub, ris, canRis, esistenti) {
  const base = slugify(pub.referente || pub.denominazione) || "espositore";
  let id = base, n = 1;
  const ids = new Set(esistenti.map((e) => e.id));
  while (ids.has(id)) { n += 1; id = `${base}-${n}`; }
  await salvaEspositore(id, { tipo: "concessionario", attivo: true, mercati: [], settori: [], ...pub }, ris, canRis);
  return id;
}

export async function assegnaPosteggio(posteggioId, espositoreId) {
  await updateDoc(doc(db, "posteggi", docId(posteggioId)), {
    espositoreId: espositoreId || null, stato: espositoreId ? "assegnato" : "vacante", _aggiornato: serverTimestamp(),
  });
}
export async function notaPosteggio(posteggioId, note) {
  await updateDoc(doc(db, "posteggi", docId(posteggioId)), { note: note ? note.trim() : deleteField(), _aggiornato: serverTimestamp() });
}

/** Staff: creazione utente con un'istanza Firebase secondaria (non tocca la sessione corrente). */
export async function creaStaff({ email, password, nome, role }) {
  const cfg = app.options;
  const second = getApps().find((a) => a.name === "secondaria") || initializeApp(cfg, "secondaria");
  const sAuth = getAuth(second);
  const cred = await createUserWithEmailAndPassword(sAuth, email.trim(), password);
  const uid = cred.user.uid;
  await signOut(sAuth);
  await setDoc(doc(db, "staff", uid), { email: email.trim(), nome: nome || "", role, creato: serverTimestamp() });
  return uid;
}
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
export const APP_URL = "https://3seizero.com/projects/maglie/areamercatale/app/";
export const urlQr = (token) => `${APP_URL}#/v/${token}`;

export const aggiornaStaff = (uid, data) => updateDoc(doc(db, "staff", uid), { ...data, _aggiornato: serverTimestamp() });
export const inviaReset = (email) => sendPasswordResetEmail(auth, email);
export { getApp };
