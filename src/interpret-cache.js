import {validateModelPlan} from './intent-plan.js';

const KEY='dock-scene-cache-v1';
const normalize=text=>text.trim().replace(/\s+/g,' ').toLowerCase();
export function createPlanCache(storage,now=Date.now){
  const entries=new Map();
  try{
    const saved=JSON.parse(storage?.getItem(KEY)||'[]');
    if(Array.isArray(saved))for(const item of saved.slice(-40)){
      if(typeof item?.key!=='string'||item.key.length>500||!Number.isFinite(item.expires)||item.expires<=now())continue;
      const plan=validateModelPlan(item.plan);if(plan)entries.set(item.key,{plan,expires:item.expires});
    }
  }catch{/* Corrupt or unavailable browser storage must not block a search. */}
  return {
    get(query){const key=normalize(query),item=entries.get(key);if(!item)return null;if(item.expires<=now()){entries.delete(key);return null}return item.plan},
    set(query,data){const plan=validateModelPlan(data);if(!plan)return;const key=normalize(query);entries.delete(key);entries.set(key,{plan,expires:now()+(plan.action==='answer'?120000:1800000)});while(entries.size>40)entries.delete(entries.keys().next().value);try{storage?.setItem(KEY,JSON.stringify([...entries].map(([key,value])=>({key,...value}))))}catch{}},
  };
}
