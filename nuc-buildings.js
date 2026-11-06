/* ==========================================================================
 * 中北大学 3D 建筑资产库  NUC Buildings  v2.0.0
 * --------------------------------------------------------------------------
 * 依据中北大学官方校园平面图与官网建筑照片重建（非测绘级复原）
 * 用法（浏览器）：
 *   <script src="three.min.js"></script>
 *   <script src="nuc-buildings.js"></script>
 *   const b = NUCBuildings.create('library');
 *   scene.add(b);
 * 约定：1 单位 = 1 米；原点 = 建筑地面中心；正立面朝 +Z；Y 轴向上。
 * API：list / get / create / createCampus / campusGround / layout /
 *      setNight / isNight / materials / dispose
 * ========================================================================== */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(typeof THREE !== 'undefined' ? THREE : require('three'));
  } else if (typeof define === 'function' && define.amd) {
    define(['three'], factory);
  } else {
    root.NUCBuildings = factory(root.THREE);
  }
})(typeof self !== 'undefined' ? self : this, function (THREE) {
  'use strict';
/* ============================================================
 * 中北大学 3D 建筑资产库 —— 核心：材质 / 几何工具 / 资产目录
 * 所有模型单位 = 米，原点 = 建筑地面中心，正立面朝 +Z（南）
 * 仅使用 MeshStandardMaterial / MeshBasicMaterial + 合并几何，
 * 保证可被 GLTFExporter 无损导出为 GLB。
 * ============================================================ */

var C = {
  concrete:0xd8d5ca, warm:0xcbc5b5, white:0xeeece5, stone:0xbdb9ac,
  dark:0x333a38, dark2:0x242b29, brick:0x9c4a37, brick2:0x87402f,
  glass:0x2b4b5e, glassBlue:0x3b74a6, glassGreen:0x1f443a, glassLit:0x8fb9c9,
  metal:0xa3adaa, steel:0xd7dcd8, gold:0xc8a04a, bronze:0x6d6141,
  roof:0x515a60, roofRed:0x7a3a2e, grass:0x4a783c, grass2:0x3d6b36,
  track:0xa9503d, plaza:0x7c7869, road:0x4a514c, water:0x3f7f96,
  rock:0x8a8b80, soil:0x6b5c46, pink:0xc98f8a
};

function M(color, rough, metal, extra){
  var o = { color:color, roughness:(rough===undefined?0.84:rough), metalness:(metal||0) };
  if(extra) for(var k in extra) o[k]=extra[k];
  return new THREE.MeshStandardMaterial(o);
}

var MAT = {
  wall:      M(C.concrete),
  wallWarm:  M(C.warm),
  wallWhite: M(C.white),
  wallStone: M(C.stone),
  darkBase:  M(C.dark, 0.9),
  darkBase2: M(C.dark2, 0.9),
  brick:     M(C.brick, 0.95),
  brick2:    M(C.brick2, 0.95),
  roof:      M(C.roof, 0.75),
  roofRed:   M(C.roofRed, 0.9),
  metal:     M(C.metal, 0.42, 0.55),
  steel:     M(C.steel, 0.38, 0.5),
  gold:      M(C.gold, 0.35, 0.65),
  bronze:    M(C.bronze, 0.55, 0.55),
  stone:     M(C.stone, 0.95),
  grass:     M(C.grass, 1),
  grass2:    M(C.grass2, 1),
  track:     M(C.track, 1),
  plaza:     M(C.plaza, 1),
  road:      M(C.road, 1),
  water:     M(0x2f6b82, 0.2, 0.2),
  rock:      M(C.rock, 1),
  soil:      M(C.soil, 1),
  whiteLine: M(C.white, 1),
  treeTrunk: M(0x59452f, 1),
  leaf:      M(0x3f7440, 1),
  leaf2:     M(0x52894a, 1),
  pine:      M(0x315c39, 1),
  glass:     M(C.glass, 0.16, 0.42, { side:THREE.DoubleSide }),
  glassBlue: M(C.glassBlue, 0.12, 0.5, { side:THREE.DoubleSide }),
  glassGreen:M(C.glassGreen, 0.2, 0.38, { side:THREE.DoubleSide }),
  glassLite: M(C.glassLit, 0.18, 0.3, { side:THREE.DoubleSide })
};

/* 夜间只让普通窗与浅色玻璃发光，蓝/绿玻璃幕墙保持本色 */
var WINDOW_MATS = [MAT.glass, MAT.glassLite];

/* 程序化地面纹理：避免大面积纯色平面显得粗糙 */
function surfaceTexture(kind){
  if(typeof document==='undefined') return null;
  var cv=document.createElement('canvas'); cv.width=cv.height=128;
  var c=cv.getContext('2d');
  if(kind==='plaza'){
    c.fillStyle='#706c5e'; c.fillRect(0,0,128,128);
    c.strokeStyle='rgba(58,54,46,.34)'; c.lineWidth=1.6;
    for(var i=0;i<=128;i+=32){
      c.beginPath(); c.moveTo(i,0); c.lineTo(i,128); c.stroke();
      c.beginPath(); c.moveTo(0,i); c.lineTo(128,i); c.stroke();
    }
    for(var p=0;p<90;p++){ c.fillStyle='rgba(255,255,255,.035)'; c.fillRect(Math.random()*128,Math.random()*128,3,2); }
  }else if(kind==='grass'){
    c.fillStyle='#3e6b32'; c.fillRect(0,0,128,128);
    for(var k=0;k<460;k++){
      c.fillStyle=Math.random()<0.5?'rgba(24,54,22,.16)':'rgba(152,190,110,.11)';
      c.fillRect(Math.random()*128,Math.random()*128,2+Math.random()*3,1+Math.random()*2);
    }
  }else{
    c.fillStyle='#424943'; c.fillRect(0,0,128,128);
    for(var n=0;n<180;n++){ c.fillStyle='rgba(255,255,255,.035)'; c.fillRect(Math.random()*128,Math.random()*128,2,1); }
  }
  var t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.anisotropy=4;
  return t;
}

/* 夜间亮窗：只改这几个共享材质，不污染墙体 */
var nightOn = false;
function setNight(on){
  nightOn = !!on;
  var glow = on ? 0xffcc70 : 0x000000;
  WINDOW_MATS.forEach(function(m){
    m.emissive.setHex(glow);
    m.emissiveIntensity = on ? 0.55 : 0;
    m.needsUpdate = true;
  });
}

/* ---------- 合并四边形批次：所有窗户合成 1 个 mesh，导出友好 ---------- */
function QB(){ this.p=[]; this.n=[]; this.u=[]; this.i=[]; this.c=0; }
QB.prototype.q = function(a,b,c,d,nrm){
  var i=this.c;
  this.p.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2], d[0],d[1],d[2]);
  for(var k=0;k<4;k++) this.n.push(nrm[0],nrm[1],nrm[2]);
  this.u.push(0,0, 1,0, 1,1, 0,1);
  this.i.push(i,i+1,i+2, i,i+2,i+3);
  this.c+=4;
};
QB.prototype.mesh = function(material){
  if(!this.c) return null;
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',   new THREE.Float32BufferAttribute(this.n,3));
  g.setAttribute('uv',       new THREE.Float32BufferAttribute(this.u,2));
  g.setIndex(this.i);
  g.computeBoundingSphere();
  var m = new THREE.Mesh(g, material);
  m.castShadow = false; m.receiveShadow = true;
  return m;
};

/* 在立面上铺窗格。face: front(+Z) / back(-Z) / right(+X) / left(-X) */
function gridWindows(qb, o){
  var isZ = (o.face==='front' || o.face==='back');
  var span = isZ ? o.w : o.d;
  var fixed = (isZ ? o.d : o.w)/2 + (o.lift===undefined?0.055:o.lift);
  var s = (o.face==='front' || o.face==='right') ? 1 : -1;
  var skip = o.skip || function(){ return false; };
  for(var f=0; f<o.floors; f++){
    for(var c=0; c<o.cols; c++){
      if(skip(f,c)) continue;
      var y1 = o.y0 + f*o.floorH, y2 = y1 + o.winH;
      var along = -span/2 + (c+0.5)*(span/o.cols);
      var a1 = along - o.winW/2, a2 = along + o.winW/2;
      if(isZ){
        var z = s*fixed;
        qb.q([a1,y1,z],[a2,y1,z],[a2,y2,z],[a1,y2,z],[0,0,s]);
      }else{
        var x = s*fixed;
        qb.q([x,y1,a1],[x,y1,a2],[x,y2,a2],[x,y2,a1],[s,0,0]);
      }
    }
  }
}

/* ---------- 基础构件 ---------- */
function box(g,w,h,d,x,y,z,m,o){
  o=o||{};
  var me = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  me.position.set(x,y,z);
  if(o.rx) me.rotation.x=o.rx;
  if(o.ry) me.rotation.y=o.ry;
  if(o.rz) me.rotation.z=o.rz;
  me.castShadow = (o.cast!==false);
  me.receiveShadow = true;
  if(o.name) me.name=o.name;
  g.add(me); return me;
}
function cyl(g,rt,rb,h,seg,x,y,z,m,o){
  o=o||{};
  var me = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12), m);
  me.position.set(x,y,z);
  if(o.rx) me.rotation.x=o.rx;
  if(o.rz) me.rotation.z=o.rz;
  if(o.ry) me.rotation.y=o.ry;
  me.castShadow=(o.cast!==false); me.receiveShadow=true;
  g.add(me); return me;
}
function sphere(g,r,x,y,z,m,seg){
  var me = new THREE.Mesh(new THREE.SphereGeometry(r,seg||12,Math.max(8,(seg||12)/2)), m);
  me.position.set(x,y,z); me.castShadow=true; me.receiveShadow=true;
  g.add(me); return me;
}
function cone(g,r,h,x,y,z,m,seg){
  var me = new THREE.Mesh(new THREE.ConeGeometry(r,h,seg||10), m);
  me.position.set(x,y,z); me.castShadow=true; me.receiveShadow=true;
  g.add(me); return me;
}
function flat(g,w,d,x,y,z,m,o){
  o=o||{};
  var me=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);
  me.rotation.x=-Math.PI/2;
  if(o.ry) me.rotateOnWorldAxis(new THREE.Vector3(0,1,0),o.ry);
  me.position.set(x,y,z);
  me.receiveShadow=true;
  g.add(me); return me;
}
/* 人字坡屋顶 */
function gableRoof(g,w,d,h,x,y,z,m,over){
  over=over||1.2;
  var slope=Math.atan2(h,d/2);
  var len=Math.sqrt((d/2+over)*(d/2+over)+h*h);
  var e=box(g,w+over*2,0.5,len,x,y+h/2,z-d/4-over/2,m,{rx:-slope});
  var e2=box(g,w+over*2,0.5,len,x,y+h/2,z+d/4+over/2,m,{rx:slope});
  return [e,e2];
}
/* 一排柱子 + 檐口 */
function colonnade(g,n,span,y,h,r,m,z,depth){
  for(var i=0;i<n;i++){
    var x=-span/2+span/(n-1)*i;
    cyl(g,r,r*0.94,h,10,x,y+h/2,z,m);
    box(g,r*2.7,0.45,r*2.7,x,y+h,z,m);
  }
  box(g,span+r*3,1.1,(depth||r*3),0,y+h+0.9,z,MAT.wallWhite);
}
/* 台阶 */
function stairs(g,w,d,steps,x,z,m,rise){
  rise=rise||0.28;
  for(var i=0;i<steps;i++){
    box(g,w,rise,d/steps,x,rise*(i+0.5),z-d/2+d/steps*(i+0.5),m,{cast:false});
  }
}
/* 文字牌（CanvasTexture，可导出 GLB） */
function sign(g,text,w,h,x,y,z,color,bg,ry){
  if(typeof document==='undefined') return null;
  var cv=document.createElement('canvas'); cv.width=512; cv.height=128;
  var c=cv.getContext('2d');
  if(bg){ c.fillStyle=bg; c.fillRect(0,0,512,128); }
  c.font='bold 76px "Microsoft YaHei","PingFang SC",sans-serif';
  c.textAlign='center'; c.textBaseline='middle';
  c.fillStyle=color||'#b83a2f';
  c.fillText(text,256,66);
  var tex=new THREE.CanvasTexture(cv);
  tex.anisotropy=4;
  var m=new THREE.MeshBasicMaterial({map:tex,transparent:!bg,side:THREE.DoubleSide,depthWrite:!!bg});
  var me=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);
  me.position.set(x,y,z); if(ry) me.rotation.y=ry;
  g.add(me); return me;
}
/* 树 */
function tree(g,x,z,s,kind,y0){
  s=s||1; y0=y0||0;
  var t=cyl(g,0.28*s,0.38*s,3.2*s,7,x,y0+1.6*s,z,MAT.treeTrunk);
  if(kind==='pine'){
    cone(g,2.1*s,4.2*s,x,y0+4.4*s,z,MAT.pine,9);
    cone(g,1.6*s,3.4*s,x,y0+6.2*s,z,MAT.pine,9);
  }else{
    var m=sphere(g,2.5*s,x,y0+5.1*s,z,MAT.leaf,10);
    m.scale.set(1,0.86,1);
    sphere(g,1.7*s,x-1.2*s,y0+4.5*s,z+0.7*s,MAT.leaf2,9);
  }
  return t;
}
/* 路灯 */
function lamp(g,x,z,s){
  s=s||1;
  cyl(g,0.13*s,0.19*s,7*s,8,x,3.5*s,z,MAT.metal);
  var arm=box(g,2.0*s,0.14*s,0.14*s,x+0.9*s,7*s,z,MAT.metal);
  var bulb=box(g,1.0*s,0.28*s,0.55*s,x+1.75*s,6.88*s,z,MAT.glassLite,{cast:false});
  return bulb;
}
/* 通用板楼：floors 层，带窗格 / 女儿墙 / 屋顶设备 */
function slabBuilding(g,cfg){
  var w=cfg.w,d=cfg.d,floors=cfg.floors,fh=cfg.fh||3.6,h=floors*fh;
  var wall=cfg.wall||MAT.wall, glass=cfg.glass||MAT.glass;
  var base=cfg.base===undefined?0.8:cfg.base;
  box(g,w,h,d,0,h/2+base,0,wall);
  if(base>0) box(g,w+0.6,base,d+0.6,0,base/2,0,cfg.baseMat||MAT.darkBase);
  var qb=new QB();
  var cols=Math.max(3,Math.round(w/ (cfg.bay||4.2)));
  var winW=Math.min(cfg.winW||2.4,(w/cols)*0.62);
  var gy=base+(cfg.y0||1.2);
  ['front','back','left','right'].forEach(function(face){
    gridWindows(qb,{
      face:face,w:w,d:d,y0:gy,floors:floors,floorH:fh,
      cols:(face==='front'||face==='back')?cols:Math.max(2,Math.round(d/4.2)),
      winW:winW,winH:cfg.winH||2.1,lift:0.06
    });
  });
  var wm=qb.mesh(glass); if(wm) g.add(wm);
  /* 楼层腰线 */
  if(cfg.bands!==false){
    for(var f=1;f<floors;f++){
      var yy=base+f*fh;
      box(g,w+0.18,0.16,d+0.18,0,yy,0,MAT.wallWhite,{cast:false});
    }
  }
  /* 女儿墙 */
  if(cfg.parapet!==false){
    box(g,w+0.5,0.9,0.35,0,h+base+0.45,d/2,MAT.wallWhite,{cast:false});
    box(g,w+0.5,0.9,0.35,0,h+base+0.45,-d/2,MAT.wallWhite,{cast:false});
    box(g,0.35,0.9,d+0.5,w/2,h+base+0.45,0,MAT.wallWhite,{cast:false});
    box(g,0.35,0.9,d+0.5,-w/2,h+base+0.45,0,MAT.wallWhite,{cast:false});
  }
  return h+base;
}

/* ============================================================
 * 资产目录：pos 为整校布局建议坐标（X 东 / Z 南，单位米）
 * ============================================================ */
/* 资产目录已迁移至 catalog.js（依据官方校园平面图） */

/* ============================================================
 * 中北大学真实校园布局
 * 依据：中北大学本科招生信息网《中北大学校园图》高清原图
 *       （16536×12599，已逐块核对楼名与方位）
 * 坐标：X 向东 / Z 向南 / +Y 向上，1 单位 = 1 米，北 = -Z
 * 格局：二龙山与汾河在西；铁路斜穿中南部；
 *       教学核心区居北中部；文瀛苑宿舍区在西北；文韬苑在东北；
 *       德怀广场与一道门在西南；怡丁苑与学术交流中心在铁路南。
 * ============================================================ */

var CATALOG = [];
function A(o){
  CATALOG.push({
    id:o.id, name:o.name, en:o.en||o.id,
    category:o.cat||'teaching', pos:o.pos, rot:o.rot||0,
    footprint:o.size, height:o.h||14, floors:o.f||0, year:o.year||0,
    desc:o.desc||'', features:o.feat||[],
    style:o.style||null, v:o.v||null,
    refKey:o.refKey||null, ref:o.ref||null
  });
}
/* 批量楼群（宿舍 / 教学楼），按真实网格排列 */
function grid(prefix,label,cfg){
  var n=0;
  for(var r=0;r<cfg.rows;r++) for(var c=0;c<cfg.cols;c++){
    n++;
    A({
      id:prefix+'-'+n, name:label+n+(cfg.suffix||'号公寓'),
      cat:cfg.cat||'life', pos:[cfg.x+c*cfg.dx,0,cfg.z+r*cfg.dz],
      size:cfg.size, h:cfg.h||21, f:cfg.f||6, year:cfg.year||2005,
      style:cfg.style, v:cfg.v||null,
      desc:(cfg.desc||label)+'，'+ (cfg.f||6) +' 层板式建筑，位于'+(cfg.area||'校园生活区')+'，成排布局形成连续街廓。',
      feat:cfg.feat||['板式楼','连续阳台','重复开间']
    });
  }
}

/* ---------------- 教学核心区（中部偏北） ---------------- */
A({id:'main-building',name:'教学主楼（11号楼）',cat:'teaching',pos:[80,0,-120],size:[88,46],h:60,f:13,year:2004,
  refKey:'main',ref:'refs/教学主楼.jpg',
  desc:'2004 年竣工，又称 11 号教学楼，建成时为山西省体量最大、层数最高的教学楼。校园图上位于图书馆东侧、中央大道北侧，南面正对行知广场。按官网照片复刻米灰竖向窗肋、中央蓝色玻璃幕墙、楼顶红色校名与悬挑格栅帽檐、白色大雨棚柱廊及宽台阶。',
  feat:['米灰竖向窗肋','中央蓝玻璃幕墙','楼顶红色校名','悬挑格栅帽檐','大雨棚柱廊','宽台阶']});
A({id:'library',name:'图书馆',cat:'teaching',pos:[-20,0,-150],size:[120,62],h:28,f:6,year:2006,
  refKey:'lib1',ref:'refs/图书馆-正面.jpg',
  desc:'2002 年始建、2006 年竣工，约 4.67 万平方米，华北地区规模最大的高校图书馆之一。校园图上位于教学主楼西侧、田径运动场东北。造型取展开的书卷：左右两个弧形竖肋体量、中部蓝色玻璃中庭、顶部白色空间钢桁架玻璃屋面。',
  feat:['双弧形书卷体量','深绿玻璃竖缝','蓝色玻璃中庭','钢桁架屋面','黑色石材基座']});
A({id:'hongxue-12',name:'12号楼（鸿学楼）',cat:'teaching',pos:[-150,0,-160],size:[52,22],h:22,f:6,year:1995,style:'teach-slab',
  desc:'12 号教学楼，又名鸿学楼，原老图书馆，现为音乐系等单位使用。校园图上在图书馆西侧。',feat:['原老图书馆','古典窗套','中部入口']});
A({id:'ruixue',name:'瑞学楼',cat:'teaching',pos:[-20,0,-215],size:[56,22],h:20,f:5,year:2000,style:'teach-slab',
  desc:'瑞学楼，位于图书馆北侧、9 号实验大楼西侧的教学楼。',feat:['板式教学楼','规则窗格']});
A({id:'exp-9',name:'9号楼（实验教学楼）',cat:'teaching',pos:[80,0,-205],size:[70,26],h:29,f:7,year:2000,style:'teach-glass',
  desc:'9 号楼又名实验教学楼，位于 1 号楼正后方，是大学物理等基础实验教学的主要场地。',feat:['实验楼大体量','竖向线条','屋顶设备层']});
A({id:'huixue-1',name:'1号楼（慧学楼）',cat:'teaching',pos:[160,0,-205],size:[52,20],h:18,f:5,year:1990,style:'teach-slab',
  desc:'1 号楼又名慧学楼，位于主楼与东区之间中央大道北侧，紧邻旧 1 号楼；多用于小班课与大一工程制图绘图课。',feat:['小班教学楼','规则开间']});
A({id:'old-1',name:'旧1号楼（J1）',cat:'teaching',pos:[160,0,-170],size:[30,14],h:8,f:2,year:1980,style:'teach-slab',
  desc:'紧邻慧学楼的两层旧教学楼，仅三个教室，是校园里保留的早期教学建筑。',feat:['两层小楼','早期建筑']});
A({id:'software-college',name:'软件学院 / 炮库',cat:'teaching',pos:[160,0,-105],size:[42,26],h:18,f:5,year:2005,style:'teach-glass',
  desc:'校园图上位于主楼东侧、行知广场东北的软件学院与实验用房组团。',feat:['现代实验室','玻璃幕墙']});
A({id:'yifu',name:'逸夫楼',cat:'teaching',pos:[160,0,-50],size:[44,28],h:32,f:9,year:2002,style:'yifu',
  refKey:'yifu',ref:'refs/逸夫楼.jpg',
  desc:'邵逸夫先生捐资建设的逸夫楼，米黄色高层，立面上有竖排「逸夫楼」大字，白色框架与入口雨棚，是校园东侧的标志性教学楼。',
  feat:['米黄高层','竖排楼名','白色框架','入口雨棚']});
A({id:'minxue-10',name:'10号楼（敏学楼）',cat:'teaching',pos:[165,0,-20],size:[48,20],h:18,f:5,year:2000,style:'teach-slab',
  desc:'10 号楼敏学楼，位于文韬苑宿舍区西侧、东环路边。',feat:['板式教学楼']});
A({id:'teaching-17',name:'教学楼17号楼',cat:'teaching',pos:[165,0,-155],size:[42,18],h:16,f:4,year:2008,style:'teach-slab',
  desc:'东区新建教学楼之一，位于文韬苑公寓区西侧。',feat:['东区教学楼']});
A({id:'teaching-18',name:'教学楼18号楼',cat:'teaching',pos:[165,0,-185],size:[42,18],h:16,f:4,year:2008,style:'teach-slab',
  desc:'东区新建教学楼之一，与 17 号楼成组布置。',feat:['东区教学楼']});

/* ---------------- 西南：德怀广场与老教学楼群 ---------------- */
A({id:'dehuai-square',name:'德怀广场 · 彭德怀骑马铜像',cat:'landmark',pos:[-200,0,235],size:[76,76],h:12,year:2010,
  desc:'校园图上位于西南角一道门内侧，圆形广场中央为 2010 年落成的 7.6 米「横刀立马」彭德怀骑马青铜塑像，四角由 7 号楼德怀楼的四翼环抱。',
  feat:['圆形广场','骑马铜像','四翼环抱','一道门对景']});
A({id:'dehuai-building',name:'德怀楼（7号楼·四翼）',cat:'teaching',pos:[-200,0,235],size:[112,96],h:22,f:6,year:1990,
  refKey:'dehuai',ref:'refs/德怀楼.jpg',
  desc:'以彭德怀元帅命名的 7 号楼，校园图上呈四翼环绕德怀广场的布局。官网照片显示主楼为白色高层、中央黑色玻璃竖带、左侧横向带窗翼楼与低层裙房。',
  feat:['四翼围合广场','白色高层','中央黑玻璃竖带','横窗翼楼','低层裙房']});
A({id:'gongzi-2',name:'2号楼（工字楼）',cat:'teaching',pos:[-215,0,110],size:[48,26],h:16,f:4,year:1980,style:'teach-slab',
  desc:'工字楼，承担学校主要教学任务的老教学楼，平面呈工字形，位于德怀广场北侧。',feat:['工字形平面','老教学楼']});
A({id:'chengxue-3',name:'3号楼（诚学楼）',cat:'teaching',pos:[-270,0,75],size:[40,18],h:16,f:4,year:1985,style:'teach-slab',
  desc:'3 号楼诚学楼，能源与动力工程学院办公室所在地。',feat:['学院办公','板式楼']});
A({id:'chouxue-4',name:'4号楼（酬学楼）',cat:'teaching',pos:[-215,0,70],size:[40,18],h:16,f:4,year:1985,style:'teach-slab',
  desc:'4 号楼酬学楼，位于德怀广场北侧教学楼群中部。',feat:['老教学楼']});
A({id:'mingxue-5',name:'5号楼（明学楼）',cat:'teaching',pos:[-160,0,70],size:[40,18],h:16,f:4,year:1985,style:'teach-slab',
  desc:'5 号楼明学楼，与经济与管理学院相邻。',feat:['老教学楼']});
A({id:'qinxue-8',name:'8号楼（勤学楼）',cat:'teaching',pos:[-270,0,112],size:[40,18],h:16,f:4,year:1985,style:'teach-slab',
  desc:'8 号楼勤学楼，德怀广场北侧教学楼群西端。',feat:['老教学楼']});
A({id:'history-museum',name:'校史馆',cat:'landmark',pos:[-160,0,110],size:[28,18],h:12,f:2,year:2000,style:'teach-slab',
  desc:'校史馆，记录从太行工业学校、太原机械学院、华北工学院到中北大学的办学历程。',feat:['校史陈列','低层建筑']});
A({id:'econ-college',name:'经济与管理学院',cat:'teaching',pos:[-115,0,70],size:[40,18],h:16,f:4,year:1995,style:'teach-slab',
  desc:'经济与管理学院楼，位于德怀广场北侧教学楼群东端。',feat:['学院楼']});
A({id:'humanities-15',name:'15号楼（人文社会科学学院）',cat:'teaching',pos:[-160,0,150],size:[40,18],h:16,f:4,year:1998,style:'teach-slab',
  desc:'15 号楼，人文社会科学学院所在，位于铁路北侧、柏林园东侧。',feat:['学院楼']});

/* ---------------- 西北：二龙山 / 柏林园 / 文瀛苑 ---------------- */
A({id:'erlong-mountain',name:'二龙山',cat:'landscape',pos:[-290,0,-80],size:[90,400],h:36,
  desc:'坐落于校园最西侧、西临汾河，海拔百余米。山上有解放战争时期留下的 3 座碉堡、3 处战壕与地下暗道；益足道、爱心林、怡人台、龙山飞瀑、龙山之巅观景台等由勤工助学学生亲手修建。',
  feat:['起伏山体','龙山之巅观景亭','碉堡','龙山飞瀑','登山步道','松林']});
A({id:'bailin-garden',name:'柏林园',cat:'landscape',pos:[-200,0,150],size:[80,80],h:9,
  desc:'位于二龙山东侧、龙山公园脚下的 4A 级景园，园内大树隐蔽，有喷泉、山泉、长廊与刻着中北大学校歌曲谱的石刻。',
  feat:['水面与喷泉','木长廊','校歌石刻','曲径']});
grid('wenying','文瀛苑',{x:-125,z:40,cols:3,rows:5,dx:45,dz:28,size:[36,14],h:21,f:6,
  style:'dorm-red',area:'校园西北文瀛苑宿舍区',
  desc:'文瀛苑学生公寓组团（校园图上编号 1—21 号），红白相间的六层板式宿舍，成排密布于二龙山与教学区之间。',
  feat:['红白配色','六层板式宿舍','连续阳台','组团网格']});
A({id:'keyi-hall',name:'科艺苑',cat:'landmark',pos:[-140,0,-15],size:[46,34],h:16,f:2,year:2000,
  refKey:'keyi',ref:'refs/科艺苑.jpg',
  desc:'校园文艺活动中心，官网照片为米色门形礼堂：宽大台阶、中央入口、两侧红色门柱配金字、顶部校徽与「科艺苑」三字。晚会与社团活动多在此举行。',
  feat:['门形礼堂','宽台阶','红色门柱','金字招牌']});
A({id:'service-center',name:'生活服务中心',cat:'life',pos:[35,0,65],size:[34,22],h:10,f:2,year:1998,style:'service',
  desc:'生活服务配套用房，含银行、超市、快递等日常服务，与文瀛苑食堂区相邻。',feat:['低层配套','连续店面']});
A({id:'canteen-1',name:'学生一食堂（文瀛餐厅）',cat:'life',pos:[5,0,45],size:[38,26],h:11,f:2,year:2002,style:'canteen',
  desc:'文瀛苑宿舍区的文瀛餐厅，学生称之为「一食堂」，早餐品种丰富，是校园最老牌的食堂之一。',feat:['两层食堂','大玻璃窗','入口雨棚']});
A({id:'canteen-2',name:'学生二食堂（风味餐厅）',cat:'life',pos:[5,0,85],size:[38,26],h:11,f:2,year:2002,style:'canteen',
  desc:'位于文瀛食堂二楼及相邻区域的风味餐厅，以各地风味小吃著称。',feat:['两层食堂','风味档口']});
A({id:'canteen-4',name:'第四食堂',cat:'life',pos:[50,0,45],size:[34,24],h:10,f:2,year:2002,style:'canteen',
  desc:'四食堂，服务文瀛苑东侧宿舍区。',feat:['两层食堂']});
A({id:'bathhouse',name:'澡堂与开水房',cat:'life',pos:[-10,0,115],size:[26,16],h:6,f:1,year:1998,style:'service',
  desc:'校园图上标注的澡堂、开水房与电子阅览室等生活服务设施。',feat:['低层服务建筑']});
A({id:'campus-street',name:'小吃街（一道门—七道门）',cat:'life',pos:[70,0,95],size:[100,14],h:8,f:2,year:2000,
  desc:'中北著名的小吃街自一道门延伸至七道门，天南地北的美食应有尽有；后经整治改为公园绿地。模型以两层连续商铺还原其街道界面。',
  feat:['连续商铺','一层店招','骑楼雨棚']});

/* ---------------- 中部：广场 / 体育场 ---------------- */
A({id:'xingzhi-square',name:'行知广场',cat:'landmark',pos:[80,0,-35],size:[86,58],h:16,year:2004,
  desc:'教学主楼前侧的核心广场，校园图上标为迎新广场，中央有大星形铺装；文艺演出、社团招新常在此举行，南侧设跨越铁路的地下通道。',
  feat:['主楼前广场','星形铺装','国旗杆','阶梯花坛','地下通道口']});
A({id:'stadium',name:'真草坪体育场（田径运动场）',cat:'sport',pos:[-110,0,-30],size:[168,104],h:12,year:2000,
  refKey:'stadium',ref:'refs/真草坪体育场.jpg',
  desc:'太原高校中为数不多的真草足球场，曾承办山西省大中学生运动会。官网照片显示条纹真草坪、红色塑胶跑道、白色看台，以及背景一栋红顶白墙的长条建筑。',
  feat:['真草条纹球场','400米塑胶跑道','白色看台','红顶背景楼','足球门']});
A({id:'gymnasium',name:'体育馆',cat:'sport',pos:[-110,0,-100],size:[62,42],h:16,f:2,year:2002,style:'sport-hall',
  desc:'体育馆位于田径运动场北侧，与篮球场、游泳馆共同构成校园运动区。',feat:['大跨屋面','红顶白墙','入口平台']});
A({id:'swimming',name:'游泳馆 / 健身馆',cat:'sport',pos:[10,0,-250],size:[62,42],h:16,f:1,year:2005,style:'sport-arch',
  refKey:'swim',ref:'refs/游泳馆.jpg',
  desc:'游泳是中北学子的必修课。官网照片显示馆内为拱形钢桁架屋面下的标准泳池，外部为大跨度拱顶建筑。',
  feat:['拱形钢桁架','大跨空间','标准泳池']});
A({id:'basketball',name:'篮球场群',cat:'sport',pos:[-25,0,-75],size:[74,52],h:9,year:2005,
  desc:'校园图位于体育馆东侧、行知广场西侧的多片篮球场，含场地划线、篮架与围网。',feat:['多片场地','篮架','围网']});
A({id:'football-north',name:'北区足球场',cat:'sport',pos:[255,0,-230],size:[100,64],h:6,year:2005,style:'football',
  desc:'校园东北部的足球场与排球场，位于科学楼与兵器陈列馆之间。',feat:['足球场','排球场','围网']});

/* ---------------- 北部：科研实验区 ---------------- */
A({id:'science-abc',name:'科学楼 A/B/C 座',cat:'teaching',pos:[200,0,-210],size:[60,50],h:24,f:6,year:2008,style:'teach-glass',
  desc:'校园图东北部的科学楼 A、B、C 三座，成组布置，是学校主要科研实验平台之一。',feat:['三座成组','玻璃与石材','实验楼']});
A({id:'jinyu',name:'瑾瑜国际会议中心',cat:'teaching',pos:[145,0,-245],size:[40,24],h:16,f:3,year:2010,style:'teach-glass',
  desc:'瑾瑜国际会议中心，位于科学楼西侧、思学楼北侧。',feat:['会议中心','玻璃幕墙']});
A({id:'chemistry-lab',name:'化学实验楼',cat:'teaching',pos:[145,0,-275],size:[44,22],h:18,f:4,year:2005,style:'teach-glass',
  desc:'化学实验楼，位于校园北部科研区。',feat:['实验楼','竖向线条']});
A({id:'sixue',name:'思学楼',cat:'teaching',pos:[85,0,-245],size:[46,20],h:18,f:5,year:2005,style:'teach-slab',
  desc:'思学楼，位于北部环形路南侧、9 号实验楼以北。',feat:['板式教学楼']});
A({id:'teaching-13',name:'13号楼',cat:'teaching',pos:[-90,0,-245],size:[48,22],h:20,f:5,year:2005,style:'teach-slab',
  desc:'13 号楼，位于游泳馆西侧、国防重点学科实验室附近。',feat:['板式教学楼']});
A({id:'instrument',name:'仪器科学大楼',cat:'teaching',pos:[-40,0,-290],size:[70,26],h:24,f:6,year:2012,style:'teach-glass',
  desc:'校园最北端的仪器科学大楼，与软件实验大楼并列，服务仪器与电子学科。',feat:['现代实验楼','玻璃幕墙']});
A({id:'software-lab',name:'软件实验大楼',cat:'teaching',pos:[60,0,-290],size:[70,26],h:24,f:6,year:2012,style:'teach-glass',
  desc:'校园最北端的大型软件实验楼。',feat:['现代实验楼','大体量']});
A({id:'weapons-museum',name:'兵器陈列馆（兵器教学陈列馆）',cat:'landmark',pos:[205,0,-290],size:[70,44],h:27,f:5,year:2025,
  desc:'位于校园北端新北区，2025 年 10 月 1 日正式对外开放，约 3.4 万平方米，一层火炮厅陈列约 21 门大炮、19 门小炮，是全国科普教育基地。模型含门前火炮与坦克陈列。',
  feat:['五层现代馆舍','火炮阵列','坦克陈列','火炮厅']});
A({id:'advanced-mfg',name:'先进制造中心',cat:'teaching',pos:[290,0,-265],size:[56,34],h:18,f:3,year:2010,style:'advanced',
  refKey:'advanced',ref:'refs/先进制造中心.jpg',
  desc:'官网照片显示为一栋带蓝色折线形大跨坡屋顶、米色框架与大面积玻璃窗的现代厂房式建筑，是校园里造型最特别的实验楼之一。',
  feat:['蓝色折板屋顶','大跨空间','米色框架','玻璃窗带']});
A({id:'energy-college',name:'能源与动力学院 / 半导体学院',cat:'teaching',pos:[-110,0,-275],size:[50,26],h:18,f:4,year:2005,style:'teach-glass',
  desc:'校园西北部的学院与实验楼组团，含国防重点学科实验室。',feat:['学院楼','实验室']});
A({id:'hospital',name:'校医院',cat:'life',pos:[-160,0,-250],size:[40,26],h:14,f:3,year:1995,style:'teach-slab',
  desc:'校医院，含住院部与门诊部，位于校园西北、二龙山东北侧。',feat:['低层院落','门诊部']});
A({id:'newenergy',name:'新能源化工研究院',cat:'teaching',pos:[-190,0,-290],size:[50,24],h:18,f:4,year:2012,style:'teach-glass',
  desc:'校园西北角的新能源化工研究院与工程训练中心组团。',feat:['研究院','实验楼']});

/* ---------------- 东北：文韬苑 / 东门 ---------------- */
grid('wentao','文韬苑',{x:215,z:-135,cols:2,rows:4,dx:55,dz:42,size:[36,14],h:21,f:6,
  style:'dorm-tan',area:'校园东北文韬苑宿舍区',
  desc:'文韬苑学生公寓组团，位于校园东侧、东环路西侧，与龙山餐厅、教学楼 17/18 号楼相邻。',
  feat:['米色板式宿舍','六层','连续阳台']});
A({id:'canteen-longshan',name:'龙山餐厅',cat:'life',pos:[300,0,-60],size:[42,30],h:12,f:3,year:2002,style:'canteen',
  desc:'以二龙山得名的餐厅，官网资料记载龙山餐厅位于文韬餐厅三楼，提供卤肉饭与自助旋转小火锅。',feat:['多层餐厅','大玻璃窗','招牌']});
A({id:'training-hall',name:'训练馆',cat:'sport',pos:[175,0,95],size:[46,34],h:14,f:2,year:2005,style:'sport-hall',
  desc:'校园图上位于铁路南侧、文韬苑 8/9 号公寓旁的训练馆。',feat:['训练场馆','大跨屋面']});
A({id:'engineering-center',name:'工程训练中心',cat:'teaching',pos:[120,0,115],size:[46,26],h:12,f:2,year:2005,style:'teach-slab',
  desc:'工程训练中心与印刷厂，位于铁路南侧、田园食堂西侧。',feat:['实训厂房','低层建筑']});

/* ---------------- 铁路 / 南侧生活区 ---------------- */
A({id:'railway-park',name:'1936 铁路主题公园 · 上兰火车站',cat:'landscape',pos:[60,0,150],size:[110,58],h:9,year:1936,
  desc:'铁路斜穿校园中南部，校园图上标注「上兰火车站」与铁路主题景观。始建於 1936 年的上兰村站旧址，1936 广场立「铁路腾飞」雕塑，旁停东风 7 型内燃机车与双层客车。',
  feat:['东风7型内燃机车','双层客车','铁轨枕木','木站台','信号灯','1936广场']});
grid('yiding','怡丁苑',{x:-110,z:160,cols:4,rows:2,dx:60,dz:40,size:[38,14],h:21,f:6,
  style:'dorm-tan',area:'铁路南侧怡丁苑公寓区',suffix:'#',
  desc:'怡丁苑公寓区，位于铁路南侧、学术交流中心以北，是校园南部的学生宿舍组团。',
  feat:['六层公寓','组团布局']});
A({id:'academic-exchange',name:'学术交流中心',cat:'landmark',pos:[-20,0,240],size:[46,34],h:32,f:8,year:2010,style:'exchange',
  refKey:'exchange',ref:'refs/学术交流中心.jpg',
  desc:'官网照片为一栋蓝色玻璃与米色框架相间的高层建筑，顶部红色「学术交流中心」招牌，底层通高玻璃入口。位于校园南部、铁路南侧。',
  feat:['蓝玻璃竖向框架','米色石材','顶部红字招牌','通高入口']});
A({id:'canteen-tianyuan',name:'田园食堂',cat:'life',pos:[180,0,150],size:[38,26],h:11,f:2,year:2002,style:'canteen',
  desc:'田园食堂，服务文澜苑宿舍区，位于铁路南侧东部。',feat:['两层食堂','横向带窗']});
grid('wenlan','文澜苑',{x:240,z:165,cols:1,rows:2,dx:0,dz:38,size:[36,14],h:21,f:6,
  style:'dorm-red',area:'校园东南文澜苑宿舍区',
  desc:'文澜苑学生公寓，位于田园食堂东侧、校园东南部。',feat:['红白宿舍','六层']});
A({id:'underground-pass',name:'铁路地下通道',cat:'landmark',pos:[80,0,105],size:[24,18],h:5,year:2005,style:'passage',
  desc:'行知广场南侧跨越铁路的地下通道，连接铁路南北两侧的教学区与生活区。',feat:['地下通道口','台阶','雨棚']});

/* ---------------- 园林与历史建筑 ---------------- */
A({id:'red-houses',name:'红房子（老建筑群）',cat:'landscape',pos:[-120,0,-60],size:[72,46],h:12,f:2,year:1955,
  desc:'建于二十世纪五六十年代的红砖建筑群，见证从太原机械学院、华北工学院到中北大学的校史变迁。',feat:['红砖墙','灰瓦坡顶','低层院落']});
A({id:'gezilou',name:'阁子楼',cat:'landscape',pos:[-185,0,-30],size:[44,22],h:13,f:2,year:1950,
  refKey:'gezi',ref:'refs/阁子楼.jpg',
  desc:'学校最老的一批建筑之一。官网照片为两栋对称的红砖两层小楼，各带三角山墙与白色窗框，楼前是牡丹花圃。',
  feat:['对称双楼','红砖','三角山墙','白窗框','牡丹花圃']});

/* ---------------- 七道门与出入口 ---------------- */
A({id:'south-gate',name:'一道门（正门）',cat:'landmark',pos:[-200,0,290],size:[34,8],h:12,year:2000,style:'gate-main',
  desc:'中北大学一道门为学校正大门，位于校园西南、正对德怀楼与德怀广场，门外有 835 路公交站。',feat:['双门柱','横梁校名','校名石','门区铺装']});
A({id:'gate-2',name:'二道门',cat:'landmark',pos:[-140,0,100],size:[20,6],h:8,year:1990,style:'gate-small',
  desc:'二道门是十字路口，毗邻五院宿舍与小吃街最西端，也是去逸夫楼的途径之一；过铁路后向北分叉通往西侧宿舍区。',feat:['路口门','铁路道口']});
A({id:'gate-3',name:'三道门',cat:'landmark',pos:[-40,0,98],size:[20,6],h:8,year:1990,style:'gate-small',
  desc:'三道门连接一院与研究生院，出门即小吃街中段。',feat:['小吃街门户']});
A({id:'gate-4',name:'四道门',cat:'landmark',pos:[70,0,96],size:[20,6],h:8,year:1990,style:'gate-small',
  desc:'四道门正对教学主楼方向，迎新期间是主要通行口。',feat:['主楼对景']});
A({id:'gate-5',name:'五道门',cat:'landmark',pos:[160,0,88],size:[20,6],h:8,year:1990,style:'gate-small',
  desc:'五道门，小吃街东段门户。',feat:['小吃街门户']});
A({id:'gate-6',name:'六道门',cat:'landmark',pos:[250,0,70],size:[20,6],h:8,year:1990,style:'gate-small',
  desc:'六道门，位于小吃街东端、东环路附近。',feat:['东部门户']});
A({id:'gate-7',name:'七道门',cat:'landmark',pos:[305,0,55],size:[20,6],h:8,year:1990,style:'gate-small',
  desc:'七道门与兰村相连，2024 年学校曾实施「七道门恢复和一道门改造」工程。',feat:['兰村方向','东部门户']});
A({id:'east-gate',name:'东大门',cat:'landmark',pos:[325,0,-170],size:[26,8],h:9,year:2010,style:'gate-main',
  desc:'校园东侧主出入口，校园图上标注门高 6.65 米，设有车辆管理设施。',feat:['东侧主门','门区广场','车辆通道']});
A({id:'gate-8',name:'八道门（应急出口）',cat:'landmark',pos:[320,0,-275],size:[16,6],h:7,year:2010,style:'gate-small',
  desc:'校园东北侧的应急出口。',feat:['应急出口']});
A({id:'gate-9',name:'九道门（应急出口）',cat:'landmark',pos:[-300,0,-265],size:[16,6],h:7,year:2010,style:'gate-small',
  desc:'校园西北侧、二龙山北端的应急出口。',feat:['应急出口']});

/* ---------------- 配套构件 ---------------- */
A({id:'street-lamp',name:'校园路灯',cat:'props',pos:[0,0,0],size:[3,1],h:7,style:'lamp',
  desc:'道路照明构件，可批量实例化铺设。',feat:['单臂灯杆','可实例化']});
A({id:'campus-tree',name:'行道树',cat:'props',pos:[0,0,0],size:[5,5],h:7,style:'tree',
  desc:'阔叶行道树构件，可批量实例化。',feat:['阔叶树冠','可实例化']});
A({id:'flagpole',name:'国旗杆',cat:'props',pos:[0,0,0],size:[1,1],h:16,style:'flag',
  desc:'广场旗杆构件，含基座与旗面。',feat:['旗杆基座','旗面']});

/* ============================================================
 * 主要地标模型（依据中北大学官网 / 基建部公开照片重建）
 * ============================================================ */

/* ---------- 教学主楼（11号教学楼） ---------- */
function buildMainBuilding(){
  var g=new THREE.Group(); g.name='NUC_main-building';
  var w=82,d=26,base=1.0,floors=13,fh=4.0,h=floors*fh;

  /* 主体 + 深色竖窗底衬 */
  box(g,w,h,d,0,h/2+base,0,MAT.wall);
  box(g,w+0.8,base,d+0.8,0,base/2,0,MAT.darkBase);
  box(g,w-0.4,h-2,0.18,0,h/2+base,d/2+0.10,MAT.glass,{cast:false});
  box(g,w-0.4,h-2,0.18,0,h/2+base,-d/2-0.10,MAT.glass,{cast:false});

  /* 中央蓝色玻璃幕墙（照片核心特征） */
  var cw=26,ch=40;
  box(g,cw,ch,0.5,0,ch/2+9,d/2+0.35,MAT.glassBlue,{cast:false});
  box(g,cw,ch,0.5,0,ch/2+9,-d/2-0.35,MAT.glassBlue,{cast:false});
  for(var i=1;i<9;i++){
    box(g,cw,0.16,0.12,0,9+i*(ch/9),d/2+0.63,MAT.steel,{cast:false});
    box(g,cw,0.16,0.12,0,9+i*(ch/9),-d/2-0.63,MAT.steel,{cast:false});
  }
  for(var j=1;j<7;j++){
    box(g,0.16,ch,0.12,-cw/2+j*(cw/7),ch/2+9,d/2+0.63,MAT.steel,{cast:false});
  }

  /* 两侧米白色竖向窗肋 */
  var rib;
  for(var x=-w/2+1.6;x<=w/2-1.6;x+=3.05){
    if(Math.abs(x)<cw/2+0.6) continue;
    for(var s=-1;s<=1;s+=2){
      rib=box(g,0.62,h-1.2,0.85,x,h/2+base,s*(d/2+0.32),MAT.wallWhite);
    }
  }
  /* 侧面同样是竖向窗肋 + 深玻璃底衬，与正立面呼应 */
  for(var sx2=-1;sx2<=1;sx2+=2){
    box(g,0.18,h-2,d-0.5,sx2*(w/2+0.12),h/2+base,0,MAT.glass,{cast:false});
    for(var sz=-d/2+1.6;sz<=d/2-1.6;sz+=3.0){
      box(g,0.85,h-1.2,0.62,sx2*(w/2+0.34),h/2+base,sz,MAT.wallWhite);
    }
  }
  /* 前后立面细腰线 */
  for(var f2=1;f2<floors;f2++) box(g,w+0.2,0.12,0.12,0,base+f2*fh,d/2+0.7,MAT.wallWhite,{cast:false});

  /* 顶部悬挑帽檐 + 格栅 */
  box(g,w+7,1.8,d+9,0,h+base+1.6,0,MAT.wallWhite);
  box(g,w+7,0.5,1.0,0,h+base+0.55,(d+9)/2,MAT.darkBase,{cast:false});
  for(var k=0;k<30;k++){
    var gx=-w/2-2+k*((w+4)/29);
    box(g,0.55,0.9,1.1,gx,h+base+2.9,(d+9)/2-1.1,MAT.darkBase,{cast:false});
  }
  /* 楼顶红色校名 */
  sign(g,'中北大学',28,7.0,0,h+base+5.2,(d+9)/2-1.8,'#b83a2f');

  /* 白色大雨棚 + 柱廊 */
  box(g,48,2.4,11,0,9.2,d/2+5,MAT.wallWhite);
  box(g,48,0.5,11.4,0,10.65,d/2+5,MAT.steel,{cast:false});
  for(var p=0;p<7;p++){
    var px=-20+p*(40/6);
    cyl(g,0.85,0.9,8.2,12,px,4.1,d/2+9,MAT.wallWhite);
    box(g,2.5,0.45,2.5,px,8.4,d/2+9,MAT.wallWhite,{cast:false});
  }
  /* 入口门洞 */
  box(g,20,6.5,0.3,0,4.2,d/2+0.2,MAT.glass,{cast:false});
  for(var q=0;q<7;q++) box(g,0.2,6.5,0.4,-10+q*(20/6),4.2,d/2+0.45,MAT.steel,{cast:false});

  /* 宽台阶 */
  stairs(g,50,9,9,0,d/2+15,MAT.plaza,0.3);
  /* 阶梯花坛（照片前两侧） */
  for(var sd=-1;sd<=1;sd+=2){
    for(var st=0;st<3;st++){
      var bw=11-st*1.4;
      box(g,bw,0.55,4.4,sd*(33+st*1.2),0.28+st*0.28,d/2+13+st*2.6,MAT.plaza,{cast:false});
      box(g,bw-0.7,0.12,3.7,sd*(33+st*1.2),0.6+st*0.28,d/2+13+st*2.6,MAT.grass,{cast:false});
    }
  }
  /* 平台铺装 */
  flat(g,w+30,42,0,0.03,d/2+12,MAT.plaza);
  return g;
}

/* ---------- 图书馆：双弧形书卷 + 钢桁架屋面 ---------- */
function buildLibrary(){
  var g=new THREE.Group(); g.name='NUC_library';
  var wingW=46,wingD=40,wingH=21,base=2.2;
  var centers=[-36,36];

  /* 黑色石材基座 */
  box(g,118,base,50,0,base/2,0,MAT.darkBase);
  box(g,120,0.5,52,0,0.25,0,MAT.darkBase2,{cast:false});

  centers.forEach(function(cx,wi){
    /* 弧形体量：沿弧线排列的竖向书页肋 + 深绿玻璃间隔 */
    var N=20;
    for(var i=0;i<N;i++){
      var t=(i/(N-1))*2-1;
      var x=cx+t*(wingW/2);
      var bulge=9.5*Math.cos(t*Math.PI/2);
      var z=bulge;
      var ry=-t*0.17;
      /* 深绿玻璃窗带（在竖肋之后，露出书页间的暗色竖缝） */
      box(g,1.85,wingH-1.4,0.22,x+1.16,wingH/2+base,z+wingD/2-1.55,MAT.glassGreen,{ry:ry,cast:false});
      /* 米白书页竖肋（薄叶片，避免旋转后互相遮挡） */
      box(g,0.82,wingH,1.35,x,wingH/2+base,z+wingD/2-0.55,MAT.wallStone,{ry:ry});
    }
    /* 背部实墙与两端封板 */
    box(g,wingW+2,wingH,1.2,cx,wingH/2+base,-wingD/2+0.4,MAT.wallStone);
    for(var e=-1;e<=1;e+=2){
      box(g,1.4,wingH,wingD,cx+e*(wingW/2+0.7),wingH/2+base,0,MAT.wallStone);
    }
    /* 顶部白色空间钢桁架玻璃屋面 */
    var roofY=wingH+base+1.2;
    box(g,wingW+4,0.35,wingD+5,cx,roofY+1.4,0,MAT.glassLite,{cast:false});
    for(var r=0;r<10;r++){
      var rx=cx-wingW/2+r*(wingW/9);
      box(g,0.22,0.3,wingD+5,rx,roofY+1.65,0,MAT.steel,{cast:false});
    }
    for(var s=0;s<7;s++){
      var rz=-wingD/2+s*(wingD/6);
      box(g,wingW+4,0.22,0.22,cx,roofY+1.9,rz,MAT.steel,{cast:false});
      /* 斜腹杆 */
      box(g,wingW+3,0.16,0.16,cx,roofY+0.7,rz,MAT.steel,{rz:0.13,cast:false});
    }
    /* 侧墙横向窗带 */
    var qb=new QB();
    gridWindows(qb,{face:'back',w:wingW,d:wingD,y0:base+3,floors:5,floorH:3.5,cols:9,winW:3.1,winH:2.0,lift:0.65});
    var wm=qb.mesh(MAT.glass);
    if(wm){ wm.position.x=cx; g.add(wm); }
  });

  /* 中部蓝色玻璃中庭 */
  box(g,25,20,34,0,12,-1,MAT.glassBlue,{cast:false});
  for(var v=0;v<9;v++){
    box(g,0.22,20,0.4,-12+v*3,12,16.2,MAT.steel,{cast:false});
  }
  for(var hh=1;hh<6;hh++) box(g,25,0.18,0.4,0,2+hh*3.3,16.2,MAT.steel,{cast:false});
  box(g,27,1.2,36,0,22.4,-1,MAT.steel);

  /* 入口：雨棚、招牌、台阶 */
  box(g,22,1.4,8,0,7.2,22,MAT.wallWhite);
  for(var pc=0;pc<6;pc++) cyl(g,0.5,0.55,6.0,10,-9+pc*3.6,3.0,25.2,MAT.wallWhite);
  box(g,14,5.5,0.4,0,3.6,20.2,MAT.glass,{cast:false});
  sign(g,'图书馆',11,2.6,0,8.3,26.05,'#8a2f24');
  stairs(g,30,8,8,0,29,MAT.plaza,0.28);
  /* 前广场与前池 */
  flat(g,120,48,0,0.02,34,MAT.plaza);
  box(g,26,0.3,9,0,0.16,38,MAT.water,{cast:false});
  return g;
}

/* ---------- 德怀楼 ---------- */
function buildDehuaiBuilding(){
  var g=new THREE.Group(); g.name='NUC_dehuai-building';
  var w=64,d=24,floors=6,fh=4.0;
  box(g,w,floors*fh,d,0,floors*fh/2+1.0,0,MAT.wallWarm);
  box(g,w+1,1.0,d+1,0,0.5,0,MAT.brick2);
  var qb=new QB();
  ['front','back','left','right'].forEach(function(f){
    gridWindows(qb,{face:f,w:w,d:d,y0:2.2,floors:floors,floorH:fh,
      cols:(f==='front'||f==='back')?14:5,winW:2.5,winH:2.5,lift:0.08});
  });
  var wm=qb.mesh(MAT.glass); if(wm) g.add(wm);
  for(var f2=1;f2<floors;f2++) box(g,w+0.25,0.22,d+0.25,0,1+f2*fh,0,MAT.wallWhite,{cast:false});
  /* 中部入口柱廊 */
  box(g,22,1.6,7,0,13.2,d/2+3,MAT.wallWhite);
  colonnade(g,6,20,1,11,0.75,MAT.wallWhite,d/2+5,4);
  stairs(g,24,7,7,0,d/2+11,MAT.plaza,0.26);
  /* 深色坡檐 */
  box(g,w+3,1.6,d+3,0,floors*fh+1.8,0,MAT.roof);
  box(g,w+1,0.7,d+1,0,floors*fh+2.9,0,MAT.darkBase,{cast:false});
  /* 两翼略退 */
  for(var s=-1;s<=1;s+=2){
    box(g,14,floors*fh*0.82,3,s*(w/2-7),floors*fh*0.41+1,d/2+1.5,MAT.wallStone);
  }
  sign(g,'德怀楼',9,2.2,0,15.0,d/2+3.6,'#7d2f24');
  flat(g,w+24,22,0,0.02,d/2+12,MAT.plaza);
  return g;
}

/* ---------- 兵器科学大楼（中轴交汇 · 玻璃穹顶） ---------- */
function buildWeaponScience(){
  var g=new THREE.Group(); g.name='NUC_weapon-science';
  var w=56,d=56,floors=9,fh=4.2,h=floors*fh;
  box(g,w,h,d,0,h/2+1,0,MAT.wallStone);
  box(g,w+2,1,d+2,0,0.5,0,MAT.darkBase);
  var qb=new QB();
  ['front','back','left','right'].forEach(function(f){
    gridWindows(qb,{face:f,w:w,d:d,y0:2.4,floors:floors,floorH:fh,cols:12,winW:2.6,winH:2.7,lift:0.1});
  });
  var wm=qb.mesh(MAT.glassBlue); if(wm) g.add(wm);
  for(var f2=1;f2<floors;f2++) box(g,w+0.3,0.25,d+0.3,0,1+f2*fh,0,MAT.wallWhite,{cast:false});
  /* 四角塔楼 */
  for(var sx=-1;sx<=1;sx+=2) for(var sz=-1;sz<=1;sz+=2){
    var tx=sx*(w/2-5),tz=sz*(d/2-5);
    box(g,10,h+8,10,tx,(h+8)/2+1,tz,MAT.wallWarm);
    box(g,11,1.3,11,tx,h+9.5,tz,MAT.roof);
    cone(g,5.4,6,tx,h+13,tz,MAT.metal,4);
  }
  /* 中央鼓座 + 玻璃穹顶 */
  cyl(g,12,12,5,28,0,h+3.5,0,MAT.wallWhite);
  var dome=new THREE.Mesh(new THREE.SphereGeometry(12,28,14,0,Math.PI*2,0,Math.PI/2),MAT.glassBlue);
  dome.position.set(0,h+6,0); dome.castShadow=true; g.add(dome);
  for(var a=0;a<12;a++){
    var ang=a*Math.PI/6;
    var rib=new THREE.Mesh(new THREE.TorusGeometry(12,0.16,5,28,Math.PI),MAT.steel);
    rib.rotation.set(0,ang,0);
    rib.position.set(0,h+6,0); g.add(rib);
  }
  /* 四面礼仪台阶 */
  for(var sd=-1;sd<=1;sd+=2){
    stairs(g,26,8,8,0,sd*(d/2+8),MAT.plaza,0.28);
    box(g,26,1.0,8,0,0.5,sd*(d/2+3),MAT.plaza,{cast:false});
  }
  flat(g,w+40,d+40,0,0.02,0,MAT.plaza);
  return g;
}

/* ---------- 一道门 · 主校门 ---------- */
function buildSouthGate(){
  var g=new THREE.Group(); g.name='NUC_south-gate';
  flat(g,54,20,0,0.02,0,MAT.plaza);
  for(var s=-1;s<=1;s+=2){
    box(g,4.5,11,4.5,s*15,5.5,0,MAT.wallStone);
    box(g,5.2,0.7,5.2,s*15,11.2,0,MAT.wallWhite);
    box(g,1.6,1.0,1.6,s*15,12.0,0,MAT.glassLite,{cast:false});
    /* 门柱基座与竖向凹槽 */
    box(g,5.4,1.2,5.4,s*15,0.6,0,MAT.darkBase);
    for(var k=0;k<3;k++) box(g,0.25,9,0.25,s*15-1.2+k*1.2,5.6,2.3,MAT.wallWhite,{cast:false});
  }
  box(g,36,2.8,3.2,0,11.5,0,MAT.wallWhite);
  box(g,37,0.45,3.6,0,13.1,0,MAT.roof);
  sign(g,'中北大学',22,2.5,0,11.5,1.75,'#a8362b');
  /* 校名石 */
  box(g,13,3.4,2.2,-26,1.7,7,MAT.rock);
  sign(g,'中北大学',10,2.0,-26,1.8,8.16,'#e8dcc0');
  for(var t=0;t<4;t++) tree(g,-34+t*7,12,1.05);
  /* 门区灯 */
  for(var l=-1;l<=1;l+=2) lamp(g,l*22,-7,1);
  return g;
}

/* ---------- 德怀广场 · 彭德怀骑马铜像 ---------- */
function buildDehuaiSquare(){
  var g=new THREE.Group(); g.name='NUC_dehuai-square';
  /* 圆形铺装与环台阶 */
  var pl=cyl(g,31,31,0.5,48,0,0.25,0,MAT.plaza,{cast:false});
  var pl2=cyl(g,27,27,0.4,48,0,0.7,0,MAT.wallStone,{cast:false});
  /* 基座：多层花岗岩 */
  box(g,13,1.2,11,0,1.3,0,MAT.stone);
  box(g,10,1.4,8.5,0,2.6,0,MAT.wallStone);
  box(g,7.6,3.2,6.6,0,4.9,0,MAT.stone);
  box(g,8.2,0.4,7.2,0,6.7,0,MAT.darkBase,{cast:false});
  sign(g,'彭德怀元帅',6.2,0.9,0,5.1,3.36,'#5a4a30');
  /* 骑马铜像（几何剪影，含基座总高约 7.6m 以上） */
  var B=MAT.bronze;
  var hy=8.6;
  /* 马身 */
  box(g,6.2,2.1,2.2,0,hy,0,B,{rz:-0.05});
  /* 马颈与马头 */
  box(g,1.5,2.6,1.5,2.7,hy+1.5,0,B,{rz:-0.42});
  box(g,2.4,1.0,1.3,3.6,hy+2.5,0,B,{rz:-0.15});
  box(g,0.5,0.9,0.9,3.4,hy+3.1,0,B,{cast:false});
  /* 四腿（前腿抬起） */
  box(g,0.75,2.6,0.8,-2.1,hy-2.0,0.75,B,{rz:0.12});
  box(g,0.75,2.6,0.8,-2.1,hy-2.0,-0.75,B,{rz:0.12});
  box(g,0.8,2.5,0.8,1.9,hy-2.0,0.75,B,{rz:-0.5});
  box(g,0.8,2.5,0.8,1.9,hy-2.0,-0.75,B,{rz:-0.5});
  /* 马尾 */
  box(g,0.8,2.4,0.8,-3.5,hy-0.6,0,B,{rz:0.5});
  /* 骑手 */
  box(g,1.5,2.3,1.3,-0.2,hy+2.4,0,B);
  sphere(g,0.72,-0.2,hy+4.0,0,B,10);
  box(g,2.0,0.32,1.5,-0.2,hy+4.5,0,B);
  box(g,0.55,1.7,0.55,0.6,hy+2.6,0.9,B,{rz:-0.7});
  box(g,0.55,1.7,0.55,0.6,hy+2.6,-0.9,B,{rz:-0.7});
  /* 环绕树与灯 */
  for(var i=0;i<10;i++){
    var a=i*Math.PI/5;
    tree(g,Math.cos(a)*24,Math.sin(a)*22,0.95);
    if(i%2===0) lamp(g,Math.cos(a)*20,Math.sin(a)*18,0.9);
  }
  return g;
}

/* ---------- 行知广场 ---------- */
function buildXingzhiSquare(){
  var g=new THREE.Group(); g.name='NUC_xingzhi-square';
  flat(g,90,58,0,0.02,0,MAT.plaza);
  for(var i=0;i<7;i++) box(g,90,0.02,0.16,0,0.05,-28+i*9.3,MAT.wallStone,{cast:false});
  /* 中央旗杆 */
  cyl(g,0.28,0.42,15,12,0,7.5,10,MAT.steel);
  cyl(g,1.5,1.8,0.7,16,0,0.35,10,MAT.wallStone);
  box(g,5.2,3.0,0.12,2.6,12.5,10,MAT.brick,{cast:false});
  /* 对称阶梯花坛 */
  for(var s=-1;s<=1;s+=2){
    for(var st=0;st<3;st++){
      var w=20-st*2.4;
      box(g,w,0.55,6,s*(28+st*1.5),0.3+st*0.3,-6+st*3,MAT.wallStone,{cast:false});
      box(g,w-0.8,0.14,5.2,s*(28+st*1.5),0.63+st*0.3,-6+st*3,MAT.grass,{cast:false});
    }
    for(var t=0;t<5;t++) tree(g,s*(36+t*0.4),16+t*6,0.9);
  }
  /* 中央小型喷泉（铺装为主，避免大片浅色水面） */
  cyl(g,6.4,6.4,0.3,32,0,0.16,-16,MAT.plaza,{cast:false});
  cyl(g,2.3,2.5,0.55,24,0,0.48,-16,MAT.wallStone,{cast:false});
  cyl(g,2.0,2.0,0.1,24,0,0.79,-16,MAT.water,{cast:false});
  cyl(g,0.26,0.42,2.8,12,0,2.1,-16,M(0xbfe0e8,0.15,0.1,{transparent:true,opacity:0.72}),{cast:false});
  sphere(g,0.7,0,3.7,-16,M(0xd6eef2,0.12,0.1,{transparent:true,opacity:0.55}),10);
  for(var lp=0;lp<8;lp++){
    var a=lp*Math.PI/4;
    lamp(g,Math.cos(a)*40,Math.sin(a)*24,0.95);
  }
  return g;
}

/* ---------- 兵器陈列馆（含火炮与坦克陈列） ---------- */
function cannon(g,x,z,s){
  s=s||1;
  /* 炮架底座 */
  box(g,3.4*s,0.5*s,2.2*s,x,0.25*s,z,MAT.darkBase);
  /* 两个轮子 */
  for(var w=-1;w<=1;w+=2){
    var wheel=cyl(g,1.1*s,1.1*s,0.28*s,16,x,1.1*s,z+w*1.0*s,MAT.darkBase,{rx:Math.PI/2});
  }
  /* 炮管 */
  var tube=cyl(g,0.28*s,0.42*s,6.2*s,12,x,2.2*s,z-1.3*s,MAT.bronze,{rx:Math.PI/2-0.18});
  /* 炮盾 */
  box(g,2.4*s,1.5*s,0.25*s,x,1.8*s,z+0.5*s,MAT.metal);
  return tube;
}
function tank(g,x,z,s){
  s=s||1;
  for(var t=-1;t<=1;t+=2) box(g,1.2*s,1.1*s,7.0*s,x+t*2.0*s,0.7*s,z,MAT.darkBase);
  box(g,4.4*s,1.5*s,6.4*s,x,1.7*s,z,MAT.bronze);
  box(g,3.6*s,0.9*s,4.2*s,x,2.8*s,z,MAT.bronze);
  cyl(g,1.5*s,1.7*s,1.1*s,12,x,3.7*s,z,MAT.bronze);
  var bar=cyl(g,0.22*s,0.3*s,5.2*s,10,x,3.9*s,z-3.6*s,MAT.bronze,{rx:Math.PI/2});
  for(var k=0;k<6;k++){
    for(var w2=-1;w2<=1;w2+=2) cyl(g,0.42*s,0.42*s,0.2*s,10,x+w2*2.0*s,0.6*s,z-2.5*s+k*1.0*s,MAT.darkBase,{rz:Math.PI/2});
  }
  return bar;
}
function buildWeaponsMuseum(){
  var g=new THREE.Group(); g.name='NUC_weapons-museum';
  var w=66,d=42,floors=5,fh=5.0,h=floors*fh;
  flat(g,96,74,0,0.02,14,MAT.plaza);
  box(g,w,h,d,0,h/2+1,0,MAT.wallStone);
  box(g,w+2,1,d+2,0,0.5,0,MAT.darkBase);
  /* 大面积玻璃幕墙 */
  box(g,w-8,h-8,0.4,0,h/2+1,d/2+0.25,MAT.glassBlue,{cast:false});
  for(var i=0;i<11;i++) box(g,0.28,h-8,0.5,-27+i*5.4,h/2+1,d/2+0.55,MAT.steel,{cast:false});
  for(var j=1;j<5;j++) box(g,w-8,0.3,0.5,0,1+j*fh,d/2+0.55,MAT.steel,{cast:false});
  /* 金属竖向翼板 */
  for(var s=-1;s<=1;s+=2){
    box(g,5,h,3,s*(w/2-2.5),h/2+1,d/2+0.8,MAT.metal);
  }
  box(g,w+4,1.6,d+4,0,h+1.8,0,MAT.metal);
  sign(g,'兵器陈列馆',20,3.0,0,h+2.0,d/2+2.3,'#a8362b','#e8e4d8');
  /* 入口 */
  box(g,20,1.6,8,0,7.5,d/2+4,MAT.wallWhite);
  stairs(g,28,8,8,0,d/2+12,MAT.plaza,0.28);
  /* 门前火炮阵列 + 坦克 */
  for(var c=0;c<4;c++) cannon(g,-34+c*9,32,1.0);
  tank(g,30,32,1.0);
  /* 侧窗 */
  var qb=new QB();
  ['left','right','back'].forEach(function(f){
    gridWindows(qb,{face:f,w:w,d:d,y0:3,floors:5,floorH:fh,cols:(f==='back')?12:8,winW:2.6,winH:2.8,lift:0.08});
  });
  var wm=qb.mesh(MAT.glass); if(wm) g.add(wm);
  return g;
}

/* ---------- 科艺苑 ---------- */
function buildKeyiHall(){
  var g=new THREE.Group(); g.name='NUC_keyi-hall';
  var w=46,d=34,h=13;
  box(g,w,h,d,0,h/2+1,0,MAT.wallWarm);
  box(g,w+2,1,d+2,0,0.5,0,MAT.darkBase);
  /* 大跨弧形屋面 */
  barrelRoof(g,w,d,4.5,h+1,MAT.roof,16);
  /* 门厅玻璃幕墙 */
  box(g,26,9,0.4,0,5.5,d/2+0.25,MAT.glassBlue,{cast:false});
  for(var i=0;i<7;i++) box(g,0.28,9,0.5,-12+i*4,5.5,d/2+0.55,MAT.steel,{cast:false});
  box(g,30,1.4,7,0,10.4,d/2+3,MAT.wallWhite);
  for(var p=0;p<6;p++) cyl(g,0.55,0.6,9,10,-12+p*4.8,4.5,d/2+5.5,MAT.wallWhite);
  stairs(g,32,8,8,0,d/2+12,MAT.plaza,0.26);
  sign(g,'科艺苑',10,2.4,0,11.4,d/2+3.6,'#8a2f24');
  flat(g,w+28,24,0,0.02,d/2+12,MAT.plaza);
  return g;
}

/* ============================================================
 * 其余建筑 / 景观 / 配套构件 / 整校地面 / 对外 API
 * ============================================================ */

function barrelRoof(g,w,d,h,y,m,segs){
  segs=segs||14;
  for(var i=0;i<segs;i++){
    var a=-Math.PI/2+(i+0.5)*(Math.PI/segs);
    var zz=Math.sin(a)*(d/2);
    var yy=y+Math.cos(a)*h;
    box(g,w+1,0.42,(d/segs)*1.3,0,yy,zz,m,{rx:-a*0.42});
  }
}

/* ---------- 教学楼 / 实验楼（板楼系列） ---------- */
function buildTeaching01(){
  var g=new THREE.Group(); g.name='NUC_teaching-01';
  slabBuilding(g,{w:58,d:20,floors:5,fh:3.6,wall:MAT.wallWarm,glass:MAT.glass,bay:4.2,winW:2.6,base:0.6,baseMat:MAT.brick2});
  box(g,16,1.2,5,0,8.4,12,MAT.wallWhite);
  box(g,10,5.4,0.3,0,3.3,10.2,MAT.glass,{cast:false});
  stairs(g,16,5,5,0,15,MAT.plaza,0.24);
  sign(g,'1号教学楼',9,1.8,0,9.2,12.6,'#8a3327');
  flat(g,76,18,0,0.02,16,MAT.plaza);
  return g;
}
function buildTeaching09(){
  var g=new THREE.Group(); g.name='NUC_teaching-09';
  slabBuilding(g,{w:70,d:26,floors:7,fh:4.0,wall:MAT.wallStone,glass:MAT.glassBlue,bay:4.0,winW:2.4,base:1.0});
  for(var i=0;i<10;i++) box(g,0.5,27,0.8,-31+i*6.9,14.5,13.4,MAT.wallWhite);
  box(g,20,1.5,6,0,10.5,16,MAT.wallWhite);
  box(g,12,6,0.3,0,3.6,13.2,MAT.glass,{cast:false});
  stairs(g,22,6,6,0,19,MAT.plaza,0.26);
  /* 屋顶设备层 */
  box(g,16,2.4,10,0,30.2,0,MAT.metal);
  for(var k=0;k<3;k++) cyl(g,1.1,1.1,2.0,10,-5+k*5,31.8,0,MAT.metal);
  sign(g,'9号教学实验大楼',14,1.9,0,11.6,16.4,'#8a3327');
  flat(g,88,20,0,0.02,20,MAT.plaza);
  return g;
}
function buildTeaching12(){
  var g=new THREE.Group(); g.name='NUC_teaching-12';
  slabBuilding(g,{w:52,d:22,floors:6,fh:3.5,wall:MAT.wallWarm,glass:MAT.glass,bay:4.0,winW:2.5,base:0.8,baseMat:MAT.stone});
  /* 中部入口古典门套 */
  for(var s=-1;s<=1;s+=2) box(g,1.2,10,1.2,s*5,5.8,11.7,MAT.wallWhite);
  box(g,13,1.2,2.2,0,11.0,11.7,MAT.wallWhite);
  box(g,9,7,0.3,0,4.2,11.2,MAT.glass,{cast:false});
  stairs(g,16,6,6,0,15,MAT.plaza,0.25);
  sign(g,'鸿学楼',8,1.8,0,11.9,12.0,'#7d3326');
  flat(g,68,18,0,0.02,16,MAT.plaza);
  return g;
}
function buildLabComplex(){
  var g=new THREE.Group(); g.name='NUC_lab-complex';
  for(var k=0;k<3;k++){
    var sub=new THREE.Group();
    slabBuilding(sub,{w:70-k*8,d:24-k*2,floors:6-k,fh:3.8,wall:MAT.wallStone,glass:MAT.glassBlue,bay:4.4,winW:2.5,base:0.8});
    sub.position.set(0,0,k*30-30);
    g.add(sub);
  }
  /* 连廊 */
  box(g,4,3.4,60,36,5.5,0,MAT.glassLite,{cast:false});
  for(var i=0;i<8;i++) box(g,4.4,0.24,0.3,36,5.5,-28+i*8,MAT.steel,{cast:false});
  flat(g,96,92,0,0.02,0,MAT.plaza);
  return g;
}

/* ---------- 生活区 ---------- */
function buildDorm(name){
  return function(){
    var g=new THREE.Group(); g.name='NUC_'+name;
    slabBuilding(g,{w:56,d:16,floors:6,fh:3.4,wall:MAT.wallWarm,glass:MAT.glass,bay:3.6,winW:2.1,winH:1.8,base:0.5,bands:true});
    /* 连续阳台 */
    for(var f=0;f<6;f++){
      box(g,54,0.16,1.5,0,0.5+f*3.4+0.1,8.75,MAT.wallWhite,{cast:false});
      box(g,54,0.9,0.12,0,0.5+f*3.4+0.6,9.5,MAT.metal,{cast:false});
    }
    box(g,7,1.1,4,0,6.0,9,MAT.wallWhite);
    box(g,4,3.2,0.3,0,2.1,8.2,MAT.glass,{cast:false});
    sign(g,name.indexOf('wenying')>=0?'文瀛苑':'文韬苑',7,1.7,0,6.7,9.3,'#7d3326');
    flat(g,70,14,0,0.02,13,MAT.plaza);
    return g;
  };
}
function buildCanteen(long){
  return function(){
    var g=new THREE.Group(); g.name=long?'NUC_canteen-longshan':'NUC_canteen-tianyuan';
    var w=long?42:38,d=long?30:26,h=11;
    box(g,w,h,d,0,h/2+0.6,0,MAT.wallWarm);
    box(g,w+1,0.6,d+1,0,0.3,0,MAT.darkBase);
    /* 大面积一层玻璃 */
    box(g,w-3,5.2,0.3,0,3.2,d/2+0.2,MAT.glassLite,{cast:false});
    for(var i=0;i<8;i++) box(g,0.25,5.2,0.4,-(w-3)/2+i*((w-3)/7),3.2,d/2+0.45,MAT.steel,{cast:false});
    var qb=new QB();
    gridWindows(qb,{face:'front',w:w,d:d,y0:6.6,floors:1,floorH:3.6,cols:9,winW:3.0,winH:2.4,lift:0.1});
    gridWindows(qb,{face:'back',w:w,d:d,y0:2.0,floors:2,floorH:4.0,cols:9,winW:3.0,winH:2.5,lift:0.1});
    gridWindows(qb,{face:'left',w:w,d:d,y0:2.0,floors:2,floorH:4.0,cols:6,winW:2.6,winH:2.5,lift:0.1});
    gridWindows(qb,{face:'right',w:w,d:d,y0:2.0,floors:2,floorH:4.0,cols:6,winW:2.6,winH:2.5,lift:0.1});
    var wm=qb.mesh(MAT.glass); if(wm) g.add(wm);
    box(g,w+2,1.2,d+2,0,h+1.2,0,MAT.roof);
    box(g,18,1.2,6,0,6.8,d/2+3,MAT.wallWhite);
    stairs(g,20,5,5,0,d/2+8,MAT.plaza,0.24);
    sign(g,long?'龙山餐厅':'田园餐厅',10,2.1,0,7.6,d/2+3.4,'#a8362b');
    flat(g,w+18,16,0,0.02,d/2+9,MAT.plaza);
    return g;
  };
}
function buildCampusStreet(){
  var g=new THREE.Group(); g.name='NUC_campus-street';
  var shops=['书店','面馆','超市','打印','水果','理发','快递','奶茶','文具','食堂'];
  flat(g,100,18,0,0.02,0,MAT.plaza);
  for(var i=0;i<10;i++){
    var x=-45+i*10;
    var col=(i%3===0)?MAT.brick2:((i%3===1)?MAT.wallWarm:MAT.wallStone);
    box(g,9.4,7.6,11,x,3.8,-2,col);
    box(g,9.6,0.5,11.2,x,7.85,-2,MAT.roof,{cast:false});
    /* 一层店面 */
    box(g,8.4,3.4,0.25,x,2.0,3.65,MAT.glassLite,{cast:false});
    box(g,9.2,0.5,2.2,x,3.7,4.4,MAT.wallWhite,{cast:false});
    sign(g,shops[i],5.2,1.3,x,4.35,4.72,'#b8452f','#f0e6cf');
    /* 二层窗 */
    box(g,7.6,2.0,0.2,x,5.9,3.62,MAT.glass,{cast:false});
  }
  /* 骑楼柱 */
  for(var p=0;p<11;p++) cyl(g,0.28,0.32,3.7,8,-50+p*10,1.85,4.6,MAT.wallWhite);
  box(g,100,0.4,2.6,0,3.9,4.6,MAT.wallWhite,{cast:false});
  for(var t=0;t<6;t++) tree(g,-42+t*17,10,0.75);
  return g;
}
function buildServiceCenter(){
  var g=new THREE.Group(); g.name='NUC_service-center';
  slabBuilding(g,{w:34,d:22,floors:2,fh:4.4,wall:MAT.wallWarm,glass:MAT.glassLite,bay:5.0,winW:3.2,winH:2.6,base:0.4,parapet:false});
  box(g,36,0.8,24,0,9.4,0,MAT.roof);
  sign(g,'生活服务中心',12,1.8,0,6.4,11.3,'#8a3327');
  flat(g,48,14,0,0.02,15,MAT.plaza);
  return g;
}

/* ---------- 运动区 ---------- */
function buildStadium(){
  var g=new THREE.Group(); g.name='NUC_stadium';
  flat(g,176,112,0,0.01,0,MAT.plaza);
  /* 椭圆跑道 */
  var ring=new THREE.Mesh(new THREE.RingGeometry(34,47,72),MAT.track);
  ring.rotation.x=-Math.PI/2; ring.scale.set(1.62,1,1); ring.position.y=0.06; ring.receiveShadow=true; g.add(ring);
  for(var l=1;l<8;l++){
    var ln=new THREE.Mesh(new THREE.RingGeometry(34+l*1.6,34+l*1.6+0.10,72),MAT.whiteLine);
    ln.rotation.x=-Math.PI/2; ln.scale.set(1.62,1,1); ln.position.y=0.08; g.add(ln);
  }
  /* 真草坪足球场 */
  var field=new THREE.Mesh(new THREE.CircleGeometry(34,64),MAT.grass);
  field.rotation.x=-Math.PI/2; field.scale.set(1.62,1,1); field.position.y=0.07; field.receiveShadow=true; g.add(field);
  /* 草坪条纹 */
  for(var st=0;st<9;st++){
    var stripe=box(g,7.4,0.02,66,-29+st*7.4,0.085,0,MAT.grass2,{cast:false});
    stripe.receiveShadow=true;
  }
  /* 场地白线 */
  var fl=M(0xf2f0e6,1);
  box(g,100,0.03,0.25,0,0.11,0,fl,{cast:false});
  var border=new THREE.Mesh(new THREE.RingGeometry(29.2,29.45,64),fl);
  border.rotation.x=-Math.PI/2; border.scale.set(1.62,1,1); border.position.y=0.11; g.add(border);
  var midCircle=new THREE.Mesh(new THREE.RingGeometry(8.2,8.4,48),fl);
  midCircle.rotation.x=-Math.PI/2; midCircle.scale.set(1.62,1,1); midCircle.position.y=0.12; g.add(midCircle);
  for(var e=-1;e<=1;e+=2){
    box(g,0.25,0.03,32,e*49,0.11,0,fl,{cast:false});
    box(g,14,0.03,0.25,e*41,0.11,0,fl,{cast:false});
    /* 球门 */
    for(var q=-1;q<=1;q+=2) cyl(g,0.14,0.14,2.4,8,e*50,1.2,q*3.7,MAT.steel);
    box(g,0.16,0.16,7.6,e*50,2.4,0,MAT.steel,{cast:false});
    for(var n=0;n<8;n++) box(g,0.05,2.2,0.05,e*50,1.2,-3.4+n,fl,{cast:false});
  }
  /* 两侧看台 */
  for(var s=-1;s<=1;s+=2){
    for(var tier=0;tier<4;tier++){
      box(g,132,1.1+tier*0.9,4.6,0,(1.1+tier*0.9)/2,s*(53+tier*4.2),MAT.wallStone,{cast:false});
      box(g,132,0.22,4.6,0,1.1+tier*0.9+0.11,s*(53+tier*4.2),MAT.wallWhite,{cast:false});
    }
    box(g,136,1.0,1.4,0,5.4,s*72,MAT.metal,{cast:false});
  }
  /* 四角灯塔 */
  for(var sx=-1;sx<=1;sx+=2) for(var sz=-1;sz<=1;sz+=2){
    var lx=sx*82,lz=sz*58;
    cyl(g,0.5,0.8,20,10,lx,10,lz,MAT.metal);
    box(g,7,2.6,1.2,lx,20.5,lz,MAT.steel);
    for(var b=0;b<4;b++) box(g,1.4,1.6,0.3,lx-2.4+b*1.6,20.5,lz+0.75,MAT.glassLite,{cast:false});
  }
  return g;
}
function buildBasketball(){
  var g=new THREE.Group(); g.name='NUC_basketball';
  flat(g,78,54,0,0.02,0,MAT.plaza);
  var court=M(0x4b6f6b,1), line=M(0xe8e6dc,1);
  for(var i=0;i<2;i++){
    var cx=-19+i*38;
    box(g,30,0.12,17,cx,0.08,0,court,{cast:false});
    box(g,29,0.02,0.16,cx,0.16,8.2,line,{cast:false});
    box(g,29,0.02,0.16,cx,0.16,-8.2,line,{cast:false});
    box(g,0.16,0.02,16.4,cx,0.16,0,line,{cast:false});
    var cc=new THREE.Mesh(new THREE.RingGeometry(1.7,1.88,28),line);
    cc.rotation.x=-Math.PI/2; cc.position.set(cx,0.17,0); g.add(cc);
    for(var s=-1;s<=1;s+=2){
      /* 篮架 */
      cyl(g,0.16,0.2,3.4,8,cx+s*16.5,1.7,0,MAT.metal);
      box(g,0.2,0.2,2.4,cx+s*16.5,3.4,s*1.0,MAT.metal,{cast:false});
      box(g,0.12,1.1,1.9,cx+s*15.4,3.5,0,MAT.wallWhite,{cast:false});
      var hoop=new THREE.Mesh(new THREE.TorusGeometry(0.45,0.05,6,16),M(0xd0683e,0.6,0.3));
      hoop.rotation.x=Math.PI/2; hoop.position.set(cx+s*14.7,3.1,0); g.add(hoop);
    }
  }
  /* 围网立柱 */
  for(var p=0;p<10;p++){
    var px=-36+p*8;
    for(var s2=-1;s2<=1;s2+=2) cyl(g,0.09,0.09,4.0,6,px,2.0,s2*25,MAT.metal,{cast:false});
  }
  return g;
}
function buildGymnasium(){
  var g=new THREE.Group(); g.name='NUC_gymnasium';
  var w=62,d=42,h=14;
  box(g,w,h,d,0,h/2+0.8,0,MAT.wallStone);
  box(g,w+2,0.8,d+2,0,0.4,0,MAT.darkBase);
  barrelRoof(g,w,d,7,h+0.8,MAT.metal,16);
  box(g,w-6,9,0.4,0,5.3,d/2+0.25,MAT.glassBlue,{cast:false});
  for(var i=0;i<10;i++) box(g,0.28,9,0.5,-26+i*5.8,5.3,d/2+0.55,MAT.steel,{cast:false});
  box(g,26,1.4,7,0,10.5,d/2+3.5,MAT.wallWhite);
  stairs(g,30,7,7,0,d/2+11,MAT.plaza,0.26);
  sign(g,'体育馆 · 游泳馆',15,2.2,0,11.4,d/2+3.8,'#8a3327');
  flat(g,w+24,20,0,0.02,d/2+12,MAT.plaza);
  return g;
}

/* ---------- 景观：二龙山 ---------- */
function buildErlongMountain(){
  var g=new THREE.Group(); g.name='NUC_erlong-mountain';
  var W=150,D=190;
  function peak(x,z,cx,cz,rx,rz,h){
    var dx=(x-cx)/rx,dz=(z-cz)/rz,r=dx*dx+dz*dz;
    return h*Math.pow(Math.max(0,1-r),1.6);
  }
  function height(x,z){
    return peak(x,z,-16,-20,58,72,30)+peak(x,z,28,34,40,52,20)+peak(x,z,-38,46,30,36,12);
  }
  var geo=new THREE.PlaneGeometry(W,D,48,48);
  geo.rotateX(-Math.PI/2);
  var pos=geo.attributes.position, colors=[];
  var colLow=new THREE.Color(0x5d8a4c), colMid=new THREE.Color(0x3f6a3c), colHigh=new THREE.Color(0x8b8c7e);
  for(var i=0;i<pos.count;i++){
    var x=pos.getX(i),z=pos.getZ(i),y=height(x,z);
    pos.setY(i,y);
    var t=Math.min(1,y/30), c;
    if(t<0.6) c=colLow.clone().lerp(colMid,t/0.6);
    else c=colMid.clone().lerp(colHigh,(t-0.6)/0.4);
    colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.computeVertexNormals();
  var mm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
  var land=new THREE.Mesh(geo,mm); land.receiveShadow=true; g.add(land);
  /* 龙山之巅观景亭 */
  var hy=height(-16,-20);
  var pav=new THREE.Group(); pav.position.set(-16,hy,-20); g.add(pav);
  cyl(pav,7.5,7.5,0.5,6,0,0.25,0,MAT.stone,{cast:false});
  for(var p=0;p<6;p++){
    var a=p*Math.PI/3;
    cyl(pav,0.28,0.32,4.4,8,Math.cos(a)*6,2.45,Math.sin(a)*6,MAT.brick);
  }
  cyl(pav,7.4,7.4,0.45,6,0,4.7,0,MAT.roofRed);
  cone(pav,7.8,3.4,0,6.6,0,MAT.roofRed,6);
  /* 碉堡与战壕 */
  [[40,-48],[-52,-56],[16,62]].forEach(function(pt){
    var yy=height(pt[0],pt[1]);
    cyl(g,3.2,3.6,2.8,10,pt[0],yy+1.4,pt[1],MAT.rock);
    cyl(g,3.6,3.6,0.4,10,pt[0],yy+2.9,pt[1],MAT.stone,{cast:false});
    box(g,1.2,0.9,0.2,pt[0],yy+1.6,pt[1]+3.5,MAT.darkBase2,{cast:false});
  });
  /* 龙山飞瀑 */
  var fy=height(34,10);
  var fall=box(g,3.2,Math.max(6,fy),0.25,34,fy/2,10,M(0xc9e3e8,0.2,0,{transparent:true,opacity:0.72}),{cast:false});
  box(g,6,0.6,4,34,0.4,10.5,MAT.water,{cast:false});
  /* 登山步道（石板） */
  for(var s=0;s<16;s++){
    var t=s/15, px=-60+t*56, pz=68-t*88;
    var py=height(px,pz)+0.12;
    box(g,3.4,0.2,2.4,px,py,pz,MAT.stone,{cast:false,rz:0.2});
  }
  /* 植被 */
  for(var k=0;k<34;k++){
    var tx=(Math.random()-0.5)*W*0.88, tz=(Math.random()-0.5)*D*0.88;
    var ty=height(tx,tz);
    if(ty<1.5) continue;
    tree(g,tx,tz,0.7+Math.random()*0.5,'pine',ty);
  }
  /* tree 生成的各部件统一抬高（简化：按最近高度重排） */
  return g;
}
/* ---------- 景观：柏林园 ---------- */
function buildBailinGarden(){
  var g=new THREE.Group(); g.name='NUC_bailin-garden';
  flat(g,88,80,0,0.02,0,M(0x6f9a5c,1));
  /* 水面 */
  var pool=new THREE.Mesh(new THREE.CircleGeometry(20,40),MAT.water);
  pool.rotation.x=-Math.PI/2; pool.scale.set(1.5,1,1); pool.position.set(0,0.08,-8); g.add(pool);
  var edge=new THREE.Mesh(new THREE.RingGeometry(20,21.4,40),MAT.stone);
  edge.rotation.x=-Math.PI/2; edge.scale.set(1.5,1,1); edge.position.set(0,0.1,-8); g.add(edge);
  /* 喷泉 */
  cyl(g,3.2,3.6,0.7,20,0,0.45,-8,MAT.stone,{cast:false});
  cyl(g,0.55,0.8,4.0,12,0,2.8,-8,M(0xbfe0e8,0.15,0.1,{transparent:true,opacity:0.75}),{cast:false});
  sphere(g,1.1,0,5.2,-8,M(0xd6eef2,0.1,0.1,{transparent:true,opacity:0.6}),10);
  /* 木长廊 */
  var lg=new THREE.Group(); lg.position.set(-30,0,20); g.add(lg);
  for(var p=0;p<9;p++){
    var px=-20+p*5;
    cyl(lg,0.22,0.26,3.6,8,px,1.8,0,MAT.brick);
    cyl(lg,0.22,0.26,3.6,8,px,1.8,4,MAT.brick);
  }
  box(lg,44,0.4,5.6,0,3.9,2,MAT.roofRed);
  box(lg,44,0.25,0.3,0,3.7,4.7,MAT.brick2,{cast:false});
  box(lg,44,0.18,4.2,0,0.12,2,MAT.plaza,{cast:false});
  /* 校歌曲谱石刻 */
  box(g,7,3.4,1.2,28,1.7,22,MAT.stone);
  sign(g,'校歌',4.6,1.6,28,2.3,22.66,'#4a4a42');
  /* 曲径 */
  for(var i=0;i<12;i++){
    var a=i*0.55;
    box(g,3.2,0.12,2.2,Math.cos(a)*34,0.09,Math.sin(a)*30,MAT.plaza,{cast:false,ry:a});
  }
  /* 柳树与绿植 */
  for(var t=0;t<12;t++){
    var ta=t*Math.PI/6;
    tree(g,Math.cos(ta)*36,Math.sin(ta)*32,0.95);
  }
  return g;
}
/* ---------- 景观：1936 铁路主题公园 ---------- */
function buildRailwayPark(){
  var g=new THREE.Group(); g.name='NUC_railway-park';
  flat(g,108,62,0,0.02,0,MAT.plaza);
  /* 1936 广场 */
  cyl(g,12,12,0.35,32,-34,0.18,18,MAT.wallStone,{cast:false});
  cyl(g,2.4,3.2,6,12,-34,3.2,18,MAT.metal);
  sphere(g,2.2,-34,7.0,18,MAT.gold,12);
  sign(g,'1936',7,2.2,-34,2.0,30.7,'#8a3327');
  /* 铁轨 + 枕木 */
  for(var r=-1;r<=1;r+=2){
    box(g,96,0.22,0.24,0,0.45,r*1.1,MAT.metal,{cast:false});
  }
  for(var s=0;s<40;s++){
    box(g,3.6,0.16,0.55,-46+s*2.35,0.28,0,MAT.treeTrunk,{cast:false});
  }
  /* 木站台 */
  box(g,52,0.9,7,0,0.55,-9,M(0x8a6a45,1));
  for(var pl=0;pl<6;pl++) cyl(g,0.2,0.24,3.0,8,-22+pl*9,2.1,-9,MAT.metal,{cast:false});
  /* 东风7型内燃机车 */
  var locoMat=M(0x2c5445,0.55,0.35);
  var loco=new THREE.Group(); loco.position.set(-22,1.6,1.1); g.add(loco);
  box(loco,17,3.2,4.0,0,1.8,0,locoMat);
  box(loco,4.4,3.0,4.2,5.6,4.6,0,locoMat);
  box(loco,4.2,1.5,0.12,5.6,5.0,2.1,MAT.glassLite,{cast:false});
  box(loco,4.2,1.5,0.12,5.6,5.0,-2.1,MAT.glassLite,{cast:false});
  box(loco,18,0.35,4.4,0,3.6,0,MAT.darkBase,{cast:false});
  cyl(loco,0.55,0.55,0.9,12,-4.5,4.1,0,MAT.darkBase);
  for(var w=0;w<6;w++){
    for(var sd=-1;sd<=1;sd+=2) cyl(loco,0.85,0.85,0.25,12,-6.5+w*2.6,0.6,sd*1.9,MAT.darkBase,{rx:Math.PI/2});
  }
  box(loco,17.4,0.25,0.25,0,1.2,2.15,MAT.gold,{cast:false});
  /* 双层客车 x2 */
  for(var ci=0;ci<2;ci++){
    var car=new THREE.Group(); car.position.set(12+ci*22,1.6,1.1); g.add(car);
    box(car,19,4.6,3.8,0,2.4,0,locoMat);
    box(car,19.4,0.4,4.0,0,4.9,0,MAT.darkBase,{cast:false});
    for(var row=0;row<2;row++){
      for(var cw=0;cw<8;cw++){
        for(var side=-1;side<=1;side+=2){
          box(car,1.7,1.0,0.12,-8+cw*2.3,1.9+row*1.9,side*1.95,MAT.glassLite,{cast:false});
        }
      }
    }
    box(car,19.4,0.22,0.22,0,3.0,2.0,MAT.gold,{cast:false});
    for(var cwi=0;cwi<4;cwi++) for(var cs=-1;cs<=1;cs+=2)
      cyl(car,0.7,0.7,0.22,10,-6+cwi*4,0.45,cs*1.8,MAT.darkBase,{rx:Math.PI/2});
  }
  /* 信号灯与道岔 */
  for(var sg=0;sg<2;sg++){
    var sx=sg?44:-46;
    cyl(g,0.18,0.24,5.0,8,sx,2.5,5,MAT.metal);
    sphere(g,0.42,sx,4.9,5,M(0xb43a2a,0.5),10);
    sphere(g,0.42,sx,4.0,5,M(0x3a8b52,0.5),10);
  }
  for(var tr=0;tr<5;tr++) tree(g,-40+tr*20,24,0.9);
  return g;
}
/* ---------- 红房子 / 阁子楼 ---------- */
function buildRedHouses(){
  var g=new THREE.Group(); g.name='NUC_red-houses';
  flat(g,76,50,0,0.02,0,MAT.plaza);
  var pts=[[-22,-10,30,14],[16,-10,26,14],[-20,16,24,12],[18,16,22,12]];
  pts.forEach(function(p,i){
    var x=p[0],z=p[1],w=p[2],d=p[3],h=8;
    box(g,w,h,d,x,h/2+0.4,z,MAT.brick);
    box(g,w+1,0.8,d+1,x,0.4,z,MAT.stone);
    gableRoof(g,w,d,3.2,x,h+0.8,z,MAT.roof,1.0);
    var qb=new QB();
    gridWindows(qb,{face:'front',w:w,d:d,y0:1.6,floors:2,floorH:3.6,cols:Math.round(w/3.4),winW:1.7,winH:2.0,lift:0.09});
    var wm=qb.mesh(MAT.glassLite);
    if(wm){ wm.position.set(x,0,z); g.add(wm); }
    box(g,2.2,3.0,0.25,x,1.9,z+d/2+0.2,MAT.darkBase,{cast:false});
    box(g,w+1,0.35,0.4,x,h*0.5+0.4,z+d/2+0.3,MAT.wallWhite,{cast:false});
  });
  for(var t=0;t<6;t++) tree(g,-34+t*13,0,0.8);
  return g;
}
function buildGezilou(){
  var g=new THREE.Group(); g.name='NUC_gezilou';
  var w=40,d=20,h=11;
  box(g,w,h,d,0,h/2+0.5,0,MAT.brick2);
  box(g,w+1,1,d+1,0,0.5,0,MAT.stone);
  gableRoof(g,w,d,3.6,0,h+1,0,MAT.roof,1.2);
  var qb=new QB();
  gridWindows(qb,{face:'front',w:w,d:d,y0:1.6,floors:3,floorH:3.3,cols:11,winW:1.8,winH:1.9,lift:0.1});
  gridWindows(qb,{face:'back',w:w,d:d,y0:1.6,floors:3,floorH:3.3,cols:11,winW:1.8,winH:1.9,lift:0.1});
  var wm=qb.mesh(MAT.glassLite); if(wm) g.add(wm);
  /* 外廊 */
  for(var p=0;p<9;p++) cyl(g,0.24,0.28,4.0,8,-18+p*4.5,2.0,d/2+3,MAT.wallStone);
  box(g,40,0.35,6.5,0,4.1,d/2+3,MAT.roofRed);
  box(g,40,0.2,6.5,0,0.15,d/2+3,MAT.plaza,{cast:false});
  stairs(g,10,4,4,0,d/2+8,MAT.plaza,0.24);
  sign(g,'阁子楼',7,1.6,0,7.0,d/2+0.5,'#e0d8c0');
  flat(g,54,16,0,0.02,d/2+10,MAT.plaza);
  return g;
}

/* ---------- 配套构件 ---------- */
function buildLamp(){ var g=new THREE.Group(); g.name='NUC_street-lamp'; lamp(g,0,0,1); return g; }
function buildTree(){ var g=new THREE.Group(); g.name='NUC_campus-tree'; tree(g,0,0,1); return g; }
function buildFlag(){
  var g=new THREE.Group(); g.name='NUC_flagpole';
  cyl(g,1.3,1.6,0.8,16,0,0.4,0,MAT.stone);
  cyl(g,0.22,0.32,15,12,0,7.5,0,MAT.steel);
  sphere(g,0.4,0,15.1,0,MAT.gold,10);
  box(g,5.0,3.0,0.1,2.5,12.6,0,MAT.brick,{cast:false});
  return g;
}

/* ---------- 整校地面与路网（createCampus 可选） ---------- */
function campusGround(){
  var g=new THREE.Group(); g.name='NUC_campus-ground';
  flat(g,660,620,0,0,0,MAT.grass);
  var road=M(0x59605c,1);
  /* 南北中轴（礼仪 / 发展轴） */
  flat(g,18,540,0,0.03,0,road);
  /* 东西礼仪轴 */
  flat(g,540,14,0,0.032,-40,road);
  /* 环路 */
  flat(g,540,12,0,0.032,-218,road);
  flat(g,540,12,0,0.032,222,road);
  flat(g,12,452,-262,0.032,0,road);
  flat(g,12,452,262,0.032,0,road);
  /* 生活区 / 运动区支路 */
  flat(g,10,300,-150,0.031,40,road);
  flat(g,10,300,150,0.031,40,road);
  flat(g,300,10,0,0.031,170,road);
  flat(g,300,10,0,0.031,-140,road);
  /* 中轴虚线 */
  for(var z=-250;z<250;z+=10) box(g,0.35,0.02,5,0,0.06,z,MAT.whiteLine,{cast:false});
  /* 各处广场铺装 */
  [[0,196,70,60],[0,138,92,60],[0,-92,126,58],[0,-206,100,80],[-152,-6,88,80],[186,44,180,116]].forEach(function(p){
    flat(g,p[2],p[3],p[0],0.02,p[1],M(0xc8c3b6,1));
  });
  /* 中轴绿化带 */
  for(var s=-1;s<=1;s+=2){
    flat(g,10,420,s*17,0.025,0,M(0x527f47,1));
    for(var t=0;t<26;t++) tree(g,s*17,-200+t*16,0.8,t%3?'pine':null);
  }
  return g;
}

/* ============================================================
 * 对外 API
 * ============================================================ */
var builders = {
  'main-building':buildMainBuilding, 'library':buildLibrary,
  'dehuai-building':buildDehuaiBuilding, 'weapon-science':buildWeaponScience,
  'teaching-01':buildTeaching01, 'teaching-09':buildTeaching09,
  'teaching-12':buildTeaching12, 'lab-complex':buildLabComplex,
  'south-gate':buildSouthGate, 'dehuai-square':buildDehuaiSquare,
  'xingzhi-square':buildXingzhiSquare, 'weapons-museum':buildWeaponsMuseum,
  'keyi-hall':buildKeyiHall,
  'dorm-wenying':buildDorm('dorm-wenying'), 'dorm-wentao':buildDorm('dorm-wentao'),
  'canteen-longshan':buildCanteen(true), 'canteen-tianyuan':buildCanteen(false),
  'campus-street':buildCampusStreet, 'service-center':buildServiceCenter,
  'stadium':buildStadium, 'basketball':buildBasketball, 'gymnasium':buildGymnasium,
  'erlong-mountain':buildErlongMountain, 'bailin-garden':buildBailinGarden,
  'railway-park':buildRailwayPark, 'red-houses':buildRedHouses, 'gezilou':buildGezilou,
  'street-lamp':buildLamp, 'campus-tree':buildTree, 'flagpole':buildFlag
};

var defMap = {};
CATALOG.forEach(function(d){ defMap[d.id]=d; });

function get(id){ return defMap[id]||null; }
function create(id, opts){
  opts=opts||{};
  var fn=builders[id]; if(!fn) return null;
  var d=defMap[id];
  var g=fn();
  g.userData = {
    nucId:id, name:d.name, category:d.category,
    footprint:d.footprint, height:d.height, floors:d.floors,
    position:d.pos, unit:'meter', front:'+Z', source:'NUC 3D Asset Library'
  };
  if(opts.position) g.position.fromArray(opts.position);
  if(opts.rotationY) g.rotation.y=opts.rotationY;
  if(opts.scale) g.scale.setScalar(opts.scale);
  return g;
}
function createCampus(opts){
  opts=opts||{};
  var root=new THREE.Group(); root.name='NUC_Campus';
  root.userData={ name:'中北大学整校布局', unit:'meter', count:CATALOG.length };
  CATALOG.forEach(function(d){
    var g=create(d.id);
    if(!g) return;
    g.position.set(d.pos[0],d.pos[1],d.pos[2]);
    g.rotation.y=d.rot||0;
    root.add(g);
  });
  if(opts.ground!==false) root.add(campusGround());
  return root;
}
function layout(){
  return {
    name:'中北大学 3D 建筑资产库 · 整校布局',
    version:'1.0.0',
    unit:'meter',
    convention:'origin = building ground center, front faces +Z, Y up',
    note:'按公开照片与校园格局重建，非测绘级精确复原；坐标可自由调整后导入你的游戏。',
    count:CATALOG.length,
    buildings:CATALOG.map(function(d){
      return { id:d.id, name:d.name, category:d.category,
        position:{x:d.pos[0],y:d.pos[1],z:d.pos[2]}, rotationY:d.rot||0,
        footprint:{w:d.footprint[0],d:d.footprint[1]}, height:d.height,
        floors:d.floors, year:d.year, desc:d.desc };
    })
  };
}
function dispose(group){
  if(!group) return;
  group.traverse(function(o){
    if(o.geometry && o.geometry.dispose) o.geometry.dispose();
  });
}

var NUC = {
  version:'1.0.0',
  unit:'meter',
  catalog:CATALOG,
  list:function(){ return CATALOG.slice(); },
  get:get,
  create:create,
  createCampus:createCampus,
  campusGround:campusGround,
  layout:layout,
  setNight:setNight,
  isNight:function(){ return nightOn; },
  materials:MAT,
  dispose:dispose
};


/* ============================================================
 * 按官方照片精修的单体构建器 + 真实路网地面 + 资产注册
 * ============================================================ */

var MAT2 = {
  red:      M(0xb04436,0.92),
  redDark:  M(0x8e352a,0.92),
  cream:    M(0xe7dfcd,0.9),
  tan:      M(0xc7b394,0.9),
  blueFrame:M(0x1f4f86,0.5,0.35),
  blueRoof: M(0x2c5c93,0.5,0.3),
  blackGlass:M(0x1d2b31,0.14,0.5,{side:THREE.DoubleSide}),
  flower:   M(0xc4738f,1),
  flower2:  M(0xe0a5b6,1),
  white:    M(0xf2efe6,0.9),
  rail:     M(0x6a6f6b,0.6,0.4),
  sleeper:  M(0x5a4630,1),
  river:    M(0x4a8ba8,0.16,0.2,{transparent:true,opacity:0.88}),
  plaza2:   M(0x7c7869,1),
  road2:    M(0x4a514c,1),
  grass3:   M(0x3f6b34,1)
};

/* 给地面 / 铺装 / 道路套上程序化纹理（共享材质，一次生效） */
(function applySurface(){
  var tp=surfaceTexture('plaza'),tg=surfaceTexture('grass'),tr=surfaceTexture('road');
  if(!tp||!tg||!tr) return;
  tp.repeat.set(14,14); tg.repeat.set(160,160); tr.repeat.set(5,5);
  [MAT.plaza,MAT2.plaza2].forEach(function(m){ m.color.setHex(0xffffff); m.map=tp; m.needsUpdate=true; });
  [MAT.grass,MAT2.grass3].forEach(function(m){ m.color.setHex(0xffffff); m.map=tg; m.needsUpdate=true; });
  [MAT.road,MAT2.road2].forEach(function(m){ m.color.setHex(0xffffff); m.map=tr; m.needsUpdate=true; });
})();

/* 竖排楼名（逸夫楼等） */
function signV(g,text,w,h,x,y,z,color){
  if(typeof document==='undefined') return null;
  var cv=document.createElement('canvas'); cv.width=128; cv.height=512;
  var c=cv.getContext('2d');
  c.font='bold 82px "Microsoft YaHei","PingFang SC",sans-serif';
  c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=color||'#4a4033';
  for(var i=0;i<text.length;i++) c.fillText(text[i],64,70+i*100);
  var tex=new THREE.CanvasTexture(cv);
  var m=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  var me=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);
  me.position.set(x,y,z); g.add(me); return me;
}
/* 带名称的建筑招牌（横排） */
function nameSign(g,name,w,x,y,z,bg){
  return sign(g,name,w,Math.min(2.6,w/3.6),x,y,z,bg?'#a8362b':'#8a3327',bg||null);
}

/* ---------- 红白 / 米色板式宿舍（按官网「学生公寓」照片） ---------- */
function dormBlock(d,red){
  var g=new THREE.Group(); g.name='NUC_'+d.id;
  var w=d.footprint[0],dp=d.footprint[1],floors=d.floors||6,fh=3.4,h=floors*fh;
  var wall=red?MAT2.white:MAT2.cream, accent=red?MAT2.red:MAT2.tan;
  box(g,w,h,dp,0,h/2+0.4,0,wall);
  box(g,w+0.8,0.8,dp+0.8,0,0.4,0,MAT.darkBase);
  /* 红色竖向分格带与端墙 */
  var bands=6;
  for(var b=0;b<=bands;b++){
    var bx=-w/2+b*(w/bands);
    box(g,1.1,h,0.28,bx,h/2+0.4,dp/2+0.16,accent,{cast:false});
    box(g,1.1,h,0.28,bx,h/2+0.4,-dp/2-0.16,accent,{cast:false});
  }
  for(var sd=-1;sd<=1;sd+=2) box(g,0.3,h,dp+0.6,sd*(w/2+0.02),h/2+0.4,0,accent);
  /* 窗格 + 阳台 */
  var qb=new QB(), cols=9;
  ['front','back'].forEach(function(f){
    gridWindows(qb,{face:f,w:w,d:dp,y0:1.4,floors:floors,floorH:fh,cols:cols,winW:1.9,winH:1.9,lift:0.3});
  });
  var wm=qb.mesh(MAT.glass); if(wm) g.add(wm);
  for(var f2=0;f2<floors;f2++){
    var yy=0.4+f2*fh+0.15;
    box(g,w-1,0.14,1.1,0,yy,dp/2+0.6,MAT2.white,{cast:false});
    box(g,w-1,0.75,0.12,0,yy+0.45,dp/2+1.14,MAT.metal,{cast:false});
    box(g,w+0.3,0.2,dp+0.3,0,0.4+(f2+1)*fh,0,accent,{cast:false});
  }
  /* 屋顶红色檐口 */
  box(g,w+0.8,0.9,dp+0.8,0,h+0.85,0,accent);
  /* 单元入口 */
  box(g,4.2,3.0,0.3,0,1.9,dp/2+0.35,MAT.glass,{cast:false});
  box(g,6,0.5,2.4,0,3.6,dp/2+1.4,MAT2.white);
  flat(g,w+8,8,0,0.02,dp/2+6,MAT.plaza2);
  return g;
}

/* ---------- 通用板楼教学楼 ---------- */
function teachSlab(d,opt){
  opt=opt||{};
  var g=new THREE.Group(); g.name='NUC_'+d.id;
  var w=d.footprint[0],dp=d.footprint[1],floors=d.floors||5;
  var fh=Math.max(3.2,d.height/(floors||5));
  var wall=opt.wall||MAT.wallWarm, glass=opt.glass||MAT.glass;
  slabBuilding(g,{w:w,d:dp,floors:floors,fh:fh,wall:wall,glass:glass,
    bay:4.2,winW:2.5,base:0.7,baseMat:MAT.stone});
  box(g,Math.min(18,w*0.35),1.3,5,0,7.0,dp/2+2.5,MAT2.white);
  box(g,8,4.6,0.3,0,2.8,dp/2+0.25,MAT.glass,{cast:false});
  stairs(g,Math.min(20,w*0.42),5,5,0,dp/2+7,MAT.plaza2,0.24);
  nameSign(g,d.name.replace(/\（.*?\）/g,''),Math.min(12,w*0.3),0,8.1,dp/2+2.8);
  flat(g,w+14,12,0,0.02,dp/2+8,MAT.plaza2);
  return g;
}
/* ---------- 玻璃实验楼 ---------- */
function teachGlass(d){
  var g=new THREE.Group(); g.name='NUC_'+d.id;
  var w=d.footprint[0],dp=d.footprint[1],floors=d.floors||6,fh=d.height/floors,h=d.height;
  box(g,w,h,dp,0,h/2+0.8,0,MAT.wallStone);
  box(g,w+1,0.8,dp+1,0,0.4,0,MAT.darkBase);
  box(g,w-4,h-3,0.3,0,h/2+0.8,dp/2+0.2,MAT.glassBlue,{cast:false});
  for(var i=0;i<Math.max(6,Math.round(w/5));i++)
    box(g,0.42,h-3,0.5,-w/2+2+i*(w-4)/Math.max(6,Math.round(w/5)),h/2+0.8,dp/2+0.45,MAT2.white,{cast:false});
  for(var f=1;f<floors;f++) box(g,w-4,0.22,0.5,0,0.8+f*fh,dp/2+0.45,MAT2.white,{cast:false});
  var qb=new QB();
  ['back','left','right'].forEach(function(face){
    gridWindows(qb,{face:face,w:w,d:dp,y0:2,floors:floors,floorH:fh,
      cols:Math.max(4,Math.round((face==='back'?w:dp)/4.5)),winW:2.4,winH:Math.min(2.6,fh*0.6),lift:0.1});
  });
  var wm=qb.mesh(MAT.glass); if(wm) g.add(wm);
  box(g,w+2,1.2,dp+2,0,h+1.4,0,MAT.metal);
  box(g,w*0.32,2.2,dp*0.4,0,h+3,0,MAT.metal);
  nameSign(g,d.name.replace(/\（.*?\）/g,''),Math.min(13,w*0.3),0,6.2,dp/2+0.7,true);
  flat(g,w+16,14,0,0.02,dp/2+9,MAT.plaza2);
  return g;
}

/* ---------- 逸夫楼（米黄高层 + 竖排楼名） ---------- */
function buildYifu(d){
  var g=new THREE.Group(); g.name='NUC_yifu';
  var w=44,dp=28,h=32,floors=9,fh=h/floors;
  box(g,w,h,dp,0,h/2+0.6,0,MAT2.tan);
  box(g,w+1,0.6,dp+1,0,0.3,0,MAT.darkBase);
  var qb=new QB();
  ['front','back','left','right'].forEach(function(face){
    gridWindows(qb,{face:face,w:w,d:dp,y0:1.6,floors:floors,floorH:fh,
      cols:(face==='front'||face==='back')?9:6,winW:2.4,winH:2.1,lift:0.08});
  });
  var wm=qb.mesh(MAT.glass); if(wm) g.add(wm);
  for(var i=0;i<8;i++) box(g,0.55,h,0.6,-w/2+2.5+i*(w-5)/7,h/2+0.6,dp/2+0.35,MAT2.white);
  box(g,w+2,1.4,dp+2,0,h+1.3,0,MAT2.white);
  /* 右侧竖排楼名 */
  signV(g,'逸夫楼',3.0,11,w/2+0.5,h*0.62,dp/2-1,'#4a3f31');
  box(g,18,1.2,6,0,7.5,dp/2+3,MAT2.white);
  for(var p=0;p<5;p++) cyl(g,0.5,0.55,6.5,10,-7+p*3.5,3.6,dp/2+5,MAT2.white);
  stairs(g,20,6,6,0,dp/2+10,MAT.plaza2,0.26);
  flat(g,w+20,18,0,0.02,dp/2+11,MAT.plaza2);
  return g;
}
/* ---------- 学术交流中心（蓝玻璃 + 米色框架 + 红字招牌） ---------- */
function buildExchange(d){
  var g=new THREE.Group(); g.name='NUC_academic-exchange';
  var w=46,dp=34,h=32,floors=8,fh=h/floors;
  box(g,w,h,dp,0,h/2+0.7,0,MAT2.cream);
  box(g,w+1,0.7,dp+1,0,0.35,0,MAT.darkBase);
  for(var i=0;i<=9;i++){
    var x=-w/2+i*(w/9);
    box(g,0.85,h,0.65,x,h/2+0.7,dp/2+0.35,MAT2.blueFrame);
    box(g,0.85,h,0.65,x,h/2+0.7,-dp/2-0.35,MAT2.blueFrame);
  }
  for(var f=0;f<floors;f++){
    box(g,w,0.55,0.65,0,0.7+f*fh,dp/2+0.35,MAT2.blueFrame,{cast:false});
    if(f>0){
      for(var c=0;c<9;c++) box(g,3.9,fh-1.0,0.25,-w/2+(c+0.5)*(w/9),0.7+f*fh+fh/2,dp/2+0.22,MAT.glassBlue,{cast:false});
    }
  }
  /* 底层通高玻璃入口 */
  box(g,w-4,5.6,0.3,0,3.4,dp/2+0.45,MAT.glassLite,{cast:false});
  box(g,20,1.4,6,0,7.2,dp/2+3,MAT2.white);
  /* 顶部红色招牌 */
  box(g,w-4,2.8,0.5,0,h+1.6,dp/2+0.6,MAT2.white);
  sign(g,'学术交流中心',26,2.2,0,h+1.6,dp/2+0.95,'#c8322b');
  stairs(g,24,6,6,0,dp/2+10,MAT.plaza2,0.26);
  flat(g,w+18,16,0,0.02,dp/2+11,MAT.plaza2);
  return g;
}
/* ---------- 先进制造中心（蓝色折板大跨屋顶） ---------- */
function buildAdvanced(d){
  var g=new THREE.Group(); g.name='NUC_advanced-mfg';
  var w=56,dp=34,h=13;
  box(g,w,h,dp,0,h/2+0.6,0,MAT2.cream);
  box(g,w+1,0.6,dp+1,0,0.3,0,MAT.darkBase);
  /* 大面积玻璃窗带 */
  for(var f=0;f<3;f++){
    box(g,w-4,2.6,0.3,0,2.2+f*3.6,dp/2+0.2,MAT.glassBlue,{cast:false});
    box(g,w-4,2.6,0.3,0,2.2+f*3.6,-dp/2-0.2,MAT.glassBlue,{cast:false});
    for(var i=0;i<11;i++) box(g,0.3,2.6,0.45,-w/2+2+i*(w-4)/10,2.2+f*3.6,dp/2+0.4,MAT2.tan,{cast:false});
  }
  /* 蓝色折线坡屋顶：多段斜板 */
  for(var s=0;s<8;s++){
    var t=(s+0.5)/8, z=-dp/2+t*dp;
    var yy=h+0.6+Math.sin(t*Math.PI)*3.2;
    box(g,w+3,0.5,dp/8*1.15,0,yy,z,MAT2.blueRoof,{rx:(t<0.5?1:-1)*0.28});
  }
  for(var k=0;k<9;k++) box(g,0.3,0.3,dp+2,-w/2+k*(w/8),h+1.2,0,MAT.metal,{cast:false});
  box(g,14,1.0,5,0,5.4,dp/2+2.5,MAT2.white);
  flat(g,w+16,14,0,0.02,dp/2+9,MAT.plaza2);
  return g;
}

/* ---------- 德怀楼四翼（按官网照片：白楼 + 黑玻璃竖带 + 横窗翼楼） ---------- */
function buildDehuaiWings(d){
  var g=new THREE.Group(); g.name='NUC_dehuai-building';
  /* 四翼环抱德怀广场，中心留空 */
  var wings=[[-42,-34,44,16,6],[42,-34,44,16,6],[-42,34,44,16,5],[42,34,44,16,5]];
  wings.forEach(function(wg,i){
    var sub=new THREE.Group(); sub.position.set(wg[0],0,wg[1]); g.add(sub);
    var w=wg[2],dp=wg[3],floors=wg[4],fh=3.6,h=floors*fh;
    box(sub,w,h,dp,0,h/2+0.6,0,MAT2.white);
    box(sub,w+0.8,0.6,dp+0.8,0,0.3,0,MAT.stone);
    var qb=new QB();
    ['front','back'].forEach(function(face){
      gridWindows(qb,{face:face,w:w,d:dp,y0:1.5,floors:floors,floorH:fh,cols:11,winW:2.4,winH:2.0,lift:0.08});
    });
    var wm=qb.mesh(MAT.glass); if(wm) sub.add(wm);
    box(sub,w+1,0.9,dp+1,0,h+1.1,0,MAT2.redDark);
  });
  /* 北侧主楼：白色高层 + 中央黑色玻璃竖带 + 左侧横窗翼 */
  var main=new THREE.Group(); main.position.set(0,0,-52); g.add(main);
  box(main,34,34,18,0,17.6,0,MAT2.white);
  box(main,9,32,0.4,0,17,9.25,MAT2.blackGlass,{cast:false});
  for(var r=0;r<9;r++) box(main,34,0.18,0.4,0,2.0+r*3.6,9.3,MAT2.white,{cast:false});
  var qb2=new QB();
  gridWindows(qb2,{face:'front',w:34,d:18,y0:2.4,floors:9,floorH:3.6,cols:8,winW:2.5,winH:2.2,lift:0.45,
    skip:function(f,c){ return c===3||c===4; }});
  var wm2=qb2.mesh(MAT.glass); if(wm2) main.add(wm2);
  /* 横窗翼楼 */
  box(main,26,15,14,-30,8.1,0,MAT2.white);
  for(var k=0;k<4;k++) box(main,23,1.5,0.3,-30,3+k*3.5,7.2,MAT.glass,{cast:false});
  /* 低层裙房 */
  box(main,52,6,12,0,3.6,14,MAT2.cream);
  box(main,46,3.2,0.3,0,2.2,20.1,MAT.glassLite,{cast:false});
  box(main,54,0.8,14,0,6.9,14,MAT2.white);
  return g;
}

/* ---------- 科艺苑（门形礼堂 + 红柱金字 + 宽台阶） ---------- */
function buildKeyi(d){
  var g=new THREE.Group(); g.name='NUC_keyi-hall';
  var w=46,dp=34,h=15;
  box(g,w,h,dp,0,h/2+0.8,0,MAT2.cream);
  box(g,w+1,0.8,dp+1,0,0.4,0,MAT.stone);
  /* 中央入口凹进 */
  box(g,14,8.5,1.2,0,4.8,dp/2+0.4,MAT.darkBase);
  box(g,11,6.5,0.3,0,3.8,dp/2+1.05,MAT.glass,{cast:false});
  /* 两侧红色门柱 */
  for(var s=-1;s<=1;s+=2){
    box(g,4.6,h+1,4.6,s*(w/2-3),(h+1)/2+0.8,dp/2+1.6,MAT2.red);
    signV(g,s<0?'发扬兵工精神':'再铸中北辉煌',2.6,9.6,s*(w/2-3),(h+1)*0.55+0.8,dp/2+4.0,'#e8c66a');
    /* 斜纹装饰 */
    for(var q=0;q<5;q++) box(g,1.2,0.5,0.2,s*(w/2-3),2+q*0.9,dp/2+4.0,M(0xd8b45c,0.6),{rz:0.5,cast:false});
  }
  box(g,w+2,2.4,5,0,h+1.8,dp/2+1.6,MAT2.cream);
  sphere(g,1.3,0,h+2.2,dp/2+4.2,MAT.gold,12);
  sign(g,'科 艺 苑',13,2.4,0,h-1.0,dp/2+0.6,'#d1a83e');
  stairs(g,22,10,9,0,dp/2+9,MAT.plaza2,0.28);
  /* 台阶两侧花坛 */
  for(var sd=-1;sd<=1;sd+=2){
    for(var st=0;st<3;st++){
      box(g,10,0.45,3,sd*(17+st*0.6),0.25+st*0.28,dp/2+8+st*1.6,MAT2.redDark,{cast:false});
      box(g,9.2,0.12,2.4,sd*(17+st*0.6),0.52+st*0.28,dp/2+8+st*1.6,MAT.grass2,{cast:false});
    }
  }
  flat(g,w+28,20,0,0.02,dp/2+13,MAT.plaza2);
  return g;
}

/* ---------- 阁子楼（对称红砖双楼 + 三角山墙 + 牡丹花圃） ---------- */
function buildGezi(d){
  var g=new THREE.Group(); g.name='NUC_gezilou';
  var h=8;
  for(var s=-1;s<=1;s+=2){
    var sub=new THREE.Group(); sub.position.set(s*12,0,0); g.add(sub);
    box(sub,20,h,14,0,h/2+0.5,0,MAT.brick);
    box(sub,21,1,15,0,0.5,0,MAT.stone);
    gableRoof(sub,20,14,4.2,0,h+1,0,MAT.roofRed,1.1);
    /* 三角山墙上的白窗套 */
    var qb=new QB();
    gridWindows(qb,{face:'front',w:20,d:14,y0:1.5,floors:2,floorH:3.4,cols:5,winW:2.2,winH:2.2,lift:0.08});
    gridWindows(qb,{face:'back',w:20,d:14,y0:1.5,floors:2,floorH:3.4,cols:5,winW:2.2,winH:2.2,lift:0.08});
    var wm=qb.mesh(MAT.glassLite); if(wm) sub.add(wm);
    for(var c=0;c<5;c++) box(sub,2.6,0.22,0.25,-8+c*4,1.4,7.15,MAT2.white,{cast:false});
    box(sub,2.4,3.2,0.25,0,2.1,7.15,MAT.darkBase,{cast:false});
  }
  /* 牡丹花圃 */
  for(var i=0;i<26;i++){
    var fx=(Math.random()-0.5)*54, fz=10+Math.random()*10;
    box(g,1.6,0.35,1.6,fx,0.18,fz,MAT.grass2,{cast:false});
    sphere(g,0.45,fx,0.75,fz,i%2?MAT2.flower:MAT2.flower2,7);
  }
  flat(g,60,26,0,0.02,10,MAT.plaza2);
  return g;
}

/* ---------- 真草坪体育场（跑道 + 看台 + 红顶白墙背景楼） ---------- */
function buildStadiumReal(d){
  var g=new THREE.Group(); g.name='NUC_stadium';
  flat(g,180,116,0,0.01,0,MAT.plaza2);
  var ring=new THREE.Mesh(new THREE.RingGeometry(34,47,72),MAT.track);
  ring.rotation.x=-Math.PI/2; ring.scale.set(1.62,1,1); ring.position.y=0.06; g.add(ring);
  for(var l=1;l<8;l++){
    var ln=new THREE.Mesh(new THREE.RingGeometry(34+l*1.6,34+l*1.6+0.1,72),MAT.whiteLine);
    ln.rotation.x=-Math.PI/2; ln.scale.set(1.62,1,1); ln.position.y=0.08; g.add(ln);
  }
  var field=new THREE.Mesh(new THREE.CircleGeometry(34,64),MAT.grass);
  field.rotation.x=-Math.PI/2; field.scale.set(1.62,1,1); field.position.y=0.07; g.add(field);
  for(var st=0;st<9;st++) box(g,7.4,0.02,66,-29+st*7.4,0.085,0,MAT.grass2,{cast:false});
  var fl=M(0xf2f0e6,1);
  box(g,100,0.03,0.25,0,0.11,0,fl,{cast:false});
  var mid=new THREE.Mesh(new THREE.RingGeometry(8.2,8.42,48),fl);
  mid.rotation.x=-Math.PI/2; mid.scale.set(1.62,1,1); mid.position.y=0.12; g.add(mid);
  for(var e=-1;e<=1;e+=2){
    box(g,0.25,0.03,32,e*49,0.11,0,fl,{cast:false});
    box(g,14,0.03,0.25,e*41,0.11,0,fl,{cast:false});
    for(var q=-1;q<=1;q+=2) cyl(g,0.14,0.14,2.4,8,e*50,1.2,q*3.7,MAT.steel);
    box(g,0.16,0.16,7.6,e*50,2.4,0,MAT.steel,{cast:false});
  }
  /* 白色阶梯看台（左侧） */
  for(var s=-1;s<=1;s+=2){
    for(var tier=0;tier<4;tier++){
      box(g,132,1.0+tier*0.9,4.6,0,(1.0+tier*0.9)/2,s*(53+tier*4.2),MAT2.white,{cast:false});
      box(g,132,0.2,4.6,0,1.0+tier*0.9+0.1,s*(53+tier*4.2),MAT2.red,{cast:false});
    }
  }
  /* 背景：红顶白墙长条建筑（官网照片特征） */
  var bg=new THREE.Group(); bg.position.set(0,0,-78); g.add(bg);
  box(bg,150,20,18,0,10.6,0,MAT2.white);
  box(bg,152,2.4,20,0,21.8,0,MAT2.redDark);
  /* 红坡顶 */
  for(var rp=0;rp<2;rp++) box(bg,152,0.7,11,0,23.2,rp?5:-5,MAT2.red,{rx:rp?0.22:-0.22});
  var cqb=new QB();
  gridWindows(cqb,{face:'front',w:150,d:18,y0:2.5,floors:5,floorH:3.6,cols:32,winW:2.6,winH:2.2,lift:0.12});
  var cwm=cqb.mesh(MAT.glass); if(cwm) bg.add(cwm);
  for(var cc=0;cc<4;cc++) box(bg,3.2,20,0.4,-48+cc*13,10.6,9.3,MAT.glassBlue,{cast:false});
  box(bg,24,0.6,0.5,0,9,9.4,M(0xd8a83c,0.6),{cast:false});
  /* 四角灯塔 */
  for(var sx=-1;sx<=1;sx+=2) for(var sz=-1;sz<=1;sz+=2){
    var lx=sx*82,lz=sz*58;
    cyl(g,0.5,0.8,20,10,lx,10,lz,MAT.metal);
    box(g,7,2.6,1.2,lx,20.5,lz,MAT.steel);
  }
  return g;
}
/* ---------- 体育馆 / 游泳馆 / 足球场 ---------- */
function sportHall(d,arch){
  return function(){
    var g=new THREE.Group(); g.name='NUC_'+d.id;
    var w=d.footprint[0],dp=d.footprint[1],h=d.height;
    box(g,w,h,dp,0,h/2+0.7,0,MAT2.white);
    box(g,w+1,0.7,dp+1,0,0.35,0,MAT.stone);
    if(arch) barrelRoof(g,w,dp,6,h+0.7,MAT.metal,16);
    else{
      box(g,w+2,1.6,dp+2,0,h+1.5,0,MAT2.redDark);
      for(var rp=0;rp<2;rp++) box(g,w+2,0.6,dp/2+1,0,h+2.1,rp?dp/4:-dp/4,MAT2.red,{rx:rp?0.2:-0.2});
    }
    var qb=new QB();
    ['front','back','left','right'].forEach(function(face){
      gridWindows(qb,{face:face,w:w,d:dp,y0:2.5,floors:3,floorH:4.2,
        cols:(face==='front'||face==='back')?12:7,winW:2.6,winH:2.4,lift:0.1});
    });
    var wm=qb.mesh(MAT.glassLite); if(wm) g.add(wm);
    box(g,20,1.3,6,0,7.5,dp/2+3,MAT2.white);
    stairs(g,24,6,6,0,dp/2+9,MAT.plaza2,0.26);
    nameSign(g,d.name.replace(/\（.*?\）/g,''),12,0,8.7,dp/2+3.2);
    flat(g,w+18,16,0,0.02,dp/2+10,MAT.plaza2);
    return g;
  };
}
function footballPitch(d){
  return function(){
    var g=new THREE.Group(); g.name='NUC_'+d.id;
    var w=d.footprint[0],dp=d.footprint[1];
    flat(g,w,dp,0,0.02,0,MAT.grass);
    for(var i=0;i<8;i++) box(g,w/8,0.02,dp,-w/2+(i+0.5)*(w/8),0.03,0,MAT.grass2,{cast:false});
    var fl=M(0xeceadf,1);
    box(g,w-6,0.03,0.25,0,0.05,0,fl,{cast:false});
    box(g,0.25,0.03,dp-6,0,0.05,0,fl,{cast:false});
    for(var e=-1;e<=1;e+=2){
      box(g,0.25,0.03,dp-8,e*(w/2-3),0.05,0,fl,{cast:false});
      box(g,12,0.03,0.25,e*(w/2-9),0.05,0,fl,{cast:false});
    }
    for(var p=0;p<8;p++) cyl(g,0.1,0.1,4,6,-w/2+p*(w/7),2,dp/2+1,MAT.metal,{cast:false});
    return g;
  };
}

/* ---------- 食堂 / 服务建筑 / 地下通道 ---------- */
function canteenBlock(d){
  return function(){
    var g=new THREE.Group(); g.name='NUC_'+d.id;
    var w=d.footprint[0],dp=d.footprint[1],h=d.height;
    box(g,w,h,dp,0,h/2+0.6,0,MAT2.cream);
    box(g,w+1,0.6,dp+1,0,0.3,0,MAT.darkBase);
    box(g,w-3,5.2,0.3,0,3.2,dp/2+0.2,MAT.glassLite,{cast:false});
    for(var i=0;i<8;i++) box(g,0.25,5.2,0.4,-(w-3)/2+i*((w-3)/7),3.2,dp/2+0.45,MAT.steel,{cast:false});
    var qb=new QB();
    gridWindows(qb,{face:'front',w:w,d:dp,y0:6.8,floors:1,floorH:3.4,cols:8,winW:3.0,winH:2.3,lift:0.1});
    gridWindows(qb,{face:'back',w:w,d:dp,y0:2,floors:2,floorH:4.2,cols:8,winW:3.0,winH:2.5,lift:0.1});
    var wm=qb.mesh(MAT.glass); if(wm) g.add(wm);
    box(g,w+2,1.2,dp+2,0,h+1.2,0,MAT2.redDark);
    box(g,18,1.2,6,0,6.8,dp/2+3,MAT2.white);
    stairs(g,20,5,5,0,dp/2+8,MAT.plaza2,0.24);
    nameSign(g,d.name.replace(/\（.*?\）/g,''),10,0,7.6,dp/2+3.4,true);
    flat(g,w+16,14,0,0.02,dp/2+9,MAT.plaza2);
    return g;
  };
}
function serviceBlock(d){
  return function(){
    var g=new THREE.Group(); g.name='NUC_'+d.id;
    var w=d.footprint[0],dp=d.footprint[1],h=d.height;
    slabBuilding(g,{w:w,d:dp,floors:Math.max(1,Math.round(h/4)),fh:4.2,wall:MAT2.cream,
      glass:MAT.glassLite,bay:5,winW:3.0,base:0.4,parapet:false});
    box(g,w+1,0.8,dp+1,0,h+0.4,0,MAT2.redDark);
    nameSign(g,d.name,Math.min(12,w*0.4),0,h-2,dp/2+0.4,true);
    flat(g,w+12,12,0,0.02,dp/2+8,MAT.plaza2);
    return g;
  };
}
function passageBlock(d){
  return function(){
    var g=new THREE.Group(); g.name='NUC_'+d.id;
    box(g,24,0.5,18,0,0.25,0,MAT.plaza2);
    for(var s=-1;s<=1;s+=2){
      box(g,3,4.2,18,s*10,2.1,0,MAT.wallStone);
      box(g,4,0.6,19,s*10,4.5,0,MAT2.white);
      stairs(g,7,6,5,s*10,12,MAT.plaza2,0.25);
    }
    box(g,26,0.6,3,0,4.6,0,MAT.glassLite,{cast:false});
    sign(g,'地下通道',8,1.4,0,4.7,1.6,'#2c5c93');
    return g;
  };
}

/* ---------- 大门 ---------- */
function gateBlock(d,main){
  return function(){
    var g=new THREE.Group(); g.name='NUC_'+d.id;
    var w=d.footprint[0],h=d.height;
    flat(g,w+22,18,0,0.02,0,MAT.plaza2);
    var half=w/2-2.2;
    for(var s=-1;s<=1;s+=2){
      box(g,main?4.4:2.8,h,main?4.4:2.8,s*half,h/2,0,MAT.wallStone);
      box(g,main?5.2:3.4,0.7,main?5.2:3.4,s*half,h+0.35,0,MAT2.white);
      box(g,main?5.6:3.6,1.0,main?5.6:3.6,s*half,0.5,0,MAT.darkBase);
      if(main) box(g,1.4,0.9,1.4,s*half,h+1.1,0,MAT.glassLite,{cast:false});
    }
    box(g,w,main?2.8:1.8,main?3.2:2.2,0,h+(main?0.2:-0.6),0,MAT2.white);
    box(g,w+1,0.4,main?3.6:2.6,0,h+(main?1.8:0.5),0,MAT2.redDark,{cast:false});
    sign(g,main?'中 北 大 学':d.name,main?w-6:w-3,main?2.2:1.4,0,h+(main?0.2:-0.6),main?1.7:1.2,'#a8362b');
    if(main){
      box(g,13,3.4,2.2,-half-9,1.7,6,MAT.rock);
      sign(g,'中北大学',10,2.0,-half-9,1.8,7.16,'#e8dcc0');
    }
    return g;
  };
}

/* ---------- 二龙山（真实尺度：西侧南北向长山体） ---------- */
function buildErlongReal(d){
  var g=new THREE.Group(); g.name='NUC_erlong-mountain';
  var W=d.footprint[0],D=d.footprint[1];
  function pk(x,z,cx,cz,rx,rz,hv){
    var dx=(x-cx)/rx,dz=(z-cz)/rz,r=dx*dx+dz*dz;
    return hv*Math.pow(Math.max(0,1-r),1.5);
  }
  function hgt(x,z){
    return pk(x,z,0,-90,W*0.55,D*0.30,34)+pk(x,z,0,40,W*0.5,D*0.28,26)+pk(x,z,8,150,W*0.4,D*0.18,14);
  }
  var geo=new THREE.PlaneGeometry(W,D,40,72);
  geo.rotateX(-Math.PI/2);
  var pos=geo.attributes.position,colors=[];
  var c1=new THREE.Color(0x4d7a41),c2=new THREE.Color(0x365c34),c3=new THREE.Color(0x7d8072);
  for(var i=0;i<pos.count;i++){
    var x=pos.getX(i),z=pos.getZ(i),y=hgt(x,z);
    pos.setY(i,y);
    var t=Math.min(1,y/34),c;
    c=t<0.65?c1.clone().lerp(c2,t/0.65):c2.clone().lerp(c3,(t-0.65)/0.35);
    colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.computeVertexNormals();
  var land=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));
  land.receiveShadow=true; g.add(land);
  /* 龙山之巅观景亭 */
  var hy=hgt(0,-90);
  var pav=new THREE.Group(); pav.position.set(0,hy,-90); g.add(pav);
  cyl(pav,7,7,0.5,6,0,0.25,0,MAT.stone,{cast:false});
  for(var p=0;p<6;p++){
    var a=p*Math.PI/3;
    cyl(pav,0.26,0.3,4.4,8,Math.cos(a)*5.6,2.45,Math.sin(a)*5.6,MAT2.redDark);
  }
  cyl(pav,6.8,6.8,0.45,6,0,4.7,0,MAT2.redDark);
  cone(pav,7.2,3.2,0,6.5,0,MAT2.redDark,6);
  /* 碉堡 */
  [[28,-150],[-26,-30],[20,110]].forEach(function(pt){
    var yy=hgt(pt[0],pt[1]);
    cyl(g,3.0,3.4,2.6,10,pt[0],yy+1.3,pt[1],MAT.rock);
    cyl(g,3.4,3.4,0.4,10,pt[0],yy+2.7,pt[1],MAT.stone,{cast:false});
  });
  /* 龙山飞瀑 */
  var fy=hgt(24,20);
  box(g,3.4,Math.max(5,fy),0.25,24,fy/2,20,M(0xc9e3e8,0.2,0,{transparent:true,opacity:0.7}),{cast:false});
  box(g,6,0.5,4,24,0.35,20.5,MAT.water,{cast:false});
  /* 登山步道 */
  for(var s=0;s<22;s++){
    var t=s/21,px=-24+t*34,pz=170-t*250,py=hgt(px,pz)+0.12;
    box(g,2.6,0.18,2.0,px,py,pz,MAT.stone,{cast:false,rz:0.18});
  }
  /* 松林 */
  for(var k=0;k<46;k++){
    var tx=(Math.random()-0.5)*W*0.82,tz=(Math.random()-0.5)*D*0.9,ty=hgt(tx,tz);
    if(ty<2) continue;
    tree(g,tx,tz,0.65+Math.random()*0.5,'pine',ty);
  }
  return g;
}

/* ============================================================
 * 真实路网地面：汾河 / 斜穿铁路 / 中央大道 / 环路 / 支路
 * ============================================================ */
campusGround = function(){
  var g=new THREE.Group(); g.name='NUC_campus-ground';
  flat(g,3200,3000,0,0,0,MAT.grass);
  var road=MAT2.road2;
  /* 汾河（西侧） */
  flat(g,24,2900,-352,0.012,0,MAT2.river);
  /* 中央大道（东西向主干，Z=-165） */
  flat(g,640,18,0,0.03,-165,road);
  /* 环路 */
  flat(g,640,13,0,0.03,-292,road);   /* 北环 */
  flat(g,640,13,0,0.03,212,road);    /* 南环 */
  flat(g,13,510,-235,0.03,-40,road); /* 西环 */
  flat(g,13,510,305,0.03,-40,road);  /* 东环 */
  /* 南北主路 */
  [80,-20,165,-125].forEach(function(x){ flat(g,13,500,x,0.031,-40,road); });
  /* 东西次干道 */
  [-245,-95,-35,60,140,185].forEach(function(z){ flat(g,600,10,0,0.031,z,road); });
  /* 宿舍区支路网格 */
  for(var i=0;i<5;i++) flat(g,8,160,-125+i*45,0.032,65,road);
  for(var j=0;j<4;j++) flat(g,180,7,-40,0.032,40+j*28,road);
  for(var m=0;m<4;m++) flat(g,7,190,215+m*55,0.032,-70,road);
  /* 中轴 / 主路虚线 */
  for(var z=-250;z<200;z+=12){
    box(g,0.32,0.02,5,80,0.06,z,MAT.whiteLine,{cast:false});
    box(g,0.32,0.02,5,-20,0.06,z,MAT.whiteLine,{cast:false});
  }
  for(var x=-220;x<300;x+=12) box(g,5,0.02,0.32,x,0.06,-165,MAT.whiteLine,{cast:false});
  /* 斜穿铁路：从 (-330,180) 到 (330,20) */
  var ang=Math.atan2(-160,660), len=Math.sqrt(660*660+160*160), cx=0,cz=100;
  var railGrp=new THREE.Group(); railGrp.position.set(cx,0,cz); railGrp.rotation.y=-ang; g.add(railGrp);
  box(railGrp,len,0.18,11,0,0.09,0,M(0x6b6a60,1),{cast:false});
  for(var s=-1;s<=1;s+=2){
    box(railGrp,len,0.16,0.28,0,0.28,s*1.15,MAT2.rail,{cast:false});
    box(railGrp,len,0.12,0.9,0,0.2,s*2.3,MAT2.sleeper,{cast:false});
  }
  for(var t=0;t<92;t++) box(railGrp,0.5,0.12,4.4,-len/2+4+t*(len/92),0.2,0,MAT2.sleeper,{cast:false});
  /* 各广场铺装 */
  [[80,-35,92,64],[-200,235,80,80],[-20,-150,126,64],[80,-120,94,50],
   [-110,-30,178,112],[-200,150,84,84],[60,150,112,60],[-20,240,52,40],
   [-200,290,40,24]].forEach(function(p){ flat(g,p[2],p[3],p[0],0.022,p[1],MAT2.plaza2); });
  /* 中央大道绿化带 */
  for(var sd=-1;sd<=1;sd+=2) flat(g,7,560,sd*11,0.026,-40,MAT2.grass3);
  /* 行道树统一由探索游戏的 InstancedMesh 提供（更精致且可参与相机遮挡计算） */
  return g;
};

/* ============================================================
 * 注册：覆盖旧造型 + 为新目录条目生成构建器
 * ============================================================ */
builders['dehuai-building']=function(){ return buildDehuaiWings(defMap['dehuai-building']); };
builders['keyi-hall']=function(){ return buildKeyi(defMap['keyi-hall']); };
builders['gezilou']=function(){ return buildGezi(defMap['gezilou']); };
builders['stadium']=function(){ return buildStadiumReal(defMap['stadium']); };
builders['erlong-mountain']=function(){ return buildErlongReal(defMap['erlong-mountain']); };
['canteen-longshan','canteen-tianyuan'].forEach(function(id){ builders[id]=canteenBlock(defMap[id]); });
['gymnasium'].forEach(function(id){ builders[id]=sportHall(defMap[id],false); });
builders['swimming']=sportHall(defMap['swimming'],true);
builders['training-hall']=sportHall(defMap['training-hall'],false);
builders['football-north']=footballPitch(defMap['football-north']);
builders['yifu']=function(){ return buildYifu(defMap['yifu']); };
builders['academic-exchange']=function(){ return buildExchange(defMap['academic-exchange']); };
builders['advanced-mfg']=function(){ return buildAdvanced(defMap['advanced-mfg']); };
builders['south-gate']=gateBlock(defMap['south-gate'],true);
builders['east-gate']=gateBlock(defMap['east-gate'],true);
['service-center','bathhouse'].forEach(function(id){ builders[id]=serviceBlock(defMap[id]); });
builders['underground-pass']=passageBlock(defMap['underground-pass']);

CATALOG.forEach(function(d){
  if(builders[d.id]) return;
  switch(d.style){
    case 'dorm-red': builders[d.id]=function(){ return dormBlock(d,true); }; break;
    case 'dorm-tan': builders[d.id]=function(){ return dormBlock(d,false); }; break;
    case 'teach-glass': builders[d.id]=function(){ return teachGlass(d); }; break;
    case 'teach-slab': builders[d.id]=function(){ return teachSlab(d); }; break;
    case 'canteen': builders[d.id]=canteenBlock(d); break;
    case 'service': builders[d.id]=serviceBlock(d); break;
    case 'gate-small': builders[d.id]=gateBlock(d,false); break;
    case 'sport-hall': builders[d.id]=sportHall(d,false); break;
    case 'sport-arch': builders[d.id]=sportHall(d,true); break;
    case 'football': builders[d.id]=footballPitch(d); break;
    case 'passage': builders[d.id]=passageBlock(d); break;
    case 'lamp': builders[d.id]=buildLamp; break;
    case 'tree': builders[d.id]=buildTree; break;
    case 'flag': builders[d.id]=buildFlag; break;
    default: builders[d.id]=function(){ return teachSlab(d); };
  }
});

NUC.campusGround = campusGround;
NUC.layout = layout;

return NUC;

});
