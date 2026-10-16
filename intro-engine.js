/* Curtain and spotlights adapted from the participant-supplied HTML. */
(()=>{
  'use strict';
  window.createSecondActIntro=(host,{onComplete=()=>{},reducedMotion=false}={})=>{
    const stage=document.createElement('div');
    stage.className='stage-stage';stage.setAttribute('aria-hidden','true');
    stage.innerHTML='<div class="stage-floor"></div><div class="stage-wrap"><div class="stage-cluster"><div class="stage-rig"><div class="stage-light stage-r"></div><div class="stage-light stage-g"></div><div class="stage-light stage-b"></div></div></div><div class="stage-ring"></div></div><div class="stage-wm">second act</div><div class="stage-curtains"><div class="stage-c stage-cl"></div><div class="stage-c stage-cr"></div></div><div class="stage-val"></div><div class="stage-flash"></div>';
    host.prepend(stage);
    let done=false,timer=null,frame=null;
    const finish=()=>{if(done)return;done=true;clearTimeout(timer);onComplete()};
    const ended=event=>{
      if(event.animationName==='stage-ol')host.dataset.state='curtains-open';
      if(event.animationName==='stage-spin'){clearTimeout(timer);host.dataset.state='settled';timer=setTimeout(finish,750)}
    };
    stage.addEventListener('animationend',ended);
    return {
      play(){if(done||frame!==null)return;frame=requestAnimationFrame(()=>{stage.classList.add('is-playing');timer=setTimeout(finish,reducedMotion?80:7600)})},
      skip:finish,
      destroy(){done=true;clearTimeout(timer);cancelAnimationFrame(frame);stage.removeEventListener('animationend',ended);stage.remove()}
    };
  };
})();
