import {globeShell,mountGlobe,wheelScale} from './globe.js';
const capitals=[
  {id:'IND',name:'India',capital:'New Delhi',lon:77.21,lat:28.61},
  {id:'USA',name:'United States',capital:'Washington, D.C.',lon:-77.04,lat:38.9},
  {id:'CAN',name:'Canada',capital:'Ottawa',lon:-75.7,lat:45.42},
  {id:'GBR',name:'United Kingdom',capital:'London',lon:-.13,lat:51.51},
  {id:'FRA',name:'France',capital:'Paris',lon:2.35,lat:48.86},
  {id:'DEU',name:'Germany',capital:'Berlin',lon:13.4,lat:52.52},
  {id:'ITA',name:'Italy',capital:'Rome',lon:12.5,lat:41.9},
  {id:'ESP',name:'Spain',capital:'Madrid',lon:-3.7,lat:40.42},
  {id:'BRA',name:'Brazil',capital:'Brasília',lon:-47.88,lat:-15.79},
  {id:'RUS',name:'Russia',capital:'Moscow',lon:37.62,lat:55.75},
  {id:'CHN',name:'China',capital:'Beijing',lon:116.41,lat:39.9},
  {id:'JPN',name:'Japan',capital:'Tokyo',lon:139.69,lat:35.68},
  {id:'AUS',name:'Australia',capital:'Canberra',lon:149.13,lat:-35.28}
];
export function countryForPrompt(text){
  if(!/\bmap\b/i.test(text))return null;
  return capitals.find(c=>new RegExp('\\b'+c.name+'\\b','i').test(text))?.id || (/\b(?:usa|america)\b/i.test(text)?'USA':/\b(?:uk|britain)\b/i.test(text)?'GBR':null);
}
const capById=new Map(capitals.map(c=>[c.id,c]));
const cache={};
const state={mode:null,selectedState:null,selectedCountry:null,view:null};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fullName=name=>name.replace(/\bDadra and Nagar Haveli and Daman and Diu\b/,'Dadra and Nagar Haveli and Daman and Diu');
function coords(geometry){return geometry.coordinates.flat(2)}
function bounds(features){const pts=features.flatMap(f=>coords(f.geometry));const xs=pts.map(p=>p[0]),ys=pts.map(p=>-p[1]);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;const pad=Math.max(w,h)*.055;return {x:x-pad,y:y-pad,w:w+pad*2,h:h+pad*2}}
function path(geometry){return geometry.coordinates.map(polygon=>polygon.map(ring=>ring.map(([x,y],i)=>`${i?'L':'M'}${x},${-y}`).join('')+'Z').join('')).join('')}
const viewString=v=>`${v.x} ${v.y} ${v.w} ${v.h}`;
const copyView=v=>({...v});
function fit(mode,data){
  if(mode==='world-map'){
    const country=data.countries.find(f=>f.id===state.selectedCountry);
    return country?bounds([country]):{x:-184,y:-88,w:368,h:176};
  }
  const feature=state.selectedState&&data.states.find(f=>f.id===state.selectedState);
  return bounds(feature?[feature]:data.states);
}
export function mapShell(mode){
  return `<section class="result-card atlas-card"><div class="atlas-header"><div><small>DOCK ATLAS / ${mode==='india-map'?'INDIA':'WORLD'}</small><h2>${mode==='india-map'?'Political map of India':'A world to explore'}</h2><p>${mode==='india-map'?'Select a state or union territory to explore its districts.':'Drag the globe. Pick a country to find its capital.'}</p></div><div class="atlas-controls"><button data-map-control="zoom-in" aria-label="Zoom in">+</button><button data-map-control="zoom-out" aria-label="Zoom out">−</button><button data-map-control="reset">RESET</button></div></div><div id="map-content" class="atlas-layout"><div class="atlas-loading">Loading the map…</div></div></section>`;
}
export async function mountMap(mode,country=null){
  if(!['india-map','world-map'].includes(mode))return;
  if(state.mode!==mode){state.mode=mode;state.selectedState=null;state.selectedCountry=null;state.view=null}
  if(country&&state.selectedCountry!==country){state.selectedCountry=country;state.view=null}
  const host=document.querySelector('#map-content');if(!host)return;
  try{
    if(!cache[mode]){const url=mode==='india-map'?'/data/india-map.json':'/data/world-map.json';const response=await fetch(url);if(!response.ok)throw Error('Map data unavailable');cache[mode]=await response.json()}
    if(!document.querySelector('#map-content')||state.mode!==mode)return;
    draw(mode);
  }catch{host.innerHTML='<p class="atlas-error">The map could not load. Refresh the page to try again.</p>'}
}
function draw(mode){
  const data=cache[mode],host=document.querySelector('#map-content');if(!host)return;
  const fitView=fit(mode,data);if(!state.view)state.view=copyView(fitView);
  const v=state.view;
  const isIndia=mode==='india-map';
  const states=isIndia?data.states:[];
  const selected=states.find(f=>f.id===state.selectedState);
  const districts=isIndia&&selected?data.districts.filter(d=>d.state===selected.id):[];
  const features=isIndia?(selected?districts:states):data.countries;
  const districtPaths=isIndia&&selected?`<path class="atlas-state-outline" d="${path(selected.geometry)}"/>`:'';
  const labelSize=isIndia?(selected?Math.max(.135,Math.min(.16,v.w/60)):Math.max(.22,Math.min(.45,v.w/60))):0;
  const paths=features.map((f,i)=>{
    const capital=capById.get(f.id);
    const type=isIndia?(selected?'district':'state'):'country';
    return `<path class="atlas-region ${capital?'featured':''}" data-map-item="${esc(type)}" data-map-id="${esc(f.id||f.name)}" d="${path(f.geometry)}"><title>${esc(f.name)}${capital?` · ${esc(capital.capital)}`:''}</title></path>`;
  }).join('');
  const labels=isIndia?features.map(f=>`<text class="atlas-map-label ${selected?'district-label':''}" x="${f.label[0]}" y="${-f.label[1]}" font-size="${labelSize}">${esc(f.name)}</text>`).join(''):capitals.map(c=>`<g class="atlas-capital" data-map-item="country" data-map-id="${c.id}"><circle cx="${c.lon}" cy="${-c.lat}" r="1.45"/><text x="${c.lon+2}" y="${-c.lat-1.4}" font-size="2.6">${esc(c.capital)}</text></g>`).join('');
  const selectedCapital=capById.get(state.selectedCountry);
  const sidebar=isIndia?`<div class="atlas-side-head"><b>${selected?esc(selected.name):'28 STATES · 8 UNION TERRITORIES'}</b>${selected?'<button data-map-back>← ALL INDIA</button>':''}</div><div class="atlas-list">${(selected?districts:states).slice().sort((a,b)=>a.name.localeCompare(b.name)).map(f=>`<button data-map-item="${selected?'district':'state'}" data-map-id="${esc(f.id||f.name)}">${esc(fullName(f.name))}</button>`).join('')}</div><small class="atlas-source">${selected?'Historical district boundaries (2021): geoBoundaries / Pathways Data, ODbL 1.0. Not current administrative divisions.':'States and UT boundaries: geoBoundaries / DataMeet (CC BY 2.5 IN).'} ${selected?.id==='IN-RJ'?'<a href="https://rajasthan.gov.in/" target="_blank" rel="noopener">Rajasthan now has 41 districts ↗</a>':''}</small>`:`<div class="atlas-side-head"><b>${selectedCapital?esc(selectedCapital.name):'13 COUNTRIES · CAPITALS'}</b></div>${selectedCapital?`<div class="atlas-capital-detail"><span>CAPITAL</span><strong>${esc(selectedCapital.capital)}</strong></div>`:''}<div class="atlas-list">${capitals.map(c=>`<button data-map-item="country" data-map-id="${c.id}" class="${state.selectedCountry===c.id?'active':''}">${esc(c.name)} <span>${esc(c.capital)}</span></button>`).join('')}</div><small class="atlas-source">Country outlines: Natural Earth (public domain).</small>`;
  host.innerHTML=`<div class="atlas-map">${isIndia?`<svg id="atlas-svg" viewBox="${viewString(v)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive ${isIndia?'India states and districts':'world capitals'} map">${paths}${districtPaths}${labels}</svg>`:globeShell()}<div class="atlas-map-hint">${isIndia?'DRAG TO PAN':'DRAG TO ROTATE'} · SCROLL GENTLY TO ZOOM</div><div class="atlas-pan"><button data-map-control="left" aria-label="Pan left">←</button><button data-map-control="up" aria-label="Pan up">↑</button><button data-map-control="down" aria-label="Pan down">↓</button><button data-map-control="right" aria-label="Pan right">→</button></div></div><div class="atlas-sidebar">${sidebar}</div>`;
  if(!isIndia){
    const select=id=>{state.selectedCountry=id;draw(mode);const c=capById.get(id);if(c)revealPlace(c.capital,c.lon,c.lat)};
    host.querySelectorAll('[data-map-item]').forEach(el=>el.onclick=()=>select(el.dataset.mapId));
    mountGlobe(data.countries,capitals,state.selectedCountry,select);
  }else bind(mode);
}
function changeView(){const svg=document.querySelector('#atlas-svg');if(svg)svg.setAttribute('viewBox',viewString(state.view))}
function zoom(scale,cx,cy){const v=state.view;if(v.w*scale<.02||v.w*scale>750)return;const x=cx??v.x+v.w/2,y=cy??v.y+v.h/2;state.view={x:x-(x-v.x)*scale,y:y-(y-v.y)*scale,w:v.w*scale,h:v.h*scale};changeView()}
let suppressClickUntil=0;
function bind(mode){
  document.querySelectorAll('[data-map-item]').forEach(el=>el.addEventListener('click',event=>{
    if(performance.now()<suppressClickUntil)return;
    const type=el.dataset.mapItem,id=el.dataset.mapId;
    if(type==='state'){state.selectedState=id;state.view=null;draw(mode);const f=cache[mode].states.find(x=>x.id===id);if(f)revealPlace(f.name,...f.label)}
    else if(type==='country'){state.selectedCountry=id;state.view=null;draw(mode)}
    else if(type==='district'){const district=cache[mode].districts.find(x=>x.state===state.selectedState&&x.name===id);if(district)revealPlace(district.name,...district.label)}
    event.stopPropagation();
  }));
  document.querySelector('[data-map-back]')?.addEventListener('click',()=>{state.selectedState=null;state.view=null;draw(mode)});
  document.querySelectorAll('[data-map-control]').forEach(button=>button.onclick=()=>{
    const action=button.dataset.mapControl,v=state.view;
    if(action==='zoom-in')zoom(.95);else if(action==='zoom-out')zoom(1/.95);
    else if(action==='reset'){if(mode==='world-map'){state.selectedCountry=null;state.view=null;draw(mode)}else{state.view=fit(mode,cache[mode]);changeView()}}
    else{const dx=v.w*.045,dy=v.h*.045;state.view={...v,x:v.x+(action==='left'?-dx:action==='right'?dx:0),y:v.y+(action==='up'?-dy:action==='down'?dy:0)};changeView()}
  });
  const svg=document.querySelector('#atlas-svg');if(!svg)return;
  let start=null;
  const point=e=>{const p=new DOMPoint(e.clientX,e.clientY);return p.matrixTransform(svg.getScreenCTM().inverse())};
  svg.addEventListener('pointerdown',e=>{const p=point(e);start={x:e.clientX,y:e.clientY,p,view:copyView(state.view),matrix:svg.getScreenCTM().inverse()}});
  svg.addEventListener('pointermove',e=>{if(!start)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)<4)return;suppressClickUntil=performance.now()+350;svg.setPointerCapture(e.pointerId);const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(start.matrix);state.view={...start.view,x:start.view.x-(p.x-start.p.x)*.38,y:start.view.y-(p.y-start.p.y)*.38};changeView()});
  svg.addEventListener('pointerup',()=>{start=null});svg.addEventListener('pointercancel',()=>{start=null});
  svg.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoom(wheelScale(e.deltaY,e.deltaMode),p.x,p.y)},{passive:false});
}

let placeRequest=0;
async function revealPlace(place,lon,lat){
  const sidebar=document.querySelector('.atlas-sidebar');if(!sidebar)return;
  const request=++placeRequest;
  sidebar.querySelector('.atlas-place')?.remove();
  const panel=document.createElement('div');panel.className='atlas-place';
  panel.innerHTML=`<small>SELECTED PLACE</small><strong>${esc(place)}</strong><span class="atlas-place-weather">Checking temperature…</span><button type="button">PLAN A TRIP ↗</button>`;
  panel.querySelector('button').onclick=()=>window.dispatchEvent(new CustomEvent('dock-plan-trip',{detail:{place}}));
  sidebar.querySelector('.atlas-source')?.before(panel);
  try{const response=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m&timezone=auto`);if(!response.ok)throw Error();const data=await response.json();if(request===placeRequest&&panel.isConnected)panel.querySelector('.atlas-place-weather').textContent=`${Math.round(data.current.temperature_2m)}°C · current estimate`}
  catch{if(request===placeRequest&&panel.isConnected)panel.querySelector('.atlas-place-weather').textContent='Temperature unavailable'}
}
