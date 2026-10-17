import test from 'node:test';
import assert from 'node:assert/strict';
import {createProxy} from './proxy.mjs';
test('static content stays on Pages and does not invoke AWS',async()=>{
 const worker=createProxy(()=>{throw Error('must not call AWS')});const response=await worker.fetch(new Request('https://secondact.pages.dev/'),{ASSETS:{fetch:async()=>new Response('SecondAct')}});assert.equal(await response.text(),'SecondAct');
});
test('API proxy uses the fixed backend and preserves quota errors without forwarding cookies',async()=>{
 let called;const worker=createProxy(async(url,options)=>{called={url,options};return new Response(JSON.stringify({error:'Daily limit'}),{status:429,headers:{'Content-Type':'application/json','Retry-After':'60'}})});
 const response=await worker.fetch(new Request('https://secondact.pages.dev/api/plan',{method:'POST',headers:{Origin:'https://secondact.pages.dev','Content-Type':'application/json',Cookie:'private=test'},body:'{"discipline":"fashion"}'}),{});
 assert.equal(called.url.hostname,'ctd2zkolmsdn6rk7lgqys56f2i0yenqx.lambda-url.ap-south-1.on.aws');assert.equal(called.options.headers.get('cookie'),null);assert.equal(called.options.headers.get('origin'),'https://ctd2zkolmsdn6rk7lgqys56f2i0yenqx.lambda-url.ap-south-1.on.aws');assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'60');
});
test('cross-origin posts and arbitrary API paths never reach AWS',async()=>{
 const worker=createProxy(()=>{throw Error('must not call AWS')});
 assert.equal((await worker.fetch(new Request('https://secondact.pages.dev/api/plan',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'}),{})).status,403);
 assert.equal((await worker.fetch(new Request('https://secondact.pages.dev/api/private'),{})).status,404);
});
