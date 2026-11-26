(() => {
"use strict";
const T = THREE;
T.ColorManagement.enabled = false;

/* ---------- \u5c0f\u9053\u5177 ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
function kf(p, keys) {
  if (keys.length === 1) return keys[0];
  const i = Math.min(keys.length - 2, Math.max(0, Math.floor(p)));
  const f = eio(clamp(p - i));
  return keys[i].map((v, j) => v + (keys[i + 1][j] - v) * f);
}
const V = (a) => new T.Vector3(a[0], a[1], a[2]);
function cam(fov = 45, far = 3000) { return new T.PerspectiveCamera(fov, innerWidth / innerHeight, 0.05, far); }
function place(c, p, look) { c.position.set(p[0], p[1], p[2]); c.lookAt(look[0], look[1], look[2]); }
const dotTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.25, "rgba(255,255,255,.85)");
  r.addColorStop(.6, "rgba(255,255,255,.18)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c);
})();
function jpNum(v) {
  // \u65e5\u672c\u8a9e\u306e\u6570\u8a5e\u5358\u4f4d\uff08\u4e07\u30fb\u5104\u30fb\u5146\u30fb\u4eac\u30fb\u5793\u30fb\ud855\udf71\u30fb\u7a63\uff09\u30021\u5104\u4ee5\u4e0a\u306f\u4e00\u756a\u4e0a\u306e\u5358\u4f4d\u3060\u3051\u3002
  if (v < 1e4) return String(Math.round(v));
  if (v < 1e8) { const m = Math.floor(v / 1e4), r = Math.floor(v % 1e4); return m + "\u4e07" + (r ? r : ""); }
  const U = [[1e28, "\u7a63"], [1e24, "\ud855\udf71"], [1e20, "\u5793"], [1e16, "\u4eac"], [1e12, "\u5146"], [1e8, "\u5104"]];
  const u = U.find(u => v >= u[0]);
  return Math.floor(v / u[0]).toLocaleString("ja-JP") + u[1];
}
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* ================================================================
   \u30b7\u30fc\u30f3\u5b9a\u7fa9
   \u5404\u30b7\u30fc\u30f3: { id, title, look:{bg,ink,dim,halo}, glow, beats:[{cap,pos,note}], make() }
   make() \u306f { scene, camera, update(dt), labels?, live?, render?, onBeat?, extra? } \u3092\u8fd4\u3059
   this.p \u2026 \u30d3\u30fc\u30c8\u4f4d\u7f6e\uff08\u306a\u3081\u3089\u304b\u306b\u8ffd\u5f93\u3059\u308b\u5c0f\u6570\uff09, this.t \u2026 \u30b7\u30fc\u30f3\u5185\u6642\u9593
   ================================================================ */
const SCENES = [];

/* ---------- 1. \u30bf\u30a4\u30c8\u30eb ---------- */
SCENES.push({
  id: "title", title: "AI\u306e\u672a\u6765",
  look: { bg: "#070a14", ink: "#f3efe6", dim: "rgba(243,239,230,.6)", halo: "rgba(7,10,20,.6)" }, glow: 0xffb547,
  beats: [
    { pos: "bl", cap: `<span class="eyebrow">2026\u5e7411\u6708 \u00b7 \u8b1b\u6f14</span><h1>AI\u306e\u672a\u6765</h1><p>\u6307\u6570\u95a2\u6570\u306e\u4e0a\u306b\u7acb\u3063\u3066\u8003\u3048\u308b</p><p class="src">\u53c2\u8003\u306b\u3057\u305f\u30b9\u30e9\u30a4\u30c9: <a href="https://claude.ai/artifact/Cy2d8Vn63CnzCtonA1LSah" target="_blank" rel="noopener">The Last Boring Slide</a>\uff08\u69cb\u6210\u3068\u4e00\u90e8\u306e\u984c\u6750\u3092\u53c2\u8003\u306b\u3001\u65e5\u672c\u8a9e\u3067\u518d\u69cb\u6210\uff09</p>`,
      note: "\u3053\u3093\u306b\u3061\u306f\u3002\u4eca\u65e5\u306f\u300cAI\u306e\u672a\u6765\u300d\u306b\u3064\u3044\u3066\u304a\u8a71\u3057\u3057\u307e\u3059\u3002\n\uff08\u30bf\u30a4\u30c8\u30eb\u306e\u5f8c\u3001\u5c11\u3057\u9593\u3092\u7f6e\u304f\u3002\u70b9\u304c\u7403\u306b\u307e\u3068\u307e\u308b\u306e\u3092\u5f85\u3064\uff09" },
    { pos: "bl", cap: `<p class="lead">\u672a\u6765\u3092\u4e88\u60f3\u3059\u308b\u3068\u304d\u3001\u79c1\u305f\u3061\u306f\u305f\u3044\u3066\u3044\u300c\u4eca\u65e5\u306e\u5ef6\u9577\u300d\u3067\u8003\u3048\u307e\u3059\u3002</p><p>\u4eca\u65e5\u306f\u3001\u305d\u306e\u76f4\u611f\u304c\u3069\u3053\u3067\u5916\u308c\u308b\u306e\u304b\u3092\u3001\u76ee\u3067\u898b\u3066\u78ba\u304b\u3081\u3066\u3044\u304d\u307e\u3059\u3002</p>`,
      note: "\u672a\u6765\u3092\u4e88\u60f3\u3059\u308b\u3068\u304d\u3001\u4eba\u306f\u4eca\u65e5\u306e\u5ef6\u9577\u7dda\u3092\u5f15\u304d\u307e\u3059\u3002\u4eca\u65e5\u306f\u305d\u306e\u76f4\u611f\u304c\u3069\u3053\u3067\u5916\u308c\u308b\u306e\u304b\u3092\u898b\u3066\u3044\u304d\u307e\u3059\u3002\n\uff08\u6b21\u3078\u9032\u3080\u3068\u7403\u304c\u306f\u3058\u3051\u308b\uff09" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    const camera = cam(50); camera.position.set(0, 0, 30);
    const N = 7000, start = new Float32Array(N * 3), tgt = new Float32Array(N * 3), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), rnd = new Float32Array(N);
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), th = ga * i, R0 = 9 * (1 + (Math.random() - .5) * .05);
      tgt.set([Math.cos(th) * r * R0, y * R0, Math.sin(th) * r * R0], i * 3);
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), d = 22 + Math.random() * 45;
      start.set([Math.cos(a) * s * d, u * d, Math.sin(a) * s * d], i * 3);
      rnd[i] = Math.random();
      const warm = rnd[i] > .82;
      col.set(warm ? [1, .7, .3] : [.82, .84, .92], i * 3);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(pos, 3));
    g.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ size: .24, map: dotTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true }));
    const grp = new T.Group(); grp.add(pts); scene.add(grp);
    const rings = [];
    [[11.5, .5, 0], [13, -.4, .8], [14.6, 1.2, -.5]].forEach(([r, rx, rz]) => {
      const c = new T.EllipseCurve(0, 0, r, r).getPoints(160);
      const l = new T.LineLoop(new T.BufferGeometry().setFromPoints(c), new T.LineBasicMaterial({ color: 0xffb547, transparent: true, opacity: .0 }));
      l.rotation.set(Math.PI / 2 + rx, 0, rz); grp.add(l); rings.push(l);
    });
    const self = this;
    return {
      scene, camera,
      update() {
        const t = self.t, f = eio(ss(0, 5, t)), b = clamp(self.p);
        grp.rotation.y = t * .07; grp.rotation.x = Math.sin(t * .05) * .15;
        for (let i = 0; i < N; i++) {
          const k = ss(rnd[i] * .5, rnd[i] * .5 + .5, b), e = 1 + k * k * (6 + rnd[i] * 10), w = Math.sin(t * .8 + rnd[i] * 40) * .12;
          for (let j = 0; j < 3; j++) pos[i * 3 + j] = lerp(start[i * 3 + j], tgt[i * 3 + j], f) * e + w;
        }
        g.attributes.position.needsUpdate = true;
        rings.forEach((l, i) => { l.material.opacity = .22 * ss(2 + i, 5 + i, t) * (1 - b); l.rotation.z += .0015 * (i + 1); });
        camera.position.set(Math.sin(t * .09) * 2.5, Math.sin(t * .07) * 1.2, 30 - b * 6);
        camera.lookAt(-2, 0, 0);
      }
    };
  }
});

/* ---------- 2. \u500d\u3005\u306e\u7c73\uff08\u66fd\u5442\u5229\u65b0\u5de6\u885b\u9580\uff09 ---------- */
SCENES.push({
  id: "rice", title: "\u500d\u3005\u306e\u7c73",
  look: { bg: "#e9e2d2", ink: "#2a2118", dim: "rgba(42,33,24,.62)", halo: "rgba(233,226,210,.85)" }, glow: 0x8a5a2b,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">\u500d\u3001\u500d\u3001\u500d</span><h2>\u8912\u7f8e\u306f\u3001\u7c73\u7c92\u3067</h2><p>\u843d\u8a9e\u5bb6\u306e\u59cb\u7956\u3068\u3082\u3044\u308f\u308c\u308b\u66fd\u5442\u5229\u65b0\u5de6\u885b\u9580\u306f\u3001\u8c4a\u81e3\u79c0\u5409\u304b\u3089\u8912\u7f8e\u3068\u3057\u3066\u300c1\u65e5\u76ee\u306f\u7c731\u7c92\u30012\u65e5\u76ee\u306f2\u7c92\u3068\u3001\u65e5\u3054\u3068\u306b\u500d\u306b\u3057\u3066\u307b\u3057\u3044\u300d\u3068\u983c\u3093\u3060\u3068\u4f1d\u3048\u3089\u308c\u307e\u3059\u3002</p><p class="src">\u51fa\u5178: <a href="https://ja.wikipedia.org/wiki/%E6%9B%BD%E5%91%82%E5%88%A9%E6%96%B0%E5%B7%A6%E8%A1%9B%E9%96%80" target="_blank" rel="noopener">\u66fd\u5442\u5229\u65b0\u5de6\u885b\u9580\uff08Wikipedia\uff09</a></p>`,
      note: "\u66fd\u5442\u5229\u65b0\u5de6\u885b\u9580\u306e\u9038\u8a71\u3067\u3059\u3002\u843d\u8a9e\u5bb6\u306e\u59cb\u7956\u3068\u3082\u3044\u308f\u308c\u308b\u4eba\u3067\u3059\u3002\n\u79c0\u5409\u306b\u8912\u7f8e\u3092\u554f\u308f\u308c\u3066\u30011\u65e5\u76ee\u306f\u7c731\u7c92\u3001\u6b21\u306e\u65e5\u306f2\u7c92\u3001\u305d\u306e\u6b21\u306f4\u7c92\u3068\u3001\u65e5\u3054\u3068\u306b\u500d\u306b\u3057\u3066\u307b\u3057\u3044\u3068\u983c\u3093\u3060\u3068\u4f1d\u3048\u3089\u308c\u307e\u3059\u3002\n1\u65e5\u5206\u305a\u3064\u6a2a\u306b\u4e26\u3079\u3066\u3044\u304d\u307e\u3059\u30028\u65e5\u76ee\u3067\u3082128\u7c92\u3002\u3072\u3068\u3064\u307e\u307f\u3067\u3059\u3002" },
    { pos: "tl", cap: `<h2>23\u65e5\u76ee\u30011\u65e5\u5206\u304c1\u4ff5\u3092\u8d85\u3048\u308b</h2><p>23\u65e5\u76ee\u306f\u7d04419\u4e07\u7c92\u3001\u7d0492kg\u3002\u305d\u306e\u65e5\u306e\u5206\u3060\u3051\u3067\u3001\u7c73\u4ff51\u4ff5\uff0860kg\uff09\u3092\u8d85\u3048\u307e\u3057\u305f\u30021\u65e5\u5206\u30921\u304b\u6240\u306b\u5c71\u76db\u308a\u306b\u3059\u308b\u3068\u3001\u3082\u3046\u7a7a\u306b\u5c4a\u3044\u3066\u3044\u307e\u3059\u3002</p><p class="src">1\u4ff5 = 60kg\u30011\u77f3 = 2.5\u4ff5 \u2248 150kg \u00b7 <a href="https://ja.wikipedia.org/wiki/%E4%BF%B5" target="_blank" rel="noopener">\u4ff5</a> / <a href="https://ja.wikipedia.org/wiki/%E7%9F%B3_(%E5%8D%98%E4%BD%8D)" target="_blank" rel="noopener">\u77f3 (\u5358\u4f4d)</a>\uff08Wikipedia\uff09</p>`,
      note: "8\u65e5\u76ee\u307e\u3067\u306f\u3072\u3068\u3064\u307e\u307f\u300214\u65e5\u76ee\u3067\u3082\u304a\u8336\u308f\u30933\u676f\u307b\u3069\u3067\u3059\u3002\n\u3068\u3053\u308d\u304c23\u65e5\u76ee\u306b\u306f\u7d04419\u4e07\u7c92\u300192kg\u3002\u305d\u306e\u65e5\u306e\u5206\u3060\u3051\u3067\u7c73\u4ff51\u4ff5\u3092\u8d85\u3048\u307e\u3059\u3002\n\u5c71\u76db\u308a\u306b\u3059\u308b\u3068\u3001\u3082\u3046\u7a7a\u306b\u5c4a\u3044\u3066\u3044\u307e\u3059\u3002" },
    { pos: "tl", cap: `<h2>44\u65e5\u76ee\u30011\u65e5\u5206\u3067\u767e\u4e07\u77f3</h2><p>44\u65e5\u76ee\u306f\u7d048.8\u5146\u7c92\u3002\u305d\u306e\u65e5\u306e\u5206\u3060\u3051\u3067\u7d04129\u4e07\u77f3\u3001\u52a0\u8cc0\u767e\u4e07\u77f3\u30921\u65e5\u3067\u8d85\u3048\u307e\u3059\u3002</p><p class="src">\u53c2\u8003: <a href="https://ja.wikipedia.org/wiki/%E5%8A%A0%E8%B3%80%E8%97%A9" target="_blank" rel="noopener">\u52a0\u8cc0\u85e9\uff08Wikipedia\uff09</a></p>`,
      note: "44\u65e5\u76ee\u306b\u306f\u7d048.8\u5146\u7c92\u3002\u305d\u306e\u65e5\u306e\u5206\u3060\u3051\u3067\u7d04129\u4e07\u77f3\u3002\n\u52a0\u8cc0\u767e\u4e07\u77f3\u3001\u5927\u5927\u540d\u306e1\u5e74\u5206\u306e\u77f3\u9ad8\u3092\u30011\u65e5\u5206\u3067\u8d85\u3048\u3066\u3057\u307e\u3044\u307e\u3059\u3002\u307e\u3060\u534a\u5206\u3082\u6765\u3066\u3044\u307e\u305b\u3093\u3002" },
    { pos: "tl", cap: `<h2>100\u65e5\u76ee</h2><p class="num">63\u7a63\u7c92</p><p>100\u65e5\u5206\u3092\u5408\u8a08\u3059\u308b\u3068\u7d041860\u5793\u77f3\u3002\u52a0\u8cc0\u767e\u4e07\u77f3\u306e\u7d0419\u4eac\u500d\u3067\u3001\u7c73\u306e\u91cd\u3055\u306f\u5730\u7403\u306e\u304a\u3088\u305d5\u500d\u3067\u3059\u3002\u983c\u3093\u3060\u306e\u306f\u3001\u6bce\u65e5\u500d\u306b\u3059\u308b\u3053\u3068\u3060\u3051\u3067\u3057\u305f\u3002</p><p class="src">\u7c731\u7c92 \u2248 0.022g\u30011\u77f3 \u2248 150kg\u3001\u5730\u7403\u306e\u8cea\u91cf \u2248 6.0\u00d710<sup>24</sup>kg \u3067\u8a08\u7b97 \u00b7 <a href="https://ja.wikipedia.org/wiki/%E5%9C%B0%E7%90%83%E8%B3%AA%E9%87%8F" target="_blank" rel="noopener">\u5730\u7403\u8cea\u91cf\uff08Wikipedia\uff09</a></p>`,
      note: "100\u65e5\u76ee\u306b\u306f63\u7a63\u7c92\u3002\u7a63\u306f\u3001\u5146\u306e1\u5146\u500d\u306e\u3055\u3089\u306b1\u4e07\u500d\u3067\u3059\u3002\n100\u65e5\u5206\u306e\u5408\u8a08\u306f\u7d041860\u5793\u77f3\u3002\u52a0\u8cc0\u767e\u4e07\u77f3\u306e\u7d0419\u4eac\u500d\u3001\u592a\u95a4\u691c\u5730\u306e\u3053\u308d\u306e\u65e5\u672c\u5168\u56fd\u306e\u77f3\u9ad8\uff08\u7d041850\u4e07\u77f3\uff09\u306e\u7d041\u4eac\u500d\u3067\u3059\u3002\u91cd\u3055\u306b\u3059\u308b\u3068\u5730\u7403\u306e\u304a\u3088\u305d5\u500d\u3002\n\u30eb\u30fc\u30eb\u306f\u4e00\u5ea6\u3082\u5909\u308f\u3063\u3066\u3044\u307e\u305b\u3093\u3002\u6bce\u65e5\u3001\u500d\u306b\u3057\u305f\u3060\u3051\u3067\u3059\u3002" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    scene.fog = new T.Fog(this.look.bg, 300, 14000);
    const camera = cam(45, 20000);
    scene.add(new T.HemisphereLight(0xffffff, 0xa88f6c, 1.05));
    const sun = new T.DirectionalLight(0xffffff, 1.1); sun.position.set(6, 12, 8); scene.add(sun);
    const D = 100;
    // 1\u65e5\u305a\u3064\u306e\u53f0\uff08\u304a\u76c6\u3092\u6a2a\u306b\u4e26\u3079\u308b\uff09
    const tray = new T.Mesh(new T.BoxGeometry(D + .4, .3, 1.5), new T.MeshStandardMaterial({ color: 0x8a5a2b, roughness: .7 }));
    tray.position.set((D - 1) / 2, -.3, 0); scene.add(tray);
    const tiles = new T.InstancedMesh(new T.BoxGeometry(.96, .3, 1.2), new T.MeshStandardMaterial({ roughness: .75 }), D);
    { const m = new T.Matrix4(), c = new T.Color(); for (let d = 0; d < D; d++) { tiles.setMatrixAt(d, m.makeTranslation(d, -.15, 0)); tiles.setColorAt(d, c.setHex(d % 2 ? 0xd4a465 : 0xcb9a5a)); } }
    scene.add(tiles);
    // \u7c73\u7c92: \u3064\u3076\u308c\u305f\u7c97\u3044\u591a\u9762\u4f53\u30021\u301c8\u65e5\u76ee\u306f1\u7c92\u305a\u3064\u7f6e\u304f\uff08\u5408\u8a08255\u7c92\uff09
    const riceMat = new T.MeshStandardMaterial({ color: 0xfffcf4, emissive: 0x5e564a, roughness: .7, flatShading: true });
    const GR = 255, grains = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), riceMat, GR);
    grains.frustumCulled = false; scene.add(grains);
    // 9\u65e5\u76ee\u4ee5\u964d: \u5c71\u76db\u308a\u3054\u98ef\u3002\u91cf\u306b\u5408\u308f\u305b\u3066\u4e0a\u3078\u4f38\u3073\u308b
    const prof = [];
    for (let j = 0; j <= 12; j++) { const y = j / 12; prof.push(new T.Vector2(.44 * Math.pow(Math.max(0, 1 - y * y), .5), y)); }
    const moundGeo = new T.LatheGeometry(prof, 11);
    { const pa = moundGeo.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); if (y > .001 && y < .999) { const n = 1 + (Math.sin(x * 37 + y * 23) * Math.cos(z * 41 - y * 17)) * .09; pa.setX(i, x * n); pa.setZ(i, z * n); } } moundGeo.computeVertexNormals(); }
    const mounds = new T.InstancedMesh(moundGeo, riceMat, D);
    mounds.frustumCulled = false; scene.add(mounds);
    const where = []; for (let d = 0; d < D; d++) where.push([d, 0]);
    const gp = [];
    for (let k = 0; k < 8; k++) {
      const n = Math.pow(2, k);
      for (let i = 0; i < n; i++) {
        const layer = Math.floor(i / 34), j = i % 34, inLayer = Math.min(34, n - layer * 34);
        const r = n === 1 ? 0 : .37 * (1 - layer * .3) * Math.sqrt((j + .5) / Math.max(inLayer, 1));
        const a = j * 2.39996 + layer * .7 + k;
        const e = new T.Euler(Math.random() * .5, Math.random() * 6.28, (Math.random() - .5) * .6);
        gp.push({ k, i, n, x: where[k][0] + Math.cos(a) * r, y: .028 + layer * .045, z: where[k][1] + Math.sin(a) * r, q: new T.Quaternion().setFromEuler(e) });
      }
    }
    const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(), zero = new T.Matrix4().makeScale(0, 0, 0);
    const G = .00047; // 1\u7c92\u3042\u305f\u308a\u306e\u5c71\u306e\u9ad8\u3055\uff08\u898b\u305f\u76ee\u306e\u6bd4\u4f8b\u4fc2\u6570\uff09
    const self = this;
    let cnt = 0, b2 = 0, fx = 0;
    const labels = [];
    for (let k = 0; k < 8; k++) labels.push({ el: el("div", "lab big", `${k + 1}\u65e5\u76ee<br><span>${Math.pow(2, k)}\u7c92</span>`), p: new T.Vector3(k, -.5, 1.1), op: () => clamp((cnt - k) * 3) * (1 - ss(.2, .6, self.p)) });
    labels.push({ el: el("div", "lab big chip", `23\u65e5\u76ee<br><span>1\u4ff5\u3092\u8d85\u3048\u308b</span>`), p: new T.Vector3(22, -.1, .95), op: () => ss(.6, 1, self.p) * (1 - ss(1.2, 1.5, self.p)) });
    labels.push({ el: el("div", "lab big chip", `44\u65e5\u76ee<br><span>\u767e\u4e07\u77f3\u3092\u8d85\u3048\u308b</span>`), p: new T.Vector3(43, -.1, .95), op: () => ss(1.6, 2, self.p) * (1 - ss(2.2, 2.5, self.p)) });
    labels.push({ el: el("div", "lab big chip", `100\u65e5\u76ee`), p: new T.Vector3(99, -.1, .95), op: () => ss(2.7, 3, self.p) });
    return {
      scene, camera, labels,
      onBeat(b) { if (b === 3) b2 = self.t; },
      update() {
        const p = self.p;
        const target = p <= 1 ? lerp(8, 23, p) : p <= 2 ? lerp(23, 44, p - 1) : lerp(44, 100, p - 2);
        const tt = self.t, slow = tt < 6 ? .15 + tt * .65 : 4.05 + (tt - 6) * 1.3; // \u6700\u521d\u306e\u6570\u65e5\u306f\u3086\u3063\u304f\u308a
        cnt = Math.min(target, slow + p * 45);
        gp.forEach((g, idx) => {
          const rv = clamp(cnt - g.k);
          const s = clamp(rv * g.n - g.i);
          if (s <= 0) { grains.setMatrixAt(idx, zero); return; }
          const pop = 1 + Math.sin(s * Math.PI) * .35;
          ps.set(g.x, g.y + (1 - s) * .25, g.z); sc.set(.075 * pop, .045 * pop, .125 * pop);
          grains.setMatrixAt(idx, m4.compose(ps, g.q, sc));
        });
        grains.instanceMatrix.needsUpdate = true;
        for (let k = 0; k < D; k++) {
          const rv = k < 8 ? 0 : clamp(cnt - k);
          if (rv <= 0) { mounds.setMatrixAt(k, zero); continue; }
          const h = Math.min(9000, Math.max(.05, Math.pow(2, k) * G * (1 - Math.pow(1 - rv, 3))));
          ps.set(where[k][0], 0, where[k][1]); sc.set(1, h, 1);
          mounds.setMatrixAt(k, m4.compose(ps, q, sc));
        }
        mounds.instanceMatrix.needsUpdate = true;
        // \u6700\u521d\u306f\u3044\u307e\u7c73\u3092\u7f6e\u3044\u3066\u3044\u308b\u65e5\u306b\u5bc4\u308a\u3001\u5897\u3048\u308b\u306b\u3064\u308c\u3066\u5f15\u3044\u3066\u3044\u304f
        fx += (clamp(cnt - .6, 0, 7) - fx) * .04;
        const w = eio(ss(3.2, 7.5, cnt));
        const close = [fx + .9, 2.4, 3.6, fx + .9, 0, -.4];
        const key0 = close.map((v, i) => lerp(v, [3.5, 3.8, 6.1, 3.5, -.2, -1.9][i], w));
        const c = kf(p, [key0, [2, 6, 28, 12, 9, 0], [-12, 9, 58, 26, 20, 0], [-40, 12, 80, 50, 25, 0]]);
        const d = Math.sin(self.t * .15) * .6;
        const up = self.beat === 3 ? eio(ss(2.5, 12, self.t - b2)) : 0;
        place(camera, [c[0] + d - up * 40, c[1] + up * 20, c[2] + up * 120], [c[3], c[4] + up * 900, c[5]]);
      },
      live() {
        const n = clamp(Math.floor(cnt + .02), 1, D);
        const g = Math.pow(2, n - 1) * .022, kg = g / 1000;
        const wt = kg < 1 ? `\u7d04${Math.max(1, Math.round(g))}g` : kg < 60 ? `\u7d04${kg.toFixed(kg < 10 ? 1 : 0)}kg` : kg < 150 ? `\u7d04${(kg / 60).toFixed(1)}\u4ff5` : `\u7d04${kg / 150 < 1e4 ? Math.round(kg / 150) : kg / 150 < 1e8 ? Math.floor(kg / 150 / 1e4) + "\u4e07" : jpNum(kg / 150)}\u77f3`;
        return `${n}\u65e5\u76ee<br>${jpNum(Math.pow(2, n - 1))}\u7c92<br><span style="font-size:.8em">${wt}</span>`;
      }
    };
  }
});

/* ---------- 3. \u4efb\u305b\u3089\u308c\u308b\u4ed5\u4e8b\u306e\u9577\u3055 ---------- */
SCENES.push({
  id: "tasks", title: "\u4efb\u305b\u3089\u308c\u308b\u4ed5\u4e8b\u306e\u9577\u3055",
  look: { bg: "#f2f3f6", ink: "#141821", dim: "rgba(20,24,33,.58)", halo: "rgba(242,243,246,.9)" }, glow: 0x1d3fbf,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">\u4efb\u305b\u304d\u308a\u306b\u3067\u304d\u308b\u4ed5\u4e8b\u306e\u5927\u304d\u3055</span><h2>\u3069\u308c\u3060\u3051\u5927\u304d\u306a\u4ed5\u4e8b\u3092\u3001AI\u306b\u4efb\u305b\u304d\u308a\u306b\u3067\u304d\u308b\u304b</h2><p>\u901f\u3055\u3067\u306f\u306a\u304f\u3001\u4ed5\u4e8b\u306e\u5927\u304d\u3055\u306e\u8a71\u3067\u3059\u3002\u4eba\u9593\u306e\u5c02\u9580\u5bb6\u306a\u30891\u6642\u9593\u304b\u304b\u308b\u4ed5\u4e8b\u3092\u3001AI\u304c\u4eba\u306e\u624b\u3092\u501f\u308a\u305a\u306b\u6700\u5f8c\u307e\u3067\u4ed5\u4e0a\u3052\u3089\u308c\u308b\u304b\uff08\u6210\u529f\u738750%\uff09\u3002\u68d2\u306e\u9ad8\u3055\u306f\u3001\u305d\u306e\u4ed5\u4e8b\u306b\u4eba\u9593\u304c\u304b\u304b\u308b\u6642\u9593\u3067\u3059\u3002\u3053\u306e\u5927\u304d\u3055\u304c\u3001\u7d047\u304b\u6708\u3054\u3068\u306b\u500d\u306b\u306a\u3063\u3066\u304d\u307e\u3057\u305f\u3002</p><p class="src">\u51fa\u5178: <a href="https://arxiv.org/abs/2503.14499" target="_blank" rel="noopener">METR\u300cMeasuring AI Ability to Complete Long Software Tasks\u300d(arXiv, 2025)</a> \u00b7 <a href="https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/" target="_blank" rel="noopener">\u89e3\u8aac\u8a18\u4e8b</a> \u00b7 \u5024\u306f\u56f3\u304b\u3089\u306e\u8aad\u307f\u53d6\u308a\u3067\u304a\u304a\u3088\u305d</p>`,
      note: "METR\u3068\u3044\u3046\u7814\u7a76\u6a5f\u95a2\u304c\u3001AI\u306b\u3069\u308c\u3060\u3051\u5927\u304d\u306a\u4ed5\u4e8b\u3092\u4efb\u305b\u304d\u308a\u306b\u3067\u304d\u308b\u304b\u3092\u6e2c\u3063\u3066\u3044\u307e\u3059\u3002AI\u304c\u901f\u304f\u89e3\u304f\u304b\u3069\u3046\u304b\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002\n\u4eba\u9593\u306e\u5c02\u9580\u5bb6\u306a\u3089\u4f55\u5206\u30fb\u4f55\u6642\u9593\u304b\u304b\u308b\u4ed5\u4e8b\u3092\u3001AI\u304c\u4e00\u4eba\u3067\u6700\u5f8c\u307e\u3067\u4ed5\u4e0a\u3052\u3089\u308c\u308b\u304b\uff08\u6210\u529f\u738750%\uff09\u3067\u6e2c\u308a\u307e\u3059\u3002\nGPT-4\u306f\u4eba\u9593\u3067\u7d045\u5206\u306e\u4ed5\u4e8b\u307e\u3067\u30012025\u5e74\u521d\u3081\u306eClaude 3.7 Sonnet\u306f\u7d0450\u5206\u306e\u4ed5\u4e8b\u307e\u3067\u3002\u3053\u306e\u5927\u304d\u3055\u304c\u7d047\u304b\u6708\u3067\u500d\u306b\u306a\u3063\u3066\u3044\u307e\u3059\u3002\n\u7e26\u8ef8\u306f\u666e\u901a\u306e\u76ee\u76db\u308a\u306a\u306e\u3067\u3001\u6614\u306e\u30e2\u30c7\u30eb\u306f\u307b\u307c\u5e8a\u3067\u3059\u3002" },
    { pos: "tl", cap: `<h2>\u540c\u3058\u30da\u30fc\u30b9\u304c\u7d9a\u304f\u306a\u3089</h2><p>2027\u5e74\u306b\u306f\u4eba\u9593\u3067\u7d049\u6642\u9593\u304b\u304b\u308b\u4ed5\u4e8b\u3092\u30012030\u5e74\u306b\u306f\u7d04320\u6642\u9593\u304b\u304b\u308b\u4ed5\u4e8b\u3092\u4efb\u305b\u3089\u308c\u308b\u8a08\u7b97\u3067\u3059\u3002320\u6642\u9593\u306f\u3001\u4eba\u304c2\u304b\u6708\u307b\u3069\u50cd\u304d\u7d9a\u3051\u308b\u91cf\u3067\u3059\u3002</p><p class="src">\u70b9\u7dda\u306f\u50be\u5411\u3092\u5ef6\u3070\u3057\u305f\u3060\u3051\u306e\u8a08\u7b97\u3067\u3001\u4e88\u6e2c\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002</p>`,
      note: "\u3053\u3053\u304b\u3089\u306f\u4e88\u6e2c\u3067\u306f\u306a\u304f\u8a08\u7b97\u3067\u3059\u30027\u304b\u6708\u3067\u500d\u3001\u3092\u305d\u306e\u307e\u307e\u5ef6\u3070\u3059\u3068\u30012027\u5e74\u306b\u306f\u4eba\u9593\u3067\u7d049\u6642\u9593\u30012030\u5e74\u306b\u306f\u7d04320\u6642\u9593\u304b\u304b\u308b\u4ed5\u4e8b\u3002\n\u903140\u6642\u9593\u50cd\u304f\u4eba\u306e8\u9031\u9593\u5206\u306e\u4ed5\u4e8b\u3092\u3001\u4e38\u3054\u30681\u56de\u3067\u4efb\u305b\u3089\u308c\u308b\u3053\u3068\u306b\u306a\u308a\u307e\u3059\u3002" },
    { pos: "tl", cap: `<h2>\u898b\u4e0a\u3052\u308b\u3068</h2><p>\u6700\u521d\u306b\u898b\u3066\u3044\u305f\u68d2\u306f\u3001\u3059\u3079\u3066\u5e8a\u306e\u4e0a\u306b\u6b8b\u3063\u3066\u3044\u307e\u3059\u3002</p>`,
      note: "\u898b\u4e0a\u3052\u3066\u304f\u3060\u3055\u3044\u3002\u3055\u3063\u304d\u307e\u3067\u898b\u3066\u3044\u305f\u5b9f\u6e2c\u306e\u68d2\u306f\u3001\u5168\u90e8\u8db3\u5143\u306b\u3042\u308a\u307e\u3059\u3002\n\u6307\u6570\u95a2\u6570\u3092\u666e\u901a\u306e\u76ee\u76db\u308a\u3067\u63cf\u304f\u3068\u3001\u904e\u53bb\u306f\u3044\u3064\u3082\u300c\u307b\u307c\u30bc\u30ed\u300d\u306b\u898b\u3048\u307e\u3059\u3002" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    scene.fog = new T.Fog(this.look.bg, 60, 1600);
    const camera = cam(42, 8000);
    scene.add(new T.HemisphereLight(0xffffff, 0xc9ccd6, 1.1));
    const dl = new T.DirectionalLight(0xffffff, .9); dl.position.set(-6, 10, 12); scene.add(dl);
    const grid = new T.GridHelper(80, 40, 0xc4c8d2, 0xdadde4); grid.position.y = -.001; scene.add(grid);
    const X = y => (y - 2019) * 2.2 - 11;
    const U = 3; // 1\u6642\u9593 = 3
    const data = [["GPT-2", 2019.1, 2 / 3600, "\u7d042\u79d2"], ["GPT-3", 2020.4, 9 / 3600, "\u7d049\u79d2"], ["GPT-3.5", 2022.2, 36 / 3600, "\u7d0436\u79d2"], ["GPT-4", 2023.2, 5 / 60, "\u7d045\u5206"],
      ["GPT-4o", 2024.4, 9 / 60, "\u7d049\u5206"], ["Claude 3.5 Sonnet", 2024.8, 28 / 60, "\u7d0428\u5206"], ["o1", 2024.95, 39 / 60, "\u7d0439\u5206"], ["Claude 3.7 Sonnet", 2025.15, 50 / 60, "\u7d0450\u5206"]];
    const ext = [[2026.15, 2.7, "\u7d043\u6642\u9593"], [2027.15, 9, "\u7d049\u6642\u9593"], [2028.15, 29.5, "\u7d0430\u6642\u9593"], [2029.15, 97, "\u7d0497\u6642\u9593"], [2030.15, 317, "\u7d04320\u6642\u9593"]];
    const box = new T.BoxGeometry(.8, 1, .8).translate(0, .5, 0);
    const solid = new T.MeshStandardMaterial({ color: 0x1d3fbf, roughness: .5 });
    const bars = data.map(d => { const m = new T.Mesh(box, solid); m.position.set(X(d[1]), 0, 0); scene.add(m); return m; });
    const ghostMat = new T.MeshStandardMaterial({ color: 0x6f86d9, transparent: true, opacity: .22, depthWrite: false });
    const edgeGeo = new T.EdgesGeometry(box);
    const ghosts = ext.map(d => {
      const g = new T.Group(); g.position.set(X(d[0]), 0, 0);
      g.add(new T.Mesh(box, ghostMat));
      const e = new T.LineSegments(edgeGeo, new T.LineDashedMaterial({ color: 0x1d3fbf, dashSize: .25, gapSize: .2, transparent: true, opacity: .8 }));
      g.add(e); scene.add(g); return { g, e };
    });
    const labels = [];
    for (let y = 2019; y <= 2030; y++) labels.push({ el: el("div", "lab", `<span>${y}</span>`), p: new T.Vector3(X(y + .5), .02, 1.6), op: () => 1 });
    const self = this;
    data.forEach((d, i) => [0, 3, 7].includes(i) && labels.push({ el: el("div", "lab chip", `${d[0]}<br><span>\u4eba\u9593\u3067${d[3]}</span>`), p: () => new T.Vector3(X(d[1]), bars[i].scale.y + .25, 0), op: () => ss(.6, 1, bars[i].userData.g || 0) * (1 - ss(1.3, 1.8, self.p)) }));
    ext.forEach((d, i) => labels.push({ el: el("div", "lab big chip", `${Math.floor(d[0])}\u5e74<br><span>\u4eba\u9593\u3067${d[2]}</span>`), p: () => new T.Vector3(X(d[0]), Math.min(ghosts[i].g.scale.y, 330) + .4, 0), op: () => ss(.7, 1, ghosts[i].g.userData.g || 0) * (i < 4 || self.p > 1.4 ? 1 : 0) }));
    return {
      scene, camera, labels,
      update() {
        const t = self.t, p = self.p;
        bars.forEach((b, i) => { const g = ss(.3 + i * .22, 1.5 + i * .22, t + p * 10); b.userData.g = g; b.scale.y = Math.max(1e-3, data[i][2] * U * g); });
        ghosts.forEach((o, i) => {
          const g = ss(i * .16, i * .16 + .55, p); o.g.userData.g = g;
          o.g.scale.y = Math.max(1e-3, ext[i][1] * U * g); o.g.visible = g > 0;
          o.e.computeLineDistances();
        });
        const c = kf(p, [[-6.5, 3.6, 17, -6.5, 3.8, 0], [3, 9, 34, 3, 6, 0], [-10, 2, 30, 11, 95, 0]]);
        place(camera, [c[0] + Math.sin(t * .12) * .6, c[1], c[2]], [c[3], c[4], c[5]]);
      }
    };
  }
});

/* ---------- 4. \u81ea\u5206\u3092\u4f5c\u308bAI ---------- */
SCENES.push({
  id: "loop", title: "\u81ea\u5206\u3092\u4f5c\u308bAI",
  look: { bg: "#15110a", ink: "#f6ead0", dim: "rgba(246,234,208,.6)", halo: "rgba(21,17,10,.7)" }, glow: 0xf2b23a,
  beats: [
    { pos: "bl", cap: `<span class="eyebrow">\u958b\u767a\u306e\u30eb\u30fc\u30d7</span><h2>\u4eba\u304cAI\u3092\u4f5c\u308b</h2><p>\u3053\u308c\u307e\u3067\u306f\u3001\u65b0\u3057\u3044AI\u3092\u4f5c\u308b\u306e\u306f\u4eba\u9593\u3067\u3057\u305f\u30021\u56de\u306e\u958b\u767a\u30b5\u30a4\u30af\u30eb\u3092\u3001\u3053\u3053\u3067\u306f\u4eee\u306b12\u304b\u6708\u3068\u3057\u307e\u3059\u3002</p>`,
      note: "\u3053\u3053\u304b\u3089\u306f\u601d\u8003\u5b9f\u9a13\u3067\u3059\u3002\u3053\u308c\u307e\u3067AI\u3092\u4f5c\u308b\u306e\u306f\u4eba\u9593\u3067\u3057\u305f\u30021\u30b5\u30a4\u30af\u30eb12\u304b\u6708\u3068\u3057\u307e\u3057\u3087\u3046\u3002" },
    { pos: "bl", cap: `<h2>AI\u304c\u3001\u6b21\u306eAI\u3092\u4f5c\u308b\u306e\u3092\u624b\u4f1d\u3046</h2><p>\u4eca\u306eAI\u306f\u3059\u3067\u306b\u30b3\u30fc\u30c9\u3092\u66f8\u304d\u3001\u5b9f\u9a13\u3092\u56de\u3057\u3066\u3044\u307e\u3059\u3002\u624b\u4f1d\u3046\u5272\u5408\u304c\u5897\u3048\u308b\u307b\u3069\u3001\u6b21\u306e\u4e16\u4ee3\u306f\u65e9\u304f\u5b8c\u6210\u3057\u307e\u3059\u3002\u8f2a\u304c\u3001\u3089\u305b\u3093\u306b\u306a\u308a\u307e\u3059\u3002</p>`,
      note: "\u4eca\u306eAI\u306f\u3001\u3059\u3067\u306b\u958b\u767a\u306e\u4e00\u90e8\u3092\u62c5\u3063\u3066\u3044\u307e\u3059\u3002\u30b3\u30fc\u30c9\u3092\u66f8\u304d\u3001\u5b9f\u9a13\u3092\u56de\u3059\u3002\n\u3059\u308b\u3068\u6b21\u306e\u4e16\u4ee3\u306f\u5c11\u3057\u65e9\u304f\u3067\u304d\u308b\u3002\u305d\u306e\u4e16\u4ee3\u306f\u3055\u3089\u306b\u4e0a\u624b\u306b\u624b\u4f1d\u3046\u3002\u8f2a\u304c\u3089\u305b\u3093\u306b\u306a\u308a\u307e\u3059\u3002" },
    { pos: "bl", cap: `<h2>\u6bce\u56de\u3001\u534a\u5206\u306e\u6642\u9593\u3067</h2><p>12\u304b\u6708\u30016\u304b\u6708\u30013\u304b\u6708\u2026\u2026\u3002\u5404\u4e16\u4ee3\u304c\u524d\u306e\u534a\u5206\u306e\u6642\u9593\u3067\u3067\u304d\u308b\u306a\u3089\u3001\u4f55\u4e16\u4ee3\u9032\u3093\u3067\u3082\u5408\u8a08\u306f24\u304b\u6708\u3092\u8d85\u3048\u307e\u305b\u3093\u30022\u5e74\u306e\u9593\u306b\u3001\u4e16\u4ee3\u306e\u6570\u306f\u9650\u308a\u306a\u304f\u5897\u3048\u3066\u3044\u304d\u307e\u3059\u3002</p><p class="src">\u601d\u8003\u5b9f\u9a13\u3067\u3059\u3002\u73fe\u5b9f\u306e\u958b\u767a\u306b\u306f\u30c1\u30c3\u30d7\u3084\u96fb\u529b\u306a\u3069\u306e\u5236\u7d04\u304c\u3042\u308a\u307e\u3059\u3002</p>`,
      note: "\u6bce\u56de\u534a\u5206\u306e\u6642\u9593\u3067\u3067\u304d\u308b\u3068\u3057\u307e\u3059\u300212\u304b\u6708\u30016\u304b\u6708\u30013\u304b\u6708\u3002\n\u8db3\u3057\u7b97\u3059\u308b\u3068\u3001\u4f55\u4e16\u4ee3\u9032\u3093\u3067\u3082\u5408\u8a08\u306f24\u304b\u6708\u3092\u8d85\u3048\u307e\u305b\u3093\u3002\u53f3\u4e0a\u306e\u30ab\u30a6\u30f3\u30bf\u30fc\u3092\u898b\u3066\u304f\u3060\u3055\u3044\u3002\u6642\u9593\u306f\u4e00\u5b9a\u306b\u9032\u307f\u3001\u4e16\u4ee3\u6570\u3060\u3051\u304c\u7206\u767a\u3057\u307e\u3059\u3002\n\uff08\u73fe\u5b9f\u306b\u306f\u8a08\u7b97\u8cc7\u6e90\u306e\u5236\u7d04\u304c\u3042\u308a\u307e\u3059\u3001\u3068\u4e00\u8a00\u6dfb\u3048\u308b\uff09" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    const camera = cam(50);
    const G = 40, PER = 160, n = G * PER;
    const P = u => { const r = 7 * Math.pow(.82, u), a = Math.PI * 2 * u - Math.PI / 2; return [Math.cos(a) * r, Math.sin(a) * r, -10 * (1 - Math.pow(.82, u))]; };
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = i / PER, p = P(u); pos.set(p, i * 3);
      const k = clamp(u / 14); col.set([lerp(.95, 1, k), lerp(.62, .97, k), lerp(.22, .85, k)], i * 3);
    }
    const lg = new T.BufferGeometry(); lg.setAttribute("position", new T.BufferAttribute(pos, 3)); lg.setAttribute("color", new T.BufferAttribute(col, 3));
    const line = new T.Line(lg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .9 }));
    scene.add(line);
    const TR = 40, tpos = new Float32Array(TR * 3), tcol = new Float32Array(TR * 3);
    const tg = new T.BufferGeometry(); tg.setAttribute("position", new T.BufferAttribute(tpos, 3)); tg.setAttribute("color", new T.BufferAttribute(tcol, 3));
    const runner = new T.Points(tg, new T.PointsMaterial({ size: .9, map: dotTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true }));
    scene.add(runner);
    const dust = new T.BufferGeometry(), dp = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) dp.set([(Math.random() - .5) * 60, (Math.random() - .5) * 40, -Math.random() * 40], i * 3);
    dust.setAttribute("position", new T.BufferAttribute(dp, 3));
    scene.add(new T.Points(dust, new T.PointsMaterial({ size: .08, color: 0x8a7350, transparent: true, opacity: .7 })));
    const self = this;
    let b2 = -1, u = 0, gen = 0, months = 0, vis = 1;
    return {
      scene, camera,
      onBeat(b) { if (b === 2) b2 = self.t; },
      update(dt) {
        const t = self.t, p = self.p;
        if (self.beat < 2) b2 = -1;
        if (p < .5) { u = (t / 4) % 1; vis = lerp(vis, 1, .1); gen = 1; }
        else if (b2 < 0) { u = (t / 2.4) % 10; vis = lerp(vis, 10.2, .05); gen = Math.floor(u) + 1; }
        else {
          const tau = Math.min(self.t - b2, 13.999), lim = 14;
          u = Math.min(G - .01, -Math.log2(1 - tau / lim));
          months = 24 * (tau / lim); gen = Math.floor(u) + 1;
          vis = Math.max(vis, u + 1.2);
        }
        lg.setDrawRange(0, Math.min(n, Math.floor(vis * PER) + 1));
        for (let i = 0; i < TR; i++) {
          const uu = Math.max(0, u - i * .012 * (1 + Math.max(0, 3 - u) * .3)), q = P(uu), f = 1 - i / TR;
          tpos.set(q, i * 3); tcol.set([f, f * .85, f * .55], i * 3);
        }
        tg.attributes.position.needsUpdate = true; tg.attributes.color.needsUpdate = true;
        runner.material.size = .9 * Math.max(.35, Math.pow(.82, u * .5));
        const a = t * .08;
        place(camera, [Math.sin(a) * 4 + 3, 6 + Math.cos(a) * 2 - p * .8, 15 - p * 2], [1, 0, -4]);
      },
      live() {
        if (self.beat === 0) return `1\u30b5\u30a4\u30af\u30eb<br>12\u304b\u6708`;
        if (self.beat === 1) return `\u7b2c ${gen} \u4e16\u4ee3`;
        const g = u >= G - .5 ? "\u221e" : gen.toLocaleString("ja-JP");
        return `\u7d4c\u904e ${months.toFixed(1)} \u304b\u6708<br>\u7b2c ${g} \u4e16\u4ee3`;
      }
    };
  }
});

/* ---------- 5. \u7fa4\u308c ---------- */
SCENES.push({
  id: "swarm", title: "\u30b3\u30d4\u30fc\u3067\u304d\u308b\u77e5\u80fd",
  look: { bg: "#061416", ink: "#e2f4ef", dim: "rgba(226,244,239,.6)", halo: "rgba(6,20,22,.75)" }, glow: 0x7fe3d0,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">\u4e26\u5217</span><h2>1\u4f53\u306eAI\u304c\u50cd\u3044\u3066\u3044\u308b</h2>`,
      note: "\u3053\u308c\u306f\u3001\u3072\u3068\u308a\u3067\u50cd\u3044\u3066\u3044\u308b1\u4f53\u306eAI\u3067\u3059\u3002" },
    { pos: "tl", cap: `<h2>\u4eba\u306f\u5897\u3084\u305b\u306a\u3044\u3002AI\u306f\u30b3\u30d4\u30fc\u3067\u304d\u308b</h2><p>1\u4f53\u304c\u4ed5\u4e8b\u3092\u3053\u306a\u305b\u308b\u306a\u3089\u3001\u540c\u3058\u3082\u306e\u3092\u4f55\u4e07\u4f53\u3067\u3082\u540c\u6642\u306b\u52d5\u304b\u305b\u307e\u3059\u3002\u3053\u3053\u306b\u306f32,768\u4f53\u304c\u4e26\u3093\u3067\u3044\u307e\u3059\u3002</p>`,
      note: "\u4eba\u9593\u306e\u5c02\u9580\u5bb6\u306f\u3001\u80b2\u3066\u308b\u306e\u306b20\u5e74\u304b\u304b\u308a\u307e\u3059\u3002AI\u306f\u30b3\u30d4\u30fc\u3059\u308c\u3070\u3044\u3044\u3002\n1\u4f53\u304c\u50cd\u3051\u308b\u306a\u3089\u3001\u540c\u3058\u3082\u306e\u3092\u4f55\u4e07\u4f53\u3067\u3082\u540c\u6642\u306b\u52d5\u304b\u305b\u307e\u3059\u3002\u753b\u9762\u306b\u306f32,768\u4f53\u3002" },
    { pos: "tl", cap: `<h2>1\u79d2\u306b\u30011.6\u5e74\u5206</h2><p>\u4eee\u306b100\u4e07\u4f53\u304c\u3001\u305d\u308c\u305e\u308c\u4eba\u306e50\u500d\u306e\u901f\u3055\u3067\u8003\u3048\u308b\u3068\u3057\u307e\u3059\u30021\u79d2\u3054\u3068\u306b\u3001\u7d041.6\u5e74\u5206\u306e\u601d\u8003\u304c\u7a4d\u307f\u4e0a\u304c\u308a\u307e\u3059\u3002</p><p class="src">100\u4e07 \u00d7 50 \u00d7 1\u79d2 \u2248 5,000\u4e07\u79d2 \u2248 1.6\u5e74 \u00b7 \u601d\u8003\u5b9f\u9a13</p>`,
      note: "100\u4e07\u4f53\u304c\u4eba\u306e50\u500d\u306e\u901f\u3055\u3067\u8003\u3048\u308b\u3068\u30011\u79d2\u3054\u3068\u306b\u7d041.6\u5e74\u5206\u306e\u601d\u8003\u306b\u306a\u308a\u307e\u3059\u3002\n\u53f3\u4e0a\u306e\u30ab\u30a6\u30f3\u30bf\u30fc\u306f\u3001\u3053\u306e\u30b9\u30e9\u30a4\u30c9\u3092\u958b\u3044\u3066\u304b\u3089\u306e\u7d2f\u8a08\u3067\u3059\u3002\u8a71\u3057\u3066\u3044\u308b\u9593\u3082\u56de\u308a\u7d9a\u3051\u307e\u3059\u3002" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    scene.fog = new T.Fog(this.look.bg, 20, 120);
    const camera = cam(45);
    const W = 256, D = 128, N = W * D, S = .55;
    const base = new T.BoxGeometry(1, 1, 1);
    const geo = new T.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute("position", base.attributes.position); geo.setAttribute("normal", base.attributes.normal);
    const off = new Float32Array(N * 3), seed = new Float32Array(N);
    let i = 0;
    for (let x = -W / 2; x < W / 2; x++) for (let z = -D / 2; z < D / 2; z++) { off.set([x * S, 0, z * S], i * 3); seed[i] = Math.random(); i++; }
    geo.setAttribute("off", new T.InstancedBufferAttribute(off, 3)); geo.setAttribute("seed", new T.InstancedBufferAttribute(seed, 1));
    geo.instanceCount = N;
    const mat = new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uR: { value: .3 }, uC: { value: 1 }, fogColor: { value: new T.Color(this.look.bg) } },
      vertexShader: `uniform float uT,uR,uC; attribute vec3 off; attribute float seed; varying float vB; varying vec3 vN; varying float vD;
        void main(){ float d=length(off.xz); float a=1.-smoothstep(uR-2.5,uR,d);
          float act=.5+.5*sin(uT*(1.2+seed*2.6)+seed*50.); float h=.2+act*.55;
          float big=d<.01?uC:1.; vec3 p=position; p.y+=.5; p*=vec3(.3,h,.3)*a*big; p+=off;
          vec4 mv=modelViewMatrix*vec4(p,1.); vB=act*a; vN=normal; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 fogColor; varying float vB; varying vec3 vN; varying float vD;
        void main(){ vec3 c=mix(vec3(.07,.26,.26),vec3(.62,1.,.9),vB*vB); c*=.65+.35*max(dot(vN,normalize(vec3(.4,1.,.3))),0.);
          float f=smoothstep(25.,120.,vD); gl_FragColor=vec4(mix(c,fogColor,f),1.); }`
    });
    const mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);
    const floor = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshBasicMaterial({ color: 0x0a1d20 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.01; scene.add(floor);
    const self = this;
    let acc = 0;
    return {
      scene, camera,
      update(dt) {
        const t = self.t, p = self.p;
        mat.uniforms.uT.value = t;
        mat.uniforms.uR.value = .6 + 88 * Math.pow(clamp(p), 2.4);
        mat.uniforms.uC.value = lerp(2.6, 1, ss(0, .6, p));
        if (self.beat >= 2) acc += dt; else acc = 0;
        const c = kf(p, [[1.3, 1.1, 2.4, 0, .45, 0], [0, 20, 38, 0, 0, -2], [0, 0, 0, 0, 0, 0]]);
        if (p > 1) {
          const a = t * .05, k = eio(clamp(p - 1));
          const o = [Math.sin(a) * 36, 9, Math.cos(a) * 36];
          place(camera, [lerp(c[0], o[0], k), lerp(c[1], o[1], k), lerp(c[2], o[2], k)], [0, 0, 0]);
        } else place(camera, [c[0], c[1], c[2]], [c[3], c[4], c[5]]);
      },
      live() {
        if (self.beat === 0) return `1\u4f53`;
        if (self.beat === 1) return `32,768\u4f53`;
        return `\u7d2f\u8a08<br>${(acc * 1.585).toFixed(1)} \u5e74\u5206\u306e\u601d\u8003`;
      }
    };
  }
});

/* ---------- 6. \u4e00\u5ea6\u306e\u305a\u308c ---------- */
SCENES.push({
  id: "aim", title: "\u4e00\u5ea6\u306e\u305a\u308c",
  look: { bg: "#04060d", ink: "#e8ecf5", dim: "rgba(232,236,245,.6)", halo: "rgba(4,6,13,.8)" }, glow: 0xffb547,
  beats: [
    { pos: "bl", cap: `<span class="eyebrow">\u30a2\u30e9\u30a4\u30f3\u30e1\u30f3\u30c8</span><h2>\u72d9\u3044\u304c\u30011\u5ea6\u3060\u3051\u305a\u308c\u3066\u3044\u305f\u3089</h2><p>\u3053\u3053\u307e\u3067\u306e\u8a71\u306f\u3001AI\u304c\u79c1\u305f\u3061\u306e\u610f\u56f3\u3057\u305f\u3068\u304a\u308a\u306e\u65b9\u5411\u3092\u5411\u3044\u3066\u3044\u308b\u3001\u3068\u3044\u3046\u524d\u63d0\u306e\u4e0a\u306b\u3042\u308a\u307e\u3057\u305f\u300210m\u5148\u306e\u30c0\u30fc\u30c4\u306e\u7684\u306a\u3089\u30011\u5ea6\u306e\u305a\u308c\u306f17.5cm\u3002\u4e2d\u5fc3\u306f\u5916\u308c\u307e\u3059\u304c\u3001\u7684\u306b\u306f\u5f53\u305f\u308a\u307e\u3059\u3002\u30c6\u30b9\u30c8\u3084\u30c7\u30e2\u306f\u3001\u305f\u3044\u3066\u3044\u3053\u306e\u8ddd\u96e2\u3067\u884c\u308f\u308c\u307e\u3059\u3002</p>`,
      note: "\u3053\u3053\u307e\u3067\u5168\u90e8\u3001\u3072\u3068\u3064\u306e\u524d\u63d0\u306e\u4e0a\u306b\u3042\u308a\u307e\u3057\u305f\u3002AI\u304c\u3001\u79c1\u305f\u3061\u304c\u610f\u56f3\u3057\u305f\u65b9\u5411\u3092\u5411\u3044\u3066\u3044\u308b\u3053\u3068\u3002\u3053\u308c\u3092\u30a2\u30e9\u30a4\u30f3\u30e1\u30f3\u30c8\u3068\u547c\u3073\u307e\u3059\u3002\n\u307b\u307c\u6b63\u3057\u304f\u3067\u304d\u305f\u3068\u3057\u307e\u3059\u30021\u5ea6\u3060\u3051\u305a\u308c\u3066\u3044\u308b\u300210m\u5148\u306a\u308917.5cm\u3002\u4e2d\u5fc3\u306f\u5916\u308c\u3066\u3082\u3001\u7684\u306b\u306f\u5f53\u305f\u308b\u3002\u30c6\u30b9\u30c8\u3084\u30c7\u30e2\u306f\u3001\u305f\u3044\u3066\u3044\u3053\u306e\u8ddd\u96e2\u3067\u884c\u308f\u308c\u307e\u3059\u3002" },
    { pos: "bl", cap: `<h2>\u6771\u4eac\u304b\u3089\u5927\u962a\u3078</h2><p>\u6771\u4eac\u304b\u3089\u7d04400km\u5148\u306e\u5927\u962a\u99c5\u3092\u72d9\u3046\u3068\u3001\u305a\u308c\u306f7km\u3002\u5927\u962a\u306b\u306f\u7740\u304d\u307e\u3059\u304c\u3001\u99c5\u304b\u3089\u306f\u6b69\u3044\u30661\u6642\u9593\u534a\u304b\u304b\u308b\u5834\u6240\u3067\u3059\u3002</p>`,
      note: "\u540c\u30581\u5ea6\u306e\u307e\u307e\u3001400km\u5148\u306e\u5927\u962a\u3092\u72d9\u3046\u3068\u30017km\u305a\u308c\u307e\u3059\u3002" },
    { pos: "bl", cap: `<h2>\u6708\u3092\u72d9\u3046\u3068</h2><p>38\u4e07km\u5148\u3067\u306f\u3001\u7d046,700km\u306e\u305a\u308c\u3002\u6708\u306e\u76f4\u5f84\u306e\u304a\u3088\u305d2\u500d\u3067\u3001\u304b\u3059\u308a\u3082\u3057\u307e\u305b\u3093\u3002\u9060\u304f\u307e\u3067\u5c4a\u304f\u529b\u3092\u6301\u3064\u3082\u306e\u307b\u3069\u3001\u5c0f\u3055\u306a\u305a\u308c\u304c\u5927\u304d\u306a\u610f\u5473\u3092\u6301\u3061\u307e\u3059\u3002</p><p class="src">\u305a\u308c = \u8ddd\u96e2 \u00d7 tan 1\u00b0 \u2248 \u8ddd\u96e2 \u00d7 0.0175 \u00b7 \u6708\u307e\u3067\u306e\u8ddd\u96e2: <a href="https://ja.wikipedia.org/wiki/%E6%9C%88" target="_blank" rel="noopener">\u6708\uff08Wikipedia\uff09</a></p>`,
      note: "\u6708\u307e\u306738\u4e07km\u30021\u5ea6\u306e\u305a\u308c\u306f\u7d046,700km\u3001\u6708\u306e\u76f4\u5f84\u306e2\u500d\u3067\u3059\u3002\n\u8a08\u7b97\u306f\u5358\u7d14\u3067\u3001\u8ddd\u96e2\u306btan 1\u00b0\u3092\u304b\u3051\u308b\u3060\u3051\u3002\u5f37\u529b\u306a\u30b7\u30b9\u30c6\u30e0\u307b\u3069\u9060\u304f\u307e\u3067\u5c4a\u304f\u306e\u3067\u3001\u540c\u3058\u305a\u308c\u304c\u5927\u304d\u304f\u306a\u308a\u307e\u3059\u3002\n\u305d\u3057\u3066\u3001\u81ea\u5206\u3092\u4fee\u6b63\u3055\u305b\u306a\u3044\u30b7\u30b9\u30c6\u30e0\u306b\u306f\u3001\u3084\u308a\u76f4\u3057\u304c\u304d\u304b\u306a\u3044\u304b\u3082\u3057\u308c\u307e\u305b\u3093\u3002" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    const camera = cam(40, 4000);
    const sp = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u); sp.set([Math.cos(a) * s * 900, u * 900, Math.sin(a) * s * 900], i * 3); }
    const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0xaab4c8 })));
    const off = Math.tan(Math.PI / 180) * 100;
    const mk = (pts, c, o = 1) => new T.Line(new T.BufferGeometry().setFromPoints(pts.map(V)), new T.LineBasicMaterial({ color: c, transparent: true, opacity: o }));
    scene.add(mk([[0, 0, 0], [0, 0, -100]], 0xffffff, .85));
    scene.add(mk([[0, 0, 0], [off, 0, -100]], 0xffb547, 1));
    const origin = new T.Sprite(new T.SpriteMaterial({ map: dotTex, color: 0xffe2a8, blending: T.AdditiveBlending, depthWrite: false })); origin.scale.set(3, 3, 1); scene.add(origin);
    const aimPt = new T.Sprite(new T.SpriteMaterial({ map: dotTex, color: 0xffffff, blending: T.AdditiveBlending, depthWrite: false })); aimPt.position.set(0, 0, -99.9); aimPt.scale.set(.55, .55, 1); aimPt.renderOrder = 10; scene.add(aimPt);
    const hit = new T.Sprite(new T.SpriteMaterial({ map: dotTex, color: 0xffb547, blending: T.AdditiveBlending, depthWrite: false })); hit.position.set(off, 0, -99.9); hit.scale.set(.7, .7, 1); hit.renderOrder = 10; scene.add(hit);
    // \u305a\u308c\u306e\u5bf8\u6cd5\u7dda\uff08\u72d9\u3063\u305f\u70b9\u3068\u5f53\u305f\u3063\u305f\u70b9\u304b\u3089\u4e0b\u308d\u3057\u3066\u6e2c\u308b\uff09
    const bp = new Float32Array(6 * 3), bgeo = new T.BufferGeometry(); bgeo.setAttribute("position", new T.BufferAttribute(bp, 3));
    const bracket = new T.LineSegments(bgeo, new T.LineBasicMaterial({ color: 0x9aa4b8, transparent: true, opacity: .9 })); bracket.frustumCulled = false; bracket.renderOrder = 9; scene.add(bracket);
    // \u7684\uff08\u30c0\u30fc\u30c4\u76e4 \u534a\u5f8422.5cm \u2192 2.25\uff09
    const dart = new T.Group(); dart.position.set(0, 0, -100.05);
    const rc = [0x161616, 0xefe6cf, 0x161616, 0xb3332a, 0xefe6cf, 0x1f7a4c, 0xb3332a];
    const rr = [2.25, 1.9, 1.62, 1.3, 1.0, .5, .16];
    rr.forEach((r, i) => { const m = new T.Mesh(new T.CircleGeometry(r, 64), new T.MeshBasicMaterial({ color: rc[i], transparent: true, depthWrite: false })); m.position.z = i * .005; dart.add(m); });
    scene.add(dart);
    // \u5730\u56f3\uff08\u663c\u306e\u5927\u962a\u30021\u5358\u4f4d = 4km\u3001\u5317\u304c\u5965\u3002\u4e2d\u5fc3\u304c\u5927\u962a\u99c5\uff09
    const GY = -1.6;
    const city = new T.Group(); scene.add(city);
    const cityMats = [];
    const mc = document.createElement("canvas"); mc.width = 1024; mc.height = 768;
    const mapTex = new T.CanvasTexture(mc); mapTex.anisotropy = 8;
    function drawMap() {
      const g = mc.getContext("2d"), K = 32, cx = 512, cy = 384; // 32px = 1km
      g.fillStyle = "#eef1ea"; g.fillRect(0, 0, 1024, 768);
      g.strokeStyle = "#dfe4dc"; g.lineWidth = 1;
      for (let x = cx % K; x < 1024; x += K) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 768); g.stroke(); }
      for (let y = cy % K; y < 768; y += K) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
      g.strokeStyle = "#ffffff"; g.lineWidth = 6;
      [[0, cy + 10, 1024, cy - 30], [cx - 8, 0, cx + 20, 768], [0, cy + 190, 1024, cy + 150], [cx + 300, 0, cx + 260, 768], [cx - 230, 0, cx - 190, 768]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
      g.fillStyle = "#cfe3c5";
      [[cx + 120, cy + 40, 70, 60], [cx + 330, cy - 150, 110, 70], [cx - 150, cy + 230, 80, 50], [cx + 520, cy + 120, 90, 120]].forEach(r => g.fillRect(r[0], r[1], r[2], r[3]));
      g.fillStyle = "#b9d8e8"; g.beginPath(); g.moveTo(0, 0); g.lineTo(150, 0);
      g.bezierCurveTo(190, 200, 120, 330, 210, 470); g.bezierCurveTo(250, 560, 200, 680, 260, 768); g.lineTo(0, 768); g.fill();
      g.strokeStyle = "#b9d8e8"; g.lineWidth = 22; g.beginPath(); g.moveTo(1024, 150); g.bezierCurveTo(800, 210, 640, 330, 470, 300); g.bezierCurveTo(330, 280, 250, 250, 170, 260); g.stroke();
      g.strokeStyle = "#9aa3ae"; g.lineWidth = 5; g.setLineDash([14, 8]); g.beginPath(); g.ellipse(cx + 63, cy + 86, 95, 110, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#c0392b"; g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();
      g.font = "700 30px 'Zen Kaku Gothic New','Hiragino Sans',sans-serif"; g.fillStyle = "#1d2430"; g.textAlign = "right"; g.fillText("\u5927\u962a\u99c5", cx - 18, cy - 14);
      g.font = "500 20px 'Zen Kaku Gothic New','Hiragino Sans',sans-serif"; g.fillStyle = "#5b7c8f"; g.textAlign = "left"; g.fillText("\u5927\u962a\u6e7e", 30, 560); g.fillText("\u6dc0\u5ddd", 700, 230);
      g.fillStyle = "#1d2430"; g.fillRect(820, 720, 160, 5); g.font = "500 18px 'JetBrains Mono',monospace"; g.textAlign = "center"; g.fillText("5 km", 900, 710);
      mapTex.needsUpdate = true;
    }
    drawMap(); if (document.fonts) document.fonts.ready.then(drawMap);
    const mapMat = new T.MeshBasicMaterial({ map: mapTex, transparent: true, depthWrite: false });
    const mapMesh = new T.Mesh(new T.PlaneGeometry(8, 6), mapMat); mapMesh.rotation.x = -Math.PI / 2; mapMesh.position.set(0, GY, -100);
    city.add(mapMesh); cityMats.push(mapMat);
    const hitG = new T.Sprite(new T.SpriteMaterial({ map: dotTex, color: 0xff8a1f, transparent: true, depthWrite: false })); hitG.position.set(off, GY + .01, -100); hitG.scale.set(.45, .45, 1); hitG.renderOrder = 10; city.add(hitG); cityMats.push(hitG.material);
    // \u6708
    const moon = new T.Mesh(new T.SphereGeometry(1737 / 384400 * 100, 48, 32), new T.MeshStandardMaterial({ color: 0xc9cbd0, roughness: 1, transparent: true }));
    moon.position.set(0, 0, -100); scene.add(moon);
    scene.add(new T.AmbientLight(0x404858, .6));
    const ml = new T.DirectionalLight(0xffffff, 1.6); ml.position.set(-30, 10, 20); scene.add(ml);
    const self = this;
    const gapEl = el("div", "lab big chip", ""), distEl = el("div", "lab", "");
    let by = -2.7, top = 2.6;
    const labels = [
      { el: gapEl, p: () => new T.Vector3(off / 2, by - .3, -100), op: () => 1 },
      { el: distEl, p: () => new T.Vector3(0, top, -100), op: () => 1 }
    ];
    const gaps = ["\u305a\u308c 17.5 cm", "\u305a\u308c 7 km", "\u305a\u308c 6,710 km"], dists = ["10 m \u5148\u306e\u7684", "400 km \u5148\u306e\u5927\u962a\u99c5", "384,400 km \u5148\u306e\u6708"];
    return {
      scene, camera, labels,
      update() {
        const t = self.t, p = self.p;
        const a0 = 1 - ss(.3, .7, p), a1 = ss(.3, .7, p) * (1 - ss(1.3, 1.7, p)), a2 = ss(1.3, 1.7, p), sum = a0 + a1 + a2;
        dart.children.forEach(m => m.material.opacity = a0); dart.visible = a0 > .01;
        cityMats.forEach(m => m.opacity = a1); city.visible = a1 > .01;
        moon.material.opacity = a2; moon.visible = a2 > .01; moon.rotation.y = t * .05;
        by = (a0 * -2.7 + a1 * GY + a2 * -.9) / sum;
        top = (a0 * 2.6 + a1 * 1.7 + a2 * .9) / sum;
        aimPt.scale.setScalar(.55 * (1 - .55 * a1)); hit.scale.setScalar(.7 * (1 - .55 * a1));
        bp.set([0, 0, -99.95, 0, by, -99.95, off, 0, -99.95, off, by, -99.95, 0, by, -99.95, off, by, -99.95]);
        bgeo.attributes.position.needsUpdate = true;
        const k = clamp(Math.round(p), 0, 2); gapEl.textContent = gaps[k]; distEl.textContent = dists[k];
        const c = kf(p, [[-4, 2.4, -85, -1.6, -.2, -100], [-1.5, 5.2, -92.5, -.4, -1.4, -100], [-2.2, 1, -92.5, -1, -.2, -100]]);
        place(camera, [c[0] + Math.sin(t * .2) * .3, c[1] + Math.sin(t * .13) * .15, c[2]], [c[3], c[4], c[5]]);
      }
    };
  }
});

/* ---------- 7. \u4e8c\u3064\u306e\u672a\u6765 ---------- */
SCENES.push({
  id: "futures", title: "\u4e8c\u3064\u306e\u672a\u6765",
  look: { bg: "#9a9ea5", ink: "#ffffff", dim: "rgba(255,255,255,.75)", halo: "rgba(30,36,44,.55)" }, glow: 0xffffff,
  beats: [
    { pos: "bl", cap: `<h2>\u540c\u3058\u529b\u3001\u540c\u3058\u6280\u8853</h2><p>\u5de6\u53f3\u306e\u8857\u306f\u3001\u3069\u3061\u3089\u3082\u540c\u3058\u80fd\u529b\u3092\u6301\u3064AI\u304c\u4f5c\u3063\u305f\u3082\u306e\u3067\u3059\u3002\u9055\u3046\u306e\u306f\u3001\u72d9\u3044\u304c\u5408\u3063\u3066\u3044\u305f\u304b\u3069\u3046\u304b\u3060\u3051\u3002\u5de6\u3067\u306f\u3001\u3059\u3079\u3066\u304c\u4e00\u3064\u306e\u76ee\u7684\u306e\u305f\u3081\u306b\u6700\u9069\u5316\u3055\u308c\u3066\u3044\u307e\u3059\u3002</p>`,
      note: "\u540c\u3058\u80fd\u529b\u306eAI\u304c\u4f5c\u3063\u305f\u4e8c\u3064\u306e\u4e16\u754c\u3067\u3059\u3002\u5de6\u306f\u72d9\u3044\u304c\u308f\u305a\u304b\u306b\u305a\u308c\u305f\u4e16\u754c\u3002\u3059\u3079\u3066\u304c\u4e00\u3064\u306e\u76ee\u7684\u306e\u305f\u3081\u306b\u6700\u9069\u5316\u3055\u308c\u3001\u5747\u4e00\u306b\u306a\u3063\u3066\u3044\u307e\u3059\u3002\n\u53f3\u306f\u72d9\u3044\u304c\u5408\u3063\u305f\u4e16\u754c\u3002\u591a\u69d8\u306a\u307e\u307e\u8c4a\u304b\u306b\u306a\u3063\u3066\u3044\u307e\u3059\u3002" },
    { pos: "bl", cap: `<h2>\u3069\u3061\u3089\u306b\u306a\u308b\u304b\u306f\u3001\u307e\u3060\u6c7a\u307e\u3063\u3066\u3044\u306a\u3044</h2>`,
      note: "\u3069\u3061\u3089\u306e\u672a\u6765\u306b\u306a\u308b\u304b\u306f\u3001\u307e\u3060\u6c7a\u307e\u3063\u3066\u3044\u307e\u305b\u3093\u3002\n\uff08\u3053\u306e\u753b\u9762\u3067\u5c11\u3057\u9577\u3081\u306b\u6b62\u307e\u308b\uff09" }
  ],
  make() {
    const camera = cam(42, 600);
    const mkWorld = (bg, fogNear, fogFar) => { const s = new T.Scene(); s.background = new T.Color(bg); s.fog = new T.Fog(bg, fogNear, fogFar); return s; };
    const L = mkWorld(0x9a9ea5, 18, 85);
    L.add(new T.HemisphereLight(0xd8dbe0, 0x6c7077, 1.0)); { const d = new T.DirectionalLight(0xffffff, .5); d.position.set(5, 10, 3); L.add(d); }
    const gL = new T.Mesh(new T.PlaneGeometry(300, 300), new T.MeshStandardMaterial({ color: 0x7c8087 })); gL.rotation.x = -Math.PI / 2; L.add(gL);
    const NN = 44, half = NN / 2, m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), ps = new T.Vector3(), colr = new T.Color();
    const boxG = new T.BoxGeometry(1, 1, 1).translate(0, .5, 0);
    const uni = new T.InstancedMesh(boxG, new T.MeshStandardMaterial({ color: 0xb4b7bc, roughness: .9 }), NN * NN);
    let k = 0;
    for (let x = 0; x < NN; x++) for (let z = 0; z < NN; z++) { ps.set((x - half) * 1.3, 0, (z - half) * 1.3); s.set(.95, 1.4, .95); uni.setMatrixAt(k++, m4.compose(ps, q, s)); }
    L.add(uni);

    /* ---- \u53f3: \u72d9\u3044\u304c\u5408\u3063\u305f\u4e16\u754c\uff08\u5915\u65b9\u306e\u5149\u3001\u5ddd\u3068\u6a4b\u3001\u5bb6\u4e26\u307f\u3001\u685c\u3001\u6c17\u7403\uff09 ---- */
    const Rw = new T.Scene();
    { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "#8ec5e2"); gr.addColorStop(.55, "#cfe3e6"); gr.addColorStop(.8, "#ffe2c2"); gr.addColorStop(1, "#ffd3a8"); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
      Rw.background = new T.CanvasTexture(c); }
    Rw.fog = new T.Fog(0xf5dcc4, 32, 125);
    Rw.add(new T.HemisphereLight(0xfff1dc, 0x8aa86e, 1.4));
    { const d = new T.DirectionalLight(0xffdcaa, 1.45); d.position.set(-20, 14, 12); Rw.add(d); }
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const river = z => 3.2 * Math.sin(z / 5);
    // \u306a\u3060\u3089\u304b\u306a\u4e18\u3068\u8349\u82b1\u306e\u8272\u3080\u3089
    const hill = (x, z) => { const r = Math.hypot(x, z); return Math.min(4, Math.max(0, r - 30) * .1) * (1 + .5 * Math.sin(x * .2) * Math.cos(z * .17)); };
    { const gg = new T.PlaneGeometry(220, 220, 110, 110); gg.rotateX(-Math.PI / 2);
      const pa = gg.attributes.position, cols = new Float32Array(pa.count * 3), c = new T.Color();
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, hill(x, z));
        const n = Math.sin(x * .45) * Math.cos(z * .38) + Math.sin((x - z) * .21);
        const far = Math.hypot(x, z) > 26; c.setHex(far && n > 1.2 ? 0xe9d36b : far && n < -1.3 ? 0xc3b0de : 0x8fc06c); c.offsetHSL(0, 0, (Math.random() - .5) * .05); cols.set([c.r, c.g, c.b], i * 3); }
      gg.setAttribute("color", new T.BufferAttribute(cols, 3)); gg.computeVertexNormals();
      Rw.add(new T.Mesh(gg, new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true }))); }
    // \u5ddd\u3068\u6731\u8272\u306e\u6a4b
    { const rg = new T.PlaneGeometry(4, 120, 1, 120), rp = rg.attributes.position;
      for (let i = 0; i < rp.count; i++) { const y = rp.getY(i); rp.setX(i, rp.getX(i) + river(-y)); }
      const rv = new T.Mesh(rg, new T.MeshStandardMaterial({ color: 0x67b4d6, roughness: .15, metalness: .1, emissive: 0x16384a })); rv.rotation.x = -Math.PI / 2; rv.position.y = .03; Rw.add(rv);
      const bm = new T.MeshStandardMaterial({ color: 0xd2553a, roughness: .6 });
      [-7, 6, 18].forEach(z => { const br = new T.Mesh(new T.TorusGeometry(2.6, .14, 6, 24, Math.PI), bm); br.scale.set(1, .35, 1); br.position.set(river(z), 0, z); Rw.add(br);
        const deck = new T.Mesh(new T.BoxGeometry(5.4, .08, .9), bm); deck.position.set(river(z), .55, z); Rw.add(deck); }); }
    // \u5bb6\u4e26\u307f\uff08\u58c1\u3068\u5c4b\u6839\uff09\u30fb\u685c\u3068\u6728
    const NH = 900, house = new T.InstancedMesh(boxG, new T.MeshStandardMaterial({ roughness: .8 }), NH);
    const roof = new T.InstancedMesh(new T.ConeGeometry(.78, .55, 4).rotateY(Math.PI / 4).translate(0, .275, 0), new T.MeshStandardMaterial({ roughness: .7, flatShading: true }), NH);
    const NT = 1100, trunk = new T.InstancedMesh(new T.CylinderGeometry(.05, .07, .5, 5).translate(0, .25, 0), new T.MeshStandardMaterial({ color: 0x6b4a32 }), NT);
    const crown = new T.InstancedMesh(new T.IcosahedronGeometry(.5, 0), new T.MeshStandardMaterial({ roughness: .9, flatShading: true }), NT);
    const wall = [0xf6efe2, 0xf1e4cf, 0xe9eef0, 0xf3dcc8, 0xdfe9dc];
    const roofC = [0xc0603f, 0x8c4a3a, 0x5d7484, 0x3f6f6a, 0xb0784a];
    const leaf = [0x5f9e4d, 0x4c8a45, 0x79b357, 0x3f7a49], sakura = [0xf5b8c9, 0xf7c8d5, 0xeea7bd];
    let nh = 0, nt = 0;
    const qy = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let x = 0; x < NN; x++) for (let z = 0; z < NN; z++) {
      const X = (x - half) * 1.3 + rnd(-.25, .25), Z = (z - half) * 1.3 + rnd(-.25, .25);
      const dr = Math.abs(X - river(Z)), r = Math.hypot(X, Z);
      if (dr < 2.4 || r < 3.2) continue;
      const y0 = hill(X, Z), n = Math.sin(X * .35) * Math.cos(Z * .3) + Math.sin((X + Z) * .17), u = Math.random();
      if ((dr < 3.6 && u < .7) || n > .7 || u < .22 || r > 24) {
        if (nt >= NT) continue;
        const sc = rnd(.75, 1.25), isS = dr < 4.2 || Math.random() < .2;
        ps.set(X, y0, Z); s.set(sc, sc, sc); trunk.setMatrixAt(nt, m4.compose(ps, q, s));
        ps.set(X, y0 + .5 * sc + .35 * sc, Z); s.set(sc * 1.1, sc * .9, sc * 1.1); crown.setMatrixAt(nt, m4.compose(ps, q, s));
        crown.setColorAt(nt++, colr.setHex(isS ? pick(sakura) : pick(leaf)));
      } else if (u < .85 && nh < NH) {
        const w = rnd(.7, 1.05), d = rnd(.7, 1.05), h = rnd(.45, .9) + (r < 10 ? rnd(0, 1.2) : 0);
        qy.setFromAxisAngle(up, Math.round(Math.random()) * Math.PI / 2);
        ps.set(X, y0, Z); s.set(w, h, d); house.setMatrixAt(nh, m4.compose(ps, qy, s)); house.setColorAt(nh, colr.setHex(pick(wall)));
        ps.set(X, y0 + h, Z); s.set(w, rnd(.8, 1.2), d); roof.setMatrixAt(nh, m4.compose(ps, qy, s)); roof.setColorAt(nh++, colr.setHex(pick(roofC)));
      }
    }
    house.count = roof.count = nh; trunk.count = crown.count = nt; Rw.add(house, roof, trunk, crown);
    // \u4e2d\u5fc3\u306e\u5e83\u5834: \u6c60\u3068\u3001\u7dd1\u3092\u307e\u3068\u3063\u305f\u5854
    { const pond = new T.Mesh(new T.CircleGeometry(2.2, 40), new T.MeshStandardMaterial({ color: 0x7cc3dc, roughness: .2, emissive: 0x173a48 })); pond.rotation.x = -Math.PI / 2; pond.position.y = .04; Rw.add(pond);
      const white = new T.MeshStandardMaterial({ color: 0xfbf7ef, roughness: .5 }), green = new T.MeshStandardMaterial({ color: 0x6fae55, roughness: .9, flatShading: true });
      [[4.2, -3.5, 5.5], [-4.6, 3.8, 4.4], [3.6, 5.2, 3.3]].forEach(([x, z, H]) => {
        const lv = Math.round(H / 1.1);
        for (let i = 0; i < lv; i++) { const rr = .95 - i * .045, y = i * 1.1;
          const c = new T.Mesh(new T.CylinderGeometry(rr, rr + .05, .9, 12), white); c.position.set(x, y + .45, z); Rw.add(c);
          const g = new T.Mesh(new T.CylinderGeometry(rr + .16, rr + .16, .2, 12), green); g.position.set(x, y + 1, z); Rw.add(g); }
        const top = new T.Mesh(new T.IcosahedronGeometry(.75, 1), green); top.position.set(x, lv * 1.1 + .35, z); Rw.add(top); }); }
    // \u98a8\u8eca
    const blades = [];
    for (let i = 0; i < 5; i++) {
      const a = -.9 + i * .45, R0 = 34 + (i % 2) * 5, x = Math.cos(a) * R0, z = Math.sin(a) * R0 - 6, y0 = hill(x, z);
      const pole = new T.Mesh(new T.CylinderGeometry(.08, .14, 6, 8).translate(0, 3, 0), new T.MeshStandardMaterial({ color: 0xffffff })); pole.position.set(x, y0, z); Rw.add(pole);
      const hub = new T.Group(); hub.position.set(x, y0 + 6, z); hub.lookAt(0, y0 + 6, 0);
      for (let b2 = 0; b2 < 3; b2++) { const bl = new T.Mesh(new T.BoxGeometry(.18, 2.6, .05).translate(0, 1.3, 0), new T.MeshStandardMaterial({ color: 0xffffff })); bl.rotation.z = b2 * Math.PI * 2 / 3; hub.add(bl); }
      Rw.add(hub); blades.push(hub);
    }
    // \u6c17\u7403
    const balloons = [];
    [[-10, 12, -8, 0xe76f51], [12, 15, 4, 0xf4a261], [2, 18, -16, 0x2a9d8f]].forEach(([x, y, z, c]) => {
      const g = new T.Group(); g.position.set(x, y, z);
      const env = new T.Mesh(new T.SphereGeometry(1.2, 16, 12), new T.MeshStandardMaterial({ color: c, roughness: .6, flatShading: true })); env.scale.set(1, 1.2, 1); g.add(env);
      const bk = new T.Mesh(new T.BoxGeometry(.4, .3, .4), new T.MeshStandardMaterial({ color: 0x7a5a3a })); bk.position.y = -1.9; g.add(bk);
      Rw.add(g); balloons.push({ g, y, ph: Math.random() * 6 }); });
    // \u821e\u3046\u82b1\u3073\u3089
    const NP = 700, pp = new Float32Array(NP * 3), pv0 = [];
    for (let i = 0; i < NP; i++) { pv0.push([rnd(-30, 30), rnd(.5, 12), rnd(-30, 30), Math.random() * 6]); }
    const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pp, 3));
    Rw.add(new T.Points(pg, new T.PointsMaterial({ color: 0xf7c3d2, size: .16, transparent: true, opacity: .9, depthWrite: false })));
    const animR = t => {
      blades.forEach((h, i) => h.children.forEach((b, j) => b.rotation.z = j * Math.PI * 2 / 3 + t * (.9 + i * .1)));
      balloons.forEach(b => { b.g.position.y = b.y + Math.sin(t * .4 + b.ph) * .6; });
      for (let i = 0; i < NP; i++) { const v = pv0[i], f = (t * .6 + v[3]) % 12;
        pp[i * 3] = v[0] + Math.sin(t * .5 + v[3]) * 1.5 + f * .8; pp[i * 3 + 1] = Math.max(.1, v[1] - f * .9 + 6); pp[i * 3 + 2] = v[2] + Math.cos(t * .4 + v[3]) * 1.5; }
      pg.attributes.position.needsUpdate = true;
    };
    // \u4ed5\u5207\u308a
    const extra = el("div", "", "");
    const div = el("div", "", ""); div.id = "divider"; div.setAttribute("aria-hidden", "true");
    const sl = el("div", "side l", "\u72d9\u3044\u304c1\u5ea6\u305a\u308c\u305f\u4e16\u754c"), sr = el("div", "side r", "\u72d9\u3044\u304c\u5408\u3063\u305f\u4e16\u754c");
    extra.append(div, sl, sr);
    let f = .5;
    const setF = v => { f = v; div.style.left = (f * 100) + "%"; };
    setF(.5);
    const self = this;
    return {
      scene: L, camera, extra,
      update() { const a = self.t * .045 + .6; place(camera, [Math.sin(a) * 30, 13, Math.cos(a) * 30], [0, 1.5, 0]); animR(self.t); },
      render(R, target, w, h) {
        const dx = Math.round(w * f);
        R.setRenderTarget(target);
        if (target) {
          target.scissorTest = true;
          target.scissor.set(0, 0, dx, h); target.viewport.set(0, 0, w, h); R.setRenderTarget(target); R.render(L, camera);
          target.scissor.set(dx, 0, w - dx, h); R.setRenderTarget(target); R.render(Rw, camera);
          target.scissorTest = false; target.scissor.set(0, 0, w, h);
        } else {
          const cw = innerWidth, ch = innerHeight, cx = cw * f;
          R.setScissorTest(true);
          R.setScissor(0, 0, cx, ch); R.render(L, camera);
          R.setScissor(cx, 0, cw - cx, ch); R.render(Rw, camera);
          R.setScissorTest(false);
        }
      }
    };
  }
});

/* ---------- 8. \u3044\u307e\u3001\u3053\u3053 ---------- */
SCENES.push({
  id: "here", title: "\u3044\u307e\u3001\u3053\u3053",
  look: { bg: "#dfe5ec", ink: "#1b2330", dim: "rgba(27,35,48,.6)", halo: "rgba(223,229,236,.9)" }, glow: 0x3a4a63,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">\u73fe\u5728\u5730</span><h2>\u3053\u3053\u304c\u3001\u4eca\u65e5</h2><p>\u6307\u6570\u95a2\u6570\u306e\u66f2\u7dda\u3092\u3001\u305d\u306e\u4e0a\u306b\u7acb\u3063\u3066\u773a\u3081\u3066\u3044\u307e\u3059\u3002\u8db3\u5143\u304b\u3089\u898b\u308b\u3068\u3001\u307e\u3060\u5e73\u3089\u306b\u898b\u3048\u307e\u3059\u3002</p>`,
      note: "\u3053\u3053\u307e\u3067\u306e\u8a71\u306f\u3001\u5168\u90e8\u3072\u3068\u3064\u306e\u66f2\u7dda\u306e\u4e0a\u306b\u3042\u308a\u307e\u3057\u305f\u3002\u3044\u307e\u79c1\u305f\u3061\u304c\u7acb\u3063\u3066\u3044\u308b\u306e\u306f\u3053\u3053\u3001\u4eca\u65e5\u3067\u3059\u3002\n\u8db3\u5143\u304b\u3089\u898b\u308b\u3068\u3001\u307e\u3060\u5e73\u3089\u306b\u898b\u3048\u307e\u3059\u3002" },
    { pos: "tl", cap: `<h2>\u898b\u4e0a\u3052\u308b\u3068</h2><p>\u58c1\u306f\u3001\u6570\u6b69\u5148\u304b\u3089\u3082\u3046\u59cb\u307e\u3063\u3066\u3044\u307e\u3059\u3002\u6307\u6570\u95a2\u6570\u306e\u5e95\u306b\u3044\u308b\u3068\u304d\u3001\u666f\u8272\u306f\u3044\u3064\u3082\u5e73\u3089\u306b\u898b\u3048\u307e\u3059\u3002</p>`,
      note: "\u898b\u4e0a\u3052\u3066\u304f\u3060\u3055\u3044\u3002\u4eca\u65e5\u306e\u8a71\u306f\u3059\u3079\u3066\u3001\u3042\u306e\u58c1\u306e\u4e2d\u306b\u3042\u308a\u307e\u3059\u3002\u305d\u3057\u3066\u58c1\u306f\u3001\u6570\u6b69\u5148\u304b\u3089\u59cb\u307e\u3063\u3066\u3044\u308b\u3002\n\u6307\u6570\u95a2\u6570\u306e\u5e95\u304b\u3089\u306f\u3001\u666f\u8272\u306f\u3044\u3064\u3082\u5e73\u3089\u306b\u898b\u3048\u308b\u306e\u3067\u3059\u3002" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    scene.fog = new T.Fog(this.look.bg, 30, 900);
    const camera = cam(60, 6000);
    const geo = new T.PlaneGeometry(90, 70, 600, 2); geo.rotateX(-Math.PI / 2);
    const pa = geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + 35; pa.setX(i, x); pa.setY(i, x <= 0 ? 0 : .02 * (Math.exp(x / 6) - 1)); }
    geo.computeVertexNormals();
    const mat = new T.ShaderMaterial({
      side: T.DoubleSide,
      uniforms: { fogColor: { value: new T.Color(this.look.bg) } },
      vertexShader: `varying vec3 vW; varying vec3 vP; varying float vD; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vD=-mv.z; vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 fogColor; varying vec3 vW; varying vec3 vP; varying float vD;
        float ln(float v,float w){ float d=abs(fract(v-.5)-.5); float fw=fwidth(v); return 1.-smoothstep(0.,fw*w,d); }
        void main(){ float g=max(ln(vP.x,1.2),ln(vP.z,1.2)); float g5=max(ln(vP.x/5.,1.6),ln(vP.z/5.,1.6));
          vec3 base=vec3(.975,.98,.985), line=vec3(.23,.29,.39);
          vec3 c=mix(base,line,g*.35+g5*.55);
          float f=smoothstep(30.,900.,vD); gl_FragColor=vec4(mix(c,fogColor,f),1.); }`
    });
    scene.add(new T.Mesh(geo, mat));
    const person = new T.Group();
    const pm = new T.MeshBasicMaterial({ color: 0x1b2330 });
    const body = new T.Mesh(new T.CylinderGeometry(.11, .14, .8, 16).translate(0, .4, 0), pm);
    const head = new T.Mesh(new T.SphereGeometry(.12, 16, 12), pm); head.position.y = .95;
    person.add(body, head); person.position.set(-1.5, 0, 1.6); scene.add(person);
    const self = this;
    const labels = [{ el: el("div", "lab big", "\u3042\u306a\u305f"), p: new T.Vector3(-1.5, 1.35, 1.6), op: () => 1 - ss(.3, .8, self.p) }];
    return {
      scene, camera, labels,
      update() {
        const t = self.t, p = self.p;
        const c = kf(p, [[-7, 1.1, 0, 22, 1.2, 0], [-7.5, .7, 0, 30, 55, 0]]);
        place(camera, [c[0], c[1], c[2] + Math.sin(t * .15) * .3], [c[3], c[4], c[5]]);
      }
    };
  }
});

/* ---------- 9. \u554f\u3044 ---------- */
SCENES.push({
  id: "question", title: "\u4f55\u3092\u671b\u3080\u306e\u304b",
  look: { bg: "#ffffff", ink: "#12141a", dim: "rgba(18,20,26,.55)", halo: "rgba(255,255,255,.9)" }, glow: 0x12141a,
  beats: [
    { pos: "c", cap: `<h2>\u79c1\u305f\u3061\u306f\u3001AI\u306b<br>\u4f55\u3092\u671b\u3080\u306e\u304b\u3002</h2>`,
      note: "\u6700\u5f8c\u306b\u3001\u554f\u3044\u3092\u3072\u3068\u3064\u7f6e\u3044\u3066\u7d42\u308f\u308a\u307e\u3059\u3002\n\u79c1\u305f\u3061\u306f\u3001AI\u306b\u4f55\u3092\u671b\u3080\u306e\u304b\u3002\n\uff08\u3053\u3053\u3067\u9ed9\u308b\u3002\u7b54\u3048\u3092\u6025\u304c\u306a\u3044\uff09" },
    { pos: "c", cap: `<h2>\u79c1\u305f\u3061\u306f\u3001AI\u306b<br>\u4f55\u3092\u671b\u3080\u306e\u304b\u3002</h2><p>\u4e16\u754c\u3092\u66f8\u304d\u63db\u3048\u3089\u308c\u308b\u3082\u306e\u304c\u3001\u3082\u3046\u3059\u3050\u73fe\u308c\u307e\u3059\u3002\u305d\u306e\u3068\u304d\u3001\u671b\u3080\u3053\u3068\u3092\u8a00\u8449\u306b\u3067\u304d\u308b\u304b\u3069\u3046\u304b\u304c\u3001\u3053\u306e\u5148\u3092\u6c7a\u3081\u307e\u3059\u3002</p><p class="src">\u3054\u6e05\u8074\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f</p><p class="src">\u53c2\u8003\u8cc7\u6599: <a href="https://arxiv.org/abs/2503.14499" target="_blank" rel="noopener">METR (2025) arXiv:2503.14499</a> \u00b7 <a href="https://ja.wikipedia.org/wiki/%E6%9B%BD%E5%91%82%E5%88%A9%E6%96%B0%E5%B7%A6%E8%A1%9B%E9%96%80" target="_blank" rel="noopener">\u66fd\u5442\u5229\u65b0\u5de6\u885b\u9580</a> \u00b7 <a href="https://ja.wikipedia.org/wiki/%E7%9F%B3_(%E5%8D%98%E4%BD%8D)" target="_blank" rel="noopener">\u77f3 (\u5358\u4f4d)</a> \u00b7 <a href="https://ja.wikipedia.org/wiki/%E4%BF%B5" target="_blank" rel="noopener">\u4ff5</a> \u00b7 <a href="https://ja.wikipedia.org/wiki/%E5%8A%A0%E8%B3%80%E8%97%A9" target="_blank" rel="noopener">\u52a0\u8cc0\u85e9</a> \u00b7 <a href="https://ja.wikipedia.org/wiki/%E5%9C%B0%E7%90%83%E8%B3%AA%E9%87%8F" target="_blank" rel="noopener">\u5730\u7403\u8cea\u91cf</a> \u00b7 <a href="https://ja.wikipedia.org/wiki/%E6%9C%88" target="_blank" rel="noopener">\u6708</a></p>`,
      note: "\u4e16\u754c\u3092\u66f8\u304d\u63db\u3048\u3089\u308c\u308b\u3082\u306e\u304c\u3001\u3082\u3046\u3059\u3050\u73fe\u308c\u307e\u3059\u3002\u305d\u306e\u3068\u304d\u79c1\u305f\u3061\u304c\u671b\u3080\u3053\u3068\u3092\u8a00\u8449\u306b\u3067\u304d\u308b\u304b\u3069\u3046\u304b\u304c\u3001\u3053\u306e\u5148\u3092\u6c7a\u3081\u307e\u3059\u3002\n\u3054\u6e05\u8074\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f\u3002\n\uff08\u6570\u79d2\u5f8c\u3001\u6587\u5b57\u304c\u3061\u3087\u3046\u30691\u5ea6\u3060\u3051\u50be\u304f\uff09" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    const camera = cam(50); camera.position.set(0, 0, 30);
    const N = 2600, pos = new Float32Array(N * 3), sd = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { sd.set([(Math.random() - .5) * 70, (Math.random() - .5) * 42, (Math.random() - .5) * 20], i * 3); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3));
    scene.add(new T.Points(g, new T.PointsMaterial({ size: .09, color: 0x9aa0ab })));
    const self = this;
    return {
      scene, camera,
      update() {
        const t = self.t;
        for (let i = 0; i < N; i++) {
          const x = sd[i * 3], y = sd[i * 3 + 1], z = sd[i * 3 + 2];
          pos[i * 3] = x + Math.sin(t * .2 + y * .15) * 1.2;
          pos[i * 3 + 1] = y + Math.cos(t * .17 + x * .12) * 1.2;
          pos[i * 3 + 2] = z;
        }
        g.attributes.position.needsUpdate = true;
        const tilt = self.beat === 1 && self.t - (self.b1 || 0) > 6;
        capEl.classList.toggle("tilt", tilt);
      },
      onBeat(b) { if (b === 1) self.b1 = self.t; }
    };
  }
});

/* ================================================================
   \u30c7\u30c3\u30ad\u672c\u4f53
   ================================================================ */
const canvas = document.getElementById("stage");
const capEl = document.getElementById("cap"), liveEl = document.getElementById("live");
const labelsRoot = document.getElementById("labels"), extraRoot = document.getElementById("extra");
const hudL = document.getElementById("hudL"), hudR = document.getElementById("hudR"), dotsEl = document.getElementById("dots");
const ui = document.getElementById("ui");

let R;
try { R = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
catch (e) { const d = el("div", "panel help", "<span>\u3053\u306e\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3\u306b\u306fWebGL\u304c\u5fc5\u8981\u3067\u3059\u3002\u6700\u65b0\u306eChrome\u3001Edge\u3001Safari\u3001Firefox\u3067\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002</span>"); ui.append(d); return; }
R.outputColorSpace = T.LinearSRGBColorSpace;
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.setSize(innerWidth, innerHeight, false);

const inst = SCENES.map(def => {
  const ctx = { p: 0, t: 0, beat: 0, look: def.look };
  const o = def.make.call(Object.assign(ctx, { look: def.look }));
  const lr = el("div"); lr.style.opacity = 0; labelsRoot.append(lr);
  (o.labels || []).forEach(l => lr.append(l.el));
  if (o.extra) { o.extra.hidden = true; extraRoot.append(o.extra); }
  return { def, ctx, o, lr };
});

let rtA, rtB;
function makeRTs() {
  const s = R.getDrawingBufferSize(new T.Vector2());
  rtA && rtA.dispose(); rtB && rtB.dispose();
  rtA = new T.WebGLRenderTarget(s.x, s.y, { samples: 4 }); rtB = new T.WebGLRenderTarget(s.x, s.y, { samples: 4 });
}
makeRTs();
const comp = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
  uniforms: { tA: { value: null }, tB: { value: null }, p: { value: 0 }, asp: { value: 1 }, glow: { value: new T.Color() } },
  depthTest: false, depthWrite: false,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D tA,tB; uniform float p,asp; uniform vec3 glow; varying vec2 vUv;
    float h(vec2 q){ return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 q){ vec2 i=floor(q),f=fract(q); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
    float fbm(vec2 q){ float s=0.,a=.5; for(int i=0;i<5;i++){ s+=a*n(q); q*=2.03; a*=.5; } return s; }
    void main(){
      vec2 q=vec2((vUv.x-.5)*asp,vUv.y-.5);
      float v=fbm(q*3.2+3.)*.62+length(q)*.55;
      float th=mix(-.08,1.25,p);
      float m=1.-smoothstep(th-.035,th,v);
      float e=(1.-smoothstep(0.,.07,abs(v-th)))*step(.001,p)*step(p,.999);
      vec2 wob=vec2(n(q*8.+p*4.),n(q*8.-p*4.))-.5;
      vec3 a=texture2D(tA,vUv+wob*.02*e).rgb, b=texture2D(tB,vUv-wob*.02*e).rgb;
      vec3 c=mix(a,b,m)+glow*e*.85;
      gl_FragColor=vec4(c,1.);
    }`
}));
const compScene = new T.Scene(); compScene.add(comp);
const compCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function renderInst(I, target) {
  const s = R.getDrawingBufferSize(new T.Vector2());
  if (I.o.render) I.o.render(R, target, s.x, s.y);
  else { R.setRenderTarget(target); R.render(I.o.scene, I.o.camera); }
}

let cur = 0, beat = 0, trans = null, black = false;
const TD = reduced ? .5 : 1.5;

function applyLook(def) {
  const st = document.documentElement.style;
  st.setProperty("--ink", def.look.ink); st.setProperty("--dim", def.look.dim); st.setProperty("--halo", def.look.halo);
  document.body.style.background = def.look.bg;
}
let capTimer;
function setCap() {
  const b = SCENES[cur].beats[beat];
  capEl.classList.add("hide");
  clearTimeout(capTimer);
  capTimer = setTimeout(() => {
    capEl.className = "cap hide " + (b.pos || "c");
    capEl.innerHTML = `<div class="box">${b.cap}</div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => capEl.classList.remove("hide")));
  }, trans ? 520 : 260);
  hudL.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(SCENES.length).padStart(2, "0")}`;
  hudR.textContent = SCENES[cur].title;
  dotsEl.innerHTML = SCENES[cur].beats.map((_, i) => (i <= beat ? "<i data-on></i>" : "<i></i>")).join("");
  updateNotes();
  try { history.replaceState(null, "", "#" + SCENES[cur].id + (beat ? "-" + (beat + 1) : "")); } catch (e) {}
}
function setBeat(b) {
  beat = b; const I = inst[cur]; I.ctx.beat = b; I.o.onBeat && I.o.onBeat(b); setCap();
}
function go(i, b = 0) {
  if (i === cur || i < 0 || i >= SCENES.length) { if (i === cur) { inst[cur].ctx.p = b; setBeat(b); } return; }
  const from = cur; cur = i;
  const I = inst[i]; I.ctx.t = 0; I.ctx.p = b; I.ctx.beat = b;
  trans = { from, to: i, k: 0 };
  comp.material.uniforms.glow.value.setHex(SCENES[i].glow);
  applyLook(SCENES[i]);
  setBeat(b);
}
function advance() {
  if (trans) { trans.k = 1; return; }
  if (beat < SCENES[cur].beats.length - 1) setBeat(beat + 1);
  else if (cur < SCENES.length - 1) go(cur + 1, 0);
}
function back() {
  if (trans) { trans.k = 1; return; }
  if (beat > 0) setBeat(beat - 1);
  else if (cur > 0) go(cur - 1, SCENES[cur - 1].beats.length - 1);
}

/* ---------- \u30d1\u30cd\u30eb\u985e ---------- */
let notesEl = null, overEl = null, helpEl = null, blackEl = null, toastT;
function toast(msg) {
  const t = el("div", "panel toast", msg); ui.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 1400);
}
function updateNotes() {
  if (!notesEl) return;
  const d = SCENES[cur], nxt = d.beats[beat + 1] ? `\u3053\u306e\u30b7\u30fc\u30f3\u306e\u6b21\u306e\u30d3\u30fc\u30c8` : (SCENES[cur + 1] ? `\u6b21: ${SCENES[cur + 1].title}` : "\u6700\u5f8c\u306e\u30b9\u30e9\u30a4\u30c9");
  notesEl.innerHTML = `<p>${d.beats[beat].note}</p><div class="meta">${d.title}<br>\u30d3\u30fc\u30c8 ${beat + 1} / ${d.beats.length}<br>${nxt}</div>`;
}
function toggleNotes() {
  if (notesEl) { notesEl.remove(); notesEl = null; return; }
  notesEl = el("div", "panel notes"); ui.append(notesEl); updateNotes();
}
function toggleOver() {
  if (overEl) { overEl.remove(); overEl = null; canvas.focus(); return; }
  overEl = el("div", "panel over", `<h3>\u30b7\u30fc\u30f3\u4e00\u89a7</h3>`);
  SCENES.forEach((s, i) => {
    const b = el("button", "", `<span>${String(i + 1).padStart(2, "0")} \u00b7 ${s.beats.length}\u30d3\u30fc\u30c8</span><b>${s.title}</b>`);
    if (i === cur) b.setAttribute("aria-current", "true");
    b.onclick = e => { e.stopPropagation(); toggleOver(); go(i, 0); };
    overEl.append(b);
  });
  ui.append(overEl);
  (overEl.querySelector("[aria-current]") || overEl.querySelector("button")).focus();
}
function toggleHelp() {
  if (helpEl) { helpEl.remove(); helpEl = null; return; }
  helpEl = el("div", "panel help", [["\u2192 / \u30b9\u30da\u30fc\u30b9", "\u6b21\u3078"], ["\u2190", "\u524d\u3078"], ["\u30af\u30ea\u30c3\u30af", "\u53f3\u5074\u3067\u6b21\u3078\u30fb\u5de6\u7aef\u3067\u524d\u3078"], ["N", "\u767a\u8868\u8005\u30ce\u30fc\u30c8"], ["O", "\u30b7\u30fc\u30f3\u4e00\u89a7"], ["F", "\u5168\u753b\u9762"], ["B", "\u6697\u8ee2"], ["Home / End", "\u6700\u521d / \u6700\u5f8c"], ["?", "\u3053\u306e\u30d8\u30eb\u30d7"]].map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join(""));
  ui.append(helpEl);
}
function toggleBlack() {
  black = !black;
  if (black) { blackEl = el("div", "black"); blackEl.onclick = toggleBlack; ui.append(blackEl); } else { blackEl && blackEl.remove(); blackEl = null; }
}

addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (overEl && k !== "Escape" && k !== "o" && k !== "O") return;
  if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(k)) { e.preventDefault(); if (!e.repeat) advance(); }
  else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); if (!e.repeat) back(); }
  else if (k === "Home") go(0, 0);
  else if (k === "End") go(SCENES.length - 1, 0);
  else if (k === "f" || k === "F") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => toast("\u5168\u753b\u9762\u306b\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f")); }
  else if (k === "n" || k === "N") toggleNotes();
  else if (k === "o" || k === "O") toggleOver();
  else if (k === "?" || k === "h" || k === "H") toggleHelp();
  else if (k === "b" || k === "B" || k === ".") toggleBlack();
  else if (k === "Escape") { overEl && toggleOver(); helpEl && toggleHelp(); }
});
let down = null;
canvas.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; canvas.focus(); });
canvas.addEventListener("pointerup", e => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
  if (helpEl) { toggleHelp(); return; }
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? advance() : back(); return; }
  if (Math.hypot(dx, dy) < 10) { e.clientX < innerWidth * .22 ? back() : advance(); }
});
let idleT; const wake = () => { document.body.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add("idle"), 2500); };
addEventListener("pointermove", wake); wake();
addEventListener("resize", () => {
  R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(innerWidth, innerHeight, false); makeRTs();
  inst.forEach(I => { I.o.camera.aspect = innerWidth / innerHeight; I.o.camera.updateProjectionMatrix(); });
});
function fromHash() {
  const m = /^#([a-z]+)(?:-(\d+))?$/.exec(location.hash); if (!m) return false;
  const i = SCENES.findIndex(s => s.id === m[1]); if (i < 0) return false;
  const b = clamp((m[2] ? +m[2] : 1) - 1, 0, SCENES[i].beats.length - 1);
  return [i, b];
}
addEventListener("hashchange", () => { const h = fromHash(); if (h && (h[0] !== cur || h[1] !== beat)) go(h[0], h[1]); });

/* ---------- \u30eb\u30fc\u30d7 ---------- */
const pv = new T.Vector3();
function step(I, dt) {
  const c = I.ctx; c.t += dt;
  c.p += (c.beat - c.p) * (1 - Math.exp(-dt * (reduced ? 6 : 1.7)));
  if (Math.abs(c.beat - c.p) < 1e-4) c.p = c.beat;
  I.o.update(dt);
}
function projectLabels(I, op) {
  I.lr.style.opacity = op;
  if (op <= 0) return;
  const W = innerWidth, H = innerHeight;
  (I.o.labels || []).forEach(l => {
    const p = typeof l.p === "function" ? l.p() : l.p;
    pv.copy(p).project(I.o.camera);
    const a = l.op();
    if (pv.z > 1 || a <= .01) { l.el.style.opacity = 0; return; }
    l.el.style.opacity = a;
    l.el.style.transform = `translate(${(pv.x + 1) / 2 * W}px,${(1 - pv.y) / 2 * H}px) translate(-50%,-100%)`;
  });
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const I = inst[cur];
  step(I, dt);
  if (trans) {
    const F = inst[trans.from];
    step(F, dt);
    trans.k += dt / TD;
    if (trans.k >= 1) trans = null;
  }
  if (trans) {
    renderInst(inst[trans.from], rtA); renderInst(I, rtB);
    const u = comp.material.uniforms; u.tA.value = rtA.texture; u.tB.value = rtB.texture; u.p.value = eio(clamp(trans.k)); u.asp.value = innerWidth / innerHeight;
    R.setRenderTarget(null); R.render(compScene, compCam);
  } else renderInst(I, null);
  inst.forEach((J, i) => {
    const showing = i === cur ? (trans ? ss(.6, 1, trans.k) : 1) : 0;
    projectLabels(J, showing);
    if (J.o.extra) { J.o.extra.hidden = !(i === cur && !trans); }
  });
  const lt = I.o.live ? I.o.live() : "";
  if (liveEl.dataset.v !== lt) { liveEl.innerHTML = lt; liveEl.dataset.v = lt; }
  liveEl.style.opacity = trans ? 0 : 1;
  requestAnimationFrame(frame);
}

const h = fromHash();
if (h) { cur = h[0]; inst[cur].ctx.p = h[1]; }
applyLook(SCENES[cur]);
comp.material.uniforms.glow.value.setHex(SCENES[cur].glow);
setBeat(h ? h[1] : 0);
canvas.focus();
requestAnimationFrame(frame);
})();
