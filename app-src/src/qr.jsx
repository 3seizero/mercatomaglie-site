// QR: scheda espositore raggiunta dal codice (#/v/<token>) e scanner per l'operatore.
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { lookupQr, setPresenza, SETTORI, MERCATI } from "./dati.js";

export const tokenDaTesto = (t) => { const m = String(t || "").match(/#\/v\/([A-Za-z0-9_-]{8,})/) || String(t || "").match(/^([A-Za-z0-9_-]{16,})$/); return m ? m[1] : null; };

/** Scheda pubblica + conferma presenza (staff). */
export function PageScheda({ token, auth, postazioni, elenchi, presenze, onPresenza, onBack, S, Icon }) {
  const [stato, setStato] = useState({ loading: true });
  const [busy, setBusy] = useState(false);
  const [esito, setEsito] = useState(null);
  useEffect(() => {
    let alive = true;
    setStato({ loading: true });
    lookupQr(token).then((q) => { if (alive) setStato({ loading: false, q }); }).catch((e) => { if (alive) setStato({ loading: false, err: e.message }); });
    return () => { alive = false; };
  }, [token]);
  if (stato.loading) return <div style={S.page}><div style={{ textAlign: "center", padding: 40, color: "#9a8070" }}>Verifica del codice…</div></div>;
  const q = stato.q;
  if (!q || q.attivo === false) return (
    <div style={S.page}><div style={S.loginBox}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="xCircle" size={44} color="#c0392b" sw={1.5} /></div>
      <div style={S.loginH}>Codice non valido</div>
      <div style={S.loginSub}>{q && q.attivo === false ? "Questo QR è stato revocato." : "QR sconosciuto o non più attivo."}{stato.err ? ` (${stato.err})` : ""}</div>
      <button style={S.loginBtn} onClick={onBack}>Torna alla mappa</button>
    </div></div>
  );
  // espositore: cerco tra postazioni (area mercatale) ed elenchi
  const tutti = [...postazioni, ...(elenchi.coperto || []), ...(elenchi.ortofrutticolo || [])];
  const posteggiEsp = tutti.filter((p) => p.espositoreId === q.espositoreId);
  const p0 = posteggiEsp[0] || null;
  const presente = !!presenze[q.espositoreId];
  const nome = p0 ? p0.nome : (q.denominazione || q.espositoreId);
  const colore = !p0 ? "#e0a800" : "#3daa70";
  const mercatoDi = (p) => (postazioni.includes(p) ? "area-mercatale" : (elenchi.coperto || []).includes(p) ? "coperto" : "ortofrutticolo");
  async function conferma() {
    setBusy(true); setEsito(null);
    let posizione = null;
    try {
      posizione = await new Promise((res) => {
        if (!navigator.geolocation) return res(null);
        navigator.geolocation.getCurrentPosition((pos) => res({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy }), () => res(null), { enableHighAccuracy: true, timeout: 6000 });
      });
      await onPresenza({ mercatoId: p0 ? mercatoDi(p0) : "area-mercatale", espositoreId: q.espositoreId, posteggioId: p0 ? p0.id : null, presente: !presente, metodo: "qr", posizione });
      setEsito({ ok: true, t: !presente ? "Presenza registrata" : "Presenza annullata" });
    } catch (e) { setEsito({ ok: false, t: e.message || String(e) }); }
    setBusy(false);
  }
  return (
    <div style={S.page}>
      <div style={{ ...S.sheetHead, marginBottom: 12 }}>
        <div style={{ ...S.postBadge, borderColor: colore, background: "#fff" }}><span style={{ fontSize: 10, fontWeight: 900, color: colore }}>{p0 ? (p0.postazione || p0.numero) : "—"}</span></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...S.sheetNome, overflowWrap: "anywhere" }}>{nome}</div>
          <div style={S.sheetCat}>{p0 ? p0.categoria : "Espositore registrato"}</div>
        </div>
        {p0 && <div style={{ ...S.presBadge, background: presente ? "#eaf7f0" : "#fdecea", color: presente ? "#3daa70" : "#c0392b", borderColor: presente ? "#3daa70" : "#e07070" }}>
          <Icon name={presente ? "checkCircle" : "xCircle"} size={13} color={presente ? "#3daa70" : "#c0392b"} sw={2} />{presente ? "Presente" : "Assente"}</div>}
      </div>
      <div style={S.divider} />
      <div style={{ display: "flex", flexDirection: "column", gap: 9, margin: "12px 0 16px" }}>
        {p0 && p0.titolare && <div style={S.infoRow}><Icon name="users" size={15} color="#9a8070" sw={1.5} /><span>{p0.titolare}</span></div>}
        {posteggiEsp.map((p) => <div key={p.id} style={S.infoRow}><Icon name="pin" size={15} color="#9a8070" sw={1.5} /><span>{p.etichetta}{p.superficie ? ` · ${p.superficie} m` : ""}</span></div>)}
        {!p0 && <div style={{ ...S.infoRow, color: "#a07000" }}><Icon name="pin" size={15} color="#e0a800" sw={1.5} /><span>Nessun posteggio assegnato: espositore occasionale, da collocare in un posteggio libero.</span></div>}
        {p0 && p0.descrizione && <div style={{ fontSize: 12, color: "#6b5040", lineHeight: 1.45 }}>{p0.descrizione}</div>}
      </div>
      {p0 && (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          {p0.whatsapp && <a href={`https://wa.me/${p0.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={S.waBtnPopup}><Icon name="wa" size={20} color="#fff" sw={1.8} /><span>WhatsApp</span></a>}
          {p0.telegram && <a href={`https://t.me/${p0.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" style={{ ...S.waBtnPopup, background: "#2aabee" }}><Icon name="navigate" size={20} color="#fff" sw={1.8} /><span>Telegram</span></a>}
          {p0.lat && <a href={`https://www.google.com/maps/dir/?api=1&destination=${p0.lat.toFixed(6)},${p0.lon.toFixed(6)}&travelmode=walking`} target="_blank" rel="noreferrer" style={S.naviBtn}><Icon name="navigate" size={20} color="#fff" sw={1.8} /><span>A piedi</span></a>}
        </div>
      )}
      {auth.isStaff ? (
        <div style={{ ...S.formCard, textAlign: "center" }}>
          <div style={S.secLbl}>Operatore · {auth.user.email}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, background: !p0 ? "#fff6d6" : "#eaf7f0", color: !p0 ? "#a07000" : "#2e7d52", fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: colore, display: "inline-block" }} />{!p0 ? "Occasionale registrato" : "Concessionario in regola"}
          </div>
          {esito && <div style={{ ...S.errMsg, color: esito.ok ? "#2e7d52" : "#c0392b" }}>{esito.t}</div>}
          <button style={{ ...S.loginBtn, background: presente ? "#c0392b" : "#3daa70", opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={conferma}>
            <Icon name={presente ? "xCircle" : "checkCircle"} size={16} color="#fff" sw={2} /> {busy ? "Registrazione…" : presente ? "Annulla presenza" : "Conferma presenza"}
          </button>
          <div style={S.loginHint}>Viene salvata anche la posizione GPS del telefono per la verifica delle postazioni.</div>
        </div>
      ) : (
        <div style={{ textAlign: "center", fontSize: 11, color: "#9a8070" }}>Sei un operatore? Accedi da "Gestione" per registrare la presenza.</div>
      )}
      <div style={{ textAlign: "center", marginTop: 14 }}><button style={S.cancelBtn} onClick={onBack}>Torna alla mappa</button></div>
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
        <div style={{ position: "absolute", top: "calc(50% + 135px)", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 13, fontWeight: 600, textShadow: "0 1px 3px #000" }}>Inquadra il QR dell'espositore</div>
        {err && <div style={{ position: "absolute", top: 20, left: 20, right: 20, background: "rgba(200,50,50,0.92)", color: "#fff", padding: 12, borderRadius: 10, fontSize: 13 }}>{err}</div>}
      </div>
      <div style={{ background: "#1a120a", padding: "12px 14px calc(14px + env(safe-area-inset-bottom))", display: "flex", gap: 8, alignItems: "center" }}>
        <input style={{ ...S.input, marginBottom: 0, flex: 1 }} placeholder="…o digita il codice" value={manuale} onChange={(e) => setManuale(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const t = tokenDaTesto(manuale.trim()); if (t) onToken(t); } }} />
        <button style={{ ...S.cancelBtn, whiteSpace: "nowrap" }} onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

export { SETTORI, MERCATI };
