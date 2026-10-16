import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {connectDatabase,installSafeFatalHandler} from './database.mjs';
import {DATASET,disciplines,uses} from './demo-data.mjs';
import {parseSearch,InputError} from './availability.mjs';
import {searchResources} from './search.mjs';
import {parseBrief,createCreativePlan} from './planner.mjs';
import {AIError} from './gemini.mjs';
installSafeFatalHandler();
const root=fileURLToPath(new URL('../',import.meta.url));
const allowedFiles=new Set(['/index.html','/styles.css','/app.js','/intro.js','/intro-engine.js','/planner.js','/interactions.js']);
const allowedAssets=new Set(['.png','.jpg','.jpeg','.webp','.svg','.ico','.woff2']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
const port=Number(process.env.PORT||4318);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid server port');
let connection;
try{connection=await connectDatabase();await connection.database.list()}
catch{console.error('Could not start the backend: check the private database settings and instance availability.');process.exit(1)}
const {database,graph}=connection;
let activePlans=0;
const planRequests=new Map();
async function readBrief(req){
  if(!req.headers['content-type']?.startsWith('application/json'))throw new InputError('Send the project brief as JSON.');
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>20000)throw new InputError('The project brief is too long.');chunks.push(chunk)}
  try{return parseBrief(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch(error){if(error instanceof SyntaxError)throw new InputError('The project brief is not valid JSON.');throw error}
}
function json(res,status,value,head=false){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(head?undefined:JSON.stringify(value))}
const server=http.createServer(async(req,res)=>{
  const head=req.method==='HEAD';
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    const route=decodeURIComponent(url.pathname);
    if(route==='/api/plan'&&req.method==='POST'){
      if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Open the planner from this website.'});
      const brief=await readBrief(req);
      const now=Date.now(),address=req.socket.remoteAddress||'local';
      for(const [key,value] of planRequests)if(value.until<=now)planRequests.delete(key);
      const limit=planRequests.get(address)||{count:0,until:now+60000};
      if(activePlans>=2||limit.count>=4){res.setHeader('Retry-After','60');return json(res,429,{error:'A few plans are already in progress. Wait a minute before trying again.'})}
      limit.count++;planRequests.set(address,limit);activePlans++;
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),150000);
      const disconnect=()=>{if(!res.writableEnded)controller.abort()};res.on('close',disconnect);
      try{return json(res,200,await createCreativePlan(graph,brief,{signal:controller.signal}))}
      finally{clearTimeout(timer);res.off('close',disconnect);activePlans--}
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:route==='/api/plan'?'POST':'GET, HEAD'});res.end();return}
    if(route==='/api/health'){
      const count=await graph.roQuery('MATCH (r:Resource {dataset:$dataset}) RETURN count(r) AS resources',{params:{dataset:DATASET}});
      return json(res,200,{status:'connected',resources:count.data[0]?.resources||0,inventory:'Fictional campus demo'},head);
    }
    if(route==='/api/catalog')return json(res,200,{disciplines:disciplines.map(d=>({key:d.key,name:d.name,purposes:uses.filter(u=>d.uses.includes(u.key)).map(({key,name})=>({key,name}))}))},head);
    if(route==='/api/resources')return json(res,200,await searchResources(graph,parseSearch(url.searchParams)),head);
    if(route.startsWith('/api/'))return json(res,404,{error:'This API route does not exist.'},head);
    const publicRoute=route==='/'?'/index.html':route;
    let target;
    if(allowedFiles.has(publicRoute))target=path.join(root,publicRoute.slice(1));
    else if(publicRoute.startsWith('/assets/')&&allowedAssets.has(path.extname(publicRoute).toLowerCase())){
      target=path.resolve(root,'.'+publicRoute);
      if(!target.startsWith(path.join(root,'assets')+path.sep)){res.writeHead(404);res.end();return}
    }else{res.writeHead(404);res.end();return}
    let bytes;
    try{bytes=await readFile(target)}catch{res.writeHead(404);res.end();return}
    res.writeHead(200,{'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(head?undefined:bytes);
  }catch(error){
    if(res.destroyed)return;
    if(error instanceof AIError)return json(res,error.status,{error:error.message},head);
    if(error instanceof InputError||error instanceof URIError)return json(res,400,{error:error instanceof InputError?error.message:'Invalid request address.'},head);
    console.error('A resource request could not be completed.');
    json(res,503,{error:'The shared inventory is temporarily unavailable. Please try again.'},head);
  }
});
server.on('error',()=>{console.error('The local server could not open its port. Check that another preview is not already running.');database.close().finally(()=>process.exit(1))});
server.listen(port,'127.0.0.1',()=>console.log(`SecondAct: http://127.0.0.1:${port} — connected to FalkorDB`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>database.close().finally(()=>process.exit(0))));
