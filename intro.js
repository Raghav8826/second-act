/* Play the supplied curtain opening, then reveal the existing profile/menu flow. */
(()=>{
  'use strict';
  const host=document.getElementById('opening-intro'),page=document.querySelector('.page-shell'),skip=document.getElementById('intro-skip');
  if(!host||!page)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),overflow=document.documentElement.style.overflow;
  let animation,complete=false,timer;
  document.documentElement.style.overflow='hidden';
  function cleanup(){
    clearTimeout(timer);window.removeEventListener('keydown',onKey);animation?.destroy();host.remove();
    document.body.classList.remove('intro-active','intro-revealing');document.documentElement.style.overflow=overflow;
    const heading=document.querySelector('main > section:not([hidden]) h1');
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true})}
  }
  function reveal(){
    if(complete)return;complete=true;skip.hidden=true;page.inert=false;page.removeAttribute('aria-hidden');document.body.classList.remove('intro-active');
    if(motion.matches){cleanup();return}
    host.setAttribute('aria-hidden','true');host.dataset.state='revealing';document.body.classList.add('intro-revealing');
    requestAnimationFrame(()=>requestAnimationFrame(()=>host.classList.add('is-leaving')));timer=setTimeout(cleanup,780);
  }
  function onKey(event){if(event.key==='Escape'){event.preventDefault();reveal()}}
  try{
    animation=window.createSecondActIntro(host,{onComplete:reveal,reducedMotion:motion.matches});
    skip.addEventListener('click',reveal);window.addEventListener('keydown',onKey);host.dataset.state='playing';skip.focus({preventScroll:true});animation.play();
  }catch(error){page.inert=false;page.removeAttribute('aria-hidden');cleanup();console.error('The opening animation could not play.')}
})();
