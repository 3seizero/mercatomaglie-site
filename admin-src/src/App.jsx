import { useEffect, useMemo, useRef, useState } from "react";
import { stampaQr, qrDataUrl } from "./stampa.js";
import {
  firebaseReady, MERCATI, SETTORI, TIPI, QUALIFICHE, RUOLI, IMPOSTAZIONI_DEFAULT, TIPI_CALENDARIO, useAdminAuth, useCollection, useDocumento, rebuildPubblico,
  salvaEspositore, nuovoEspositore, archiviaEspositore, assegnaPosteggio, liberaPosteggio, notaPosteggio, creaStaff, aggiornaStaff, inviaReset, generaToken, revocaToken, urlQr,
  FOTO_ABILITATE, CAMPI_RICHIESTA, approvaRichiesta, rifiutaRichiesta, caricaFoto, eliminaFoto, salvaFotoEspositore, salvaMercato, GIORNI, testoGiorni, testoOrario,
  salvaImpostazioni, salvaVoceCalendario, eliminaVoceCalendario, caricaPresenze, annullaPresenza, salvaContatoriAssenze, nomePub, oggi, scaduto, SCADENZA_FISSI,
} from "./api.js";
import { giornateMercato, riepilogoEspositori, righeRegistro, esportaExcel, stampaReport, dataIt, assenzeConsecutive } from "./report.js";

const sup = (p) => (p && p.superficie && typeof p.superficie === "object") ? p.superficie.raw : (p ? p.superficie : null);
const numKey = (v) => { const m = String(v || "").match(/\d+/); return m ? Number(m[0]) : 9999; };
const ordinaPosteggi = (a, b) =>
  a.mercato.localeCompare(b.mercato) || String(a.settore || "").localeCompare(String(b.settore || "")) ||
  numKey(a.fila) - numKey(b.fila) || numKey(a.numero) - numKey(b.numero) || String(a.numero).localeCompare(String(b.numero));
const errore = (e) => ({ "auth/invalid-credential": "Email o password non validi", "auth/wrong-password": "Password errata", "auth/email-already-in-use": "Email già registrata", "auth/weak-password": "Password troppo corta (minimo 6 caratteri)", "permission-denied": "Permesso negato per il tuo ruolo" }[e.code] || e.message || String(e));
const useRun = () => {
  const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  async function run(fn, okMsg) { setBusy(true); setMsg(null); try { const r = await fn(); setMsg({ ok: true, t: okMsg }); return r; } catch (e) { setMsg({ ok: false, t: errore(e) }); } finally { setBusy(false); } }
  return { msg, setMsg, busy, run };
};
const Msg = ({ m }) => (m ? <div className={"msg " + (m.ok ? "ok" : "err")}>{m.t}</div> : null);

/** Ultima giornata di mercato conclusa (data < oggi, oppure oggi dopo la chiusura). */
function ultimaGiornataConclusa(m, calendario) {
  const g = oggi(); const anno = g.slice(0, 4);
  const { giornate } = giornateMercato(m, calendario, `${anno}-01-01`, g);
  const now = new Date(); const hm = now.getHours() * 60 + now.getMinutes();
  const [ch, cm] = String(m.chiusura || "13:00").split(":").map(Number);
  return giornate.map((x) => x.data).filter((d) => d < g || hm >= ch * 60 + cm).pop() || null;
}
/** Contatori delle assenze consecutive dei fissi (area mercatale), ricalcolati e salvati su Firestore quando non aggiornati
 *  all'ultima giornata conclusa. Le giornate soppresse dal SUAP non contano. */
export async function ricalcolaContatori({ espositori, mercato, calendario }) {
  const fino = ultimaGiornataConclusa(mercato, calendario); if (!fino) return { fino: null, n: 0 };
  const anno = fino.slice(0, 4); const da = `${anno}-01-01`;
  const presenze = await caricaPresenze(da, fino);
  const { giornate } = giornateMercato(mercato, calendario, da, fino);
  const voci = [];
  for (const e of espositori) {
    if (e.tipo === "spuntista" || e.attivo === false || !(e.posteggi || []).length) continue;
    const date = new Set(presenze.filter((p) => p.espositoreId === e.id && p.mercato === mercato.id && !p.annullata).map((p) => p.data));
    const s = assenzeConsecutive(giornate, date, fino);
    const nuovo = { anno: Number(anno), consecutive: s.consecutive, dal: s.dal, massimo: s.massimo, dalMassimo: s.dalMassimo, ultimaPresenza: s.ultimaPresenza, giornate: s.giornate, calcolatoIl: fino };
    if (JSON.stringify(e.assenze || null) !== JSON.stringify(nuovo)) voci.push({ id: e.id, assenze: nuovo });
  }
  if (voci.length) await salvaContatoriAssenze(voci);
  return { fino, n: voci.length };
}
function useContatoriAssenze(auth, espositori, mercati, calendario, pronti) {
  const fatto = useRef(false);
  useEffect(() => {
    if (!auth.isSuap || fatto.current || !pronti || !espositori.length) return;
    const m = mercati.find((x) => x.id === "area-mercatale"); if (!m) return;
    const fino = ultimaGiornataConclusa(m, calendario); if (!fino) return;
    const daAggiornare = espositori.some((e) => e.tipo !== "spuntista" && e.attivo !== false && (e.posteggi || []).length && (!e.assenze || e.assenze.calcolatoIl !== fino));
    fatto.current = true;
    if (daAggiornare) ricalcolaContatori({ espositori, mercato: m, calendario }).catch(() => {});
  }, [auth.isSuap, espositori, mercati, calendario, pronti]);
}
const TagAssenze = ({ e, soglia }) => {
  const a = e.assenze; if (!a || e.tipo === "spuntista") return null;
  if (soglia > 0 && a.consecutive > soglia) return <span className="tag red" title={`Serie in corso dal ${dataIt(a.dal)} · soglia ${soglia}`}>{a.consecutive} assenze consecutive</span>;
  if (a.consecutive > 0) return <div className="muted" title={`dal ${dataIt(a.dal)}`}>{a.consecutive} assenz{a.consecutive === 1 ? "a" : "e"} consecutiv{a.consecutive === 1 ? "a" : "e"}</div>;
  return null;
};

/** Indice posteggio -> espositore fisso, dal modello v3 (espositori.posteggi[]). */
const usaAssegnazioni = (espositori) => useMemo(() => {
  const byPost = {}, byEsp = {};
  for (const e of espositori) if (e.tipo !== "spuntista" && e.attivo !== false) for (const pid of e.posteggi || []) { byPost[pid] = e.id; (byEsp[e.id] ||= []).push(pid); }
  return { byPost, byEsp };
}, [espositori]);

export default function App() {
  const auth = useAdminAuth();
  const [page, setPage] = useState("espositori");
  const { rows: richieste } = useCollection("richieste", !!auth.user && auth.isSuap);
  const inAttesa = richieste.filter((r) => r.stato === "in-attesa").length;
  if (!firebaseReady) return <div className="login"><div className="box"><h1>Backend non configurato</h1><p>Manca app-src/.env.local con la configurazione Firebase.</p></div></div>;
  if (auth.loading) return <div className="login"><p>Caricamento…</p></div>;
  if (!auth.user || !auth.isSuap) return <Login auth={auth} />;
  const VOCI = [["espositori", "Espositori"], ["posteggi", "Posteggi"], ["richieste", `Richieste${inAttesa ? ` (${inAttesa})` : ""}`], ["report", "Report presenze"], ["impostazioni", "Impostazioni e calendario"], ...(auth.isAdmin ? [["mercati", "Mercati"], ["staff", "Staff"]] : []), ["account", "Account"]];
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><img src={`${import.meta.env.BASE_URL}brand/lockup-orizzontale-negativo.svg`} alt="Area Mercatale Maglie" style={{ width: "100%", maxWidth: 190, height: "auto", display: "block", marginBottom: 6 }} /><small>Gestione</small></div>
        <div className="who">{auth.nome || auth.user.email}<br /><b>{auth.role}</b></div>
        {VOCI.map(([id, l]) => <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>{l}</button>)}
        <div className="spacer" />
        <a className="pub" href="../app/" target="_blank" rel="noreferrer">Apri l'app pubblica ↗</a>
        <button onClick={auth.logout}>Esci</button>
      </aside>
      <main className="main">
        {page === "espositori" && <Espositori auth={auth} />}
        {page === "posteggi" && <Posteggi auth={auth} />}
        {page === "richieste" && <Richieste auth={auth} richieste={richieste} />}
        {page === "report" && <Report auth={auth} />}
        {page === "impostazioni" && <Impostazioni auth={auth} />}
        {page === "mercati" && auth.isAdmin && <Mercati />}
        {page === "staff" && auth.isAdmin && <Staff auth={auth} />}
        {page === "account" && <Account auth={auth} />}
      </main>
    </div>
  );
}

function Login({ auth }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); setErr(""); try { await auth.login(email, pw); } catch (e) { setErr(errore(e)); } setBusy(false); };
  return (
    <div className="login"><div className="box">
      <h1>Gestione mercati</h1>
      <p>{auth.user ? "Questo utente non ha un ruolo di gestione (gli operatori usano l'app)." : "Accesso riservato ad amministratori e SUAP"}</p>
      {auth.user ? <button className="btn primary" onClick={auth.logout}>Esci</button> : (<>
        <div className="field"><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
        <div className="field"><input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && go()} /></div>
        {err && <div className="msg err">{err}</div>}
        <button className="btn primary" disabled={busy} onClick={go} style={{ width: "100%", justifyContent: "center" }}>{busy ? "Accesso…" : "Accedi"}</button>
      </>)}
    </div></div>
  );
}

// ------------------------------------------------------------ ESPOSITORI
const VUOTO = { tipo: "fisso", qualifica: "concessionario", denominazione: "", alias: "", referente: "", email: "", whatsapp: "", telegram: "", categoria: "", descrizione: "", scadenza: "", visibile: true, attivo: true };
const VUOTO_RIS = { cognomeNome: "", codiceFiscale: "", partitaIva: "", indirizzo: "", comune: "", pec: "", dataRichiesta: "", protocollo: "", noteInterne: "" };

function Espositori({ auth }) {
  const { rows: espositori, error: e1 } = useCollection("espositori");
  const { rows: posteggi } = useCollection("posteggi");
  const { rows: riservati } = useCollection("espositori_riservati", auth.isSuap);
  const { rows: mercatiRows, loaded: l1 } = useCollection("mercati"); const { rows: calendario, loaded: l2 } = useCollection("calendario");
  const imp = useDocumento("impostazioni", "area-mercatale");
  useContatoriAssenze(auth, espositori, mercatiRows, calendario, l1 && l2);
  const soglia = imp?.assenzeMassime ?? IMPOSTAZIONI_DEFAULT.assenzeMassime;
  const [q, setQ] = useState(""); const [filtro, setFiltro] = useState("fisso"); const [mercato, setMercato] = useState("tutti"); const [sel, setSel] = useState(null); const [nuovo, setNuovo] = useState(false);
  const [avviso, setAvviso] = useState(null);
  useEffect(() => { if (!avviso) return; const t = setTimeout(() => setAvviso(null), 6000); return () => clearTimeout(t); }, [avviso]);
  const { byEsp } = usaAssegnazioni(espositori);
  const postById = useMemo(() => Object.fromEntries(posteggi.map((p) => [p.id, p])), [posteggi]);
  const postEsp = (e) => (byEsp[e.id] || []).map((pid) => postById[pid] || { id: pid, etichetta: pid, mercato: "?" }).sort(ordinaPosteggi);
  const risById = useMemo(() => Object.fromEntries(riservati.map((r) => [r.id, r])), [riservati]);
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return espositori.filter((e) => {
      const tipo = e.tipo === "spuntista" ? "spuntista" : "fisso";
      if (filtro === "archiviati") { if (e.attivo !== false) return false; }
      else if (filtro === "scaduti") { if (e.attivo === false || !scaduto(e)) return false; }
      else { if (e.attivo === false) return false; if (filtro !== "tutti" && tipo !== filtro) return false; }
      if (mercato !== "tutti" && !(tipo === "fisso" ? postEsp(e).some((p) => p.mercato === mercato) : (e.mercati || ["area-mercatale"]).includes(mercato))) return false;
      if (!t) return true;
      const r = risById[e.id] || {};
      return [e.denominazione, e.alias, e.referente, e.id, e.email, r.partitaIva, r.codiceFiscale, ...(byEsp[e.id] || [])].some((v) => v && String(v).toLowerCase().includes(t));
    }).sort((a, b) => nomePub(a).localeCompare(nomePub(b)));
  }, [espositori, q, filtro, mercato, byEsp, risById]); // eslint-disable-line react-hooks/exhaustive-deps
  const selEsp = sel ? espositori.find((e) => e.id === sel) : null;
  const nFissi = espositori.filter((e) => e.tipo !== "spuntista" && e.attivo !== false).length, nSp = espositori.filter((e) => e.tipo === "spuntista" && e.attivo !== false).length;
  const nScad = espositori.filter((e) => e.attivo !== false && scaduto(e)).length;
  return (
    <div className="split">
      <div>
        <h2>Espositori <span className="count">{lista.length} in elenco · {nFissi} fissi · {nSp} spuntisti</span></h2>
        <div className="toolbar">
          <div className="tabs">{[["fisso", "Fissi"], ["spuntista", "Spuntisti"], ["tutti", "Tutti"], ["scaduti", `Scaduti${nScad ? ` (${nScad})` : ""}`], ["archiviati", "Archiviati"]].map(([v, l]) => <button key={v} className={filtro === v ? "active" : ""} onClick={() => setFiltro(v)}>{l}</button>)}</div>
          <input type="search" placeholder="Cerca per denominazione, referente, P.IVA, C.F., posteggio…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={mercato} onChange={(e) => setMercato(e.target.value)} style={{ width: "auto" }}>
            <option value="tutti">Tutti i mercati</option>{MERCATI.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          {auth.isSuap && <button className="btn ocra" onClick={() => { setNuovo(true); setSel(null); }}>+ Nuovo espositore</button>}
          {auth.isSuap && <StampaBlocco lista={lista} risById={risById} postEsp={postEsp} />}
        </div>
        {e1 && <div className="msg err">{e1}</div>}
        {avviso && <div className="msg ok">{avviso}</div>}
        <table className="grid"><thead><tr><th>Espositore</th><th>Referente</th><th>Posteggi</th><th>Contatti</th><th>Stato</th></tr></thead><tbody>
          {lista.map((e) => (
            <tr key={e.id} className={"click" + (sel === e.id ? " sel" : "")} onClick={() => { setSel(e.id); setNuovo(false); }}>
              <td><b>{nomePub(e)}</b>{e.alias && <div className="muted">{e.denominazione}</div>}{e.visibile === false && <span className="tag grey" title="Non compare nell'app">privacy</span>}</td>
              <td>{e.referente || <span className="muted">—</span>}</td>
              <td>{e.tipo === "spuntista" ? <span className="muted">spuntista{e.scadenza ? ` · fino al ${dataIt(e.scadenza)}` : ""}</span> : <>{(byEsp[e.id] || []).map((pid) => <span key={pid} className="tag grey">{pid}</span>)}{!(byEsp[e.id] || []).length && <span className="muted">nessuno</span>}</>}</td>
              <td className="muted">{[e.whatsapp && "WhatsApp", e.telegram && "Telegram", e.email && "email"].filter(Boolean).join(", ") || "—"}</td>
              <td>{e.attivo === false ? <span className="tag red">archiviato</span> : scaduto(e) ? <span className="tag red" title="Validità terminata: rinnova dalla scheda">scaduto il {dataIt(e.scadenza)}</span> : <span className="tag green">attivo</span>}{risById[e.id]?.qrToken && <span className="tag">QR</span>}<TagAssenze e={e} soglia={soglia} /></td>
            </tr>
          ))}
        </tbody></table>
      </div>
      {(selEsp || nuovo) && (
        <SchedaEspositore key={selEsp ? selEsp.id : "nuovo"} esp={selEsp} ris={selEsp ? risById[selEsp.id] : null} posteggiEsp={selEsp ? postEsp(selEsp) : []}
          tutti={{ espositori, posteggi }} auth={auth} onClose={() => { setSel(null); setNuovo(false); }} onCreated={(id, nome) => { setNuovo(false); setSel(id); setQ(""); setFiltro("tutti"); setAvviso(`Espositore "${nome}" creato e pubblicato: la scheda è aperta qui a destra, ora puoi assegnare i posteggi e generare il QR.`); }} />
      )}
    </div>
  );
}

function StampaBlocco({ lista, risById, postEsp }) {
  const { msg, busy, run } = useRun();
  const conToken = lista.filter((e) => risById[e.id]?.qrToken);
  const senza = lista.filter((e) => !risById[e.id]?.qrToken);
  const sotto = (e) => (e.tipo === "spuntista" ? "Spuntista" : postEsp(e).map((p) => p.etichetta).join(" · ")) || (e.referente || "");
  return (<>
    <button className="btn" disabled={busy || !conToken.length} onClick={() => run(() => stampaQr(conToken.map((e) => ({ nome: nomePub(e), sotto: sotto(e), token: risById[e.id].qrToken }))), "Stampa avviata")} title="Stampa i QR degli espositori in elenco che hanno già un codice">Stampa QR ({conToken.length})</button>
    {senza.length > 0 && <button className="btn" disabled={busy} onClick={() => confirm(`Generare il QR per ${senza.length} espositori senza codice?`) && run(async () => { for (const e of senza) await generaToken(e.id, null); }, `Generati ${senza.length} QR`)}>Genera QR mancanti ({senza.length})</button>}
    {msg && <span className="muted">{msg.t}</span>}
  </>);
}

function SezioneQr({ esp, ris, sotto, auth, run, busy }) {
  const token = ris?.qrToken || null;
  const [img, setImg] = useState(null);
  useEffect(() => { let ok = true; if (token) qrDataUrl(token).then((u) => ok && setImg(u)); else setImg(null); return () => { ok = false; }; }, [token]);
  return (
    <>
      <div className="sec">QR code presenza</div>
      {token ? (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {img && <img src={img} alt="QR" style={{ width: 120, height: 120, border: "1px solid var(--border)", borderRadius: 8 }} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="muted" style={{ overflowWrap: "anywhere", fontSize: 11 }}>{urlQr(token)}</div>
            <div className="actions">
              <button className="btn sm" disabled={busy} onClick={() => run(() => stampaQr([{ nome: nomePub(esp), sotto, token }]), "Stampa avviata")}>Stampa</button>
              <button className="btn sm" disabled={busy} onClick={() => navigator.clipboard?.writeText(urlQr(token)).then(() => run(async () => {}, "Link copiato")).catch(() => run(async () => { throw new Error("Copia non riuscita: seleziona e copia il link a mano"); }, ""))}>Copia link</button>
              {auth.isSuap && <button className="btn sm" disabled={busy} onClick={() => confirm("Rigenerare il QR? Quello stampato finora smetterà di funzionare.") && run(() => generaToken(esp.id, token), "Nuovo QR generato")}>Rigenera</button>}
              {auth.isSuap && <button className="btn sm danger" disabled={busy} onClick={() => confirm("Revocare il QR? L'espositore non potrà più essere registrato con questo codice.") && run(() => revocaToken(esp.id, token), "QR revocato")}>Revoca</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="actions"><button className="btn ocra" disabled={busy} onClick={() => run(() => generaToken(esp.id, null), "QR generato")}>Genera QR</button><span className="muted">Nessun codice ancora rilasciato.</span></div>
      )}
    </>
  );
}

function SchedaEspositore({ esp, ris, posteggiEsp, tutti, auth, onClose, onCreated }) {
  const [pub, setPub] = useState({ ...VUOTO, ...(esp ? Object.fromEntries(Object.keys(VUOTO).map((k) => [k, esp[k] ?? VUOTO[k]])) : {}) });
  const [r, setR] = useState({ ...VUOTO_RIS, ...(ris ? Object.fromEntries(Object.keys(VUOTO_RIS).map((k) => [k, ris[k] ?? ""])) : {}) });
  const { msg, setMsg, busy, run } = useRun(); const [assegna, setAssegna] = useState("");
  const set = (k) => (e) => setPub((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const setRis = (k) => (e) => setR((p) => ({ ...p, [k]: e.target.value }));
  const { byPost } = usaAssegnazioni(tutti.espositori);
  const liberi = useMemo(() => tutti.posteggi.filter((p) => !byPost[p.id]).sort(ordinaPosteggi), [tutti.posteggi, byPost]);
  const spuntista = pub.tipo === "spuntista";
  const sotto = spuntista ? "Spuntista" : posteggiEsp.map((p) => p.etichetta).join(" · ") || (esp?.referente || "");
  async function salva() {
    if (!pub.denominazione.trim()) { setMsg({ ok: false, t: "La denominazione è obbligatoria" }); return; }
    if (pub.descrizione && pub.descrizione.length > 500) { setMsg({ ok: false, t: "La descrizione può avere al massimo 500 caratteri" }); return; }
    const dati = { ...pub, mercati: esp?.mercati || ["area-mercatale"], settori: esp?.settori || [], posteggi: spuntista ? [] : (esp?.posteggi || []) };
    if (esp) {
      await run(async () => {
        await salvaEspositore(esp.id, dati, r, auth.isSuap);
        await rebuildPubblico(tutti.espositori.map((e) => (e.id === esp.id ? { ...e, ...dati } : e)), tutti.posteggi);
      }, "Salvato e pubblicato");
    } else {
      const id = await run(async () => {
        const nid = await nuovoEspositore(dati, r, auth.isSuap, tutti.espositori);
        await rebuildPubblico([...tutti.espositori, { id: nid, ...dati }], tutti.posteggi);
        return nid;
      }, "Espositore creato");
      if (id) onCreated(id, dati.alias || dati.denominazione);
    }
  }
  const cambia = (fn, okMsg) => run(async () => { const agg = await fn(); await rebuildPubblico(agg, tutti.posteggi); setAssegna(""); }, okMsg);
  const annoRinnovo = () => { const y = new Date().getFullYear(); return oggi() > `${y}-12-31` ? y + 1 : y; };
  const rinnova = () => run(async () => {
    const scad = `${annoRinnovo()}-12-31`;
    await salvaEspositore(esp.id, { scadenza: scad }, null, false);
    setPub((p) => ({ ...p, scadenza: scad }));
    await rebuildPubblico(tutti.espositori.map((e) => (e.id === esp.id ? { ...e, scadenza: scad } : e)), tutti.posteggi);
  }, `Validità rinnovata fino al 31/12/${annoRinnovo()}`);
  const archivia = () => confirm(esp.attivo === false ? "Riattivare l'espositore?" : "Archiviare l'espositore? Sparisce dall'app e dagli elenchi, i posteggi restano assegnati finché non li liberi.") &&
    run(async () => { await archiviaEspositore(esp.id, esp.attivo === false); await rebuildPubblico(tutti.espositori.map((e) => (e.id === esp.id ? { ...e, attivo: esp.attivo === false } : e)), tutti.posteggi); }, esp.attivo === false ? "Riattivato" : "Archiviato");
  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>{esp ? nomePub(esp) : "Nuovo espositore"}</h3><button className="btn sm" onClick={onClose}>Chiudi</button></div>
      {esp && <div className="muted" style={{ marginBottom: 10 }}>id {esp.id}{esp.attivo === false && " · archiviato"}</div>}
      {esp && esp.assenze && !spuntista && (
        <div className={"msg " + (esp.assenze.consecutive > 0 ? "err" : "ok")} style={{ fontSize: 12 }}>
          <b>Assenze consecutive in corso: {esp.assenze.consecutive}</b>{esp.assenze.dal ? ` (dal ${dataIt(esp.assenze.dal)})` : ""} · serie più lunga del {esp.assenze.anno}: {esp.assenze.massimo}{esp.assenze.dalMassimo ? ` (dal ${dataIt(esp.assenze.dalMassimo)})` : ""} · ultima presenza: {esp.assenze.ultimaPresenza ? dataIt(esp.assenze.ultimaPresenza) : "nessuna"} · su {esp.assenze.giornate} giornate svolte, aggiornato al {dataIt(esp.assenze.calcolatoIl)}
        </div>
      )}
      {esp && scaduto(esp) && esp.attivo !== false && (
        <div className="msg err" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span><b>Scaduto il {dataIt(esp.scadenza)}.</b> {spuntista ? "Non compare più tra gli spuntisti nell'app finché non viene rinnovato." : "La concessione risulta scaduta."} L'anagrafica resta: per riattivarlo basta rinnovare la validità.</span>
          {auth.isSuap && <button className="btn sm ocra" disabled={busy} onClick={() => rinnova()}>Rinnova al 31/12/{annoRinnovo()}</button>}
        </div>
      )}
      <div className="sec" style={{ borderTop: "none", paddingTop: 0 }}>Anagrafica</div>
      <div className="row2">
        <div className="field"><label>Tipo</label><select value={pub.tipo} onChange={set("tipo")}>{TIPI.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="field"><label>Qualifica SUAP</label><select value={pub.qualifica || ""} onChange={set("qualifica")}><option value="">—</option>{QUALIFICHE.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
      </div>
      <div className="field"><label>Denominazione (ragione sociale, ditta, società) *</label><input type="text" value={pub.denominazione} onChange={set("denominazione")} /></div>
      <div className="field"><label>Alias mostrato al pubblico (facoltativo)</label><input type="text" value={pub.alias} onChange={set("alias")} placeholder="Se vuoto si usa la denominazione" /></div>
      <div className="row2">
        <div className="field"><label>Referente</label><input type="text" value={pub.referente} onChange={set("referente")} /></div>
        <div className="field"><label>Email</label><input type="email" value={pub.email} onChange={set("email")} /></div>
      </div>
      <div className="row2">
        <div className="field"><label>WhatsApp / telefono (con prefisso, es. 393331234567)</label><input type="text" value={pub.whatsapp} onChange={set("whatsapp")} /></div>
        <div className="field"><label>Telegram (@utente)</label><input type="text" value={pub.telegram} onChange={set("telegram")} /></div>
      </div>
      <div className="row2">
        <div className="field"><label>Categoria merceologica</label><input type="text" value={pub.categoria} onChange={set("categoria")} placeholder="es. Abbigliamento, Ortofrutta…" /></div>
        <div className="field"><label>{spuntista ? "Valido fino al (elenco spuntisti)" : "Scadenza concessione"}</label><input type="date" value={pub.scadenza || ""} onChange={set("scadenza")} />{!spuntista && !pub.scadenza && <div className="muted">Se vuota: {dataIt(SCADENZA_FISSI)}</div>}</div>
      </div>
      <div className="field"><label>Descrizione (cosa espone, marchi… max 500 caratteri) <span className="muted">{(pub.descrizione || "").length}/500</span></label><textarea value={pub.descrizione} onChange={set("descrizione")} maxLength={500} /></div>
      <div className="field"><label><input type="checkbox" checked={pub.visibile !== false} onChange={set("visibile")} /> Visibile nell'app (privacy: se disattivato non compaiono nome, contatti e descrizione; il posteggio risulta occupato)</label></div>
      {auth.isSuap && (<>
        <div className="sec">Dati riservati (solo admin e SUAP)</div>
        <div className="field"><label>Cognome e nome (come da elenco)</label><input type="text" value={r.cognomeNome} onChange={setRis("cognomeNome")} /></div>
        <div className="row2">
          <div className="field"><label>Codice fiscale</label><input type="text" value={r.codiceFiscale} onChange={setRis("codiceFiscale")} /></div>
          <div className="field"><label>Partita IVA</label><input type="text" value={r.partitaIva} onChange={setRis("partitaIva")} /></div>
        </div>
        <div className="row2">
          <div className="field"><label>Indirizzo</label><input type="text" value={r.indirizzo} onChange={setRis("indirizzo")} /></div>
          <div className="field"><label>Comune</label><input type="text" value={r.comune} onChange={setRis("comune")} /></div>
        </div>
        <div className="row2">
          <div className="field"><label>PEC</label><input type="text" value={r.pec} onChange={setRis("pec")} /></div>
          <div className="field"><label>Richiesta: data e protocollo</label><div style={{ display: "flex", gap: 6 }}><input type="date" value={r.dataRichiesta || ""} onChange={setRis("dataRichiesta")} /><input type="text" value={r.protocollo} onChange={setRis("protocollo")} placeholder="prot." style={{ width: 90 }} /></div></div>
        </div>
        <div className="field"><label>Note interne</label><textarea value={r.noteInterne} onChange={setRis("noteInterne")} style={{ minHeight: 56 }} /></div>
      </>)}
      <Msg m={msg} />
      <div className="actions">
        <button className="btn primary" disabled={busy} onClick={salva}>{busy ? "Salvataggio…" : esp ? "Salva" : "Crea espositore"}</button>
        {esp && auth.isSuap && <button className="btn danger" disabled={busy} onClick={archivia}>{esp.attivo === false ? "Riattiva" : "Archivia"}</button>}
      </div>
      {esp && auth.isSuap && <SezioneQr esp={esp} ris={ris} sotto={sotto} auth={auth} run={run} busy={busy} />}
      {esp && auth.isSuap && FOTO_ABILITATE && <SezioneFoto esp={esp} run={run} busy={busy} />}
      {esp && !spuntista && (<>
        <div className="sec">Posteggi assegnati</div>
        {posteggiEsp.length === 0 && <div className="muted">Nessun posteggio.</div>}
        {posteggiEsp.map((p) => (
          <div key={p.id} className="listline"><span><b>{p.id}</b> <span className="muted">{p.etichetta}{sup(p) ? ` · ${sup(p)} m` : ""}</span></span>
            {auth.isSuap && <button className="btn sm danger" disabled={busy} onClick={() => cambia(() => liberaPosteggio(tutti.espositori, esp.id, p.id), "Posteggio liberato")}>Libera</button>}</div>
        ))}
        {auth.isSuap && <div className="field" style={{ marginTop: 10 }}><label>Assegna un posteggio libero (anche più di uno)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={assegna} onChange={(e) => setAssegna(e.target.value)}>
              <option value="">— scegli —</option>
              {MERCATI.map((m) => <optgroup key={m.id} label={m.nome}>{liberi.filter((p) => p.mercato === m.id).map((p) => <option key={p.id} value={p.id}>{p.id} · {p.etichetta}{sup(p) ? ` · ${sup(p)}` : ""}</option>)}</optgroup>)}
            </select>
            <button className="btn" disabled={!assegna || busy} onClick={() => cambia(() => assegnaPosteggio(tutti.espositori, esp.id, assegna), "Posteggio assegnato")}>Assegna</button>
          </div>
        </div>}
      </>)}
      {esp && spuntista && <div className="muted" style={{ marginTop: 12 }}>Gli spuntisti non hanno posteggio fisso: il sabato l'operatore di controllo assegna loro un posteggio libero dall'app.</div>}
    </div>
  );
}

function SezioneFoto({ esp, run, busy }) {
  const foto = esp.foto || [];
  async function aggiungi(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    await run(async () => { const url = await caricaFoto(esp.id, file, foto.length + 1); await salvaFotoEspositore(esp.id, [...foto, url]); }, "Foto caricata");
    e.target.value = "";
  }
  const rimuovi = (url) => run(async () => { await eliminaFoto(url); await salvaFotoEspositore(esp.id, foto.filter((u) => u !== url)); }, "Foto rimossa");
  return (
    <>
      <div className="sec">Foto della bancarella (max 3)</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {foto.map((u) => <div key={u} style={{ position: "relative" }}><img src={u} alt="" style={{ width: 110, height: 82, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} /><button className="btn sm danger" style={{ position: "absolute", top: 4, right: 4, padding: "2px 6px" }} disabled={busy} onClick={() => rimuovi(u)}>✕</button></div>)}
        {foto.length < 3 && <label className="btn" style={{ cursor: "pointer" }}>+ Aggiungi foto<input type="file" accept="image/*" style={{ display: "none" }} onChange={aggiungi} disabled={busy} /></label>}
      </div>
    </>
  );
}

// ------------------------------------------------------------ RICHIESTE (self-service espositori)
function Richieste({ auth, richieste }) {
  const { rows: espositori } = useCollection("espositori");
  const { rows: posteggi } = useCollection("posteggi");
  const [filtro, setFiltro] = useState("in-attesa"); const { msg, busy, run } = useRun();
  const [scelte, setScelte] = useState({});
  const espById = useMemo(() => Object.fromEntries(espositori.map((e) => [e.id, e])), [espositori]);
  const lista = richieste.filter((r) => filtro === "tutte" || r.stato === filtro).sort((a, b) => (b.creato?.seconds || 0) - (a.creato?.seconds || 0));
  const campiScelti = (r) => scelte[r._id] || CAMPI_RICHIESTA.filter((k) => (r[k] || "").trim() !== "" && (r[k] || "").trim() !== (espById[r.espositoreId]?.[k] || ""));
  const toggle = (r, k) => setScelte((s) => { const cur = new Set(campiScelti(r)); cur.has(k) ? cur.delete(k) : cur.add(k); return { ...s, [r._id]: [...cur] }; });
  const approva = (r) => run(async () => {
    const campi = campiScelti(r);
    const upd = await approvaRichiesta(r, campi, auth.user.email);
    await rebuildPubblico(espositori.map((e) => (e.id === r.espositoreId ? { ...e, ...upd } : e)), posteggi);
  }, "Richiesta approvata e pubblicata");
  const quando = (r) => (r.creato?.toDate ? r.creato.toDate().toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "");
  return (
    <div>
      <h2>Richieste degli espositori <span className="count">{lista.length}</span></h2>
      <div className="toolbar"><div className="tabs">{[["in-attesa", "In attesa"], ["approvata", "Approvate"], ["rifiutata", "Rifiutate"], ["tutte", "Tutte"]].map(([v, l]) => <button key={v} className={filtro === v ? "active" : ""} onClick={() => setFiltro(v)}>{l}</button>)}</div></div>
      <p className="muted">Arrivano dal modulo "Aggiorna la tua scheda" che l'espositore trova aprendo il proprio QR. Approvando, i campi selezionati sostituiscono quelli attuali e vengono pubblicati.</p>
      <Msg m={msg} />
      {lista.length === 0 && <div className="card muted">Nessuna richiesta.</div>}
      {lista.map((r) => { const e = espById[r.espositoreId]; const sel = new Set(campiScelti(r)); return (
        <div key={r._id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div><b>{e ? nomePub(e) : r.espositoreId}</b> <span className="muted">{e?.referente}</span></div>
            <div className="muted">{quando(r)} · <span className={"tag " + (r.stato === "in-attesa" ? "" : r.stato === "approvata" ? "green" : "red")}>{r.stato}</span></div>
          </div>
          <table className="grid" style={{ marginTop: 10 }}><thead><tr><th></th><th>Campo</th><th>Attuale</th><th>Proposto</th></tr></thead><tbody>
            {CAMPI_RICHIESTA.map((k) => (
              <tr key={k}><td>{r.stato === "in-attesa" && <input type="checkbox" checked={sel.has(k)} onChange={() => toggle(r, k)} />}</td><td><b>{k}</b></td><td className="muted">{e?.[k] || "—"}</td><td style={{ fontWeight: (r[k] || "") !== (e?.[k] || "") ? 700 : 400 }}>{r[k] || "—"}</td></tr>
            ))}
          </tbody></table>
          {r.stato === "in-attesa" && <div className="actions">
            <button className="btn primary" disabled={busy || sel.size === 0} onClick={() => approva(r)}>Approva {sel.size} campi e pubblica</button>
            <button className="btn danger" disabled={busy} onClick={() => run(() => rifiutaRichiesta(r, auth.user.email, ""), "Richiesta rifiutata")}>Rifiuta</button>
          </div>}
          {r.stato !== "in-attesa" && <div className="muted" style={{ marginTop: 8 }}>Gestita da {r.gestitaDa}{r.campiApplicati ? ` · campi: ${r.campiApplicati.join(", ")}` : ""}</div>}
        </div>
      ); })}
    </div>
  );
}

// ------------------------------------------------------------ POSTEGGI
function Posteggi({ auth }) {
  const { rows: posteggi } = useCollection("posteggi");
  const { rows: espositori } = useCollection("espositori");
  const [mercato, setMercato] = useState("area-mercatale"); const [q, setQ] = useState(""); const [solo, setSolo] = useState("tutti");
  const [edit, setEdit] = useState(null); const { msg, busy, run } = useRun();
  const espById = useMemo(() => Object.fromEntries(espositori.map((e) => [e.id, e])), [espositori]);
  const { byPost } = usaAssegnazioni(espositori);
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return posteggi.filter((p) => p.mercato === mercato)
      .filter((p) => solo === "tutti" || (solo === "liberi" ? !byPost[p.id] : !!byPost[p.id]))
      .filter((p) => !t || [p.id, p.etichetta, p.note, byPost[p.id] && nomePub(espById[byPost[p.id]])].some((v) => v && String(v).toLowerCase().includes(t)))
      .sort(ordinaPosteggi);
  }, [posteggi, mercato, q, solo, espById, byPost]);
  const cambia = (p, espId) => run(async () => {
    const agg = espId ? await assegnaPosteggio(espositori, espId, p.id) : await liberaPosteggio(espositori, byPost[p.id], p.id);
    await rebuildPubblico(agg, posteggi);
    setEdit(null);
  }, espId ? `${p.id} assegnato` : `${p.id} liberato`);
  const salvaNota = (p, note) => run(async () => { await notaPosteggio(p.id, note); await rebuildPubblico(espositori, posteggi.map((x) => (x.id === p.id ? { ...x, note } : x))); }, "Nota salvata");
  const tot = posteggi.filter((p) => p.mercato === mercato); const occ = tot.filter((p) => byPost[p.id]).length;
  const fissi = espositori.filter((e) => e.tipo !== "spuntista" && e.attivo !== false);
  return (
    <div>
      <h2>Posteggi <span className="count">{occ} assegnati · {tot.length - occ} liberi</span></h2>
      <div className="toolbar">
        <div className="tabs">{MERCATI.map((m) => <button key={m.id} className={mercato === m.id ? "active" : ""} onClick={() => setMercato(m.id)}>{m.nome}</button>)}</div>
        <input type="search" placeholder="Cerca posteggio o espositore…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={solo} onChange={(e) => setSolo(e.target.value)} style={{ width: "auto" }}><option value="tutti">Tutti</option><option value="liberi">Solo liberi</option><option value="assegnati">Solo assegnati</option></select>
      </div>
      <Msg m={msg} />
      <table className="grid"><thead><tr><th>Posteggio</th><th>Espositore</th><th>Stato</th><th>Superficie</th><th>Note</th><th></th></tr></thead><tbody>
        {lista.map((p) => { const eid = byPost[p.id]; return (
          <tr key={p.id}>
            <td><b>{p.id}</b><div className="muted">{p.etichetta}</div></td>
            <td>{edit === p.id ? (
              <SelezionaEspositore espositori={fissi} onPick={(id) => cambia(p, id)} onCancel={() => setEdit(null)} />
            ) : eid ? <>{nomePub(espById[eid]) || eid}<div className="muted">{espById[eid]?.referente}{(espById[eid]?.posteggi || []).length > 1 && ` · ${espById[eid].posteggi.length} posteggi`}</div></> : <span className="muted">libero</span>}</td>
            <td>{eid ? <span className="tag green">assegnato</span> : <span className="tag grey">vacante</span>}{p.inElenco === false && <span className="tag red">non in elenco</span>}</td>
            <td className="muted">{sup(p) || "—"}</td>
            <td><NotaInline valore={p.note || ""} onSave={(v) => salvaNota(p, v)} disabled={!auth.isSuap || busy} /></td>
            <td style={{ whiteSpace: "nowrap" }}>{auth.isSuap && (eid
              ? <button className="btn sm danger" disabled={busy} onClick={() => cambia(p, null)}>Libera</button>
              : edit !== p.id && <button className="btn sm" disabled={busy} onClick={() => setEdit(p.id)}>Assegna</button>)}</td>
          </tr>
        ); })}
      </tbody></table>
    </div>
  );
}
function SelezionaEspositore({ espositori, onPick, onCancel }) {
  const [t, setT] = useState("");
  const hits = t.trim().length >= 2 ? espositori.filter((e) => [e.denominazione, e.alias, e.referente].some((v) => v && v.toLowerCase().includes(t.toLowerCase()))).slice(0, 8) : [];
  return (
    <div>
      <input type="search" autoFocus placeholder="Scrivi il nome dell'espositore fisso…" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onCancel()} />
      {hits.map((e) => <div key={e.id} className="listline" style={{ cursor: "pointer" }} onClick={() => onPick(e.id)}><span>{nomePub(e)} <span className="muted">{e.referente}{(e.posteggi || []).length ? ` · ha già ${e.posteggi.join(", ")}` : ""}</span></span><span className="tag">scegli</span></div>)}
      <button className="btn sm" style={{ marginTop: 6 }} onClick={onCancel}>Annulla</button>
    </div>
  );
}
function NotaInline({ valore, onSave, disabled }) {
  const [v, setV] = useState(valore); const [ed, setEd] = useState(false);
  if (!ed) return <span className="muted" style={{ cursor: disabled ? "default" : "pointer" }} onClick={() => !disabled && setEd(true)}>{valore || "＋ nota"}</span>;
  return <span style={{ display: "flex", gap: 6 }}><input type="text" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onSave(v); setEd(false); } if (e.key === "Escape") setEd(false); }} autoFocus /><button className="btn sm" onClick={() => { onSave(v); setEd(false); }}>OK</button></span>;
}

// ------------------------------------------------------------ IMPOSTAZIONI E CALENDARIO
function Impostazioni({ auth }) {
  const { rows: mercati } = useCollection("mercati");
  const [mercato, setMercato] = useState("area-mercatale");
  const imp = useDocumento("impostazioni", mercato);
  const { rows: calendario } = useCollection("calendario");
  const m = mercati.find((x) => x.id === mercato) || MERCATI.find((x) => x.id === mercato);
  return (
    <div>
      <h2>Impostazioni e calendario</h2>
      <div className="toolbar"><div className="tabs">{MERCATI.map((x) => <button key={x.id} className={mercato === x.id ? "active" : ""} onClick={() => setMercato(x.id)}>{x.nome}</button>)}</div></div>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", alignItems: "start" }}>
        <SchedaImpostazioni key={mercato + (imp ? "1" : "0")} mercatoId={mercato} imp={imp} auth={auth} />
        <Calendario mercato={m} voci={calendario.filter((c) => c.mercato === mercato)} auth={auth} />
      </div>
    </div>
  );
}
function SchedaImpostazioni({ mercatoId, imp, auth }) {
  const [f, setF] = useState({ ...IMPOSTAZIONI_DEFAULT, ...(imp || {}) });
  const { msg, busy, run } = useRun();
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.type === "number" ? Number(e.target.value) : e.target.value }));
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 10px" }}>Regole del mercato</h3>
      <div className="field"><label><input type="checkbox" checked={!!f.registroPresenze} onChange={set("registroPresenze")} /> Registro presenze attivo (l'app mostra presente/assente e l'operatore registra le presenze)</label></div>
      <div className="row2">
        <div className="field"><label>Ora limite di spunta</label><input type="time" value={f.oraLimiteSpunta} onChange={set("oraLimiteSpunta")} /><div className="muted">Entro quest'ora i fissi devono presentarsi: dopo, chi non si è presentato risulta assente per la giornata e il suo posteggio può essere dato a uno spuntista.</div></div>
        <div className="field"><label>Ora di azzeramento</label><input type="time" value={f.oraAzzeramento} onChange={set("oraAzzeramento")} /><div className="muted">Dopo quest'ora nell'app tutti risultano assenti, pronti per la giornata successiva.</div></div>
      </div>
      <div className="field"><label>Assenze consecutive massime (fissi)</label><input type="number" min="0" value={f.assenzeMassime} onChange={set("assenzeMassime")} style={{ width: 120 }} /><div className="muted">Serie di giornate di mercato consecutive in cui il fisso è assente: oltre questa soglia la concessione è revocabile. Le giornate soppresse dal SUAP non contano e non interrompono la serie. Il contatore di ogni espositore è aggiornato automaticamente dopo ogni giornata; 0 = nessuna soglia.</div></div>
      <Msg m={msg} />
      {auth.isSuap && <div className="actions"><button className="btn primary" disabled={busy} onClick={() => run(() => salvaImpostazioni(mercatoId, f), "Impostazioni salvate: l'app le applica subito")}>Salva</button></div>}
    </div>
  );
}
function Calendario({ mercato, voci, auth }) {
  const [f, setF] = useState({ tipo: "soppresso", data: "", dataNuova: "", motivo: "", avviso: "" });
  const { msg, setMsg, busy, run } = useRun();
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const lista = voci.slice().sort((a, b) => b.data.localeCompare(a.data));
  async function aggiungi() {
    if (!f.data) { setMsg({ ok: false, t: "Indica la data" }); return; }
    if (f.tipo === "spostato" && !f.dataNuova) { setMsg({ ok: false, t: "Indica la nuova data" }); return; }
    await run(() => salvaVoceCalendario({ mercato: mercato.id, tipo: f.tipo, data: f.data, dataNuova: f.tipo === "spostato" ? f.dataNuova : null, motivo: f.motivo.trim(), avviso: f.avviso.trim() }), "Voce salvata: l'app mostra l'avviso nella settimana interessata");
    setF({ tipo: "soppresso", data: "", dataNuova: "", motivo: "", avviso: "" });
  }
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 4px" }}>Calendario: giornate spostate, soppresse, straordinarie</h3>
      <div className="muted" style={{ marginBottom: 10 }}>Di norma il mercato si svolge {mercato?.giorni ? mercato.giorni.join(", ") : "nei giorni indicati in Mercati"}. Le giornate soppresse non contano come assenze; quelle spostate valgono nella nuova data.</div>
      {auth.isSuap && (<>
        <div className="row2">
          <div className="field"><label>Tipo</label><select value={f.tipo} onChange={set("tipo")}>{TIPI_CALENDARIO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="field"><label>{f.tipo === "straordinario" ? "Data dell'apertura" : "Giornata di mercato interessata"}</label><input type="date" value={f.data} onChange={set("data")} /></div>
        </div>
        {f.tipo === "spostato" && <div className="field"><label>Nuova data</label><input type="date" value={f.dataNuova} onChange={set("dataNuova")} /></div>}
        <div className="field"><label>Motivo (festivo, maltempo, forza maggiore…)</label><input type="text" value={f.motivo} onChange={set("motivo")} /></div>
        <div className="field"><label>Avviso per l'app (facoltativo, altrimenti viene composto in automatico)</label><input type="text" value={f.avviso} onChange={set("avviso")} placeholder="es. Sabato 26/09 il mercato è sospeso per allerta meteo" /></div>
        <Msg m={msg} />
        <div className="actions"><button className="btn primary" disabled={busy} onClick={aggiungi}>Aggiungi al calendario</button></div>
      </>)}
      <div className="sec">Voci registrate</div>
      {lista.length === 0 && <div className="muted">Nessuna eccezione al calendario.</div>}
      {lista.map((v) => (
        <div key={v._id} className="listline">
          <span><b>{dataIt(v.data)}</b> <span className={"tag " + (v.tipo === "soppresso" ? "red" : v.tipo === "spostato" ? "" : "green")}>{v.tipo}</span>{v.dataNuova && <> → <b>{dataIt(v.dataNuova)}</b></>}<span className="muted"> {v.motivo}</span>{v.avviso && <div className="muted">"{v.avviso}"</div>}</span>
          {auth.isSuap && <button className="btn sm danger" disabled={busy} onClick={() => confirm("Eliminare questa voce?") && run(() => eliminaVoceCalendario(v._id), "Voce eliminata")}>Elimina</button>}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ REPORT PRESENZE
const inizioAnno = () => `${new Date().getFullYear()}-01-01`;
function Report({ auth }) {
  const { rows: espositori } = useCollection("espositori");
  const { rows: mercati } = useCollection("mercati");
  const { rows: calendario } = useCollection("calendario");
  const { rows: staff } = useCollection("staff", auth.isSuap);
  const [mercato, setMercato] = useState("area-mercatale");
  const imp = useDocumento("impostazioni", mercato);
  const [da, setDa] = useState(inizioAnno()); const [a, setA] = useState(oggi());
  const [fEsp, setFEsp] = useState(""); const [fPost, setFPost] = useState(""); const [fOp, setFOp] = useState(""); const [vista, setVista] = useState("riepilogo"); const [soloOltre, setSoloOltre] = useState(false);
  const [presenze, setPresenze] = useState(null); const { msg, busy, run } = useRun();
  const m = mercati.find((x) => x.id === mercato);
  const espById = useMemo(() => Object.fromEntries(espositori.map((e) => [e.id, e])), [espositori]);
  const carica = () => run(async () => setPresenze(await caricaPresenze(da, a)), "Presenze caricate");
  const { giornate, soppresse } = useMemo(() => (m ? giornateMercato(m, calendario, da, a) : { giornate: [], soppresse: [] }), [m, calendario, da, a]);
  const filtrate = useMemo(() => (presenze || []).filter((p) => p.mercato === mercato)
    .filter((p) => !fEsp || p.espositoreId === fEsp).filter((p) => !fPost || p.posteggioId === fPost).filter((p) => !fOp || (p.operatore && p.operatore.uid === fOp)), [presenze, mercato, fEsp, fPost, fOp]);
  const riepilogo = useMemo(() => presenze ? riepilogoEspositori({ presenze: filtrate, espositori: espositori.filter((e) => !fEsp || e.id === fEsp), giornate, mercatoId: mercato, assenzeMassime: imp?.assenzeMassime ?? IMPOSTAZIONI_DEFAULT.assenzeMassime, fino: a }).filter((r) => !soloOltre || r.oltreSoglia) : [], [presenze, filtrate, espositori, giornate, mercato, imp, fEsp, soloOltre, a]);
  const ricalcola = () => run(async () => { const r = await ricalcolaContatori({ espositori, mercato: m, calendario }); return r; }, "Contatori delle assenze consecutive aggiornati");
  const registro = useMemo(() => righeRegistro(filtrate, espById), [filtrate, espById]);
  const posteggiUsati = useMemo(() => [...new Set((presenze || []).map((p) => p.posteggioId).filter(Boolean))].sort(), [presenze]);
  const titolo = `Presenze ${m ? m.nome : mercato}`;
  const args = { titolo, sottotitolo: "Comune di Maglie · registro delle presenze certificate dagli operatori di controllo", riepilogo, registro, giornate, soppresse, periodo: { da, a }, assenzeMassime: imp?.assenzeMassime };
  return (
    <div>
      <h2>Report presenze</h2>
      <div className="toolbar">
        <div className="tabs">{MERCATI.map((x) => <button key={x.id} className={mercato === x.id ? "active" : ""} onClick={() => setMercato(x.id)}>{x.nome}</button>)}</div>
        <label className="muted">dal <input type="date" value={da} onChange={(e) => setDa(e.target.value)} style={{ width: "auto" }} /></label>
        <label className="muted">al <input type="date" value={a} onChange={(e) => setA(e.target.value)} style={{ width: "auto" }} /></label>
        <button className="btn primary" disabled={busy} onClick={carica}>{busy ? "Carico…" : "Carica presenze"}</button>
      </div>
      {presenze && (<>
        <div className="toolbar">
          <select value={fEsp} onChange={(e) => setFEsp(e.target.value)} style={{ width: "auto", maxWidth: 280 }}><option value="">Tutti gli espositori</option>{espositori.slice().sort((x, y) => nomePub(x).localeCompare(nomePub(y))).map((e) => <option key={e.id} value={e.id}>{nomePub(e)}{e.tipo === "spuntista" ? " (spuntista)" : ""}</option>)}</select>
          <select value={fPost} onChange={(e) => setFPost(e.target.value)} style={{ width: "auto" }}><option value="">Tutti i posteggi</option>{posteggiUsati.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          <select value={fOp} onChange={(e) => setFOp(e.target.value)} style={{ width: "auto" }}><option value="">Tutti gli operatori</option>{staff.map((s) => <option key={s._id} value={s._id}>{[s.nome, s.cognome].filter(Boolean).join(" ") || s.email}</option>)}</select>
          <div className="tabs">{[["riepilogo", "Riepilogo per espositore"], ["registro", "Registro presenze"]].map(([v, l]) => <button key={v} className={vista === v ? "active" : ""} onClick={() => setVista(v)}>{l}</button>)}</div>
          {vista === "riepilogo" && <label className="muted"><input type="checkbox" checked={soloOltre} onChange={(e) => setSoloOltre(e.target.checked)} /> solo oltre soglia</label>}
          {mercato === "area-mercatale" && <button className="btn" disabled={busy || !m} onClick={ricalcola} title="Ricalcola e salva su ogni espositore fisso la serie di assenze consecutive">Aggiorna contatori</button>}
          <button className="btn" onClick={() => run(async () => esportaExcel(args), "File Excel generato")}>Excel</button>
          <button className="btn" onClick={() => run(async () => stampaReport(args), "Stampa avviata (salva come PDF)")}>PDF</button>
        </div>
        <p className="muted">Periodo {dataIt(da)} – {dataIt(a)}: <b>{giornate.length}</b> giornate di mercato svolte{soppresse.length ? <>, <b>{soppresse.length}</b> soppresse ({soppresse.map((s) => dataIt(s.data)).join(", ")})</> : ""} · {filtrate.filter((p) => !p.annullata).length} presenze certificate{imp?.assenzeMassime ? ` · soglia ${imp.assenzeMassime} assenze consecutive` : ""}. Le assenze dei fissi sono calcolate sulle giornate svolte: le soppresse non contano e non interrompono la serie.</p>
        <Msg m={msg} />
        {vista === "riepilogo" && (
          <table className="grid"><thead><tr><th>Espositore</th><th>Tipo</th><th>Posteggi</th><th>Presenze</th><th>Assenze totali</th><th>Consecutive in corso</th><th>Serie massima</th><th>Ultima</th></tr></thead><tbody>
            {riepilogo.map((r) => <tr key={r.id} style={r.oltreSoglia ? { background: "var(--rosso-assenza-tint)" } : undefined}>
              <td><b>{r.nome}</b>{r.oltreSoglia && <span className="tag red">oltre soglia</span>}</td><td className="muted">{r.tipo}</td><td className="muted">{r.posteggi}</td><td>{r.presenze}</td><td>{r.assenze ?? "—"}</td><td>{r.consecutive ?? "—"}{r.dal ? <div className="muted">dal {dataIt(r.dal)}</div> : null}</td><td>{r.massimoConsecutive ?? "—"}</td><td className="muted">{dataIt(r.ultima)}</td>
            </tr>)}
          </tbody></table>
        )}
        {vista === "registro" && (
          <table className="grid"><thead><tr><th>Data</th><th>Ora</th><th>Espositore</th><th>Posteggio</th><th>Metodo</th><th>Operatore</th><th>GPS</th><th></th></tr></thead><tbody>
            {registro.map((r) => <tr key={r._id} style={r.annullata ? { opacity: 0.5, textDecoration: "line-through" } : undefined}>
              <td>{dataIt(r.data)}</td><td>{r.ora}</td><td><b>{r.espositore}</b> <span className="muted">{r.tipo}</span></td><td>{r.posteggio}</td><td>{r.metodo}</td><td>{r.operatore}</td><td className="muted">{r.gps}</td>
              <td>{auth.isAdmin && !r.annullata && <button className="btn sm danger" disabled={busy} onClick={() => { const mot = prompt("Motivo dell'annullamento:"); if (mot !== null) run(async () => { await annullaPresenza(r._id, { uid: auth.user.uid, email: auth.user.email, nome: auth.profilo?.nome || "", cognome: auth.profilo?.cognome || "" }, mot); setPresenze((p) => p.map((x) => (x._id === r._id ? { ...x, annullata: true } : x))); }, "Presenza annullata"); }}>Annulla</button>}</td>
            </tr>)}
            {registro.length === 0 && <tr><td colSpan={8} className="muted">Nessuna presenza nel periodo con questi filtri.</td></tr>}
          </tbody></table>
        )}
      </>)}
      {!presenze && <div className="card muted">Scegli mercato e periodo, poi "Carica presenze". Le presenze sono i record certificati dagli operatori di controllo (QR o selezione dall'elenco) con data, ora, posteggio, operatore e posizione GPS.</div>}
    </div>
  );
}

// ------------------------------------------------------------ MERCATI (indirizzo, giorni, orari)
function Mercati() {
  const { rows } = useCollection("mercati");
  if (!rows.length) return <div><h2>Mercati</h2><div className="muted">Caricamento…</div></div>;
  const lista = MERCATI.map((m) => rows.find((r) => r.id === m.id) || { id: m.id, nome: m.nome });
  return (
    <div>
      <h2>Mercati</h2>
      <p className="muted">Giorni e orari determinano quando l'app mostra il mercato "aperto" e, con il calendario, le giornate su cui si contano le presenze. Le regole (ora limite, azzeramento, assenze) sono in "Impostazioni e calendario".</p>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {lista.map((m) => <SchedaMercato key={m.id} m={m} />)}
      </div>
    </div>
  );
}
function SchedaMercato({ m }) {
  const [f, setF] = useState({ nome: m.nome || "", indirizzo: m.indirizzo || "", giorniSettimana: m.giorniSettimana || [], apertura: m.apertura || "07:00", chiusura: m.chiusura || "13:00", note: m.note || "" });
  const { msg, setMsg, busy, run } = useRun();
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggleG = (g) => setF((p) => ({ ...p, giorniSettimana: p.giorniSettimana.includes(g) ? p.giorniSettimana.filter((x) => x !== g) : [...p.giorniSettimana, g] }));
  const salva = () => { if (!f.giorniSettimana.length) { setMsg({ ok: false, t: "Seleziona almeno un giorno" }); return; } run(() => salvaMercato(m.id, { ...f, giorni: [testoGiorni(f.giorniSettimana)], orari: testoOrario(f.apertura, f.chiusura) }), "Salvato: l'app si aggiorna subito"); };
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 10px" }}>{m.nome}</h3>
      <div className="field"><label>Nome</label><input type="text" value={f.nome} onChange={set("nome")} /></div>
      <div className="field"><label>Indirizzo</label><input type="text" value={f.indirizzo} onChange={set("indirizzo")} /></div>
      <div className="field"><label>Giorni di mercato</label>
        <div className="tabs">{GIORNI.map(([g, l]) => <button key={g} type="button" className={f.giorniSettimana.includes(g) ? "active" : ""} onClick={() => toggleG(g)}>{l}</button>)}</div>
        <div className="muted" style={{ marginTop: 4 }}>{f.giorniSettimana.length ? testoGiorni(f.giorniSettimana) : "—"}</div>
      </div>
      <div className="row2">
        <div className="field"><label>Apertura</label><input type="time" value={f.apertura} onChange={set("apertura")} /></div>
        <div className="field"><label>Chiusura</label><input type="time" value={f.chiusura} onChange={set("chiusura")} /></div>
      </div>
      <div className="field"><label>Note (visibili solo qui)</label><textarea value={f.note} onChange={set("note")} style={{ minHeight: 56 }} /></div>
      <Msg m={msg} />
      <div className="actions"><button className="btn primary" disabled={busy} onClick={salva}>{busy ? "Salvataggio…" : "Salva"}</button></div>
    </div>
  );
}

// ------------------------------------------------------------ STAFF
const VUOTO_STAFF = { email: "", nome: "", cognome: "", telefono: "", password: "", role: "operatore" };
function Staff() {
  const { rows: staff, error } = useCollection("staff");
  const [f, setF] = useState(VUOTO_STAFF); const { msg, busy, run } = useRun(); const [edit, setEdit] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const lista = staff.slice().sort((a, b) => (a.cognome || a.email).localeCompare(b.cognome || b.email));
  return (
    <div className="split">
      <div>
        <h2>Staff <span className="count">{staff.length} utenti</span></h2>
        {error && <div className="msg err">{error}</div>}
        <table className="grid"><thead><tr><th>Utente</th><th>Contatti</th><th>Ruolo</th><th>Azioni</th></tr></thead><tbody>
          {lista.map((s) => (
            <tr key={s._id} style={s.attivo === false ? { opacity: 0.55 } : undefined}>
              <td>{edit === s._id ? <StaffInline s={s} onSave={(d) => run(async () => { await aggiornaStaff(s._id, d); setEdit(null); }, "Anagrafica aggiornata")} onCancel={() => setEdit(null)} /> : <><b>{[s.nome, s.cognome].filter(Boolean).join(" ") || s.email}</b><div className="muted">{s.email}</div></>}</td>
              <td className="muted">{s.telefono || "—"}</td>
              <td><select value={s.role || ""} onChange={(e) => run(() => aggiornaStaff(s._id, { role: e.target.value || null }), "Ruolo aggiornato")} style={{ width: "auto" }}>
                <option value="">nessuno</option>{RUOLI.map((r) => <option key={r} value={r}>{r}</option>)}</select></td>
              <td style={{ whiteSpace: "nowrap" }}>
                {edit !== s._id && <button className="btn sm" disabled={busy} onClick={() => setEdit(s._id)}>Modifica</button>}{" "}
                <button className="btn sm" disabled={busy} onClick={() => run(() => aggiornaStaff(s._id, { attivo: s.attivo === false }), s.attivo === false ? "Utente riattivato" : "Utente disattivato")}>{s.attivo === false ? "Riattiva" : "Disattiva"}</button>{" "}
                <button className="btn sm" disabled={busy} onClick={() => run(() => inviaReset(s.email), `Email di reimpostazione inviata a ${s.email}`)}>Reset password</button>
              </td>
            </tr>
          ))}
        </tbody></table>
        <Msg m={msg} />
        <p className="muted">Ruoli: <b>admin</b> tutto · <b>suap</b> anagrafiche, posteggi, impostazioni, calendario, report · <b>operatore</b> presenze e spuntisti dall'app. Nome e cognome compaiono nei record di presenza certificati e nei report.</p>
      </div>
      <div className="panel">
        <h3>Nuovo utente</h3>
        <div className="row2">
          <div className="field"><label>Nome</label><input type="text" value={f.nome} onChange={set("nome")} /></div>
          <div className="field"><label>Cognome</label><input type="text" value={f.cognome} onChange={set("cognome")} /></div>
        </div>
        <div className="field"><label>Email (per l'accesso)</label><input type="email" value={f.email} onChange={set("email")} /></div>
        <div className="field"><label>Telefono</label><input type="text" value={f.telefono} onChange={set("telefono")} /></div>
        <div className="field"><label>Password iniziale (min. 6)</label><input type="text" value={f.password} onChange={set("password")} /></div>
        <div className="field"><label>Ruolo</label><select value={f.role} onChange={set("role")}>{RUOLI.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="actions"><button className="btn primary" disabled={busy || !f.email || f.password.length < 6 || !f.nome || !f.cognome} onClick={() => run(async () => { await creaStaff(f); setF(VUOTO_STAFF); }, "Utente creato: comunica email e password iniziale")}>Crea utente</button></div>
        <p className="muted">L'utente può poi cambiare la password da "Account" nel pannello o nell'app.</p>
      </div>
    </div>
  );
}
function StaffInline({ s, onSave, onCancel }) {
  const [d, setD] = useState({ nome: s.nome || "", cognome: s.cognome || "", telefono: s.telefono || "" });
  const set = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));
  return <div style={{ display: "grid", gap: 4 }}>
    <div style={{ display: "flex", gap: 4 }}><input type="text" placeholder="Nome" value={d.nome} onChange={set("nome")} /><input type="text" placeholder="Cognome" value={d.cognome} onChange={set("cognome")} /></div>
    <input type="text" placeholder="Telefono" value={d.telefono} onChange={set("telefono")} />
    <div style={{ display: "flex", gap: 4 }}><button className="btn sm primary" onClick={() => onSave(d)}>Salva</button><button className="btn sm" onClick={onCancel}>Annulla</button></div>
  </div>;
}

// ------------------------------------------------------------ ACCOUNT
function Account({ auth }) {
  const [a, setA] = useState(""); const [n, setN] = useState(""); const [n2, setN2] = useState(""); const { msg, setMsg, busy, run } = useRun();
  const [p, setP] = useState({ nome: auth.profilo?.nome || "", cognome: auth.profilo?.cognome || "", telefono: auth.profilo?.telefono || "" });
  const setPf = (k) => (e) => setP((x) => ({ ...x, [k]: e.target.value }));
  function go() {
    if (n.length < 8) { setMsg({ ok: false, t: "La nuova password deve avere almeno 8 caratteri" }); return; }
    if (n !== n2) { setMsg({ ok: false, t: "Le due password non coincidono" }); return; }
    run(async () => { await auth.cambiaPassword(a, n); setA(""); setN(""); setN2(""); }, "Password aggiornata");
  }
  return (
    <div style={{ maxWidth: 440 }}>
      <h2>Account</h2>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="muted" style={{ marginBottom: 12 }}>{auth.user.email} · ruolo {auth.role}</div>
        {auth.isAdmin ? (<>
          <div className="row2"><div className="field"><label>Nome</label><input type="text" value={p.nome} onChange={setPf("nome")} /></div><div className="field"><label>Cognome</label><input type="text" value={p.cognome} onChange={setPf("cognome")} /></div></div>
          <div className="field"><label>Telefono</label><input type="text" value={p.telefono} onChange={setPf("telefono")} /></div>
          <div className="actions"><button className="btn" disabled={busy} onClick={() => run(() => aggiornaStaff(auth.user.uid, p), "Anagrafica aggiornata (rientra per vederla nel menu)")}>Salva anagrafica</button></div>
        </>) : <div className="muted">{auth.nome || "Nome non impostato"}{auth.profilo?.telefono ? ` · ${auth.profilo.telefono}` : ""} · per modificare l'anagrafica rivolgiti a un amministratore.</div>}
      </div>
      <div className="card">
        <div className="field"><label>Password attuale</label><input type="password" value={a} onChange={(e) => setA(e.target.value)} autoComplete="current-password" /></div>
        <div className="field"><label>Nuova password</label><input type="password" value={n} onChange={(e) => setN(e.target.value)} autoComplete="new-password" /></div>
        <div className="field"><label>Ripeti nuova password</label><input type="password" value={n2} onChange={(e) => setN2(e.target.value)} autoComplete="new-password" /></div>
        <Msg m={msg} />
        <div className="actions"><button className="btn primary" disabled={busy} onClick={go}>Cambia password</button></div>
      </div>
    </div>
  );
}
