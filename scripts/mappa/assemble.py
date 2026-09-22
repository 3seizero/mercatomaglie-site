"""Assembla la nuova planimetria SVG (stile v1, coordinate mappa georeferenziate) + JSON posteggi."""
import numpy as np, json, math, os, cv2
from PIL import Image, ImageDraw
Image.MAX_IMAGE_PIXELS = None
SP = os.path.dirname(os.path.abspath(__file__))
ROOT = '/Users/cipertre/Library/CloudStorage/Dropbox-3seizero/Carlo Contino Circolone/Lavoro/Progetti in Corso/Maglie/Comune di Maglie/Area Mercatale/mercatomaglie-site'

# ---------------- trasformazioni ----------------
T = json.load(open(f'{SP}/cad2gps.json'))
deg, dx, dy = T['deg'], T['dx'], T['dy']; gh, gw = T['g_shape']; Hn, Wn = T['c_shape']; n = T['n']; Z = T['Z']; tx0 = T['tx0']; ty0 = T['ty0']
th = math.radians(deg); c = (gw/2, gh/2); c2 = (Wn/2, Hn/2)
def cad_to_sat(x, y):
    mx, my = x/3 - c[0], y/3 - c[1]
    rx = mx*math.cos(th) - my*math.sin(th); ry = mx*math.sin(th) + my*math.cos(th)
    return (rx + c2[0] + dx) * (1024/n), (ry + c2[1] + dy) * (1024/n)
def sat_to_latlon(px, py):
    N = 2**Z; xt = tx0 + px/256; yt = ty0 + py/256
    return math.degrees(math.atan(math.sinh(math.pi*(1 - 2*yt/N)))), xt/N*360 - 180
GEO = dict(p1Lat=40.116944, p1Lon=18.309139, p1SvgX=630, p1SvgY=460, mPerLat=111320.0, mPerLon=85130.55, scale=5.102959, cosR=0.99997414, sinR=-0.00719104)
def gps_to_svg(lat, lon):
    dx_ = (lon - GEO['p1Lon']) * GEO['mPerLon']; dy_ = -(lat - GEO['p1Lat']) * GEO['mPerLat']
    return GEO['p1SvgX'] + GEO['scale']*(GEO['cosR']*dx_ - GEO['sinR']*dy_), GEO['p1SvgY'] + GEO['scale']*(GEO['sinR']*dx_ + GEO['cosR']*dy_)
def cad_to_svg(x, y): return gps_to_svg(*sat_to_latlon(*cad_to_sat(x, y)))
def sat_to_svg(px, py): return gps_to_svg(*sat_to_latlon(px, py))

# ---------------- maschere dal raster CAD ----------------
B = 6; PT_PER_CELL = B / (600/72)
im = np.array(Image.open(f'{SP}/p600-1.png').convert('RGB')).astype(np.int16)
H, W = im.shape[:2]; h, w = H // B, W // B
blk = im[:h*B, :w*B].reshape(h, B, w, B, 3)
pr, pg, pb = blk[..., 0], blk[..., 1], blk[..., 2]
green = ((pg > 200) & (pr < 230) & (pb < 200) & (pg - pr > 20)).mean((1, 3)) > 0.35
grey = ((abs(pr - pg) < 12) & (abs(pg - pb) < 12) & (pr > 90) & (pr < 150)).mean((1, 3)) > 0.45
X0, Y0, X1, Y1 = 230, 20, 1400, 1100
cx0, cy0, cx1, cy1 = [int(v/PT_PER_CELL) for v in (X0, Y0, X1, Y1)]
roi = np.zeros((h, w), bool); roi[cy0:cy1, cx0:cx1] = True
k5 = np.ones((5, 5), np.uint8)
grey = cv2.morphologyEx((grey & roi).astype(np.uint8), cv2.MORPH_CLOSE, k5).astype(bool)
green = cv2.morphologyEx((green & roi).astype(np.uint8), cv2.MORPH_CLOSE, k5).astype(bool)
# rimuovi il tratteggio verde delle aree fuori sito a sud del binario (y > 960 pt) e la legenda
green[int(960/PT_PER_CELL):, :] = False

def area(p):
    s = 0
    for i in range(len(p)):
        x1, y1 = p[i]; x2, y2 = p[(i+1) % len(p)]; s += x1*y2 - x2*y1
    return s / 2
TOL = 2.0  # celle ≈ 0.5 m
def polys(mask, min_m2, tol=TOL):
    cnts, hier = cv2.findContours(mask.astype(np.uint8)*255, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    if hier is None: return out
    for i, cn in enumerate(cnts):
        ap = cv2.approxPolyDP(cn, tol, True).reshape(-1, 2)
        if len(ap) < 3: continue
        p = [(float(x)*PT_PER_CELL, float(y)*PT_PER_CELL) for x, y in ap]
        if abs(area(p))/9 < min_m2: continue
        out.append({'pts': p, 'hole': bool(hier[0][i][3] != -1)})
    return out

def flood(mask, seed_pt):
    m = mask.astype(np.uint8).copy()
    ff = np.zeros((h+2, w+2), np.uint8)
    sx, sy = int(seed_pt[0]/PT_PER_CELL), int(seed_pt[1]/PT_PER_CELL)
    cv2.floodFill(m, ff, (sx, sy), 2)
    return m == 2

stalls = json.load(open(f'{SP}/stalls.json'))
S = {s['id']: s for s in stalls}
free = roi & ~grey
# area mercato principale (dal centro di A-30), tagliata alla fascia parcheggi a sud (y > 858 pt)
merc = flood(free, (S['A-30']['cx'], S['A-30']['cy']))
cut = int(664/PT_PER_CELL)
merc_main = merc.copy(); merc_main[cut:, :] = False
park_s = merc.copy(); park_s[:cut, :] = False
# lotto file 23-27 (A-131..166): involucro dei posteggi allargato di 4 m
def hull_mask(ids, margin_m):
    pts = np.array([[x/PT_PER_CELL, y/PT_PER_CELL] for s_ in stalls if s_['id'] in ids for x, y in s_['pts']], np.float32)
    hull = cv2.convexHull(pts).reshape(-1, 2).astype(np.int32)
    m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [hull], 1)
    r = int(margin_m/(PT_PER_CELL/3)); ker = cv2.getStructuringElement(cv2.MORPH_RECT, (2*r+1, 2*r+1))
    return cv2.dilate(m, ker).astype(bool) & ~grey
NW_IDS = {s_['id'] for s_ in stalls if s_['sector'] == 'A' and s_['numero'].isdigit() and 131 <= int(s_['numero']) <= 166}
lot_nw = hull_mask(NW_IDS, 4)
for name, m in (('mercato', merc_main), ('park_s', park_s), ('lot_nw', lot_nw)):
    print(name, 'm2', round(m.sum()*(PT_PER_CELL/3)**2))

layers = {
    'strade': polys(grey, 100),
    'aiuole': [p for p in polys(green, 25) if not p['hole'] or abs(area(p['pts']))/9 > 60],
    'mercato': [p for p in polys(merc_main, 200) if not p['hole']],
    'parcheggi': [p for p in polys(park_s, 100) if not p['hole']],
    'mercato2': [p for p in polys(lot_nw, 100) if not p['hole']],
}
# contorno esterno "Area_Mappa": dilatazione dell'unione di tutto di ~22 m, poi semplificazione morbida
union = (grey | green | merc | lot_nw).astype(np.uint8)
r = int(22/(PT_PER_CELL/3))
ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r+1, 2*r+1))
dil = cv2.dilate(union, ker)
layers['mappa'] = [p for p in polys(dil.astype(bool), 1000, tol=6) if not p['hole']]
# piazza bar/eventi dal satellite (px nativi z19)
bar_sat = [(152, 412), (286, 412), (286, 652), (152, 652)]

# ---------------- conversione in unità mappa ----------------
def conv(p): return [cad_to_svg(x, y) for x, y in p]
out = {name: [{'pts': conv(q['pts']), 'hole': q['hole']} for q in lst] for name, lst in layers.items()}
out['bar'] = [{'pts': [sat_to_svg(*p) for p in bar_sat], 'hole': False}]
stalls_svg = []
for s in stalls:
    pts = conv(s['pts']); cx = sum(p[0] for p in pts)/len(pts); cy = sum(p[1] for p in pts)/len(pts)
    lat, lon = sat_to_latlon(*cad_to_sat(s['cx'], s['cy']))
    stalls_svg.append({'id': s['id'], 'settore': s['sector'], 'numero': s['numero'], 'inElenco': s['inElenco'],
                       'pts': [[round(x, 2), round(y, 2)] for x, y in pts], 'cx': round(cx, 2), 'cy': round(cy, 2), 'lat': round(lat, 6), 'lon': round(lon, 6)})
json.dump({'layers': out, 'stalls': stalls_svg}, open(f'{SP}/map-v2.json', 'w'))

# ---------------- SVG (stile v1) ----------------
VB = '0 0 2055.647 1554.619'
def path_d(polys_):
    d = []
    for q in polys_:
        d.append('M' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in q['pts']) + 'Z')
    return ' '.join(d)
SECT_COL = {'A': '#e8a0e8', 'B': '#a0c8f0', 'C': '#f0c090', 'D': '#a0a8f0', 'E': '#a8e0a0'}
SECT_NAME = {'A': 'Abbigliamento', 'B': 'Abbigliamento usato', 'C': 'Alimentare', 'D': 'Calzature', 'E': 'Casalinghi-Ferramenta-Fiori'}
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="{VB}">',
       f'  <g id="Area_Mappa"><path fill="#f0ece4" fill-rule="evenodd" d="{path_d(out["mappa"])}"/></g>',
       f'  <g id="Strada_di_accesso"><path fill="#706f6f" fill-rule="evenodd" d="{path_d(out["strade"])}"/></g>',
       f'  <g id="Area_Mercato"><path fill="#ffffff" d="{path_d(out["mercato"])}"/><path fill="#ffffff" d="{path_d(out["mercato2"])}"/></g>',
       f'  <g id="Aree_Parcheggio"><path fill="#e6d867" d="{path_d(out["parcheggi"])}"/></g>',
       f'  <g id="Aiuole"><path fill="#9ec583" fill-rule="evenodd" d="{path_d(out["aiuole"])}"/></g>',
       f'  <g id="Area_Bar__x2F__Eventi"><polygon fill="#d38267" points="{" ".join(f"{x:.2f},{y:.2f}" for x, y in out["bar"][0]["pts"])}"/></g>',
       '  <g id="Postazioni">']
for sec in 'ABCDE':
    svg.append(f'    <g id="Settore_{sec}" data-nome="{SECT_NAME[sec]}">')
    for s in stalls_svg:
        if s['settore'] != sec: continue
        pts = ' '.join(f'{x},{y}' for x, y in s['pts'])
        extra = '' if s['inElenco'] else ' data-non-in-elenco="true"'
        svg.append(f'      <polygon id="{s["id"]}" data-settore="{sec}" data-numero="{s["numero"]}"{extra} fill="#e8e2d8" stroke="#c8c0b4" stroke-width="0.6" points="{pts}"/>')
    svg.append('    </g>')
svg.append('  </g>\n  <g id="Etichette" font-family="Montserrat, sans-serif" font-size="6.5" font-weight="700" fill="#9a8878" text-anchor="middle">')
for s in stalls_svg:
    svg.append(f'    <text x="{s["cx"]}" y="{s["cy"]+2.3}">{s["numero"]}</text>')
svg.append('  </g>\n</svg>')
os.makedirs(f'{ROOT}/data/mappa', exist_ok=True)
open(f'{ROOT}/data/mappa/area-mercatale-v2.svg', 'w').write('\n'.join(svg))
open(f'{SP}/map-v2.svg', 'w').write('\n'.join(svg))
print('svg scritto', len(stalls_svg), 'posteggi')
