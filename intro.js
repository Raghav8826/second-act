/* Play the curtains, crash zoom through the RGB mark, then reveal profile/menu. */
(()=>{
  'use strict';
  const host=document.getElementById('opening-intro'),page=document.querySelector('.page-shell'),skip=document.getElementById('intro-skip');
  if(!host||!page)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),overflow=document.documentElement.style.overflow;
  let animation,complete=false,timer;
  document.documentElement.style.overflow='hidden';
  function cleanup(){
    clearTimeout(timer);window.removeEventListener('keydown',onKey);motion.removeEventListener('change',onMotionChange);animation?.destroy();host.remove();
    document.body.classList.remove('intro-active','intro-revealing');document.documentElement.style.overflow=overflow;
    page.inert=false;page.removeAttribute('aria-hidden');
    const heading=document.querySelector('main > section:not([hidden]) h1');
    if(heading){window.getSelection()?.removeAllRanges();heading.setAttribute('tabindex','-1');heading.classList.add('screen-focus-target');heading.focus({preventScroll:true});heading.addEventListener('blur',()=>{heading.removeAttribute('tabindex');heading.classList.remove('screen-focus-target')},{once:true})}
  }
  function reveal(immediate=false){
    if(complete)return;complete=true;skip.hidden=true;
    if(immediate||motion.matches){cleanup();return}
    const mark=host.querySelector('.stage-wrap'),stage=host.querySelector('.stage-stage');
    if(!mark||!stage){cleanup();return}
    const bounds=mark.getBoundingClientRect(),origin=host.getBoundingClientRect();
    stage.style.setProperty('--zoom-x',(bounds.left+bounds.width/2-origin.left)+'px');
    stage.style.setProperty('--zoom-y',(bounds.top+bounds.height/2-origin.top)+'px');
    host.setAttribute('aria-hidden','true');host.dataset.state='zooming';
    document.body.classList.remove('intro-active');document.body.classList.add('intro-revealing');
    host.classList.add('is-zooming');timer=setTimeout(cleanup,1080);
  }
  function onKey(event){if(event.key==='Escape'){event.preventDefault();if(complete)cleanup();else reveal(true)}}
  function onMotionChange(event){if(event.matches){if(complete)cleanup();else reveal(true)}}
  try{
    animation=window.createSecondActIntro(host,{onComplete:()=>reveal(),reducedMotion:motion.matches});
    skip.addEventListener('click',()=>reveal(true));window.addEventListener('keydown',onKey);motion.addEventListener('change',onMotionChange);host.dataset.state='playing';skip.focus({preventScroll:true});animation.play();
  }catch(error){cleanup();console.error('The opening animation could not play.')}
})();
