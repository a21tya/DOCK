import {defineConfig,loadEnv} from 'vite';
import {interpretPrompt} from './src/model-server.js';

const send=(response,status,data)=>{
  response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  response.end(JSON.stringify(data));
};

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  return {
    base:process.env.GITHUB_PAGES==='true'?'/DOCK/':'/',
    plugins:[{name:'dock-interpret',configureServer(server){
      server.middlewares.use('/api/interpret',async(request,response)=>{
        if(request.method!=='POST')return send(response,405,{error:'METHOD_NOT_ALLOWED'});
        let body='';
        try{
          for await(const chunk of request){body+=chunk;if(body.length>10000)return send(response,413,{error:'PROMPT_TOO_LONG'})}
          const result=await interpretPrompt(JSON.parse(body).prompt,{key:process.env.GEMINI_API_KEY||env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||env.GEMINI_MODEL||'gemini-3.1-flash-lite'});
          return send(response,result.status,result.body);
        }catch{return send(response,400,{error:'INVALID_REQUEST'})}
      });
    }}],
  };
});
