import assert from 'node:assert/strict';
import {connectDatabase,installSafeFatalHandler} from './database.mjs';
import {parseBrief,createCreativePlan} from './planner.mjs';
import {AIError} from './gemini.mjs';
installSafeFatalHandler();
let database;
try{
  const connected=await connectDatabase();database=connected.database;
  const brief=parseBrief({discipline:'photography',title:'A little cinematic',vision:'Make a cinematic portrait series with a blue fabric backdrop. If the blue fabric is booked, find an available substitute. Use one LED panel if the full resource kit fits the budget. Give a simple shoot schedule.',resources:'My phone, one friend, removable clips, a table and a room with a window.',start:'2026-10-25',end:'2026-10-27',budget:500});
  const plan=await createCreativePlan(connected.graph,brief);
  assert.ok(plan.trace.some(step=>step.tool==='search_resources'));
  assert.ok(plan.trace.some(step=>step.tool==='find_alternatives'));
  assert.ok(plan.resources.length>0);assert.ok(plan.steps.length>=3);
  assert.ok(plan.resources.every(resource=>resource.available));
  assert.ok(plan.totalCost<=500);
  assert.ok(!plan.resources.some(resource=>resource.name==='Blue backdrop fabric'));
  console.log(JSON.stringify({verified:true,model:plan.model,resourceNames:plan.resources.map(r=>r.name),totalCost:plan.totalCost,currency:plan.currency,toolSteps:plan.trace.map(t=>`${t.tool}:${t.purpose}`)},null,2));
}catch(error){console.error(error instanceof AIError?error.message:'The live planner verification did not pass. Check the model response and database availability.');process.exitCode=1}
finally{if(database)await database.close()}
