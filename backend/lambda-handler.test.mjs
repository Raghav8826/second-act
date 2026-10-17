import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from './lambda-handler.mjs';
import {createUsageLimiter,UsageLimit} from './lambda-usage.mjs';
const event=(rawPath,method='GET',extra={})=>({rawPath,headers:{},requestContext:{domainName:'example.lambda-url.ap-south-1.on.aws',http:{method,sourceIp:'192.0.2.1'}},...extra});
const brief={discipline:'fashion',title:'Peacock costume',vision:'Make a hand-sewn costume.',resources:'Own fabric.',budget:2000,start:'2026-10-25',end:'2026-10-27'};
test('Lambda serves the real frontend and images but never private files',async()=>{
 const handler=createHandler({connect:()=>{throw Error('Must not connect for static requests')}});
 const html=await handler(event('/'));assert.equal(html.statusCode,200);assert(Buffer.from(html.body,'base64').toString().includes('SecondAct'));
 assert.equal((await handler(event('/assets/fashion_pop_v3.png'))).statusCode,200);
 for(const route of ['/backend/.env','/backend/server.mjs','/.git/config','/assets/../backend/.env'])assert.equal((await handler(event(route))).statusCode,404);
});
test('Lambda validates input and cross-origin requests before consuming AI budget',async()=>{
 let used=0;const handler=createHandler({consume:async()=>used++});
 assert.equal((await handler(event('/api/plan','POST',{headers:{origin:'https://other.example','content-type':'application/json'},body:JSON.stringify(brief)}))).statusCode,403);
 assert.equal((await handler(event('/api/plan','POST',{headers:{'content-type':'application/json'},body:'{}'}))).statusCode,400);assert.equal(used,0);
});
test('Lambda awaits the complete plan and closes its database connection',async()=>{
 let closed=0,used=0;const database={connection:Promise.resolve({isReady:true}),close:async()=>closed++};
 const handler=createHandler({connect:async()=>({database,graph:{roQuery:async()=>({})}}),consume:async()=>used++,plan:async()=>({title:'A complete plan',steps:['Cut','Sew','Finish']})});
 const result=await handler(event('/api/plan','POST',{headers:{'content-type':'application/json'},body:JSON.stringify(brief)}));
 assert.equal(result.statusCode,200);assert.equal(JSON.parse(result.body).title,'A complete plan');assert.equal(closed,1);assert.equal(used,1);
});
test('shared budget uses atomic conditional updates, hashes IPs, and fails closed',async()=>{
 const commands=[];const limiter=createUsageLimiter({table:'usage',client:{send:async command=>commands.push(command.input)},now:()=>1792230000000,dailyLimit:30});await limiter('192.0.2.1');assert.equal(commands.length,2);assert(!JSON.stringify(commands).includes('192.0.2.1'));assert.equal(commands[1].ExpressionAttributeValues[':limit'].N,'30');
 const blocked=createUsageLimiter({table:'usage',client:{send:async()=>{throw Object.assign(new Error(),{name:'ConditionalCheckFailedException'})}}});await assert.rejects(blocked('test'),UsageLimit);
});
