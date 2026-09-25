import {geoOrthographic,geoPath,geoGraticule10,geoArea,geoDistance} from 'd3-geo';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const wheelScale=(delta,mode=0)=>Math.exp(clamp(delta*(mode===1?16:mode===2?300:1),-60,60)*.001);
// GeoJSON uses the opposite exterior winding from D3's spherical polygons.
export function sphericalGeometry(geometry){
  return {type:'MultiPolygon',coordinates:geometry.coordinates.map(poly=>{
    const outer={type:'Polygon',coordinates:[poly[0]]};
    return geoArea(outer)>2*Math.PI?poly.map(r=>r.slice().reverse()):poly;
  })};
}
const globe={rotation:[-65,-20,0],zoom:1,selected:null};
export const globeShell=()=>`<svg id="atlas-globe" viewBox="0 0 640 640" role="img" aria-label="Interactive globe. Drag to rotate; use plus and minus to zoom."><defs><radialGradient id="globe-ocean" cx="35%" cy="28%"><stop stop-color="#397e9c"/><stop offset=".65" stop-color="#173955"/><stop offset="1" stop-color="#08172c"/></radialGradient><radialGradient id="globe-shade" cx="30%" cy="25%" r="75%"><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000817" stop-opacity=".6"/></radialGradient></defs><g class="globe-surface"><path class="globe-ocean" fill="url(#globe-ocean)"/><path class="globe-grid"/><g class="globe-countries"></g><path class="globe-shade" fill="url(#globe-shade)" pointer-events="none"/><g class="globe-capitals"></g></g></svg>`;
export function mountGlobe(countries,capitals,selected,onSelect){
  const svg=document.querySelector('#atlas-globe');if(!svg)return;
  const capById=new Map(capitals.map(c=>[c.id,c]));
  if(selected&&selected!==globe.selected){const c=capById.get(selected);if(c){globe.rotation=[-c.lon,-c.lat,0];globe.zoom=1.35}}
  globe.selected=selected;
  const projection=geoOrthographic().translate([320,320]).clipAngle(90).precision(.4);
  const drawPath=geoPath(projection),grid=geoGraticule10();
  const ns='http://www.w3.org/2000/svg';
  const paths=countries.map(c=>{
    const el=document.createElementNS(ns,'path');el.setAttribute('class',`globe-country ${capById.has(c.id)?'featured':''} ${selected===c.id?'selected':''}`);
    const title=document.createElementNS(ns,'title');title.textContent=c.name;el.append(title);
    el.addEventListener('click',()=>{if(!dragged&&capById.has(c.id))onSelect(c.id)});
    svg.querySelector('.globe-countries').append(el);return {el,geometry:sphericalGeometry(c.geometry)};
  });
  const labels=capitals.map(c=>{const g=document.createElementNS(ns,'g');g.setAttribute('class','globe-capital');const dot=document.createElementNS(ns,'circle');dot.setAttribute('r','3.5');const label=document.createElementNS(ns,'text');label.setAttribute('x','7');label.setAttribute('y','-7');label.textContent=c.capital;g.append(dot,label);g.addEventListener('click',()=>{if(!dragged)onSelect(c.id)});svg.querySelector('.globe-capitals').append(g);return {g,c}});
  function paint(){
    projection.rotate(globe.rotation).scale(270*globe.zoom);
    const sphere=drawPath({type:'Sphere'});
    svg.querySelector('.globe-ocean').setAttribute('d',sphere);
    svg.querySelector('.globe-shade').setAttribute('d',sphere);
    svg.querySelector('.globe-grid').setAttribute('d',drawPath(grid));
    paths.forEach(({el,geometry})=>el.setAttribute('d',drawPath(geometry)||''));
    const center=projection.invert([320,320]);
    labels.forEach(({g,c})=>{const visible=geoDistance(center,[c.lon,c.lat])<Math.PI/2-.07;g.style.display=visible?'':'none';if(visible){const p=projection([c.lon,c.lat]);g.setAttribute('transform',`translate(${p[0]},${p[1]})`)}});
  }
  let frame=0;const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(svg.isConnected)paint()})};
  let start=null,dragged=false;
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragged=false;start={x:e.clientX,y:e.clientY,rotation:[...globe.rotation]}});
  svg.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)<5)return;dragged=true;svg.setPointerCapture(e.pointerId);const speed=35/Math.max(250,svg.getBoundingClientRect().width)/globe.zoom;globe.rotation=[start.rotation[0]+dx*speed,clamp(start.rotation[1]-dy*speed,-85,85),0];schedule()});
  svg.addEventListener('pointerup',()=>{start=null;setTimeout(()=>{dragged=false},0)});svg.addEventListener('pointercancel',()=>{start=null;dragged=false});
  svg.addEventListener('wheel',e=>{e.preventDefault();globe.zoom=clamp(globe.zoom/wheelScale(e.deltaY,e.deltaMode),.8,2.8);schedule()},{passive:false});
  document.querySelectorAll('[data-map-control]').forEach(button=>button.onclick=()=>{
    const action=button.dataset.mapControl;
    if(action==='zoom-in')globe.zoom=clamp(globe.zoom*1.055,.8,2.8);
    else if(action==='zoom-out')globe.zoom=clamp(globe.zoom/1.055,.8,2.8);
    else if(action==='reset'){globe.rotation=[-65,-20,0];globe.zoom=1;globe.selected=null;onSelect(null);return}
    else{globe.rotation[0]+=action==='left'?-8:action==='right'?8:0;globe.rotation[1]=clamp(globe.rotation[1]+(action==='up'?8:action==='down'?-8:0),-85,85)}
    schedule();
  });
  paint();
}
