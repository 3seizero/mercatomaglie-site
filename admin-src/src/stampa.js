// Stampa dei QR: apre una finestra con le schede in griglia A4 (una per posteggio/espositore).
import QRCode from "qrcode";
import { urlQr } from "./api.js";

export async function stampaQr(voci) {
  // voci: [{nome, sotto, token}]
  const cards = [];
  for (const v of voci) {
    const png = await QRCode.toDataURL(urlQr(v.token), { width: 520, margin: 1, errorCorrectionLevel: "M", color: { dark: "#2c1d0e" } });
    cards.push(`<div class="card"><div class="head"><img class="lockup" src="${new URL("../app/brand/lockup-orizzontale-colore.svg", window.location.href).href}" alt="Area Mercatale Maglie"><div class="sub">presenza espositore</div></div>
      <img src="${png}"><div class="nome">${esc(v.nome)}</div><div class="sotto">${esc(v.sotto || "")}</div></div>`);
  }
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>QR espositori</title><style>
    @page{size:A4;margin:10mm} body{font-family:Montserrat,Helvetica,Arial,sans-serif;margin:0;color:#2c1d0e}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}
    .card{border:1.5px solid #c8862a;border-radius:6mm;padding:6mm;text-align:center;page-break-inside:avoid;break-inside:avoid;height:128mm;display:flex;flex-direction:column;justify-content:space-between}
    .lockup{height:14mm;width:auto;display:block;margin:0 auto} .sub{font-size:8pt;color:#9a8070;letter-spacing:2px;text-transform:uppercase;margin-top:5mm;padding-top:2.5mm;border-top:1px solid #eadfc9}
    img{width:60mm;height:60mm;margin:2mm auto} .nome{font-weight:800;font-size:13pt;overflow-wrap:anywhere} .sotto{font-size:9.5pt;color:#6b5040;margin-top:1mm} .tok{font-size:7pt;color:#b8a890;margin-top:2mm;letter-spacing:.5px}
    @media screen{body{background:#eee;padding:10mm} .grid{max-width:200mm;margin:auto}}
  </style></head><body><div class="grid">${cards.join("")}</div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) throw new Error("Popup bloccato dal browser: consenti le finestre popup per stampare");
  w.document.open(); w.document.write(html); w.document.close();
}
function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
export const qrDataUrl = (token) => QRCode.toDataURL(urlQr(token), { width: 240, margin: 1, color: { dark: "#2c1d0e" } });
