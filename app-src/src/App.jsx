import { useState, useEffect, useRef, useMemo } from "react";
import { firebaseReady, FOTO_ABILITATE } from "./firebase.js";
import { PageScheda, Scanner, tokenDaTesto } from "./qr.jsx";
import { PLANIMETRIA_URI, SVG_VIEWBOX, SVG_W, SVG_H, GEO, MERCATI, SETTORI, usePresenze, usePubblico, useAperture, prossimaApertura, setPresenza, useAuth, buildPostazioni, buildElenco } from "./dati.js";

// ============================================================
// GOOGLE FONT INJECTION
// ============================================================
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400&display=swap";
document.head.appendChild(fl);

// ============================================================
// SVG ICON SYSTEM — monochromatic, stroke-based
// ============================================================
const Icon = ({ name, size = 24, color = "currentColor", sw = 1.6 }) => {
  const s = { width: size, height: size, display: "block", flexShrink: 0 };
  const p = { stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  const paths = {
    map:      <><path {...p} d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path {...p} d="M9 3v15M15 6v15"/></>,
    store:    <><path {...p} d="M3 9l1-6h16l1 6"/><path {...p} d="M3 9h18v1a3 3 0 01-6 0 3 3 0 01-6 0A3 3 0 013 10V9z"/><path {...p} d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10"/></>,
    leaf:     <><path {...p} d="M11 20A7 7 0 0118 13c0 4-3 7-7 7z"/><path {...p} d="M5.07 11A7 7 0 0011 20c0-4-3-7-6-9z"/><path {...p} d="M11 20V4"/></>,
    calendar: <><rect {...p} x="3" y="4" width="18" height="18" rx="2"/><path {...p} d="M3 10h18M8 2v4M16 2v4"/><circle fill={color} stroke="none" cx="8" cy="15" r="1.2"/><circle fill={color} stroke="none" cx="12" cy="15" r="1.2"/><circle fill={color} stroke="none" cx="16" cy="15" r="1.2"/></>,
    settings: <><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    wa:       <><path {...p} d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></>,
    mail:     <><rect {...p} x="2" y="4" width="20" height="16" rx="2"/><path {...p} d="M2 7l10 7 10-7"/></>,
    plus:     <><path {...p} d="M12 5v14M5 12h14"/></>,
    trash:    <><path {...p} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path {...p} d="M10 11v6M14 11v6"/></>,
    logout:   <><path {...p} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    lock:     <><rect {...p} x="3" y="11" width="18" height="11" rx="2"/><path {...p} d="M7 11V7a5 5 0 0110 0v4"/><circle fill={color} stroke="none" cx="12" cy="16" r="1.5"/></>,
    checkCircle: <><circle {...p} cx="12" cy="12" r="10"/><path {...p} d="M8 12l3 3 5-6"/></>,
    xCircle:  <><circle {...p} cx="12" cy="12" r="10"/><path {...p} d="M15 9l-6 6M9 9l6 6"/></>,
    chevron:  <><path {...p} d="M9 18l6-6-6-6"/></>,
    pin:      <><path {...p} d="M12 21s-7-6.75-7-11a7 7 0 1114 0c0 4.25-7 11-7 11z"/><circle {...p} cx="12" cy="10" r="2.5"/></>,
    users:    <><circle {...p} cx="9" cy="7" r="4"/><path {...p} d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></>,
    zoomIn:   <><circle {...p} cx="11" cy="11" r="8"/><path {...p} d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></>,
    zoomOut:  <><circle {...p} cx="11" cy="11" r="8"/><path {...p} d="M21 21l-4.35-4.35M8 11h6"/></>,
    home:     <><path {...p} d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9"/></>,
    filter:   <><path {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
    locate:   <><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle {...p} cx="12" cy="12" r="8"/></>,
    navigate: <><path {...p} d="M3 11l19-9-9 19-2-8-8-2z"/></>,
  };
  return <svg style={s} viewBox="0 0 24 24">{paths[name]}</svg>;
};

// ============================================================
// LOGOTIPO — portale mercato + tende + sole
// ============================================================
const LogoMark = ({ size = 44, light = false }) => {
  const c = light ? "#fff" : "#3d2b1a";
  const a = "#e8a045";
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M10 62 L10 36 Q10 16 40 16 Q70 16 70 36 L70 62" stroke={c} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M5 38 L40 20 L75 38" stroke={a} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="10" y1="62" x2="10" y2="52" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="70" y1="62" x2="70" y2="52" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {[[18,62,18,46,30,46,30,62],[34,62,34,46,46,46,46,62],[50,62,50,46,62,46,62,62]].map(([x1,y1,x2,y2,x3,y3,x4,y4],i) => (
        <g key={i}>
          <path d={`M${x1} ${y1} L${x1} ${y2} L${x4} ${y3} L${x4} ${y4}`} stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d={`M${x1} ${y2} Q${(x1+x4)/2} ${y2-6} ${x4} ${y3}`} stroke={a} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </g>
      ))}
      <circle cx="40" cy="11" r="4.5" fill={a}/>
      {[[40,3.5,40,1.5],[40,18.5,40,20.5],[32,6,30,4.5],[48,6,50,4.5],[32,16,30,17.5],[48,16,50,17.5],[27.5,11,25.5,11],[52.5,11,54.5,11]].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a} strokeWidth="2" strokeLinecap="round"/>
      ))}
      <line x1="5" y1="65" x2="75" y2="65" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
};

// ============================================================
// DATI — geometria mappa, anagrafiche e calibrazione GPS vengono da ./dati.js
// (generati dai seed SUAP e dalla planimetria v2 con scripts/app/gen-data.py)
// ============================================================

function gpsToSvg(lat, lon) {
  const dx = (lon - GEO.p1Lon) * GEO.mPerLon;
  const dy = -(lat - GEO.p1Lat) * GEO.mPerLat;
  const svgX = GEO.p1SvgX + GEO.scale * (GEO.cosR * dx - GEO.sinR * dy);
  const svgY = GEO.p1SvgY + GEO.scale * (GEO.sinR * dx + GEO.cosR * dy);
  return { svgX, svgY };
}

function PageMappa({espositori,popup,setPopup,catFilter,setCatFilter,aperto,mercato}){
  const wrapRef = useRef(null);
  const layerRef = useRef(null);
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [userPos, setUserPos] = useState(null); // {svgX, svgY, accuracy}
  const [geoError, setGeoError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const stateRef = useRef({
    scale:1, offX:0, offY:0,
    velX:0, velY:0, rafId:null,
    dragging:false, didDrag:false,
    lastX:0, lastY:0, lastTime:0,
    pinching:false, pinchDist0:0, pinchScale0:1,
  });
  const espRef = useRef(espositori);
  espRef.current = espositori;
  const popupRef = useRef(popup);
  popupRef.current = popup;
  const catFilterRef = useRef(catFilter);
  catFilterRef.current = catFilter;

  function applyTransform(){
    if(!layerRef.current) return;
    const r = stateRef.current;
    layerRef.current.style.transform = `translate(${r.offX}px,${r.offY}px) scale(${r.scale})`;
  }

  function startInertia(){
    const r = stateRef.current;
    cancelAnimationFrame(r.rafId);
    function step(){
      r.velX*=0.91; r.velY*=0.91;
      r.offX+=r.velX; r.offY+=r.velY;
      applyTransform();
      if(Math.abs(r.velX)>0.3||Math.abs(r.velY)>0.3)
        r.rafId=requestAnimationFrame(step);
    }
    r.rafId=requestAnimationFrame(step);
  }

  function initView(){
    const el=wrapRef.current; if(!el) return;
    const r=stateRef.current;
    const ww=el.clientWidth, wh=el.clientHeight;
    const scaleX=ww/SVG_W, scaleY=wh/SVG_H;
    r.scale=Math.max(scaleX,scaleY)*1.05;
    r.offX=(ww-SVG_W*r.scale)/2;
    r.offY=(wh-SVG_H*r.scale)/2;
    r.velX=0; r.velY=0;
    applyTransform();
  }

  useEffect(()=>{
    const el=wrapRef.current; if(!el) return;
    const r=stateRef.current;
    initView();

    function pdist(t){ const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY; return Math.sqrt(dx*dx+dy*dy); }

    const onDown=(e)=>{
      if(e.pointerType==="touch") return;
      r.dragging=true; r.didDrag=false;
      r.velX=0; r.velY=0; cancelAnimationFrame(r.rafId);
      r.startX=e.clientX; r.startY=e.clientY;
      r.lastX=e.clientX; r.lastY=e.clientY; r.lastTime=Date.now();
      // NB: niente setPointerCapture qui. Catturare il pointer dirotterebbe
      // l'evento 'click' sul contenitore, impedendo ai bottoni della mappa e
      // alle postazioni di riceverlo. Lo attiviamo solo quando parte un pan.
    };
    const onMove=(e)=>{
      if(!r.dragging||r.pinching) return;
      // Dead-zone: sotto soglia è un click, non un pan — niente spostamento né
      // pointer capture, così il 'click' raggiunge bottoni e postazioni.
      if(!r.didDrag){
        if(Math.abs(e.clientX-r.startX)+Math.abs(e.clientY-r.startY)<=5) return;
        r.didDrag=true;
        try{ el.setPointerCapture(e.pointerId); }catch(err){}
      }
      const dx=e.clientX-r.lastX, dy=e.clientY-r.lastY;
      const dt=Math.max(Date.now()-r.lastTime,1);
      r.velX=dx/dt*14; r.velY=dy/dt*14;
      r.offX+=dx; r.offY+=dy;
      r.lastX=e.clientX; r.lastY=e.clientY; r.lastTime=Date.now();
      applyTransform();
    };
    const onUp=()=>{ r.dragging=false; startInertia(); };

    const onTouchStart=(e)=>{
      // Se il tocco parte da un bottone (zoom/home/localizza/categoria, tutti
      // figli del contenitore mappa) non gestiamo pan/pinch/hit-test: deve
      // agire solo il bottone. Altrimenti l'hit-test aprirebbe il popup della
      // postazione che sta sotto il bottone.
      r.touchOnBtn = !!(e.target.closest && e.target.closest("button"));
      if(r.touchOnBtn) return;
      if(e.touches.length===1){
        r.dragging=true; r.didDrag=false;
        r.velX=0; r.velY=0; cancelAnimationFrame(r.rafId);
        r.lastX=e.touches[0].clientX; r.lastY=e.touches[0].clientY; r.lastTime=Date.now();
      } else if(e.touches.length===2){
        r.pinching=true; r.dragging=false;
        r.pinchDist0=pdist(e.touches); r.pinchScale0=r.scale;
      }
    };
    const onTouchMove=(e)=>{
      if(r.touchOnBtn) return;
      e.preventDefault();
      if(r.pinching&&e.touches.length===2){
        const dist=pdist(e.touches);
        const ns=Math.min(8,Math.max(0.3,r.pinchScale0*(dist/r.pinchDist0)));
        const rect=el.getBoundingClientRect();
        const mx=(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left;
        const my=(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top;
        const ratio=ns/r.scale;
        r.offX=mx-(mx-r.offX)*ratio; r.offY=my-(my-r.offY)*ratio; r.scale=ns;
        applyTransform();
      } else if(r.dragging&&e.touches.length===1){
        const dx=e.touches[0].clientX-r.lastX, dy=e.touches[0].clientY-r.lastY;
        if(Math.abs(dx)+Math.abs(dy)>3) r.didDrag=true;
        const dt=Math.max(Date.now()-r.lastTime,1);
        r.velX=dx/dt*14; r.velY=dy/dt*14;
        r.offX+=dx; r.offY+=dy;
        r.lastX=e.touches[0].clientX; r.lastY=e.touches[0].clientY; r.lastTime=Date.now();
        applyTransform();
      }
    };
    const onTouchEnd=(e)=>{
      if(r.touchOnBtn){ if(e.touches.length===0) r.touchOnBtn=false; return; }
      if(e.touches.length<2) r.pinching=false;
      if(e.touches.length===0){
        const wasDrag=r.didDrag;
        r.dragging=false; startInertia();
        if(!wasDrag&&e.changedTouches&&e.changedTouches[0]){
          const t=e.changedTouches[0];
          const rect=el.getBoundingClientRect();
          const px=t.clientX-rect.left, py=t.clientY-rect.top;
          const svgX=(px-r.offX)/r.scale, svgY=(py-r.offY)/r.scale;
          const cf=catFilterRef.current;
          const hit=espRef.current.find(ep=>{
            const dimmed=cf!=="Tutte"&&ep.categoria!==cf;
            if(dimmed) return false;
            if(ep.shape==="poly"){
              const pts=ep.points.trim().split(/[\s,]+/).map(Number);
              let inside=false;
              for(let i=0,j=pts.length-2;i<pts.length;j=i,i+=2){
                const xi=pts[i],yi=pts[i+1],xj=pts[j],yj=pts[j+1];
                if(((yi>svgY)!==(yj>svgY))&&(svgX<(xj-xi)*(svgY-yi)/(yj-yi)+xi)) inside=!inside;
              }
              return inside;
            }
            return svgX>=ep.svgX&&svgX<=ep.svgX+ep.svgW&&svgY>=ep.svgY&&svgY<=ep.svgY+ep.svgH;
          });
          if(hit) setPopup(popupRef.current===hit.id?null:hit.id);
        }
      }
    };
    const onWheel=(e)=>{
      e.preventDefault();
      const rect=el.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      const factor=e.deltaY>0?0.85:1.15;
      const ns=Math.min(8,Math.max(0.3,r.scale*factor));
      const ratio=ns/r.scale;
      r.offX=mx-(mx-r.offX)*ratio; r.offY=my-(my-r.offY)*ratio; r.scale=ns;
      applyTransform();
    };

    el.addEventListener("pointerdown",onDown);
    el.addEventListener("pointermove",onMove);
    el.addEventListener("pointerup",onUp);
    el.addEventListener("pointerleave",onUp);
    el.addEventListener("touchstart",onTouchStart,{passive:false});
    el.addEventListener("touchmove",onTouchMove,{passive:false});
    el.addEventListener("touchend",onTouchEnd);
    el.addEventListener("wheel",onWheel,{passive:false});
    window.addEventListener("resize",initView);
    return ()=>{
      el.removeEventListener("pointerdown",onDown);
      el.removeEventListener("pointermove",onMove);
      el.removeEventListener("pointerup",onUp);
      el.removeEventListener("pointerleave",onUp);
      el.removeEventListener("touchstart",onTouchStart);
      el.removeEventListener("touchmove",onTouchMove);
      el.removeEventListener("touchend",onTouchEnd);
      el.removeEventListener("wheel",onWheel);
      window.removeEventListener("resize",initView);
      cancelAnimationFrame(r.rafId);
    };
  },[]);

  function zoomStep(f){
    const r=stateRef.current; const el=wrapRef.current; if(!el) return;
    const cx=el.clientWidth/2, cy=el.clientHeight/2;
    const ns=Math.min(8,Math.max(0.3,r.scale*f));
    const ratio=ns/r.scale;
    r.offX=cx-(cx-r.offX)*ratio; r.offY=cy-(cy-r.offY)*ratio; r.scale=ns;
    applyTransform();
  }

  // Geolocalizzazione utente
  function locateUser() {
    if(!navigator.geolocation){ setGeoError("GPS non supportato"); return; }
    setGeoLoading(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const {svgX, svgY} = gpsToSvg(pos.coords.latitude, pos.coords.longitude);
        setUserPos({svgX, svgY, accuracy: pos.coords.accuracy});
        setGeoLoading(false);
        // Centra la mappa sul punto utente
        const el = wrapRef.current; if(!el) return;
        const r = stateRef.current;
        const ww = el.clientWidth, wh = el.clientHeight;
        r.offX = ww/2 - svgX * r.scale;
        r.offY = wh/2 - svgY * r.scale;
        applyTransform();
      },
      (err) => {
        setGeoError("Posizione non disponibile");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const presenti=espositori.filter(e=>e.presente&&e.nome).length;
  const assegnate=espositori.filter(e=>e.nome).length;
  const libere=espositori.filter(e=>!e.nome).length;
  const esp=popup?espositori.find(e=>e.id===popup):null;


  return(
    <div ref={wrapRef} style={S.mapCont}>

      {/* LAYER: planimetria + postazioni */}
      <div ref={layerRef} style={{
        position:"absolute", top:0, left:0,
        width:SVG_W+"px", height:SVG_H+"px",
        transformOrigin:"0 0", willChange:"transform",
        userSelect:"none", touchAction:"none",
      }}>
        {/* Sfondo planimetria */}
        <img src={PLANIMETRIA_URI} alt=""
          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",display:"block",pointerEvents:"none"}}
          draggable={false}
        />

        {/* Overlay SVG interattivo — postazioni sopra la planimetria */}
        <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",overflow:"visible"}}
          viewBox={SVG_VIEWBOX} xmlns="http://www.w3.org/2000/svg">

          {/* Labels gestiti direttamente nell'SVG di Illustrator */}

          {/* Postazioni interattive */}
          {espositori.map(e=>{
            const act = popup===e.id;
            const occ = !!e.nome;
            // Filtro categoria: dimma le postazioni non corrispondenti
            const inFilter = catFilter==="Tutte" || e.categoria===catFilter;
            const dimmed = !inFilter && catFilter!=="Tutte";
            // 3 stati: PRESENTE=verde, ASSENTE=rosso 50%, LIBERA=grigio
            const fillCol = dimmed ? "rgba(200,195,188,0.18)"
              : act ? "#c8862a"
              : occ ? (e.presente ? "#3daa70" : aperto ? "rgba(210,40,40,0.50)" : "#d9c9ad")
              : "#e8e2d8";
            const strokeCol = dimmed ? "rgba(180,175,168,0.4)"
              : act ? "#c8862a"
              : occ ? (e.presente ? "#2a9060" : aperto ? "rgba(180,20,20,0.75)" : "#b8a888")
              : "#c8c0b4";
            const strokeW = act ? 2 : occ && !dimmed ? 1.2 : 0.4;
            const isPoly = e.shape === "poly";
            const tcx = isPoly ? e.cx : e.svgX + e.svgW/2;
            const tcy = isPoly ? e.cy : e.svgY + e.svgH/2;
            const dotX = isPoly ? e.cx + 8 : e.svgX + e.svgW - 3.5;
            const dotY = isPoly ? e.cy - 6 : e.svgY + 3.5;
            return(
              <g key={e.id} style={{cursor: dimmed?"default":"pointer"}}
                onClick={ev=>{
                  ev.stopPropagation();
                  if(!stateRef.current.didDrag && !dimmed) setPopup(popup===e.id?null:e.id);
                }}>
                {isPoly
                  ? <polygon points={e.points}
                      fill={fillCol} stroke={strokeCol} strokeWidth={strokeW}/>
                  : <rect x={e.svgX} y={e.svgY} width={e.svgW} height={e.svgH}
                      fill={fillCol} stroke={strokeCol} strokeWidth={strokeW} rx="1.5"/>
                }
                {occ&&!dimmed&&(aperto||e.presente)&&<circle cx={dotX} cy={dotY} r="3"
                  fill={e.presente?"#27ae60":"rgba(200,30,30,0.85)"} stroke="#fff" strokeWidth="1"/>}
                {!dimmed&&<text x={tcx} y={tcy+2.5}
                  textAnchor="middle" fontSize="6.5"
                  fill={occ?"#2c1d0e":"#9a8878"}
                  fontFamily="Montserrat,sans-serif" fontWeight="700">
                  {e.numero}
                </text>}
              </g>
            );
          })}
        {/* PUNTO UTENTE sulla planimetria */}
          {userPos && (
            <g style={{pointerEvents:"none"}}>
              {/* Alone accuratezza */}
              <circle cx={userPos.svgX} cy={userPos.svgY} r="22"
                fill="rgba(37,149,255,0.15)" stroke="rgba(37,149,255,0.3)" strokeWidth="1"/>
              {/* Punto posizione */}
              <circle cx={userPos.svgX} cy={userPos.svgY} r="8"
                fill="#2595ff" stroke="#fff" strokeWidth="2.5"/>
              {/* Pulsante interno */}
              <circle cx={userPos.svgX} cy={userPos.svgY} r="3.5"
                fill="#fff"/>
            </g>
          )}
        </svg>
      </div>

      {/* BOTTONE FILTRO CATEGORIA — floating */}
      <button style={{
        ...S.catFloatBtn,
        background: catFilter!=="Tutte" ? "#3d2b1a" : "rgba(255,255,255,0.95)",
        color: catFilter!=="Tutte" ? "#e8a045" : "#3d2b1a",
        borderColor: catFilter!=="Tutte" ? "#3d2b1a" : "rgba(200,190,180,0.7)",
      }} onClick={()=>setShowCatSheet(true)}>
        <Icon name="filter" size={15} color={catFilter!=="Tutte"?"#e8a045":"#3d2b1a"} sw={2}/>
        <span>{catFilter==="Tutte" ? "Categoria" : catFilter}</span>
        {catFilter!=="Tutte" && (
          <span style={{
            background:"rgba(255,255,255,0.2)",borderRadius:"50%",
            width:16,height:16,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:10,fontWeight:800,
          }} onClick={e=>{e.stopPropagation();setCatFilter("Tutte");}}>✕</span>
        )}
      </button>

      {/* BOTTOM SHEET CATEGORIE */}
      {showCatSheet&&(
        <div style={S.overlay} onClick={()=>setShowCatSheet(false)}>
          <div style={{...S.sheet, maxHeight:"70vh", display:"flex", flexDirection:"column"}}
            onClick={e=>e.stopPropagation()}>
            <div style={S.handle}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 4px 14px"}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#2c1d0e"}}>Filtra per categoria</div>
                {catFilter!=="Tutte"&&(
                  <div style={{fontSize:11,color:"#c8862a",fontWeight:600,marginTop:2}}>
                    {espositori.filter(e=>e.categoria===catFilter).length} postazioni trovate
                  </div>
                )}
              </div>
              <button style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#9a8070"}}
                onClick={()=>setShowCatSheet(false)}>✕</button>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {/* Voce "Tutte" sempre in cima */}
              {[{cat:"Tutte",count:espositori.filter(e=>e.nome).length},
                ...Array.from(new Set(espositori.filter(e=>e.categoria).map(e=>e.categoria))).sort()
                  .map(cat=>({cat,count:espositori.filter(e=>e.categoria===cat).length}))
              ].map(({cat,count},i,arr)=>{
                const active = catFilter===cat;
                return(
                  <button key={cat}
                    style={{
                      width:"100%", display:"flex", alignItems:"center",
                      justifyContent:"space-between", padding:"13px 4px",
                      background: active?"rgba(61,43,26,0.04)":"none",
                      border:"none", cursor:"pointer",
                      borderBottom: i<arr.length-1 ? "1px solid #f0ece4" : "none",
                      fontFamily:"'Montserrat',sans-serif",
                      borderRadius: active?8:0,
                    }}
                    onClick={()=>{setCatFilter(cat);setShowCatSheet(false);setPopup(null);}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{
                        width:10,height:10,borderRadius:"50%",flexShrink:0,
                        background: active ? "#3d2b1a" : "#d8d0c4",
                        boxShadow: active ? "0 0 0 3px rgba(61,43,26,0.15)" : "none",
                        transition:"all 0.15s",
                      }}/>
                      <span style={{
                        fontSize:14, fontWeight: active?700:500,
                        color: active?"#2c1d0e":"#6b5040",
                      }}>{cat==="Tutte"?"✦ Tutte le categorie":cat}</span>
                    </div>
                    <span style={{
                      fontSize:11,fontWeight:700,
                      background: active?"#3d2b1a":"#f0ece4",
                      color: active?"#e8a045":"#9a8070",
                      padding:"3px 9px",borderRadius:12,
                      transition:"all 0.15s",
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STATUS PILL */}
      <div style={S.statusPill}>
        {aperto?(<>
          <span style={S.sDot("#3daa70")}/><span style={S.sTxt}>{presenti} presenti</span>
          <span style={S.sSep}/>
          <span style={S.sDot("rgba(210,40,40,0.85)")}/><span style={S.sTxt}>{assegnate-presenti} assenti</span>
          <span style={S.sSep}/>
          <span style={S.sDot("#c8c0b4")}/><span style={S.sTxt}>{libere} libere</span>
        </>):(<>
          <span style={S.sDot("#c8c0b4")}/><span style={S.sTxt}>Mercato chiuso · apre {prossimaApertura(mercato)}</span>
          <span style={S.sSep}/>
          <span style={S.sTxt}>{assegnate} espositori</span>
        </>)}
      </div>

      {/* ZOOM CONTROLS */}
      <div style={S.mapControls}>
        <button style={S.zBtn} onClick={()=>zoomStep(1.4)}><Icon name="zoomIn" size={18} color="#3d2b1a" sw={1.8}/></button>
        <div style={S.zDivider}/>
        <button style={S.zBtn} onClick={()=>zoomStep(0.71)}><Icon name="zoomOut" size={18} color="#3d2b1a" sw={1.8}/></button>
        <div style={S.zDivider}/>
        <button style={{...S.zBtn, background: userPos?"#e8f4ff":"white"}}
          onClick={locateUser} title="La mia posizione">
          {geoLoading
            ? <div style={{width:16,height:16,border:"2px solid #2595ff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            : <Icon name="locate" size={18} color={userPos?"#2595ff":"#3d2b1a"} sw={1.8}/>
          }
        </button>
        <div style={{height:6}}/>
        <button style={S.zBtn} onClick={()=>{initView();setUserPos(null);}}><Icon name="home" size={18} color="#3d2b1a" sw={1.8}/></button>
      </div>
      {geoError&&<div style={{position:"absolute",bottom:70,right:12,zIndex:25,background:"rgba(200,50,50,0.9)",color:"#fff",fontSize:10,fontWeight:700,padding:"6px 10px",borderRadius:8,maxWidth:140,textAlign:"center"}}>{geoError}</div>}

      {/* POPUP BOTTOM SHEET */}
      {esp&&(
        <div style={S.overlay} onClick={()=>setPopup(null)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.handle}/>
            {esp.nome?(
              <>
                <div style={S.sheetHead}>
                  <div style={{...S.postBadge,borderColor:esp.presente?"#3daa70":"#c0b0a0",background:esp.presente?"#f0faf5":"#f5f2ec"}}>
                    <span style={{fontSize:10,fontWeight:900,color:esp.presente?"#3daa70":"#9a8878"}}>{esp.postazione}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{...S.sheetNome,overflowWrap:"anywhere"}}>{esp.nome}</div>
                    <div style={S.sheetCat}>{esp.categoria}</div>
                  </div>
                  {(aperto||esp.presente)&&<div style={{...S.presBadge,background:esp.presente?"#eaf7f0":"#fdecea",color:esp.presente?"#3daa70":"#c0392b",borderColor:esp.presente?"#3daa70":"#e07070"}}>
                    <Icon name={esp.presente?"checkCircle":"xCircle"} size={13} color={esp.presente?"#3daa70":"#c0392b"} sw={2}/>
                    {esp.presente?"Presente":"Assente"}
                  </div>}
                </div>
                <div style={S.divider}/>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:16}}>
                  {esp.titolare&&<div style={S.infoRow}><Icon name="users" size={15} color="#9a8070" sw={1.5}/><span>{esp.titolare}</span></div>}
                  <div style={S.infoRow}><Icon name="pin" size={15} color="#9a8070" sw={1.5}/><span>{esp.etichetta}{esp.superficie?` · ${esp.superficie} m`:""}</span></div>
                  {esp.descrizione&&<div style={{...S.infoRow,alignItems:"flex-start"}}><span style={{fontSize:12,color:"#6b5040",lineHeight:1.45}}>{esp.descrizione}</span></div>}
                  {FOTO_ABILITATE&&esp.foto&&esp.foto.length>0&&<div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>{esp.foto.map((u,i)=><img key={i} src={u} alt="" style={{height:110,borderRadius:10,flexShrink:0}}/>)}</div>}
                </div>
                <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                  {esp.whatsapp&&<a href={`https://wa.me/${esp.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={S.waBtnPopup}>
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
                </div>
              </>
            ):(
              <div style={{textAlign:"center",padding:"24px 0"}}>
                <div style={{fontSize:32,marginBottom:8}}>🏪</div>
                <div style={{fontSize:15,fontWeight:700,color:"#3d2b1a",marginBottom:4}}>{esp.etichetta}</div>
                <div style={{fontSize:12,color:"#9a8070"}}>{esp.inElenco?"Posteggio libero":"Posteggio non in elenco SUAP"}{esp.superficie?` · ${esp.superficie} m`:""}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ============================================================
// PAGE: MERCATO
// ============================================================
function PageMercato({negozi,mercato,aperto}){
  const cats=[...new Set(negozi.filter(n=>n.nome).map(n=>n.categoria).filter(Boolean))].sort();
  const [cat,setCat]=useState("Tutte");
  const fil=cat==="Tutte"?negozi:negozi.filter(n=>n.categoria===cat);
  const occupati=negozi.filter(n=>n.nome).length;
  return(
    <div style={S.page}>
      {mercato&&<div style={{fontSize:11,color:"#9a8070",fontWeight:600,marginBottom:10,lineHeight:1.6}}>
        <Icon name="pin" size={11} color="#9a8070" sw={1.5}/> {mercato.indirizzo||"Indirizzo da confermare"}{mercato.giorni?` · ${mercato.giorni.join(", ")}`:""}{mercato.orari?` · ${mercato.orari}`:""}<br/>
        <span style={{color:aperto?"#3daa70":"#9a8070"}}>{aperto?"● Aperto ora":`○ Chiuso · apre ${prossimaApertura(mercato)}`}</span> · {occupati} espositori, {negozi.length-occupati} posti liberi
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
              <div style={{...S.nNum,fontSize:10,padding:"0 4px",width:"auto",minWidth:36,background:n.presente?"#eaf7f0":undefined,color:n.presente?"#3daa70":undefined}} title={n.presente?"Presente oggi":""}>{n.numero||"—"}</div>
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
                {n.whatsapp&&<a href={`https://wa.me/${n.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={S.waBtnCard}>
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

// ============================================================
// PAGE: EVENTI
// ============================================================
function PageEventi({eventi}){
  const [f,setF]=useState("Tutti");
  const cats=[...new Set(eventi.map(e=>e.categoria))];
  const fil=(f==="Tutti"?eventi:eventi.filter(e=>e.categoria===f)).sort((a,b)=>new Date(a.data)-new Date(b.data));
  return(
    <div style={S.page}>
      <div style={S.filterBar}>
        {["Tutti",...cats].map(c=>(
          <button key={c} style={{...S.fBtn,...(f===c?S.fBtnAct:{})}} onClick={()=>setF(c)}>{c}</button>
        ))}
      </div>
      <div style={S.col}>
        {fil.map(ev=>{
          const d=new Date(ev.data);
          const col=EV_COL[ev.categoria]||"#888";
          return(
            <div key={ev.id} style={{...S.evCard,borderLeftColor:col}}>
              <div style={{...S.evDate,background:col}}>
                <span style={S.evGg}>{d.toLocaleDateString("it-IT",{day:"2-digit"})}</span>
                <span style={S.evMese}>{d.toLocaleDateString("it-IT",{month:"short"}).toUpperCase()}</span>
              </div>
              <div style={{padding:"12px 14px",flex:1}}>
                <div style={S.evTit}>{ev.titolo}</div>
                <div style={S.evMeta}>
                  <Icon name="pin" size={11} color="#9a8070" sw={1.5}/> {ev.ora} &nbsp;·&nbsp; {ev.luogo}
                </div>
                <div style={S.evDesc}>{ev.descrizione}</div>
                <span style={{...S.evCat,background:col+"18",color:col,border:`1px solid ${col}44`}}>{ev.categoria}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PAGE: ADMIN
// ============================================================
function PageAdmin({auth,postazioni,elenchi,eventi,setEventi,onPresenza,online,onScan}){
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
  const numKey=v=>{const m=String(v||"").match(/\d+/);return m?Number(m[0]):9999;};
  const lista=(mercato==="area-mercatale"?postazioni:elenchi[mercato]||[]).filter(e=>e.nome)
    .slice().sort((a,b)=>String(a.settore||"").localeCompare(String(b.settore||""))||numKey(a.fila)-numKey(b.fila)||numKey(a.numero)-numKey(b.numero)||String(a.numero).localeCompare(String(b.numero)));
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

      {tab==="presenze"&&(
        <button style={{...S.loginBtn,marginBottom:12,background:"#c8862a"}} onClick={onScan}><Icon name="locate" size={16} color="#fff" sw={2}/> Scansiona QR espositore</button>
      )}
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

// ============================================================
// DESIGN SYSTEM
// ============================================================
const T=["#3d2b1a","#c8862a","#e8a045","#f5f0e8","#e8dfc8","#fff","#3daa70","#2c1d0e","#6b5040","#9a8070","#d8c8b0"];
const [terra,ocra,ocraL,sand,sandD,white,green,text,textM,textL,border]=T;

const S={
  app:{fontFamily:"'Montserrat',sans-serif",background:sand,minHeight:"100dvh",display:"flex",flexDirection:"column",width:"100%",margin:"0 auto"},
  hdr:{background:terra,color:white,padding:"10px 16px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 16px rgba(0,0,0,0.28)"},
  hdrIn:{display:"flex",alignItems:"center",justifyContent:"space-between"},
  hdrLogo:{display:"flex",alignItems:"center",gap:10},
  hdrTitle:{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:white},
  hdrSub:{fontSize:9,color:ocraL,letterSpacing:4,textTransform:"uppercase",fontWeight:500},
  hdrPage:{fontSize:10,color:ocraL,letterSpacing:0.5,fontWeight:500,fontStyle:"italic"},
  main:{flex:1,overflowY:"auto",paddingBottom:72},
  nav:{position:"fixed",bottom:0,left:0,right:0,width:"100%",background:terra,display:"flex",borderTop:`1.5px solid ${ocra}33`,zIndex:200,paddingBottom:"calc(20px + env(safe-area-inset-bottom))"},
  navBtn:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 4px 10px",background:"transparent",border:"none",cursor:"pointer",WebkitAppearance:"none",appearance:"none",outline:"none",textDecoration:"none"},
  navAct:{background:"rgba(232,160,69,0.07)"},
  navLbl:{fontSize:8.5,marginTop:3,letterSpacing:0.5,textTransform:"uppercase",fontWeight:700},
  mapCont:{position:"relative",height:"calc(100dvh - 52px - 72px)",overflow:"hidden",background:"#f0ece4",touchAction:"none",cursor:"grab"},
  statusPill:{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:20,background:"rgba(20,10,4,0.75)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:20,padding:"6px 16px",display:"flex",alignItems:"center",gap:9,boxShadow:"0 2px 16px rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",whiteSpace:"nowrap"},
  sDot:(c)=>({width:7,height:7,borderRadius:"50%",background:c,display:"inline-block",flexShrink:0}),
  sTxt:{fontSize:10,color:"rgba(255,255,255,0.92)",fontWeight:700,letterSpacing:0.3},
  sSep:{width:1,height:12,background:"rgba(255,255,255,0.22)",margin:"0 2px"},
  mapControls:{position:"absolute",right:12,bottom:16,zIndex:20,display:"flex",flexDirection:"column",background:white,borderRadius:14,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",border:`1px solid ${border}`,overflow:"hidden"},
  catFloatBtn:{position:"absolute",bottom:58,left:12,zIndex:20,display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:22,borderWidth:"1.5px",borderStyle:"solid",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Montserrat',sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",letterSpacing:0.2},
  zBtn:{width:42,height:42,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  zDivider:{height:1,background:border,margin:"0 8px"},
  // WA button — solo icona, circolare
  waBtnPopup:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#22c55e",color:white,padding:"13px 18px",borderRadius:14,textDecoration:"none",fontSize:14,fontWeight:700,flex:1,boxShadow:"0 4px 16px rgba(34,197,94,0.3)"},
  naviBtn:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#2595ff",color:white,padding:"13px 18px",borderRadius:14,textDecoration:"none",fontSize:14,fontWeight:700,flex:1,boxShadow:"0 4px 16px rgba(37,149,255,0.3)"},
  waBtnCard:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"#22c55e",color:white,padding:"10px 14px",borderRadius:10,textDecoration:"none",fontSize:13,fontWeight:700,flex:1},
  overlay:{position:"fixed",inset:0,background:"rgba(20,10,4,0.55)",zIndex:300,display:"flex",alignItems:"flex-end"},
  sheet:{background:white,borderRadius:"20px 20px 0 0",padding:"8px 20px 28px",width:"100%",margin:"0 auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.22)",position:"relative"},
  handle:{width:36,height:4,background:border,borderRadius:2,margin:"0 auto 14px"},
  closeBtn:{position:"absolute",top:14,right:14,background:"none",border:"none",cursor:"pointer",display:"flex",padding:4},
  sheetHead:{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12},
  postBadge:{width:46,height:46,borderRadius:10,borderWidth:"1.5px",borderStyle:"solid",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  sheetNome:{fontSize:16,fontWeight:700,color:text,lineHeight:1.2},
  sheetCat:{fontSize:11,color:textL,marginTop:3,fontWeight:500},
  presBadge:{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:10,fontWeight:700,borderWidth:"1.5px",borderStyle:"solid",whiteSpace:"nowrap"},
  divider:{height:1,background:sandD,margin:"12px 0"},
  infoRow:{display:"flex",alignItems:"center",gap:8,fontSize:13,color:textM,fontWeight:500},

  mailBtn:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flex:1,background:sandD,color:terra,padding:"11px 0",borderRadius:12,textDecoration:"none",fontSize:13,fontWeight:600},
  page:{padding:16},
  filterBar:{display:"flex",gap:7,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none",marginBottom:14},
  fBtn:{flexShrink:0,padding:"6px 14px",borderRadius:20,borderWidth:"1px",borderStyle:"solid",borderColor:border,background:white,fontSize:11,cursor:"pointer",color:textM,whiteSpace:"nowrap",fontFamily:"'Montserrat',sans-serif",fontWeight:500},
  fBtnAct:{background:terra,color:white,borderColor:terra,fontWeight:700},
  col:{display:"flex",flexDirection:"column",gap:10},
  nCard:{background:white,borderRadius:14,padding:14,border:`1px solid ${border}`,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"},
  nTop:{display:"flex",alignItems:"center",gap:10,marginBottom:10},
  nNum:{width:36,height:36,background:sandD,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:ocra,flexShrink:0},
  nNome:{fontSize:15,fontWeight:700,color:terra},
  nTit:{fontSize:11,color:textL,marginTop:2},
  nCat:{fontSize:9,fontWeight:700,color:ocra,textTransform:"uppercase",letterSpacing:1,background:"#fdf0e0",padding:"4px 8px",borderRadius:8,whiteSpace:"nowrap",flexShrink:0},
  nDesc:{fontSize:12,color:textM,lineHeight:1.5,marginTop:8,marginBottom:4},
  nOrari:{fontSize:10,color:textL,fontWeight:600,marginBottom:6},
  evCard:{background:white,borderRadius:14,overflow:"hidden",display:"flex",border:`1px solid ${border}`,borderLeft:"4px solid",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"},
  evDate:{width:54,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:white,padding:"8px 4px"},
  evGg:{fontSize:22,fontWeight:800,lineHeight:1},
  evMese:{fontSize:9,letterSpacing:1,marginTop:2,fontWeight:700},
  evTit:{fontSize:14,fontWeight:700,color:terra,marginBottom:3},
  evMeta:{display:"flex",alignItems:"center",gap:4,fontSize:10,color:textL,marginBottom:6,fontWeight:500},
  evDesc:{fontSize:11.5,color:textM,lineHeight:1.55,marginBottom:7},
  evCat:{fontSize:9,padding:"2px 8px",borderRadius:10,letterSpacing:0.5,fontWeight:700,textTransform:"uppercase"},
  loginWrap:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"70vh",padding:24},
  loginBox:{background:white,borderRadius:20,padding:28,width:"100%",maxWidth:320,textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",border:`1px solid ${border}`},
  loginH:{fontSize:20,fontWeight:800,color:terra,marginBottom:6},
  loginSub:{fontSize:12,color:textL,marginBottom:22,lineHeight:1.5},
  input:{width:"100%",padding:"11px 13px",borderRadius:10,borderWidth:"1.5px",borderStyle:"solid",borderColor:border,fontSize:13,marginBottom:10,background:sand,color:terra,outline:"none",boxSizing:"border-box",fontFamily:"'Montserrat',sans-serif",fontWeight:500},
  errMsg:{color:"#c0392b",fontSize:11,marginBottom:10,fontWeight:600},
  loginBtn:{width:"100%",padding:"13px 0",background:terra,color:white,border:"none",borderRadius:10,fontSize:14,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Montserrat',sans-serif"},
  loginHint:{fontSize:10,color:textL,marginTop:14},
  logoutBtn:{display:"flex",alignItems:"center",gap:5,background:sandD,border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,cursor:"pointer",color:terra,fontWeight:600,fontFamily:"'Montserrat',sans-serif"},
  aTab:{flex:1,padding:"8px 4px 6px",borderWidth:"1px",borderStyle:"solid",borderColor:border,borderRadius:10,background:white,fontSize:10,cursor:"pointer",color:textM,display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"'Montserrat',sans-serif",fontWeight:700,letterSpacing:0.3},
  aTabAct:{background:terra,color:white,borderColor:terra},
  secLbl:{fontSize:9,fontWeight:700,color:textL,letterSpacing:2,textTransform:"uppercase",marginBottom:8,marginTop:2},
  presRow:{background:white,borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,border:`1px solid ${border}`},
  togBtn:{fontSize:10,padding:"5px 10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",fontFamily:"'Montserrat',sans-serif"},
  addBtn:{display:"flex",alignItems:"center",gap:5,background:ocra,color:white,border:"none",borderRadius:8,padding:"7px 13px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"'Montserrat',sans-serif"},
  formCard:{background:white,borderRadius:14,padding:14,border:`1.5px solid ${ocra}`,marginBottom:12},
  formH:{fontSize:13,fontWeight:700,color:terra,marginBottom:10},
  select:{width:"100%",padding:"11px 12px",borderRadius:10,border:`1.5px solid ${border}`,fontSize:13,marginBottom:10,background:sand,color:terra,outline:"none",boxSizing:"border-box",fontFamily:"'Montserrat',sans-serif"},
  saveBtn:{flex:1,padding:"11px 0",background:terra,color:white,border:"none",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:700,fontFamily:"'Montserrat',sans-serif"},
  cancelBtn:{flex:1,padding:"11px 0",background:sandD,color:terra,border:"none",borderRadius:10,fontSize:13,cursor:"pointer",fontFamily:"'Montserrat',sans-serif",fontWeight:600},
  aRow:{background:white,borderRadius:12,padding:"11px 12px",display:"flex",alignItems:"center",gap:10,border:`1px solid ${border}`},
  delBtn:{background:"#fdecea",border:"none",borderRadius:8,padding:"7px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
};

const GCss=`
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#3d2b1a;-webkit-font-smoothing:antialiased;}
  ::-webkit-scrollbar{width:0;height:0;}
  input:focus,select:focus{border-color:#c8862a!important;box-shadow:0 0 0 3px rgba(200,134,42,0.1);}
  .pb{transition:opacity 0.1s;}
  .pb:active{opacity:0.7;}
  button,a{-webkit-tap-highlight-color:transparent;}
  nav button{background:transparent!important;color:inherit;}
  nav a{color:inherit;text-decoration:none;}
  @keyframes spin{to{transform:rotate(360deg);}}
`;

// ============================================================
// DATI STATICI — mercati, eventi, colori
// ============================================================
const EVENTI_INIT = [
  {id:1,titolo:"Sagra della Frisa Salentina",data:"2025-06-14",ora:"18:00",luogo:"Piazza Mercato",descrizione:"Degustazione di frisa con pomodoro, ricotta e olio EVO del territorio.",categoria:"Gastronomia"},
  {id:2,titolo:"Mercatino dell'Antiquariato",data:"2025-06-21",ora:"09:00",luogo:"Mercato Aperto",descrizione:"Prima edizione del mercatino vintage e antiquariato di Maglie.",categoria:"Cultura"},
  {id:3,titolo:"Notte dei Mercati",data:"2025-07-05",ora:"20:00",luogo:"Area Mercatale",descrizione:"Apertura straordinaria notturna con musica dal vivo.",categoria:"Evento Speciale"},
  {id:4,titolo:"Workshop Olio EVO",data:"2025-07-12",ora:"10:00",luogo:"Mercato Coperto",descrizione:"Corso di degustazione degli oli extravergine del Salento.",categoria:"Formazione"},
  {id:5,titolo:"Expo Prodotti Locali",data:"2025-08-02",ora:"09:00",luogo:"Area Mercatale",descrizione:"Esposizione e vendita dei migliori prodotti locali del Salento.",categoria:"Fiera"},
];
const EV_COL = {
  Gastronomia:"#b87320", Cultura:"#5a3e8a",
  "Evento Speciale":"#a02030", Formazione:"#1a5a8a", Fiera:"#1e7a50"
};

// ============================================================
// LANDSCAPE OVERLAY — invita a ruotare in verticale
// ============================================================
function LandscapeOverlay(){
  const [landscape,setLandscape]=useState(false);
  useEffect(()=>{
    const check=()=>{
      // NON usare innerWidth>innerHeight: su Android la tastiera virtuale
      // riduce innerHeight e farebbe comparire l'overlay mentre si digita,
      // rubando il focus al campo. screen.orientation riflette l'orientamento
      // FISICO del dispositivo e non cambia all'apertura della tastiera.
      const ae=document.activeElement;
      if(ae&&(ae.tagName==="INPUT"||ae.tagName==="TEXTAREA"||ae.tagName==="SELECT")) return;
      const ot=screen.orientation&&screen.orientation.type;
      const isLandscape = ot
        ? ot.startsWith("landscape")
        : window.matchMedia("(orientation: landscape)").matches;
      setLandscape(isLandscape);
    };
    check();
    window.addEventListener("resize",check);
    window.addEventListener("orientationchange",()=>setTimeout(check,100));
    return()=>{window.removeEventListener("resize",check);};
  },[]);
  if(!landscape) return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#3d2b1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Montserrat',sans-serif",gap:20}}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e8a045" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <path d="M12 18h.01"/>
      </svg>
      <div style={{color:"#fff",fontSize:16,fontWeight:700,textAlign:"center",letterSpacing:1}}>Ruota il telefono</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,textAlign:"center",maxWidth:240,lineHeight:1.6}}>Questa app funziona solo in modalità verticale</div>
    </div>
  );
}

// ============================================================
// INSTALL BANNER — invita ad aggiungere alla schermata home
// ============================================================
function InstallBanner(){
  const [prompt,setPrompt]=useState(null);
  const [show,setShow]=useState(false);
  const isIos=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
  const isStandalone=window.matchMedia('(display-mode:standalone)').matches||navigator.standalone;

  useEffect(()=>{
    if(isStandalone) return;
    const dismissed=store.get("install_dismissed",0);
    if(dismissed&&Date.now()-dismissed<7*24*60*60*1000) return;
    const handler=(e)=>{e.preventDefault();setPrompt(e);setShow(true);};
    window.addEventListener("beforeinstallprompt",handler);
    if(isIos) setShow(true);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);

  const dismiss=()=>{store.set("install_dismissed",Date.now());setShow(false);};
  const install=async()=>{if(prompt){await prompt.prompt();dismiss();}};

  if(!show||isStandalone) return null;
  const s={
    wrap:{position:"fixed",bottom:80,left:12,right:12,zIndex:300,background:"#3d2b1a",border:"1.5px solid rgba(200,134,42,0.4)",borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",fontFamily:"'Montserrat',sans-serif"},
    icon:{width:40,height:40,borderRadius:10,background:"rgba(200,134,42,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
    txt:{flex:1,color:"#fff",fontSize:12,lineHeight:1.5},
    bold:{fontWeight:700,color:"#e8a045"},
    btn:{background:"#c8862a",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:0.5,whiteSpace:"nowrap"},
    close:{position:"absolute",top:8,right:10,background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:18,cursor:"pointer",lineHeight:1},
  };
  return(
    <div style={s.wrap}>
      <div style={s.icon}><Icon name="home" size={22} color="#e8a045"/></div>
      <div style={s.txt}>
        {isIos?(
          <>Tocca <span style={s.bold}>Condividi</span> poi <span style={s.bold}>Aggiungi a schermata Home</span></>
        ):(
          <>Installa l'app per un'esperienza migliore</>
        )}
      </div>
      {prompt&&<button style={s.btn} onClick={install}>Installa</button>}
      <button style={s.close} onClick={dismiss}>×</button>
    </div>
  );
}

// ============================================================
// SPLASH SCREEN
// ============================================================
function Splash({onEnter}){
  const [on,setOn]=useState(false);
  useEffect(()=>{setTimeout(()=>setOn(true),60);},[]);
  const ss={
    wrap:{position:"fixed",inset:0,background:"#3d2b1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:1000,fontFamily:"'Montserrat',sans-serif",overflow:"hidden"},
    radial:{position:"absolute",inset:0,background:"radial-gradient(ellipse at 25% 15%,rgba(232,160,69,0.2) 0%,transparent 55%)"},
    content:{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px",maxWidth:400,width:"100%"},
    sub:{color:"rgba(255,255,255,0.5)",fontSize:10,letterSpacing:7,textTransform:"uppercase",fontWeight:600,marginBottom:4,textAlign:"center"},
    city:{color:"#fff",fontSize:44,fontWeight:900,letterSpacing:8,textTransform:"uppercase",lineHeight:1,textAlign:"center"},
    orn:{display:"flex",alignItems:"center",gap:10,marginTop:18,marginBottom:22,width:"55%"},
    line:{flex:1,height:1,background:"rgba(232,160,69,0.4)"},
    gem:{width:6,height:6,background:"#e8a045",transform:"rotate(45deg)",flexShrink:0},
    desc:{color:"rgba(255,255,255,0.65)",fontSize:13,lineHeight:1.8,textAlign:"center",fontWeight:300,marginBottom:22,maxWidth:320},
    pills:{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",marginBottom:34},
    pill:{background:"rgba(232,160,69,0.14)",border:"1px solid rgba(232,160,69,0.32)",color:"#e8a045",fontSize:9,padding:"5px 13px",borderRadius:20,fontWeight:700,letterSpacing:1,textTransform:"uppercase"},
    cta:{padding:"16px 32px",background:"#e8a045",color:"#3d2b1a",border:"none",borderRadius:14,fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 28px rgba(232,160,69,0.38)"},
    footer:{color:"rgba(255,255,255,0.25)",fontSize:9,letterSpacing:2.5,textTransform:"uppercase",marginTop:26},
  };
  return(
    <div style={ss.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes popIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={ss.radial}/>
      <div style={ss.content}>
        <div style={{animation:on?"popIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both":"none",marginBottom:28}}>
          <LogoMark size={96} light/>
        </div>
        <div style={{animation:on?"fadeUp 0.5s 0.2s both":"none"}}>
          <div style={ss.sub}>AREA MERCATALE</div>
          <div style={ss.city}>MAGLIE</div>
        </div>
        <div style={{animation:on?"fadeUp 0.5s 0.35s both":"none",...ss.orn}}>
          <div style={ss.line}/><div style={ss.gem}/><div style={ss.line}/>
        </div>
        <p style={{animation:on?"fadeUp 0.5s 0.5s both":"none",...ss.desc}}>
          La piattaforma ufficiale dell'area mercatale di Maglie. Esplora la mappa interattiva degli espositori, scopri i mercati e tutti gli eventi in programma.
        </p>
        <div style={{animation:on?"fadeUp 0.5s 0.65s both":"none",...ss.pills}}>
          {["Mappa Live","Mercato Coperto","Ortofrutta","Eventi"].map(f=>(
            <span key={f} style={ss.pill}>{f}</span>
          ))}
        </div>
        <div style={{animation:on?"fadeUp 0.5s 0.82s both":"none",textAlign:"center"}}>
          <button style={ss.cta} onClick={onEnter}>
            Entra nell'Area Mercatale
            <Icon name="chevron" size={20} color="#3d2b1a" sw={2.5}/>
          </button>
        </div>
        <div style={{animation:on?"fadeUp 0.5s 1s both":"none",...ss.footer}}>
          Comune di Maglie · Lecce · Puglia
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP ROOT — export default
// ============================================================
const store={
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
};

// Versione dati — cambia per forzare reset cache
const DATA_VERSION = "v13-firebase";

export default function App(){
  const [qrToken,setQrToken]=useState(()=>tokenDaTesto(window.location.hash));
  const [splash,setSplash]=useState(()=>!tokenDaTesto(window.location.hash));
  const [page,setPage]=useState("mappa");
  const [scanner,setScanner]=useState(false);
  useEffect(()=>{
    if(store.get("data_version","")!==DATA_VERSION){ try{ localStorage.clear(); }catch(e){} store.set("data_version",DATA_VERSION); }
    const onHash=()=>{ const t=tokenDaTesto(window.location.hash); setQrToken(t); if(t){ setSplash(false); setScanner(false); } };
    window.addEventListener("hashchange",onHash); return()=>window.removeEventListener("hashchange",onHash);
  },[]);
  const chiudiScheda=()=>{ setQrToken(null); if(window.location.hash) history.replaceState(null,"",window.location.pathname+window.location.search); };

  // Presenze del giorno da Firestore (fallback locale se il backend non è configurato)
  const {presenze:presenzeRemote,online}=usePresenze();
  const [presenzeLocal,setPresenzeLocal]=useState({});
  const presenze=firebaseReady?presenzeRemote:presenzeLocal;
  const auth=useAuth();
  const live=usePubblico();
  const aperture=useAperture();
  const postazioni=useMemo(()=>buildPostazioni(presenze,live),[presenze,live]);
  const elenchi=useMemo(()=>({coperto:buildElenco("coperto",presenze,live),ortofrutticolo:buildElenco("ortofrutticolo",presenze,live)}),[presenze,live]);
  const mercatoById=id=>MERCATI.find(m=>m.id===id);

  const [eventi,setEventi]=useState(()=>store.get("ev",EVENTI_INIT));
  const [popup,setPopup]=useState(null);
  const [catFilter,setCatFilter]=useState("Tutte");

  useEffect(()=>{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('portrait').catch(()=>{});},[]);
  useEffect(()=>{store.set("ev",eventi);},[eventi]);

  const onPresenza=async({mercatoId,espositoreId,posteggioId,presente,metodo,posizione})=>{
    if(!espositoreId) return;
    if(!firebaseReady){ setPresenzeLocal(p=>{const n={...p}; if(presente) n[espositoreId]={posteggioId,mercato:mercatoId}; else delete n[espositoreId]; return n;}); return; }
    await setPresenza({mercatoId,espositoreId,posteggioId,presente,utente:auth.user?auth.user.email:null,metodo:metodo||"manuale",posizione:posizione||null});
  };

  const [splashReady,setSplashReady]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setSplashReady(true),2000);return()=>clearTimeout(t);},[]);
  if(splash) return <Splash onEnter={()=>{if(splashReady) setSplash(false);}}/>;

  const NAV=[
    {id:"mappa",icon:"map",label:"Mappa"},
    {id:"coperto",icon:"store",label:"Coperto"},
    {id:"orto",icon:"leaf",label:"Ortofrutta"},
    {id:"eventi",icon:"calendar",label:"Eventi"},
    {id:"admin",icon:"settings",label:"Gestione"},
  ];
  const PAGE_TITLES={scheda:"Espositore",mappa:"Area Mercatale",coperto:"Mercato Coperto",orto:"Mercato Ortofrutticolo",eventi:"Eventi",admin:"Gestione"};

  return(
    <div style={S.app}>
      <style>{GCss}</style>
      <LandscapeOverlay/>
      <InstallBanner/>
      {/* HEADER */}
      <header style={S.hdr}>
        <div style={S.hdrIn}>
          <div style={S.hdrLogo}>
            <LogoMark size={36} light/>
            <div>
              <div style={S.hdrTitle}>Area Mercatale</div>
              <div style={S.hdrSub}>Maglie</div>
            </div>
          </div>
          <div style={S.hdrPage}>{qrToken?PAGE_TITLES.scheda:PAGE_TITLES[page]}</div>
        </div>
      </header>
      {/* MAIN */}
      {scanner&&<Scanner S={S} onClose={()=>setScanner(false)} onToken={(t)=>{setScanner(false);window.location.hash="#/v/"+t;}}/>}
      <main style={S.main}>
        {qrToken && <PageScheda token={qrToken} auth={auth} postazioni={postazioni} elenchi={elenchi} presenze={presenze} onPresenza={onPresenza} onBack={chiudiScheda} S={S} Icon={Icon}/>}
        {!qrToken && page==="mappa"   && <PageMappa espositori={postazioni} popup={popup} setPopup={setPopup} catFilter={catFilter} setCatFilter={setCatFilter} aperto={aperture["area-mercatale"]} mercato={mercatoById("area-mercatale")}/>}
        {!qrToken && page==="coperto" && <PageMercato negozi={elenchi.coperto} mercato={mercatoById("coperto")} aperto={aperture.coperto}/>}
        {!qrToken && page==="orto"    && <PageMercato negozi={elenchi.ortofrutticolo} mercato={mercatoById("ortofrutticolo")} aperto={aperture.ortofrutticolo}/>}
        {!qrToken && page==="eventi"  && <PageEventi eventi={eventi}/>}
        {!qrToken && page==="admin"   && <PageAdmin auth={auth} postazioni={postazioni} elenchi={elenchi} eventi={eventi} setEventi={setEventi} onPresenza={onPresenza} online={online} onScan={()=>setScanner(true)}/>}
      </main>
      {/* BOTTOM NAV */}
      <nav style={S.nav}>
        {NAV.map(n=>{
          const act=page===n.id;
          return(
            <button key={n.id} style={{...S.navBtn,...(act?{background:"rgba(232,160,69,0.07)"}:{})}}
              onClick={()=>{setPage(n.id);setPopup(null);chiudiScheda();}}>
              <Icon name={n.icon} size={22} color={act?"#e8a045":"#786050"} sw={act?2:1.5}/>
              <span style={{fontSize:8.5,marginTop:3,letterSpacing:0.5,textTransform:"uppercase",fontWeight:700,color:act?"#e8a045":"#786050"}}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
