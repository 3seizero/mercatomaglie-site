# Archivio — funzionalità "targhe" (v1)

Stato: **sospesa** dal 15/09/2026 su indicazione del Comune. Il codice completo è
conservato nel tag git **`v1-targhe`** (commit `ad19d00`). Questo documento descrive
cosa faceva la funzione e come riattivarla.

```bash
git show v1-targhe:app-src/src/App.jsx > /tmp/App-v1-targhe.jsx   # sorgente completo
git diff v1-targhe main -- app-src/src/App.jsx                      # cosa è stato rimosso
```

## Idea originale

Regolare l'accesso veicolare all'area mercatale tramite lettura targa:

1. ogni espositore in anagrafica ha una **targa** associata;
2. all'ingresso una **sbarra con telecamera OCR** legge la targa, la confronta con
   l'anagrafica e apre solo agli espositori titolati (concessionari o occasionali
   registrati al SUAP);
3. il passaggio alla sbarra segna automaticamente l'espositore come **presente**
   (verde) nell'app pubblica.

Nella v1 la sbarra/OCR non esisteva: c'era un **simulatore** nel pannello admin che
riproduceva il comportamento digitando la targa a mano.

## Cosa c'era nel codice (App.jsx, tag `v1-targhe`)

### Campo dati
Ogni espositore aveva `targa: "LE456AB"` (stringa vuota per le postazioni libere).
Era presente:
- nei 50 espositori demo di `ESPOSITORI_INIT`;
- nei generatori delle postazioni vuote (`rect`/`poly`);
- nel form "Assegna postazione" dell'admin (input `["targa","Targa"]`, salvato in
  maiuscolo con `nE.targa.trim().toUpperCase()`);
- negli override salvati in localStorage (`esp_overrides[id].targa`);
- nelle righe delle liste admin (`{e.postazione} · {e.targa}`).

### Tab "Accessi" del pannello admin
Era il tab predefinito (`useState("accessi")`, icona `car`). Conteneva il
**Simulatore Targa** seguito dalla lista "Presenza Espositori" (quest'ultima è
rimasta, nel tab rinominato "Presenze").

```jsx
const [targa,setTarga]=useState("");
const [msg,setMsg]=useState(null);

function simTarga(){
  const t=targa.trim().toUpperCase();
  const e=espositori.find(x=>x.targa.toUpperCase()===t);
  if(e){updPresenza(e.id,true);setMsg({ok:true,txt:`Accesso autorizzato — ${e.nome} · Postazione ${e.postazione}`});}
  else setMsg({ok:false,txt:`Targa ${t} non riconosciuta. Accesso negato.`});
  setTarga("");setTimeout(()=>setMsg(null),5000);
}

<div style={S.secLbl}>Simulatore Targa</div>
<div style={S.targaCard}>
  <input style={S.targaIn} type="text" placeholder="es. LE456AB" value={targa}
    onChange={e=>setTarga(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&simTarga()} maxLength={8}/>
  <button style={S.sbarraBtn} onClick={simTarga}><Icon name="car" size={18} color="#fff" sw={1.8}/> Verifica Accesso</button>
</div>
{msg&&<div style={{...S.targaMsg,background:msg.ok?"#eaf7f0":"#fdecea",color:msg.ok?"#2e7d52":"#a02020",borderColor:msg.ok?"#3daa70":"#e05050"}}>
  <Icon name={msg.ok?"checkCircle":"xCircle"} size={18} color={msg.ok?"#3daa70":"#e05050"} sw={1.8}/>{msg.txt}
</div>}
```

### Stili e icona rimossi
```js
targaCard:{background:white,borderRadius:14,padding:16,border:`1px solid ${border}`,marginBottom:10,textAlign:"center"},
targaIn:{width:"100%",padding:"11px",borderRadius:10,border:`1.5px solid ${border}`,fontSize:18,textAlign:"center",letterSpacing:5,background:sand,color:terra,outline:"none",boxSizing:"border-box",marginBottom:10,textTransform:"uppercase",fontFamily:"'Courier New',monospace",fontWeight:800},
sbarraBtn:{width:"100%",padding:"12px 0",background:ocra,color:white,border:"none",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Montserrat',sans-serif"},
targaMsg:{padding:"11px 12px",borderRadius:10,fontSize:11,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:8,borderWidth:"1.5px",borderStyle:"solid"},
// Icon "car"
car: <><path {...p} d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle {...p} cx="7" cy="17" r="2"/><circle {...p} cx="17" cy="17" r="2"/><path {...p} d="M5 12h14"/></>,
```

Targa demo usata nei test: `BA123XY` → autorizzava P001.

## Come riattivarla in v2

Nella v2 la presenza è registrata dall'operatore con la scansione del QR
(vedi `PIANO-V2.md`, Fase 2). La targa può tornare come **metodo alternativo di
presenza** senza toccare il resto:

1. aggiungere `targa` (facoltativa) all'anagrafica riservata dell'espositore
   (collezione `espositori_riservati`, non pubblica);
2. la sbarra/OCR (o un operatore che digita la targa) crea un documento
   `presenze/{data}_{espositoreId}` con `metodo: "targa"`, esattamente come fa la
   scansione QR con `metodo: "qr"`;
3. l'app pubblica non cambia: colora verde chi ha una presenza oggi.

L'OCR può essere fatto sul dispositivo dell'operatore (fotocamera + libreria OCR,
ad es. Tesseract.js) oppure da una telecamera fissa alla sbarra che chiama un
endpoint del backend. Entrambe le strade riusano la stessa collezione `presenze`.
