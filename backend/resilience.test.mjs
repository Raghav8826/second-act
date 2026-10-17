import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveringReader,InventoryUnavailable} from './resilience.mjs';

test('read waits for reconnect and retries a socket interruption with original query',async()=>{
  let ready=false,calls=0;const options={params:{id:'demo'}};
  const read=recoveringReader(async(query,received)=>{
    assert.equal(query,'MATCH demo');assert.equal(received,options);
    if(++calls===1)throw Object.assign(new Error(),{code:'ECONNRESET'});
    return {data:[35]};
  },()=>ready,{pause:async()=>{ready=true}});
  assert.deepEqual(await read('MATCH demo',options),{data:[35]});assert.equal(calls,2);
});

test('outage has a finite wait and never invents inventory',async()=>{
  let calls=0,waits=0;
  const read=recoveringReader(async()=>{calls++;return {data:[35]}},()=>false,{waitMs:200,pause:async()=>{waits++}});
  await assert.rejects(read(),InventoryUnavailable);assert.equal(calls,0);assert.equal(waits,5);
});

test('bad queries are not retried or hidden as connection errors',async()=>{
  let calls=0;const error=new Error('Invalid query');
  const read=recoveringReader(async()=>{calls++;throw error},()=>true,{pause:async()=>{}});
  await assert.rejects(read(),e=>e===error);assert.equal(calls,1);
});

test('unresponsive reads time out after one bounded retry',async()=>{
  let calls=0;
  const read=recoveringReader(()=>{calls++;return new Promise(()=>{})},()=>true,{queryMs:5,pause:async()=>{}});
  await assert.rejects(read(),InventoryUnavailable);assert.equal(calls,2);
});

test('recognises SDK socket error classes whose name property is only Error',async()=>{
  class SocketClosedUnexpectedlyError extends Error {}
  let calls=0;
  const read=recoveringReader(async()=>{if(++calls===1)throw new SocketClosedUnexpectedlyError();return 'recovered'},()=>true,{pause:async()=>{}});
  assert.equal(await read(),'recovered');assert.equal(calls,2);
});
