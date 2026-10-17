import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectTechniques,verifyTechniques} from './techniques.mjs';
import {resources,techniques,requirements,bookings,prefix} from './demo-data.mjs';

test('expanded graph has unique IDs and no dangling resource relationships',()=>{
  assert.equal(resources.length,35);
  const ids=new Set(resources.map(r=>r.id));assert.equal(ids.size,resources.length);
  for(const t of techniques)for(const n of t.needs)for(const id of n.options)assert(ids.has(id));
  for(const r of requirements){assert(ids.has(r.resourceId));assert(ids.has(r.requiredId))}
  for(const b of bookings)assert(ids.has(b.resourceId));
});

test('date changes block techniques and cutting permissions remove otherwise available fabric',async()=>{
  const brief={discipline:'fashion',start:'2026-10-25',end:'2026-10-27',budget:2000};
  const graph={async roQuery(query,{params}){
    if(query.includes('ENABLES'))return {data:techniques.filter(t=>t.discipline==='fashion').flatMap(t=>t.needs.flatMap(n=>n.options.map(id=>{
      const r=resources.find(r=>r.id===id);
      return {techniqueId:t.id,techniqueName:t.name,outcome:t.outcome,needId:n.id,needName:n.name,operation:n.operation,resourceId:r.id,resourceName:r.name,canCut:r.canCut,canDye:r.canDye};
    })))};
    if(query.includes('REQUIRES'))return {data:[]};
    return {data:resources.filter(r=>r.purposes.includes(params.purpose)).map(r=>({id:r.id,name:r.name,totalQuantity:r.quantity,dailyCost:r.dailyCost,unit:r.unit,owner:'Demo',restrictions:r.restrictions,materials:r.materials,purposeName:params.purpose,bookings:bookings.filter(b=>b.resourceId===r.id)}))};
  }};
  const first=await inspectTechniques(graph,brief);
  const find=(results,key)=>results.techniques.find(t=>t.id===prefix(`technique:${key}`));
  assert.equal(find(first,'embroidery').available,false);
  assert.equal(find(first,'machine-applique').available,false);
  const hand=find(first,'hand-applique');assert.equal(hand.available,true);
  const fabric=hand.needs[0];
  assert(fabric.rejected.some(r=>r.id===prefix('resource:blue-fabric')&&r.reason.includes('does not permit')));
  assert(fabric.options.some(r=>r.id===prefix('resource:teal-offcuts')));
  const later=await inspectTechniques(graph,{...brief,start:'2026-10-28',end:'2026-10-30'});
  assert.equal(find(later,'embroidery').available,true);
  assert.equal(find(later,'machine-applique').available,true);
});

test('final methods reject unknown IDs, blocked methods and incomplete requirements',()=>{
  const method={id:'hand',name:'Hand appliqué',available:true,needs:[{name:'Fabric',options:[{id:'cuttable',name:'Offcuts',path:'Fashion → method → fabric'}]}]};
  const observed=new Map([['hand',method],['blocked',{...method,id:'blocked',available:false}]]);
  assert.throws(()=>verifyTechniques(['unknown'],observed,new Set()));
  assert.throws(()=>verifyTechniques(['blocked'],observed,new Set(['cuttable'])));
  assert.throws(()=>verifyTechniques(['hand'],observed,new Set(['borrowed-intact'])));
  assert.equal(verifyTechniques(['hand'],observed,new Set(['cuttable']))[0].needs[0].resourceId,'cuttable');
});
