// Cambio password obbligatorio al primo accesso (operatori nell'app).
import { useState } from "react";
import { C } from "./brand/tokens.js";

export function FormCambioPassword({ auth, S, Icon }) {
  const [a, setA] = useState(""); const [n, setN] = useState(""); const [n2, setN2] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go() {
    setErr("");
    if (n.length < 8) { setErr("La nuova password deve avere almeno 8 caratteri"); return; }
    if (n === a) { setErr("La nuova password deve essere diversa da quella iniziale"); return; }
    if (n !== n2) { setErr("Le due password non coincidono"); return; }
    setBusy(true);
    try { await auth.cambiaPassword(a, n); }
    catch (e) { setErr(e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" ? "Password iniziale errata" : (e.message || "Errore")); }
    setBusy(false);
  }
  return (
    <div style={S.loginWrap}>
      <div style={S.loginBox}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Icon name="lock" size={42} color={C.ocra} sw={1.5} /></div>
        <div style={S.loginH}>Imposta la tua password</div>
        <div style={S.loginSub}>Ciao {auth.nomeOperatore}. Al primo accesso la password iniziale va sostituita con una personale, di almeno 8 caratteri.</div>
        <input style={S.input} type="password" placeholder="Password iniziale (quella ricevuta)" value={a} autoComplete="current-password" onChange={(e) => setA(e.target.value)} />
        <input style={S.input} type="password" placeholder="Nuova password" value={n} autoComplete="new-password" onChange={(e) => setN(e.target.value)} />
        <input style={{ ...S.input, ...(err ? { borderColor: C.rossoAssenza } : {}) }} type="password" placeholder="Ripeti la nuova password" value={n2} autoComplete="new-password" onChange={(e) => setN2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
        {err && <div style={S.errMsg}>{err}</div>}
        <button style={{ ...S.loginBtn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={go}><Icon name="checkCircle" size={16} color={C.bianco} sw={2} /> {busy ? "Salvataggio…" : "Salva e continua"}</button>
        <button style={{ ...S.cancelBtn, marginTop: 8, width: "100%" }} onClick={auth.logout}>Esci</button>
      </div>
    </div>
  );
}
