# -*- coding: utf-8 -*-
"""拼装交付文件：
   1) nuc-buildings.js —— UMD 独立资产模块（可直接引入你的游戏）
   2) index.html       —— 自包含资产工坊（Three/Exporter/JSZip/参考图全内嵌）
   3) explore.html     —— 自包含 3D 自由探索游戏（若 game 源码就绪）
"""
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")

def safe(js):
    return js.replace("</script>", "<\\/script>")

def b64(rel):
    p = ROOT / rel
    return "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode("ascii")

# ---------- 1. 独立资产模块 ----------
core = "\n".join([
    read("src/core-1.js"),
    read("src/catalog.js"),
    read("src/core-2.js"),
    read("src/core-3.js"),
    read("src/core-4.js"),
])

UMD_HEAD = """/* ==========================================================================
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
"""
nuc_js = UMD_HEAD + core + "\n});\n"
(ROOT / "nuc-buildings.js").write_text(nuc_js, encoding="utf-8")

# ---------- 2. 参考照片（压缩版） ----------
REF_FILES = {
    "main":     "教学主楼", "lib1": "图书馆-正面", "lib2": "图书馆-全景",
    "dehuai":   "德怀楼",   "yifu": "逸夫楼",       "keyi": "科艺苑",
    "exchange": "学术交流中心", "advanced": "先进制造中心", "gezi": "阁子楼",
    "stadium":  "真草坪体育场", "swim": "游泳馆",
}
refs = {}
for key, name in REF_FILES.items():
    small = ROOT / "refs" / "small" / (name + ".jpg")
    src = small if small.exists() else (ROOT / "refs" / (name + ".jpg"))
    if src.exists():
        refs[key] = b64(str(src.relative_to(ROOT)))

# ---------- 3. 资产工坊 ----------
parts = [
    read("src/head.html"),
    "\n<script>window.NUC_REF_IMAGES=" + json.dumps(refs, ensure_ascii=False) + ";</script>\n",
    "<script>\n" + safe(read("vendor/three.min.js")) + "\n</script>\n",
    "<script>\n" + safe(read("vendor/GLTFExporter.js")) + "\n</script>\n",
    "<script>\n" + safe(read("vendor/jszip.min.js")) + "\n</script>\n",
    "<script>\n" + safe(nuc_js) + "\n</script>\n",
    "<script>\n" + safe(read("src/app.js")) + "\n</script>\n",
    "</body>\n</html>\n",
]
studio_html = "".join(parts)
(ROOT / "studio.html").write_text(studio_html, encoding="utf-8")

# ---------- 4. 探索游戏：作为网站 / GitHub Pages 首页 ----------
game_head = ROOT / "src" / "game-head.html"
if game_head.exists():
    game_js = "\n".join(read("src/game-%d.js" % i) for i in (1, 2, 3))
    gp = [
        read("src/game-head.html"),
        "\n<script>window.NUC_REF_IMAGES=" + json.dumps(refs, ensure_ascii=False) + ";</script>\n",
        "<script>\n" + safe(read("vendor/three.min.js")) + "\n</script>\n",
        "<script>\n" + safe(nuc_js) + "\n</script>\n",
        "<script>\n" + safe(game_js) + "\n</script>\n",
        "</body>\n</html>\n",
    ]
    game_html = "".join(gp)
    (ROOT / "index.html").write_text(game_html, encoding="utf-8")
    (ROOT / "explore.html").write_text(game_html, encoding="utf-8")
else:
    (ROOT / "index.html").write_text(studio_html, encoding="utf-8")

# ---------- 5. 语法检查副本 ----------
tmp = ROOT / "tmp"
tmp.mkdir(exist_ok=True)
(tmp / "check_nuc.js").write_text(nuc_js, encoding="utf-8")
(tmp / "check_app.js").write_text(read("src/app.js"), encoding="utf-8")
if game_head.exists():
    (tmp / "check_game.js").write_text(
        "\n".join(read("src/game-%d.js" % i) for i in (1, 2, 3)), encoding="utf-8")

print("nuc-buildings.js :", (ROOT / "nuc-buildings.js").stat().st_size, "bytes")
print("index.html       :", (ROOT / "index.html").stat().st_size, "bytes")
if (ROOT / "explore.html").exists():
    print("explore.html     :", (ROOT / "explore.html").stat().st_size, "bytes")
print("refs embedded    :", len(refs))
