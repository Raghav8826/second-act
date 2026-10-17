import assert from 'node:assert/strict';

const base=new URL(process.env.SECOND_ACT_URL||'http://127.0.0.1:4318');
const checkAI=process.argv.includes('--ai');
async function get(route){
  const response=await fetch(new URL(route,base),{signal:AbortSignal.timeout(35000)});
  assert.equal(response.status,200,`${route} did not respond successfully.`);
  return response;
}
try{
  const health=await (await get('/api/health')).json();
  assert.equal(health.status,'connected');assert(health.resources>=35,'Expanded graph is not ready.');
  const page=await (await get('/')).text();assert(page.includes('SecondAct'));
  for(const route of ['/app.js','/planner.js','/styles.css','/intro.js','/intro-engine.js','/interactions.js','/assets/second-act-mark.svg','/assets/filmmaker_pop_v3.png','/assets/theatre_pop_v3.png','/assets/photography_pop_v3.png','/assets/fashion_pop_v3.png','/assets/profile-pop-grid.jpg'])await (await get(route)).arrayBuffer();
  for(const route of ['/backend/.env','/backend/server.mjs','/.git/config']){
    const response=await fetch(new URL(route,base),{signal:AbortSignal.timeout(5000)});assert.equal(response.status,404,'Private project files must not be served.');
  }
  const scenarios=[
    ['filmmaker','lighting','A short phone film','Make a small indoor film with my phone and available lighting.'],
    ['theatre','set','A tiny stage set','Create a small reusable cardboard theatre set with available tools and removable scenery.'],
    ['photography','backdrop','A little cinematic','Make a phone portrait series. If the blue backdrop is booked, find an available substitute.'],
    ['fashion','costume','Rajput Queen dress','Make period-inspired peacock appliqué. If the sewing machine is booked, use a feasible hand-sewn method.']
  ];
  const results=[];
  for(const [discipline,purpose,title,vision] of scenarios){
    const query=new URLSearchParams({discipline,purpose,start:'2026-10-25',end:'2026-10-27',quantity:'1',includeUnavailable:'true',budget:discipline==='fashion'?'2000':'500'});
    const stock=await (await get(`/api/resources?${query}`)).json();assert(stock.availableCount>0,`${discipline} has no available sample resources.`);
    if(checkAI){
      const started=Date.now();
      const response=await fetch(new URL('/api/plan',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({discipline,title,vision,resources:'My phone, own base fabric and garment, basic hand-sewing experience, a room and a friend.',start:'2026-10-25',end:'2026-10-27',budget:discipline==='fashion'?2000:500}),signal:AbortSignal.timeout(155000)});
      const plan=await response.json();assert.equal(response.status,200,plan.error||`${discipline} plan failed.`);
      assert(plan.trace.length>0);assert(plan.resources.length>0);assert(plan.resources.every(r=>r.available));
      assert(plan.totalCost<=(discipline==='fashion'?2000:500));assert(plan.steps.length>=3);
      if(discipline==='fashion')assert(plan.techniques.length>0);
      results.push({discipline,totalCost:plan.totalCost,seconds:Math.round((Date.now()-started)/1000),methods:plan.techniques.map(t=>t.name)});
    }
    console.log(`${discipline}: live inventory${checkAI?' and Gemini plan':''} passed.`);
  }
  console.log(JSON.stringify({verified:true,resources:health.resources,frontendAssets:true,privateFilesBlocked:true,aiChecked:checkAI,results},null,2));
}catch(error){console.error(error instanceof assert.AssertionError?error.message:'Demo preflight could not reach the local server or complete a request. Check the backend and service availability.');process.exitCode=1}
