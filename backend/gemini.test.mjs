import test from 'node:test';
import assert from 'node:assert/strict';
import {generateContent,AIError} from './gemini.mjs';
const settings={key:'fictional-test-key',model:'gemini-test'};
const success=()=>new Response(JSON.stringify({candidates:[{content:{role:'model',parts:[{text:'ok'}]}}],usageMetadata:{promptTokenCount:1}}),{status:200});

test('temporary Gemini server errors retry once and retain the request',async()=>{
  let calls=0;const body={contents:[{role:'user',parts:[{text:'synthetic'}]}]};
  const result=await generateContent(body,{settings,pause:async()=>{},fetcher:async(url,request)=>{
    assert(!url.includes(settings.key));assert.equal(request.headers['x-goog-api-key'],settings.key);assert.deepEqual(JSON.parse(request.body),body);
    return ++calls===1?new Response('',{status:503}):success();
  }});
  assert.equal(calls,2);assert.equal(result.content.parts[0].text,'ok');
});

test('transport failures retry once; repeated failures terminate',async()=>{
  let calls=0;
  await assert.rejects(generateContent({}, {settings,pause:async()=>{},fetcher:async()=>{calls++;throw new TypeError('network')}}),AIError);
  assert.equal(calls,2);
});

test('quota and access failures do not loop or consume repeated requests',async()=>{
  for(const status of [429,403,404]){
    let calls=0;
    await assert.rejects(generateContent({}, {settings,pause:async()=>{},fetcher:async()=>{calls++;return new Response('',{status})}}),AIError);
    assert.equal(calls,1);
  }
});

test('cancelled generation never retries',async()=>{
  const controller=new AbortController();let calls=0;
  await assert.rejects(generateContent({}, {settings,signal:controller.signal,pause:async()=>{},fetcher:async()=>{calls++;controller.abort();throw new Error()}}),AIError);
  assert.equal(calls,1);
});
