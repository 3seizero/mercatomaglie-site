import { useState, useEffect, useRef } from "react";

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
    car:      <><path {...p} d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle {...p} cx="7" cy="17" r="2"/><circle {...p} cx="17" cy="17" r="2"/><path {...p} d="M5 12h14"/></>,
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
// DATA — 251 postazioni da planimetria vettoriale reale
// ============================================================
const ESPOSITORI_INIT = (()=>{
  const filled = [
  {id:1,postazione:"P001",shape:"rect",svgX:664.64,svgY:486.31,svgW:20.93,svgH:42.79,cx:675.10,cy:507.70,nome:"Frutta & Sapori",titolare:"Giovanni Marzo",categoria:"Alimentare",whatsapp:"393331234567",targa:"BA123XY",presente:true},
  {id:2,postazione:"P002",shape:"rect",svgX:687.25,svgY:486.31,svgW:20.93,svgH:42.79,cx:697.71,cy:507.70,nome:"Abbigliamento Sole",titolare:"Maria Greco",categoria:"Abbigliamento",whatsapp:"393337654321",targa:"LE456AB",presente:true},
  {id:3,postazione:"P003",shape:"rect",svgX:722.19,svgY:486.31,svgW:20.93,svgH:42.79,cx:732.65,cy:507.70,nome:"Calzature DeLux",titolare:"Antonio Rizzo",categoria:"Calzature",whatsapp:"393339876543",targa:"BR789CD",presente:true},
  {id:4,postazione:"P004",shape:"rect",svgX:744.80,svgY:486.31,svgW:20.93,svgH:42.79,cx:755.26,cy:507.70,nome:"Profumi & Bellezza",titolare:"Lucia Toma",categoria:"Cosmetica",whatsapp:"393332345678",targa:"LE321EF",presente:true},
  {id:5,postazione:"P005",shape:"rect",svgX:779.74,svgY:486.31,svgW:20.93,svgH:42.79,cx:790.20,cy:507.70,nome:"Spezie del Salento",titolare:"Francesco Bello",categoria:"Alimentare",whatsapp:"393335678901",targa:"TA654GH",presente:true},
  {id:6,postazione:"P006",shape:"rect",svgX:802.35,svgY:486.31,svgW:20.93,svgH:42.79,cx:812.81,cy:507.70,nome:"Tessuti Preziosi",titolare:"Rosa Manno",categoria:"Tessuti",whatsapp:"393338901234",targa:"BR987IJ",presente:true},
  {id:7,postazione:"P007",shape:"rect",svgX:837.29,svgY:486.31,svgW:20.93,svgH:42.79,cx:847.75,cy:507.70,nome:"Elettronica Viva",titolare:"Marco Fusco",categoria:"Elettronica",whatsapp:"393331122334",targa:"LE147KL",presente:true},
  {id:8,postazione:"P008",shape:"rect",svgX:859.90,svgY:486.31,svgW:20.93,svgH:42.79,cx:870.36,cy:507.70,nome:"Bigiotteria Arte",titolare:"Carmen Liso",categoria:"Bigiotteria",whatsapp:"393334455667",targa:"BA258MN",presente:true},
  {id:9,postazione:"P009",shape:"rect",svgX:894.84,svgY:486.31,svgW:20.93,svgH:42.79,cx:905.30,cy:507.70,nome:"Casalinghi & Co.",titolare:"Salvatore Urso",categoria:"Casalinghi",whatsapp:"393337788990",targa:"LE369OP",presente:true},
  {id:10,postazione:"P010",shape:"rect",svgX:917.45,svgY:486.31,svgW:20.93,svgH:42.79,cx:927.91,cy:507.70,nome:"Formaggi Pugliesi",titolare:"Grazia Conte",categoria:"Alimentare",whatsapp:"393330011223",targa:"TA741QR",presente:true},
  {id:11,postazione:"P011",shape:"rect",svgX:952.39,svgY:486.31,svgW:20.93,svgH:42.79,cx:962.85,cy:507.70,nome:"Fiori & Piante",titolare:"Vito Palmieri",categoria:"Floricoltura",whatsapp:"393333344556",targa:"BR852ST",presente:true},
  {id:12,postazione:"P012",shape:"poly",points:"995.924 529.096 974.999 529.096 974.999 486.309 985.461 486.309 995.924 500.899 995.924 529.096",cx:987.21,cy:510.13,nome:"Olii Extravergine",titolare:"Donato Suma",categoria:"Alimentare",whatsapp:"393339900112",targa:"TA159WX",presente:true},
  {id:13,postazione:"P013",shape:"poly",points:"1055.763 563.353 1012.229 563.353 1012.229 517.411 1033.996 540.382 1055.763 563.353",cx:1034.00,cy:549.57,nome:"Borse Artigianali",titolare:"Miriam Greco",categoria:"Pelletteria",whatsapp:"393332233445",targa:"BA357YZ",presente:true},
  {id:14,postazione:"P014",shape:"rect",svgX:664.64,svgY:531.12,svgW:20.93,svgH:42.79,cx:675.10,cy:552.51,nome:"Vini Salentini",titolare:"Cosimo Resta",categoria:"Alimentare",whatsapp:"393335566778",targa:"LE468AA",presente:true},
  {id:15,postazione:"P015",shape:"rect",svgX:687.25,svgY:531.12,svgW:20.93,svgH:42.79,cx:697.71,cy:552.51,nome:"Ceramiche Arte",titolare:"Angela Nuzzo",categoria:"Artigianato",whatsapp:"393338899001",targa:"BR579BB",presente:true},
  {id:16,postazione:"P016",shape:"rect",svgX:722.19,svgY:531.12,svgW:20.93,svgH:42.79,cx:732.65,cy:552.51,nome:"Street Food Sud",titolare:"Luigi Stomeo",categoria:"Ristorazione",whatsapp:"393331234000",targa:"LE680CC",presente:true},
  {id:17,postazione:"P017",shape:"rect",svgX:744.80,svgY:531.12,svgW:20.93,svgH:42.79,cx:755.26,cy:552.51,nome:"Pasticceria Dolce",titolare:"Teresa Colì",categoria:"Alimentare",whatsapp:"393334567890",targa:"TA791DD",presente:true},
  {id:18,postazione:"P018",shape:"rect",svgX:779.74,svgY:531.12,svgW:20.93,svgH:42.79,cx:790.20,cy:552.51,nome:"Libri & Cultura",titolare:"Pietro Cataldi",categoria:"Editoria",whatsapp:"393337890123",targa:"BA802EE",presente:true},
  {id:19,postazione:"P019",shape:"rect",svgX:802.35,svgY:531.12,svgW:20.93,svgH:42.79,cx:812.81,cy:552.51,nome:"Sport & Outdoor",titolare:"Rocco Longo",categoria:"Sport",whatsapp:"393330123456",targa:"LE913FF",presente:true},
  {id:20,postazione:"P020",shape:"rect",svgX:837.29,svgY:531.12,svgW:20.93,svgH:42.79,cx:847.75,cy:552.51,nome:"Erbe Salentine",titolare:"Nunzia Cazzato",categoria:"Erboristeria",whatsapp:"393333210987",targa:"BR024GG",presente:true},
  {id:21,postazione:"P021",shape:"rect",svgX:859.90,svgY:531.12,svgW:20.93,svgH:42.79,cx:870.36,cy:552.51,nome:"Abbigliamento Moda Sud",titolare:"Carmela Ingrosso",categoria:"Abbigliamento",whatsapp:"393331112233",targa:"LE221AA",presente:true},
  {id:22,postazione:"P022",shape:"rect",svgX:894.84,svgY:531.12,svgW:20.93,svgH:42.79,cx:905.30,cy:552.51,nome:"Delizie Salentine",titolare:"Oronzo De Marco",categoria:"Alimentare",whatsapp:"393332223344",targa:"BA332BB",presente:true},
  {id:23,postazione:"P023",shape:"rect",svgX:917.45,svgY:531.12,svgW:20.93,svgH:42.79,cx:927.91,cy:552.51,nome:"Pelletteria Artigiana",titolare:"Filomena Greco",categoria:"Pelletteria",whatsapp:"393333334455",targa:"TA443CC",presente:true},
  {id:24,postazione:"P024",shape:"rect",svgX:952.39,svgY:531.12,svgW:20.93,svgH:42.79,cx:962.85,cy:552.51,nome:"Tecnologia Facile",titolare:"Massimo Erroi",categoria:"Elettronica",whatsapp:"393334445566",targa:"LE554DD",presente:true},
  {id:25,postazione:"P025",shape:"rect",svgX:975.00,svgY:531.12,svgW:20.93,svgH:42.79,cx:985.46,cy:552.51,nome:"Intimo & Lingerie",titolare:"Rossella Ciardo",categoria:"Abbigliamento",whatsapp:"393335556677",targa:"BR665EE",presente:true},
  {id:26,postazione:"P026",shape:"rect",svgX:1012.23,svgY:564.72,svgW:20.93,svgH:42.75,cx:1022.69,cy:586.10,nome:"Sapori di Puglia",titolare:"Donato Coppola",categoria:"Alimentare",whatsapp:"393336667788",targa:"LE776FF",presente:true},
  {id:27,postazione:"P027",shape:"rect",svgX:1034.84,svgY:564.72,svgW:20.93,svgH:42.75,cx:1045.30,cy:586.10,nome:"Ottica Moderna",titolare:"Luigi Stomeo",categoria:"Ottica",whatsapp:"393337778899",targa:"BA887GG",presente:true},
  {id:28,postazione:"P028",shape:"rect",svgX:664.64,svgY:575.92,svgW:20.93,svgH:32.92,cx:675.10,cy:592.38,nome:"Giochi & Giocattoli",titolare:"Maria Paola Urso",categoria:"Giocattoli",whatsapp:"393338889900",targa:"TA998HH",presente:true},
  {id:29,postazione:"P029",shape:"rect",svgX:687.25,svgY:575.92,svgW:20.93,svgH:32.92,cx:697.71,cy:592.38,nome:"Ceramiche Salentine",titolare:"Vincenzo Raho",categoria:"Artigianato",whatsapp:"393339990011",targa:"LE109II",presente:true},
  {id:30,postazione:"P030",shape:"rect",svgX:722.19,svgY:575.92,svgW:20.93,svgH:32.92,cx:732.65,cy:592.38,nome:"Orologi & Bijoux",titolare:"Grazia Manno",categoria:"Bigiotteria",whatsapp:"393330001122",targa:"BR210JJ",presente:true},
  {id:31,postazione:"P031",shape:"rect",svgX:744.80,svgY:575.92,svgW:20.93,svgH:32.92,cx:755.26,cy:592.38,nome:"Tessuti & Tendaggi",titolare:"Salvatore Prete",categoria:"Tessuti",whatsapp:"393331113344",targa:"LE321KK",presente:true},
  {id:32,postazione:"P032",shape:"rect",svgX:779.74,svgY:575.92,svgW:20.93,svgH:32.92,cx:790.20,cy:592.38,nome:"Pane & Dolci",titolare:"Antonia Vergine",categoria:"Alimentare",whatsapp:"393332224455",targa:"BA432LL",presente:true},
  {id:33,postazione:"P033",shape:"rect",svgX:802.35,svgY:575.92,svgW:20.93,svgH:32.92,cx:812.81,cy:592.38,nome:"Coltelleria Artigiana",titolare:"Pietro Liso",categoria:"Artigianato",whatsapp:"393333335566",targa:"TA543MM",presente:true},
  {id:34,postazione:"P034",shape:"rect",svgX:837.29,svgY:575.92,svgW:20.93,svgH:32.92,cx:847.75,cy:592.38,nome:"Erboristeria Natura",titolare:"Nunzia Palma",categoria:"Erboristeria",whatsapp:"393334446677",targa:"LE654NN",presente:true},
  {id:35,postazione:"P035",shape:"rect",svgX:859.90,svgY:575.92,svgW:20.93,svgH:32.92,cx:870.36,cy:592.38,nome:"Calzature Comfort",titolare:"Antonio De Giorgi",categoria:"Calzature",whatsapp:"393335557788",targa:"BR765OO",presente:true},
  {id:36,postazione:"P036",shape:"rect",svgX:894.84,svgY:575.92,svgW:20.93,svgH:32.92,cx:905.30,cy:592.38,nome:"Profumeria Esclusiva",titolare:"Rosa Cataldi",categoria:"Cosmetica",whatsapp:"393336668899",targa:"LE876PP",presente:true},
  {id:37,postazione:"P037",shape:"rect",svgX:917.45,svgY:575.92,svgW:20.93,svgH:32.92,cx:927.91,cy:592.38,nome:"Fiori & Composizioni",titolare:"Vito Pastore",categoria:"Floricoltura",whatsapp:"393337779900",targa:"BA987QQ",presente:false},
  {id:38,postazione:"P038",shape:"rect",svgX:952.39,svgY:575.92,svgW:20.93,svgH:32.92,cx:962.85,cy:592.38,nome:"Sport & Fitness",titolare:"Marco Resta",categoria:"Sport",whatsapp:"393338880011",targa:"TA098RR",presente:false},
  {id:39,postazione:"P039",shape:"rect",svgX:975.00,svgY:575.92,svgW:20.93,svgH:32.92,cx:985.46,cy:592.38,nome:"Casa & Cucina",titolare:"Angela Ciullo",categoria:"Casalinghi",whatsapp:"393339991122",targa:"LE109SS",presente:false},
  {id:40,postazione:"P040",shape:"rect",svgX:664.64,svgY:610.87,svgW:20.93,svgH:32.92,cx:675.10,cy:627.33,nome:"Vini & Liquori",titolare:"Cosimo Palmieri",categoria:"Alimentare",whatsapp:"393330002233",targa:"BR210TT",presente:false},
  {id:41,postazione:"P041",shape:"rect",svgX:687.25,svgY:610.87,svgW:20.93,svgH:32.92,cx:697.71,cy:627.33,nome:"Borse & Valigie",titolare:"Miriam Fersino",categoria:"Pelletteria",whatsapp:"393331113355",targa:"LE321UU",presente:false},
  {id:42,postazione:"P042",shape:"rect",svgX:722.19,svgY:610.87,svgW:20.93,svgH:32.92,cx:732.65,cy:627.33,nome:"Giornali & Libri",titolare:"Pietro Erroi",categoria:"Editoria",whatsapp:"393332224466",targa:"BA432VV",presente:false},
  {id:43,postazione:"P043",shape:"rect",svgX:744.80,svgY:610.87,svgW:20.93,svgH:32.92,cx:755.26,cy:627.33,nome:"Articoli Religiosi",titolare:"Teresa Mancarella",categoria:"Artigianato",whatsapp:"393333335577",targa:"TA543WW",presente:false},
  {id:44,postazione:"P044",shape:"rect",svgX:779.74,svgY:610.87,svgW:20.93,svgH:32.92,cx:790.20,cy:627.33,nome:"Casalinghi Premium",titolare:"Eugenia Coppola",categoria:"Casalinghi",whatsapp:"393334446688",targa:"LE654XX",presente:false},
  {id:45,postazione:"P045",shape:"rect",svgX:802.35,svgY:610.87,svgW:20.93,svgH:32.92,cx:812.81,cy:627.33,nome:"Abbigliamento Bimbi",titolare:"Lucia Panese",categoria:"Abbigliamento",whatsapp:"393335557799",targa:"BR765YY",presente:false},
  {id:46,postazione:"P046",shape:"rect",svgX:837.29,svgY:610.87,svgW:20.93,svgH:32.92,cx:847.75,cy:627.33,nome:"Miele & Prodotti Bio",titolare:"Francesco Erroi",categoria:"Alimentare",whatsapp:"393336668800",targa:"LE876ZZ",presente:false},
  {id:47,postazione:"P047",shape:"rect",svgX:859.90,svgY:610.87,svgW:20.93,svgH:32.92,cx:870.36,cy:627.33,nome:"Elettrodomestici",titolare:"Rocco Ingrosso",categoria:"Elettronica",whatsapp:"393337779911",targa:"BA987AA",presente:false},
  {id:48,postazione:"P048",shape:"rect",svgX:894.84,svgY:610.87,svgW:20.93,svgH:32.92,cx:905.30,cy:627.33,nome:"Maglieria Artigiana",titolare:"Carmen Ciardo",categoria:"Tessuti",whatsapp:"393338880022",targa:"TA098BB",presente:false},
  {id:49,postazione:"P049",shape:"rect",svgX:917.45,svgY:610.87,svgW:20.93,svgH:32.92,cx:927.91,cy:627.33,nome:"Spezie & Aromi",titolare:"Giovanni Fersino",categoria:"Alimentare",whatsapp:"393339991133",targa:"LE109CC",presente:false},
  {id:50,postazione:"P050",shape:"rect",svgX:952.39,svgY:610.87,svgW:20.93,svgH:32.92,cx:962.85,cy:627.33,nome:"Ottica & Fotografia",titolare:"Silvana Palmieri",categoria:"Ottica",whatsapp:"393330002244",targa:"BR210DD",presente:false}
  ];
  const emptyRects = [
  [51,"P051",975.00,610.87,20.93,32.92,985.46,627.33],
  [52,"P052",1012.23,608.85,20.93,34.94,1022.69,626.32],
  [53,"P053",1034.84,608.85,20.93,34.94,1045.30,626.32],
  [54,"P054",897.72,671.33,20.93,36.14,908.18,689.40],
  [55,"P055",920.33,671.33,20.93,36.14,930.79,689.40],
  [56,"P056",955.27,671.33,20.93,36.14,965.73,689.40],
  [57,"P057",977.88,671.33,20.93,36.14,988.34,689.40],
  [58,"P058",1013.23,671.33,20.93,36.14,1023.69,689.40],
  [59,"P059",1035.84,671.33,20.93,36.14,1046.30,689.40],
  [60,"P060",897.72,708.74,20.93,34.50,908.18,725.98],
  [61,"P061",920.33,708.74,20.93,34.50,930.79,725.98],
  [62,"P062",955.27,708.74,20.93,34.50,965.73,725.98],
  [63,"P063",977.88,708.74,20.93,34.50,988.34,725.98],
  [64,"P064",1013.23,708.74,20.93,34.50,1023.69,725.98],
  [65,"P065",1035.84,708.74,20.93,34.50,1046.30,725.98],
  [66,"P066",897.72,744.50,20.93,34.50,908.18,761.75],
  [67,"P067",920.33,744.50,20.93,34.50,930.79,761.75],
  [68,"P068",955.27,744.50,20.93,34.50,965.73,761.75],
  [69,"P069",977.88,744.50,20.93,34.50,988.34,761.75],
  [70,"P070",1013.23,744.50,20.93,34.50,1023.69,761.75],
  [71,"P071",1035.84,744.50,20.93,34.50,1046.30,761.75],
  [72,"P072",1186.83,732.85,20.93,34.50,1197.29,750.10],
  [73,"P073",1209.43,732.85,20.93,34.50,1219.90,750.10],
  [74,"P074",1186.83,768.62,20.93,34.50,1197.29,785.86],
  [75,"P075",1209.43,768.62,20.93,34.50,1219.90,785.86],
  [76,"P076",897.72,780.26,20.93,34.50,908.18,797.51],
  [77,"P077",920.33,780.26,20.93,34.50,930.79,797.51],
  [78,"P078",955.27,780.26,20.93,34.50,965.73,797.51],
  [79,"P079",977.88,780.26,20.93,34.50,988.34,797.51],
  [80,"P080",1013.23,780.26,20.93,34.50,1023.69,797.51],
  [81,"P081",1035.84,780.26,20.93,34.50,1046.30,797.51],
  [83,"P083",1186.83,804.38,20.93,34.50,1197.29,821.63],
  [84,"P084",1209.43,804.38,20.93,34.50,1219.90,821.63],
  [85,"P085",1245.82,804.38,20.93,34.50,1256.28,821.63],
  [86,"P086",1268.42,804.38,20.93,34.50,1278.89,821.63],
  [87,"P087",897.72,816.03,20.93,34.50,908.18,833.28],
  [88,"P088",920.33,816.03,20.93,34.50,930.79,833.28],
  [89,"P089",955.27,816.03,20.93,34.50,965.73,833.28],
  [90,"P090",977.88,816.03,20.93,34.50,988.34,833.28],
  [91,"P091",1013.23,816.03,20.93,34.50,1023.69,833.28],
  [92,"P092",1035.84,816.03,20.93,34.50,1046.30,833.28],
  [93,"P093",897.72,851.79,20.93,34.50,908.18,869.04],
  [94,"P094",920.33,851.79,20.93,34.50,930.79,869.04],
  [95,"P095",955.27,851.79,20.93,34.50,965.73,869.04],
  [96,"P096",977.88,851.79,20.93,34.50,988.34,869.04],
  [97,"P097",1013.23,851.79,20.93,34.50,1023.69,869.04],
  [98,"P098",1035.84,851.79,20.93,34.50,1046.30,869.04],
  [99,"P099",1186.83,840.14,20.93,34.50,1197.29,857.39],
  [100,"P100",1209.43,840.14,20.93,34.50,1219.90,857.39],
  [101,"P101",1245.82,840.14,20.93,34.50,1256.28,857.39],
  [102,"P102",1268.42,840.14,20.93,34.50,1278.89,857.39],
  [103,"P103",1303.37,840.14,20.93,34.50,1313.83,857.39],
  [104,"P104",1325.97,840.14,20.93,34.50,1336.44,857.39],
  [105,"P105",897.72,887.55,20.93,34.50,908.18,904.80],
  [106,"P106",920.33,887.55,20.93,34.50,930.79,904.80],
  [107,"P107",955.27,887.55,20.93,34.50,965.73,904.80],
  [108,"P108",977.88,887.55,20.93,34.50,988.34,904.80],
  [109,"P109",1013.23,887.55,20.93,34.50,1023.69,904.80],
  [110,"P110",1035.84,887.55,20.93,34.50,1046.30,904.80],
  [111,"P111",1186.83,875.91,20.93,34.50,1197.29,893.16],
  [112,"P112",1209.43,875.91,20.93,34.50,1219.90,893.16],
  [113,"P113",1245.82,875.91,20.93,34.50,1256.28,893.16],
  [114,"P114",1268.42,875.91,20.93,34.50,1278.89,893.16],
  [115,"P115",1303.37,875.91,20.93,34.50,1313.83,893.16],
  [116,"P116",1325.97,875.91,20.93,34.50,1336.44,893.16],
  [117,"P117",897.72,923.32,20.93,34.50,908.18,940.57],
  [118,"P118",920.33,923.32,20.93,34.50,930.79,940.57],
  [119,"P119",955.27,923.32,20.93,34.50,965.73,940.57],
  [120,"P120",977.88,923.32,20.93,34.50,988.34,940.57],
  [121,"P121",1013.23,923.32,20.93,34.50,1023.69,940.57],
  [122,"P122",1035.84,923.32,20.93,34.50,1046.30,940.57],
  [123,"P123",1186.83,911.67,20.93,43.85,1197.29,933.60],
  [124,"P124",1209.43,911.67,20.93,43.85,1219.90,933.60],
  [125,"P125",1245.82,911.67,20.93,43.85,1256.28,933.60],
  [126,"P126",1268.42,911.67,20.93,43.85,1278.89,933.60],
  [127,"P127",1303.37,911.67,20.93,43.85,1313.83,933.60],
  [128,"P128",1325.97,911.67,20.93,43.85,1336.44,933.60],
  [129,"P129",1361.92,911.67,20.93,43.85,1372.38,933.60],
  [130,"P130",1384.53,911.67,20.93,43.85,1394.99,933.60],
  [131,"P131",668.28,984.98,20.93,34.50,678.74,1002.23],
  [132,"P132",690.89,984.98,20.93,34.50,701.35,1002.23],
  [133,"P133",727.24,984.98,20.93,34.50,737.71,1002.23],
  [134,"P134",749.85,984.98,20.93,34.50,760.31,1002.23],
  [135,"P135",784.79,984.98,20.93,34.50,795.26,1002.23],
  [136,"P136",807.40,984.98,20.93,34.50,817.87,1002.23],
  [137,"P137",842.76,984.98,20.93,34.50,853.22,1002.23],
  [138,"P138",865.37,984.98,20.93,34.50,875.83,1002.23],
  [139,"P139",900.72,984.98,20.93,34.50,911.18,1002.23],
  [140,"P140",923.33,984.98,20.93,34.50,933.79,1002.23],
  [141,"P141",958.27,984.98,20.93,34.50,968.73,1002.23],
  [142,"P142",980.88,984.98,20.93,34.50,991.34,1002.23],
  [143,"P143",1016.23,984.98,20.93,34.50,1026.69,1002.23],
  [144,"P144",1038.84,984.98,20.93,34.50,1049.30,1002.23],
  [145,"P145",1189.83,980.30,20.93,37.77,1200.29,999.19],
  [146,"P146",1212.43,980.30,20.93,37.77,1222.90,999.19],
  [147,"P147",1247.82,980.30,20.93,37.77,1258.28,999.19],
  [148,"P148",1270.42,980.30,20.93,37.77,1280.89,999.19],
  [149,"P149",1305.37,980.30,20.93,37.77,1315.83,999.19],
  [150,"P150",1327.97,980.30,20.93,37.77,1338.44,999.19],
  [151,"P151",1363.92,980.30,20.93,37.77,1374.38,999.19],
  [152,"P152",1386.53,980.30,20.93,37.77,1396.99,999.19],
  [153,"P153",1422.47,980.30,20.93,37.77,1432.93,999.19],
  [154,"P154",1445.08,980.30,20.93,37.77,1455.54,999.19],
  [155,"P155",668.28,1021.15,20.93,37.99,678.74,1040.15],
  [156,"P156",690.89,1021.15,20.93,37.99,701.35,1040.15],
  [157,"P157",727.24,1021.15,20.93,37.99,737.71,1040.15],
  [158,"P158",749.85,1021.15,20.93,37.99,760.31,1040.15],
  [159,"P159",784.79,1021.15,20.93,37.99,795.26,1040.15],
  [160,"P160",807.40,1021.15,20.93,37.99,817.87,1040.15],
  [161,"P161",842.76,1021.15,20.93,37.99,853.22,1040.15],
  [162,"P162",865.37,1021.15,20.93,37.99,875.83,1040.15],
  [163,"P163",900.72,1021.15,20.93,37.99,911.18,1040.15],
  [164,"P164",923.33,1021.15,20.93,37.99,933.79,1040.15],
  [165,"P165",958.27,1021.15,20.93,37.99,968.73,1040.15],
  [166,"P166",980.88,1021.15,20.93,37.99,991.34,1040.15],
  [167,"P167",1016.23,1021.15,20.93,37.99,1026.69,1040.15],
  [168,"P168",1038.84,1021.15,20.93,37.99,1049.30,1040.15],
  [169,"P169",1189.83,1019.48,20.93,34.56,1200.29,1036.76],
  [170,"P170",1212.43,1019.48,20.93,34.56,1222.90,1036.76],
  [171,"P171",1247.82,1019.48,20.93,34.56,1258.28,1036.76],
  [172,"P172",1270.42,1019.48,20.93,34.56,1280.89,1036.76],
  [173,"P173",1305.37,1019.48,20.93,34.56,1315.83,1036.76],
  [174,"P174",1327.97,1019.48,20.93,34.56,1338.44,1036.76],
  [175,"P175",1363.92,1019.48,20.93,34.56,1374.38,1036.76],
  [176,"P176",1386.53,1019.48,20.93,34.56,1396.99,1036.76],
  [177,"P177",1422.47,1019.48,20.93,34.56,1432.93,1036.76],
  [178,"P178",1445.08,1019.48,20.93,34.56,1455.54,1036.76],
  [179,"P179",668.28,1060.82,20.93,34.50,678.74,1078.07],
  [180,"P180",690.89,1060.82,20.93,34.50,701.35,1078.07],
  [181,"P181",727.24,1060.82,20.93,34.50,737.71,1078.07],
  [182,"P182",749.85,1060.82,20.93,34.50,760.31,1078.07],
  [183,"P183",784.79,1060.82,20.93,34.50,795.26,1078.07],
  [184,"P184",807.40,1060.82,20.93,34.50,817.87,1078.07],
  [185,"P185",842.76,1060.82,20.93,34.50,853.22,1078.07],
  [186,"P186",865.37,1060.82,20.93,34.50,875.83,1078.07],
  [187,"P187",900.72,1060.82,20.93,34.50,911.18,1078.07],
  [188,"P188",923.33,1060.82,20.93,34.50,933.79,1078.07],
  [189,"P189",958.27,1060.82,20.93,34.50,968.73,1078.07],
  [190,"P190",980.88,1060.82,20.93,34.50,991.34,1078.07],
  [191,"P191",1016.23,1060.82,20.93,34.50,1026.69,1078.07],
  [192,"P192",1038.84,1060.82,20.93,34.50,1049.30,1078.07],
  [193,"P193",1189.83,1055.44,20.93,36.21,1200.29,1073.55],
  [194,"P194",1212.43,1055.44,20.93,36.21,1222.90,1073.55],
  [195,"P195",1247.82,1055.44,20.93,36.21,1258.28,1073.55],
  [196,"P196",1270.42,1055.44,20.93,36.21,1280.89,1073.55],
  [197,"P197",1305.37,1055.44,20.93,36.21,1315.83,1073.55],
  [198,"P198",1327.97,1055.44,20.93,36.21,1338.44,1073.55],
  [204,"P204",668.28,1097.00,20.93,43.13,678.74,1118.56],
  [205,"P205",690.89,1097.00,20.93,43.13,701.35,1118.56],
  [206,"P206",727.24,1097.00,20.93,43.13,737.71,1118.56],
  [207,"P207",749.85,1097.00,20.93,43.13,760.31,1118.56],
  [208,"P208",784.79,1097.00,20.93,43.13,795.26,1118.56],
  [209,"P209",807.40,1097.00,20.93,43.13,817.87,1118.56],
  [210,"P210",842.76,1097.00,20.93,43.13,853.22,1118.56],
  [211,"P211",865.37,1097.00,20.93,43.13,875.83,1118.56],
  [212,"P212",900.72,1097.00,20.93,43.13,911.18,1118.56],
  [213,"P213",923.33,1097.00,20.93,43.13,933.79,1118.56],
  [214,"P214",958.27,1097.00,20.93,43.13,968.73,1118.56],
  [215,"P215",980.88,1097.00,20.93,43.13,991.34,1118.56],
  [216,"P216",1016.23,1097.00,20.93,43.13,1026.69,1118.56],
  [217,"P217",1038.84,1097.00,20.93,43.13,1049.30,1118.56],
  [222,"P222",668.28,1141.80,20.93,43.95,678.74,1163.78],
  [223,"P223",690.89,1141.80,20.93,43.95,701.35,1163.78],
  [224,"P224",727.24,1141.80,20.93,43.95,737.71,1163.78],
  [225,"P225",749.85,1141.80,20.93,43.95,760.31,1163.78],
  [226,"P226",784.79,1141.80,20.93,43.95,795.26,1163.78],
  [227,"P227",807.40,1141.80,20.93,43.95,817.87,1163.78],
  [228,"P228",842.76,1141.80,20.93,43.95,853.22,1163.78],
  [229,"P229",865.37,1141.80,20.93,43.95,875.83,1163.78],
  [230,"P230",900.72,1141.80,20.93,43.95,911.18,1163.78],
  [231,"P231",923.33,1141.80,20.93,43.95,933.79,1163.78],
  [232,"P232",958.27,1141.80,20.93,43.95,968.73,1163.78],
  [233,"P233",980.88,1141.80,20.93,43.95,991.34,1163.78],
  [236,"P236",668.28,1187.43,20.93,43.95,678.74,1209.41],
  [237,"P237",690.89,1187.43,20.93,43.95,701.35,1209.41],
  [238,"P238",727.24,1187.43,20.93,43.95,737.71,1209.41],
  [239,"P239",749.85,1187.43,20.93,43.95,760.31,1209.41],
  [240,"P240",784.79,1187.43,20.93,43.95,795.26,1209.41],
  [241,"P241",807.40,1187.43,20.93,43.95,817.87,1209.41]
  ];
  const emptyPolys = [
  [82,"P082","1289.349 803.112 1245.815 803.112 1245.815 751.762 1289.349 803.112",1267.58,790.27],
  [199,"P199","1384.841 1100.834 1363.916 1106.315 1363.916 1055.444 1384.841 1055.444 1384.841 1100.834",1376.47,1083.77],
  [200,"P200","1407.45 1094.531 1386.525 1100.286 1386.525 1055.444 1407.45 1055.444 1407.45 1094.531",1399.08,1080.05],
  [201,"P201","1466.001 1078.008 1422.467 1090.009 1422.467 1055.444 1466.001 1055.444 1466.001 1078.008",1448.59,1071.38],
  [202,"P202","1326.29 1116.729 1305.366 1122.347 1305.366 1093.058 1326.29 1093.058 1326.29 1116.729",1317.92,1108.38],
  [203,"P203","1348.899 1110.562 1327.975 1116.318 1327.975 1093.058 1348.899 1093.058 1348.899 1110.562",1340.53,1104.71],
  [218,"P218","1210.751 1148.107 1189.826 1153.999 1189.826 1093.058 1210.751 1093.058 1210.751 1148.107",1202.38,1127.27],
  [219,"P219","1233.36 1141.804 1212.435 1147.559 1212.435 1093.058 1233.36 1093.058 1233.36 1141.804",1224.99,1123.46],
  [220,"P220","1268.74 1132.151 1247.815 1137.968 1247.815 1093.058 1268.74 1093.058 1268.74 1132.151",1260.37,1117.68],
  [221,"P221","1291.349 1126.046 1270.424 1131.664 1270.424 1093.058 1291.349 1093.058 1291.349 1126.046",1282.98,1113.97],
  [234,"P234","1059.763 1186.235 1038.838 1191.755 1038.838 1141.804 1059.763 1141.804 1059.763 1186.235",1051.39,1169.57],
  [235,"P235","1037.154 1192.195 1016.229 1197.686 1016.229 1141.804 1037.154 1141.804 1037.154 1192.195",1028.78,1173.14],
  [242,"P242","921.642 1222.615 900.717 1228.062 900.717 1187.434 921.642 1187.434 921.642 1222.615",913.27,1209.63],
  [243,"P243","944.251 1216.449 923.326 1221.998 923.326 1187.434 944.251 1187.434 944.251 1216.449",935.88,1205.95],
  [244,"P244","1001.802 1201.342 958.268 1213.057 958.268 1187.434 1001.802 1187.434 1001.802 1201.342",984.39,1198.12],
  [245,"P245","863.68 1237.688 842.756 1243.134 842.756 1187.434 863.68 1187.434 863.68 1237.688",855.31,1218.68],
  [246,"P246","886.289 1231.864 865.365 1237.311 865.365 1187.434 886.289 1187.434 886.289 1231.864",877.92,1215.18],
  [247,"P247","828.328 1247.348 784.794 1258.539 784.794 1233.063 828.328 1233.063 828.328 1247.348",810.91,1243.87],
  [248,"P248","689.206 1284.014 668.282 1289.586 668.282 1233.063 689.206 1233.063 689.206 1284.014",680.84,1264.75],
  [249,"P249","711.815 1278.014 690.891 1283.625 690.891 1233.063 711.815 1233.063 711.815 1278.014",703.45,1261.16],
  [250,"P250","748.168 1268.724 727.243 1274.136 727.243 1233.063 748.168 1233.063 748.168 1268.724",739.80,1255.54],
  [251,"P251","770.777 1262.763 749.852 1268.313 749.852 1233.063 770.777 1233.063 770.777 1262.763",762.41,1251.99]
  ];
  const fromRects = emptyRects.map(([id,postazione,svgX,svgY,svgW,svgH,cx,cy])=>
    ({id,postazione,shape:"rect",svgX,svgY,svgW,svgH,cx,cy,nome:"",titolare:"",categoria:"",whatsapp:"",targa:"",presente:false})
  );
  const fromPolys = emptyPolys.map(([id,postazione,points,cx,cy])=>
    ({id,postazione,shape:"poly",points,cx,cy,nome:"",titolare:"",categoria:"",whatsapp:"",targa:"",presente:false})
  );
  return [...filled,...fromRects,...fromPolys].sort((a,b)=>a.id-b.id);
})();

// SVG viewBox della planimetria originale
const SVG_VIEWBOX = "0 0 2055.647 1554.619";

// Segnaposto Bar & Area Ristoro — rettangolo arancione nella planimetria
// (Area_Bar/Eventi): x=631.823 y=677.309 width=236 height=281
const BAR_SVG = {x:631.823, y:677.309, w:236, h:281};


// ============================================================
// PAGE: MAPPA — planimetria vettoriale + overlay postazioni
// ============================================================

// SVG planimetria come data URI (evita problemi di parsing JSX)
const PLANIMETRIA_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDIwNTUuNjQ3IDE1NTQuNjE5Ij48ZyBpZD0iQXJlYV9NYXBwYSI+CiAgICA8cGF0aCBmaWxsPSIjZjBlY2U0IiBkPSJNNDgzLjI2OSwxMTM0LjI3OGwuNTYyLTQuMjE4Yy4xNC03LjMyNC0uMjcyLTUyLjIwNC0yNi41MDYtMTQyLjc5Mi0xMi41NTMtNDMuMzQ1LTE5LjQyOS03OS4yODMtMjQuOTU1LTEwOC4xNTktMTEuNTg4LTYwLjU2MS0xNC43MDItNzYuODM4LTUyLjk2Ny0xMTMuMzc4bC0zLjI5MS0zLjE0My0xMDAuMDExLTExMi4xNiwxMDcuMzg4LTEwNC4yODYsNDA5LjE2LTM5OS42NTYsMS41NzEtMS40MjRjMTEuNDYtMTAuMzg1LDQzLjA4My0zNC41NDEsODkuMS0zNC41NDEsMzQuMzc4LDAsNjYuOTQzLDEzLjYzMSw5MS42OTQsMzguMzgxLDEyLjA1NiwxMi4wMDgsNTI3LjkyMSw1MTkuOTQyLDgwMS4yNTUsNzg5LjA1MywzNC41MywzMS4xNyw1MC4xNzIsNzYuNjI1LDQwLjk2LDEyMC40MDUtNS45ODIsMjguNDM2LTIyLjE5OCw1NC4wMzctNDUuNjU5LDcyLjA4OC0xNC4yNjgsMTAuOTc4LTMxLjE1MywxOS4xNTYtNTAuMTg5LDI0LjMwOS0yNy45OTgsNy41NzctMTA1Mi4yNDksMjc3LjQ1Mi0xMDk1LjgzNywyODguOTM3bC0xNDIuMjc1LDM3LjQ4N3YtMzQ2LjkwM1oiLz4KICA8L2c+CiAgPGcgaWQ9IlN0cmFkYV9kaV9hY2Nlc3NvIj4KICAgIDxwYXRoIGZpbGw9IiM3MDZmNmYiIGQ9Ik00NjIuNjQ0LDYyNy4zMjZsNDA3LjcxNi0zOTguMjQ2czEyLjg0MS0xMS42MzgsMjQuNDc5LDAsODA0LjMxOSw3OTIuMDc0LDgwNC4zMTksNzkyLjA3NGMwLDAsMjAuNTU0LDE2LjU5LTcuMzk5LDI0LjE1NnMtMTA5NS4xMDUsMjg4Ljc0MS0xMDk1LjEwNSwyODguNzQxdi0xOTIuMjQ2czcuMzk5LTU1LjQ4OC0zMC40Mi0xODYuMDc2LTE3LjI2NS0xODQuODUxLTEwOC41MjQtMjcxLjk5OWwtMjQuNjY1LTI3LjY2MSwyOS41OTctMjguNzQzWiIvPgogIDwvZz4KICA8ZyBpZD0iQXJlYV9NZXJjYXRvIj4KICAgIDxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0xMTg5LjgyNiwxMTU4LjIyNmwyODQuOTk4LTc3LjU2M3YtMTE3LjUwNWwtNDgxLjQ4Ny00OTEuODg3LTE2My41MTMtMTY1Ljk2Mi0yNzEsMjY3LTg2LDg0LDIwLjIsMTguNjQ2YzMuMzg3LDMuMTI3LDcuMDc1LDUuOTAyLDEwLjkzMSw4LjQyOCwxNi40NCwxMC43NjksMjcuMDI4LDI2Ljc5NCwzMi40NjIsMzYuNzg4LDIuNjIyLDQuODIyLDQuNjI0LDkuOTU2LDYuMDI4LDE1LjI2M2w2Ni4zNzksMjUwLjg3NWg1MnYzMDhsNDA2LjUxMi0xMDYuODc2LDEyMi40OS0yOS4yMDdaIi8+CiAgPC9nPgogIDxnIGlkPSJBcmVlX1BhcmNoZWdnaW8iPgogICAgPHBvbHlnb24gZmlsbD0iI2U2ZDg2NyIgcG9pbnRzPSI3NzYuMzYzIDM4Ni4zMTYgNzc2LjM2MyAzNjYuMDM2IDg3NS4wMjEgMzY2LjAzNiA5NTIuMzkgNDQ3LjcwMyA5NTIuMzkgNDcxLjI3MiA5MzAuNzg4IDQ3MS4yNzIgOTMwLjc4OCA0NTUuOTI1IDkyMy44MDIgNDU1LjkyNSA5MjMuODAyIDQ2NC4xNDYgNzI4LjEzIDQ2NC4xNDYgNzI4LjEzIDQ0Ni4wNTkgNzIyLjE4OCA0NDYuMDU5IDcyMi4xODggNDcxLjI3MiA3MDAuMTc3IDQ3MS4yNzIgNzAwLjE3NyA0NDYuMDU5IDY4Ny4yNDYgNDQ2LjA1OSA3NDcuODU4IDM4NS40NDcgNzc2LjM2MyAzODYuMzE2Ii8+CiAgICA8cG9seWdvbiBmaWxsPSIjZTZkODY3IiBwb2ludHM9IjEwNTEuNzkzIDQxNi41MzcgMTIyMy44MTkgNTg0Ljg2MiAxMTY5LjMxNSA2NDAuMzg1IDgzNC43NTMgMzAwLjE1MyA4ODQuNzA5IDI0OS4yNjMgMTA1MS43OTMgNDE2LjUzNyIvPgogICAgPHBvbHlnb24gZmlsbD0iI2U2ZDg2NyIgcG9pbnRzPSIxMjM5LjIyOSA1OTkuMTU1IDE0MDkuODk1IDc3My4yNDIgMTM1My4zMDQgODMwLjk0OCAxMTgzLjc1OCA2NTYuMDY5IDEyMzkuMjI5IDU5OS4xNTUiLz4KICAgIDxwYXRoIGZpbGw9IiNlNmQ4NjciIGQ9Ik0xNDI0Ljc2Niw3ODguMjVsMjI5LjEwNiwyMjcuODA0czYuMDI5LDcuODc5LTUuNDgxLDExLjcxNi01NC4yNjIsMTcuNTM5LTU0LjI2MiwxNy41MzlsLTg5LjM0LTg5LjUxMi0xMy4xNTQsMTIuMjI5LTEyMy44NzEtMTI1LjUxNSw1Ny4wMDItNTQuMjYyWiIvPgogIDwvZz4KICA8ZyBpZD0iQWl1b2xlIj4KICAgIDxwb2x5Z29uIGZpbGw9IiM5ZWM1ODMiIHBvaW50cz0iMTQ3NC44MjMgMTA4MC42NjQgMTQ3NC44MjMgOTYyLjQzNCAxNDkxLjYzNCA5NjguMDI3IDE1MDQuNzg5IDk1NS43OTggMTU5NC4xMjkgMTA0NS4zMDkgMTQ3NC44MjMgMTA4MC42NjQiLz4KICAgIDxwb2x5Z29uIGZpbGw9IiM5ZWM1ODMiIHBvaW50cz0iODI5LjgyMyAzMDUuMzA5IDgzNC43NTMgMzAwLjE1MyAxMTY5LjMxNSA2NDAuMzg1IDExNjMuOTgzIDY0NS42MDQgODI5LjgyMyAzMDUuMzA5Ii8+CiAgICA8cGF0aCBmaWxsPSIjOWVjNTgzIiBkPSJNNjM4LjgyMyw1NDYuMzA5djgycy4xMDMsMTktMTcsMTloLTEzOS43ODZsMTU3LjI3NC0xNTQuMy0uNDg4LDUzLjNaIi8+CiAgICA8cG9seWdvbiBmaWxsPSIjOWVjNTgzIiBwb2ludHM9IjEwNjkuODIzIDY0Mi4zMDkgMTA2OS44MjMgNTcwLjE1OSAxMTQyLjM5OCA2NDIuNzM0IDEwNjkuODIzIDY0Mi4zMDkiLz4KICAgIDxwb2x5Z29uIGZpbGw9IiM5ZWM1ODMiIHBvaW50cz0iNzQ3Ljg1OCAzODUuNDQ3IDgyOS44MjMgMzA1LjMwOSA5OTMuMzM2IDQ3MS4yNzIgOTUyLjM5IDQ3MS4yNzIgOTUyLjM5IDQ0Ny43MDMgODc1LjAyMSAzNjYuMDM2IDc3Ni4zNjMgMzY2LjAzNiA3NzYuMzYzIDM4Ni4zMTYgNzQ3Ljg1OCAzODUuNDQ3Ii8+CiAgICA8cGF0aCBmaWxsPSIjOWVjNTgzIiBkPSJNMTA3Mi44MjQsNjg2LjMwOXMxLTE4LDE2LTE4aDY4czE3LjUtMS4wOTIsMTcuNSwxNy41YzAsMjMuNSwwLDI1NC41LDAsMjU0LjUsMCwwLC4xODQsMTUuMjA5LTE1LjI1LDE1LjI1LTE4LjI1LjA0OC03MC4yNSwwLTcwLjI1LDAsMCwwLTE0LjYyNS0xLTE0LjYyNS0xNC42MjVzLTEuMzc1LTI1NC42MjUtMS4zNzUtMjU0LjYyNVoiLz4KICAgIDxwYXRoIGZpbGw9IiM5ZWM1ODMiIGQ9Ik0xMDcyLjgyNCwxMDAwLjMwOXMxLTE4LDE2LTE4aDY4czE3LjY4NC0uNjg2LDE3LjUsMTcuNWMtLjIzNywyMy40OTksMCwxNDguNSwwLDE0OC41LDAsMCwuMTg0LDExLjk5My0xNS4yNSwxNS4yNWwtNzAuMDcxLDE2LjcxNXMtMTQuODA0LS43Mi0xNC44MDQtMTQuMzQ1LTEuMzc1LTE2NS42Mi0xLjM3NS0xNjUuNjJaIi8+CiAgICA8cG9seWdvbiBmaWxsPSIjOWVjNTgzIiBwb2ludHM9IjE0MDMuMjgxIDkxMC40MDMgMTM2MS45MTYgOTEwLjQwMyAxMzYxLjkxNiA4NjkuMDM5IDE0MDMuMjgxIDkxMC40MDMiLz4KICAgIDxwb2x5Z29uIGZpbGw9IiM5ZWM1ODMiIHBvaW50cz0iMTMzMS44ODMgODM5LjAwNiAxMzAzLjM2NiA4MzkuMDA2IDEzMDMuMzY2IDgxMC41OTIgMTMzMS44ODMgODM5LjAwNiIvPgogICAgPHBvbHlnb24gZmlsbD0iIzllYzU4MyIgcG9pbnRzPSIxMjI2LjYyOCA3MzEuMjAxIDExODYuODI2IDczMS4yMDEgMTE4Ni44MjYgNzA1LjQ0OCAxMjAxLjY4OSA3MDUuNDQ4IDEyMjYuNjI4IDczMS4yMDEiLz4KICAgIDxwb2x5Z29uIGZpbGw9IiM5ZWM1ODMiIHBvaW50cz0iMTQ0OC42MDUgOTU1LjcyOCAxNDA3LjI0MSA5NTUuNzI4IDE0MDcuMjQxIDkxNC4zNjMgMTQ0OC42MDUgOTU1LjcyOCIvPgogICAgPHBhdGggZmlsbD0iIzllYzU4MyIgZD0iTTYzMS44MjMsMTMwMS45MTh2LTE3MS41MjZzLTMuMzExLTcxLjI0OC0xMy43MjQtMTAxLjQyOGMtLjg5NC0yLjU5MS05LjI3Ni00Mi42NTUtOS4yNzYtNDIuNjU1aDUydjMwOGwtMjksNy42MDlaIi8+CiAgICA8cGF0aCBmaWxsPSIjOWVjNTgzIiBkPSJNNjE5LjE5NSw2NzcuMzA5djExNS45NzFoLTQwLjAxMWwtMTQuMjUxLTUwLjA0OHMtMS43OS0xMi4wODctMTguMDg3LTQ0LjIyNWMtMTAuNDk4LTIwLjcwMi0xNC4yNTEtMjEuNjk4LTE0LjI1MS0yMS42OThoODYuNloiLz4KICAgIDxwb2x5Z29uIGZpbGw9IiM5ZWM1ODMiIHBvaW50cz0iMTM2Mi4xMjcgODQ4LjAyOSAxMzY3Ljc2MyA4NDIuNTEyIDE0OTEuNjM0IDk2OC4wMjcgMTQ3NC44MjMgOTYyLjQzNCAxMzYyLjEyNyA4NDguMDI5Ii8+CiAgICA8cG9seWdvbiBmaWxsPSIjOWVjNTgzIiBwb2ludHM9IjExNzguODkgNjYwLjgzMyAxMTgzLjc1OCA2NTYuMDY5IDEzNTMuMzA0IDgzMC45NDggMTM0OS4yNzEgODM0Ljg5NSAxMTc4Ljg5IDY2MC44MzMiLz4KICAgIDxwb2x5Z29uIGZpbGw9IiM5ZWM1ODMiIHBvaW50cz0iOTMwLjc4OCA0NTUuOTI1IDkyMy44MDIgNDU1LjkyNSA5MjMuODAyIDQ2NC4xNDYgNzI4LjEzIDQ2NC4xNDYgNzI4LjEzIDQ0Ni4wNTkgNzIyLjE4OCA0NDYuMDU5IDcyMi4xODggNDcxLjI3MiA5MzAuNzg4IDQ3MS4yNzIgOTMwLjc4OCA0NTUuOTI1Ii8+CiAgICA8cG9seWxpbmUgZmlsbD0iIzllYzU4MyIgcG9pbnRzPSI4NjMuNTggNDExLjUyOSA3MjguMTMgNDExLjUyOSA3MjguMTMgNDExLjUyOSA3MjIuMTg4IDQxMS41MjkgNzE0Ljc4MSA0MTguNjU0IDg3MC41NjYgNDE4LjY1NCIvPgogICAgPHBvbHlnb24gZmlsbD0iIzllYzU4MyIgcG9pbnRzPSI2ODYuOTY1IDQ0Ni4wNTkgNzAwLjE3NyA0NDYuMDU5IDcwMC4xNzcgNDcxLjI3MiA2NjEuMzc1IDQ3MS4yNzIgNjg2Ljk2NSA0NDYuMDU5Ii8+CiAgPC9nPgo8ZyBpZD0iQXJlYV9CYXJfX3gyRl9fRXZlbnRpIj4KICAgIDxyZWN0IGZpbGw9IiNkMzgyNjciIHg9IjYzMS44MjMiIHk9IjY3Ny4zMDkiIHdpZHRoPSIyMzYiIGhlaWdodD0iMjgxIi8+CiAgPC9nPgo8L3N2Zz4=";
// Dimensioni canvas SVG originale
const SVG_W = 2055.647, SVG_H = 1554.619;

// ============================================================
// CALIBRAZIONE GPS ↔ SVG — 4 punti rilevati sul campo
// P1 NW 40°07'01.0"N 18°18'32.9"E  P2 SE 40°06'56.9"N 18°18'40.9"E
// P3 NE 40°06'60.0"N 18°18'38.0"E  P4 SW 40°06'55.5"N 18°18'33.7"E
// Trasformazione affine con rotazione — errore residuo < 1m
// ============================================================
const GEO = {
  // Punto di origine (NW)
  p1Lat: 40.116944, p1Lon: 18.309139,
  p1SvgX: 630, p1SvgY: 460,
  // Scala px/m e correzione rotazione
  mPerLat: 111320.0,
  mPerLon: 85130.55,
  scale:   5.102959,
  cosR:    0.99997414,
  sinR:   -0.00719104,
};
function gpsToSvg(lat, lon) {
  const dx = (lon - GEO.p1Lon) * GEO.mPerLon;
  const dy = -(lat - GEO.p1Lat) * GEO.mPerLat;
  const svgX = GEO.p1SvgX + GEO.scale * (GEO.cosR * dx - GEO.sinR * dy);
  const svgY = GEO.p1SvgY + GEO.scale * (GEO.sinR * dx + GEO.cosR * dy);
  return { svgX, svgY };
}
function svgToGps(svgX, svgY) {
  const dx_px = svgX - GEO.p1SvgX;
  const dy_px = svgY - GEO.p1SvgY;
  const dx_m =  (GEO.cosR * dx_px + GEO.sinR * dy_px) / GEO.scale;
  const dy_m = (-GEO.sinR * dx_px + GEO.cosR * dy_px) / GEO.scale;
  const lon = GEO.p1Lon + dx_m / GEO.mPerLon;
  const lat = GEO.p1Lat - dy_m / GEO.mPerLat;
  return { lat, lon };
}

function PageMappa({espositori,popup,setPopup,catFilter,setCatFilter}){
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
      r.lastX=e.clientX; r.lastY=e.clientY; r.lastTime=Date.now();
      el.setPointerCapture(e.pointerId);
    };
    const onMove=(e)=>{
      if(!r.dragging||r.pinching) return;
      const dx=e.clientX-r.lastX, dy=e.clientY-r.lastY;
      if(Math.abs(dx)+Math.abs(dy)>3) r.didDrag=true;
      const dt=Math.max(Date.now()-r.lastTime,1);
      r.velX=dx/dt*14; r.velY=dy/dt*14;
      r.offX+=dx; r.offY+=dy;
      r.lastX=e.clientX; r.lastY=e.clientY; r.lastTime=Date.now();
      applyTransform();
    };
    const onUp=()=>{ r.dragging=false; startInertia(); };

    const onTouchStart=(e)=>{
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

  // Categorie presenti tra le postazioni assegnate (dinamiche)
  const categorie = ["Tutte", ...Array.from(new Set(
    espositori.filter(e=>e.categoria).map(e=>e.categoria)
  )).sort()];

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
          viewBox="0 0 2055.647 1554.619" xmlns="http://www.w3.org/2000/svg">

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
              : occ ? (e.presente ? "#3daa70" : "rgba(210,40,40,0.50)")
              : "#e8e2d8";
            const strokeCol = dimmed ? "rgba(180,175,168,0.4)"
              : act ? "#c8862a"
              : occ ? (e.presente ? "#2a9060" : "rgba(180,20,20,0.75)")
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
                {occ&&!dimmed&&<circle cx={dotX} cy={dotY} r="3"
                  fill={e.presente?"#27ae60":"rgba(200,30,30,0.85)"} stroke="#fff" strokeWidth="1"/>}
                {!dimmed&&<text x={tcx} y={tcy+2.5}
                  textAnchor="middle" fontSize="6.5"
                  fill={occ?"#2c1d0e":"#9a8878"}
                  fontFamily="Montserrat,sans-serif" fontWeight="700">
                  {e.postazione.replace("P","")}
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
        <span style={S.sDot("#3daa70")}/><span style={S.sTxt}>{presenti} presenti</span>
        <span style={S.sSep}/>
        <span style={S.sDot("rgba(210,40,40,0.85)")}/><span style={S.sTxt}>{assegnate-presenti} assenti</span>
        <span style={S.sSep}/>
        <span style={S.sDot("#c8c0b4")}/><span style={S.sTxt}>{libere} libere</span>
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
                    <div style={S.sheetNome}>{esp.nome}</div>
                    <div style={S.sheetCat}>{esp.categoria}</div>
                  </div>
                  <div style={{...S.presBadge,background:esp.presente?"#eaf7f0":"#fdecea",color:esp.presente?"#3daa70":"#c0392b",borderColor:esp.presente?"#3daa70":"#e07070"}}>
                    <Icon name={esp.presente?"checkCircle":"xCircle"} size={13} color={esp.presente?"#3daa70":"#c0392b"} sw={2}/>
                    {esp.presente?"Presente":"Assente"}
                  </div>
                </div>
                <div style={S.divider}/>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:16}}>
                  <div style={S.infoRow}><Icon name="users" size={15} color="#9a8070" sw={1.5}/><span>{esp.titolare}</span></div>
                  <div style={S.infoRow}><Icon name="pin" size={15} color="#9a8070" sw={1.5}/><span>Postazione {esp.postazione}</span></div>
                </div>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
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
                </div>
              </>
            ):(
              <div style={{textAlign:"center",padding:"24px 0"}}>
                <div style={{fontSize:32,marginBottom:8}}>🏪</div>
                <div style={{fontSize:15,fontWeight:700,color:"#3d2b1a",marginBottom:4}}>Postazione {esp.postazione}</div>
                <div style={{fontSize:12,color:"#9a8070"}}>Postazione libera</div>
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
function PageMercato({negozi}){
  const cats=[...new Set(negozi.map(n=>n.categoria))].sort();
  const [cat,setCat]=useState("Tutte");
  const fil=cat==="Tutte"?negozi:negozi.filter(n=>n.categoria===cat);
  return(
    <div style={S.page}>
      <div style={S.filterBar}>
        {["Tutte",...cats].map(c=>(
          <button key={c} style={{...S.fBtn,...(cat===c?S.fBtnAct:{})}} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>
      <div style={S.col}>
        {fil.map(n=>(
          <div key={n.id} style={S.nCard}>
            <div style={S.nTop}>
              <div style={S.nNum}>{String(n.id).padStart(2,"0")}</div>
              <div style={{flex:1}}>
                <div style={S.nNome}>{n.nome}</div>
                <div style={S.nTit}>{n.titolare}</div>
              </div>
              <span style={S.nCat}>{n.categoria}</span>
            </div>
            {n.desc && <div style={S.nDesc}>{n.desc}</div>}
            {n.orari && <div style={S.nOrari}>🕐 {n.orari}{n.tel ? `  ·  📞 ${n.tel}` : ""}</div>}
            <div style={S.divider}/>
            <div style={{display:"flex",gap:8}}>
              <a href={`https://wa.me/${n.whatsapp}`} target="_blank" rel="noreferrer" style={S.waBtnCard}>
                <Icon name="wa" size={16} color="#fff" sw={1.8}/> WhatsApp
              </a>
              <a href={`mailto:${n.email}`} style={S.mailBtn}><Icon name="mail" size={15} color="#3d2b1a" sw={1.5}/> Email</a>
            </div>
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
function PageAdmin({adminLogged,setAdminLogged,espositori,setEspositori,eventi,setEventi,updPresenza}){
  const [pwd,setPwd]=useState("");
  const [err,setErr]=useState(false);
  const [tab,setTab]=useState("accessi");
  const [targa,setTarga]=useState("");
  const [msg,setMsg]=useState(null);
  const [addE,setAddE]=useState(false);
  const [addEv,setAddEv]=useState(false);
  const [nE,setNE]=useState({nome:"",titolare:"",categoria:"Alimentare",whatsapp:"",postazione:"",targa:""});
  const [nEv,setNEv]=useState({titolo:"",data:"",ora:"",luogo:"",descrizione:"",categoria:"Gastronomia"});

  if(!adminLogged) return(
    <div style={S.loginWrap}>
      <div style={S.loginBox}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><Icon name="lock" size={42} color="#c8862a" sw={1.5}/></div>
        <div style={S.loginH}>Area Riservata</div>
        <div style={S.loginSub}>Accesso riservato agli amministratori</div>
        <input style={{...S.input,...(err?{borderColor:"#c0392b"}:{})}} type="password" placeholder="Password" value={pwd}
          onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        {err&&<div style={S.errMsg}>Password non valida</div>}
        <button style={S.loginBtn} onClick={doLogin}><Icon name="lock" size={16} color="#fff" sw={2}/> Accedi</button>
        <div style={S.loginHint}>Demo: <b>admin2024</b></div>
      </div>
    </div>
  );
  function doLogin(){if(pwd==="admin2024"){setAdminLogged(true);setErr(false);}else setErr(true);}

  function simTarga(){
    const t=targa.trim().toUpperCase();
    const e=espositori.find(x=>x.targa.toUpperCase()===t);
    if(e){updPresenza(e.id,true);setMsg({ok:true,txt:`Accesso autorizzato — ${e.nome} · Postazione ${e.postazione}`});}
    else setMsg({ok:false,txt:`Targa ${t} non riconosciuta. Accesso negato.`});
    setTarga("");setTimeout(()=>setMsg(null),5000);
  }

  const TABS=[{id:"accessi",icon:"car",l:"Accessi"},{id:"espositori",icon:"store",l:"Espositori"},{id:"eventi",icon:"calendar",l:"Eventi"}];

  return(
    <div style={S.page}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontSize:16,fontWeight:800,color:"#2c1d0e"}}>Pannello Admin</span>
        <button style={S.logoutBtn} onClick={()=>setAdminLogged(false)}>
          <Icon name="logout" size={15} color="#3d2b1a" sw={1.8}/> Esci
        </button>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {TABS.map(t=>(
          <button key={t.id} style={{...S.aTab,...(tab===t.id?S.aTabAct:{})}} onClick={()=>setTab(t.id)}>
            <Icon name={t.icon} size={16} color={tab===t.id?"#fff":"#6b5040"} sw={tab===t.id?2:1.5}/>
            <span style={{fontSize:10,marginTop:2}}>{t.l}</span>
          </button>
        ))}
      </div>

      {/* ACCESSI */}
      {tab==="accessi"&&(
        <div>
          <div style={S.secLbl}>Simulatore Targa</div>
          <div style={S.targaCard}>
            <div style={S.targaDsp}>{targa||"· · · · · · ·"}</div>
            <input style={S.targaIn} type="text" placeholder="es. LE456AB" value={targa}
              onChange={e=>setTarga(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&simTarga()} maxLength={8}/>
            <button style={S.sbarraBtn} onClick={simTarga}><Icon name="car" size={18} color="#fff" sw={1.8}/> Verifica Accesso</button>
          </div>
          {msg&&<div style={{...S.targaMsg,background:msg.ok?"#eaf7f0":"#fdecea",color:msg.ok?"#2e7d52":"#a02020",borderColor:msg.ok?"#3daa70":"#e05050"}}>
            <Icon name={msg.ok?"checkCircle":"xCircle"} size={18} color={msg.ok?"#3daa70":"#e05050"} sw={1.8}/>{msg.txt}
          </div>}
          <div style={S.secLbl}>Presenza Espositori</div>
          <div style={S.col}>
            {espositori.map(e=>(
              <div key={e.id} style={S.presRow}>
                <span style={{width:8,height:8,borderRadius:"50%",background:e.presente?"#3daa70":"#c0b0a0",flexShrink:0,display:"inline-block"}}/>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#2c1d0e"}}>{e.nome}</div><div style={{fontSize:10,color:"#9a8070"}}>{e.postazione} · {e.targa}</div></div>
                <button style={{...S.togBtn,background:e.presente?"#fdecea":"#eaf7f0",color:e.presente?"#c0392b":"#3daa70"}} onClick={()=>updPresenza(e.id,!e.presente)}>
                  {e.presente?"Assente":"Presente"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESPOSITORI */}
      {tab==="espositori"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={S.secLbl}>Espositori</div>
            <button style={S.addBtn} onClick={()=>setAddE(true)}><Icon name="plus" size={15} color="#fff" sw={2}/> Aggiungi</button>
          </div>
          {addE&&(
            <div style={S.formCard}>
              <div style={S.formH}>Nuovo Espositore</div>
              {[["nome","Nome attività *"],["titolare","Titolare"],["whatsapp","WhatsApp"],["postazione","Codice postazione *"],["targa","Targa"]].map(([k,pl])=>(
                <input key={k} style={S.input} placeholder={pl} value={nE[k]} onChange={e=>setNE(p=>({...p,[k]:e.target.value}))}/>
              ))}
              <select style={S.select} value={nE.categoria} onChange={e=>setNE(p=>({...p,categoria:e.target.value}))}>
                {["Alimentare","Abbigliamento","Calzature","Cosmetica","Tessuti","Elettronica","Bigiotteria","Casalinghi","Floricoltura","Giocattoli","Pelletteria","Artigianato","Ristorazione","Editoria","Sport","Erboristeria","Sartoria"].map(c=><option key={c}>{c}</option>)}
              </select>
              <div style={{display:"flex",gap:8}}>
                <button style={S.saveBtn} onClick={()=>{if(!nE.nome||!nE.postazione)return;const id=Math.max(...espositori.map(e=>e.id))+1;setEspositori(p=>[...p,{...nE,id,presente:false,x:8+((id-1)%6)*14,y:8+((id-1)%4)*12}]);setAddE(false);setNE({nome:"",titolare:"",categoria:"Alimentare",whatsapp:"",postazione:"",targa:""});}}>Salva</button>
                <button style={S.cancelBtn} onClick={()=>setAddE(false)}>Annulla</button>
              </div>
            </div>
          )}
          <div style={S.col}>
            {espositori.map(e=>(
              <div key={e.id} style={S.aRow}>
                <span style={{fontSize:11,fontWeight:800,color:e.presente?"#3daa70":"#9a8070",minWidth:36}}>{e.postazione}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#2c1d0e"}}>{e.nome}</div><div style={{fontSize:10,color:"#9a8070"}}>{e.titolare} · {e.targa}</div></div>
                <button style={S.delBtn} onClick={()=>setEspositori(p=>p.filter(x=>x.id!==e.id))}><Icon name="trash" size={15} color="#c0392b" sw={1.5}/></button>
              </div>
            ))}
          </div>
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
                <button style={S.saveBtn} onClick={()=>{if(!nEv.titolo||!nEv.data)return;const id=Math.max(...eventi.map(e=>e.id))+1;setEventi(p=>[...p,{...nEv,id}]);setAddEv(false);setNEv({titolo:"",data:"",ora:"",luogo:"",descrizione:"",categoria:"Gastronomia"});}}>Salva</button>
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
  catFloatBtn:{position:"absolute",bottom:58,left:12,zIndex:20,display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:22,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Montserrat',sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",letterSpacing:0.2},
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
  postBadge:{width:46,height:46,borderRadius:10,border:"1.5px solid",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  sheetNome:{fontSize:16,fontWeight:700,color:text,lineHeight:1.2},
  sheetCat:{fontSize:11,color:textL,marginTop:3,fontWeight:500},
  presBadge:{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:10,fontWeight:700,border:"1.5px solid",whiteSpace:"nowrap"},
  divider:{height:1,background:sandD,margin:"12px 0"},
  infoRow:{display:"flex",alignItems:"center",gap:8,fontSize:13,color:textM,fontWeight:500},

  mailBtn:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flex:1,background:sandD,color:terra,padding:"11px 0",borderRadius:12,textDecoration:"none",fontSize:13,fontWeight:600},
  page:{padding:16},
  filterBar:{display:"flex",gap:7,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none",marginBottom:14},
  fBtn:{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1px solid ${border}`,background:white,fontSize:11,cursor:"pointer",color:textM,whiteSpace:"nowrap",fontFamily:"'Montserrat',sans-serif",fontWeight:500},
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
  input:{width:"100%",padding:"11px 13px",borderRadius:10,border:`1.5px solid ${border}`,fontSize:13,marginBottom:10,background:sand,color:terra,outline:"none",boxSizing:"border-box",fontFamily:"'Montserrat',sans-serif",fontWeight:500},
  errMsg:{color:"#c0392b",fontSize:11,marginBottom:10,fontWeight:600},
  loginBtn:{width:"100%",padding:"13px 0",background:terra,color:white,border:"none",borderRadius:10,fontSize:14,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Montserrat',sans-serif"},
  loginHint:{fontSize:10,color:textL,marginTop:14},
  logoutBtn:{display:"flex",alignItems:"center",gap:5,background:sandD,border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,cursor:"pointer",color:terra,fontWeight:600,fontFamily:"'Montserrat',sans-serif"},
  aTab:{flex:1,padding:"8px 4px 6px",border:`1px solid ${border}`,borderRadius:10,background:white,fontSize:10,cursor:"pointer",color:textM,display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"'Montserrat',sans-serif",fontWeight:700,letterSpacing:0.3},
  aTabAct:{background:terra,color:white,borderColor:terra},
  secLbl:{fontSize:9,fontWeight:700,color:textL,letterSpacing:2,textTransform:"uppercase",marginBottom:8,marginTop:2},
  targaCard:{background:white,borderRadius:14,padding:16,border:`1px solid ${border}`,marginBottom:10,textAlign:"center"},
  targaDsp:{fontFamily:"'Courier New',monospace",fontSize:24,fontWeight:800,color:terra,letterSpacing:6,background:"#fffde8",padding:"9px 14px",borderRadius:8,border:"2px solid #d4b000",marginBottom:10,display:"inline-block",minWidth:150},
  targaIn:{width:"100%",padding:"11px",borderRadius:10,border:`1.5px solid ${border}`,fontSize:18,textAlign:"center",letterSpacing:5,background:sand,color:terra,outline:"none",boxSizing:"border-box",marginBottom:10,textTransform:"uppercase",fontFamily:"'Courier New',monospace",fontWeight:800},
  sbarraBtn:{width:"100%",padding:"12px 0",background:ocra,color:white,border:"none",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Montserrat',sans-serif"},
  targaMsg:{padding:"11px 12px",borderRadius:10,fontSize:11,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:8,border:"1.5px solid"},
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
const NEGOZI_COPERTO = [
  {id:1,nome:"Macelleria Pugliese",titolare:"Giuseppe De Giorgi",categoria:"Macelleria",whatsapp:"393331111111",email:"macelleria@mercatomaglie.it",tel:"0836123456",orari:"Lun-Sab 6:00-13:30",desc:"Carni fresche selezionate, specialità di agnello e maiale del Salento."},
  {id:2,nome:"Pescheria del Mare",titolare:"Cosimo Mele",categoria:"Pescheria",whatsapp:"393332222222",email:"pescheria@mercatomaglie.it",tel:"0836234567",orari:"Mar-Dom 6:00-13:00",desc:"Pesce fresco dall'Adriatico e dallo Jonio, consegnato ogni mattina all'alba."},
  {id:3,nome:"Panificio Tradizione",titolare:"Antonia Vergine",categoria:"Panetteria",whatsapp:"393333333333",email:"panificio@mercatomaglie.it",tel:"0836345678",orari:"Lun-Sab 6:30-14:00",desc:"Pane di grano duro, friselle, tarallini e focacce artigianali."},
  {id:4,nome:"Salumeria Autentica",titolare:"Mario Caliandro",categoria:"Salumeria",whatsapp:"393334444444",email:"salumeria@mercatomaglie.it",tel:"0836456789",orari:"Lun-Sab 7:00-13:30",desc:"Salumi e formaggi tipici pugliesi, capocollo, soppressata e burrata fresca."},
  {id:5,nome:"Frutta & Verdura Bio",titolare:"Concetta Pastore",categoria:"Ortofrutta",whatsapp:"393335555555",email:"bio@mercatomaglie.it",tel:"0836567890",orari:"Lun-Sab 6:00-13:00",desc:"Prodotti biologici certificati da agricoltori locali del Salento."},
  {id:6,nome:"Formaggi & Latticini",titolare:"Sergio Ciardo",categoria:"Latteria",whatsapp:"393336666666",email:"formaggi@mercatomaglie.it",tel:"0836678901",orari:"Lun-Sab 7:00-13:30",desc:"Ricotta fresca, mozzarella, caciocavallo e pecorino del Salento."},
  {id:7,nome:"Bar & Area Ristoro",titolare:"Silvana Quarta",categoria:"Bar/Caffè",whatsapp:"393337777777",email:"bar@mercatomaglie.it",tel:"0836789012",orari:"Lun-Dom 6:00-15:00",desc:"Caffetteria, colazioni, panini e pranzi veloci nell'area mercatale."},
  {id:8,nome:"Dolci & Delizie",titolare:"Anna Ingrosso",categoria:"Pasticceria",whatsapp:"393338888888",email:"dolci@mercatomaglie.it",tel:"0836890123",orari:"Lun-Sab 7:00-13:30",desc:"Pasticciotti leccesi, cartellate, mostaccioli e dolci tradizionali salentini."},
  {id:9,nome:"Pescheria Adriatica",titolare:"Rocco Manca",categoria:"Pescheria",whatsapp:"393339001234",email:"adriatica@mercatomaglie.it",tel:"0836901234",orari:"Mar-Dom 6:00-13:00",desc:"Specialità di mare: ricci, cozze, vongole e pesce azzurro freschissimo."},
  {id:10,nome:"Macelleria Equina",titolare:"Oronzo Stomeo",categoria:"Macelleria",whatsapp:"393330112345",email:"equina@mercatomaglie.it",tel:"0836012345",orari:"Lun-Sab 6:30-13:30",desc:"Specialità di carne di cavallo e asino, tradizione culinaria salentina."},
  {id:11,nome:"Spezieria del Salento",titolare:"Franca Erroi",categoria:"Alimentare",whatsapp:"393331223456",email:"spezieria@mercatomaglie.it",tel:"0836123457",orari:"Lun-Sab 8:00-14:00",desc:"Spezie, erbe aromatiche, peperoncini e conserve artigianali del territorio."},
  {id:12,nome:"Norcineria Artigiana",titolare:"Vito Quarta",categoria:"Salumeria",whatsapp:"393332334567",email:"norcineria@mercatomaglie.it",tel:"0836234568",orari:"Lun-Sab 7:00-13:30",desc:"Insaccati artigianali, salsicce fresche e prodotti di norcineria tradizionale."},
];
const NEGOZI_ORTO = [
  {id:1,nome:"Agrumi Salentini",titolare:"Rocco Erroi",categoria:"Agrumi",whatsapp:"393339999991",email:"agrumi@mercatomaglie.it",tel:"0836111222",orari:"Lun-Sab 6:00-13:00",desc:"Arance, limoni, mandarini e pompelmi direttamente dai nostri agrumeti del Salento."},
  {id:2,nome:"Primizie di Stagione",titolare:"Tiziana Mancarella",categoria:"Verdure",whatsapp:"393339999992",email:"primizie@mercatomaglie.it",tel:"0836222333",orari:"Lun-Sab 6:00-13:00",desc:"Verdure fresche di stagione coltivate nell'agro di Maglie e dintorni."},
  {id:3,nome:"Funghi & Tartufi",titolare:"Silvio Panese",categoria:"Funghi",whatsapp:"393339999993",email:"funghi@mercatomaglie.it",tel:"0836333444",orari:"Mer-Dom 7:00-13:00",desc:"Funghi porcini, champignon, pleurotus e tartufo del Salento quando disponibile."},
  {id:4,nome:"Legumi Biologici",titolare:"Patrizia Ciullo",categoria:"Legumi",whatsapp:"393339999994",email:"legumi@mercatomaglie.it",tel:"0836444555",orari:"Lun-Sab 7:00-13:30",desc:"Fave, ceci, lenticchie e piselli biologici a km zero, secchi e freschi."},
  {id:5,nome:"Pomodori DOP",titolare:"Oronzo Fersino",categoria:"Verdure",whatsapp:"393339999995",email:"pomodori@mercatomaglie.it",tel:"0836555666",orari:"Lun-Sab 6:30-13:00",desc:"Pomodori a grappolo, pachino, pizzutello e san marzano di produzione propria."},
  {id:6,nome:"Frutta Esotica",titolare:"Luca Taurisano",categoria:"Frutta Esotica",whatsapp:"393339999996",email:"esotica@mercatomaglie.it",tel:"0836666777",orari:"Lun-Sab 7:00-14:00",desc:"Mango, avocado, ananas, papaya e frutta tropicale di importazione selezionata."},
  {id:7,nome:"Patate & Cipolla",titolare:"Franco Suma",categoria:"Verdure",whatsapp:"393339999997",email:"patate@mercatomaglie.it",tel:"0836777888",orari:"Lun-Sab 6:00-13:00",desc:"Patate novelle, cipolle rosse di Tropea, aglio e ortaggi da radice del territorio."},
  {id:8,nome:"Erbe Aromatiche",titolare:"Carmela Toma",categoria:"Erbe",whatsapp:"393339999998",email:"erbe@mercatomaglie.it",tel:"0836888999",orari:"Lun-Sab 7:00-13:30",desc:"Basilico, prezzemolo, rosmarino, origano e erbe officinali coltivate biologicamente."},
  {id:9,nome:"Frutta di Stagione",titolare:"Giovanni Pastore",categoria:"Frutta",whatsapp:"393339999999",email:"frutta@mercatomaglie.it",tel:"0836999000",orari:"Lun-Sab 6:00-13:00",desc:"Pesche, albicocche, fichi, uva e frutta di stagione delle nostre campagne salentine."},
  {id:10,nome:"Ortaggi Bio Km0",titolare:"Lucia Mancarella",categoria:"Verdure",whatsapp:"393330000001",email:"ortaggi@mercatomaglie.it",tel:"0836000111",orari:"Lun-Sab 6:30-13:00",desc:"Zucchine, melanzane, peperoni e fagiolini biologici certificati a chilometro zero."},
];
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
const DATA_VERSION = "v11-shapes";

export default function App(){
  // Lock portrait orientation (works for installed PWA & fullscreen)
  useEffect(()=>{
    screen.orientation?.lock?.("portrait").catch(()=>{});
  },[]);

  const [splash,setSplash]=useState(!store.get("visited",false));
  const [page,setPage]=useState("mappa");

  // Carica sempre i dati freschi da ESPOSITORI_INIT come base,
  // poi applica sopra solo le modifiche di presenza salvate in cache
  const [espositori,setEspositori]=useState(()=>{
    if(store.get("data_version","")!==DATA_VERSION){
      // Cancella tutto il localStorage e riparte da zero
      try{ localStorage.clear(); }catch(e){}
      store.set("data_version",DATA_VERSION);
      return ESPOSITORI_INIT;
    }
    const presenza = store.get("esp_presenza",{});
    return ESPOSITORI_INIT.map(e=>
      presenza[e.id]!==undefined ? {...e,presente:presenza[e.id]} : e
    );
  });

  const [eventi,setEventi]=useState(()=>store.get("ev",EVENTI_INIT));
  const [adminLogged,setAdminLogged]=useState(false);
  const [popup,setPopup]=useState(null);
  const [catFilter,setCatFilter]=useState("Tutte");

  // Salva solo la mappa presenza {id: true/false} — i dati anagrafici vengono sempre da ESPOSITORI_INIT
  useEffect(()=>{
    const presenza = {};
    espositori.forEach(e=>{ presenza[e.id]=e.presente; });
    store.set("esp_presenza",presenza);
  },[espositori]);
  useEffect(()=>{store.set("ev",eventi);},[eventi]);

  const updPresenza=(id,p)=>setEspositori(prev=>prev.map(e=>e.id===id?{...e,presente:p}:e));

  if(splash) return <Splash onEnter={()=>{store.set("visited",true);setSplash(false);}}/>;

  const NAV=[
    {id:"mappa",icon:"map",label:"Mappa"},
    {id:"coperto",icon:"store",label:"Coperto"},
    {id:"orto",icon:"leaf",label:"Ortofrutta"},
    {id:"eventi",icon:"calendar",label:"Eventi"},
    {id:"admin",icon:"settings",label:"Gestione"},
  ];
  const PAGE_TITLES={mappa:"Mercato Aperto",coperto:"Mercato Coperto",orto:"Mercato Ortofrutticolo",eventi:"Eventi",admin:"Gestione"};

  return(
    <div style={S.app}>
      <style>{GCss}</style>
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
          <div style={S.hdrPage}>{PAGE_TITLES[page]}</div>
        </div>
      </header>
      {/* MAIN */}
      <main style={S.main}>
        {page==="mappa"   && <PageMappa espositori={espositori} popup={popup} setPopup={setPopup} catFilter={catFilter} setCatFilter={setCatFilter}/>}
        {page==="coperto" && <PageMercato negozi={NEGOZI_COPERTO}/>}
        {page==="orto"    && <PageMercato negozi={NEGOZI_ORTO}/>}
        {page==="eventi"  && <PageEventi eventi={eventi}/>}
        {page==="admin"   && <PageAdmin adminLogged={adminLogged} setAdminLogged={setAdminLogged} espositori={espositori} setEspositori={setEspositori} eventi={eventi} setEventi={setEventi} updPresenza={updPresenza}/>}
      </main>
      {/* BOTTOM NAV */}
      <nav style={S.nav}>
        {NAV.map(n=>{
          const act=page===n.id;
          return(
            <button key={n.id} style={{...S.navBtn,...(act?{background:"rgba(232,160,69,0.07)"}:{})}}
              onClick={()=>{setPage(n.id);setPopup(null);}}>
              <Icon name={n.icon} size={22} color={act?"#e8a045":"#786050"} sw={act?2:1.5}/>
              <span style={{fontSize:8.5,marginTop:3,letterSpacing:0.5,textTransform:"uppercase",fontWeight:700,color:act?"#e8a045":"#786050"}}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
