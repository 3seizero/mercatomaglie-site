// QR: scheda espositore raggiunta dal codice (#/v/<token>) e scanner per l'operatore.
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { lookupQr, inviaRichiesta, espositoreById, nomePubblico, posteggiPerSpuntisti, dopoOraLimite, SETTORI, MERCATI } from "./dati.js";
import { C } from "./brand/tokens.js";

export const tokenDaTesto = (t) => { const m = String(t || "").match(/#\/v\/([A-Za-z0-9_-]{8,})/) || String(t || "").match(/^([A-Za-z0-9_-]{16,})$/); return m ? m[1] : null; };

/** Scheda raggiunta dal QR. Senza login: solo "codice valido" + accesso operatore + self-service.
 *  Con login staff: conferma della presenza (fisso: sul suo posteggio; spuntista: scelta del posteggio libero). */
export function PageScheda({ token, auth, postazioni, elenchi, spuntisti = [], presenze, impostazioni = {}, onPresenza, onBack, S, Icon }) {
  const [stato, setStato] = useState({ loading: true });
  const [busy, setBusy] = useState(false);
  const [esito, setEsito] = useState(null);
  const [postScelto, setPostScelto] = useState("");
  const [email, setEmail] = useState(""); const [pwd, setPwd] = useState(""); const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    setStato({ loading: true });
    lookupQr(token).then((q) => { if (alive) setStato({ loading: false, q }); }).catch((e) => { if (alive) setStato({ loading: false, err: e.message }); });
    return () => { alive = false; };
  }, [token]);
  if (stato.loading) return <div style={S.page}><div style={{ textAlign: "center", padding: 40, color: C.terraChiaro }}>Verifica del codice…</div></div>;
  const q = stato.q;
  if (!q || q.attivo === false) return (
    <div style={S.page}><div style={S.loginBox}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="xCircle" size={44} color={C.rossoAssenza} sw={1.5} /></div>
      <div style={S.loginH}>Codice non valido</div>
      <div style={S.loginSub}>{q && q.attivo === false ? "Questo QR è stato revocato." : "QR sconosciuto o non più attivo."}{stato.err ? ` (${stato.err})` : ""}</div>
      <button style={S.loginBtn} onClick={onBack}>Torna alla mappa</button>
    </div></div>
  );
  // espositore: fisso (tra postazioni ed elenchi) oppure spuntista
  const tutti = [...postazioni, ...(elenchi.coperto || []), ...(elenchi.ortofrutticolo || [])];
  const posteggiEsp = tutti.filter((p) => p.espositoreId === q.espositoreId && !p.spuntista);
  const sp = spuntisti.find((x) => x.id === q.espositoreId) || null;
  const bundle = espositoreById(q.espositoreId);
  const p0 = posteggiEsp[0] || null;
  const nome = p0 ? p0.nome : sp ? sp.nome : nomePubblico(bundle) || "Espositore";
  const tipo = sp || (bundle && bundle.tipo === "spuntista") ? "spuntista" : "fisso";
  const pres = presenze[q.espositoreId] || null;
  const presente = !!pres;
  const mercatoDi = (p) => (postazioni.includes(p) ? "area-mercatale" : (elenchi.coperto || []).includes(p) ? "coperto" : "ortofrutticolo");
  const mercatoId = p0 ? mercatoDi(p0) : "area-mercatale";
  const registro = (impostazioni[mercatoId] || {}).registroPresenze !== false;
  const ritardo = dopoOraLimite(impostazioni, mercatoId);
  const liberi = tipo === "spuntista" ? posteggiPerSpuntisti(postazioni, impostazioni) : [];
  const colore = tipo === "spuntista" ? C.gialloOccasionale : C.verdePresenza;

  async function doLogin() {
    setErr(""); setBusy(true);
    try { await auth.login(email, pwd); } catch (e) { setErr(e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found" ? "Email o password non validi" : (e.message || "Errore di accesso")); }
    setBusy(false);
  }
  async function conferma() {
    if (tipo === "spuntista" && !presente && !postScelto) { setEsito({ ok: false, t: "Scegli il posteggio da assegnare" }); return; }
    setBusy(true); setEsito(null);
    let posizione = null;
    try {
      posizione = await new Promise((res) => {
        if (!navigator.geolocation) return res(null);
        navigator.geolocation.getCurrentPosition((pos) => res({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy }), () => res(null), { enableHighAccuracy: true, timeout: 6000 });
      });
      await onPresenza({ mercatoId, espositoreId: q.espositoreId, posteggioId: tipo === "spuntista" ? (presente ? pres.posteggioId : postScelto) : (p0 ? p0.id : null), presente: !presente, metodo: "qr", posizione, tipo, ritardo: !presente && ritardo });
      setEsito({ ok: true, t: !presente ? `Presenza registrata${!presente && ritardo ? " (in ritardo)" : ""}` : "Presenza annullata" });
    } catch (e) { setEsito({ ok: false, t: e.message || String(e) }); }
    setBusy(false);
  }
  const testata = (
    <div style={{ ...S.sheetHead, marginBottom: 12 }}>
      <div style={{ ...S.postBadge, borderColor: colore, background: C.bianco }}><span style={{ fontSize: 10, fontWeight: 900, color: colore }}>{p0 ? (p0.postazione || p0.numero) : tipo === "spuntista" ? "SP" : "—"}</span></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...S.sheetNome, overflowWrap: "anywhere" }}>{nome}</div>
        <div style={S.sheetCat}>{tipo === "spuntista" ? `Spuntista${sp && sp.categoria && sp.categoria !== "Spuntista" ? ` · ${sp.categoria}` : ""}` : p0 ? p0.categoria : "Espositore registrato"}</div>
      </div>
      {registro && auth.isStaff && <div style={{ ...S.presBadge, background: presente ? C.verdePresenzaTint : C.rossoAssenzaTint, color: presente ? C.verdePresenza : C.rossoAssenza, borderColor: presente ? C.verdePresenza : C.rossoAssenza }}>
        <Icon name={presente ? "checkCircle" : "xCircle"} size={13} color={presente ? C.verdePresenza : C.rossoAssenza} sw={2} />{presente ? "Presente" : "Assente"}</div>}
    </div>
  );

  // ---- non loggato: codice valido, accesso operatore, self-service
  if (!auth.isStaff) return (
    <div style={S.page}>
      {testata}
      <div style={S.divider} />
      <div style={{ ...S.formCard, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Icon name="checkCircle" size={34} color={C.verdePresenza} sw={1.5} /></div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.terraTesto, marginBottom: 4 }}>Codice espositore valido</div>
        <div style={{ fontSize: 11, color: C.terraChiaro, lineHeight: 1.5, marginBottom: 12 }}>La presenza può essere registrata solo da un operatore di controllo che ha effettuato l'accesso.</div>
        {auth.user ? (
          <div style={S.errMsg}>L'utente {auth.user.email} non ha un ruolo attivo.</div>
        ) : (<>
          <input style={S.input} type="email" placeholder="Email operatore" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
          <input style={{ ...S.input, ...(err ? { borderColor: C.rossoAssenza } : {}) }} type="password" placeholder="Password" value={pwd} autoComplete="current-password" onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
          {err && <div style={S.errMsg}>{err}</div>}
          <button style={{ ...S.loginBtn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={doLogin}><Icon name="lock" size={16} color={C.bianco} sw={2} /> {busy ? "Accesso…" : "Accedi e registra"}</button>
        </>)}
      </div>
      <SelfService token={token} q={q} p0={p0 || (sp ? { nome: sp.nome, denominazione: sp.nome, titolare: sp.titolare, whatsapp: sp.whatsapp, telegram: sp.telegram, descrizione: sp.descrizione } : null)} S={S} />
      <div style={{ textAlign: "center", marginTop: 14 }}><button style={S.cancelBtn} onClick={onBack}>Torna alla mappa</button></div>
    </div>
  );

  // ---- operatore loggato
  return (
    <div style={S.page}>
      {testata}
      <div style={S.divider} />
      <div style={{ display: "flex", flexDirection: "column", gap: 9, margin: "12px 0 16px" }}>
        {p0 && p0.titolare && <div style={S.infoRow}><Icon name="users" size={15} color={C.terraChiaro} sw={1.5} /><span>{p0.titolare}</span></div>}
        {posteggiEsp.map((p) => <div key={p.id} style={S.infoRow}><Icon name="pin" size={15} color={C.terraChiaro} sw={1.5} /><span>{p.etichetta}</span></div>)}
        {tipo === "spuntista" && <div style={{ ...S.infoRow, color: C.gialloOccasionaleTesto }}><Icon name="pin" size={15} color={C.gialloOccasionale} sw={1.5} /><span>{presente ? `Oggi sul posteggio ${pres.posteggioId || "—"} dalle ${pres.ora || ""}` : "Spuntista: da collocare in un posteggio libero."}</span></div>}
        {tipo === "fisso" && !p0 && <div style={{ ...S.infoRow, color: C.rossoAssenza }}><Icon name="pin" size={15} color={C.rossoAssenza} sw={1.5} /><span>Nessun posteggio assegnato: verificare con il SUAP.</span></div>}
        {presente && pres.ora && tipo === "fisso" && <div style={{ fontSize: 11, color: C.terraChiaro }}>Presenza registrata alle {pres.ora}{pres.ritardo ? " (in ritardo)" : ""}{pres.da && (pres.da.nome || pres.da.email) ? ` da ${[pres.da.nome, pres.da.cognome].filter(Boolean).join(" ") || pres.da.email}` : ""}</div>}
      </div>
      {!registro ? (
        <div style={{ ...S.formCard, textAlign: "center", fontSize: 12, color: C.terraChiaro }}>Per questo mercato il registro presenze non è attivo.</div>
      ) : (
        <div style={{ ...S.formCard, textAlign: "center" }}>
          <div style={S.secLbl}>Operatore · {auth.nomeOperatore}</div>
          {tipo === "spuntista" && !presente && (
            <select style={S.select} value={postScelto} onChange={(e) => setPostScelto(e.target.value)}>
              <option value="">— scegli il posteggio libero —</option>
              {liberi.map((p) => <option key={p.id} value={p.id}>{p.postazione} · {p.etichetta.replace(/^Settore \w+ · /, "")} · {p.motivo}</option>)}
            </select>
          )}
          {ritardo && !presente && <div style={{ fontSize: 11, color: C.rossoAssenza, marginBottom: 8 }}>Ora limite di spunta superata: la presenza verrà segnata in ritardo.</div>}
          {esito && <div style={{ ...S.errMsg, color: esito.ok ? C.verdePresenzaTesto : C.rossoAssenza }}>{esito.t}</div>}
          <button style={{ ...S.loginBtn, background: presente ? C.rossoAssenza : C.verdePresenza, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={conferma}>
            <Icon name={presente ? "xCircle" : "checkCircle"} size={16} color={C.bianco} sw={2} /> {busy ? "Registrazione…" : presente ? "Annulla presenza" : "Conferma presenza"}
          </button>
          <div style={S.loginHint}>La presenza viene certificata a tuo nome, con ora e posizione GPS del telefono.</div>
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 14 }}><button style={S.cancelBtn} onClick={onBack}>Torna alla mappa</button></div>
    </div>
  );
}

/** Modulo self-service: l'espositore, dal proprio QR, propone alias, contatti e descrizione. Il SUAP approva. */
function SelfService({ token, q, p0, S }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ alias: p0?.nome && p0.nome !== p0.denominazione ? "" : "", referente: p0?.titolare || "", whatsapp: p0?.whatsapp || "", telegram: p0?.telegram || "", descrizione: p0?.descrizione || "", consenso: false });
  const [stato, setStato] = useState(null); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  if (!open) return <div style={{ textAlign: "center" }}><button style={{ ...S.cancelBtn, background: C.ocraTint, color: C.gialloOccasionaleTesto }} onClick={() => setOpen(true)}>Sei tu l'espositore? Aggiorna la tua scheda</button></div>;
  if (stato?.ok) return <div style={{ ...S.formCard, textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 700, color: C.verdePresenzaTesto }}>Richiesta inviata</div><div style={{ fontSize: 12, color: C.terraMedio, marginTop: 6 }}>Il SUAP la verificherà e la pubblicherà nell'app. Grazie.</div></div>;
  async function invia() {
    if (!f.consenso) { setStato({ ok: false, t: "Serve il consenso alla pubblicazione dei contatti" }); return; }
    setBusy(true); setStato(null);
    try { await inviaRichiesta({ token, espositoreId: q.espositoreId, ...f }); setStato({ ok: true }); } catch (e) { setStato({ ok: false, t: e.message || String(e) }); }
    setBusy(false);
  }
  return (
    <div style={S.formCard}>
      <div style={S.formH}>La tua scheda pubblica</div>
      <div style={{ fontSize: 11, color: C.terraChiaro, marginBottom: 10, lineHeight: 1.5 }}>Compila quello che vuoi far vedere ai clienti nell'app. Le modifiche vengono pubblicate dopo la verifica del SUAP.</div>
      {[["alias", "Nome da mostrare (es. insegna)"], ["referente", "Referente"], ["whatsapp", "WhatsApp (es. 393331234567)"], ["telegram", "Telegram (@utente)"]].map(([k, pl]) => (
        <input key={k} style={S.input} placeholder={pl} value={f[k]} onChange={set(k)} />
      ))}
      <textarea style={{ ...S.input, minHeight: 70 }} placeholder="Descrizione breve (cosa vendi, specialità…)" value={f.descrizione} onChange={set("descrizione")} />
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: C.terraMedio, lineHeight: 1.45, marginBottom: 10 }}>
        <input type="checkbox" checked={f.consenso} onChange={set("consenso")} style={{ marginTop: 2 }} />
        <span>Acconsento alla pubblicazione di questi dati nell'app dei mercati di Maglie. Potrò chiederne la modifica o la rimozione al SUAP.</span>
      </label>
      {stato && !stato.ok && <div style={S.errMsg}>{stato.t}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...S.saveBtn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={invia}>{busy ? "Invio…" : "Invia al SUAP"}</button>
        <button style={S.cancelBtn} onClick={() => setOpen(false)}>Annulla</button>
      </div>
    </div>
  );
}

/** Scanner: BarcodeDetector nativo se disponibile, altrimenti jsQR sui frame del video. */
export function Scanner({ onToken, onClose, S }) {
  const videoRef = useRef(null); const canvasRef = useRef(null);
  const [err, setErr] = useState(null); const [manuale, setManuale] = useState("");
  useEffect(() => {
    let stream, raf, stop = false, detector = null;
    if ("BarcodeDetector" in window) { try { detector = new window.BarcodeDetector({ formats: ["qr_code"] }); } catch { detector = null; } }
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        const v = videoRef.current; v.srcObject = stream; await v.play();
        const c = canvasRef.current; const ctx = c.getContext("2d", { willReadFrequently: true });
        const tick = async () => {
          if (stop) return;
          if (v.readyState >= 2) {
            let text = null;
            if (detector) { try { const codes = await detector.detect(v); if (codes.length) text = codes[0].rawValue; } catch { /* fallback sotto */ } }
            if (!text) {
              const w = Math.min(640, v.videoWidth), h = Math.round(w * v.videoHeight / v.videoWidth);
              if (w && h) { c.width = w; c.height = h; ctx.drawImage(v, 0, 0, w, h); const d = ctx.getImageData(0, 0, w, h); const r = jsQR(d.data, w, h, { inversionAttempts: "dontInvert" }); if (r) text = r.data; }
            }
            if (text) { const t = tokenDaTesto(text); if (t) { stop = true; onToken(t); return; } }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) { setErr(e.name === "NotAllowedError" ? "Permesso fotocamera negato" : (e.message || "Fotocamera non disponibile")); }
    }
    start();
    return () => { stop = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [onToken]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 230, height: 230, transform: "translate(-50%,-50%)", border: "3px solid rgba(232,160,69,0.9)", borderRadius: 18, boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)" }} />
        <div style={{ position: "absolute", top: "calc(50% + 135px)", left: 0, right: 0, textAlign: "center", color: C.bianco, fontSize: 13, fontWeight: 600, textShadow: "0 1px 3px #000" }}>Inquadra il QR dell'espositore</div>
        {err && <div style={{ position: "absolute", top: 20, left: 20, right: 20, background: "rgba(200,50,50,0.92)", color: C.bianco, padding: 12, borderRadius: 10, fontSize: 13 }}>{err}</div>}
      </div>
      <div style={{ background: C.terra, padding: "12px 14px calc(14px + env(safe-area-inset-bottom))", display: "flex", gap: 8, alignItems: "center" }}>
        <input style={{ ...S.input, marginBottom: 0, flex: 1 }} placeholder="…o digita il codice" value={manuale} onChange={(e) => setManuale(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const t = tokenDaTesto(manuale.trim()); if (t) onToken(t); } }} />
        <button style={{ ...S.cancelBtn, whiteSpace: "nowrap" }} onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

export { SETTORI, MERCATI };
