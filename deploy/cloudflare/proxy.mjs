const backend=new URL('https://ctd2zkolmsdn6rk7lgqys56f2i0yenqx.lambda-url.ap-south-1.on.aws/');
const routes=new Set(['/api/health','/api/catalog','/api/resources','/api/plan']);
const json=(status,error,extra={})=>new Response(JSON.stringify({error}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
export function createProxy(fetcher=fetch){return {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  if(!routes.has(url.pathname))return json(404,'This API route does not exist.');
  const allowed=url.pathname==='/api/plan'?['POST']:['GET','HEAD'];
  if(!allowed.includes(request.method))return json(405,'This request method is not supported.',{Allow:allowed.join(', ')});
  if(request.method==='POST'){
   const origin=request.headers.get('origin');
   if(origin&&origin!==url.origin)return json(403,'Open the planner from this website.');
   if(!request.headers.get('content-type')?.startsWith('application/json'))return json(400,'Send the project brief as JSON.');
  }
  const target=new URL(url.pathname+url.search,backend);
  const headers=new Headers({Origin:backend.origin});
  const type=request.headers.get('content-type');if(type)headers.set('Content-Type',type);
  let body;
  if(request.method==='POST'){
   body=await request.arrayBuffer();if(body.byteLength>20000)return json(400,'The project brief is too long.');
  }
  try{
   const response=await fetcher(target,{method:request.method,headers,body,redirect:'manual',signal:request.signal});
   const outputHeaders=new Headers({'Content-Type':response.headers.get('content-type')||'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   const retry=response.headers.get('retry-after');if(retry)outputHeaders.set('Retry-After',retry);
   return new Response(response.body,{status:response.status,headers:outputHeaders});
  }catch{return json(503,'The service could not be reached. Your brief is saved; please try again.')}
 }
};}
export default createProxy();
