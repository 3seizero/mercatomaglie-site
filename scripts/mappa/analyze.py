import re, json, math, sys, os
from collections import Counter, defaultdict
SP = os.path.dirname(os.path.abspath(__file__))
svg = open(os.path.join(SP, 'piantina.svg'), encoding='utf-8').read()

PATH_RE = re.compile(r'<path([^>]*)/>')
ATTR_RE = re.compile(r'([\w-]+)="([^"]*)"')
paths = []
for m in PATH_RE.finditer(svg):
    a = dict(ATTR_RE.findall(m.group(1)))
    paths.append(a)
print('paths', len(paths))

def parse_matrix(t):
    if not t: return (1,0,0,1,0,0)
    m = re.match(r'matrix\(([^)]*)\)', t)
    return tuple(float(v) for v in m.group(1).replace(',', ' ').split())

def apply(mat, x, y):
    a,b,c,d,e,f = mat
    return (a*x + c*y + e, b*x + d*y + f)

def parse_d(d):
    """Restituisce lista di subpath, ciascuno lista di (x,y); solo M/L/Z (curve: prendi i punti finali)."""
    toks = re.findall(r'[MLCQZmlcqz]|-?\d*\.?\d+(?:e-?\d+)?', d)
    subs, cur, i = [], [], 0
    cmd = None
    while i < len(toks):
        t = toks[i]
        if t in 'MLCQZmlcqz':
            cmd = t; i += 1
            if cmd in 'Zz':
                if cur: subs.append(cur); cur = []
            continue
        if cmd in 'ML':
            cur.append((float(toks[i]), float(toks[i+1]))); i += 2
        elif cmd == 'C':
            cur.append((float(toks[i+4]), float(toks[i+5]))); i += 6
        elif cmd == 'Q':
            cur.append((float(toks[i+2]), float(toks[i+3]))); i += 4
        else:
            i += 1
    if cur: subs.append(cur)
    return subs

SECTORS = {
    'rgb(100%, 12.156677%, 100%)': 'A',   # magenta abbigliamento
    'rgb(12.156677%, 12.156677%, 100%)': 'D',  # blu calzature
    'rgb(0%, 86.665344%, 0%)': 'E', 'rgb(0%, 94.116211%, 0%)': 'E',  # verde casalinghi
    'rgb(49.803162%, 74.900818%, 100%)': 'B',  # azzurro usato
    'rgb(100%, 74.900818%, 49.803162%)': 'C',  # arancio alimentari
}
RED = 'rgb(70.195007%, 0%, 0%)'

def poly_area(pts):
    s = 0
    for i in range(len(pts)):
        x1,y1 = pts[i]; x2,y2 = pts[(i+1)%len(pts)]
        s += x1*y2 - x2*y1
    return abs(s)/2

# --- stall outlines: closed polygons with 4 (or 5 with repeated) vertices, stroke in sector colours
stalls = []
for a in paths:
    st = a.get('stroke');
    if st not in SECTORS or a.get('fill','none') != 'none': continue
    mat = parse_matrix(a.get('transform'))
    subs = parse_d(a['d'])
    for sub in subs:
        pts = [apply(mat, x, y) for x, y in sub]
        # drop duplicate closing point
        if len(pts) > 1 and abs(pts[0][0]-pts[-1][0]) < 1e-6 and abs(pts[0][1]-pts[-1][1]) < 1e-6: pts = pts[:-1]
        if 4 <= len(pts) <= 6:
            ar = poly_area(pts)
            if ar > 5:
                stalls.append({'sector': SECTORS[st], 'pts': pts, 'area': ar,
                               'cx': sum(p[0] for p in pts)/len(pts), 'cy': sum(p[1] for p in pts)/len(pts)})
print('candidate stall polygons', len(stalls), Counter(s['sector'] for s in stalls))
areas = sorted(s['area'] for s in stalls)
print('area quantiles', [round(areas[int(q*(len(areas)-1))],1) for q in (0,0.1,0.25,0.5,0.75,0.9,1)])

# --- glyphs: red filled paths (numbers) and sector-coloured filled paths (surfaces)
glyphs = []
shapes = Counter()
for a in paths:
    f = a.get('fill','none')
    if f == 'none': continue
    if f == RED or f in SECTORS:
        mat = parse_matrix(a.get('transform'))
        subs = parse_d(a['d'])
        allpts = [apply(mat,x,y) for s in subs for x,y in s]
        if not allpts: continue
        xs=[p[0] for p in allpts]; ys=[p[1] for p in allpts]
        w = max(xs)-min(xs); h = max(ys)-min(ys)
        key = a['d']
        shapes[key] += 1
        glyphs.append({'kind': 'num' if f == RED else 'sup', 'd': key, 'mat': mat,
                       'cx': (min(xs)+max(xs))/2, 'cy': (min(ys)+max(ys))/2, 'w': w, 'h': h})
print('glyphs', len(glyphs), 'distinct shapes', len(shapes))
print('shape counts', sorted(shapes.values(), reverse=True)[:40])
sizes = Counter((round(g['w'],1), round(g['h'],1)) for g in glyphs)
print('glyph sizes (top)', sizes.most_common(8))
json.dump({'stalls': stalls, 'glyphs': glyphs}, open(os.path.join(SP,'geom.json'),'w'))
