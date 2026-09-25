const functions = {sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,round:Math.round,floor:Math.floor,ceil:Math.ceil,sin:Math.sin,cos:Math.cos,tan:Math.tan,log:Math.log10,ln:Math.log};

export function calculate(input){
  let text=input.trim().toLowerCase().replace(/,/g,'').replace(/[×]/g,'*').replace(/[÷]/g,'/').replace(/[−]/g,'-').replace(/√/g,'sqrt ').replace(/∛/g,'cbrt ');
  text=text.replace(/^(?:calculate|what is|what's|compute|solve|find)\s+/,'').replace(/[?=]\s*$/,'').trim();
  text=text.replace(/\bsquare root of\b/g,'sqrt ').replace(/\bcube root of\b/g,'cbrt ').replace(/\bsquare of\b/g,'square ').replace(/\bcube of\b/g,'cube ');
  text=text.replace(/\b(\d+(?:\.\d+)?)\s+squared\b/g,'($1)^2').replace(/\b(\d+(?:\.\d+)?)\s+cubed\b/g,'($1)^3');
  text=text.replace(/\b(\d+(?:\.\d+)?)\s+percent of\s+(\d+(?:\.\d+)?)\b/g,'($1/100)*$2').replace(/\b(\d+(?:\.\d+)?)\s*%\s+of\s+(\d+(?:\.\d+)?)\b/g,'($1/100)*$2');
  text=text.replace(/\bplus\b/g,'+').replace(/\bminus\b/g,'-').replace(/\b(?:times|multiplied by)\b/g,'*').replace(/\bdivided by\b/g,'/').replace(/\bto the power of\b/g,'^');
  text=text.replace(/\bsquare\s+(-?\d+(?:\.\d+)?)\b/g,'($1)^2').replace(/\bcube\s+(-?\d+(?:\.\d+)?)\b/g,'($1)^3');
  if(!/\d/.test(text)||!/[+*/^()%!-]|\b(?:sqrt|cbrt|abs|round|floor|ceil|sin|cos|tan|log|ln)\b/.test(text))return null;
  const tokens=text.match(/\d*\.\d+|\d+(?:\.\d+)?|[a-z]+|[()+*/^%!-]/g);
  if(!tokens||tokens.join('')!==text.replace(/\s+/g,''))return null;
  let at=0;
  const peek=()=>tokens[at];
  const take=()=>tokens[at++];
  function primary(){
    if(peek()==='+'){take();return primary()}
    if(peek()==='-'){take();return -primary()}
    if(peek()==='('){take();const n=expression();if(take()!==')')throw Error('Missing closing parenthesis');return n}
    if(functions[peek()]){const fn=functions[take()];return fn(primary())}
    const n=Number(take());if(!Number.isFinite(n))throw Error('Invalid number');return n;
  }
  function power(){let n=primary();if(peek()==='^'){take();n=Math.pow(n,power())}while(peek()==='!'||peek()==='%'){const op=take();if(op==='%')n/=100;else {if(!Number.isInteger(n)||n<0||n>170)throw Error('Factorial supports whole numbers from 0 to 170');let value=1;for(let i=2;i<=n;i++)value*=i;n=value}}return n}
  function term(){let n=power();while(['*','/'].includes(peek())){const op=take(),other=power();n=op==='*'?n*other:n/other}return n}
  function expression(){let n=term();while(['+','-'].includes(peek())){const op=take(),other=term();n=op==='+'?n+other:n-other}return n}
  try{const result=expression();if(at!==tokens.length)throw Error('Invalid expression');return {expression:text,result:Number.isFinite(result)?result:null}}catch{return null}
}
