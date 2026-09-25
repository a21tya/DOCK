"""Build compact interactive-map data from geoBoundaries ADM1/ADM2 and Natural Earth.

Usage: python3 scripts/prepare_maps.py STATES.geojson DISTRICTS.geojson WORLD.geojson
India ADM1: CC BY 2.5 IN (DataMeet/Election Commission, via geoBoundaries).
India ADM2: ODbL 1.0 (Pathways Data/LG Directory, via geoBoundaries).
World: Natural Earth public domain.
"""
import json, math, sys, unicodedata
from pathlib import Path


def segments(geometry):
    if geometry['type']=='Polygon': return [geometry['coordinates']]
    if geometry['type']=='MultiPolygon': return geometry['coordinates']
    return []


def area(ring):
    return abs(sum(x1*y2-x2*y1 for (x1,y1),(x2,y2) in zip(ring,ring[1:])))/2


def bbox(ring):
    xs=[p[0] for p in ring];ys=[p[1] for p in ring]
    return min(xs),min(ys),max(xs),max(ys)


def inside(point,ring):
    x,y=point; found=False
    for (x1,y1),(x2,y2) in zip(ring,ring[1:]):
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: found=not found
    return found


def representative(geometry):
    ring=max((poly[0] for poly in segments(geometry)),key=area)
    bounds=bbox(ring)
    points=[((bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2),
            (sum(p[0] for p in ring)/len(ring),sum(p[1] for p in ring)/len(ring))]
    points += [(bounds[0]+(bounds[2]-bounds[0])*i/10,bounds[1]+(bounds[3]-bounds[1])*j/10) for i in range(1,10) for j in range(1,10)]
    return next((p for p in points if inside(p,ring)),tuple(ring[len(ring)//3]))


def distance(point,a,b):
    px,py=point;ax,ay=a;bx,by=b
    dx=bx-ax;dy=by-ay
    if dx==dy==0:return math.hypot(px-ax,py-ay)
    t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)))
    return math.hypot(px-(ax+t*dx),py-(ay+t*dy))


def simplify(ring,tolerance):
    points=ring[:-1] if ring[0]==ring[-1] else ring
    if len(points)<5:return ring
    keep={0,len(points)-1}; stack=[(0,len(points)-1)]
    while stack:
        lo,hi=stack.pop()
        if hi-lo<2:continue
        index=max(range(lo+1,hi),key=lambda i:distance(points[i],points[lo],points[hi]))
        if distance(points[index],points[lo],points[hi])>tolerance:
            keep.add(index);stack.extend([(lo,index),(index,hi)])
    output=[points[i] for i in sorted(keep)]
    return output+[output[0]] if len(output)>=3 else ring


def compact_geometry(geometry,tolerance,precision=3):
    polys=[]
    for poly in segments(geometry):
        rings=[]
        for ring in poly:
            if area(ring)<tolerance*tolerance*5:continue
            pts=simplify(ring,tolerance)
            rings.append([[round(x,precision),round(y,precision)] for x,y in pts])
        if rings:polys.append(rings)
    if not polys:
        poly=max(segments(geometry),key=lambda p:area(p[0]))
        polys=[[[[round(x,5),round(y,5)] for x,y in poly[0]]]]
    return {'type':'MultiPolygon','coordinates':polys}


def label(value):
    return unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode('ascii')

states=json.load(open(sys.argv[1]))['features']
districts=json.load(open(sys.argv[2]))['features']
world=json.load(open(sys.argv[3]))['features']
state_data=[]
for f in states:
    p=f['properties'];state_data.append({'id':p['shapeISO'],'name':label(p['shapeName']),'geometry':compact_geometry(f['geometry'],.024),'label':representative(f['geometry'])})

state_rings=[]
for f in states:
    rings=[poly[0] for poly in segments(f['geometry'])]
    state_rings.append((f['properties']['shapeISO'],[(bbox(r),r) for r in rings]))

district_data=[];unmatched=[]
for f in districts:
    point=representative(f['geometry']);parent=None
    for state_id,rings in state_rings:
        for b,ring in rings:
            if b[0]<=point[0]<=b[2] and b[1]<=point[1]<=b[3] and inside(point,ring):
                parent=state_id;break
        if parent:break
    if not parent and f['properties']['shapeName'].lower()=='lakshadweep':parent='IN-LD'
    if not parent:
        unmatched.append(f['properties']['shapeName']);continue
    district_data.append({'state':parent,'name':label(f['properties']['shapeName']),'geometry':compact_geometry(f['geometry'],.018),'label':point})

Path('public/data').mkdir(parents=True,exist_ok=True)
Path('public/data/india-map.json').write_text(json.dumps({'states':state_data,'districts':district_data},separators=(',',':')))
world_data=[]
for f in world:
    p=f['properties'];world_data.append({'id':p['ADM0_A3'],'name':p['ADMIN'],'geometry':compact_geometry(f['geometry'],.24,2)})
Path('public/data/world-map.json').write_text(json.dumps({'countries':world_data},separators=(',',':')))
print('states',len(state_data),'districts',len(district_data),'unmatched',unmatched)
from collections import Counter
print('district counts',Counter(d['state'] for d in district_data).most_common(10))
print('world countries',len(world_data))
