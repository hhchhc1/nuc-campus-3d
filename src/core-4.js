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
/* ---------- 德怀楼：按南门实拍（折线两翼 + 中央黑玻璃竖带 + 圆塔） ---------- */
function buildDehuaiWings(d){
  var g=new THREE.Group(); g.name='NUC_dehuai-building';
  var cream=M(0xded8c9,0.92), dark=M(0x1e2628,0.18,0.45,{side:THREE.DoubleSide});
  var h=36,floors=10,fh=3.5;
  /* 两翼略折，形成环抱广场的弧形轮廓 */
  [[-1,-0.10],[1,0.10]].forEach(function(wg){
    var sub=new THREE.Group();
    sub.position.set(wg[0]*23,0,wg[1]*10);
    sub.rotation.y=wg[1]*1.1;
    g.add(sub);
    box(sub,36,h,20,0,h/2+0.6,0,cream);
    box(sub,37,0.6,21,0,0.3,0,MAT.stone);
    var qb=new QB();
    gridWindows(qb,{face:'front',w:36,d:20,y0:1.8,floors:floors,floorH:fh,cols:9,winW:2.3,winH:2.1,lift:0.09});
    gridWindows(qb,{face:'back',w:36,d:20,y0:1.8,floors:floors,floorH:fh,cols:9,winW:2.3,winH:2.1,lift:0.09});
    var wm=qb.mesh(MAT.glass); if(wm) sub.add(wm);
    for(var f=1;f<floors;f++) box(sub,36.4,0.18,20.4,0,0.6+f*fh,0,MAT.wallWhite,{cast:false});
    box(sub,37.4,1.1,21.4,0,h+1.15,0,M(0x8b8477,0.9));
  });
  /* 中央黑色玻璃竖带 */
  box(g,11,h-2,1.0,0,h/2+0.6,10.6,dark,{cast:false});
  for(var r=0;r<floors;r++) box(g,11.4,0.16,1.2,0,1.6+r*fh,11.2,MAT.wallWhite,{cast:false});
  /* 顶部圆形塔楼 / 穹顶 */
  cyl(g,7.0,7.4,4.2,20,0,h+2.6,0,cream);
  var dome=new THREE.Mesh(new THREE.SphereGeometry(7.0,20,10,0,Math.PI*2,0,Math.PI/2),M(0xc9c2b2,0.8));
  dome.position.set(0,h+4.7,0); g.add(dome);
  for(var a=0;a<12;a++) cyl(g,0.12,0.12,1.6,6,Math.cos(a*Math.PI/6)*6.6,h+6.0,Math.sin(a*Math.PI/6)*6.6,MAT.metal,{cast:false});
  /* 右侧通信铁塔 */
  var tw=new THREE.Group(); tw.position.set(44,0,-6); g.add(tw);
  for(var leg=0;leg<4;leg++){
    var lx=(leg%2?1:-1)*1.4, lz=(leg<2?1:-1)*1.4;
    box(tw,0.16,26,0.16,lx,13+h*0.55,lz,MAT.metal,{cast:false});
  }
  for(var br=0;br<6;br++) box(tw,3.0,0.12,0.12,0,15+h*0.55+br*3.2,0,MAT.metal,{cast:false});
  /* 低层裙房 */
  box(g,46,6,12,0,3.6,14,cream);
  box(g,40,3.2,0.3,0,2.2,20.1,MAT.glassLite,{cast:false});
  box(g,48,0.8,14,0,6.9,14,MAT.wallWhite);
  flat(g,96,30,0,0.02,26,MAT.plaza);
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
      var ty=1.0+tier*0.9;
      box(g,132,ty,4.6,0,ty/2,s*(53+tier*4.2),MAT2.white,{cast:false});
      /* 官方照片：蓝红相间的看台座椅 */
      box(g,64,0.45,2.8,-33,ty+0.3,s*(53+tier*4.2),M(0x2f5fa8,0.9),{cast:false});
      box(g,64,0.45,2.8, 33,ty+0.3,s*(53+tier*4.2),M(0xb8483a,0.9),{cast:false});
      box(g,132,0.18,0.25,0,ty+0.12,s*(53+tier*4.2)+2.3,MAT2.white,{cast:false});
    }
  }
  /* 田径场北侧保持开敞：按实拍，向北可直接望见图书馆与主楼 */

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
/* ---------- 校门：南门（校名石）/ 东门（门式连体楼）/ 普通门 ---------- */
function gateBlock(d,kind){
  if(kind==='south') return function(){ return buildSouthGateReal(d); };
  if(kind==='east')  return function(){ return buildEastGateReal(d); };
  return function(){ return buildSimpleGate(d,kind==='main'); };
}
/* 南门 / 一道门：白色大理石校名石 + 伸缩门 + 黄色网格广场 */
function buildSouthGateReal(d){
  var g=new THREE.Group(); g.name='NUC_south-gate';
  flat(g,76,44,0,0.02,0,M(0x3f4542,1));
  /* 黄色网格划线 */
  var yl=M(0xe0b23c,1);
  for(var i=-8;i<=8;i++){
    box(g,0.18,0.02,42,i*4.5,0.045,0,yl,{cast:false});
    box(g,74,0.02,0.18,0,0.045,i*2.6,yl,{cast:false});
  }
  /* 白色大理石校名石 */
  box(g,18,4.4,1.7,0,2.5,-2,M(0xe8e6df,0.9));
  box(g,19,0.7,2.6,0,0.35,-2,MAT.stone);
  sign(g,'中 北 大 学',15.5,3.2,0,2.6,-1.1,'#b23a2c');
  /* 伸缩门 / 栅栏 */
  for(var f=0;f<26;f++){
    var fx=-20+f*1.6;
    box(g,0.13,1.5,0.13,fx,0.75,3.2,MAT.metal,{cast:false});
  }
  box(g,42,0.12,0.16,0,1.45,3.2,MAT.metal,{cast:false});
  /* 两侧门柱与岗亭 */
  for(var s=-1;s<=1;s+=2){
    box(g,2.6,6,2.6,s*24,3,1,MAT.wallStone);
    box(g,3.2,0.6,3.2,s*24,6.3,1,MAT2.white);
    box(g,2.6,2.6,2.6,s*19,1.3,-8,M(0xded9cc,0.9));
  }
  /* 交通锥 */
  for(var c=0;c<8;c++){
    var cx=-16+c*4.6;
    cone(g,0.32,0.9,cx,0.45,7,M(0xd85a3a,0.9),8);
    box(g,0.8,0.1,0.8,cx,0.05,7,MAT2.white,{cast:false});
  }
  /* 背景绿化 */
  for(var t2=0;t2<6;t2++) tree(g,-32+t2*13,-16,0.85);
  return g;
}
/* 东门：两栋楼 + 巨型横梁组成的门洞 + 校徽 + 红色标语 */
function buildEastGateReal(d){
  var g=new THREE.Group(); g.name='NUC_east-gate';
  var facade=M(0x3e4548,0.9), glass=M(0x16242b,0.2,0.4,{side:THREE.DoubleSide}),
      trim=M(0x2b3235,0.85);
  /* 左右两栋楼，中间留 30m 门洞 */
  for(var s=-1;s<=1;s+=2){
    var sub=new THREE.Group(); sub.position.x=s*44; g.add(sub);
    box(sub,46,22,24,0,11,0,facade);
    box(sub,47,0.8,25,0,0.4,0,trim);
    for(var f=0;f<5;f++){
      box(sub,44,1.7,0.3,0,3.2+f*4.0,12.2,glass,{cast:false});
      box(sub,44,1.7,0.3,0,3.2+f*4.0,-12.2,glass,{cast:false});
      box(sub,45,0.22,24.4,0,1.6+f*4.0,0,trim,{cast:false});
    }
    box(sub,47,0.9,25,0,22.4,0,trim);
  }
  /* 顶部巨型横梁 */
  box(g,134,7,26,0,22,0,facade);
  box(g,135,0.8,27,0,25.9,0,trim);
  for(var s2=-1;s2<=1;s2+=2) box(g,1.2,18.5,26,s2*22,9.25,0,trim,{cast:false});
  for(var b=0;b<3;b++) box(g,132,1.1,0.3,0,20+b*2.2,13.2,glass,{cast:false});
  /* 圆形校徽 */
  cyl(g,3.1,3.1,0.35,28,0,22.2,13.4,MAT.gold,{rx:Math.PI/2});
  cyl(g,2.5,2.5,0.4,28,0,22.2,13.65,M(0x243633,0.6),{rx:Math.PI/2,cast:false});
  /* 深色石材广场 + 浅色条带 */
  flat(g,150,80,0,0.02,24,M(0x3c4240,1));
  for(var st=0;st<5;st++) flat(g,6,76,-52+st*26,0.035,24,M(0x8d918c,1));
  /* 红色立体标语 */
  box(g,62,3.4,0.6,0,2.2,48,M(0x8f2a1e,0.9));
  signLong(g,'为党育人 为国育才 为军铸器',60,3.2,0,2.2,48.4,'#e83c28');
  for(var tl=0;tl<6;tl++) lamp(g,-60+tl*24,52,1.0);
  return g;
}
function buildSimpleGate(d,main){
  var g=new THREE.Group(); g.name='NUC_'+d.id;
  var w=d.footprint[0],h=d.height;
  flat(g,w+22,18,0,0.02,0,MAT.plaza);
  var half=w/2-2.2;
  for(var s=-1;s<=1;s+=2){
    box(g,main?4.4:2.8,h,main?4.4:2.8,s*half,h/2,0,MAT.wallStone);
    box(g,main?5.2:3.4,0.7,main?5.2:3.4,s*half,h+0.35,0,MAT2.white);
  }
  box(g,w,main?2.8:1.8,main?3.2:2.2,0,h+(main?0.2:-0.6),0,MAT2.white);
  box(g,w+1,0.4,3.2,0,h+1.8,0,MAT2.redDark,{cast:false});
  sign(g,main?'中 北 大 学':d.name,main?w-6:w-3,main?2.2:1.4,0,h+(main?0.2:-0.6),1.7,'#a8362b');
  return g;
}

/* ---------- 航空宇航学院（白色框架格栅顶 + 密集竖肋 + 金字横带） ---------- */
function buildAerospace(d){
  var g=new THREE.Group(); g.name='NUC_aerospace-college';
  var w=64,dp=30,h=20;
  var cream=M(0xb4b1a7,0.9), frame=M(0xdcdad2,0.7,0.2),
      black=M(0x1c2022,0.85), deep=M(0x121a1e,0.2,0.45,{side:THREE.DoubleSide});
  flat(g,96,54,0,0.02,14,M(0x454a47,1));
  /* 主体 */
  box(g,w,h-4,dp,0,(h-4)/2+0.6,0,cream);
  /* 密集白色竖肋 + 深色窗 */
  for(var i=0;i<22;i++){
    var x=-w/2+1.5+i*((w-3)/21);
    box(g,0.42,9.5,0.55,x,10.6,dp/2+0.3,frame,{cast:false});
    if(i<21) box(g,2.3,9.0,0.22,x+1.3,10.6,dp/2+0.05,deep,{cast:false});
  }
  /* 黑色石材横带 + 金色院名 */
  box(g,w+0.6,3.0,0.7,0,5.8,dp/2+0.5,black);
  sign(g,'航 空 宇 航 学 院',34,2.4,0,5.8,dp/2+0.95,'#e8c66a');
  /* 底层凹入玻璃入口 */
  box(g,w-6,4.2,0.5,0,2.6,dp/2+0.35,MAT.glassBlue,{cast:false});
  for(var dr=0;dr<8;dr++) box(g,0.24,4.2,0.6,-26+dr*7.4,2.6,dp/2+0.65,MAT.steel,{cast:false});
  box(g,20,1.0,5,0,5.2,dp/2+2.5,frame);
  /* 顶部白色框架格栅 */
  box(g,w+3,0.7,dp+3,0,h-3.0,0,frame);
  for(var c=0;c<11;c++){
    var cx=-w/2+c*(w/10);
    box(g,0.35,3.2,0.35,cx,h-1.4,dp/2+1.2,frame,{cast:false});
    box(g,0.35,3.2,0.35,cx,h-1.4,-dp/2-1.2,frame,{cast:false});
  }
  box(g,w+3,0.5,0.5,0,h+0.4,dp/2+1.2,frame,{cast:false});
  box(g,w+3,0.5,0.5,0,h+0.4,-dp/2-1.2,frame,{cast:false});
  for(var s=0;s<8;s++){
    var sx=-w/2+2+s*((w-4)/7);
    box(g,0.3,0.3,dp+2,sx,h+0.4,0,frame,{cast:false});
  }
  /* 门前草坪与方形铺装 */
  box(g,30,0.12,12,0,0.08,dp/2+9,MAT.grass,{cast:false});
  for(var p=0;p<24;p++){
    var px=-14+(p%6)*5.6, pz=dp/2+16+Math.floor(p/6)*3.4;
    box(g,5.4,0.04,3.2,px,0.05,pz,M(0x50544f,0.9),{cast:false});
  }
  return g;
}
/* ---------- 歼-6 歼击机陈列 ---------- */
function buildJet(d){
  var g=new THREE.Group(); g.name='NUC_jet-fighter';
  var alu=M(0xa8b2b4,0.3,0.7), alu2=M(0x8b9598,0.35,0.65),
      glass=M(0x243e4c,0.15,0.5), red=M(0xa83020,0.85);
  flat(g,24,20,0,0.02,0,M(0x474c49,1));
  box(g,18,0.12,10,0,0.08,0,MAT.grass,{cast:false});
  /* 机身（沿 X，机头朝 +X） */
  var body=cyl(g,0.32,1.35,13,14,0,2.5,0,alu,{rz:-Math.PI/2});
  cyl(g,1.35,1.35,1.6,14,-6.2,2.5,0,alu2,{rz:-Math.PI/2,cast:false});
  /* 机头锥 */
  cyl(g,0.05,0.32,2.0,12,7.4,2.5,0,alu,{rz:-Math.PI/2});
  /* 进气口 / 座舱盖 */
  var canopy=new THREE.Mesh(new THREE.SphereGeometry(0.85,12,8),glass);
  canopy.scale.set(2.4,0.7,0.8); canopy.position.set(2.7,3.2,0); g.add(canopy);
  /* 后掠三角主翼 */
  for(var s=-1;s<=1;s+=2){
    var wing=box(g,6.4,0.16,3.4,-0.7,2.5,s*3.2,alu,{ry:s*0.62,cast:false});
    box(g,2.6,0.14,2.2,-5.2,2.6,s*2.2,alu2,{ry:s*0.5,cast:false});
  }
  /* 垂尾与平尾 */
  box(g,3.0,3.2,0.16,-5.0,4.0,0,alu,{rz:0.32,cast:false});
  for(var hs=-1;hs<=1;hs+=2) box(g,2.2,0.14,2.0,-5.6,2.6,hs*1.5,alu2,{ry:hs*0.4,cast:false});
  /* 支架 */
  for(var st=0;st<3;st++) cyl(g,0.12,0.16,2.0,8,-3+st*3,1.0,(st-1)*1.6,MAT.metal,{cast:false});
  /* 编号 */
  sign(g,'51686',3.4,0.9,2.0,2.85,1.5,'#3d4548');
  /* 红色围栏 */
  for(var f=0;f<12;f++){
    var a=f*Math.PI/6, rx=Math.cos(a)*9.2, rz=Math.sin(a)*6.6;
    cyl(g,0.08,0.1,1.0,6,rx,0.5,rz,MAT.metal,{cast:false});
  }
  box(g,18,0.14,0.14,0,0.95,6.6,red,{cast:false});
  box(g,18,0.14,0.14,0,0.95,-6.6,red,{cast:false});
  /* 说明牌 */
  box(g,1.6,1.0,0.14,2,1.0,7.0,MAT.gold,{cast:false});
  return g;
}
/* ---------- 东门红色立体标语（可单独摆放） ---------- */
function buildSlogan(d){
  var g=new THREE.Group(); g.name='NUC_east-slogan';
  box(g,58,3.2,0.6,0,2.1,0,M(0x8f2a1e,0.9));
  signLong(g,'为党育人 为国育才 为军铸器',56,3.0,0,2.1,0.4,'#e83c28');
  flat(g,62,10,0,0.02,2,M(0x555a58,1));
  return g;
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
builders['south-gate']=function(){ return buildSouthGateReal(defMap['south-gate']); };
builders['east-gate']=function(){ return buildEastGateReal(defMap['east-gate']); };
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
    case 'gate-small': builders[d.id]=function(){ return buildSimpleGate(d,false); }; break;
    case 'gate-south': builders[d.id]=function(){ return buildSouthGateReal(d); }; break;
    case 'gate-east': builders[d.id]=function(){ return buildEastGateReal(d); }; break;
    case 'aerospace': builders[d.id]=function(){ return buildAerospace(d); }; break;
    case 'jet': builders[d.id]=function(){ return buildJet(d); }; break;
    case 'slogan': builders[d.id]=function(){ return buildSlogan(d); }; break;
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
