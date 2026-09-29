// A small, local sound portrait of a mark. No signature data or audio leaves the browser.
const SCALE=[0,2,4,7,9,12,14];
export function notesForSignature(record){
  const points=record.mode==='draw'?record.strokes.flat():[...record.name].map((character,index)=>[(index%9)/9,(character.codePointAt(0)%97)/97]);
  const source=points.length?points:[[.5,.5]];
  return Array.from({length:9},(_,i)=>{
    const [x,y]=source[Math.floor(i*(source.length-1)/8)];
    const degree=Math.min(6,Math.floor((1-y)*7));
    const semitone=SCALE[degree]+(record.number%5);
    return {frequency:220*2**(semitone/12),pan:Math.max(-.75,Math.min(.75,(x-.5)*1.5)),duration:.18+Math.max(0,Math.min(1,x))*.12};
  });
}
export async function playSignature(record){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)throw new Error('Audio unavailable');
  const context=new AudioContextClass();
  try{
    if(context.state==='suspended')await context.resume();
    const notes=notesForSignature(record);let time=context.currentTime+.04;
    for(const note of notes){
      const osc=context.createOscillator(),gain=context.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(note.frequency,time);
      const pan=context.createStereoPanner?.();
      if(pan){pan.pan.setValueAtTime(note.pan,time);osc.connect(gain).connect(pan).connect(context.destination)}
      else osc.connect(gain).connect(context.destination);
      gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.105,time+.025);gain.gain.exponentialRampToValueAtTime(.001,time+.65);
      osc.start(time);osc.stop(time+.68);time+=note.duration;
    }
    await new Promise(resolve=>setTimeout(resolve,Math.ceil((time-context.currentTime+.7)*1000)));
  }finally{await context.close()}
}
