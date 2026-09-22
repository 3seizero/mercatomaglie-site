import { useMemo, useState } from "react";
import {
  firebaseReady, MERCATI, SETTORI, TIPI, RUOLI, useAdminAuth, useCollection, rebuildPubblico,
  salvaEspositore, nuovoEspositore, assegnaPosteggio, notaPosteggio, creaStaff, aggiornaStaff, inviaReset,
} from "./api.js";

const sup = (p) => (p && p.superficie && typeof p.superficie === "object") ? p.superficie.raw : (p ? p.superficie : null);
const nomePub = (e) => (e ? (e.alias && e.alias.trim()) || e.denominazione || e.id : "");
const numKey = (v) => { const m = String(v || "").match(/\d+/); return m ? Number(m[0]) : 9999; };
const ordinaPosteggi = (a, b) =>
  a.mercato.localeCompare(b.mercato) || String(a.settore || "").localeCompare(String(b.settore || "")) ||
  numKey(a.fila) - numKey(b.fila) || numKey(a.numero) - numKey(b.numero) || String(a.numero).localeCompare(String(b.numero));
const errore = (e) => ({ "auth/invalid-credential": "Email o password non validi", "auth/wrong-password": "Password errata", "auth/email-already-in-use": "Email già registrata", "auth/weak-password": "Password troppo corta (minimo 6 caratteri)", "permission-denied": "Permesso negato per il tuo ruolo" }[e.code] || e.message || String(e));

export default function App() {
  const auth = useAdminAuth();
  const [page, setPage] = useState("espositori");
  if (!firebaseReady) return <div className="login"><div className="box"><h1>Backend non configurato</h1><p>Manca app-src/.env.local con la configurazione Firebase.</p></div></div>;
  if (auth.loading) return <div className="login"><p>Caricamento…</p></div>;
  if (!auth.user || !auth.isSuap) return <Login auth={auth} />;
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Mercati di Maglie<small>Gestione</small></div>
        <div className="who">{auth.user.email}<br /><b>{auth.role}</b></div>
        {[["espositori", "Espositori"], ["posteggi", "Posteggi"], ...(auth.isAdmin ? [["staff", "Staff"]] : []), ["account", "Account"]].map(([id, l]) => (
          <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>{l}</button>
        ))}
        <div className="spacer" />
        <a className="pub" href="/projects/maglie/areamercatale/app/" target="_blank" rel="noreferrer">Apri l'app pubblica ↗</a>
        <button onClick={auth.logout}>Esci</button>
      </aside>
      <main className="main">
        {page === "espositori" && <Espositori auth={auth} />}
        {page === "posteggi" && <Posteggi auth={auth} />}
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
      <p>{auth.user ? "Questo utente non ha un ruolo di gestione." : "Accesso riservato ad amministratori e SUAP"}</p>
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
const VUOTO = { denominazione: "", alias: "", referente: "", tipo: "concessionario", categoria: "", whatsapp: "", telegram: "", descrizione: "", attivo: true };
const VUOTO_RIS = { cognomeNome: "", codiceFiscale: "", partitaIva: "", indirizzo: "", noteInterne: "" };

function Espositori({ auth }) {
  const { rows: espositori, error: e1 } = useCollection("espositori");
  const { rows: posteggi } = useCollection("posteggi");
  const { rows: riservati } = useCollection("espositori_riservati", auth.isSuap);
  const [q, setQ] = useState(""); const [mercato, setMercato] = useState("tutti"); const [sel, setSel] = useState(null); const [nuovo, setNuovo] = useState(false);
  const postByEsp = useMemo(() => { const m = {}; for (const p of posteggi) if (p.espositoreId) (m[p.espositoreId] ||= []).push(p); for (const k in m) m[k].sort(ordinaPosteggi); return m; }, [posteggi]);
  const risById = useMemo(() => Object.fromEntries(riservati.map((r) => [r.id, r])), [riservati]);
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return espositori.filter((e) => {
      if (mercato !== "tutti" && !(postByEsp[e.id] || []).some((p) => p.mercato === mercato)) return false;
      if (!t) return true;
      const r = risById[e.id] || {};
      return [e.denominazione, e.alias, e.referente, e.id, r.partitaIva, r.codiceFiscale, ...(postByEsp[e.id] || []).map((p) => p.etichetta)].some((v) => v && String(v).toLowerCase().includes(t));
    }).sort((a, b) => nomePub(a).localeCompare(nomePub(b)));
  }, [espositori, q, mercato, postByEsp, risById]);
  const selEsp = sel ? espositori.find((e) => e.id === sel) : null;
  return (
    <div className="split">
      <div>
        <h2>Espositori <span className="count">{lista.length} di {espositori.length}</span></h2>
        <div className="toolbar">
          <input type="search" placeholder="Cerca per denominazione, referente, P.IVA, posteggio…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={mercato} onChange={(e) => setMercato(e.target.value)} style={{ width: "auto" }}>
            <option value="tutti">Tutti i mercati</option>{MERCATI.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          {auth.isSuap && <button className="btn ocra" onClick={() => { setNuovo(true); setSel(null); }}>+ Nuovo espositore</button>}
        </div>
        {e1 && <div className="msg err">{e1}</div>}
        <table className="grid"><thead><tr><th>Espositore</th><th>Referente</th><th>Posteggi</th><th>Contatti</th><th>Stato</th></tr></thead><tbody>
          {lista.map((e) => (
            <tr key={e.id} className={"click" + (sel === e.id ? " sel" : "")} onClick={() => { setSel(e.id); setNuovo(false); }}>
              <td><b>{nomePub(e)}</b>{e.alias && <div className="muted">{e.denominazione}</div>}</td>
              <td>{e.referente || <span className="muted">—</span>}</td>
              <td>{(postByEsp[e.id] || []).map((p) => <span key={p.id} className="tag grey">{p.id}</span>)}{!(postByEsp[e.id] || []).length && <span className="muted">nessuno</span>}</td>
              <td className="muted">{[e.whatsapp && "WhatsApp", e.telegram && "Telegram"].filter(Boolean).join(", ") || "—"}</td>
              <td>{e.attivo === false ? <span className="tag red">sospeso</span> : <span className="tag green">attivo</span>}{e.tipo && e.tipo !== "concessionario" && <span className="tag">{e.tipo}</span>}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
      {(selEsp || nuovo) && (
        <SchedaEspositore key={selEsp ? selEsp.id : "nuovo"} esp={selEsp} ris={selEsp ? risById[selEsp.id] : null} posteggiEsp={selEsp ? postByEsp[selEsp.id] || [] : []}
          tutti={{ espositori, posteggi }} auth={auth} onClose={() => { setSel(null); setNuovo(false); }} onCreated={(id) => { setNuovo(false); setSel(id); }} />
      )}
    </div>
  );
}

function SchedaEspositore({ esp, ris, posteggiEsp, tutti, auth, onClose, onCreated }) {
  const [pub, setPub] = useState({ ...VUOTO, ...(esp ? Object.fromEntries(Object.keys(VUOTO).map((k) => [k, esp[k] ?? VUOTO[k]])) : {}) });
  const [r, setR] = useState({ ...VUOTO_RIS, ...(ris ? Object.fromEntries(Object.keys(VUOTO_RIS).map((k) => [k, ris[k] ?? ""])) : {}) });
  const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false); const [assegna, setAssegna] = useState("");
  const set = (k) => (e) => setPub((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const setRis = (k) => (e) => setR((p) => ({ ...p, [k]: e.target.value }));
  const liberi = useMemo(() => tutti.posteggi.filter((p) => !p.espositoreId).sort(ordinaPosteggi), [tutti.posteggi]);
  async function run(fn, okMsg) {
    setBusy(true); setMsg(null);
    try { const res = await fn(); setMsg({ ok: true, t: okMsg }); return res; } catch (e) { setMsg({ ok: false, t: errore(e) }); } finally { setBusy(false); }
  }
  async function salva() {
    if (!pub.denominazione.trim()) { setMsg({ ok: false, t: "La denominazione è obbligatoria" }); return; }
    if (esp) {
      await run(async () => {
        await salvaEspositore(esp.id, pub, r, auth.isSuap);
        const aggiornati = tutti.espositori.map((e) => (e.id === esp.id ? { ...e, ...pub } : e));
        await rebuildPubblico(aggiornati, tutti.posteggi);
      }, "Salvato e pubblicato");
    } else {
      const id = await run(async () => {
        const nid = await nuovoEspositore(pub, r, auth.isSuap, tutti.espositori);
        await rebuildPubblico([...tutti.espositori, { id: nid, ...pub }], tutti.posteggi);
        return nid;
      }, "Espositore creato");
      if (id) onCreated(id);
    }
  }
  async function cambiaPosteggio(posteggioId, espositoreId) {
    await run(async () => {
      await assegnaPosteggio(posteggioId, espositoreId);
      const aggiornati = tutti.posteggi.map((p) => (p.id === posteggioId ? { ...p, espositoreId, stato: espositoreId ? "assegnato" : "vacante" } : p));
      await rebuildPubblico(tutti.espositori, aggiornati);
    }, espositoreId ? "Posteggio assegnato" : "Posteggio liberato");
    setAssegna("");
  }
  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>{esp ? nomePub(esp) : "Nuovo espositore"}</h3><button className="btn sm" onClick={onClose}>Chiudi</button></div>
      {esp && <div className="muted" style={{ marginBottom: 10 }}>id {esp.id}</div>}
      <div className="sec" style={{ borderTop: "none", paddingTop: 0 }}>Dati pubblici (visibili nell'app)</div>
      <div className="field"><label>Denominazione ufficiale *</label><input type="text" value={pub.denominazione} onChange={set("denominazione")} /></div>
      <div className="field"><label>Alias mostrato al pubblico (facoltativo)</label><input type="text" value={pub.alias} onChange={set("alias")} placeholder="Se vuoto si usa la denominazione" /></div>
      <div className="row2">
        <div className="field"><label>Referente</label><input type="text" value={pub.referente} onChange={set("referente")} /></div>
        <div className="field"><label>Tipo</label><select value={pub.tipo} onChange={set("tipo")}>{TIPI.map((t) => <option key={t}>{t}</option>)}</select></div>
      </div>
      <div className="field"><label>Categoria merceologica</label><input type="text" value={pub.categoria} onChange={set("categoria")} placeholder="es. Abbigliamento, Ortofrutta…" /></div>
      <div className="row2">
        <div className="field"><label>WhatsApp (con prefisso, es. 393331234567)</label><input type="text" value={pub.whatsapp} onChange={set("whatsapp")} /></div>
        <div className="field"><label>Telegram (@utente)</label><input type="text" value={pub.telegram} onChange={set("telegram")} /></div>
      </div>
      <div className="field"><label>Descrizione breve</label><textarea value={pub.descrizione} onChange={set("descrizione")} /></div>
      <div className="field"><label><input type="checkbox" checked={pub.attivo !== false} onChange={set("attivo")} /> Attivo (visibile e abilitato alle presenze)</label></div>
      {auth.isSuap && (<>
        <div className="sec">Dati riservati (solo admin e SUAP)</div>
        <div className="field"><label>Cognome e nome (come da elenco)</label><input type="text" value={r.cognomeNome} onChange={setRis("cognomeNome")} /></div>
        <div className="row2">
          <div className="field"><label>Codice fiscale</label><input type="text" value={r.codiceFiscale} onChange={setRis("codiceFiscale")} /></div>
          <div className="field"><label>Partita IVA</label><input type="text" value={r.partitaIva} onChange={setRis("partitaIva")} /></div>
        </div>
        <div className="field"><label>Indirizzo</label><input type="text" value={r.indirizzo} onChange={setRis("indirizzo")} /></div>
        <div className="field"><label>Note interne</label><textarea value={r.noteInterne} onChange={setRis("noteInterne")} /></div>
      </>)}
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <div className="actions"><button className="btn primary" disabled={busy} onClick={salva}>{busy ? "Salvataggio…" : esp ? "Salva" : "Crea espositore"}</button></div>
      {esp && (<>
        <div className="sec">Posteggi assegnati</div>
        {posteggiEsp.length === 0 && <div className="muted">Nessun posteggio.</div>}
        {posteggiEsp.map((p) => (
          <div key={p.id} className="listline"><span><b>{p.id}</b> <span className="muted">{p.etichetta}{sup(p) ? ` · ${sup(p)} m` : ""}</span></span>
            <button className="btn sm danger" disabled={busy} onClick={() => cambiaPosteggio(p.id, null)}>Libera</button></div>
        ))}
        <div className="field" style={{ marginTop: 10 }}><label>Assegna un posteggio libero</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={assegna} onChange={(e) => setAssegna(e.target.value)}>
              <option value="">— scegli —</option>
              {MERCATI.map((m) => <optgroup key={m.id} label={m.nome}>{liberi.filter((p) => p.mercato === m.id).map((p) => <option key={p.id} value={p.id}>{p.id} · {p.etichetta}{sup(p) ? ` · ${sup(p)}` : ""}</option>)}</optgroup>)}
            </select>
            <button className="btn" disabled={!assegna || busy} onClick={() => cambiaPosteggio(assegna, esp.id)}>Assegna</button>
          </div>
        </div>
      </>)}
    </div>
  );
}

// ------------------------------------------------------------ POSTEGGI
function Posteggi({ auth }) {
  const { rows: posteggi } = useCollection("posteggi");
  const { rows: espositori } = useCollection("espositori");
  const [mercato, setMercato] = useState("area-mercatale"); const [q, setQ] = useState(""); const [solo, setSolo] = useState("tutti");
  const [edit, setEdit] = useState(null); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const espById = useMemo(() => Object.fromEntries(espositori.map((e) => [e.id, e])), [espositori]);
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return posteggi.filter((p) => p.mercato === mercato)
      .filter((p) => solo === "tutti" || (solo === "liberi" ? !p.espositoreId : !!p.espositoreId))
      .filter((p) => !t || [p.id, p.etichetta, p.note, p.espositoreId && nomePub(espById[p.espositoreId])].some((v) => v && String(v).toLowerCase().includes(t)))
      .sort(ordinaPosteggi);
  }, [posteggi, mercato, q, solo, espById]);
  async function run(fn, ok) { setBusy(true); setMsg(null); try { await fn(); setMsg({ ok: true, t: ok }); } catch (e) { setMsg({ ok: false, t: errore(e) }); } setBusy(false); }
  const cambia = (p, espId) => run(async () => {
    await assegnaPosteggio(p.id, espId);
    await rebuildPubblico(espositori, posteggi.map((x) => (x.id === p.id ? { ...x, espositoreId: espId, stato: espId ? "assegnato" : "vacante" } : x)));
    setEdit(null);
  }, espId ? `${p.id} assegnato` : `${p.id} liberato`);
  const salvaNota = (p, note) => run(async () => { await notaPosteggio(p.id, note); await rebuildPubblico(espositori, posteggi.map((x) => (x.id === p.id ? { ...x, note } : x))); }, "Nota salvata");
  const tot = posteggi.filter((p) => p.mercato === mercato); const occ = tot.filter((p) => p.espositoreId).length;
  return (
    <div>
      <h2>Posteggi <span className="count">{occ} assegnati · {tot.length - occ} liberi</span></h2>
      <div className="toolbar">
        <div className="tabs">{MERCATI.map((m) => <button key={m.id} className={mercato === m.id ? "active" : ""} onClick={() => setMercato(m.id)}>{m.nome}</button>)}</div>
        <input type="search" placeholder="Cerca posteggio o espositore…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={solo} onChange={(e) => setSolo(e.target.value)} style={{ width: "auto" }}><option value="tutti">Tutti</option><option value="liberi">Solo liberi</option><option value="assegnati">Solo assegnati</option></select>
      </div>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <table className="grid"><thead><tr><th>Posteggio</th><th>Espositore</th><th>Stato</th><th>Superficie</th><th>Note</th><th></th></tr></thead><tbody>
        {lista.map((p) => (
          <tr key={p.id}>
            <td><b>{p.id}</b><div className="muted">{p.etichetta}</div></td>
            <td>{edit === p.id ? (
              <SelezionaEspositore espositori={espositori} onPick={(id) => cambia(p, id)} onCancel={() => setEdit(null)} />
            ) : p.espositoreId ? <>{nomePub(espById[p.espositoreId]) || p.espositoreId}<div className="muted">{espById[p.espositoreId]?.referente}</div></> : <span className="muted">libero</span>}</td>
            <td>{p.espositoreId ? <span className="tag green">assegnato</span> : <span className="tag grey">{p.stato || "vacante"}</span>}{p.inElenco === false && <span className="tag red">non in elenco</span>}</td>
            <td className="muted">{sup(p) || "—"}</td>
            <td><NotaInline valore={p.note || ""} onSave={(v) => salvaNota(p, v)} disabled={!auth.isSuap || busy} /></td>
            <td style={{ whiteSpace: "nowrap" }}>{auth.isSuap && (p.espositoreId
              ? <button className="btn sm danger" disabled={busy} onClick={() => cambia(p, null)}>Libera</button>
              : edit !== p.id && <button className="btn sm" disabled={busy} onClick={() => setEdit(p.id)}>Assegna</button>)}</td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}
function SelezionaEspositore({ espositori, onPick, onCancel }) {
  const [t, setT] = useState("");
  const hits = t.trim().length >= 2 ? espositori.filter((e) => [e.denominazione, e.alias, e.referente].some((v) => v && v.toLowerCase().includes(t.toLowerCase()))).slice(0, 8) : [];
  return (
    <div>
      <input type="search" autoFocus placeholder="Scrivi il nome…" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onCancel()} />
      {hits.map((e) => <div key={e.id} className="listline" style={{ cursor: "pointer" }} onClick={() => onPick(e.id)}><span>{nomePub(e)} <span className="muted">{e.referente}</span></span><span className="tag">scegli</span></div>)}
      <button className="btn sm" style={{ marginTop: 6 }} onClick={onCancel}>Annulla</button>
    </div>
  );
}
function NotaInline({ valore, onSave, disabled }) {
  const [v, setV] = useState(valore); const [ed, setEd] = useState(false);
  if (!ed) return <span className="muted" style={{ cursor: disabled ? "default" : "pointer" }} onClick={() => !disabled && setEd(true)}>{valore || "＋ nota"}</span>;
  return <span style={{ display: "flex", gap: 6 }}><input type="text" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onSave(v); setEd(false); } if (e.key === "Escape") setEd(false); }} autoFocus /><button className="btn sm" onClick={() => { onSave(v); setEd(false); }}>OK</button></span>;
}

// ------------------------------------------------------------ STAFF
function Staff() {
  const { rows: staff, error } = useCollection("staff");
  const [f, setF] = useState({ email: "", nome: "", password: "", role: "operatore" }); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  async function run(fn, ok) { setBusy(true); setMsg(null); try { await fn(); setMsg({ ok: true, t: ok }); } catch (e) { setMsg({ ok: false, t: errore(e) }); } setBusy(false); }
  return (
    <div className="split">
      <div>
        <h2>Staff <span className="count">{staff.length} utenti</span></h2>
        {error && <div className="msg err">{error}</div>}
        <table className="grid"><thead><tr><th>Utente</th><th>Ruolo</th><th>Azioni</th></tr></thead><tbody>
          {staff.map((s) => (
            <tr key={s._id}><td><b>{s.nome || s.email}</b><div className="muted">{s.email}</div></td>
              <td><select value={s.role || ""} onChange={(e) => run(() => aggiornaStaff(s._id, { role: e.target.value || null }), "Ruolo aggiornato")} style={{ width: "auto" }}>
                <option value="">nessuno (disattivato)</option>{RUOLI.map((r) => <option key={r} value={r}>{r}</option>)}</select></td>
              <td><button className="btn sm" disabled={busy} onClick={() => run(() => inviaReset(s.email), `Email di reimpostazione inviata a ${s.email}`)}>Invia reset password</button></td></tr>
          ))}
        </tbody></table>
        {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
        <p className="muted">Ruoli: <b>admin</b> tutto · <b>suap</b> anagrafiche e posteggi · <b>operatore</b> solo presenze (e scansione QR quando disponibile). Impostare "nessuno" disattiva l'accesso.</p>
      </div>
      <div className="panel">
        <h3>Nuovo utente</h3>
        <div className="field"><label>Nome</label><input type="text" value={f.nome} onChange={set("nome")} /></div>
        <div className="field"><label>Email</label><input type="email" value={f.email} onChange={set("email")} /></div>
        <div className="field"><label>Password iniziale (min. 6)</label><input type="text" value={f.password} onChange={set("password")} /></div>
        <div className="field"><label>Ruolo</label><select value={f.role} onChange={set("role")}>{RUOLI.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="actions"><button className="btn primary" disabled={busy || !f.email || f.password.length < 6} onClick={() => run(async () => { await creaStaff(f); setF({ email: "", nome: "", password: "", role: "operatore" }); }, "Utente creato: comunica email e password iniziale")}>Crea utente</button></div>
        <p className="muted">L'utente può poi cambiare la password da "Account" nel pannello o nell'app.</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ ACCOUNT
function Account({ auth }) {
  const [a, setA] = useState(""); const [n, setN] = useState(""); const [n2, setN2] = useState(""); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  async function go() {
    if (n.length < 8) { setMsg({ ok: false, t: "La nuova password deve avere almeno 8 caratteri" }); return; }
    if (n !== n2) { setMsg({ ok: false, t: "Le due password non coincidono" }); return; }
    setBusy(true); setMsg(null);
    try { await auth.cambiaPassword(a, n); setMsg({ ok: true, t: "Password aggiornata" }); setA(""); setN(""); setN2(""); } catch (e) { setMsg({ ok: false, t: errore(e) }); }
    setBusy(false);
  }
  return (
    <div style={{ maxWidth: 440 }}>
      <h2>Account</h2>
      <div className="card">
        <div className="muted" style={{ marginBottom: 12 }}>{auth.user.email} · ruolo {auth.role}</div>
        <div className="field"><label>Password attuale</label><input type="password" value={a} onChange={(e) => setA(e.target.value)} autoComplete="current-password" /></div>
        <div className="field"><label>Nuova password</label><input type="password" value={n} onChange={(e) => setN(e.target.value)} autoComplete="new-password" /></div>
        <div className="field"><label>Ripeti nuova password</label><input type="password" value={n2} onChange={(e) => setN2(e.target.value)} autoComplete="new-password" /></div>
        {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
        <div className="actions"><button className="btn primary" disabled={busy} onClick={go}>Cambia password</button></div>
      </div>
    </div>
  );
}
