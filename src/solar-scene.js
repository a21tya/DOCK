import './solar-scene.css';

export function solarScene(text){
  if(/\b(?:sunrise|dawn|daybreak)\b/i.test(text))return {type:'sunrise',name:'First light',palette:['#ffe6a8','#e8a58b','#427c91']};
  if(/\b(?:sunset|golden hour|dusk)\b/i.test(text))return {type:'sunset',name:'Golden hour',palette:['#ffc46e','#d66a68','#322c58']};
  return null;
}
export function solarMarkup(){
  return `<div class="solar-atmosphere" aria-hidden="true"><div class="solar-sky"><div class="solar-daylight"></div><div class="solar-stars"></div><div class="solar-body"><div class="solar-disc"></div></div><div class="solar-cloud solar-cloud-one"></div><div class="solar-cloud solar-cloud-two"></div></div><div class="solar-sea"></div><div class="solar-waterlight"></div><div class="solar-ripples">${Array.from({length:18},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="solar-horizon"></div></div>`;
}
