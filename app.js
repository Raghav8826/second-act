'use strict';
const disciplines={
  filmmaker:{label:'Filmmaker',index:'01',accent:'#ff4051',asset:'filmmaker_pop_v3',status:'LET’S PUT YOUR VISION IN MOTION.',description:'Your next great story starts with what you have.',placeholder:'A surreal short film about ordinary things…'},
  theatre:{label:'Theatre',index:'02',accent:'#75c6ff',asset:'theatre_pop_v3',status:'THE STAGE IS YOURS.',description:'Let’s give your next performance a starting point.',placeholder:'An intimate performance with an unexpected set…'},
  photography:{label:'Photography',index:'03',accent:'#08c6cf',asset:'photography_pop_v3',status:'YOU’VE GOT AN EYE. LET’S USE IT.',description:'Make room for a different point of view.',placeholder:'A photo series that makes the familiar feel strange…'},
  fashion:{label:'Fashion Designer',index:'04',accent:'#ff4596',asset:'fashion_pop_v3',status:'SOMETHING GOOD IS TAKING SHAPE.',description:'Your next collection starts with a little resourcefulness.',placeholder:'A wearable collection made from overlooked materials…'}
};
const $=selector=>document.querySelector(selector);
const avatars=['blue','red','green','yellow','orange','cyan'];
const storage={
  get(key){try{return localStorage.getItem(key)}catch{return null}},
  set(key,value){try{localStorage.setItem(key,value);return true}catch{return false}},
  remove(key){try{localStorage.removeItem(key)}catch{}}
};
let selected=null,transitioning=false,profile=null,formAvatar='yellow',activeScreen='profile',profileReturnScreen='selection';
try{
  const saved=JSON.parse(storage.get('second-act.profile'));
  if(saved&&typeof saved.name==='string'&&saved.name.trim()&&saved.name.length<=40){
    profile={name:saved.name.trim(),avatar:avatars.includes(saved.avatar)?saved.avatar:'yellow',createdAt:saved.createdAt};
  }
}catch{}

function focusHeading(screen){
  const heading=document.getElementById(screen==='brief'?'brief-title':screen==='profile'?'profile-title':'selection-title');
  window.getSelection()?.removeAllRanges();
  heading.setAttribute('tabindex','-1');
  heading.classList.add('screen-focus-target');
  heading.focus({preventScroll:true});
  heading.addEventListener('blur',()=>{heading.removeAttribute('tabindex');heading.classList.remove('screen-focus-target')},{once:true});
}
function closeProfileMenu(){
  $('#profile-menu').hidden=true;
  $('#profile-toggle').setAttribute('aria-expanded','false');
}
function updateProfileUI(){
  $('#profile-toggle').hidden=!profile||activeScreen==='profile';
  $('#header-avatar').dataset.avatar=profile?.avatar||'yellow';
  $('#profile-greeting').textContent=profile?`Hey, ${profile.name}.`:'Hey, artist.';
  $('#welcome-line').textContent=profile?`YOUR NEXT ACT STARTS HERE, ${profile.name.toUpperCase()}.`:'YOUR NEXT ACT STARTS HERE';
}
function setDraftAvatar(value){
  formAvatar=avatars.includes(value)?value:'yellow';
  $('#draft-avatar').dataset.avatar=formAvatar;
  $('#draft-avatar').setAttribute('aria-label',`${formAvatar[0].toUpperCase()+formAvatar.slice(1)} pop-art portrait`);
}
function prepareProfile(){
  $('#profile-name').value=profile?.name||'';
  $('#profile-name').setCustomValidity('');
  $('#profile-name').removeAttribute('aria-invalid');
  $('#profile-name-error').textContent='';
  setDraftAvatar(profile?.avatar||'yellow');
  $('#profile-cancel').hidden=!profile;
  $('#profile-submit-label').textContent=profile?'SAVE MY PROFILE':'MAKE MY ENTRANCE';
}
function selectDiscipline(value){
  if(!disciplines[value])return;
  selected=value;
  window.playSelectionMotion?.(value);
  const d=disciplines[value];
  document.querySelector(`input[name="discipline"][value="${value}"]`).checked=true;
  $('.page-shell').classList.add('has-selection');
  document.documentElement.style.setProperty('--accent',d.accent);
  $('#continue-button').disabled=false;
  $('#status-title').textContent=d.status;
  $('#status-description').textContent=d.description;
  $('#profile-discipline').textContent=`Your world: ${d.label}.`;
  document.querySelectorAll('.selection-mark').forEach(mark=>{mark.textContent=mark.closest('label').querySelector('input').checked?'✓':'↗'});

}
function populateBrief(){
  const d=disciplines[selected];
  $('#brief-category').textContent=`${d.index} / ${d.label.toUpperCase()}`;
  $('#brief-art').src=`assets/${d.asset}.png`;
  $('#project-vision').placeholder=d.placeholder;
  $('#brief-form').reset();
  $('#save-status').textContent='';
  let draft;
  try{draft=JSON.parse(storage.get(`second-act.brief.${selected}`))}catch{}
  if(draft){for(const field of ['title','vision','resources','budget','date','endDate']){
    const el=$(`#brief-form [name="${field}"]`);
    if(el&&draft[field]!=null)el.value=draft[field];
  }}
  configureResourceSearch();
}
async function showScreen(screen,{message='MAKE SOMETHING.',color='',preserveBrief=false,animate=true}={}){
  if(transitioning)return;
  if(screen!=='profile'&&!profile)screen='profile';
  if(screen==='brief'&&!selected)screen='selection';
  transitioning=true;
  closeProfileMenu();
  const page=$('.page-shell');
  const panel=$('#transition-panel');
  const reduced=!animate||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  page.inert=true;
  try{
    panel.querySelector('span').textContent=message;
    panel.style.background=color;
    if(!reduced){panel.className='transition-panel cover';await wait(700)}
    for(const target of ['profile','selection','brief'])$(`#${target}-screen`).hidden=target!==screen;
    activeScreen=screen;
    if(screen==='profile')prepareProfile();
    if(screen==='brief'&&!preserveBrief)populateBrief();
    updateProfileUI();
    window.scrollTo(0,0);
    if(!reduced){panel.className='transition-panel reveal';await wait(650)}
  }finally{
    panel.className='transition-panel';
    panel.style.background='';
    page.inert=false;
    transitioning=false;
    focusHeading(screen);
  }
}

$('#profile-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(transitioning)return;
  const name=$('#profile-name').value.trim();
  if(!name){
    $('#profile-name-error').textContent='Tell us your name to make an entrance.';
    $('#profile-name').setAttribute('aria-invalid','true');
    $('#profile-name').setCustomValidity('Please enter your name.');
    $('#profile-name').reportValidity();
    return;
  }
  const editing=!!profile;
  profile={name,avatar:formAvatar,createdAt:profile?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  const saved=storage.set('second-act.profile',JSON.stringify(profile));
  $('#app-notice').hidden=saved;
  $('#app-notice').textContent=saved?'':'Your profile is ready for this visit. This browser couldn’t save it for next time.';
  const destination=editing?profileReturnScreen:'selection';
  showScreen(destination,{message:'MAKE YOUR ENTRANCE.',color:'#E52232',preserveBrief:destination==='brief'});
});
$('#profile-name').addEventListener('input',()=>{
  $('#profile-name').setCustomValidity('');
  $('#profile-name').removeAttribute('aria-invalid');
  $('#profile-name-error').textContent='';
});
$('#avatar-change').addEventListener('click',()=>{
  document.querySelector(`input[name="avatar"][value="${formAvatar}"]`).checked=true;
  $('#avatar-dialog').showModal();
});
$('#avatar-close').addEventListener('click',()=>$('#avatar-dialog').close());
$('#avatar-apply').addEventListener('click',()=>{
  const chosen=document.querySelector('input[name="avatar"]:checked');
  if(chosen)setDraftAvatar(chosen.value);
  $('#avatar-dialog').close();
});
$('#edit-profile').addEventListener('click',()=>{
  profileReturnScreen=activeScreen;
  showScreen('profile',{message:'MAKE IT YOU.',color:'#E52232'});
});
$('#profile-cancel').addEventListener('click',()=>{
  if(profile)showScreen(profileReturnScreen,{message:'BACK TO YOUR WORLD.',color:'#E52232',preserveBrief:profileReturnScreen==='brief'});
});

document.querySelectorAll('input[name="discipline"]').forEach(input=>input.addEventListener('change',()=>selectDiscipline(input.value)));
$('#continue-button').addEventListener('click',()=>{if(selected)showScreen('brief')});
$('#back-button').addEventListener('click',()=>showScreen('selection'));
$('.wordmark').addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  if(transitioning)return;
  if(activeScreen==='brief'){
    const values=Object.fromEntries(new FormData($('#brief-form')));
    storage.set(`second-act.brief.${selected}`,JSON.stringify({...values,discipline:selected,savedAt:new Date().toISOString()}));
  }
  if(typeof resetPlanner==='function')resetPlanner();
  resourceRequest?.abort();
  showScreen(profile?'selection':'profile',{animate:false});
});
$('#brief-form').addEventListener('submit',event=>{
  event.preventDefault();
  const values=Object.fromEntries(new FormData(event.currentTarget));
  const saved=storage.set(`second-act.brief.${selected}`,JSON.stringify({...values,discipline:selected,savedAt:new Date().toISOString()}));
  $('#save-status').textContent=saved?'✓ Starting point saved on this device. Come back whenever inspiration strikes.':'Your browser couldn’t save this brief. Keep this page open to retain your changes.';
});
$('#profile-toggle').addEventListener('click',()=>{
  const menu=$('#profile-menu');
  menu.hidden=!menu.hidden;
  $('#profile-toggle').setAttribute('aria-expanded',String(!menu.hidden));
});
$('#logout-profile').addEventListener('click',()=>{
  closeProfileMenu();
  storage.remove('second-act.profile');
  storage.remove('second-act.discipline');
  location.reload();
});
document.addEventListener('click',event=>{if(!event.target.closest('.header-actions'))closeProfileMenu()});
$('#reset-selection').addEventListener('click',()=>{
  if(transitioning)return;
  selected=null;
  document.querySelectorAll('input[name="discipline"]').forEach(input=>input.checked=false);
  document.querySelectorAll('.selection-mark').forEach(mark=>mark.textContent='↗');
  $('.page-shell').classList.remove('has-selection');
  document.documentElement.style.removeProperty('--accent');
  $('#continue-button').disabled=true;
  $('#status-title').textContent='EVERY GREAT THING STARTS SOMEWHERE.';
  $('#status-description').textContent='';
  $('#profile-discipline').textContent='Your next act starts here.';
  closeProfileMenu();
  storage.remove('second-act.discipline');
  if(activeScreen==='brief')showScreen('selection');
});
$('#about-open').addEventListener('click',()=>$('#about-dialog').showModal());
$('#about-close').addEventListener('click',()=>$('#about-dialog').close());
for(const dialog of [$('#about-dialog'),$('#avatar-dialog')])dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeProfileMenu();
  if(document.body.classList.contains('intro-active')||document.body.classList.contains('intro-revealing')||event.ctrlKey||event.metaKey||event.altKey||$('#about-dialog').open||$('#avatar-dialog').open||activeScreen!=='selection'||transitioning||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||document.activeElement.isContentEditable)return;
  const keys=['filmmaker','theatre','photography','fashion'];
  if(/^[1-4]$/.test(event.key)){event.preventDefault();selectDiscipline(keys[Number(event.key)-1])}
  if(event.key==='Enter'&&selected&&!/BUTTON|A/.test(document.activeElement.tagName)){event.preventDefault();showScreen('brief')}
});

// A new visit starts with a deliberate choice; profiles and creative drafts still persist.
storage.remove('second-act.discipline');
const clearInitialChoice=()=>document.querySelectorAll('input[name="discipline"]').forEach(input=>{input.checked=false});
clearInitialChoice();
window.addEventListener('pageshow',event=>{if(!event.persisted&&!selected)clearInitialChoice()});
activeScreen=profile?'selection':'profile';
for(const target of ['profile','selection','brief'])$(`#${target}-screen`).hidden=target!==activeScreen;
prepareProfile();
updateProfileUI();

// Manual live inventory search; the creative agent is connected in planner.js.
const resourcePurposes={
  filmmaker:[['backdrop','Backdrops'],['lighting','Lighting'],['set','Set building'],['capture','Camera equipment'],['support','Stands and supports'],['projection','Projection']],
  theatre:[['backdrop','Backdrops'],['lighting','Lighting'],['set','Set building'],['costume','Costumes and textiles'],['support','Stands and supports'],['projection','Projection']],
  photography:[['backdrop','Backdrops'],['lighting','Lighting'],['reflector','Reflectors'],['capture','Camera equipment'],['support','Stands and supports']],
  fashion:[['costume','Costumes and textiles'],['stitching','Sewing'],['backdrop','Backdrops']]
};
let resourceRequest=null;
function configureResourceSearch(){
  if(resourceRequest)resourceRequest.abort();
  $('#resource-clear-alternative').hidden=true;
  $('#resource-purpose').replaceChildren(...resourcePurposes[selected].map(([value,label])=>{
    const option=document.createElement('option');option.value=value;option.textContent=label;return option;
  }));
  $('#resource-start').value=$('#project-date').value;
  $('#resource-end').value=$('#project-date').value;
  $('#resource-quantity').value='1';
  $('#resource-results').replaceChildren();
  $('#resource-status').textContent='Pick what you need and your dates to explore the shared inventory.';
}
function resourceText(tag,className,text){const el=document.createElement(tag);el.className=className;el.textContent=text;return el;}
function renderResources(result){
  const list=$('#resource-results');list.replaceChildren();
  for(const [index,item] of result.matches.entries()){
    const card=document.createElement('li');card.className='resource-card'+(item.available?'':' resource-unavailable');
    const top=document.createElement('div');top.className='resource-card-top';
    top.append(resourceText('span','resource-index',String(index+1).padStart(2,'0')),resourceText('span','resource-availability',item.available?'AVAILABLE':'UNAVAILABLE'));
    card.append(top,resourceText('h3','resource-name',item.name),resourceText('p','resource-owner',item.owner),resourceText('p','resource-description',item.description));
    const cost=item.totalCost===0?'FREE':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(item.totalCost);
    card.append(resourceText('p','resource-price',cost),resourceText('p','resource-duration',`${item.quantityRequested} ${item.unit}${item.quantityRequested===1?'':'s'} · ${item.days} day${item.days===1?'':'s'}`));
    if(item.requirements.length)card.append(resourceText('p','resource-requires',`Includes: ${item.requirements.map(r=>r.name).join(', ')}`));
    card.append(resourceText('p','resource-stock',item.reason),resourceText('p','resource-details',`${item.dimensions} · ${item.materials.join(', ')}`),resourceText('p','resource-restrictions',item.restrictions),resourceText('p','resource-explanation',item.explanation));
    if(!item.available){
      const alternative=document.createElement('button');alternative.type='button';alternative.className='resource-alternative';alternative.textContent='FIND AVAILABLE ALTERNATIVES ↗';
      alternative.addEventListener('click',()=>searchLiveResources(item.id));card.append(alternative);
    }
    list.append(card);
  }
  const description=result.sourceId?(result.availableCount===1?'available alternative':'available alternatives'):(result.availableCount===1?'available match':'available matches');
  $('#resource-status').textContent=result.matches.length?`${result.availableCount} ${description} found for ${result.start} to ${result.end}. ${result.sourceId?'These resources share the same creative use as the original item.':'Booked items are shown so you can see what is unavailable.'}`:'No resources match these dates, quantity and budget. Try another purpose or adjust your filters.';
}
async function searchLiveResources(sourceId=''){
  if(!$('#resource-search-form').reportValidity())return;
  if(resourceRequest)resourceRequest.abort();
  const controller=new AbortController();resourceRequest=controller;
  const button=$('#resource-search-button');button.disabled=true;button.textContent='CHECKING INVENTORY…';
  const previousResults=$('#resource-results').children.length>0;
  $('#resource-results').setAttribute('aria-busy','true');
  $('#resource-status').textContent=previousResults?'Checking again. Previous results remain below and may use different filters.':'Checking the shared inventory and bookings…';
  $('#resource-clear-alternative').hidden=!sourceId;
  const query=new URLSearchParams({discipline:selected,purpose:$('#resource-purpose').value,start:$('#resource-start').value,end:$('#resource-end').value,quantity:$('#resource-quantity').value,includeUnavailable:sourceId?'false':'true'});
  if($('#project-budget').value!=='')query.set('budget',$('#project-budget').value);
  if(sourceId)query.set('sourceId',sourceId);
  try{
    const response=await fetch(`/api/resources?${query}`,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(35000)])});
    const type=response.headers.get('content-type')||'';
    if(!type.includes('application/json'))throw new Error('Open this website through the running backend to search the inventory.');
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'The inventory could not be checked.');
    if(controller!==resourceRequest)return;
    renderResources(result);
    if(sourceId)$('#resource-status').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }catch(error){
    if(error.name!=='AbortError'&&controller===resourceRequest)$('#resource-status').textContent=(error.name==='TimeoutError'?'The inventory check took too long. Try again in a moment.':error.message==='Failed to fetch'?'The shared inventory could not be reached. Check your connection and try again.':error.message)+(previousResults?' Previous results remain below and have not been refreshed; they may use different filters.':'');
  }finally{
    if(controller===resourceRequest){$('#resource-results').removeAttribute('aria-busy');button.disabled=false;button.textContent='FIND RESOURCES ';const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');button.append(arrow);}
  }
}
$('#resource-search-form').addEventListener('submit',event=>{event.preventDefault();searchLiveResources()});
$('#resource-clear-alternative').addEventListener('click',()=>searchLiveResources());
$('#resource-demo-dates').addEventListener('click',()=>{
  $('#resource-purpose').value='backdrop';$('#resource-start').value='2026-10-25';$('#resource-end').value='2026-10-27';$('#resource-quantity').value='1';searchLiveResources();
});
$('#project-date').addEventListener('change',()=>{
  $('#resource-start').value=$('#project-date').value;
  if(!$('#resource-end').value||$('#resource-end').value<$('#resource-start').value)$('#resource-end').value=$('#resource-start').value;
});
