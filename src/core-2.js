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
