// Costruzione dei riassunti pubblico/{mercato} letti dall'app (1 documento per mercato).
// STESSA LOGICA di rebuildPubblico() in admin-src/src/api.js: se cambi qui, cambia anche là.
export const PUB = ['id', 'tipo', 'denominazione', 'alias', 'referente', 'categoria', 'mercati', 'settori', 'whatsapp', 'telegram', 'descrizione', 'foto', 'posteggi', 'scadenza'];
export const MERCATI_ID = ['area-mercatale', 'coperto', 'ortofrutticolo'];

/** @param espositori documenti espositori (campi v3) @param posteggi documenti posteggi (geometria, mercato, note) */
export function costruisciPubblico(espositori, posteggi) {
  const out = {};
  for (const m of MERCATI_ID) {
    const P = {};
    for (const p of posteggi.filter((p) => p.mercato === m)) P[p.id] = { espositoreId: null, stato: 'vacante', note: p.note || null };
    const E = {};
    for (const e of espositori) {
      if (e.attivo === false) continue;
      const tipo = e.tipo === 'spuntista' ? 'spuntista' : 'fisso';
      const inMercato = tipo === 'fisso'
        ? (e.posteggi || []).some((pid) => P[pid])
        : (e.mercati || ['area-mercatale']).includes(m);
      if (!inMercato) continue;
      if (tipo === 'fisso') for (const pid of e.posteggi || []) if (P[pid]) { P[pid].espositoreId = e.id; P[pid].stato = 'assegnato'; }
      if (e.visibile === false) {
        E[e.id] = { id: e.id, tipo, riservato: true, categoria: e.categoria || null, settori: e.settori || [], posteggi: tipo === 'fisso' ? (e.posteggi || []).filter((pid) => P[pid]) : [], scadenza: e.scadenza || null };
      } else {
        E[e.id] = { tipo };
        for (const k of PUB) if (e[k] !== undefined && e[k] !== null) E[e.id][k] = e[k];
        if (tipo === 'fisso') E[e.id].posteggi = (e.posteggi || []).filter((pid) => P[pid]);
      }
    }
    out[m] = { mercato: m, espositori: E, posteggi: P };
  }
  return out;
}
