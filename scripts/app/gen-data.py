#!/usr/bin/env python3
"""Genera app-src/src/data/mappa.js e seed.js dai file in data/ (eseguire dopo ogni aggiornamento dei seed o della SVG)."""
import json, re, base64, math, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
svg = open(f'{ROOT}/data/mappa/area-mercatale-v2.svg', encoding='utf-8').read()
vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
# base: rimuovi Postazioni ed Etichette (li disegna React)
def strip_group(s, gid):
    i = s.index(f'<g id="{gid}"')
    depth = 0; j = i
    while True:
        m = re.compile(r'<g\b|</g>').search(s, j)
        if m.group(0) == '</g>':
            depth -= 1
            if depth == 0: return s[:i] + s[m.end():]
        else: depth += 1
        j = m.end()
base = strip_group(strip_group(svg, 'Postazioni'), 'Etichette')
base = re.sub(r'<!--.*?-->', '', base, flags=re.S)
uri = 'data:image/svg+xml;base64,' + base64.b64encode(base.encode('utf-8')).decode()
W, H = [float(v) for v in vb.split()[2:]]
# piazza bar per eventuale uso
bar = re.search(r'<g id="Area_Bar__x2F__Eventi">.*?points="([^"]+)"', svg, re.S)
pm = json.load(open(f'{ROOT}/data/seed/posteggi-mappa.json'))
geo = pm['_meta']['GEO_app']
stalls = []
for p in pm['posteggi']:
    if p.get('shape') == 'circle':
        pts = ' '.join(f"{p['cx']+p['r']*math.cos(2*math.pi*k/16):.1f},{p['cy']+p['r']*math.sin(2*math.pi*k/16):.1f}" for k in range(16))
    else:
        pts = ' '.join(f'{x},{y}' for x, y in p['pts'])
    stalls.append({'id': p['id'], 'settore': p['settore'], 'numero': p['numero'], 'points': pts, 'cx': p['cx'], 'cy': p['cy'], 'lat': p['lat'], 'lon': p['lon'], 'inElenco': p['inElenco']})
out = ['// GENERATO da scripts/app/gen-data.py — non modificare a mano',
       f'export const SVG_VIEWBOX = "{vb}";', f'export const SVG_W = {W};', f'export const SVG_H = {H};',
       f'export const PLANIMETRIA_URI = "{uri}";',
       'export const GEO = ' + json.dumps({k: v for k, v in geo.items() if k != 'nota'} | {'mPerLat': 111320.0, 'mPerLon': 85130.55}) + ';',
       'export const POSTAZIONI_MAPPA = ' + json.dumps(stalls, ensure_ascii=False, separators=(',', ':')) + ';']
open(f'{ROOT}/app-src/src/data/mappa.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
mercati = json.load(open(f'{ROOT}/data/seed/mercati.json'))['mercati']
posteggi = json.load(open(f'{ROOT}/data/seed/posteggi.json'))['posteggi']
espos = json.load(open(f'{ROOT}/data/seed/espositori.json'))['espositori']
keep = ['id', 'mercato', 'settore', 'fila', 'numero', 'etichetta', 'tipo', 'espositoreId', 'stato', 'articolo', 'note']
P = [{k: p.get(k) for k in keep} | {'superficie': (p.get('superficie') or {}).get('raw')} for p in posteggi]
E = [{k: e.get(k) for k in ('id', 'denominazione', 'alias', 'referente', 'tipo', 'categoria', 'mercati', 'settori', 'whatsapp', 'telegram', 'descrizione', 'foto')} for e in espos]
out = ['// GENERATO da scripts/app/gen-data.py dai seed SUAP (07/09/2026) — non modificare a mano',
       'export const MERCATI = ' + json.dumps(mercati, ensure_ascii=False, separators=(',', ':')) + ';',
       'export const POSTEGGI = ' + json.dumps(P, ensure_ascii=False, separators=(',', ':')) + ';',
       'export const ESPOSITORI = ' + json.dumps(E, ensure_ascii=False, separators=(',', ':')) + ';',
       'export const SETTORI = {A:"Abbigliamento",B:"Abbigliamento usato",C:"Alimentare",D:"Calzature",E:"Casalinghi e fiori",PV:"Prodotti vari",UOVA:"Vendita uova"};']
open(f'{ROOT}/app-src/src/data/seed.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('mappa.js', os.path.getsize(f'{ROOT}/app-src/src/data/mappa.js')//1024, 'KB; seed.js', os.path.getsize(f'{ROOT}/app-src/src/data/seed.js')//1024, 'KB;', len(stalls), 'postazioni,', len(P), 'posteggi,', len(E), 'espositori; GEO', geo)
