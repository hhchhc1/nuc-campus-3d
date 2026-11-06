/* ============================================================
 * 角色模型 / 动画 / 输入 / 物理 / 第三人称相机
 * ============================================================ */

function mat6(color,rough){ return new T.MeshStandardMaterial({color:color,roughness:rough===undefined?0.85:rough}); }
function meshBox(w,h,d,x,y,z,m,parent){
  var o=new T.Mesh(new T.BoxGeometry(w,h,d),m);
  o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true;
  parent.add(o); return o;
}
function meshSphere(r,x,y,z,m,parent,seg){
  var o=new T.Mesh(new T.SphereGeometry(r,seg||12,Math.max(8,(seg||12)/2)),m);
  o.position.set(x,y,z); o.castShadow=true; parent.add(o); return o;
}
function meshCyl(rt,rb,h,x,y,z,m,parent,seg){
  var o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg||10),m);
  o.position.set(x,y,z); o.castShadow=true; parent.add(o); return o;
}

/* ---------------- 精致小人 ---------------- */
function createCharacter(o){
  o=o||{};
  var shirt=mat6(o.shirt||0x3b6ea8), shirt2=mat6(o.shirt2||0xf0efe6),
      pants=mat6(o.pants||0x33404d), shoe=mat6(0x2a2f33,0.7),
      skin=mat6(o.skin||0xf2cba6), hair=mat6(o.hair||0x2b221d),
      dark=mat6(0x1d2422), gold=mat6(0xd4b062,0.4),
      bag=mat6(o.bag||0x9c5b3c);
  var root=new T.Group(); root.name='character';
  var sc=o.scale||1; root.scale.setScalar(sc);

  var shadow=new T.Mesh(new T.CircleGeometry(0.42,20),
    new T.MeshBasicMaterial({color:0x0b1a12,transparent:true,opacity:0.32,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=0.03; root.add(shadow);

  var body=new T.Group(); root.add(body);
  /* 躯干 */
  meshBox(0.62,0.80,0.34,0,1.32,0,shirt,body);
  meshBox(0.64,0.16,0.36,0,1.66,0,shirt2,body);          /* 领口 */
  meshBox(0.10,0.80,0.36,0,1.32,0.005,shirt2,body);      /* 门襟 */
  meshSphere(0.055,0.20,1.48,0.19,gold,body,8);          /* 校徽 */
  meshBox(0.60,0.10,0.36,0,0.95,0,pants,body);
  /* 背包 */
  meshBox(0.46,0.52,0.20,0,1.32,-0.28,bag,body);
  meshBox(0.48,0.10,0.22,0,1.55,-0.29,dark,body);
  for(var bs=-1;bs<=1;bs+=2) meshBox(0.075,0.52,0.10,bs*0.20,1.30,-0.18,dark,body);

  /* 头 */
  var head=new T.Group(); head.position.set(0,1.88,0); body.add(head);
  meshSphere(0.225,0,0,0,skin,head,14);
  var cap=new T.Mesh(new T.SphereGeometry(0.232,14,10,0,Math.PI*2,0,Math.PI*0.58),hair);
  cap.position.y=0.012; cap.castShadow=true; head.add(cap);
  meshBox(0.30,0.055,0.16,0,0.09,0.19,hair,head);        /* 刘海 */
  for(var es=-1;es<=1;es+=2){
    meshSphere(0.026,es*0.085,0.015,0.205,dark,head,8);  /* 眼睛 */
    meshSphere(0.045,es*0.225,0.0,0,skin,head,8);        /* 耳朵 */
  }
  meshBox(0.085,0.018,0.02,0,-0.10,0.212,mat6(0xb0705c),head);

  /* 手臂：肩 → 上臂 → 前臂 → 手 */
  function arm(side){
    var sh=new T.Group(); sh.position.set(side*0.38,1.62,0); body.add(sh);
    meshBox(0.17,0.46,0.18,0,-0.23,0,shirt,sh);
    meshBox(0.175,0.09,0.185,0,-0.46,0,shirt2,sh);
    meshBox(0.15,0.42,0.16,0,-0.68,0,skin,sh);
    meshSphere(0.095,0,-0.92,0,skin,sh,10);
    return sh;
  }
  var armL=arm(-1),armR=arm(1);
  /* 腿：髋 → 大腿 → 小腿 → 鞋 */
  function leg(side){
    var hp=new T.Group(); hp.position.set(side*0.17,0.95,0); body.add(hp);
    meshBox(0.215,0.48,0.22,0,-0.24,0,pants,hp);
    meshBox(0.19,0.46,0.20,0,-0.70,0,pants,hp);
    meshBox(0.24,0.13,0.36,0,-0.95,0.055,shoe,hp);
    meshBox(0.25,0.04,0.37,0,-1.01,0.055,shirt2,hp);
    return hp;
  }
  var legL=leg(-1),legR=leg(1);

  var phase=0,lastMode='';
  function animate(mode,dt,speed){
    var rate=(mode==='run'?11:mode==='walk'?7.5:mode==='fly'?3.2:1.6);
    phase+=dt*rate*(speed||1);
    var sw=Math.sin(phase), amp=mode==='run'?0.88:mode==='walk'?0.58:0.06;
    legL.rotation.x= sw*amp; legR.rotation.x=-sw*amp;
    armL.rotation.x=-sw*amp*0.78; armR.rotation.x= sw*amp*0.78;
    armL.rotation.z=0; armR.rotation.z=0;
    body.position.y=Math.abs(Math.sin(phase))*(mode==='run'?0.075:0.035);
    body.rotation.x=mode==='run'?0.13:(mode==='fly'?-0.30:0.015);
    legL.rotation.z=0; legR.rotation.z=0;
    head.rotation.y=Math.sin(phase*0.35)*0.09;
    if(mode==='jump'){
      legL.rotation.x=-0.45; legR.rotation.x=-0.20;
      armL.rotation.x=-0.95; armR.rotation.x=-0.95;
      body.position.y=0;
    }
    if(mode==='fly'){
      var f=Math.sin(phase*0.8)*0.12;
      armL.rotation.z=-1.18; armR.rotation.z=1.18;
      armL.rotation.x=-0.35+f; armR.rotation.x=-0.35-f;
      legL.rotation.x=0.24; legR.rotation.x=0.24;
      legL.rotation.z=-0.06; legR.rotation.z=0.06;
      body.position.y=Math.sin(phase*0.9)*0.09;
    }
    if(mode==='idle'){
      body.scale.y=1+Math.sin(phase)*0.012;
      armL.rotation.x=0.05; armR.rotation.x=0.05;
    }else body.scale.y=1;
    lastMode=mode;
  }
  return {root:root,body:body,shadow:shadow,animate:animate,
          get mode(){return lastMode;}};
}

/* ---------------- 输入 ---------------- */
function initControls(){
  var cv=$('cv');
  window.addEventListener('keydown',function(e){
    var k=e.code;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].indexOf(k)>=0) e.preventDefault();
    keys[k]=true;
    if(k==='KeyF'&&!e.repeat) toggleFly();
    if(k==='KeyR'&&!e.repeat) teleport(1);
    if(k==='KeyM'&&!e.repeat) toggleMap();
    if(k==='KeyH'&&!e.repeat) showHelp();
    if(k==='Escape') $('modal').classList.add('hidden');
    if(/^Digit[1-7]$/.test(k)&&!e.repeat) teleport(parseInt(k.slice(5),10)-1);
  });
  window.addEventListener('keyup',function(e){ keys[e.code]=false; });
  window.addEventListener('blur',function(){ keys={}; mouse.down=false; });

  cv.addEventListener('contextmenu',function(e){ e.preventDefault(); });
  cv.addEventListener('mousedown',function(e){ mouse.down=true; mouse.btn=e.button; mouse.x=e.clientX; mouse.y=e.clientY; });
  window.addEventListener('mouseup',function(){ mouse.down=false; });
  window.addEventListener('mousemove',function(e){
    if(!mouse.down||!started) return;
    var dx=e.clientX-mouse.x,dy=e.clientY-mouse.y;
    mouse.x=e.clientX; mouse.y=e.clientY;
    cam.yaw-=dx*0.0042;
    cam.pitch=clamp(cam.pitch+dy*0.0032,-0.18,1.22);
  });
  cv.addEventListener('wheel',function(e){
    e.preventDefault();
    cam.dist=clamp(cam.dist*(e.deltaY>0?1.1:0.9),5,70);
  },{passive:false});
  /* 触摸：转视角 */
  var tid=null,tx=0,ty=0;
  cv.addEventListener('touchstart',function(e){
    if(e.touches.length===1&&e.touches[0].clientX>window.innerWidth*0.35){
      tid=e.touches[0].identifier; tx=e.touches[0].clientX; ty=e.touches[0].clientY;
    }
  },{passive:true});
  cv.addEventListener('touchmove',function(e){
    for(var i=0;i<e.touches.length;i++){
      var t=e.touches[i];
      if(t.identifier===tid){
        cam.yaw-=(t.clientX-tx)*0.006;
        cam.pitch=clamp(cam.pitch+(t.clientY-ty)*0.004,-0.18,1.22);
        tx=t.clientX; ty=t.clientY;
      }
    }
  },{passive:true});
  cv.addEventListener('touchend',function(){ tid=null; },{passive:true});

  /* 虚拟摇杆 */
  var stick=$('stick'),nub=$('stickNub'),sid=null;
  function stickMove(e){
    if(sid===null) return;
    for(var i=0;i<e.touches.length;i++){
      var t=e.touches[i]; if(t.identifier!==sid) continue;
      var r=stick.getBoundingClientRect();
      var dx=t.clientX-(r.left+r.width/2),dy=t.clientY-(r.top+r.height/2);
      var len=Math.hypot(dx,dy),max=42;
      if(len>max){ dx=dx/len*max; dy=dy/len*max; }
      nub.style.transform='translate('+dx+'px,'+dy+'px)';
      touch.dx=dx/max; touch.dy=dy/max; touch.active=true;
    }
  }
  stick.addEventListener('touchstart',function(e){
    sid=e.touches[0].identifier; touch.active=true; e.preventDefault();
  },{passive:false});
  window.addEventListener('touchmove',stickMove,{passive:true});
  window.addEventListener('touchend',function(e){
    for(var i=0;i<e.changedTouches.length;i++) if(e.changedTouches[i].identifier===sid){
      sid=null; touch.active=false; touch.dx=0; touch.dy=0; nub.style.transform='translate(0,0)';
    }
  });
  var bindHold=function(id,key){
    var el=$(id);
    el.addEventListener('touchstart',function(e){ keys[key]=true; e.preventDefault(); },{passive:false});
    el.addEventListener('touchend',function(e){ keys[key]=false; e.preventDefault(); },{passive:false});
  };
  bindHold('tJump','Space'); bindHold('tRun','ShiftLeft');
  $('tFly').addEventListener('touchstart',function(e){ toggleFly(); e.preventDefault(); },{passive:false});
}

/* ---------------- 模式 / 传送 ---------------- */
function toggleFly(){
  player.fly=!player.fly;
  player.vy=0;
  if(!player.fly&&player.pos.y>12){ toast('正在降落…'); }
  $('modeTag').classList.toggle('fly',player.fly);
  $('modeTag').querySelector('span').textContent=player.fly?'飞行模式':'步行模式';
  $('cross').classList.toggle('show',player.fly);
  $('btnFly').classList.toggle('on',player.fly);
  toast(player.fly?'飞行模式：Space 上升 / C 下降':'步行模式');
}
function teleport(i){
  var s=spawns[i]; if(!s) return;
  player.pos.set(s.pos[0],player.fly?Math.max(player.pos.y,18):groundHeight(s.pos[0],s.pos[2]),s.pos[2]);
  player.vel.set(0,0,0); player.vy=0;
  cam.smooth.set(player.pos.x,player.pos.y+1.5,player.pos.z);
  toast('已传送到 · '+s.name);
  updateQuick();
}
function toggleMap(){
  mapVisible=!mapVisible;
  $('mapWrap').style.display=mapVisible?'':'none';
  $('btnMap').classList.toggle('on',!mapVisible);
}
function toggleFlyFromBtn(){ toggleFly(); }

/* ---------------- 物理与相机 ---------------- */
function collides(x,z,r){
  r=r||0.55;
  for(var i=0;i<colliders.length;i++){
    var c=colliders[i];
    if(x>c.x1-r&&x<c.x2+r&&z>c.z1-r&&z<c.z2+r) return true;
  }
  return false;
}
function updatePlayer(dt){
  /* 输入方向（基于相机朝向） */
  var fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  var str=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  if(touch.active){ str+=touch.dx; fwd-=touch.dy; }
  var run=!!(keys.ShiftLeft||keys.ShiftRight);
  var len=Math.hypot(fwd,str);
  if(len>1){ fwd/=len; str/=len; }
  var fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw);
  var rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
  var dx=fx*fwd+rx*str, dz=fz*fwd+rz*str;
  var dl=Math.hypot(dx,dz);
  if(dl>1){ dx/=dl; dz/=dl; }
  var maxSpeed=player.fly?(run?30:19):(run?9.2:5.4);
  var k=1-Math.pow(0.0009,dt);
  player.vel.x=lerp(player.vel.x,dx*maxSpeed,k);
  player.vel.z=lerp(player.vel.z,dz*maxSpeed,k);
  player.speed=Math.hypot(player.vel.x,player.vel.z);

  var nx=player.pos.x+player.vel.x*dt, nz=player.pos.z+player.vel.z*dt;
  var useCollision=(!player.fly)||(player.pos.y<9);
  if(useCollision){
    if(!collides(nx,player.pos.z)) player.pos.x=nx; else player.vel.x=0;
    if(!collides(player.pos.x,nz)) player.pos.z=nz; else player.vel.z=0;
  }else{ player.pos.x=nx; player.pos.z=nz; }
  player.pos.x=clamp(player.pos.x,-360,360);
  player.pos.z=clamp(player.pos.z,-320,320);

  /* 垂直 */
  var gh=groundHeight(player.pos.x,player.pos.z);
  if(player.fly){
    var up=(keys.Space?1:0),down=(keys.KeyC||keys.KeyQ?1:0);
    var tv=(up?15:0)-(down?15:0);
    player.vy=lerp(player.vy,tv,1-Math.pow(0.008,dt));
    player.pos.y+=player.vy*dt;
    player.pos.y=clamp(player.pos.y,gh+1.0,240);
    if(player.pos.y<=gh+1.02&&player.vy<0) player.vy=0;
  }else{
    if(keys.Space&&player.grounded){ player.vy=8.4; player.grounded=false; }
    player.vy-=23*dt;
    player.pos.y+=player.vy*dt;
    if(player.pos.y<=gh){ player.pos.y=gh; player.vy=0; player.grounded=true; }
    else player.grounded=false;
  }

  /* 朝向 */
  if(player.speed>0.35){
    var want=Math.atan2(player.vel.x,player.vel.z);
    var diff=((want-player.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;
    player.yaw+=diff*(1-Math.pow(0.0001,dt));
  }
  return {mode:player.fly?'fly':(!player.grounded?'jump':(player.speed>6.5?'run':(player.speed>0.4?'walk':'idle'))),
          speed:player.speed};
}
function updateCamera(dt){
  var look=new T.Vector3(player.pos.x,player.pos.y+(player.fly?1.1:1.55),player.pos.z);
  cam.smooth.lerp(look,1-Math.pow(0.0006,dt));
  var dist=cam.dist*(player.fly?1.42:1);
  var cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);
  var want=new T.Vector3(
    cam.smooth.x+Math.sin(cam.yaw)*cp*dist,
    cam.smooth.y+sp*dist,
    cam.smooth.z+Math.cos(cam.yaw)*cp*dist
  );
  /* 相机遮挡剔除：避免镜头钻进树冠或建筑 */
  var dir=want.clone().sub(cam.smooth), full=dir.length(), best=full;
  for(var i=1;i<=12;i++){
    var s=i/12;
    var px=cam.smooth.x+dir.x*s, py=cam.smooth.y+dir.y*s, pz=cam.smooth.z+dir.z*s;
    if(camBlocked(px,py,pz)){ best=Math.max(4.5,full*s-1.6); break; }
  }
  cam.safeDist=(cam.safeDist===undefined?best:lerp(cam.safeDist,best,0.22));
  if(cam.safeDist<full) want.copy(cam.smooth).add(dir.normalize().multiplyScalar(cam.safeDist));
  var gy=groundHeight(want.x,want.z);
  want.y=Math.max(want.y,gy+1.3);
  if(cam.first){ camera.position.copy(want); cam.first=false; }
  else camera.position.lerp(want,1-Math.pow(0.0002,dt));
  camera.lookAt(cam.smooth);
  if(sky) sky.position.copy(camera.position);
}
function camBlocked(x,y,z){
  if(y>2&&y<70&&collides(x,z,0.9)) return true;
  if(y>1&&y<11){
    for(var i=0;i<treePts.length;i++){
      var t=treePts[i],dx=x-t[0],dz=z-t[1];
      if(dx*dx+dz*dz<6.4) return true;
    }
    for(var j=0;j<lampPts.length;j++){
      var q=lampPts[j],ex=x-q[0],ez=z-q[1];
      if(ex*ex+ez*ez<1.3) return true;
    }
  }
  return false;
}
