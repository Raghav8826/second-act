/* Smooth caret adapted from the user-supplied Skiper UI SmoothInput example.
   Native DOM adaptation: no React, DialKit or animation-library dependency. */
(()=>{
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const forced=matchMedia('(forced-colors: active)');
  const caret=document.createElement('span');caret.className='smooth-caret';caret.hidden=true;caret.setAttribute('aria-hidden','true');
  const mirror=document.createElement('div');mirror.className='caret-measure';mirror.setAttribute('aria-hidden','true');
  const marker=document.createElement('span');marker.textContent='\u200b';
  document.body.append(caret,mirror);
  let active=null,composing=false,frame=0,updateFrame=0,lastTime=0,lastActivity=0;
  let x=0,y=0,vx=0,vy=0,targetX=0,targetY=0,placed=false;
  const numericValidators=[];

  // Number controls need a text selection API to place a custom caret. Preserve
  // their bounds, step validation, numeric keyboard and spinbutton semantics.
  for(const input of document.querySelectorAll('input[type="number"]')){
    const min=input.min===''?-Infinity:Number(input.min),max=input.max===''?Infinity:Number(input.max);
    const step=input.step==='any'?null:Number(input.step||1),base=Number.isFinite(min)?min:0;
    input.type='text';input.inputMode=step===1?'numeric':'decimal';input.dataset.numericInput='true';input.setAttribute('role','spinbutton');
    if(Number.isFinite(min))input.setAttribute('aria-valuemin',String(min));
    if(Number.isFinite(max))input.setAttribute('aria-valuemax',String(max));
    function validate(){
      const raw=input.value.trim(),value=Number(raw);let error='';
      if(raw&&!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw))error='Enter a number.';
      else if(raw&&!Number.isFinite(value))error='Enter a finite number.';
      else if(raw&&value<min)error=`Enter ${min} or more.`;
      else if(raw&&value>max)error=`Enter ${max} or less.`;
      else if(raw&&step&&Math.abs((value-base)/step-Math.round((value-base)/step))>1e-8)error=step===1?'Enter a whole number.':`Use increments of ${step}.`;
      input.setCustomValidity(error);
      if(raw&&!error)input.setAttribute('aria-valuenow',String(value));else input.removeAttribute('aria-valuenow');
    }
    input.addEventListener('input',validate);input.addEventListener('change',validate);input.addEventListener('blur',validate);
    input.addEventListener('focus',validate);numericValidators.push(validate);
    input.form?.addEventListener('reset',()=>requestAnimationFrame(validate));
    input.addEventListener('keydown',event=>{
      if(!['ArrowUp','ArrowDown'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return;
      event.preventDefault();const current=input.value.trim()===''?0:Number(input.value);
      const value=Math.min(max,Math.max(min,(Number.isFinite(current)?current:base)+(event.key==='ArrowUp'?1:-1)*(step||1)));
      input.value=String(Math.round(value*1e8)/1e8);input.dispatchEvent(new Event('input',{bubbles:true}));
      input.setSelectionRange(input.value.length,input.value.length);
    });
    validate();
  }
  // Also cover values filled by the demo button or restored from a saved brief.
  document.addEventListener('click',()=>numericValidators.forEach(validate=>validate()),true);
  document.addEventListener('keydown',event=>{if(event.key==='Enter')numericValidators.forEach(validate=>validate())},true);

  function eligible(element){
    return element instanceof HTMLTextAreaElement||(element instanceof HTMLInputElement&&['text','search','email','url','tel','password'].includes(element.type)&&element.selectionStart!==null);
  }
  function hide(){caret.hidden=true;if(active)active.classList.remove('smooth-input-active');placed=false;cancelAnimationFrame(frame);frame=0}
  function tick(time){
    frame=0;
    if(!active||caret.hidden)return;
    const dt=Math.min((time-lastTime)/1000||1/60,.032);lastTime=time;
    if(reduced.matches){x=targetX;y=targetY;vx=vy=0}
    else{
      const steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
      for(let i=0;i<steps;i++){
        vx+=((targetX-x)*500-vx*30)/.5*h;vy+=((targetY-y)*500-vy*30)/.5*h;
        x+=vx*h;y+=vy*h;
      }
    }
    caret.style.transform=`translate3d(${x}px,${y}px,0)`;
    if(Math.abs(x-targetX)+Math.abs(y-targetY)+Math.abs(vx)+Math.abs(vy)>.05)frame=requestAnimationFrame(tick);
    else{caret.style.transform=`translate3d(${targetX}px,${targetY}px,0)`;x=targetX;y=targetY;vx=vy=0}
  }
  function update(){
    updateFrame=0;
    if(!active||document.activeElement!==active||active.disabled||active.readOnly||forced.matches||composing){hide();return}
    const start=active.selectionStart,end=active.selectionEnd;
    if(start===null||start!==end){caret.hidden=true;return}
    const style=getComputedStyle(active),rect=active.getBoundingClientRect();
    if(!rect.width||!rect.height){hide();return}
    const multiline=active instanceof HTMLTextAreaElement;
    const before=active.type==='password'?'•'.repeat(start):active.value.slice(0,start);
    const after=active.type==='password'?'•'.repeat(active.value.length-start):active.value.slice(start);
    for(const property of ['font','fontSize','fontFamily','fontWeight','fontStyle','fontStretch','fontFeatureSettings','fontVariationSettings','letterSpacing','wordSpacing','textTransform','textIndent','lineHeight','tabSize','paddingTop','paddingRight','paddingBottom','paddingLeft','direction'])mirror.style[property]=style[property];
    Object.assign(mirror.style,{width:multiline?`${active.clientWidth}px`:'max-content',whiteSpace:multiline?'pre-wrap':'pre',overflowWrap:multiline?'break-word':'normal',wordBreak:style.wordBreak});
    mirror.replaceChildren(document.createTextNode(before),marker,document.createTextNode(after||' '));
    const fontSize=parseFloat(style.fontSize),lineHeight=parseFloat(style.lineHeight)||fontSize*1.4,height=fontSize*.95;
    const paddingLeft=parseFloat(style.paddingLeft)||0,paddingRight=parseFloat(style.paddingRight)||0;
    // A transparent native caret does not consistently trigger browser scrolling
    // after restoring/filling long values. Keep its measured position in view.
    if(!multiline){
      const absolute=marker.offsetLeft,maxScroll=Math.max(0,active.scrollWidth-active.clientWidth);
      if(absolute>active.scrollLeft+active.clientWidth-paddingRight)active.scrollLeft=Math.min(maxScroll,absolute-active.clientWidth+paddingRight+1);
      else if(absolute<active.scrollLeft+paddingLeft)active.scrollLeft=Math.max(0,absolute-paddingLeft);
    }else{
      const paddingTop=parseFloat(style.paddingTop)||0,paddingBottom=parseFloat(style.paddingBottom)||0;
      const maxScroll=Math.max(0,active.scrollHeight-active.clientHeight);
      if(marker.offsetTop+lineHeight>active.scrollTop+active.clientHeight-paddingBottom)active.scrollTop=Math.min(maxScroll,marker.offsetTop+lineHeight-active.clientHeight+paddingBottom);
      else if(marker.offsetTop<active.scrollTop+paddingTop)active.scrollTop=Math.max(0,marker.offsetTop-paddingTop);
    }
    const left=marker.offsetLeft+active.clientLeft-active.scrollLeft;
    const top=multiline?marker.offsetTop+active.clientTop-active.scrollTop+(lineHeight-height)/2:(rect.height-height)/2;
    if(left<paddingLeft-2||left>active.clientWidth-paddingRight+2||top<active.clientTop-1||top+height>active.clientHeight+active.clientTop+1||rect.bottom<0||rect.top>innerHeight){caret.hidden=true;return}
    targetX=rect.left+left;targetY=rect.top+top;
    active.classList.add('smooth-input-active');caret.style.height=`${height}px`;caret.hidden=false;
    if(!placed||reduced.matches){x=targetX;y=targetY;vx=vy=0;placed=true}
    caret.style.transform=`translate3d(${x}px,${y}px,0)`;
    if(!frame){lastTime=performance.now();frame=requestAnimationFrame(tick)}
  }
  function schedule(activity=false){
    if(activity){lastActivity=performance.now();caret.classList.remove('is-idle')}
    if(!updateFrame)updateFrame=requestAnimationFrame(update);
  }
  document.addEventListener('focusin',event=>{
    hide();active=eligible(event.target)?event.target:null;composing=false;
    if(active){observer.observe(active);schedule(true)}
  });
  document.addEventListener('focusout',()=>{observer.disconnect();hide();active=null});
  for(const name of ['input','keyup','pointerup','select'])document.addEventListener(name,event=>{if(event.target===active)schedule(true)});
  document.addEventListener('selectionchange',()=>{if(active)schedule(true)});
  document.addEventListener('compositionstart',event=>{if(event.target===active){composing=true;hide()}});
  document.addEventListener('compositionend',event=>{if(event.target===active){composing=false;schedule(true)}});
  document.addEventListener('scroll',()=>{if(active)schedule()},true);
  addEventListener('resize',()=>{if(active)schedule()});
  const observer=new ResizeObserver(()=>{if(active)schedule()});
  document.fonts?.addEventListener('loadingdone',()=>{if(active)schedule()});
  document.fonts?.ready.then(()=>{if(active)schedule()});
  reduced.addEventListener('change',()=>{if(active)schedule()});
  forced.addEventListener('change',()=>{if(active)schedule()});
  setInterval(()=>{if(active&&!caret.hidden&&performance.now()-lastActivity>800)caret.classList.add('is-idle')},400);
  if(eligible(document.activeElement)){active=document.activeElement;observer.observe(active);schedule(true)}
})();

/* Move only the two reel faces; the film-camera body stays still. */
(()=>{
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const timers=new WeakMap();
  const cards=new Map();
  for(const input of document.querySelectorAll('input[name="discipline"]')){
    const card=input.closest('label');card.dataset.world=input.value;cards.set(input.value,card);
    input.addEventListener('click',()=>play(input.value));
  }
  const film=cards.get('filmmaker'),image=film?.querySelector('.artwork>img');
  if(image){
    const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
    overlay.setAttribute('viewBox','0 0 1000 1000');overlay.setAttribute('class','reel-overlay');overlay.setAttribute('aria-hidden','true');
    const reel=(id,cx,cy,rx,ry,angle,reverse)=>`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${angle} ${cx} ${cy})"/></clipPath></defs><g clip-path="url(#${id})"><g transform="translate(${cx} ${cy}) rotate(${angle}) scale(${rx/ry} 1)"><g class="reel-turn${reverse?' reel-turn-reverse':''}"><image width="1000" height="1000" transform="scale(${ry/rx} 1) rotate(${-angle}) translate(${-cx} ${-cy})"/></g></g></g>`;
    overlay.innerHTML=reel('film-reel-front',466,214,155,190,-13,false)+reel('film-reel-rear',801,275,124,167,-14,true);
    overlay.querySelectorAll('image').forEach(layer=>layer.setAttribute('href',image.getAttribute('src')));
    film.querySelector('.artwork').append(overlay);
  }
  function play(value){
    const card=cards.get(value);if(!card||reduced.matches)return;
    clearTimeout(timers.get(card));card.classList.remove('is-animating');
    void card.offsetWidth;card.classList.add('is-animating');
    timers.set(card,setTimeout(()=>card.classList.remove('is-animating'),1300));
  }
  window.playSelectionMotion=play;
  reduced.addEventListener('change',()=>{if(reduced.matches)for(const card of cards.values()){clearTimeout(timers.get(card));card.classList.remove('is-animating')}});
})();
