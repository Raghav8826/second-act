import assert from 'node:assert/strict';
import {connectDatabase,installSafeFatalHandler} from './database.mjs';
import {parseSearch,InputError} from './availability.mjs';
import {searchResources} from './search.mjs';
import {DATASET,prefix} from './demo-data.mjs';
installSafeFatalHandler();
let database;
try{
  const connection=await connectDatabase();database=connection.database;
  const graph=connection.graph;
  const search=extra=>searchResources(graph,parseSearch(new URLSearchParams({discipline:'photography',purpose:'backdrop',start:'2026-10-25',end:'2026-10-27',quantity:'1',includeUnavailable:'true',...extra})));
  const result=await search({});
  const blue=result.matches.find(r=>r.id===prefix('resource:blue-fabric'));
  assert.equal(blue?.available,false,'The booked backdrop must be unavailable.');
  assert.equal(result.matches.find(r=>r.id===prefix('resource:teal-curtains'))?.available,true);
  const alternatives=await search({sourceId:blue.id,includeUnavailable:'false'});
  assert(alternatives.matches.some(r=>r.id===prefix('resource:teal-curtains')));
  assert(alternatives.matches.every(r=>r.available&&r.id!==blue.id));
  const free=await search({budget:'0'});
  assert(free.matches.every(r=>r.totalCost===0));
  assert(!free.matches.some(r=>r.id===prefix('resource:white-sheet')));
  const kit=await search({purpose:'capture'});
  const blockedCamera=kit.matches.find(r=>r.id===prefix('resource:camera-body'));
  assert.equal(blockedCamera?.available,false,'The booked required lens must block the camera kit.');
  assert.equal(blockedCamera?.totalCost,1200,'A three-day camera kit includes its required lens cost.');
  const later=await search({purpose:'capture',start:'2026-10-28',end:'2026-10-30'});
  assert.equal(later.matches.find(r=>r.id===prefix('resource:camera-body'))?.available,true);
  const stock=await search({purpose:'support',quantity:'2'});
  assert.equal(stock.matches.find(r=>r.id===prefix('resource:light-stand'))?.available,false);
  await assert.rejects(()=>search({purpose:'unsupported-purpose'}),InputError);
  const count=await graph.roQuery('MATCH (r:Resource {dataset:$dataset}) RETURN count(r) AS resources',{params:{dataset:DATASET}});
  assert.equal(count.data[0].resources,10);
  console.log('Live graph checks passed: backdrop availability, connected alternatives, zero-budget filtering, required-lens availability and pricing, stock quantities, validation and 10 demo resources.');
}catch(error){
  console.error(error instanceof assert.AssertionError?error.message:'Live inventory verification failed. Check the graph query implementation and database connection.');
  process.exitCode=1;
}finally{if(database)await database.close()}
