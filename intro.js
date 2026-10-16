/* Hold the updated lips in the centre until a click, tap or keyboard activation. */
(()=>{
  'use strict';
  const host=document.getElementById('opening-intro');
  const page=document.querySelector('.page-shell');
  const startButton=document.getElementById('intro-start');
  const skipButton=document.getElementById('intro-skip');
  if(!host||!page)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialOverflow=document.documentElement.style.overflow;
  const theme=document.querySelector('meta[name="theme-color"]');
  let animation=null,completed=false,started=false,cleanupTimer=null;

  function onKey(event){
    if(event.key==='Escape'){
      event.preventDefault();
      if(animation)animation.skip();
      else reveal();
    }
  }

  function cleanup(){
    clearTimeout(cleanupTimer);
    window.removeEventListener('keydown',onKey);
    if(animation){animation.destroy();animation=null;}
    host.remove();
    document.body.classList.remove('intro-active','intro-revealing');
    document.documentElement.style.overflow=initialOverflow;
    if(theme)theme.content='#000000';
    const heading=document.querySelector('main > section:not([hidden]) h1');
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
    heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});
  }

  function reveal(){
    if(completed)return;
    completed=true;
    host.dataset.state='revealing';
    startButton.hidden=true;
    skipButton.hidden=true;
    host.style.background='#E52232';
    if(theme)theme.content='#E52232';
    page.inert=false;
    page.removeAttribute('aria-hidden');
    document.body.classList.remove('intro-active');
    if(motion.matches){cleanup();return;}
    host.setAttribute('aria-hidden','true');
    document.body.classList.add('intro-revealing');
    requestAnimationFrame(()=>requestAnimationFrame(()=>host.classList.add('is-leaving')));
    cleanupTimer=setTimeout(cleanup,780);
  }

  function start(){
    if(started||completed)return;
    started=true;
    host.dataset.state='playing';
    startButton.disabled=true;
    startButton.setAttribute('aria-hidden','true');
    startButton.classList.add('is-started');
    skipButton.focus({preventScroll:true});
    animation.play();
  }

  if(typeof window.createSecondActIntro!=='function'){
    page.inert=false;
    page.removeAttribute('aria-hidden');
    cleanup();
    return;
  }
  try{
    animation=window.createSecondActIntro(host,{onComplete:reveal,manual:true,skippable:false,reducedMotion:motion.matches});
    host.dataset.state='waiting';
    const canvas=host.querySelector('canvas');
    if(canvas)canvas.setAttribute('aria-hidden','true');
    startButton.addEventListener('click',start);
    skipButton.addEventListener('click',()=>animation.skip());
    window.addEventListener('keydown',onKey);
    startButton.focus({preventScroll:true});
  }catch(error){
    console.error('The opening animation could not play.',error);
    page.inert=false;
    page.removeAttribute('aria-hidden');
    cleanup();
  }
})();
