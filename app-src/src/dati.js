// Livello dati: anagrafiche dai seed (bundle) + presenze del giorno e login da Firebase.
// L'app pubblica legge un solo documento per mercato (stato/{mercatoId}); le anagrafiche
// vengono dal bundle finché non ci sarà il pannello admin con modifiche live.
import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, onSnapshot, runTransaction, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth, firebaseReady } from "./firebase.js";
import { POSTAZIONI_MAPPA, GEO, PLANIMETRIA_URI, SVG_VIEWBOX, SVG_W, SVG_H } from "./data/mappa.js";
import { MERCATI, POSTEGGI, ESPOSITORI, SETTORI } from "./data/seed.js";

export { MERCATI, POSTEGGI, ESPOSITORI, SETTORI, POSTAZIONI_MAPPA, GEO, PLANIMETRIA_URI, SVG_VIEWBOX, SVG_W, SVG_H };

export const oggi = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// id documento Firestore per un posteggio/espositore ("A-55/56" -> "A-55_56")
export const docId = (id) => String(id).replace(/\//g, "_");

const ESP_BY_ID = Object.fromEntries(ESPOSITORI.map((e) => [e.id, e]));
const POST_BY_ID = Object.fromEntries(POSTEGGI.map((p) => [p.id, p]));
export const espositoreById = (id) => ESP_BY_ID[id] || null;
export const posteggioById = (id) => POST_BY_ID[id] || null;
export const nomePubblico = (e) => (e ? (e.alias && e.alias.trim()) || e.denominazione : "");

/** Presenze del giorno per tutti i mercati: { [espositoreId]: {posteggioId, ora} } */
export function usePresenze() {
  const [presenze, setPresenze] = useState({});
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubs = MERCATI.map((m) =>
      onSnapshot(doc(db, "stato", m.id), (snap) => {
        setOnline(true);
        const d = snap.data();
        const valid = d && d.data === oggi() ? d.presenti || {} : {};
        setPresenze((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(next)) if (next[k].mercato === m.id) delete next[k];
          for (const [eid, v] of Object.entries(valid)) next[eid] = { ...v, mercato: m.id };
          return next;
        });
      }, () => setOnline(false))
    );
    return () => unsubs.forEach((u) => u());
  }, []);
  return { presenze, online };
}

/** Anagrafiche e assegnazioni live dai riassunti pubblico/{mercato}: { espositori:{id:{}}, posteggi:{id:{espositoreId,stato,note}} } */
export function usePubblico() {
  const [live, setLive] = useState({ espositori: {}, posteggi: {} });
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubs = MERCATI.map((m) =>
      onSnapshot(doc(db, "pubblico", m.id), (snap) => {
        const d = snap.data(); if (!d) return;
        setLive((prev) => ({ espositori: { ...prev.espositori, ...(d.espositori || {}) }, posteggi: { ...prev.posteggi, ...(d.posteggi || {}) } }));
      }, () => {})
    );
    return () => unsubs.forEach((u) => u());
  }, []);
  return live;
}

/** Segna presenza/assenza di un espositore su un posteggio (solo staff: le regole Firestore lo impongono). */
/** Risolve un token QR: { espositoreId, attivo } oppure null. */
export async function lookupQr(token) {
  if (!firebaseReady || !token) return null;
  const snap = await getDoc(doc(db, "qr", token));
  return snap.exists() ? snap.data() : null;
}

export async function setPresenza({ mercatoId, espositoreId, posteggioId, presente, utente, metodo = "manuale", posizione = null }) {
  if (!firebaseReady) throw new Error("Firebase non configurato");
  const giorno = oggi();
  const ref = doc(db, "stato", mercatoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() && snap.data().data === giorno ? snap.data().presenti || {} : {};
    const presenti = { ...cur };
    if (presente) presenti[espositoreId] = { posteggioId, ora: new Date().toISOString(), metodo, da: utente || null };
    else delete presenti[espositoreId];
    tx.set(ref, { data: giorno, presenti, aggiornato: serverTimestamp() });
  });
  await setDoc(doc(db, "presenze", `${giorno}_${docId(espositoreId)}`), {
    data: giorno, mercato: mercatoId, espositoreId, posteggioId, presente, metodo, da: utente || null, ora: serverTimestamp(), posizione,
  });
}

/** Utente Firebase e ruolo (custom claim `role`: admin | operatore | suap). */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  useEffect(() => {
    if (!firebaseReady) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        let r = null;
        try { const t = await u.getIdTokenResult(true); r = t.claims.role || null; } catch { r = null; }
        if (!r) { try { const sd = await getDoc(doc(db, "staff", u.uid)); r = sd.exists() ? sd.data().role || null : null; } catch { r = null; } }
        setRole(r);
      } else setRole(null);
      setLoading(false);
    });
  }, []);
  const login = useCallback(async (email, password) => {
    if (!firebaseReady) throw new Error("Firebase non configurato");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);
  const logout = useCallback(() => (firebaseReady ? signOut(auth) : Promise.resolve()), []);
  const isStaff = ["admin", "operatore", "suap"].includes(role);
  return { user, role, isStaff, isAdmin: role === "admin", loading, login, logout };
}

/** Postazioni dell'area mercatale nel formato usato dalla mappa: geometria + espositore + presenza. */
const mergePost = (p, live) => (p && live && live.posteggi[p.id]) ? { ...p, ...live.posteggi[p.id] } : p;
const findEsp = (id, live) => (id ? ((live && live.espositori[id]) ? { ...(ESP_BY_ID[id] || {}), ...live.espositori[id] } : ESP_BY_ID[id] || null) : null);

export function buildPostazioni(presenze, live) {
  return POSTAZIONI_MAPPA.map((g) => {
    const p = mergePost(POST_BY_ID[g.id], live);
    const e = p ? findEsp(p.espositoreId, live) : null;
    return {
      id: g.id, shape: "poly", points: g.points, cx: g.cx, cy: g.cy, lat: g.lat, lon: g.lon,
      settore: g.settore, numero: g.numero, fila: p ? p.fila : null,
      postazione: `${g.settore} ${g.numero}`,
      etichetta: p ? p.etichetta : `Settore ${g.settore} · n. ${g.numero}`,
      superficie: p ? p.superficie : null,
      espositoreId: e ? e.id : null,
      nome: nomePubblico(e), titolare: e ? e.referente || "" : "",
      categoria: SETTORI[g.settore] || g.settore,
      whatsapp: e ? e.whatsapp || "" : "", telegram: e ? e.telegram || "" : "",
      descrizione: e ? e.descrizione || "" : "",
      presente: !!(e && presenze[e.id]),
      inElenco: g.inElenco,
    };
  });
}

/** Elenco per Coperto / Ortofrutticolo: posteggi del mercato con espositore. */
export function buildElenco(mercatoId, presenze, live) {
  return POSTEGGI.filter((p0) => p0.mercato === mercatoId).map((p0) => {
    const p = mergePost(p0, live);
    const e = findEsp(p.espositoreId, live);
    return {
      id: p.id, etichetta: p.etichetta, numero: p.numero, tipo: p.tipo, settore: p.settore,
      nome: nomePubblico(e), titolare: e ? e.referente || "" : "", categoria: e ? e.categoria || p.articolo || "" : (p.articolo || ""),
      whatsapp: e ? e.whatsapp || "" : "", telegram: e ? e.telegram || "" : "", descrizione: e ? e.descrizione || "" : "",
      note: p.note || "", stato: p.stato, espositoreId: e ? e.id : null, presente: !!(e && presenze[e.id]),
    };
  });
}
