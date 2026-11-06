/* ============================================================
 * 中北大学建筑资产工坊 —— 预览 / 检索 / 导出
 * ============================================================ */
(function(){
'use strict';

var NUC = window.NUCBuildings;
var REFS = window.NUC_REF_IMAGES || {};
var CATS = [
  ['all','全部'],['teaching','教学'],['landmark','地标'],
  ['life','生活'],['sport','运动'],['landscape','景观'],['props','构件']
];
var CATNAME = {teaching:'教学科研',landmark:'地标广场',life:'生活配套',sport:'体育运动',landscape:'园林景观',props:'配套构件'};

var $ = function(id){ return document.getElementById(id); };
var viewport = $('viewport'), canvas = $('cv');
var renderer, scene, camera, hemi, dirLight, ambient, gridHelper, stage;
var current = null;          // 当前展示的 THREE.Group
var currentId = 'main-building';
var viewMode = 'single';
var lightMode = 'day';
var filterCat = 'all', keyword = '';
var orbit = { yaw:0.72, pitch:0.30, dist:150, target:new THREE.Vector3(0,12,0), auto:false };
var drag = { on:false, btn:0, x:0, y:0 };
var busyCount = 0;

function toast(msg){
  var t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(function(){ t.classList.remove('show'); },2600);
}
function busy(on,text){
  busyCount = on ? busyCount+1 : Math.max(0,busyCount-1);
  var b=$('busy');
  if(on){ $('busyText').textContent=text||'正在生成模型…'; b.classList.add('show'); }
  else if(busyCount===0) b.classList.remove('show');
  $('statLive').textContent = on ? '处理中…' : '就绪';
}

/* ---------------- 场景 ---------------- */
function initScene(){
  renderer = new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fb6cf);
  scene.fog = new THREE.Fog(0x8fb6cf, 500, 1600);

  camera = new THREE.PerspectiveCamera(45,1,0.5,4000);

  hemi = new THREE.HemisphereLight(0xffffff,0x6b7a5c,0.85); scene.add(hemi);
  ambient = new THREE.AmbientLight(0xffffff,0.22); scene.add(ambient);
  dirLight = new THREE.DirectionalLight(0xfff2d6,1.2);
  dirLight.position.set(160,240,180);
  dirLight.castShadow=true;
  dirLight.shadow.mapSize.set(1024,1024);
  var sc=dirLight.shadow.camera;
  sc.left=-180; sc.right=180; sc.top=180; sc.bottom=-180; sc.near=1; sc.far=900;
  scene.add(dirLight);

  gridHelper = new THREE.GridHelper(400,40,0x8aa895,0x40584a);
  gridHelper.position.y=0.04; gridHelper.visible=false;
  scene.add(gridHelper);

  /* 单栋展示台 */
  stage = new THREE.Mesh(new THREE.CircleGeometry(175,64),
    new THREE.MeshBasicMaterial({color:0x1b2a23}));
  stage.rotation.x=-Math.PI/2; stage.position.y=-0.08; stage.receiveShadow=true;
  scene.add(stage);

  bindControls();
  resize();
  window.addEventListener('resize',resize);
  applyLight('day');
  animate();
}
function resize(){
  var w=viewport.clientWidth||800, h=viewport.clientHeight||600;
  renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
}
function updateCamera(){
  var cp=Math.cos(orbit.pitch), sp=Math.sin(orbit.pitch);
  camera.position.set(
    orbit.target.x+Math.sin(orbit.yaw)*cp*orbit.dist,
    orbit.target.y+sp*orbit.dist,
    orbit.target.z+Math.cos(orbit.yaw)*cp*orbit.dist
  );
  camera.lookAt(orbit.target);
}
function bindControls(){
  canvas.addEventListener('contextmenu',function(e){ e.preventDefault(); });
  canvas.addEventListener('mousedown',function(e){
    drag.on=true; drag.btn=e.button; drag.x=e.clientX; drag.y=e.clientY;
  });
  window.addEventListener('mouseup',function(){ drag.on=false; });
  window.addEventListener('mousemove',function(e){
    if(!drag.on) return;
    var dx=e.clientX-drag.x, dy=e.clientY-drag.y;
    drag.x=e.clientX; drag.y=e.clientY;
    if(drag.btn===2){
      var right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);
      var up=new THREE.Vector3().setFromMatrixColumn(camera.matrix,1);
      var k=orbit.dist*0.0016;
      orbit.target.addScaledVector(right,-dx*k).addScaledVector(up,dy*k);
    }else{
      orbit.yaw -= dx*0.006;
      orbit.pitch = Math.max(-0.15,Math.min(1.35,orbit.pitch+dy*0.005));
    }
    updateCamera();
  });
  canvas.addEventListener('wheel',function(e){
    e.preventDefault();
    orbit.dist *= (e.deltaY>0?1.11:0.9);
    orbit.dist = Math.max(6,Math.min(1600,orbit.dist));
    updateCamera();
  },{passive:false});
  /* 触摸 */
  var touch={x:0,y:0};
  canvas.addEventListener('touchstart',function(e){
    if(e.touches.length===1){ touch.x=e.touches[0].clientX; touch.y=e.touches[0].clientY; }
  },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    if(e.touches.length===1){
      var dx=e.touches[0].clientX-touch.x, dy=e.touches[0].clientY-touch.y;
      touch.x=e.touches[0].clientX; touch.y=e.touches[0].clientY;
      orbit.yaw-=dx*0.007; orbit.pitch=Math.max(-0.15,Math.min(1.35,orbit.pitch+dy*0.005));
      updateCamera();
    }
  },{passive:true});
}
function animate(){
  requestAnimationFrame(animate);
  if(orbit.auto){ orbit.yaw+=0.0022; updateCamera(); }
  renderer.render(scene,camera);
}

/* ---------------- 光照 ---------------- */
function applyLight(mode){
  lightMode=mode;
  var cfg={
    day:  {bg:0x8fb6cf,hemi:0xffffff,ground:0x6b7a5c,hi:0.85,amb:0.22,dir:0xfff2d6,di:1.2,pos:[160,240,180],night:false},
    dusk: {bg:0xd08a5e,hemi:0xffd6a4,ground:0x54402f,hi:0.85,amb:0.30,dir:0xff9a52,di:1.75,pos:[-220,90,120],night:false},
    night:{bg:0x101d2e,hemi:0x53709b,ground:0x141c22,hi:0.50,amb:0.24,dir:0x93aed8,di:0.55,pos:[-140,180,-120],night:true}
  }[mode];
  scene.background.setHex(cfg.bg);
  scene.fog.color.setHex(cfg.bg);
  hemi.color.setHex(cfg.hemi); hemi.groundColor.setHex(cfg.ground); hemi.intensity=cfg.hi;
  ambient.intensity=cfg.amb;
  dirLight.color.setHex(cfg.dir); dirLight.intensity=cfg.di;
  dirLight.position.set(cfg.pos[0],cfg.pos[1],cfg.pos[2]);
  NUC.setNight(cfg.night);
  document.querySelectorAll('#segLight button').forEach(function(b){
    b.classList.toggle('on',b.dataset.l===mode);
  });
}

/* ---------------- 模型装载 ---------------- */
function clearModel(){
  if(current){
    scene.remove(current);
    NUC.dispose(current);
  }
  current=null;
}
function fitCamera(def){
  var w=def.footprint[0], d=def.footprint[1], h=def.height;
  var m=Math.max(w,d,h);
  orbit.dist=m*1.85+18;
  orbit.target.set(0,Math.max(3,h*0.42),0);
  orbit.pitch=0.27; orbit.yaw=0.72;
  updateCamera();
}
function showSingle(id){
  viewMode='single'; currentId=id;
  var def=NUC.get(id); if(!def) return;
  busy(true,'正在构建 '+def.name+' …');
  setTimeout(function(){
    clearModel();
    current=NUC.create(id);
    scene.add(current);
    renderer.shadowMap.enabled=true;
    stage.visible=true;
    gridHelper.visible=$('btnGrid').classList.contains('on');
    fitCamera(def);
    $('badgeName').textContent=def.name;
    $('statSel').textContent=def.en;
    renderInspector(def);
    markList();
    busy(false);
  },20);
}
function showCampus(){
  viewMode='campus';
  busy(true,'正在构建整校布局（30 组资产）…');
  setTimeout(function(){
    clearModel();
    current=NUC.createCampus({ground:true});
    scene.add(current);
    renderer.shadowMap.enabled=false;   /* 整校 mesh 过多，关闭阴影保证流畅 */
    stage.visible=false;
    gridHelper.visible=false;
    orbit.dist=700; orbit.target.set(0,20,0); orbit.pitch=0.72; orbit.yaw=0.62;
    updateCamera();
    $('badgeName').textContent='整校布局 · '+NUC.list().length+' 组资产';
    $('statSel').textContent='CAMPUS (all assets)';
    renderCampusInspector();
    busy(false);
  },20);
}
function setView(v){
  document.querySelectorAll('#segView button').forEach(function(b){ b.classList.toggle('on',b.dataset.v===v); });
  if(v==='campus') showCampus(); else showSingle(currentId);
}

/* ---------------- 目录 ---------------- */
function renderCats(){
  $('catTabs').innerHTML=CATS.map(function(c){
    return '<button data-c="'+c[0]+'" class="'+(filterCat===c[0]?'on':'')+'">'+c[1]+'</button>';
  }).join('');
  $('catTabs').querySelectorAll('button').forEach(function(b){
    b.onclick=function(){ filterCat=b.dataset.c; renderCats(); renderList(); };
  });
}
function filtered(){
  var k=keyword.trim().toLowerCase();
  return NUC.list().filter(function(d){
    if(filterCat!=='all' && d.category!==filterCat) return false;
    if(!k) return true;
    return (d.name+' '+d.en+' '+d.id+' '+d.desc+' '+(d.features||[]).join(' ')).toLowerCase().indexOf(k)>=0;
  });
}
function renderList(){
  var arr=filtered();
  $('assetList').innerHTML=arr.map(function(d){
    var img=REFS[d.refKey];
    var thumb=img?'<img src="'+img+'" alt="">':'<span class="ph">'+CATNAME[d.category].slice(0,2)+'</span>';
    return '<div class="card" data-id="'+d.id+'">'+
      '<div class="thumb">'+thumb+'</div>'+
      '<div class="meta"><div class="nm">'+d.name+'</div>'+
      '<div class="id">'+d.en+'</div>'+
      '<div class="sz">'+d.footprint[0]+'×'+d.footprint[1]+'m · H'+d.height+'</div></div>'+
      '<span class="dot"></span></div>';
  }).join('');
  $('assetList').querySelectorAll('.card').forEach(function(c){
    c.onclick=function(){
      currentId=c.dataset.id;
      if(viewMode!=='single') setView('single'); else showSingle(currentId);
    };
  });
  $('listCount').textContent='显示 '+arr.length+' / '+NUC.list().length+' 组资产';
  $('statCount').textContent=NUC.list().length;
  markList();
}
function markList(){
  document.querySelectorAll('#assetList .card').forEach(function(c){
    c.classList.toggle('on',viewMode==='single' && c.dataset.id===currentId);
  });
}

/* ---------------- 属性面板 ---------------- */
function renderInspector(d){
  var img=REFS[d.refKey];
  $('inspHero').innerHTML=(img?'<img src="'+img+'" alt="参考照片">':'<div class="fallback">NUC 3D ASSET · '+CATNAME[d.category]+'</div>')+
    '<div class="tag">'+CATNAME[d.category]+'</div>'+
    (img?'<div class="refhint">官方照片参考</div>':'');
  $('inspName').textContent=d.name;
  $('inspEn').textContent=d.en+' · NUC ASSET';
  $('inspSpec').innerHTML=
    '<div><span>占地 宽×深</span><b>'+d.footprint[0]+' × '+d.footprint[1]+' m</b></div>'+
    '<div><span>建筑高度</span><b>'+d.height+' m</b></div>'+
    '<div><span>层数</span><b>'+(d.floors||'—')+' F</b></div>'+
    '<div><span>年代</span><b>'+(d.year||'—')+'</b></div>'+
    '<div><span>坐标 X / Z</span><b>'+d.pos[0]+' / '+d.pos[2]+'</b></div>'+
    '<div><span>单位 / 朝向</span><b>1m / +Z</b></div>';
  $('inspDesc').textContent=d.desc;
  $('inspFeat').innerHTML=(d.features||[]).map(function(f){ return '<i>'+f+'</i>'; }).join('');
  $('inspCode').innerHTML='<button class="copy" data-copy="code">复制</button>'+
    '<span class="k">const</span> b = NUCBuildings.create(\'<span class="k">'+d.en+'</span>\');\n'+
    'b.position.set(<span class="k">'+d.pos[0]+'</span>, 0, <span class="k">'+d.pos[2]+'</span>);\n'+
    'scene.add(b);';
  $('inspPos').innerHTML='<button class="copy" data-copy="pos">复制</button>'+
    '{ id: <span class="k">"'+d.en+'"</span>,\n'+
    '  position: { x: <span class="k">'+d.pos[0]+'</span>, y: 0, z: <span class="k">'+d.pos[2]+'</span> },\n'+
    '  rotationY: <span class="k">'+(d.rot||0)+'</span> }';
  bindCopy();
}
function bindCopy(){
  document.querySelectorAll('.copy').forEach(function(b){
    b.onclick=function(){
      var el=b.dataset.copy==='code'?$('inspCode'):$('inspPos');
      var txt=el.textContent.replace(/复制/g,'').trim();
      navigator.clipboard && navigator.clipboard.writeText(txt);
      toast('代码已复制到剪贴板');
    };
  });
}
function renderCampusInspector(){
  $('inspHero').innerHTML='<div class="fallback">NUC CAMPUS · 整校沙盘</div><div class="tag">整校布局</div>';
  $('inspName').textContent='中北大学 · 整校布局';
  $('inspEn').textContent='CAMPUS / '+NUC.list().length+' ASSETS';
  $('inspSpec').innerHTML=
    '<div><span>校园范围</span><b>660 × 620 m</b></div>'+
    '<div><span>资产数量</span><b>'+NUC.list().length+' 组</b></div>'+
    '<div><span>圈层结构</span><b>内环教学 / 外环生活</b></div>'+
    '<div><span>轴线</span><b>南北发展 + 东西礼仪</b></div>'+
    '<div><span>单位 / 朝向</span><b>1m / +Z</b></div>'+
    '<div><span>导出格式</span><b>GLB / JSON</b></div>';
  $('inspDesc').textContent='按「内环教学区、外环生活区」的圈层格局布置：南北中轴自一道门、德怀广场、行知广场、教学主楼、兵器科学大楼、图书馆延伸到新北区兵器陈列馆；西侧为二龙山、柏林园与红房子老建筑，东侧为真草坪主体育场、篮球场与体育馆，南侧为 1936 铁路主题公园与生活服务区。点击左侧任一建筑可回到单栋预览。';
  $('inspFeat').innerHTML=['南北礼仪中轴','东西发展轴','教学核心区','外环生活区','二龙山与柏林园','真草坪体育场','1936 铁路公园','兵器陈列馆'].map(function(f){ return '<i>'+f+'</i>'; }).join('');
  $('inspCode').innerHTML='<button class="copy" data-copy="code">复制</button>'+
    '<span class="k">const</span> campus = NUCBuildings.createCampus();\n'+
    'campus.scale.setScalar(<span class="k">1.0</span>);\n'+
    'scene.add(campus);\n\n'+
    '<span class="k">//</span> 或读布局表逐栋生成\n'+
    '<span class="k">const</span> cfg = NUCBuildings.layout();';
  $('inspPos').innerHTML='<button class="copy" data-copy="pos">复制</button>'+
    '{ origin: <span class="k">[0, 0, 0]</span>,\n'+
    '  extent: { w: <span class="k">660</span>, d: <span class="k">620</span> },\n'+
    '  axis: <span class="k">"Z (S-N)"</span>,\n'+
    '  assets: <span class="k">'+NUC.list().length+'</span> }';
  bindCopy();
  markList();
}

/* ---------------- 导出 ---------------- */
function download(blob,filename){
  var url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); },1500);
}
/* 程序化 CanvasTexture 在 glTF 导出中不稳定且会丢失平铺，
   导出前统一替换为纯色材质，得到干净的「纯几何 + 纯色」GLB */
function prepare(group){
  var swapped=[];
  group.traverse(function(o){
    if(o.isMesh && o.material && o.material.map){
      var hex=o.material.color?o.material.color.getHex():0xffffff;
      if(hex===0xffffff) hex=0x9a9484;
      if(o.material.isMeshBasicMaterial) hex=0xb83a2f;
      swapped.push({mesh:o,mat:o.material});
      o.material=new THREE.MeshStandardMaterial({color:hex,roughness:0.85,side:THREE.DoubleSide});
    }
  });
  return swapped;
}
function restore(swapped){
  swapped.forEach(function(s){ s.mesh.material=s.mat; });
}
function glbOf(group){
  return new Promise(function(resolve,reject){
    var swapped=prepare(group);
    try{
      var ex=new THREE.GLTFExporter();
      ex.parse(group,function(result){
        restore(swapped);
        resolve(result);
      },{binary:true,onlyVisible:true});
    }catch(e){ restore(swapped); reject(e); }
  });
}
function exportCurrent(){
  var def=NUC.get(currentId);
  if(viewMode==='campus'){ toast('当前处于整校视图，请点击「整校 GLB」'); return; }
  busy(true,'正在导出 '+def.en+'.glb …');
  var g=NUC.create(currentId);
  glbOf(g).then(function(buf){
    download(new Blob([buf],{type:'model/gltf-binary'}),'NUC_'+def.en+'.glb');
    NUC.dispose(g); busy(false); toast('已导出 '+def.name+' 的 GLB 模型');
  }).catch(function(e){ console.error(e); busy(false); toast('导出失败：'+e.message); });
}
function exportCampus(){
  busy(true,'正在导出整校 GLB（体量较大，请稍候）…');
  var g=NUC.createCampus({ground:true});
  glbOf(g).then(function(buf){
    download(new Blob([buf],{type:'model/gltf-binary'}),'NUC_Campus_All.glb');
    NUC.dispose(g); busy(false); toast('整校 GLB 已导出（'+(buf.byteLength/1048576).toFixed(2)+' MB）');
  }).catch(function(e){ console.error(e); busy(false); toast('导出失败：'+e.message); });
}
function exportJSON(){
  var data=JSON.stringify(NUC.layout(),null,2);
  download(new Blob([data],{type:'application/json'}),'NUC_campus_layout.json');
  toast('布局 JSON 已导出，含全部建筑的坐标与尺寸');
}
function exportZip(){
  if(typeof JSZip==='undefined'){ toast('批量导出组件未加载'); return; }
  var list=NUC.list(), zip=new JSZip(), i=0;
  busy(true,'批量导出 0 / '+list.length+' …');
  function step(){
    if(i>=list.length){
      $('busyText').textContent='正在打包 ZIP …';
      zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:5}}).then(function(blob){
        download(blob,'NUC_Buildings_All.zip');
        busy(false); toast('已打包 '+list.length+' 个 GLB 模型');
      }).catch(function(e){ busy(false); toast('打包失败：'+e.message); });
      return;
    }
    var d=list[i];
    $('busyText').textContent='批量导出 '+(i+1)+' / '+list.length+' · '+d.name;
    var g=NUC.create(d.id);
    glbOf(g).then(function(buf){
      zip.file('NUC_'+d.en+'.glb',buf);
      NUC.dispose(g); i++; setTimeout(step,0);
    }).catch(function(e){
      console.warn('跳过',d.en,e); NUC.dispose(g); i++; setTimeout(step,0);
    });
  }
  step();
}

/* ---------------- 指南 ---------------- */
function showGuide(){
  $('modalTitle').textContent='把建筑放进你的「城市自由人」';
  $('modalLead').textContent='资产库使用 1 单位 = 1 米、原点在建筑地面中心、正立面朝 +Z。下面按你的项目类型选一种接入方式。';
  $('modalBody').innerHTML=
    '<h4>方式 A · Three.js 网页游戏（推荐，最省事）</h4>'+
    '<p>把 <b>nuc-buildings.js</b> 放到项目里，在 three.js 之后引入：</p>'+
    '<div class="code">&lt;script src="three.min.js"&gt;&lt;/script&gt;\n&lt;script src="nuc-buildings.js"&gt;&lt;/script&gt;\n\n<span class="k">const</span> lib = NUC.create(<span class="k">"library"</span>);\nlib.position.set(120, 0, -80);\nscene.add(lib);\n\n<span class="k">//</span> 或者一次性摆好整校\nscene.add(NUC.createCampus());</div>'+
    '<h4>方式 B · 打包器 / ES Module</h4>'+
    '<div class="code"><span class="k">import</span> * <span class="k">as</span> THREE <span class="k">from</span> <span class="k">"three"</span>;\n<span class="k">const</span> NUC = <span class="k">require</span>(<span class="k">"./nuc-buildings.js"</span>);\n<span class="k">const</span> gate = NUC.create(<span class="k">"south-gate"</span>);</div>'+
    '<p style="margin-top:8px">模块是 UMD 格式，同时支持 window 全局、CommonJS 与 AMD。</p>'+
    '<h4>方式 C · Unity / Godot / Blender / 其他引擎</h4>'+
    '<p>在工坊里点「导出当前 GLB」或「批量 ZIP」，把 .glb 直接拖进引擎即可。GLB 内嵌了材质与几何，模型的 <b>extras</b> 里还带建筑名称、尺寸和坐标元数据。</p>'+
    '<h4>尺寸与摆放建议</h4>'+
    '<ul>'+
      '<li>校园整体约 660 × 620 米，按你的城市地块比例整体缩放即可（例如 <b>root.scale.setScalar(0.1)</b>）。</li>'+
      '<li>布局坐标在 <b>布局 JSON</b> 里，可直接读表批量生成，不必手填。</li>'+
      '<li>单栋模型原点在地面中心，正面朝 +Z；旋转建筑请改 <b>rotation.y</b>（弧度）。</li>'+
      '<li>「street-lamp」「campus-tree」「flagpole」是独立小构件，适合用 InstancedMesh 批量铺设。</li>'+
      '<li>夜间亮窗：<b>NUC.setNight(true)</b> 会把所有玻璃材质切换为发光状态。</li>'+
    '</ul>'+
    '<h4>关于精度</h4>'+
    '<p>模型依据中北大学官网与基建部公开照片的造型特征程序化重建（主楼竖肋与蓝玻璃幕墙、图书馆双弧形书卷体量等），并结合公开的校园格局布置，属于<b>可用于游戏的风格化还原，不是测绘级 1:1 复原</b>。如果你手上有校园 CAD、总平面图或倾斜摄影模型，可以替换对应建筑的 build 函数，保持 id / pos / footprint 不变即可无缝替换。</p>';
  $('modal').classList.remove('hidden');
}

/* ---------------- 事件绑定 ---------------- */
function bindUI(){
  document.querySelectorAll('#segView button').forEach(function(b){
    b.onclick=function(){ setView(b.dataset.v); };
  });
  document.querySelectorAll('#segLight button').forEach(function(b){
    b.onclick=function(){ applyLight(b.dataset.l); };
  });
  $('search').oninput=function(){ keyword=this.value; renderList(); };
  $('btnGrid').onclick=function(){
    this.classList.toggle('on');
    gridHelper.visible=this.classList.contains('on') && viewMode==='single';
  };
  $('btnSpin').onclick=function(){ orbit.auto=!orbit.auto; this.classList.toggle('on',orbit.auto); };
  $('btnReset').onclick=function(){
    if(viewMode==='campus'){ orbit.dist=700; orbit.target.set(0,20,0); orbit.pitch=0.72; orbit.yaw=0.62; }
    else fitCamera(NUC.get(currentId));
    updateCamera(); toast('相机已复位');
  };
  $('btnGLB').onclick=exportCurrent;
  $('btnGLBAll').onclick=exportCampus;
  $('btnJSON').onclick=exportJSON;
  $('btnZip').onclick=exportZip;
  $('btnGuide').onclick=showGuide;
  $('modalClose').onclick=function(){ $('modal').classList.add('hidden'); };
  $('modal').onclick=function(e){ if(e.target===this) this.classList.add('hidden'); };
  $('introStart').onclick=function(){ $('intro').classList.add('hidden'); };
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape') $('modal').classList.add('hidden');
    if(e.key==='g'||e.key==='G') exportCurrent();
    if(e.key==='r'||e.key==='R') $('btnReset').click();
  });
}

/* ---------------- 启动 ---------------- */
function boot(){
  if(!NUC){ document.body.innerHTML='<p style="padding:40px;color:#fff">资产模块未加载</p>'; return; }
  /* 可用 ?asset=library&view=campus&light=night&skipintro 直接定位（便于分享与自动化预览） */
  var qs=new URLSearchParams(location.search);
  var a=qs.get('asset'); if(a && NUC.get(a)) currentId=a;
  if(qs.has('skipintro')) $('intro').classList.add('hidden');
  initScene();
  renderCats();
  renderList();
  bindUI();
  var lm=qs.get('light'); if(lm && ['day','dusk','night'].indexOf(lm)>=0) applyLight(lm);
  setView(qs.get('view')==='campus'?'campus':'single');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();

})();
