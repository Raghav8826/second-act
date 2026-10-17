import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {connectDatabase} from './database.mjs';
import {DATASET,disciplines,uses} from './demo-data.mjs';
import {parseSearch,InputError} from './availability.mjs';
import {searchResources} from './search.mjs';
import {parseBrief,createCreativePlan} from './planner.mjs';
import {AIError} from './gemini.mjs';
import {recoveringReader,InventoryUnavailable} from './resilience.mjs';
import {createUsageLimiter,UsageLimit} from './lambda-usage.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=new Set(['/index.html','/styles.css','/app.js','/intro.js','/intro-engine.js','/planner.js','/interactions.js']);
const extensions=new Set(['.png','.jpg','.jpeg','.webp','.svg','.ico','.woff2']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
function json(statusCode,value,head=false,extra={}){return {statusCode,headers:{...headers,'Content-Type':'application/json; charset=utf-8',...extra},body:head?'':JSON.stringify(value)}}
export function createHandler({connect=connectDatabase,plan=createCreativePlan,search=searchResources,consume,read=readFile}={}){
 let consumePlan=consume;
 return async(event,context={})=>{
  context.callbackWaitsForEmptyEventLoop=false;
  let connection;const method=event.requestContext?.http?.method,head=method==='HEAD';
  try{
   const route=decodeURIComponent(event.rawPath||'/');
   const reqHeaders=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),v]));
   let brief;
   if(route==='/api/plan'&&method==='POST'){
    const host=event.requestContext?.domainName;
    if(reqHeaders.origin){let valid=false;try{const origin=new URL(reqHeaders.origin);valid=origin.protocol==='https:'&&origin.host===host}catch{}if(!valid)return json(403,{error:'Open the planner from this website.'})}
    if(!reqHeaders['content-type']?.startsWith('application/json'))throw new InputError('Send the project brief as JSON.');
    const bytes=Buffer.from(event.body||'',event.isBase64Encoded?'base64':'utf8');
    if(bytes.length>20000)throw new InputError('The project brief is too long.');
    let value;try{value=JSON.parse(bytes.toString('utf8'))}catch{throw new InputError('The project brief is not valid JSON.')}
    brief=parseBrief(value);
    consumePlan??=createUsageLimiter();await consumePlan(event.requestContext?.http?.sourceIp);
   }else if(!['GET','HEAD'].includes(method))return json(405,{error:'This request method is not supported.'},head,{Allow:route==='/api/plan'?'POST':'GET, HEAD'});
   if(route==='/api/catalog')return json(200,{disciplines:disciplines.map(d=>({key:d.key,name:d.name,purposes:uses.filter(u=>d.uses.includes(u.key)).map(({key,name})=>({key,name}))}))},head);
   if(route==='/api/health'||route==='/api/resources'||brief){
    const query=route==='/api/resources'?parseSearch(new URLSearchParams(event.rawQueryString||'')):null;
    connection=await connect();const {database,graph}=connection;const client=await database.connection;
    graph.roQuery=recoveringReader(graph.roQuery.bind(graph),()=>client.isReady);
    if(route==='/api/health'){
     const count=await graph.roQuery('MATCH (r:Resource {dataset:$dataset}) RETURN count(r) AS resources',{params:{dataset:DATASET}});
     return json(200,{status:'connected',resources:count.data[0]?.resources||0,inventory:'Fictional campus demo'},head);
    }
    if(query)return json(200,await search(graph,query),head);
    return json(200,await plan(graph,brief,{signal:AbortSignal.timeout(145000)}));
   }
   if(route.startsWith('/api/'))return json(404,{error:'This API route does not exist.'},head);
   const publicRoute=route==='/'?'/index.html':route;let target;
   if(files.has(publicRoute))target=path.join(root,publicRoute.slice(1));
   else if(publicRoute.startsWith('/assets/')&&extensions.has(path.extname(publicRoute).toLowerCase())){
    target=path.resolve(root,'.'+publicRoute);if(!target.startsWith(path.join(root,'assets')+path.sep))return json(404,{error:'Not found.'},head);
   }else return json(404,{error:'Not found.'},head);
   let bytes;try{bytes=await read(target)}catch{return json(404,{error:'Not found.'},head)}
   return {statusCode:200,headers:{...headers,'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream'},body:head?'':bytes.toString('base64'),isBase64Encoded:true};
  }catch(error){
   if(error instanceof UsageLimit)return json(429,{error:error.message},head,{'Retry-After':String(error.retryAfter)});
   if(error instanceof AIError)return json(error.status,{error:error.message},head);
   if(error instanceof InputError||error instanceof URIError)return json(400,{error:error instanceof InputError?error.message:'Invalid request address.'},head);
   return json(503,{error:'The service is temporarily unavailable. Your brief is saved; please try again.'},head,{'Retry-After':'5'});
  }finally{if(connection)try{await connection.database.close()}catch{}}
 };
}
export const handler=createHandler();
