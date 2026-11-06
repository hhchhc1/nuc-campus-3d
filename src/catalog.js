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
A({id:'main-building',name:'教学主楼（11号楼）',cat:'teaching',pos:[60,0,-112],size:[54,38],h:62,f:15,year:2004,
  refKey:'mainUp',ref:'refs/主楼仰视.jpg',
  desc:'2004 年竣工，又称 11 号教学楼，建筑面积 49958 ㎡（校档案馆），建成时为山西省体量最大、层数最高的教学楼，矗立于行知广场北侧。按实拍复刻米灰塔楼、密集竖向窄窗、左侧银色外挂圆筒、正面银色金属格栅、顶部悬挑帽檐与红色「中北大学」、白色大雨棚方柱门廊。',
  feat:['塔式密窄窗立面','银色外挂圆筒','正面银色格栅','悬挑帽檐红字','方柱门廊','蓝玻璃中庭']});
A({id:'library',name:'图书馆',cat:'teaching',pos:[-35,0,-105],size:[110,50],h:26,f:5,year:2005,
  refKey:'track',ref:'refs/操场主楼图书馆.jpg',
  desc:'2005 年竣工，建筑面积 34606.78 ㎡（校档案馆），华北地区规模最大的高校图书馆之一。从田径场向北望，图书馆在左、教学主楼在右，东西并列。造型取展开的书卷：两个米白竖肋弧形体量、深玻璃竖缝、中部蓝色玻璃中庭、顶部白色三角钢桁架挑檐，馆前垂柳成行。',
  feat:['双弧形书卷体量','米白竖肋+深玻璃','三角钢桁架挑檐','蓝色玻璃中庭','馆前垂柳']});
A({id:'hongxue-12',name:'12号楼（鸿学楼）',cat:'teaching',pos:[-145,0,-160],size:[52,22],h:22,f:6,year:1995,style:'teach-slab',
  desc:'12 号教学楼，又名鸿学楼，原老图书馆，现为音乐系等单位使用。校园图上在图书馆西侧。',feat:['原老图书馆','古典窗套','中部入口']});
A({id:'ruixue',name:'瑞学楼',cat:'teaching',pos:[-45,0,-205],size:[56,22],h:20,f:5,year:2000,style:'teach-slab',
  desc:'瑞学楼，位于图书馆北侧、9 号实验大楼西侧的教学楼。',feat:['板式教学楼','规则窗格']});
A({id:'exp-9',name:'9号楼（实验教学楼）',cat:'teaching',pos:[60,0,-205],size:[70,26],h:29,f:7,year:2000,style:'teach-glass',
  desc:'9 号楼又名实验教学楼，位于 1 号楼正后方，是大学物理等基础实验教学的主要场地。',feat:['实验楼大体量','竖向线条','屋顶设备层']});
A({id:'huixue-1',name:'1号楼（慧学楼）',cat:'teaching',pos:[150,0,-190],size:[52,20],h:18,f:5,year:1990,style:'teach-slab',
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
A({id:'dehuai-building',name:'德怀楼（7号楼）',cat:'teaching',pos:[-200,0,235],size:[82,30],h:36,f:10,year:1990,
  refKey:'south',ref:'refs/南门.jpg',
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
A({id:'xingzhi-square',name:'行知广场',cat:'landmark',pos:[60,0,-35],size:[86,58],h:16,year:2004,
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
A({id:'basketball',name:'篮球场群',cat:'sport',pos:[5,0,-58],size:[74,52],h:9,year:2005,
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
A({id:'red-houses',name:'红房子（老建筑群）',cat:'landscape',pos:[-190,0,-100],size:[72,46],h:12,f:2,year:1955,
  desc:'建于二十世纪五六十年代的红砖建筑群，见证从太原机械学院、华北工学院到中北大学的校史变迁。',feat:['红砖墙','灰瓦坡顶','低层院落']});
A({id:'gezilou',name:'阁子楼',cat:'landscape',pos:[-215,0,-20],size:[44,22],h:13,f:2,year:1950,
  refKey:'gezi',ref:'refs/阁子楼.jpg',
  desc:'学校最老的一批建筑之一。官网照片为两栋对称的红砖两层小楼，各带三角山墙与白色窗框，楼前是牡丹花圃。',
  feat:['对称双楼','红砖','三角山墙','白窗框','牡丹花圃']});

/* ---------------- 七道门与出入口 ---------------- */
A({id:'south-gate',name:'一道门（南门 · 校名石广场）',cat:'landmark',pos:[-200,0,290],size:[40,14],h:9,year:2000,style:'gate-south',
  refKey:'south',ref:'refs/南门.jpg',
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
A({id:'east-gate',name:'东门（门式连体楼）',cat:'landmark',pos:[325,0,-170],size:[120,34],h:30,f:6,year:2015,style:'gate-east',
  refKey:'east',ref:'refs/东门.jpg',
  desc:'校园东侧主出入口，校园图上标注门高 6.65 米，设有车辆管理设施。',feat:['东侧主门','门区广场','车辆通道']});
A({id:'gate-8',name:'八道门（应急出口）',cat:'landmark',pos:[320,0,-275],size:[16,6],h:7,year:2010,style:'gate-small',
  desc:'校园东北侧的应急出口。',feat:['应急出口']});
A({id:'gate-9',name:'九道门（应急出口）',cat:'landmark',pos:[-300,0,-265],size:[16,6],h:7,year:2010,style:'gate-small',
  desc:'校园西北侧、二龙山北端的应急出口。',feat:['应急出口']});


/* ---------------- 实拍补充：航空宇航学院与歼击机陈列 ---------------- */
A({id:'aerospace-college',name:'航空宇航学院',cat:'teaching',pos:[210,0,-40],size:[64,30],h:20,f:4,year:2015,
  refKey:'aero',ref:'refs/航空宇航学院.jpg',style:'aerospace',
  desc:'航空宇航学院楼，赓续学校导弹设计、火箭发动机与飞行器制造等国防学科。实拍显示上部为白色框架格栅与采光天窗，中段密集白色竖肋窗格，黑色石材横带上为金色「航空宇航学院」字样，底层是凹入的蓝色玻璃入口大厅；楼前广场陈列一架退役歼-6 超音速歼击机（编号 51686）。',
  feat:['白色框架格栅顶','密集竖肋窗','黑石材金字横带','凹入玻璃入口','门前歼击机','围栏草坪']});
A({id:'jet-fighter',name:'歼-6 歼击机陈列',cat:'landmark',pos:[210,0,-14],size:[17,11],h:5,year:0,
  refKey:'aero',ref:'refs/航空宇航学院.jpg',style:'jet',
  desc:'摆在航空宇航学院楼前广场的退役歼-6 真机，是我国第一款超音速歼击机（仿米格-19），机身银色、编号 51686，配红色围栏与说明牌，是校园国防教育的标志性展品。',
  feat:['银色机身','后掠三角翼','高尾翼','编号51686','红色围栏']});
A({id:'east-slogan',name:'东门「为党育人 为国育才 为军铸器」',cat:'landmark',pos:[325,0,-135],size:[54,4],h:4,year:2020,
  refKey:'east',ref:'refs/东门.jpg',style:'slogan',
  desc:'东门门楼前广场上的红色立体大字，凝练学校「人民兵工第一校」的办学使命：为党育人、为国育才、为军铸器。',
  feat:['红色立体字','十二字标语','深色石材广场']});

/* ---------------- 配套构件 ---------------- */
A({id:'street-lamp',name:'校园路灯',cat:'props',pos:[0,0,0],size:[3,1],h:7,style:'lamp',
  desc:'道路照明构件，可批量实例化铺设。',feat:['单臂灯杆','可实例化']});
A({id:'campus-tree',name:'行道树',cat:'props',pos:[0,0,0],size:[5,5],h:7,style:'tree',
  desc:'阔叶行道树构件，可批量实例化。',feat:['阔叶树冠','可实例化']});
A({id:'flagpole',name:'国旗杆',cat:'props',pos:[0,0,0],size:[1,1],h:16,style:'flag',
  desc:'广场旗杆构件，含基座与旗面。',feat:['旗杆基座','旗面']});
