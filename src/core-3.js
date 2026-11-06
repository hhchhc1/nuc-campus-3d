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

