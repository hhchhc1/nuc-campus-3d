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
/* 宽幅标语牌（东门十二字使命），避免横排文字被拉扁 */
function signLong(g,text,w,h,x,y,z,color){
  if(typeof document==='undefined') return null;
  var cv=document.createElement('canvas'); cv.width=2048; cv.height=160;
  var c=cv.getContext('2d');
  c.font='bold 116px "Microsoft YaHei","PingFang SC",sans-serif';
  c.textAlign='center'; c.textBaseline='middle';
  c.fillStyle=color||'#d3402f';
  c.fillText(text,1024,84);
  var tex=new THREE.CanvasTexture(cv);
  var m=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  var me=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);
  me.position.set(x,y,z); g.add(me); return me;
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
