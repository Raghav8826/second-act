/* Independent searching spotlights settle smoothly into the SecondAct mark. */
(()=>{
  'use strict';
  window.createSecondActIntro=(host,{onComplete=()=>{},reducedMotion=false}={})=>{
    const stage=document.createElement('div');
    stage.className='stage-stage';stage.setAttribute('aria-hidden','true');
    stage.innerHTML='<div class="stage-wrap"><div class="stage-cluster"><div class="stage-rig"><div class="stage-light stage-r"></div><div class="stage-light stage-g"></div><div class="stage-light stage-b"></div></div></div></div><div class="stage-wm brand-type">SecondAct</div><div class="stage-curtains"><div class="stage-c stage-cl"></div><div class="stage-c stage-cr"></div></div><div class="stage-val"></div>';
    host.prepend(stage);
    const jitter=([x,y])=>[x+(Math.random()-.5)*7,y+(Math.random()-.5)*7];
    const lights=[
      {element:stage.querySelector('.stage-r'),points:[[-34,-10],[-9,-25],[29,7],[-23,21],[18,-19]].map(jitter),target:[-9.5,-5.5],delay:1500,wander:2900,align:1100},
      {element:stage.querySelector('.stage-g'),points:[[34,-10],[23,22],[-28,-3],[8,-26],[-23,13]].map(jitter),target:[9.5,-5.5],delay:1620,wander:3000,align:1000},
      {element:stage.querySelector('.stage-b'),points:[[8,29],[-29,10],[12,-22],[29,14],[-10,24]].map(jitter),target:[0,11],delay:1740,wander:3100,align:1000}
    ];
    const settleAt=Math.max(...lights.map(light=>light.delay+light.wander+light.align));
    const finishAt=settleAt+1050;
    stage.style.setProperty('--spotlight-title-delay',(settleAt/1000)+'s');
    // Catmull–Rom keeps the wandering paths smooth through random waypoints.
    const wanderPoint=(light,progress)=>{
      const points=light.points,span=points.length-1,u=Math.max(0,Math.min(1,progress))*span;
      const index=Math.min(span-1,Math.floor(u)),t=u-index,t2=t*t,t3=t2*t;
      const a=points[Math.max(0,index-1)],b=points[index],c=points[index+1],d=points[Math.min(span,index+2)];
      return [0,1].map(axis=>.5*((2*b[axis])+(-a[axis]+c[axis])*t+(2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*t2+(-a[axis]+3*b[axis]-3*c[axis]+d[axis])*t3));
    };
    // Match the search velocity, then ease to rest at the final logo position.
    const alignPoint=(light,progress)=>{
      const t=Math.max(0,Math.min(1,progress)),t2=t*t,t3=t2*t;
      const last=light.points.at(-1),previous=light.points.at(-2),segment=light.wander/(light.points.length-1);
      return [0,1].map(axis=>(2*t3-3*t2+1)*last[axis]+(t3-2*t2+t)*(last[axis]-previous[axis])*.5*light.align/segment+(-2*t3+3*t2)*light.target[axis]);
    };
    let done=false,started=false,timer=null,frame=null,startTime=null,curtainsOpen=false,settled=false;
    const position=(light,x,y,opacity,softness=0)=>{light.element.style.transform='translate('+x+'vmin,'+y+'vmin)';light.element.style.opacity=String(opacity);light.element.style.filter='blur('+softness+'vmin)'};
    const finalPose=()=>lights.forEach(light=>position(light,...light.target,1));
    function finish(){if(done)return;done=true;clearTimeout(timer);cancelAnimationFrame(frame);finalPose();onComplete()}
    function tick(timestamp){
      if(done)return;
      if(startTime===null)startTime=timestamp;
      const elapsed=timestamp-startTime;
      for(const light of lights){
        const age=elapsed-light.delay,alignment=Math.max(0,Math.min(1,(age-light.wander)/light.align));
        const point=age<light.wander?wanderPoint(light,age/light.wander):alignPoint(light,alignment);
        position(light,...point,Math.max(0,Math.min(1,age/240)),.25*(1-alignment));
      }
      if(!curtainsOpen&&elapsed>=2200){curtainsOpen=true;host.dataset.state='curtains-open'}
      if(!settled&&elapsed>=settleAt){settled=true;host.dataset.state='settled'}
      if(elapsed>=finishAt){finish();return}
      frame=requestAnimationFrame(tick);
    }
    lights.forEach(light=>position(light,...light.points[0],0));
    return {
      play(){if(done||started)return;started=true;stage.classList.add('is-playing');if(reducedMotion){finalPose();timer=setTimeout(finish,80);return}frame=requestAnimationFrame(tick);timer=setTimeout(finish,finishAt+300)},
      skip:finish,
      destroy(){done=true;clearTimeout(timer);cancelAnimationFrame(frame);stage.remove()}
    };
  };
})();
