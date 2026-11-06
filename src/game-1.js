/* ============================================================
 * 中北大学自由探索 —— 场景 / 天空 / 光照 / 环境装饰 / 碰撞
 * ============================================================ */
(function(){
'use strict';
var T=THREE, NUC=window.NUCBuildings;
var $=function(id){ return document.getElementById(id); };
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function lerp(a,b,t){ return a+(b-a)*t; }

/* ---------------- 共享状态 ---------------- */
var renderer,scene,camera,sky,skyU,sun,moon,sunGlow,moonGlow,hemi,ambient,sunLight;
var campus,decor,clouds=[],labels=[],npcs=[],birds=[],particles,lampBulbs=[],treePts=[],lampPts=[];
var colliders=[],landmarks=[],spawns=[];
var hour=15,dayFactor=1,nightMode=false;
var clock=new T.Clock();
var started=false,ready=false;
var player={ pos:new T.Vector3(-200,0,270), vel:new T.Vector3(), yaw:0, fly:false,
             vy:0, grounded:true, speed:0, phase:0, jumpT:0 };
var cam={ yaw:0.55, pitch:0.30, dist:12, target:new T.Vector3(), smooth:new T.Vector3(), first:true };
var keys={},touch={active:false,dx:0,dy:0,run:false};
var found={},foundCount=0;
var mouse={down:false,btn:0,x:0,y:0};
var minimap,mapCtx,mapVisible=true,placeOpen=false;
var infoTimer=null,toastTimer=null;
var DPR=Math.min(window.devicePixelRatio||1,1.5);

/* ---------------- 渲染器 / 场景 ---------------- */
function initRenderer(){
  var cv=$('cv');
  renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(DPR);
  renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=false;   /* 4600+ mesh 场景关闭实时阴影，改用接触阴影与材质明暗 */
  scene=new T.Scene();
  scene.fog=new T.Fog(0xb4d0e6,320,1400);
  camera=new T.PerspectiveCamera(62,window.innerWidth/window.innerHeight,0.3,2600);
  window.addEventListener('resize',onResize);
  onResize();
}
function onResize(){
  var w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
}

/* ---------------- 天空 / 太阳 / 云 ---------------- */
function initSky(){
  skyU={
    top:{value:new T.Color(0x4a86c4)}, bottom:{value:new T.Color(0xc9dcec)},
    offset:{value:33}, exponent:{value:0.72}
  };
  var mat=new T.ShaderMaterial({
    uniforms:skyU, side:T.BackSide, depthWrite:false, fog:false,
    vertexShader:'varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'uniform vec3 top; uniform vec3 bottom; uniform float offset; uniform float exponent; varying vec3 vW; void main(){ float h=normalize(vW+vec3(0.0,offset,0.0)).y; float f=pow(max(h,0.0),exponent); gl_FragColor=vec4(mix(bottom,top,clamp(f,0.0,1.0)),1.0); }'
  });
  sky=new T.Mesh(new T.SphereGeometry(1700,32,20),mat);
  sky.frustumCulled=false; scene.add(sky);

  sun=new T.Mesh(new T.SphereGeometry(22,20,14),new T.MeshBasicMaterial({color:0xfff2c8}));
  sunGlow=new T.Sprite(new T.SpriteMaterial({map:glowTexture('#ffdca0'),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  sunGlow.scale.set(180,180,1);
  scene.add(sun,sunGlow);
  moon=new T.Mesh(new T.SphereGeometry(15,16,12),new T.MeshBasicMaterial({color:0xdfe8ff}));
  moonGlow=new T.Sprite(new T.SpriteMaterial({map:glowTexture('#a8c4ff'),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0.55}));
  moonGlow.scale.set(90,90,1);
  scene.add(moon,moonGlow);

  /* 云：柔和半透明面片 */
  var ctex=cloudTexture();
  for(var i=0;i<11;i++){
    var m=new T.Mesh(new T.PlaneGeometry(150+Math.random()*160,50+Math.random()*36),
      new T.MeshBasicMaterial({map:ctex,transparent:true,opacity:0.36,depthWrite:false,side:T.DoubleSide}));
    m.position.set((Math.random()-0.5)*1100,190+Math.random()*110,(Math.random()-0.5)*1100);
    m.rotation.x=-Math.PI/2; m.rotation.z=Math.random()*Math.PI;
    m.userData.sp=0.6+Math.random()*1.1;
    scene.add(m); clouds.push(m);
  }
}
function glowTexture(color){
  var cv=document.createElement('canvas'); cv.width=cv.height=128;
  var c=cv.getContext('2d');
  var g=c.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,color); g.addColorStop(0.25,color+'cc'); g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g; c.fillRect(0,0,128,128);
  return new T.CanvasTexture(cv);
}
function cloudTexture(){
  var cv=document.createElement('canvas'); cv.width=256; cv.height=128;
  var c=cv.getContext('2d');
  for(var i=0;i<26;i++){
    var x=30+Math.random()*196,y=40+Math.random()*52,r=18+Math.random()*34;
    var g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(255,255,255,.75)'); g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
  }
  return new T.CanvasTexture(cv);
}
function initLights(){
  hemi=new T.HemisphereLight(0xdcecff,0x5a6b4a,0.72); scene.add(hemi);
  ambient=new T.AmbientLight(0xffffff,0.22); scene.add(ambient);
  sunLight=new T.DirectionalLight(0xfff0d0,1.25);
  sunLight.castShadow=true;
  sunLight.shadow.mapSize.set(1024,1024);
  var sc=sunLight.shadow.camera;
  sc.left=-105; sc.right=105; sc.top=105; sc.bottom=-105; sc.near=1; sc.far=520;
  sunLight.shadow.bias=-0.0012;
  scene.add(sunLight); scene.add(sunLight.target);
}

/* ---------------- 世界 / 碰撞 / 地形 ---------------- */
function buildWorld(){
  campus=NUC.createCampus({ground:true});
  scene.add(campus);
  decor=new T.Group(); decor.name='NUC_environment'; scene.add(decor);
  buildColliders();
  buildLandmarks();
  buildDecor();
}
function skipCollision(d){
  var id=d.id;
  if(d.category==='props') return true;
  if(id==='erlong-mountain'||id==='bailin-garden'||id==='railway-park') return true;
  if(id==='stadium'||id==='basketball'||id==='football-north') return true;
  if(id==='dehuai-square'||id==='xingzhi-square'||id==='underground-pass') return true;
  if(id==='campus-street') return true;
  if(id==='red-houses'||id==='gezilou') return true;
  return false;
}
function buildColliders(){
  NUC.list().forEach(function(d){
    if(skipCollision(d)) return;
    var w=d.footprint[0],dp=d.footprint[1],x=d.pos[0],z=d.pos[2];
    if(d.id==='dehuai-building'){
      /* 四翼单独碰撞，中心广场可通行 */
      [[-42,-34],[42,-34],[-42,34],[42,34]].forEach(function(o){
        colliders.push({x1:x+o[0]-22,z1:z+o[1]-8,x2:x+o[0]+22,z2:z+o[1]+8,name:d.name});
      });
      colliders.push({x1:x-17,z1:z-61,x2:x+17,z2:z-43,name:d.name});
      return;
    }
    var pad=1.0;
    colliders.push({x1:x-w/2-pad,z1:z-dp/2-pad,x2:x+w/2+pad,z2:z+dp/2+pad,name:d.name});
  });
}
function isFree(x,z,r){
  r=r||1.2;
  for(var i=0;i<colliders.length;i++){
    var c=colliders[i];
    if(x>c.x1-r&&x<c.x2+r&&z>c.z1-r&&z<c.z2+r) return false;
  }
  return true;
}
/* 与资产模块中的二龙山地形高度保持一致（局部坐标需减去山体位置） */
function groundHeight(x,z){
  var lx=x+290,lz=z+80;
  if(Math.abs(lx)>52||Math.abs(lz)>205) return 0;
  function pk(cx,cz,rx,rz,hv){
    var dx=(lx-cx)/rx,dz=(lz-cz)/rz,r=dx*dx+dz*dz;
    return hv*Math.pow(Math.max(0,1-r),1.5);
  }
  return pk(0,-90,49.5,120,34)+pk(0,40,45,112,26)+pk(8,150,36,72,14);
}

function buildLandmarks(){
  var important=['main-building','library','stadium','dehuai-square','south-gate','xingzhi-square',
    'weapons-museum','erlong-mountain','bailin-garden','railway-park','yifu','academic-exchange',
    'advanced-mfg','keyi-hall','gezilou','dehuai-building','swimming','gymnasium','science-abc',
    'hongxue-12','exp-9','huixue-1','canteen-1','canteen-longshan','canteen-tianyuan',
    'service-center','campus-street','east-gate','gate-2','gate-4','gate-7','underground-pass',
    'training-hall','engineering-center','instrument','software-lab','jinyu','red-houses'];
  important.forEach(function(id){
    var d=NUC.get(id); if(!d) return;
    landmarks.push({id:id,name:d.name,cat:d.category,x:d.pos[0],z:d.pos[2],desc:d.desc,
      r:Math.max(24,Math.min(46,d.footprint[0]*0.42)),ref:d.refKey});
  });
  spawns=[
    {name:'一道门',pos:[-200,0,272]},
    {name:'行知广场',pos:[80,0,-20]},
    {name:'图书馆',pos:[-20,0,-68]},
    {name:'真草坪',pos:[-110,0,20]},
    {name:'德怀广场',pos:[-200,0,220]},
    {name:'二龙山',pos:[-255,0,-90]},
    {name:'铁路公园',pos:[60,0,150]}
  ];
}
function zoneOf(x,z){
  if(x<-245) return (z<120?'二龙山景区':'汾河沿岸');
  if(x<-155&&z>110) return '柏林园 · 德怀广场';
  if(z>205) return '一道门 · 校前区';
  if(z>95) return (x>120?'文澜苑 · 田园食堂':'怡丁苑 · 铁路南区');
  if(z>55&&Math.abs(z-(180-0.242*(x+330)))<22) return '铁路主题公园';
  if(x<-45&&z>-60) return '文瀛苑生活区';
  if(x>185&&z<-40) return '文韬苑 · 东区';
  if(z<-220) return '北部科研实验区';
  if(x<-40&&z<-70) return '图书馆 · 田径场';
  if(x>40&&x<140&&z>-80&&z<-90+50) return '教学主楼 · 行知广场';
  return '校园中央大道';
}

/* ---------------- 环境装饰 ---------------- */
function buildDecor(){
  addContactShadows(); addTrees(); addLamps(); addLabels(); addStreetFurniture();
  addLibraryAvenue(); addNPCs(); addBirds(); addParticles();
}
/* 图书馆前林荫大道：按实拍还原绿色拱廊、石球、宣传栏与红色道旗 */
function addLibraryAvenue(){
  var bark=new T.MeshStandardMaterial({color:0x4a3a28,roughness:1});
  var leaves=[new T.MeshStandardMaterial({color:0x3f7437,roughness:1}),
              new T.MeshStandardMaterial({color:0x4c8540,roughness:1}),
              new T.MeshStandardMaterial({color:0x356833,roughness:1})];
  var stone=new T.MeshStandardMaterial({color:0xc9c3b4,roughness:1});
  var panel=new T.MeshStandardMaterial({color:0x9aa49c,roughness:0.8});
  var pane2=new T.MeshStandardMaterial({color:0x4c5a53,roughness:0.8});
  var red=new T.MeshStandardMaterial({color:0xb5402f,roughness:0.9});
  var metal=new T.MeshStandardMaterial({color:0x8d9892,roughness:0.6,metalness:0.3});
  for(var i=0;i<11;i++){
    var z=-120+i*6.0;
    for(var s=-1;s<=1;s+=2){
      var x=-45+s*7.6;
      var tr=new T.Mesh(new T.CylinderGeometry(0.36,0.55,7.6,8),bark);
      tr.position.set(x,3.8,z); decor.add(tr);
      for(var c=0;c<3;c++){
        var cr=4.4-c*0.5;
        var crown=new T.Mesh(new T.SphereGeometry(cr,10,8),leaves[(i+c)%3]);
        crown.position.set(x+(c-1)*1.5*s,8.4+c*0.9,z+(c%2?0.8:-0.8));
        decor.add(crown);
      }
      /* 圆石球路障 */
      var ball=new T.Mesh(new T.SphereGeometry(0.5,10,8),stone);
      ball.position.set(-45+s*5.0,0.5,z); decor.add(ball);
    }
  }
  /* 右侧宣传栏 */
  for(var p=0;p<7;p++){
    var pz=-116+p*9;
    var frame=new T.Mesh(new T.BoxGeometry(3.4,2.6,0.22),panel);
    frame.position.set(-30,1.7,pz); frame.rotation.y=Math.PI/2; decor.add(frame);
    var glass=new T.Mesh(new T.BoxGeometry(2.9,2.0,0.26),pane2);
    glass.position.set(-30.14,1.8,pz); glass.rotation.y=Math.PI/2; decor.add(glass);
    for(var lg=-1;lg<=1;lg+=2){
      var leg=new T.Mesh(new T.CylinderGeometry(0.09,0.11,0.6,6),metal);
      leg.position.set(-30,0.3,pz+lg*1.4); decor.add(leg);
    }
  }
  /* 红色道旗 */
  for(var f=0;f<9;f++){
    var fz=-118+f*7.5, fx=-45+(f%2?6.4:-6.4);
    var pole=new T.Mesh(new T.CylinderGeometry(0.07,0.09,5.2,6),metal);
    pole.position.set(fx,2.6,fz); decor.add(pole);
    var cloth=new T.Mesh(new T.BoxGeometry(0.9,1.7,0.06),red);
    cloth.position.set(fx+(f%2?-0.5:0.5),4.1,fz); decor.add(cloth);
  }
}
/* 关闭实时阴影后，用一层批量接触阴影让建筑"落地" */
function addContactShadows(){
  var n=colliders.length;
  var im=new T.InstancedMesh(new T.PlaneGeometry(1,1),
    new T.MeshBasicMaterial({color:0x101d16,transparent:true,opacity:0.17,depthWrite:false}),n);
  var d=new T.Object3D();
  for(var i=0;i<n;i++){
    var c=colliders[i];
    d.position.set((c.x1+c.x2)/2,0.058,(c.z1+c.z2)/2);
    d.rotation.set(-Math.PI/2,0,0);
    d.scale.set(c.x2-c.x1+7,c.z2-c.z1+7,1);
    d.updateMatrix(); im.setMatrixAt(i,d.matrix);
  }
  im.instanceMatrix.needsUpdate=true; decor.add(im);
}
function noTreeZone(x,z){
  /* 广场与主楼前留空，避免遮挡视线与相机 */
  var zones=[[80,-35,60,48],[-200,235,48,48],[-20,-150,68,44],[80,-120,54,38],
             [-110,-30,92,60],[60,150,58,34],[-200,150,44,44]];
  for(var i=0;i<zones.length;i++){
    var q=zones[i];
    if(Math.abs(x-q[0])<q[2]&&Math.abs(z-q[1])<q[3]) return true;
  }
  return false;
}
function addTrees(){
  var pts=[];
  /* 主路两侧规则行道树（离路更远，给相机留出空间） */
  [-40,100,-235,305].forEach(function(x){
    for(var z=-270;z<200;z+=17){
      if(groundHeight(x,z)>1||noTreeZone(x,z)) continue;
      if(isFree(x,z,2.6)) pts.push([x+(Math.random()-0.5)*2,z,0.72+Math.random()*0.34,0]);
    }
  });
  /* 环路与空地随机树 */
  for(var i=0;i<240;i++){
    var x=(Math.random()-0.5)*680,z=(Math.random()-0.5)*620;
    if(groundHeight(x,z)>2||noTreeZone(x,z)) continue;
    if(!isFree(x,z,3.2)) continue;
    pts.push([x,z,0.72+Math.random()*0.5,Math.random()<0.28?1:0]);
  }
  treePts=pts;
  var n=pts.length;
  var mats=[
    new T.MeshStandardMaterial({color:0x594730,roughness:1}),
    new T.MeshStandardMaterial({color:0x3f7a3c,roughness:1}),
    new T.MeshStandardMaterial({color:0x518c46,roughness:1}),
    new T.MeshStandardMaterial({color:0x2f6038,roughness:1}),
    new T.MeshStandardMaterial({color:0x3a6d40,roughness:1})
  ];
  var trunk =new T.InstancedMesh(new T.CylinderGeometry(0.19,0.30,3.0,7),mats[0],n);
  var crown =new T.InstancedMesh(new T.SphereGeometry(2.25,10,8),mats[1],n);
  var crown2=new T.InstancedMesh(new T.SphereGeometry(1.55,9,7),mats[2],n);
  var pine  =new T.InstancedMesh(new T.ConeGeometry(1.85,4.2,8),mats[3],n);
  var pine2 =new T.InstancedMesh(new T.ConeGeometry(1.35,3.2,8),mats[4],n);
  var all=[trunk,crown,crown2,pine,pine2];
  all.forEach(function(im){ im.castShadow=false; im.receiveShadow=true; });
  var d=new T.Object3D();
  function setAt(im,k,x,y,z,sx,sy,sz){
    d.position.set(x,y,z); d.scale.set(sx,sy===undefined?sx:sy,sz===undefined?sx:sz);
    d.rotation.set(0,0,0); d.updateMatrix(); im.setMatrixAt(k,d.matrix);
  }
  for(var k=0;k<n;k++){
    var p=pts[k],s=p[2],gh=groundHeight(p[0],p[1]);
    setAt(trunk,k,p[0],gh+1.5*s,p[1],s);
    if(p[3]){
      setAt(pine,k,p[0],gh+3.7*s,p[1],s);
      setAt(pine2,k,p[0],gh+5.5*s,p[1],s);
      setAt(crown,k,p[0],-60,p[1],0.001);
      setAt(crown2,k,p[0],-60,p[1],0.001);
    }else{
      setAt(crown,k,p[0],gh+4.7*s,p[1],s,s*0.88,s);
      setAt(crown2,k,p[0]-1.0*s,gh+4.0*s,p[1]+0.5*s,s*0.86);
      setAt(pine,k,p[0],-60,p[1],0.001);
      setAt(pine2,k,p[0],-60,p[1],0.001);
    }
  }
  all.forEach(function(im){ im.instanceMatrix.needsUpdate=true; decor.add(im); });
}
function addLamps(){
  var pts=[];
  [-40,100,-235,305,80,-20,165].forEach(function(x){
    for(var z=-270;z<200;z+=49){
      if(isFree(x,z,2)) pts.push([x+2.2,z]);
    }
  });
  for(var i=0;i<40;i++){
    var x=(Math.random()-0.5)*600,z=(Math.random()-0.5)*560;
    if(isFree(x,z,2.5)) pts.push([x,z]);
  }
  lampPts=pts;
  var n=pts.length;
  var pole=new T.InstancedMesh(new T.CylinderGeometry(0.08,0.12,7,6),
    new T.MeshStandardMaterial({color:0x8d9892,roughness:0.6,metalness:0.35}),n);
  var head=new T.InstancedMesh(new T.BoxGeometry(1.3,0.24,0.5),
    new T.MeshStandardMaterial({color:0xd8d0b4,emissive:0xffcc78,emissiveIntensity:0,roughness:0.5}),n);
  var d=new T.Object3D();
  for(var k=0;k<n;k++){
    var gh=groundHeight(pts[k][0],pts[k][1]);
    d.position.set(pts[k][0],gh+3.5,pts[k][1]); d.scale.setScalar(1); d.updateMatrix();
    pole.setMatrixAt(k,d.matrix);
    d.position.set(pts[k][0]+0.8,gh+7,pts[k][1]); d.updateMatrix();
    head.setMatrixAt(k,d.matrix);
  }
  pole.instanceMatrix.needsUpdate=true; head.instanceMatrix.needsUpdate=true;
  decor.add(pole,head); lampBulbs.push(head);
}
function labelTexture(text){
  var cv=document.createElement('canvas'); cv.width=512; cv.height=112;
  var c=cv.getContext('2d');
  c.fillStyle='rgba(10,22,17,.86)';
  c.beginPath();
  var r=18;
  c.moveTo(r,6); c.lineTo(506-r,6); c.quadraticCurveTo(506,6,506,6+r);
  c.lineTo(506,106-r); c.quadraticCurveTo(506,106,506-r,106);
  c.lineTo(r,106); c.quadraticCurveTo(6,106,6,106-r);
  c.lineTo(6,6+r); c.quadraticCurveTo(6,6,r,6); c.fill();
  c.strokeStyle='rgba(220,182,97,.7)'; c.lineWidth=2; c.stroke();
  c.font='bold 46px "Microsoft YaHei","PingFang SC",sans-serif';
  c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f0d693';
  var s=text.length>11?text.slice(0,11)+'…':text;
  c.fillText(s,256,58);
  return new T.CanvasTexture(cv);
}
function addLabels(){
  landmarks.slice(0,34).forEach(function(l){
    var d=NUC.get(l.id); if(!d) return;
    var sp=new T.Sprite(new T.SpriteMaterial({map:labelTexture(l.name),transparent:true,depthTest:false,depthWrite:false}));
    sp.scale.set(19,4.2,1);
    sp.position.set(l.x,Math.max(14,d.height+9),l.z);
    sp.userData={x:l.x,z:l.z};
    decor.add(sp); labels.push(sp);
  });
}
function addStreetFurniture(){
  var benchMat=new T.MeshStandardMaterial({color:0x8a6a45,roughness:1});
  var metal=new T.MeshStandardMaterial({color:0x4d5a52,roughness:0.7,metalness:0.3});
  /* 长椅 */
  [[-16,20],[96,-40],[-200,190],[70,-10],[-30,120]].forEach(function(p){
    if(!isFree(p[0],p[1],1)) return;
    box(2.4,0.16,0.7,p[0],0.55,p[1],benchMat);
    box(2.4,0.7,0.14,p[0],0.95,p[1]-0.32,benchMat);
    for(var s=-1;s<=1;s+=2) box(0.12,0.5,0.6,p[0]+s*1.0,0.28,p[1],metal);
  });
  /* 斑马线 */
  [[80,100],[-20,100],[165,100],[-200,265]].forEach(function(p){
    for(var i=0;i<7;i++) box(1.0,0.02,3.4,p[0]-6+i*2,0.075,p[1],new T.MeshStandardMaterial({color:0xe8e6dc,roughness:1}));
  });
  /* 垃圾桶 / 花坛 */
  for(var i=0;i<18;i++){
    var x=(Math.random()-0.5)*560,z=(Math.random()-0.5)*480;
    if(!isFree(x,z,1.5)) continue;
    cyl(0.42,0.36,0.9,8,x,0.45,z,metal);
  }
  /* 花坛 */
  [[80,-5],[-20,-105],[-200,205],[60,140]].forEach(function(p){
    cyl(4.2,4.2,0.55,16,p[0],0.28,p[1],new T.MeshStandardMaterial({color:0xb9b3a4,roughness:1}));
    cyl(3.7,3.7,0.12,16,p[0],0.58,p[1],new T.MeshStandardMaterial({color:0x4f7d42,roughness:1}));
  });
}
function addNPCs(){
  var routes=[
    {a:[-230,-165],b:[260,-165]}, {a:[80,-250],b:[80,180]},
    {a:[-20,-250],b:[-20,120]},  {a:[-200,190],b:[-200,60]},
    {a:[165,-240],b:[165,60]},   {a:[-125,-30],b:[60,-30]}
  ];
  var colors=[0x3a6ea5,0xb0554a,0x4a8a6a,0x8a6a9a,0xc08a42,0x4a7a8a];
  routes.forEach(function(rt,i){
    var ch=createCharacter({shirt:colors[i],pants:0x35404a,skin:0xf0c8a0,hair:0x2a211c,scale:0.96});
    ch.root.position.set(rt.a[0],0,rt.a[1]);
    decor.add(ch.root);
    npcs.push({ch:ch,a:rt.a,b:rt.b,t:Math.random(),dir:1,sp:0.55+Math.random()*0.5});
  });
}
function addBirds(){
  for(var i=0;i<4;i++){
    var grp=new T.Group();
    var m=new T.MeshStandardMaterial({color:0x3b4a44,roughness:1,side:T.DoubleSide});
    for(var s=-1;s<=1;s+=2){
      var wing=new T.Mesh(new T.PlaneGeometry(2.6,0.6),m);
      wing.position.x=s*1.3; wing.rotation.z=s*0.35; grp.add(wing);
    }
    grp.userData={r:120+Math.random()*90,a:Math.random()*Math.PI*2,y:75+Math.random()*45,sp:0.06+Math.random()*0.05};
    scene.add(grp); birds.push(grp);
  }
}
function addParticles(){
  var n=180,pos=new Float32Array(n*3);
  for(var i=0;i<n;i++){
    pos[i*3]=(Math.random()-0.5)*500;
    pos[i*3+1]=2+Math.random()*55;
    pos[i*3+2]=(Math.random()-0.5)*460;
  }
  var g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3));
  particles=new T.Points(g,new T.PointsMaterial({color:0xf2e2b0,size:0.7,transparent:true,opacity:0.5,depthWrite:false}));
  scene.add(particles);
}
/* 供装饰使用的简易构件（局部） */
function box(w,h,d,x,y,z,m){
  var o=new T.Mesh(new T.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=false; o.receiveShadow=true; decor.add(o); return o;
}
function cyl(rt,rb,h,seg,x,y,z,m){
  var o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg),m); o.position.set(x,y,z); decor.add(o); return o;
}

/* ---------------- 时间 / 光照 ---------------- */
var SKY_KEYS=[
  {h:6, top:0x24406a,bot:0xc98a63,fog:0xb08a6c,sun:0xffb070},
  {h:8, top:0x3f78b4,bot:0xb9d3e8,fog:0xb2cde0,sun:0xffd9a0},
  {h:12,top:0x3a7ec2,bot:0xbcd8ee,fog:0xb4d0e6,sun:0xfff1cf},
  {h:16,top:0x4280b8,bot:0xc0d6e6,fog:0xb8cee0,sun:0xffedc4},
  {h:18,top:0x63477f,bot:0xdc965c,fog:0xcf9466,sun:0xffa457},
  {h:20,top:0x152440,bot:0x354560,fog:0x26344e,sun:0x6d82b5},
  {h:22,top:0x091630,bot:0x1a263c,fog:0x162136,sun:0x5a70a0}
];
function skyAt(h){
  var a=SKY_KEYS[0],b=SKY_KEYS[SKY_KEYS.length-1];
  for(var i=0;i<SKY_KEYS.length-1;i++){
    if(h>=SKY_KEYS[i].h&&h<=SKY_KEYS[i+1].h){ a=SKY_KEYS[i]; b=SKY_KEYS[i+1]; break; }
  }
  var t=(h-a.h)/Math.max(0.001,b.h-a.h);
  var ca=new T.Color(a.top),cb=new T.Color(b.top);
  var ba=new T.Color(a.bot),bb=new T.Color(b.bot);
  var fa=new T.Color(a.fog),fb=new T.Color(b.fog);
  var sa=new T.Color(a.sun),sb=new T.Color(b.sun);
  return {top:ca.lerp(cb,t),bot:ba.lerp(bb,t),fog:fa.lerp(fb,t),sun:sa.lerp(sb,t)};
}
function setTime(h){
  hour=clamp(h,6,22);
  var t=(hour-6)/16, ang=t*Math.PI;
  dayFactor=Math.max(0.06,Math.sin(ang));
  nightMode=(hour<7.2||hour>18.8);
  var c=skyAt(hour);
  skyU.top.value.copy(c.top); skyU.bottom.value.copy(c.bot);
  scene.fog.color.copy(c.fog);
  scene.fog.near=nightMode?260:320; scene.fog.far=nightMode?1050:1450;
  var sx=Math.cos(ang)*-420+120, sy=Math.sin(ang)*430+40, sz=-200;
  sun.position.set(sx,sy,sz); sunGlow.position.set(sx,sy,sz);
  sunLight.position.set(sx*0.6,Math.max(60,sy*0.7),sz*0.6);
  sunLight.target.position.set(player.pos.x,0,player.pos.z);
  sunLight.color.copy(c.sun);
  sunLight.intensity=0.30+dayFactor*1.15;
  hemi.intensity=0.22+dayFactor*0.60;
  ambient.intensity=0.14+dayFactor*0.12;
  renderer.toneMappingExposure=nightMode?0.85:0.90;
  sun.visible=!nightMode; sunGlow.visible=!nightMode;
  moon.visible=nightMode; moonGlow.visible=nightMode;
  if(nightMode){ moon.position.set(-sx*0.7,260,180); moonGlow.position.copy(moon.position); }
  NUC.setNight(nightMode);
  lampBulbs.forEach(function(im){ im.material.emissiveIntensity=nightMode?1.35:0; });
  clouds.forEach(function(cl){ cl.material.opacity=nightMode?0.10:0.36; });
  var hh=Math.floor(hour),mm=Math.round((hour-hh)*60);
  $('clock').textContent=(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;
  $('timeSlider').value=hour;
}

/* ---------------- 每帧环境动画 ---------------- */
function animateEnv(dt){
  clouds.forEach(function(cl){
    cl.position.x+=cl.userData.sp*dt*3.2;
    if(cl.position.x>620) cl.position.x=-620;
  });
  birds.forEach(function(b){
    var u=b.userData; u.a+=u.sp*dt;
    b.position.set(Math.cos(u.a)*u.r,u.y+Math.sin(u.a*2)*7,Math.sin(u.a)*u.r);
    b.rotation.y=-u.a+Math.PI/2;
    b.children.forEach(function(w,i){ w.rotation.x=Math.sin(performance.now()*0.008+i)*0.3; });
  });
  if(particles){
    var p=particles.geometry.attributes.position;
    for(var i=0;i<p.count;i+=3){
      var y=p.getY(i)-dt*1.4;
      if(y<1) y=55;
      p.setY(i,y); p.setX(i,p.getX(i)+Math.sin(performance.now()*0.0004+i)*dt*0.7);
    }
    p.needsUpdate=true;
  }
  npcs.forEach(function(n){
    n.t+=dt*n.sp*0.004*n.dir;
    if(n.t>1){ n.t=1; n.dir=-1; } if(n.t<0){ n.t=0; n.dir=1; }
    var dx=n.b[0]-n.a[0],dz=n.b[1]-n.a[1];
    var x=n.a[0]+dx*n.t,z=n.a[1]+dz*n.t;
    n.ch.root.position.set(x,groundHeight(x,z),z);
    n.ch.root.rotation.y=Math.atan2(dx*n.dir,dz*n.dir);
    n.ch.animate('walk',dt,2.2);
  });
  var camHigh=camera.position.y>72;
  labels.forEach(function(sp){
    var dx=sp.position.x-player.pos.x,dz=sp.position.z-player.pos.z;
    var dist=Math.sqrt(dx*dx+dz*dz);
    sp.visible=!camHigh&&dist<150;
    if(sp.visible) sp.material.opacity=clamp((150-dist)/42,0,1);
  });
  sunLight.target.position.set(player.pos.x,0,player.pos.z);
  sunLight.position.set(player.pos.x+Math.cos((hour-6)/16*Math.PI)*-250+100,
    Math.max(80,Math.sin((hour-6)/16*Math.PI)*300+80),player.pos.z-160);
}
