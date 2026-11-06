/* ============================================================
 * 主要地标模型（依据中北大学官网 / 基建部公开照片重建）
 * ============================================================ */

/* ---------- 教学主楼（11号教学楼） ---------- */
/* ---------- 教学主楼（11号楼）：按篮球场仰视实拍 + 官网正面照重建 ---------- */
function buildMainBuilding(){
  var g=new THREE.Group(); g.name='NUC_main-building';
  var w=54,d=38,base=1.0,floors=15,fh=4.0,h=floors*fh;   /* 60m 塔式 */
  var wall=M(0xd2cdbf,0.92), rib=M(0xe6e1d4,0.88),
      silver=M(0xb9c2c6,0.35,0.6), grille=M(0xc8d0d0,0.4,0.55),
      darkGlass=M(0x243a48,0.16,0.45,{side:THREE.DoubleSide});

  /* 主体 */
  box(g,w,h,d,0,h/2+base,0,wall);
  box(g,w+1.2,base,d+1.2,0,base/2,0,MAT.darkBase);

  /* 密集竖向窄窗（塔楼立面的核心特征） */
  var qb=new QB();
  ['front','back','left','right'].forEach(function(face){
    var cols=(face==='front'||face==='back')?14:11;
    gridWindows(qb,{face:face,w:w,d:d,y0:base+1.3,floors:floors,floorH:fh,
      cols:cols,winW:1.15,winH:2.1,lift:0.10,
      skip:function(f,c){
        if(face!=='front') return false;
        /* 正面中央留给银色格栅与蓝玻璃中庭 */
        return c>=5&&c<=8;
      }});
  });
  var wm=qb.mesh(darkGlass); if(wm) g.add(wm);

  /* 米白竖向窗肋（贯穿全高） */
  var step=3.5;
  for(var x=-w/2+1.6;x<=w/2-1.6;x+=step){
    for(var s=-1;s<=1;s+=2){
      if(s===1 && Math.abs(x)<11) continue;   /* 正面中央让位 */
      box(g,0.42,h-1.5,0.55,x,h/2+base,s*(d/2+0.28),rib,{cast:false});
    }
  }
  for(var z=-d/2+1.6;z<=d/2-1.6;z+=step){
    for(var sx=-1;sx<=1;sx+=2)
      box(g,0.55,h-1.5,0.42,sx*(w/2+0.28),h/2+base,z,rib,{cast:false});
  }
  /* 每层细腰线 */
  for(var f2=1;f2<floors;f2++)
    box(g,w+0.5,0.12,d+0.5,0,base+f2*fh,0,MAT.wallWhite,{cast:false});

  /* 左侧银色外挂圆筒（观景/设备筒，照片最醒目细节） */
  var tubeX=-w/2-0.9, tubeZ=d/2+2.2;
  cyl(g,1.75,1.75,h-3,18,tubeX,(h-3)/2+base+1.5,tubeZ,silver);
  for(var band=0;band<9;band++)
    cyl(g,1.95,1.95,0.35,18,tubeX,base+4+band*6.4,tubeZ,M(0xe4ecec,0.3,0.65));
  cyl(g,2.1,2.1,0.6,18,tubeX,base+1.2,tubeZ,MAT.darkBase);

  /* 正面中央：下部银色金属格栅 + 上部蓝色玻璃中庭 */
  box(g,13,19,0.55,0,20.5,d/2+0.35,grille,{cast:false});
  for(var gr=0;gr<7;gr++) for(var gc=0;gc<4;gc++){
    var gx=-5.2+gc*3.5, gy=12.2+gr*2.55;
    box(g,3.0,2.1,0.16,gx,gy,d/2+0.66,M(0x9aa8ac,0.4,0.5),{cast:false});
    cone(g,0.42,0.7,gx,gy+1.25,d/2+0.78,M(0xdfe6e6,0.4,0.5),3);
  }
  box(g,17,25,0.5,0,45.5,d/2+0.32,MAT.glassBlue,{cast:false});
  for(var vv=0;vv<6;vv++) box(g,0.24,25,0.2,-8+vv*3.2,45.5,d/2+0.62,MAT.steel,{cast:false});
  for(var hh=0;hh<5;hh++) box(g,17,0.22,0.2,0,34+hh*5,d/2+0.62,MAT.steel,{cast:false});

  /* 顶部悬挑帽檐 + 前沿格栅 + 红色校名 */
  box(g,w+9,1.9,d+10,0,h+base+1.8,0,MAT.wallWhite);
  box(g,w+9,0.55,1.1,0,h+base+0.7,(d+10)/2,MAT.darkBase,{cast:false});
  for(var k=0;k<22;k++){
    var gx2=-w/2-3+k*((w+6)/21);
    box(g,0.5,1.0,1.2,gx2,h+base+3.0,(d+10)/2-1.2,MAT.darkBase,{cast:false});
  }
  box(g,w+11,0.5,d+12,0,h+base+3.6,0,M(0xb9b6ac,0.8));
  sign(g,'中 北',13,3.3,-17,h+base+6.0,(d+10)/2-1.4,'#c03224');
  sign(g,'大 学',13,3.3, 17,h+base+6.0,(d+10)/2-1.4,'#c03224');

  /* 白色大雨棚 + 方柱门廊 */
  box(g,32,2.4,11,0,9.4,d/2+5,MAT.wallWhite);
  box(g,32,0.5,11.4,0,10.85,d/2+5,MAT.steel,{cast:false});
  for(var p=0;p<6;p++){
    var px=-13+p*(26/5);
    box(g,1.5,8.4,1.5,px,4.2,d/2+9,MAT.wallWhite);
    box(g,2.3,0.4,2.3,px,8.6,d/2+9,MAT.wallWhite,{cast:false});
  }
  box(g,16,6.2,0.3,0,4.1,d/2+0.25,MAT.glass,{cast:false});
  for(var q=0;q<5;q++) box(g,0.2,6.2,0.4,-8+q*4,4.1,d/2+0.5,MAT.steel,{cast:false});
  stairs(g,34,9,9,0,d/2+15,MAT.plaza,0.3);

  /* 右侧低配楼 */
  box(g,26,17,24,40,8.5,-5,MAT.wallWarm);
  box(g,26.4,0.8,24.4,40,17.4,-5,MAT.roof,{cast:false});
  var qb2=new QB();
  gridWindows(qb2,{face:'front',w:26,d:24,y0:2.2,floors:4,floorH:3.8,cols:7,winW:2.2,winH:2.2,lift:0.12});
  var wm2=qb2.mesh(MAT.glass); if(wm2){ wm2.position.set(40,0,-5); g.add(wm2); }

  /* 阶梯花坛、护栏、前广场 */
  for(var sd=-1;sd<=1;sd+=2){
    for(var st=0;st<3;st++){
      var bw=10-st*1.3;
      box(g,bw,0.55,4.2,sd*(22+st*1.1),0.28+st*0.28,d/2+13+st*2.5,MAT.plaza,{cast:false});
      box(g,bw-0.7,0.12,3.5,sd*(22+st*1.1),0.6+st*0.28,d/2+13+st*2.5,MAT.grass,{cast:false});
    }
  }
  for(var rail=0;rail<14;rail++){
    var rx=-26+rail*4;
    cyl(g,0.07,0.07,1.1,6,rx,0.55,d/2+22,MAT.metal,{cast:false});
  }
  box(g,56,0.09,0.12,0,1.1,d/2+22,MAT.metal,{cast:false});
  flat(g,w+34,44,0,0.03,d/2+13,MAT.plaza);
  return g;
}

/* ---------- 图书馆：双弧形书卷 + 钢桁架屋面 ---------- */
/* ---------- 图书馆：按田径场实拍 + 基建部官方照片重建 ---------- */
function buildLibrary(){
  var g=new THREE.Group(); g.name='NUC_library';
  var wingW=48,wingD=44,wingH=22,base=2.2;
  var centers=[-31,31];
  var cream=M(0xcac3b1,0.9), deep=M(0x10191b,0.15,0.4,{side:THREE.DoubleSide}),
      steelW=M(0xe9ece8,0.4,0.5);

  box(g,112,base,48,0,base/2,0,MAT.darkBase);
  box(g,114,0.5,50,0,0.25,0,MAT.darkBase2,{cast:false});

  centers.forEach(function(cx){
    var N=20;
    for(var i=0;i<N;i++){
      var t=(i/(N-1))*2-1;
      var x=cx+t*(wingW/2);
      var bulge=8.6*Math.cos(t*Math.PI/2);
      var z=bulge;
      var ry=-t*0.15;
      /* 米白书页竖肋（略微外倾） */
      box(g,0.92,wingH,2.9,x,wingH/2+base,z+wingD/2-0.5,cream,{ry:ry,rz:-t*0.018});
      /* 肋间近黑玻璃竖缝 */
      box(g,1.85,wingH-1.2,0.22,x+1.18,wingH/2+base,z+wingD/2-1.9,deep,{ry:ry,cast:false});
    }
    /* 两端封板与背墙 */
    box(g,wingW+2,wingH,1.2,cx,wingH/2+base,-wingD/2+0.4,cream);
    for(var e=-1;e<=1;e+=2)
      box(g,1.4,wingH,wingD*0.42,cx+e*(wingW/2+0.7),wingH/2+base,-wingD*0.29,cream);
    /* 白色三角钢桁架挑檐 */
    var roofY=wingH+base+1.0;
    box(g,wingW+5,0.12,wingD+7,cx,roofY+1.6,0,M(0xdfe9e8,0.2,0.1,{transparent:true,opacity:0.18}),{cast:false});
    for(var r=0;r<10;r++){
      var rx=cx-wingW/2+r*(wingW/9);
      box(g,0.2,0.26,wingD+7,rx,roofY+1.85,0,steelW,{cast:false});
    }
    for(var s=0;s<7;s++){
      var rz=-wingD/2+s*(wingD/6);
      box(g,wingW+5,0.2,0.2,cx,roofY+2.05,rz,steelW,{cast:false});
      /* 三角斜腹杆 */
      box(g,wingW+4,0.16,0.16,cx,roofY+0.85,rz,steelW,{rz:0.22,cast:false});
      box(g,wingW+4,0.16,0.16,cx,roofY+0.85,rz+1.2,steelW,{rz:-0.22,cast:false});
    }
    /* 背立面窗格 */
    var qb=new QB();
    gridWindows(qb,{face:'back',w:wingW,d:wingD,y0:base+3,floors:5,floorH:3.5,cols:9,winW:3.0,winH:2.0,lift:0.65});
    var wm=qb.mesh(MAT.glass);
    if(wm){ wm.position.x=cx; g.add(wm); }
  });

  /* 中部蓝色玻璃中庭 */
  box(g,22,20,34,0,12,-1,MAT.glassBlue,{cast:false});
  for(var v=0;v<8;v++) box(g,0.22,20,0.4,-10+v*2.9,12,16.2,MAT.steel,{cast:false});
  for(var hh=1;hh<6;hh++) box(g,22,0.18,0.4,0,2+hh*3.3,16.2,MAT.steel,{cast:false});
  box(g,24,1.2,36,0,22.4,-1,MAT.steel);

  /* 入口 */
  box(g,20,1.4,8,0,7.2,22,MAT.wallWhite);
  for(var pc=0;pc<6;pc++) cyl(g,0.5,0.55,6.0,10,-9+pc*3.6,3.0,25.2,MAT.wallWhite);
  box(g,13,5.5,0.4,0,3.6,20.2,MAT.glass,{cast:false});
  sign(g,'图书馆',10,2.5,0,8.3,26.05,'#8a2f24');
  stairs(g,28,8,8,0,29,MAT.plaza,0.28);
  flat(g,116,46,0,0.02,34,MAT.plaza);

  /* 馆前垂柳（田径场照片里的显著景观） */
  for(var wi=0;wi<7;wi++){
    var wx=-46+wi*15, wz=42+(wi%2)*4;
    cyl(g,0.4,0.55,6.5,8,wx,3.25,wz,MAT.treeTrunk);
    for(var br=0;br<9;br++){
      var a=br*Math.PI*2/9, rr=2.6;
      var bx=wx+Math.cos(a)*rr, bz=wz+Math.sin(a)*rr;
      box(g,0.12,4.2,0.12,bx,5.2,bz,M(0x6f9a4a,1),{rz:Math.cos(a)*0.16,cast:false});
      box(g,0.12,3.0,0.12,bx+Math.cos(a)*0.7,3.6,bz+Math.sin(a)*0.7,M(0x5d8a3e,1),{rz:Math.cos(a)*0.2,cast:false});
    }
  }
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
