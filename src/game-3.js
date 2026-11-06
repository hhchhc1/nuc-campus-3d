/* ============================================================
 * UI / 小地图 / 地标发现 / 主循环 / 启动
 * ============================================================ */
var character,uiAccum=0,selectedSpawn=0;

function toast(msg){
  var t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){ t.classList.remove('show'); },2400);
}
function showInfo(l){
  $('infoTag').textContent=({teaching:'教学科研',landmark:'地标广场',life:'生活配套',
    sport:'体育运动',landscape:'园林景观',props:'校园构件'})[l.cat]||'校园地标';
  $('infoName').textContent=l.name;
  $('infoDesc').textContent=l.desc||'';
  $('infoRef').textContent=l.ref?'· 依据中北大学官网公开照片重建':'· 依据官方校园平面图标注重建';
  $('infoCard').classList.add('show');
  clearTimeout(infoTimer);
  infoTimer=setTimeout(function(){ $('infoCard').classList.remove('show'); },5200);
}
function buildUI(){
  /* 出生点选择 */
  $('spawn').innerHTML=spawns.map(function(s,i){
    return '<button data-i="'+i+'" class="'+(i===0?'on':'')+'">'+s.name+'</button>';
  }).join('');
  $('spawn').querySelectorAll('button').forEach(function(b){
    b.onclick=function(){
      selectedSpawn=parseInt(b.dataset.i,10);
      $('spawn').querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
    };
  });
  /* 快捷传送 */
  $('quick').innerHTML=spawns.map(function(s,i){
    return '<button data-i="'+i+'">'+s.name+'</button>';
  }).join('');
  $('quick').querySelectorAll('button').forEach(function(b){
    b.onclick=function(){ teleport(parseInt(b.dataset.i,10)); };
  });
  /* 地点列表 */
  $('placeList').innerHTML=landmarks.map(function(l,i){
    return '<div class="pitem" data-i="'+i+'"><span class="pd"></span>'+l.name+'</div>';
  }).join('');
  $('placeList').querySelectorAll('.pitem').forEach(function(el){
    el.onclick=function(){
      var l=landmarks[parseInt(el.dataset.i,10)];
      var ox=Math.max(20,l.r*0.7),oz=Math.max(20,l.r*0.7);
      player.pos.set(l.x+ox,player.fly?Math.max(player.pos.y,22):groundHeight(l.x+ox,l.z+oz),l.z+oz);
      player.vel.set(0,0,0); player.vy=0;
      cam.smooth.set(player.pos.x,player.pos.y+1.5,player.pos.z);
      toast('前往 · '+l.name);
      if(!found[l.id]){ found[l.id]=true; foundCount++; showInfo(l); updateProgress(); }
    };
  });
  $('placeCount').textContent='0 / '+landmarks.length;
  $('places').classList.add('collapsed');
  $('placeToggle').textContent='+';
  $('placeToggle').onclick=function(){
    placeOpen=!placeOpen;
    $('places').classList.toggle('collapsed',!placeOpen);
    this.textContent=placeOpen?'−':'+';
  };
  /* 时间 */
  $('timeSlider').oninput=function(){ setTime(parseFloat(this.value)); };
  $('btnFly').onclick=function(){ toggleFly(); };
  $('btnMap').onclick=function(){ toggleMap(); };
  $('btnHelp').onclick=function(){ showHelp(); };
  $('closeModal').onclick=function(){ $('modal').classList.add('hidden'); };
  $('modal').onclick=function(e){ if(e.target===this) this.classList.add('hidden'); };
  $('startBtn').onclick=function(){
    $('intro').classList.add('hidden');
    started=true;
    teleport(selectedSpawn);
    toast('欢迎来到中北大学 · 用 WASD 开始探索');
  };
  /* 小地图点击传送 */
  minimap=$('minimap'); mapCtx=minimap.getContext('2d');
  minimap.addEventListener('click',function(e){
    var r=minimap.getBoundingClientRect();
    var mx=(e.clientX-r.left)/r.width*minimap.width;
    var my=(e.clientY-r.top)/r.height*minimap.height;
    var x=mx/minimap.width*720-360, z=my/minimap.height*640-320;
    player.pos.set(x,player.fly?Math.max(player.pos.y,20):groundHeight(x,z),z);
    player.vel.set(0,0,0); player.vy=0;
    cam.smooth.set(x,player.pos.y+1.5,z);
    toast('已传送到该位置');
  });
  /* 帮助内容 */
  $('modalBody').innerHTML=
    '<h4>行走</h4><ul>'+
    '<li><b>W A S D</b> / 方向键移动，<b>Shift</b> 奔跑，<b>Space</b> 跳跃</li>'+
    '<li>鼠标左键拖拽旋转视角，滚轮缩放；<b>R</b> 回到行知广场</li></ul>'+
    '<h4>飞翔</h4><ul>'+
    '<li><b>F</b> 切换飞行模式（也可点右上角 ✦）</li>'+
    '<li>飞行时 <b>Space</b> 上升、<b>C / Q</b> 下降，<b>Shift</b> 加速</li>'+
    '<li>飞到 9 米以上可越过建筑，低空仍会碰撞</li></ul>'+
    '<h4>探索</h4><ul>'+
    '<li>靠近地标会弹出建筑简介，并计入探索进度</li>'+
    '<li>点击右侧小地图任意位置可直接传送</li>'+
    '<li>左侧地标列表、底部快捷栏均可快速前往</li>'+
    '<li>顶部时间滑块可在 06:00—22:00 之间切换昼夜，夜间窗户会亮起</li></ul>'+
    '<h4>关于场景</h4>'+
    '<p>依据中北大学本科招生信息网《中北大学校园图》高清原图逐块核对楼名与方位，'+
    '并按中北大学官网公开的 11 张建筑照片重建单体造型（教学主楼、图书馆、德怀楼、真草坪体育场、'+
    '学术交流中心、逸夫楼、科艺苑、阁子楼、先进制造中心、学生公寓、游泳馆等）。'+
    '共 100 余处建筑与景观，含七道门、文瀛苑 / 文韬苑 / 怡丁苑 / 文澜苑宿舍组团、'+
    '铁路主题公园、二龙山与柏林园。</p>'+
    '<p style="margin-top:8px;color:#718a7c">属可用于游戏的风格化精细还原，非测绘级 1:1 复原；'+
    '校园整体按正交坐标简化，斜穿的铁路与河岸做了可玩性调整。</p>';
}
function showHelp(){ $('modal').classList.remove('hidden'); }
function updateQuick(){
  $('quick').querySelectorAll('button').forEach(function(b,i){ b.classList.toggle('on',i===selectedSpawn); });
}
function updateProgress(){
  $('prog').textContent=foundCount+' / '+landmarks.length;
  $('progBar').style.width=(foundCount/Math.max(1,landmarks.length)*100)+'%';
  $('placeCount').textContent=foundCount+' / '+landmarks.length;
  $('placeList').querySelectorAll('.pitem').forEach(function(el){
    var l=landmarks[parseInt(el.dataset.i,10)];
    el.classList.toggle('found',!!found[l.id]);
  });
}
function checkDiscovery(){
  for(var i=0;i<landmarks.length;i++){
    var l=landmarks[i]; if(found[l.id]) continue;
    var dx=player.pos.x-l.x,dz=player.pos.z-l.z;
    if(dx*dx+dz*dz<l.r*l.r){
      found[l.id]=true; foundCount++;
      showInfo(l); updateProgress();
      toast('发现地标 · '+l.name);
      break;
    }
  }
}
function updateHUD(){
  var x=player.pos.x,z=player.pos.z;
  $('zone').textContent=zoneOf(x,z);
  $('coord').textContent='X '+Math.round(x)+' · Z '+Math.round(z);
  $('spd').textContent=player.speed.toFixed(1)+' m/s';
  $('alt').textContent=player.pos.y.toFixed(1)+' m';
  $('mapCoord').textContent='N ↑ · '+Math.round(x)+','+Math.round(z);
}

/* ---------------- 小地图 ---------------- */
function drawMinimap(){
  if(!mapCtx) return;
  var c=mapCtx,W=minimap.width,H=minimap.height;
  var MX=function(x){ return (x+360)/720*W; }, MZ=function(z){ return (z+320)/640*H; };
  c.clearRect(0,0,W,H);
  var bg=c.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#12231a'); bg.addColorStop(1,'#0b1712');
  c.fillStyle=bg; c.fillRect(0,0,W,H);
  /* 网格 */
  c.strokeStyle='rgba(140,180,155,.07)'; c.lineWidth=1;
  for(var gx=0;gx<=720;gx+=90){ c.beginPath(); c.moveTo(MX(gx-360),0); c.lineTo(MX(gx-360),H); c.stroke(); }
  for(var gz=0;gz<=640;gz+=80){ c.beginPath(); c.moveTo(0,MZ(gz-320)); c.lineTo(W,MZ(gz-320)); c.stroke(); }
  /* 汾河 */
  c.fillStyle='rgba(70,140,175,.55)';
  c.fillRect(MX(-363),0,MX(-341)-MX(-363),H);
  /* 铁路 */
  c.strokeStyle='#7d8a92'; c.lineWidth=3; c.setLineDash([7,5]);
  c.beginPath(); c.moveTo(MX(-330),MZ(180)); c.lineTo(MX(330),MZ(20)); c.stroke();
  c.setLineDash([]);
  /* 主干道 */
  c.strokeStyle='rgba(190,196,188,.34)'; c.lineWidth=3.2;
  var roads=[[[ -320,-165],[320,-165]],[[0,-292],[0,0]],[[0,212],[0,0]],
             [[-235,-290],[-235,210],[0,0]],[[305,-290],[305,210],[0,0]]];
  [[-320,-165,320,-165],[-320,-292,320,-292],[-320,212,320,212],
   [-235,-290,-235,210],[305,-290,305,210],[80,-290,80,210],[-20,-290,-20,210],[165,-290,165,210],
   [-320,-245,320,-245],[-320,-95,320,-95],[-320,-35,320,-35],[-320,60,320,60],[-320,140,320,140]].forEach(function(r){
    c.beginPath(); c.moveTo(MX(r[0]),MZ(r[1])); c.lineTo(MX(r[2]),MZ(r[3])); c.stroke();
  });
  /* 建筑 */
  colliders.forEach(function(b){
    c.fillStyle='rgba(214,206,186,.30)';
    c.fillRect(MX(b.x1),MZ(b.z1),Math.max(1.5,MX(b.x2)-MX(b.x1)),Math.max(1.5,MZ(b.z2)-MZ(b.z1)));
  });
  /* 特殊场地 */
  c.fillStyle='rgba(170,86,62,.5)';
  c.beginPath(); c.ellipse(MX(-110),MZ(-30),MX(-110+72)-MX(-110),MZ(-30+50)-MZ(-30),0,0,Math.PI*2); c.fill();
  c.fillStyle='rgba(90,150,80,.42)';
  c.beginPath(); c.ellipse(MX(-110),MZ(-30),MX(-110+52)-MX(-110),MZ(-30+30)-MZ(-30),0,0,Math.PI*2); c.fill();
  c.fillStyle='rgba(60,110,80,.35)';
  c.fillRect(MX(-335),MZ(-280),MX(-245)-MX(-335),MZ(120)-MZ(-280));
  /* 地标 */
  landmarks.forEach(function(l){
    c.beginPath(); c.arc(MX(l.x),MZ(l.z),found[l.id]?3.2:2.2,0,Math.PI*2);
    c.fillStyle=found[l.id]?'#e6c172':'rgba(160,190,170,.55)'; c.fill();
  });
  /* 玩家视野扇形 */
  c.save(); c.translate(MX(player.pos.x),MZ(player.pos.z)); c.rotate(-player.yaw);
  var grd=c.createRadialGradient(0,0,0,0,0,40);
  grd.addColorStop(0,'rgba(230,193,114,.20)'); grd.addColorStop(1,'rgba(230,193,114,0)');
  c.fillStyle=grd; c.beginPath(); c.moveTo(0,0); c.arc(0,0,40,-0.55,0.55); c.closePath(); c.fill();
  c.fillStyle='#f2d693';
  c.beginPath(); c.moveTo(0,-8); c.lineTo(-5,5); c.lineTo(5,5); c.closePath(); c.fill();
  c.restore();
  /* 边框 */
  c.strokeStyle='rgba(220,182,97,.35)'; c.lineWidth=2; c.strokeRect(1,1,W-2,H-2);
}

/* ---------------- 主循环 ---------------- */
function loop(){
  requestAnimationFrame(loop);
  var dt=Math.min(0.05,clock.getDelta());
  if(started){
    var st=updatePlayer(dt);
    character.animate(st.mode,dt,Math.max(0.55,player.speed/5.2));
    character.root.position.copy(player.pos);
    character.root.rotation.y=player.yaw;
    character.shadow.visible=!player.fly;
    if(character.shadow.visible){
      character.shadow.position.y=groundHeight(player.pos.x,player.pos.z)-player.pos.y+0.035;
      character.shadow.material.opacity=clamp(0.34-(player.pos.y-groundHeight(player.pos.x,player.pos.z))*0.03,0.05,0.34);
    }
  }else{
    cam.yaw+=dt*0.075;
    player.pos.y=groundHeight(player.pos.x,player.pos.z);
  }
  updateCamera(dt);
  animateEnv(dt);
  renderer.render(scene,camera);
  uiAccum+=dt;
  if(uiAccum>0.09){
    uiAccum=0;
    if(started){ updateHUD(); drawMinimap(); checkDiscovery(); }
  }
}

/* ---------------- 启动 ---------------- */
function createPlayer(){
  character=createCharacter({shirt:0x3f74b5,shirt2:0xf2efe4,pants:0x303b48,
    skin:0xf0c8a0,hair:0x2b221d,bag:0xa45f3e,scale:1.0});
  scene.add(character.root);
  character.root.position.copy(player.pos);
  character.root.rotation.y=player.yaw;
  cam.smooth.set(player.pos.x,1.55,player.pos.z);
}
function boot(){
  if(!NUC){ $('loadText').textContent='资产模块加载失败'; return; }
  initRenderer();
  initSky();
  initLights();
  setTimeout(function(){
    $('loadText').textContent='正在按官方平面图布置建筑…';
    buildWorld();
    createPlayer();
    initControls();
    buildUI();
    setTime(15);
    updateProgress();
    drawMinimap();
    /* 调试 / 分享机位：?skipintro&spawn=1&pos=x,y,z&cam=yaw,pitch,dist&time=18&fly=1&hideui=1 */
    var qs=new URLSearchParams(location.search);
    selectedSpawn=clamp(parseInt(qs.get('spawn')||'0',10),0,spawns.length-1);
    if(qs.has('skipintro')){ $('intro').classList.add('hidden'); started=true; }
    if(qs.has('time')) setTime(parseFloat(qs.get('time')));
    if(qs.has('pos')){
      var pv=qs.get('pos').split(',').map(Number);
      player.pos.set(pv[0]||0,pv[1]||0,pv[2]||0);
      cam.smooth.set(player.pos.x,player.pos.y+1.5,player.pos.z);
    }else if(qs.has('skipintro')) teleport(selectedSpawn);
    if(qs.has('cam')){
      var cv2=qs.get('cam').split(',').map(Number);
      cam.yaw=cv2[0]||0.55; cam.pitch=cv2[1]||0.3; cam.dist=cv2[2]||15;
    }
    if(qs.has('fly')){
      player.fly=true; player.pos.y=Math.max(player.pos.y,55);
      $('modeTag').classList.add('fly');
      $('modeTag').querySelector('span').textContent='飞行模式';
      $('cross').classList.add('show');
    }
    if(qs.has('hideui')){
      document.querySelectorAll('.panel,#cross,#vig').forEach(function(el){ el.style.display='none'; });
    }
    character.root.position.copy(player.pos);
    updateQuick(); updateProgress(); drawMinimap();
    ready=true;
    $('loading').classList.add('hidden');
    clock.getDelta();
    loop();
  },80);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();

})();
