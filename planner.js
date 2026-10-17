'use strict';
let planRequest=null;
const money=value=>value===0?'FREE':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
function resetPlanner(){
  $('#plan-demo').textContent=selected==='fashion'?'TRY THE PEACOCK COSTUME BRIEF ↗':'TRY A ₹500 PORTRAIT BRIEF ↗';
  if(planRequest)planRequest.abort();planRequest=null;
  $('#plan-results').hidden=true;$('#plan-results').replaceChildren();
  $('#plan-status').textContent='Your idea + available resources = a practical starting point.';
  $('#generate-plan').disabled=false;$('#generate-plan').textContent='MAKE MY CREATIVE PLAN ↗';
}
function planList(parent,title,items){
  if(!items.length)return;
  const section=document.createElement('section');section.className='plan-text-section';
  section.append(resourceText('h3','plan-section-label',title));
  const list=document.createElement(title==='YOUR PRODUCTION STEPS'?'ol':'ul');
  for(const line of items)list.append(resourceText('li','',line));
  section.append(list);parent.append(section);
}
function renderPlan(plan){
  const root=$('#plan-results');root.replaceChildren();
  const heading=document.createElement('div');heading.className='plan-heading';
  heading.append(resourceText('span','eyebrow','YOUR NEXT ACT / THE CREATIVE PLAN'),resourceText('h2','',plan.title),resourceText('p','plan-concept',plan.concept));
  root.append(heading);
  const stats=document.createElement('div');stats.className='plan-stats';
  for(const [label,value] of [['VERIFIED RESOURCE COST',money(plan.totalCost)],['YOUR DATES',`${plan.start} → ${plan.end}`],['BUDGET LEFT FOR OTHER NEEDS',plan.budgetRemaining===null?'NOT SET':money(plan.budgetRemaining)]]){
    const stat=document.createElement('div');stat.append(resourceText('span','',label),resourceText('strong','',value));stats.append(stat);
  }
  root.append(stats,resourceText('p','plan-disclosure','Fictional campus inventory · Resource facts and totals checked by SecondAct · Creative suggestions by Gemini'));
  if(plan.resources.length){
    root.append(resourceText('h3','plan-section-label','YOUR RESOURCE LINEUP'));
    const cards=document.createElement('div');cards.className='plan-resources';
    for(const item of plan.resources){
      const card=document.createElement('article');card.className='plan-resource';
      card.append(resourceText('span','resource-availability','AVAILABLE WHEN CHECKED'),resourceText('h3','resource-name',item.name),resourceText('p','resource-owner',`${item.owner} · ${item.quantityRequested} ${item.unit}${item.quantityRequested===1?'':'s'}`),resourceText('p','plan-why',item.why),resourceText('p','plan-setup',item.setup));
      card.append(resourceText('p','resource-restrictions',item.restrictions));
      if(item.requirements.length)card.append(resourceText('p','resource-requires',`Required equipment: ${item.requirements.map(r=>r.name).join(', ')}`));
      card.append(resourceText('p','resource-explanation',item.explanation));cards.append(card);
    }
    root.append(cards);
  }
  if(plan.techniques?.length){
    planList(root,'GRAPH-VERIFIED MAKING METHODS',plan.techniques.flatMap(t=>[`${t.name}: ${t.outcome}`,...t.needs.map(n=>`${n.name}: ${n.resourceName}. ${n.path}`)]));
  }
  const columns=document.createElement('div');columns.className='plan-columns';
  const making=document.createElement('div'),practical=document.createElement('div');
  planList(making,'YOUR PRODUCTION STEPS',plan.steps);planList(making,'MAKE USE OF WHAT YOU HAVE',plan.ownedResourceUses);
  const costSection=document.createElement('section');costSection.className='plan-text-section';costSection.append(resourceText('h3','plan-section-label','THE RESOURCE BILL'));
  if(plan.costItems.length){
    const list=document.createElement('ul');list.className='plan-cost-list';
    for(const item of plan.costItems){const row=document.createElement('li');row.append(resourceText('span','',`${item.name} × ${item.quantity}`),resourceText('strong','',money(item.totalCost)));list.append(row)}
    costSection.append(list);
  }else costSection.append(resourceText('p','','No shared resources selected.'));
  costSection.append(resourceText('p','plan-small','Totals cover your full date range. Required equipment is counted once. Other project expenses are not priced.'));
  practical.append(costSection);planList(practical,'CHECK THESE ASSUMPTIONS',plan.assumptions);planList(practical,'STILL TO SORT OUT',plan.gaps);
  columns.append(making,practical);root.append(columns);
  const evidence=document.createElement('details');evidence.className='plan-evidence';evidence.append(resourceText('summary','','WHY THESE CHOICES? / SEE THE RESOURCE CHECKS'));
  const entries=document.createElement('ol');
  for(const step of plan.trace){
    const row=document.createElement('li');row.append(resourceText('strong','',`${step.tool==='inspect_techniques'?'Checked techniques':step.tool==='find_alternatives'?'Found alternatives':'Searched resources'} / ${step.purpose}: ${step.available} available of ${step.total}`));
    for(const item of step.explanations)row.append(resourceText('p','',`${item.name}: ${item.available?'available':'unavailable'}. ${item.reason} ${item.path}`));entries.append(row);
  }
  evidence.append(entries);root.append(evidence,resourceText('p','plan-small',plan.note));root.hidden=false;
  $('#plan-status').textContent='Your plan is ready. Resource totals and availability have been checked.';
  root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
$('#generate-plan').addEventListener('click',async()=>{
  if(!$('#brief-form').reportValidity())return;
  if(!$('#project-date').value){$('#project-date').setCustomValidity('Pick a start date for your creative plan.');$('#project-date').reportValidity();return}
  const start=$('#project-date').value,end=$('#project-end-date').value||start;
  if(end<start){$('#project-end-date').setCustomValidity('The end date must be on or after your start date.');$('#project-end-date').reportValidity();return}
  if(planRequest)planRequest.abort();const controller=new AbortController();planRequest=controller;
  $('#generate-plan').disabled=true;$('#generate-plan').textContent='WORKING ON YOUR NEXT ACT…';
  const previousPlan=!$('#plan-results').hidden;
  $('#plan-status').textContent=previousPlan?'Checking again. The previous plan remains below; its availability has not been refreshed yet.':'Reading your vision, checking shared resources and working around the limits. This can take a little time…';
  const values=Object.fromEntries(new FormData($('#brief-form')));
  storage.set(`second-act.brief.${selected}`,JSON.stringify({...values,discipline:selected,savedAt:new Date().toISOString()}));
  try{
    const response=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({discipline:selected,title:values.title,vision:values.vision,resources:values.resources,start,end,budget:values.budget}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(155000)])});
    if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Open SecondAct through the running backend to use the creative planner.');
    const result=await response.json();if(!response.ok)throw new Error(result.error||'The plan could not be completed.');
    if(planRequest===controller)renderPlan(result);
  }catch(error){if(planRequest===controller&&error.name!=='AbortError')$('#plan-status').textContent=(error.name==='TimeoutError'?'The planner took too long. Your brief is saved; please try again.':error.message==='Failed to fetch'?'The planner could not be reached. Check that the backend is running.':error.message)+(previousPlan?' Your previous plan remains below; its availability has not been refreshed.':'')}
  finally{if(planRequest===controller){planRequest=null;$('#generate-plan').disabled=false;$('#generate-plan').textContent='MAKE ANOTHER CREATIVE PLAN ↗'}}
});
$('#project-date').addEventListener('input',()=>$('#project-date').setCustomValidity(''));
$('#project-end-date').addEventListener('input',()=>$('#project-end-date').setCustomValidity(''));
$('#continue-button').addEventListener('click',resetPlanner);
$('#back-button').addEventListener('click',resetPlanner);
$('#brief-form').addEventListener('input',resetPlanner);
$('#plan-demo').addEventListener('click',()=>{
  resetPlanner();$('#project-title').value='A little cinematic';
  $('#project-vision').value='Make a cinematic portrait series with a blue fabric backdrop. If the blue fabric is booked, find an available substitute. Use one LED light if the full resource kit fits the budget. Give me a simple shoot schedule.';
  $('#project-resources').value='My phone, one friend, removable clips, a table and a room with a window.';
  $('#project-budget').value='500';$('#project-date').value='2026-10-25';$('#project-end-date').value='2026-10-27';
  if(selected==='fashion'){
    $('#project-title').value='Rajput Queen dress';
    $('#project-vision').value='Indian Rajasthani period-inspired costume with a peacock motif. I want sewn appliqué detailing. If the sewing machine is booked, find a hand-sewn alternative. Explain rejected methods and fabrics that cannot be cut.';
    $('#project-resources').value='My own base garment and fabric, my design, and basic hand-sewing experience.';
    $('#project-budget').value='2000';
  }
  $('#project-date').setCustomValidity('');$('#project-end-date').setCustomValidity('');
  $('#plan-status').textContent='Example brief filled in. Click Make my creative plan to run the agent.';
});
