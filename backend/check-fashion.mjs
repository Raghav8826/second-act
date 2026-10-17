import assert from 'node:assert/strict';
import {connectDatabase,installSafeFatalHandler} from './database.mjs';
import {parseBrief,createCreativePlan} from './planner.mjs';
import {AIError} from './gemini.mjs';
installSafeFatalHandler();
let database;
try{
  const connection=await connectDatabase();database=connection.database;
  const brief=parseBrief({discipline:'fashion',title:'Rajput Queen dress',vision:'Indian Rajasthani period-inspired costume with a peacock motif. Inspect the making techniques. I want sewn appliqué detailing, but if the sewing machine is booked use a feasible hand-sewn method instead. Explain why the unavailable methods and non-cuttable borrowed fabrics were rejected. Do not claim historical authenticity.',resources:'My own base garment and fabric, my design, and basic hand-sewing experience.',start:'2026-10-25',end:'2026-10-27',budget:2000});
  const plan=await createCreativePlan(connection.graph,brief);
  assert.equal(plan.trace[0].tool,'inspect_techniques');
  assert(plan.techniques.some(t=>t.id.endsWith(':hand-applique')));
  assert(!plan.techniques.some(t=>t.id.endsWith(':machine-applique')||t.id.endsWith(':embroidery')));
  assert(plan.totalCost<=2000);
  assert(plan.techniques.every(t=>t.needs.every(n=>plan.resources.some(r=>r.id===n.resourceId))));
  console.log(JSON.stringify({verified:true,model:plan.model,methods:plan.techniques.map(t=>t.name),resourceNames:plan.resources.map(r=>r.name),totalCost:plan.totalCost,toolSteps:plan.trace.map(t=>t.tool),steps:plan.steps,gaps:plan.gaps},null,2));
}catch(error){console.error(error instanceof AIError?error.message:error instanceof assert.AssertionError?error.message:'Fashion graph/agent verification failed. Check live service availability.');process.exitCode=1}
finally{if(database)await database.close()}
