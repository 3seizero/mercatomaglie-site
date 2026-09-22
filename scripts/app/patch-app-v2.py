#!/usr/bin/env python3
"""Patch una tantum di App.jsx: mappa v2 + dati reali + Firebase (presenze, login). Idempotente: si ferma se già applicata."""
import re, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = f'{ROOT}/app-src/src/App.jsx'
s = open(P, encoding='utf-8').read()
if 'from "./dati.js"' in s:
    print('già applicata'); sys.exit(0)

def rep(old, new, count=1):
    global s
    assert old in s, f'NON TROVATO: {old[:80]!r}'
    s = s.replace(old, new, count)

# 1) import
rep('import { useState, useEffect, useRef } from "react";',
    'import { useState, useEffect, useRef, useMemo } from "react";\n'
    'import { firebaseReady } from "./firebase.js";\n'
    'import { PLANIMETRIA_URI, SVG_VIEWBOX, SVG_W, SVG_H, GEO, MERCATI, SETTORI, usePresenze, setPresenza, useAuth, buildPostazioni, buildElenco } from "./dati.js";')

# 2) rimuovi DATA (ESPOSITORI_INIT) e costanti planimetria/GEO: da "// DATA — 251" a "function gpsToSvg"
a = s.index('// ============================================================\n// DATA — 251 postazioni')
b = s.index('function gpsToSvg(')
s = s[:a] + ('// ============================================================\n'
             '// DATI — geometria mappa, anagrafiche e calibrazione GPS vengono da ./dati.js\n'
             '// (generati dai seed SUAP e dalla planimetria v2 con scripts/app/gen-data.py)\n'
             '// ============================================================\n\n') + s[b:]

# 3) PageMappa
rep('viewBox="0 0 2055.647 1554.619" xmlns="http://www.w3.org/2000/svg">', 'viewBox={SVG_VIEWBOX} xmlns="http://www.w3.org/2000/svg">')
rep('{e.postazione.replace("P","")}', '{e.numero}')
rep('<div style={S.sheetNome}>{esp.nome}</div>', '<div style={{...S.sheetNome,overflowWrap:"anywhere"}}>{esp.nome}</div>')
rep('''                  <div style={S.infoRow}><Icon name="users" size={15} color="#9a8070" sw={1.5}/><span>{esp.titolare}</span></div>
                  <div style={S.infoRow}><Icon name="pin" size={15} color="#9a8070" sw={1.5}/><span>Postazione {esp.postazione}</span></div>''',
    '''                  {esp.titolare&&<div style={S.infoRow}><Icon name="users" size={15} color="#9a8070" sw={1.5}/><span>{esp.titolare}</span></div>}
                  <div style={S.infoRow}><Icon name="pin" size={15} color="#9a8070" sw={1.5}/><span>{esp.etichetta}{esp.superficie?` · ${esp.superficie} m`:""}</span></div>
                  {esp.descrizione&&<div style={{...S.infoRow,alignItems:"flex-start"}}><span style={{fontSize:12,color:"#6b5040",lineHeight:1.45}}>{esp.descrizione}</span></div>}''')
rep('''                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <a href={`https://wa.me/${esp.whatsapp}`} target="_blank" rel="noreferrer" style={S.waBtnPopup}>
                    <Icon name="wa" size={20} color="#fff" sw={1.8}/>
                    <span>WhatsApp</span>
                  </a>
                  {(()=>{const {lat,lon}=svgToGps(esp.cx, esp.cy); return(
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lon.toFixed(6)}`}
                      target="_blank" rel="noreferrer" style={S.naviBtn}>
                      <Icon name="navigate" size={20} color="#fff" sw={1.8}/>
                      <span>Naviga</span>
                    </a>
                  );})()}
                </div>''',
    '''                <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                  {esp.whatsapp&&<a href={`https://wa.me/${esp.whatsapp.replace(/\\D/g,"")}`} target="_blank" rel="noreferrer" style={S.waBtnPopup}>
                    <Icon name="wa" size={20} color="#fff" sw={1.8}/>
                    <span>WhatsApp</span>
                  </a>}
                  {esp.telegram&&<a href={`https://t.me/${esp.telegram.replace(/^@/,"")}`} target="_blank" rel="noreferrer" style={{...S.waBtnPopup,background:"#2aabee"}}>
                    <Icon name="navigate" size={20} color="#fff" sw={1.8}/>
                    <span>Telegram</span>
                  </a>}
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${esp.lat.toFixed(6)},${esp.lon.toFixed(6)}&travelmode=walking`}
                    target="_blank" rel="noreferrer" style={S.naviBtn}>
                    <Icon name="navigate" size={20} color="#fff" sw={1.8}/>
                    <span>A piedi</span>
                  </a>
                </div>''')
rep('''                <div style={{fontSize:15,fontWeight:700,color:"#3d2b1a",marginBottom:4}}>Postazione {esp.postazione}</div>
                <div style={{fontSize:12,color:"#9a8070"}}>Postazione libera</div>''',
    '''                <div style={{fontSize:15,fontWeight:700,color:"#3d2b1a",marginBottom:4}}>{esp.etichetta}</div>
                <div style={{fontSize:12,color:"#9a8070"}}>{esp.inElenco?"Posteggio libero":"Posteggio non in elenco SUAP"}{esp.superficie?` · ${esp.superficie} m`:""}</div>''')

# 4) PageMercato: elenchi reali
a = s.index('function PageMercato({negozi}){'); b = s.index('// ============================================================\n// PAGE: EVENTI')
s = s[:a] + '''function PageMercato({negozi,mercato}){
  const cats=[...new Set(negozi.filter(n=>n.nome).map(n=>n.categoria).filter(Boolean))].sort();
  const [cat,setCat]=useState("Tutte");
  const fil=cat==="Tutte"?negozi:negozi.filter(n=>n.categoria===cat);
  const occupati=negozi.filter(n=>n.nome).length;
  return(
    <div style={S.page}>
      {mercato&&<div style={{fontSize:11,color:"#9a8070",fontWeight:600,marginBottom:10,lineHeight:1.5}}>
        <Icon name="pin" size={11} color="#9a8070" sw={1.5}/> {mercato.indirizzo||"Indirizzo da confermare"}{mercato.giorni?` · ${mercato.giorni.join(", ")}`:""} · {occupati} espositori, {negozi.length-occupati} posti liberi
      </div>}
      <div style={S.filterBar}>
        {["Tutte",...cats].map(c=>(
          <button key={c} style={{...S.fBtn,...(cat===c?S.fBtnAct:{})}} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>
      <div style={S.col}>
        {fil.map(n=>(
          <div key={n.id} style={{...S.nCard,opacity:n.nome?1:0.65}}>
            <div style={S.nTop}>
              <div style={{...S.nNum,fontSize:10,padding:"0 4px",width:"auto",minWidth:36,background:n.presente?"#eaf7f0":undefined,color:n.presente?"#3daa70":undefined}}>{n.numero||"—"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{...S.nNome,overflowWrap:"anywhere"}}>{n.nome||"Posto libero"}</div>
                <div style={S.nTit}>{n.nome?(n.titolare||n.etichetta):n.etichetta}{n.note?` · ${n.note}`:""}</div>
              </div>
              {n.categoria&&<span style={S.nCat}>{n.categoria}</span>}
            </div>
            {n.descrizione && <div style={S.nDesc}>{n.descrizione}</div>}
            {(n.whatsapp||n.telegram)&&<>
              <div style={S.divider}/>
              <div style={{display:"flex",gap:8}}>
                {n.whatsapp&&<a href={`https://wa.me/${n.whatsapp.replace(/\\D/g,"")}`} target="_blank" rel="noreferrer" style={S.waBtnCard}>
                  <Icon name="wa" size={16} color="#fff" sw={1.8}/> WhatsApp
                </a>}
                {n.telegram&&<a href={`https://t.me/${n.telegram.replace(/^@/,"")}`} target="_blank" rel="noreferrer" style={{...S.waBtnCard,background:"#2aabee"}}>
                  <Icon name="navigate" size={16} color="#fff" sw={1.8}/> Telegram
                </a>}
              </div>
            </>}
          </div>
        ))}
      </div>
    </div>
  );
}

''' + s[b:]

# 5) PageAdmin: login Firebase + presenze su Firestore + elenco espositori in sola lettura
a = s.index('function PageAdmin('); b = s.index('// ============================================================\n// DESIGN SYSTEM')
s = s[:a] + '''function PageAdmin({auth,postazioni,elenchi,eventi,setEventi,onPresenza,online}){
  const [email,setEmail]=useState("");
  const [pwd,setPwd]=useState("");
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);
  const [tab,setTab]=useState("presenze");
  const [q,setQ]=useState("");
  const [mercato,setMercato]=useState("area-mercatale");
  const [addEv,setAddEv]=useState(false);
  const [nEv,setNEv]=useState({titolo:"",data:"",ora:"",luogo:"",descrizione:"",categoria:"Gastronomia"});
  const [pending,setPending]=useState({});

  async function doLogin(){
    setErr(""); setBusy(true);
    try{ await auth.login(email,pwd); }
    catch(e){ setErr(e.code==="auth/invalid-credential"||e.code==="auth/wrong-password"||e.code==="auth/user-not-found"?"Email o password non validi":(e.message||"Errore di accesso")); }
    setBusy(false);
  }

  if(!auth.user||!auth.isStaff) return(
    <div style={S.loginWrap}>
      <div style={S.loginBox}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><Icon name="lock" size={42} color="#c8862a" sw={1.5}/></div>
        <div style={S.loginH}>Area Riservata</div>
        <div style={S.loginSub}>{auth.user&&!auth.isStaff?"Questo utente non ha un ruolo assegnato. Contatta l'amministratore.":"Accesso per amministratori e operatori"}</div>
        {auth.user&&!auth.isStaff?(
          <button style={S.loginBtn} onClick={auth.logout}>Esci</button>
        ):(<>
          <input style={S.input} type="email" placeholder="Email" value={email} autoComplete="username"
            onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
          <input style={{...S.input,...(err?{borderColor:"#c0392b"}:{})}} type="password" placeholder="Password" value={pwd} autoComplete="current-password"
            onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
          {err&&<div style={S.errMsg}>{err}</div>}
          <button style={{...S.loginBtn,opacity:busy?0.6:1}} disabled={busy} onClick={doLogin}><Icon name="lock" size={16} color="#fff" sw={2}/> {busy?"Accesso…":"Accedi"}</button>
          {!firebaseReady&&<div style={S.loginHint}>Backend non configurato (manca .env.local)</div>}
        </>)}
      </div>
    </div>
  );

  const TABS=[{id:"presenze",icon:"checkCircle",l:"Presenze"},{id:"espositori",icon:"store",l:"Espositori"},...(auth.isAdmin?[{id:"eventi",icon:"calendar",l:"Eventi"}]:[])];
  const lista=(mercato==="area-mercatale"?postazioni:elenchi[mercato]||[]).filter(e=>e.nome);
  const norm=t=>(t||"").toLowerCase();
  const filtra=arr=>q?arr.filter(e=>norm(e.nome).includes(norm(q))||norm(e.titolare).includes(norm(q))||norm(e.etichetta).includes(norm(q))||norm(e.numero).includes(norm(q))):arr;
  const presentiOggi=lista.filter(e=>e.presente).length;

  async function toggle(e){
    if(pending[e.id]) return;
    setPending(p=>({...p,[e.id]:true}));
    try{ await onPresenza({mercatoId:mercato,espositoreId:e.espositoreId,posteggioId:e.id,presente:!e.presente}); }
    catch(err){ alert("Salvataggio non riuscito: "+(err.message||err)); }
    setPending(p=>{const n={...p};delete n[e.id];return n;});
  }

  return(
    <div style={S.page}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <span style={{fontSize:16,fontWeight:800,color:"#2c1d0e"}}>Gestione</span>
          <div style={{fontSize:10,color:"#9a8070",marginTop:2}}>{auth.user.email} · {auth.role}{firebaseReady?(online?" · online":" · connessione…"):" · offline"}</div>
        </div>
        <button style={S.logoutBtn} onClick={auth.logout}>
          <Icon name="logout" size={15} color="#3d2b1a" sw={1.8}/> Esci
        </button>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {TABS.map(t=>(
          <button key={t.id} style={{...S.aTab,...(tab===t.id?S.aTabAct:{})}} onClick={()=>setTab(t.id)}>
            <Icon name={t.icon} size={16} color={tab===t.id?"#fff":"#6b5040"} sw={tab===t.id?2:1.5}/>
            <span style={{fontSize:10,marginTop:2}}>{t.l}</span>
          </button>
        ))}
      </div>

      {tab!=="eventi"&&(
        <>
          <div style={S.filterBar}>
            {MERCATI.map(m=>(
              <button key={m.id} style={{...S.fBtn,...(mercato===m.id?S.fBtnAct:{})}} onClick={()=>{setMercato(m.id);setQ("");}}>{m.nome.replace("Mercato ","")}</button>
            ))}
          </div>
          <input style={{...S.input,marginBottom:10}} placeholder="Cerca espositore o posteggio…" value={q} onChange={e=>setQ(e.target.value)}/>
        </>
      )}

      {/* PRESENZE */}
      {tab==="presenze"&&(
        <div>
          <div style={S.secLbl}>Presenze di oggi · {presentiOggi} su {lista.length}</div>
          <div style={S.col}>
            {filtra(lista).map(e=>(
              <div key={e.id} style={S.presRow}>
                <span style={{width:8,height:8,borderRadius:"50%",background:e.presente?"#3daa70":"#c0b0a0",flexShrink:0,display:"inline-block"}}/>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:"#2c1d0e",overflowWrap:"anywhere"}}>{e.nome}</div><div style={{fontSize:10,color:"#9a8070"}}>{e.etichetta}{e.titolare?` · ${e.titolare}`:""}</div></div>
                <button style={{...S.togBtn,background:e.presente?"#fdecea":"#eaf7f0",color:e.presente?"#c0392b":"#3daa70",opacity:pending[e.id]?0.5:1}} disabled={!!pending[e.id]} onClick={()=>toggle(e)}>
                  {e.presente?"Segna assente":"Presente"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESPOSITORI */}
      {tab==="espositori"&&(
        <div>
          <div style={S.secLbl}>Espositori · {lista.length} assegnatari</div>
          <div style={S.col}>
            {filtra(lista).map(e=>(
              <div key={e.id} style={S.aRow}>
                <span style={{fontSize:11,fontWeight:800,color:e.presente?"#3daa70":"#9a8070",minWidth:36}}>{e.numero}</span>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#2c1d0e",overflowWrap:"anywhere"}}>{e.nome}</div><div style={{fontSize:10,color:"#9a8070"}}>{[e.titolare,e.categoria,e.whatsapp?"WhatsApp":null].filter(Boolean).join(" · ")}</div></div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#9a8070",marginTop:12,lineHeight:1.5}}>Le anagrafiche vengono dagli elenchi SUAP del 07/09/2026. La modifica (alias, contatti, foto) arriva con il pannello completo.</div>
        </div>
      )}

      {/* EVENTI */}
      {tab==="eventi"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={S.secLbl}>Eventi</div>
            <button style={S.addBtn} onClick={()=>setAddEv(true)}><Icon name="plus" size={15} color="#fff" sw={2}/> Aggiungi</button>
          </div>
          {addEv&&(
            <div style={S.formCard}>
              <div style={S.formH}>Nuovo Evento</div>
              {[["titolo","Titolo *"],["data","Data (YYYY-MM-DD) *"],["ora","Ora"],["luogo","Luogo"],["descrizione","Descrizione"]].map(([k,pl])=>(
                <input key={k} style={S.input} placeholder={pl} value={nEv[k]} onChange={e=>setNEv(p=>({...p,[k]:e.target.value}))}/>
              ))}
              <select style={S.select} value={nEv.categoria} onChange={e=>setNEv(p=>({...p,categoria:e.target.value}))}>
                {Object.keys(EV_COL).map(c=><option key={c}>{c}</option>)}
              </select>
              <div style={{display:"flex",gap:8}}>
                <button style={S.saveBtn} onClick={()=>{if(!nEv.titolo||!nEv.data)return;const id=Math.max(0,...eventi.map(e=>e.id))+1;setEventi(p=>[...p,{...nEv,id}]);setAddEv(false);setNEv({titolo:"",data:"",ora:"",luogo:"",descrizione:"",categoria:"Gastronomia"});}}>Salva</button>
                <button style={S.cancelBtn} onClick={()=>setAddEv(false)}>Annulla</button>
              </div>
            </div>
          )}
          <div style={S.col}>
            {eventi.map(ev=>{const col=EV_COL[ev.categoria]||"#888";return(
              <div key={ev.id} style={{...S.aRow,borderLeft:`3px solid ${col}`}}>
                <div style={{fontSize:10,fontWeight:800,color:col,minWidth:38,lineHeight:1.3,textAlign:"center"}}>
                  {new Date(ev.data).toLocaleDateString("it-IT",{day:"2-digit",month:"short"}).toUpperCase()}
                </div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#2c1d0e"}}>{ev.titolo}</div><div style={{fontSize:10,color:"#9a8070"}}>{ev.ora} · {ev.luogo}</div></div>
                <button style={S.delBtn} onClick={()=>setEventi(p=>p.filter(x=>x.id!==ev.id))}><Icon name="trash" size={15} color="#c0392b" sw={1.5}/></button>
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}

''' + s[b:]

# 6) elimina NEGOZI demo
a = s.index('const NEGOZI_COPERTO = ['); b = s.index('const EVENTI_INIT = [')
s = s[:a] + s[b:]

# 7) App root
a = s.index('// Versione dati — cambia per forzare reset cache'); b = s.index('  const [splashReady,setSplashReady]=useState(false);')
s = s[:a] + '''// Versione dati — cambia per forzare reset cache
const DATA_VERSION = "v13-firebase";

export default function App(){
  const [splash,setSplash]=useState(true);
  const [page,setPage]=useState("mappa");
  useEffect(()=>{
    if(store.get("data_version","")!==DATA_VERSION){ try{ localStorage.clear(); }catch(e){} store.set("data_version",DATA_VERSION); }
  },[]);

  // Presenze del giorno da Firestore (fallback locale se il backend non è configurato)
  const {presenze:presenzeRemote,online}=usePresenze();
  const [presenzeLocal,setPresenzeLocal]=useState({});
  const presenze=firebaseReady?presenzeRemote:presenzeLocal;
  const auth=useAuth();
  const postazioni=useMemo(()=>buildPostazioni(presenze),[presenze]);
  const elenchi=useMemo(()=>({coperto:buildElenco("coperto",presenze),ortofrutticolo:buildElenco("ortofrutticolo",presenze)}),[presenze]);
  const mercatoById=id=>MERCATI.find(m=>m.id===id);

  const [eventi,setEventi]=useState(()=>store.get("ev",EVENTI_INIT));
  const [popup,setPopup]=useState(null);
  const [catFilter,setCatFilter]=useState("Tutte");

  useEffect(()=>{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('portrait').catch(()=>{});},[]);
  useEffect(()=>{store.set("ev",eventi);},[eventi]);

  const onPresenza=async({mercatoId,espositoreId,posteggioId,presente})=>{
    if(!espositoreId) return;
    if(!firebaseReady){ setPresenzeLocal(p=>{const n={...p}; if(presente) n[espositoreId]={posteggioId,mercato:mercatoId}; else delete n[espositoreId]; return n;}); return; }
    await setPresenza({mercatoId,espositoreId,posteggioId,presente,utente:auth.user?auth.user.email:null});
  };

''' + s[b:]
rep('const PAGE_TITLES={mappa:"Mercato Aperto",', 'const PAGE_TITLES={mappa:"Area Mercatale",')
rep('{page==="mappa"   && <PageMappa espositori={espositori} popup={popup} setPopup={setPopup} catFilter={catFilter} setCatFilter={setCatFilter}/>}',
    '{page==="mappa"   && <PageMappa espositori={postazioni} popup={popup} setPopup={setPopup} catFilter={catFilter} setCatFilter={setCatFilter}/>}')
rep('{page==="coperto" && <PageMercato negozi={NEGOZI_COPERTO}/>}', '{page==="coperto" && <PageMercato negozi={elenchi.coperto} mercato={mercatoById("coperto")}/>}')
rep('{page==="orto"    && <PageMercato negozi={NEGOZI_ORTO}/>}', '{page==="orto"    && <PageMercato negozi={elenchi.ortofrutticolo} mercato={mercatoById("ortofrutticolo")}/>}')
rep('{page==="admin"   && <PageAdmin adminLogged={adminLogged} setAdminLogged={setAdminLogged} espositori={espositori} setEspositori={setEspositori} eventi={eventi} setEventi={setEventi} updPresenza={updPresenza}/>}',
    '{page==="admin"   && <PageAdmin auth={auth} postazioni={postazioni} elenchi={elenchi} eventi={eventi} setEventi={setEventi} onPresenza={onPresenza} online={online}/>}')

open(P, 'w', encoding='utf-8').write(s)
print('patch applicata:', len(s.splitlines()), 'righe')
