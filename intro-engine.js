/* Three stage lights follow continuous, eased arcs into the SecondAct mark. */
(()=>{
  'use strict';
  window.createSecondActIntro=(host,{onComplete=()=>{},reducedMotion=false}={})=>{
    const stage=document.createElement('div');
    stage.className='stage-stage';stage.setAttribute('aria-hidden','true');
    stage.innerHTML='<div class="stage-wrap"><div class="stage-cluster"><div class="stage-rig"><div class="stage-light stage-r"></div><div class="stage-light stage-g"></div><div class="stage-light stage-b"></div></div></div></div><div class="stage-wm brand-type">SecondAct</div><div class="stage-curtains"><div class="stage-c stage-cl"></div><div class="stage-c stage-cr"></div></div><div class="stage-val"></div>';
    host.prepend(stage);
    const lights=[
      {element:stage.querySelector('.stage-r'),points:[[-34,-10],[-29,-23],[-17,-12],[-9.5,-5.5]],delay:1600,duration:2900},
      {element:stage.querySelector('.stage-g'),points:[[34,-10],[29,3],[17,-1],[9.5,-5.5]],delay:1680,duration:3200},
      {element:stage.querySelector('.stage-b'),points:[[8,31],[-7,29],[-7,17],[0,11]],delay:1800,duration:3350}
    ];
    let done=false,started=false,timer=null,frame=null,startTime=null,curtainsOpen=false,settled=false;
    const position=(light,x,y,opacity)=>{light.element.style.transform='translate('+x+'vmin,'+y+'vmin)';light.element.style.opacity=String(opacity)};
    const finalPose=()=>lights.forEach(light=>position(light,...light.points[3],1));
    function finish(){if(done)return;done=true;clearTimeout(timer);cancelAnimationFrame(frame);finalPose();onComplete()}
    function tick(timestamp){
      if(done)return;
      if(startTime===null)startTime=timestamp;
      const elapsed=timestamp-startTime;
      for(const light of lights){
        const raw=Math.max(0,Math.min(1,(elapsed-light.delay)/light.duration));
        const t=(1-Math.cos(Math.PI*raw))/2,u=1-t,p=light.points;
        const axis=i=>u*u*u*p[0][i]+3*u*u*t*p[1][i]+3*u*t*t*p[2][i]+t*t*t*p[3][i];
        position(light,axis(0),axis(1),Math.min(1,raw*6));
      }
      if(!curtainsOpen&&elapsed>=2200){curtainsOpen=true;host.dataset.state='curtains-open'}
      if(!settled&&elapsed>=5150){settled=true;host.dataset.state='settled'}
      if(elapsed>=6400){finish();return}
      frame=requestAnimationFrame(tick);
    }
    lights.forEach(light=>position(light,...light.points[0],0));
    return {
      play(){if(done||started)return;started=true;stage.classList.add('is-playing');if(reducedMotion){finalPose();timer=setTimeout(finish,80);return}frame=requestAnimationFrame(tick);timer=setTimeout(finish,6700)},
      skip:finish,
      destroy(){done=true;clearTimeout(timer);cancelAnimationFrame(frame);stage.remove()}
    };
  };
})();
