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
        const controller=new AbortController();
        response.on('close',()=>{if(!response.writableEnded)controller.abort('client_disconnect')});
        let body='';
        try{
          for await(const chunk of request){body+=chunk;if(body.length>10000)return send(response,413,{error:'PROMPT_TOO_LONG'})}
          const currentEnv=loadEnv(mode,process.cwd(),'');
          const result=await interpretPrompt(JSON.parse(body).prompt,{key:process.env.GEMINI_API_KEY||currentEnv.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||currentEnv.GEMINI_MODEL||'gemini-3.1-flash-lite',signal:controller.signal});
          if(controller.signal.aborted)return;
          return send(response,result.status,result.body);
        }catch(e){if(!controller.signal.aborted)return send(response,400,{error:'INVALID_REQUEST'})}
      });
    }}],
  };
});
