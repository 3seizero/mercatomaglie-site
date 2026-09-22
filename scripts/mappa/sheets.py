import json, math, os, re
from collections import defaultdict, Counter
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
SP = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(SP, 'analyze.py')).read()
exec(src.split('SECTORS = {')[0])

def poly_area(pts):
    s = 0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i+1) % len(pts)]; s += x1*y2 - x2*y1
    return abs(s)/2

SECT = {
    'rgb(100%, 12.156677%, 100%)': 'A',
    'rgb(12.156677%, 12.156677%, 100%)': 'D',
    'rgb(0%, 94.116211%, 0%)': 'E',
    'rgb(100%, 69.018555%, 38.038635%)': 'C',
    'rgb(38.038635%, 69.018555%, 100%)': 'B',
}
RED = 'rgb(70.195007%, 0%, 0%)'
quads = []
for a in paths:
    if a.get('fill', 'none') != 'none' or a.get('stroke') not in SECT: continue
    mat = parse_matrix(a.get('transform'))
    for sub in parse_d(a['d']):
        pts = [apply(mat, x, y) for x, y in sub]
        if len(pts) > 1 and abs(pts[0][0]-pts[-1][0]) < 1e-6 and abs(pts[0][1]-pts[-1][1]) < 1e-6: pts = pts[:-1]
        if 4 <= len(pts) <= 6 and 60 < poly_area(pts) < 1200:
            cx = sum(p[0] for p in pts)/len(pts); cy = sum(p[1] for p in pts)/len(pts)
            if cx < 250: continue  # legenda
            if any(abs(cx-q['cx']) < 0.5 and abs(cy-q['cy']) < 0.5 for q in quads): continue
            quads.append({'sector': SECT[a['stroke']], 'pts': pts, 'cx': cx, 'cy': cy, 'area': poly_area(pts)})
print('quads', len(quads), Counter(q['sector'] for q in quads))

# glifi rossi (numeri): centro + angolo del testo
glyphs = []
for a in paths:
    if a.get('fill') != RED: continue
    mat = parse_matrix(a.get('transform'))
    allpts = [apply(mat, x, y) for s in parse_d(a['d']) for x, y in s]
    if not allpts: continue
    xs = [p[0] for p in allpts]; ys = [p[1] for p in allpts]
    ang = math.degrees(math.atan2(mat[1], mat[0]))
    glyphs.append({'cx': (min(xs)+max(xs))/2, 'cy': (min(ys)+max(ys))/2, 'ang': ang})

def inside(pt, poly):
    x, y = pt; n = len(poly); ins = False
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i+1) % n]
        if (y1 > y) != (y2 > y):
            xin = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
            if x < xin: ins = not ins
    return ins

for q in quads:
    q['nglyph'] = sum(1 for g in glyphs if inside((g['cx'], g['cy']), q['pts']))
    best = None
    for i in range(len(q['pts'])):
        x1, y1 = q['pts'][i]; x2, y2 = q['pts'][(i+1) % len(q['pts'])]
        L = math.hypot(x2-x1, y2-y1)
        a = (math.degrees(math.atan2(y2-y1, x2-x1)) + 90) % 180 - 90
        if best is None or L > best[0]: best = (L, a)
    q['phi'] = best[1]
    q['ang'] = 90 - best[1]   # rotazione PIL che rende il testo dritto (verificato su campione)
print('quads senza glifi:', sum(1 for q in quads if q['nglyph'] == 0))

# ordina per settore poi per posizione (riga per riga approssimata)
quads.sort(key=lambda q: (q['sector'], round(q['cy']/40), q['cx']))
for i, q in enumerate(quads): q['idx'] = i
json.dump(quads, open(os.path.join(SP, 'quads.json'), 'w'))

# contact sheets dal raster 600 dpi
DPI = 600; S = DPI/72
img = Image.open(os.path.join(SP, 'p600-1.png')).convert('RGB')
CW, CH = 300, 190; COLS, ROWS = 7, 9
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 26)
sheet_n = 0
for start in range(0, len(quads), COLS*ROWS):
    sheet = Image.new('RGB', (COLS*CW, ROWS*CH), 'white'); d = ImageDraw.Draw(sheet)
    for k, q in enumerate(quads[start:start+COLS*ROWS]):
        cx, cy = q['cx']*S, q['cy']*S
        R = 220
        crop = img.crop((int(cx-R), int(cy-R), int(cx+R), int(cy+R)))
        # ruota in modo che il testo sia dritto (PIL ruota in senso antiorario; y verso il basso => usa +ang)
        rot = crop.rotate(q['ang'], resample=Image.BICUBIC, fillcolor='white')
        # ritaglia il rettangolo orientato: dimensioni dal poligono
        pts = q['pts']
        L = [math.hypot(pts[(i+1)%len(pts)][0]-pts[i][0], pts[(i+1)%len(pts)][1]-pts[i][1]) for i in range(len(pts))]
        w = max(L)*S + 30; h = min(L)*S + 30
        w = min(w, CW-10); h = min(h, CH-40)
        box = rot.crop((int(R-w/2), int(R-h/2), int(R+w/2), int(R+h/2)))
        x0 = (k % COLS)*CW; y0 = (k // COLS)*CH
        sheet.paste(box, (x0+5, y0+34))
        d.rectangle((x0, y0, x0+CW-1, y0+CH-1), outline='#bbb')
        d.text((x0+6, y0+4), f"#{q['idx']} {q['sector']}", fill='black', font=font)
    sheet_n += 1
    sheet.save(os.path.join(SP, f'sheet-{sheet_n}.png'))
print('sheets', sheet_n)
