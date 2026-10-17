import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBrief,verifyPlan,createCreativePlan} from './planner.mjs';
const brief=parseBrief({discipline:'photography',title:'A small shoot',vision:'A portrait using available materials.',resources:'My phone',start:'2026-10-25',end:'2026-10-27',budget:500});
const item=(id,dailyCost,extra={})=>({id,name:id,available:true,availableQuantity:2,quantityRequested:1,dailyCost,days:3,totalCost:dailyCost*3,requirements:[],...extra});
const draft=choices=>({title:'A resourceful shoot',concept:'Use natural light.',choices,steps:['Arrange your set.','Shoot the portraits.','Return borrowed equipment.'],ownedResourceUses:['Use your phone.'],assumptions:['Daylight is available.'],gaps:[]});
const choice=(id,quantity=1)=>({id,quantity,why:'Fits the project.',setup:'Use removable clips.'});
test('rejects invalid briefs before calling a model',()=>{
  assert.throws(()=>parseBrief({...brief,start:'2026-02-30'}));
  assert.throws(()=>parseBrief({...brief,discipline:'painting'}));
  assert.throws(()=>parseBrief({...brief,vision:' '}));
});
test('does not accept hallucinated, booked, duplicated or excessive inventory',()=>{
  const observed=new Map([['free',item('free',0)],['booked',item('booked',0,{available:false})]]);
  for(const choices of [[choice('unknown')],[choice('booked')],[choice('free'),choice('free')],[choice('free',3)]])assert.throws(()=>verifyPlan(draft(choices),observed,brief));
});
test('checks total project resource budget, including quantities and dependencies',()=>{
  const camera=item('camera',100,{requirements:[{id:'lens',name:'lens',dailyCost:50,availableQuantity:1}]});
  const observed=new Map([['camera',camera],['light',item('light',50)]]);
  assert.equal(verifyPlan(draft([choice('camera')]),observed,brief).totalCost,450);
  assert.throws(()=>verifyPlan(draft([choice('camera'),choice('light')]),observed,brief),/exceeds/);
  assert.throws(()=>verifyPlan(draft([choice('light')]),observed,{...brief,budget:0}),/exceeds/);
});
test('required equipment is not charged twice when explicitly selected',()=>{
  const camera=item('camera',100,{requirements:[{id:'lens',name:'lens',dailyCost:20,availableQuantity:1}]});
  const observed=new Map([['camera',camera],['lens',item('lens',20)]]);
  assert.equal(verifyPlan(draft([choice('camera'),choice('lens')]),observed,brief).totalCost,360);
});
test('validates stock shared by multiple required-equipment packages',()=>{
  const required={id:'stand',name:'stand',dailyCost:10,availableQuantity:1};
  const observed=new Map([['a',item('a',0,{requirements:[required]})],['b',item('b',0,{requirements:[required]})]]);
  assert.throws(()=>verifyPlan(draft([choice('a'),choice('b')]),observed,brief),/more shared equipment/);
});
test('agent actually queries graph tools and retains signed model messages',async()=>{
  const signature={functionCall:{name:'search_resources',args:{purposes:['backdrop'],quantity:1}},thoughtSignature:'test-signature'};
  let stage=0,queries=0;
  const graph={async roQuery(query){queries++;return {data:query.includes('REQUIRES')?[]:[{id:'verified',name:'Verified backdrop',totalQuantity:1,dailyCost:0,unit:'roll',dimensions:'3 m',restrictions:'Return intact.',materials:['cotton'],owner:'Demo Club',description:'Demo',purposeName:'Backdrops',bookings:[]}]}}};
  const generate=async body=>{
    stage++;
    if(stage===1){assert.deepEqual(body.toolConfig.functionCallingConfig.allowedFunctionNames,['search_resources']);return {content:{role:'model',parts:[signature]},usage:{}}}
    assert.equal(body.contents[1].parts[0].thoughtSignature,'test-signature');
    assert.equal(body.contents[2].parts[0].functionResponse.response.groups[0].matches[0].id,'verified');
    return {content:{role:'model',parts:[{functionCall:{name:'finish_plan',args:draft([choice('verified')])}}]},usage:{}};
  };
  const result=await createCreativePlan(graph,brief,{generate,settings:{model:'fake-test',key:'unused'}});
  assert.equal(result.totalCost,0);assert.equal(result.trace[0].tool,'search_resources');assert.equal(queries,2);
});

test('fashion agent inspects methods first and repairs an incomplete technique selection',async()=>{
  const fashion=parseBrief({...brief,discipline:'fashion'});
  let turns=0;
  const graph={async roQuery(query){
    if(query.includes('ENABLES'))return {data:[{techniqueId:'method',techniqueName:'Hand method',outcome:'Demo',needId:'need',needName:'Cuttable cloth',operation:'cut',resourceId:'verified',resourceName:'Offcut',canCut:true,canDye:false}]};
    return {data:query.includes('REQUIRES')?[]:[{id:'verified',name:'Offcut',totalQuantity:1,dailyCost:0,unit:'bundle',owner:'Demo',materials:['cotton'],purposeName:'Costumes',bookings:[]}]};
  }};
  const generate=async body=>{
    turns++;
    if(turns===1){assert.deepEqual(body.toolConfig.functionCallingConfig.allowedFunctionNames,['inspect_techniques']);return {content:{role:'model',parts:[{functionCall:{name:'inspect_techniques',args:{}}}]},usage:{}}}
    if(turns===3)assert.match(body.contents.at(-1).parts[0].functionResponse.response.error,/Include an available, permitted resource/);
    return {content:{role:'model',parts:[{functionCall:{name:'finish_plan',args:{...draft(turns===2?[]:[choice('verified')]),techniqueIds:['method']}}}]},usage:{}};
  };
  const result=await createCreativePlan(graph,fashion,{generate,settings:{model:'fake-test',key:'unused'}});
  assert.equal(turns,3);assert.equal(result.techniques[0].needs[0].resourceId,'verified');
});
