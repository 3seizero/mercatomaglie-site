// Report presenze/assenze: giornate di mercato, conteggi per espositore, export Excel e PDF (stampa).
import * as XLSX from "xlsx";

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const dataIt = (s) => (s ? s.split("-").reverse().join("/") : "");

/** Voce di calendario che riguarda un mercato in una data. */
const voce = (cal, mercatoId, giorno) => cal.find((c) => c.mercato === mercatoId && (c.data === giorno || (c.tipo === "spostato" && c.dataNuova === giorno))) || null;

/** Giornate di mercato tra `da` e `a` (inclusi): sabati (giorniSettimana) + straordinari + spostati alla data nuova, meno soppressi.
 *  Restituisce [{data, tipo:'ordinaria'|'straordinario'|'spostato', motivo}]; a parte, le giornate soppresse [{data, motivo}]. */
export function giornateMercato(mercato, cal, da, a) {
  const out = [], soppresse = [];
  if (!mercato || !mercato.giorniSettimana) return { giornate: out, soppresse };
  for (let d = daIso(da); iso(d) <= a; d.setDate(d.getDate() + 1)) {
    const g = iso(d);
    const v = voce(cal, mercato.id, g);
    if (v) {
      if (v.tipo === "soppresso") { soppresse.push({ data: g, motivo: v.motivo || "" }); continue; }
      if (v.tipo === "straordinario") { out.push({ data: g, tipo: "straordinario", motivo: v.motivo || "" }); continue; }
      if (v.tipo === "spostato") { if (v.dataNuova === g) out.push({ data: g, tipo: "spostato", motivo: `al posto del ${dataIt(v.data)}` }); continue; }
    }
    if (mercato.giorniSettimana.includes(d.getDay())) out.push({ data: g, tipo: "ordinaria", motivo: "" });
  }
  return { giornate: out, soppresse };
}

/** Serie di assenze consecutive di un fisso sulle giornate svolte (ordinate), fino a `fino` (data ISO inclusa).
 *  Le giornate soppresse non compaiono in `giornate`, quindi non interrompono né allungano la serie. */
export function assenzeConsecutive(giornate, presenzeDate, fino) {
  const gg = giornate.map((g) => g.data).filter((d) => d <= fino).sort();
  let corrente = 0, massimo = 0, dal = null, dalMassimo = null, ultimaPresenza = null, inizio = null;
  for (const d of gg) {
    if (presenzeDate.has(d)) { corrente = 0; dal = null; ultimaPresenza = d; }
    else { if (corrente === 0) inizio = d; corrente++; dal = inizio; if (corrente > massimo) { massimo = corrente; dalMassimo = inizio; } }
  }
  return { consecutive: corrente, dal, massimo, dalMassimo, ultimaPresenza, giornate: gg.length, calcolatoIl: fino };
}

/** Riepilogo per espositore: presenze valide, assenze totali e consecutive, ultima presenza. */
export function riepilogoEspositori({ presenze, espositori, giornate, mercatoId, assenzeMassime, fino }) {
  const valide = presenze.filter((p) => p.mercato === mercatoId && !p.annullata && giornate.some((g) => g.data === p.data));
  const perEsp = {};
  for (const p of valide) (perEsp[p.espositoreId] ||= []).push(p);
  const lista = espositori.filter((e) => e.attivo !== false && (e.tipo === "spuntista" ? (e.mercati || ["area-mercatale"]).includes(mercatoId) : (e.posteggi || []).length > 0 || perEsp[e.id]));
  return lista.map((e) => {
    const ps = (perEsp[e.id] || []).sort((x, y) => x.data.localeCompare(y.data));
    const date = new Set(ps.map((p) => p.data));
    const presenzeN = date.size;
    const fisso = e.tipo !== "spuntista";
    const assenze = fisso ? Math.max(0, giornate.length - presenzeN) : null;
    const serie = fisso ? assenzeConsecutive(giornate, date, fino || "9999-12-31") : null;
    return {
      id: e.id, nome: (e.alias && e.alias.trim()) || e.denominazione || e.id, tipo: fisso ? "fisso" : "spuntista", posteggi: (e.posteggi || []).join(", "),
      presenze: presenzeN, assenze, consecutive: serie ? serie.consecutive : null, massimoConsecutive: serie ? serie.massimo : null, dal: serie ? serie.dal : null,
      qr: ps.filter((p) => p.metodo === "qr").length,
      oltreSoglia: !!(fisso && assenzeMassime > 0 && serie.massimo > assenzeMassime), ultima: ps.length ? ps[ps.length - 1].data : "",
      dettaglio: ps,
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome));
}

const nomeOp = (p) => (p.operatore ? [p.operatore.nome, p.operatore.cognome].filter(Boolean).join(" ") || p.operatore.email || "" : (p.da && p.da.email) || "");

/** Righe piatte del registro (una per presenza), per tabella ed export. */
export const righeRegistro = (presenze, espById) => presenze.slice().sort((a, b) => a.data.localeCompare(b.data) || (a.oraLocale || "").localeCompare(b.oraLocale || "")).map((p) => {
  const e = espById[p.espositoreId];
  return { data: p.data, ora: p.oraLocale || "", espositore: e ? (e.alias && e.alias.trim()) || e.denominazione : p.espositoreId, tipo: p.tipoEspositore || (e && e.tipo) || "", posteggio: p.posteggioId || "", metodo: p.metodo || "", operatore: nomeOp(p), gps: p.posizione ? `${p.posizione.lat.toFixed(5)}, ${p.posizione.lon.toFixed(5)}` : "", annullata: p.annullata ? "sì" : "", _id: p._id };
});

/** Export Excel: un foglio di riepilogo e uno con il registro. */
export function esportaExcel({ titolo, riepilogo, registro, giornate, soppresse, periodo }) {
  const wb = XLSX.utils.book_new();
  const r1 = riepilogo.map((r) => ({ Espositore: r.nome, Tipo: r.tipo, Posteggi: r.posteggi, Presenze: r.presenze, "Assenze totali": r.assenze ?? "", "Assenze consecutive in corso": r.consecutive ?? "", "Serie massima": r.massimoConsecutive ?? "", "Via QR": r.qr, "Oltre soglia": r.oltreSoglia ? "SÌ" : "", "Ultima presenza": dataIt(r.ultima) }));
  const ws1 = XLSX.utils.json_to_sheet(r1);
  XLSX.utils.sheet_add_aoa(ws1, [[titolo], [`Periodo ${dataIt(periodo.da)} – ${dataIt(periodo.a)} · giornate di mercato svolte: ${giornate.length} · soppresse: ${soppresse.length}`], []], { origin: "A1" });
  XLSX.utils.sheet_add_json(ws1, r1, { origin: "A4" });
  ws1["!cols"] = [{ wch: 34 }, { wch: 10 }, { wch: 18 }, { wch: 9 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 11 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Riepilogo");
  const r2 = registro.map((r) => ({ Data: dataIt(r.data), Ora: r.ora, Espositore: r.espositore, Tipo: r.tipo, Posteggio: r.posteggio, Metodo: r.metodo, Operatore: r.operatore, GPS: r.gps, Annullata: r.annullata }));
  const ws2 = XLSX.utils.json_to_sheet(r2);
  ws2["!cols"] = [{ wch: 11 }, { wch: 6 }, { wch: 34 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 24 }, { wch: 20 }, { wch: 9 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Registro");
  const ws3 = XLSX.utils.json_to_sheet([...giornate.map((g) => ({ Data: dataIt(g.data), Tipo: g.tipo, Note: g.motivo })), ...soppresse.map((g) => ({ Data: dataIt(g.data), Tipo: "soppresso", Note: g.motivo }))]);
  XLSX.utils.book_append_sheet(wb, ws3, "Giornate");
  XLSX.writeFile(wb, `${titolo.replace(/[^a-z0-9]+/gi, "-")}_${periodo.da}_${periodo.a}.xlsx`);
}

const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** Export PDF: finestra di stampa (il browser salva in PDF). */
export function stampaReport({ titolo, sottotitolo, riepilogo, registro, giornate, soppresse, periodo, assenzeMassime }) {
  const th = (cols) => `<tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
  const r1 = riepilogo.map((r) => `<tr class="${r.oltreSoglia ? "alert" : ""}"><td>${esc(r.nome)}</td><td>${r.tipo}</td><td>${esc(r.posteggi)}</td><td class="n">${r.presenze}</td><td class="n">${r.assenze ?? ""}</td><td class="n">${r.consecutive ?? ""}</td><td class="n">${r.massimoConsecutive ?? ""}</td><td>${dataIt(r.ultima)}</td></tr>`).join("");
  const r2 = registro.map((r) => `<tr class="${r.annullata ? "ann" : ""}"><td>${dataIt(r.data)}</td><td>${r.ora}</td><td>${esc(r.espositore)}</td><td>${r.tipo}</td><td>${esc(r.posteggio)}</td><td>${r.metodo}</td><td>${esc(r.operatore)}</td><td>${r.annullata ? "annullata" : ""}</td></tr>`).join("");
  const gg = [...giornate.map((g) => `${dataIt(g.data)}${g.tipo !== "ordinaria" ? ` (${g.tipo}${g.motivo ? ": " + esc(g.motivo) : ""})` : ""}`), ...soppresse.map((g) => `<s>${dataIt(g.data)}</s> soppressa${g.motivo ? ` (${esc(g.motivo)})` : ""}`)].join(" · ");
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(titolo)}</title><style>
    @page{size:A4;margin:12mm} body{font-family:Helvetica,Arial,sans-serif;color:#222;font-size:9.5pt;margin:0}
    h1{font-size:15pt;margin:0 0 2mm} h2{font-size:11.5pt;margin:6mm 0 2mm;border-bottom:1.2px solid #c8862a;padding-bottom:1mm} .sub{color:#555;margin-bottom:3mm}
    table{border-collapse:collapse;width:100%} th,td{border:1px solid #bbb;padding:3px 5px;text-align:left;vertical-align:top} th{background:#f5f0e8;font-size:8.5pt} td{font-size:8.5pt} td.n{text-align:right}
    tr{page-break-inside:avoid} tr.alert td{background:#fde8e8;font-weight:700} tr.ann td{color:#999;text-decoration:line-through}
    .foot{margin-top:8mm;font-size:8pt;color:#777} @media screen{body{padding:10mm;background:#eee} .page{background:#fff;padding:12mm;max-width:210mm;margin:auto}}
  </style></head><body><div class="page">
    <h1>${esc(titolo)}</h1><div class="sub">${esc(sottotitolo)}<br>Periodo ${dataIt(periodo.da)} – ${dataIt(periodo.a)} · giornate di mercato svolte: ${giornate.length} · soppresse: ${soppresse.length}${assenzeMassime ? ` · soglia: ${assenzeMassime} assenze consecutive (le giornate soppresse non contano)` : ""}</div>
    <div class="sub"><b>Giornate:</b> ${gg || "nessuna"}</div>
    <h2>Riepilogo per espositore</h2>
    <table>${th(["Espositore", "Tipo", "Posteggi", "Presenze", "Assenze totali", "Consecutive in corso", "Serie massima", "Ultima presenza"])}${r1}</table>
    <h2>Registro delle presenze certificate</h2>
    <table>${th(["Data", "Ora", "Espositore", "Tipo", "Posteggio", "Metodo", "Operatore", ""])}${r2}</table>
    <div class="foot">Comune di Maglie · Area Mercatale · generato il ${new Date().toLocaleString("it-IT")} dal pannello di gestione. Le presenze sono certificate dagli operatori di controllo indicati.</div>
  </div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) throw new Error("Popup bloccato dal browser: consenti le finestre popup per stampare");
  w.document.open(); w.document.write(html); w.document.close();
}
