(() => {
"use strict";
const T = THREE;
T.ColorManagement.enabled = false;

/* ---------- 小道具 ---------- */
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
  // 日本語の数詞単位（万・億・兆・京・垓・𥝱・穣）。1億以上は一番上の単位だけ。
  if (v < 1e4) return String(Math.round(v));
  if (v < 1e8) { const m = Math.floor(v / 1e4), r = Math.floor(v % 1e4); return m + "万" + (r ? r : ""); }
  const U = [[1e28, "穣"], [1e24, "𥝱"], [1e20, "垓"], [1e16, "京"], [1e12, "兆"], [1e8, "億"]];
  const u = U.find(u => v >= u[0]);
  return Math.floor(v / u[0]).toLocaleString("ja-JP") + u[1];
}
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* ================================================================
   シーン定義
   各シーン: { id, title, look:{bg,ink,dim,halo}, glow, beats:[{cap,pos,note}], make() }
   make() は { scene, camera, update(dt), labels?, live?, render?, onBeat?, extra? } を返す
   this.p … ビート位置（なめらかに追従する小数）, this.t … シーン内時間
   ================================================================ */
const SCENES = [];

/* ---------- 1. タイトル ---------- */
SCENES.push({
  id: "title", title: "AIの未来",
  look: { bg: "#070a14", ink: "#f3efe6", dim: "rgba(243,239,230,.6)", halo: "rgba(7,10,20,.6)" }, glow: 0xffb547,
  beats: [
    { pos: "bl", cap: `<span class="eyebrow">2026年11月 · 講演</span><h1>AIの未来</h1><p>指数関数の上に立って考える</p><p class="src">参考にしたスライド: <a href="https://claude.ai/artifact/Cy2d8Vn63CnzCtonA1LSah" target="_blank" rel="noopener">The Last Boring Slide</a>（構成と一部の題材を参考に、日本語で再構成）</p>`,
      note: "こんにちは。今日は「AIの未来」についてお話しします。\n（タイトルの後、少し間を置く。点が球にまとまるのを待つ）" },
    { pos: "bl", cap: `<p class="lead">未来を予想するとき、私たちはたいてい「今日の延長」で考えます。</p><p>今日は、その直感がどこで外れるのかを、目で見て確かめていきます。</p>`,
      note: "未来を予想するとき、人は今日の延長線を引きます。今日はその直感がどこで外れるのかを見ていきます。\n（次へ進むと球がはじける）" }
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

/* ---------- 2. 倍々の米（曽呂利新左衛門） ---------- */
SCENES.push({
  id: "rice", title: "倍々の米",
  look: { bg: "#e9e2d2", ink: "#2a2118", dim: "rgba(42,33,24,.62)", halo: "rgba(233,226,210,.85)" }, glow: 0x8a5a2b,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">倍、倍、倍</span><h2>褒美は、米粒で</h2><p>落語家の始祖ともいわれる曽呂利新左衛門は、豊臣秀吉から褒美として「1日目は米1粒、2日目は2粒と、日ごとに倍にしてほしい」と頼んだと伝えられます。</p><p class="src">出典: <a href="https://ja.wikipedia.org/wiki/%E6%9B%BD%E5%91%82%E5%88%A9%E6%96%B0%E5%B7%A6%E8%A1%9B%E9%96%80" target="_blank" rel="noopener">曽呂利新左衛門（Wikipedia）</a></p>`,
      note: "曽呂利新左衛門の逸話です。落語家の始祖ともいわれる人です。\n秀吉に褒美を問われて、1日目は米1粒、次の日は2粒、その次は4粒と、日ごとに倍にしてほしいと頼んだと伝えられます。\n1日分ずつ横に並べていきます。8日目でも128粒。ひとつまみです。" },
    { pos: "tl", cap: `<h2>23日目、1日分が1俵を超える</h2><p>23日目は約419万粒、約92kg。その日の分だけで、米俵1俵（60kg）を超えました。1日分を1か所に山盛りにすると、もう空に届いています。</p><p class="src">1俵 = 60kg、1石 = 2.5俵 ≈ 150kg · <a href="https://ja.wikipedia.org/wiki/%E4%BF%B5" target="_blank" rel="noopener">俵</a> / <a href="https://ja.wikipedia.org/wiki/%E7%9F%B3_(%E5%8D%98%E4%BD%8D)" target="_blank" rel="noopener">石 (単位)</a>（Wikipedia）</p>`,
      note: "8日目まではひとつまみ。14日目でもお茶わん3杯ほどです。\nところが23日目には約419万粒、92kg。その日の分だけで米俵1俵を超えます。\n山盛りにすると、もう空に届いています。" },
    { pos: "tl", cap: `<h2>44日目、1日分で百万石</h2><p>44日目は約8.8兆粒。その日の分だけで約129万石、加賀百万石を1日で超えます。</p><p class="src">参考: <a href="https://ja.wikipedia.org/wiki/%E5%8A%A0%E8%B3%80%E8%97%A9" target="_blank" rel="noopener">加賀藩（Wikipedia）</a></p>`,
      note: "44日目には約8.8兆粒。その日の分だけで約129万石。\n加賀百万石、大大名の1年分の石高を、1日分で超えてしまいます。まだ半分も来ていません。" },
    { pos: "tl", cap: `<h2>100日目</h2><p class="num">63穣粒</p><p>100日分を合計すると約1860垓石。加賀百万石の約19京倍で、米の重さは地球のおよそ5倍です。頼んだのは、毎日倍にすることだけでした。</p><p class="src">米1粒 ≈ 0.022g、1石 ≈ 150kg、地球の質量 ≈ 6.0×10<sup>24</sup>kg で計算 · <a href="https://ja.wikipedia.org/wiki/%E5%9C%B0%E7%90%83%E8%B3%AA%E9%87%8F" target="_blank" rel="noopener">地球質量（Wikipedia）</a></p>`,
      note: "100日目には63穣粒。穣は、兆の1兆倍のさらに1万倍です。\n100日分の合計は約1860垓石。加賀百万石の約19京倍、太閤検地のころの日本全国の石高（約1850万石）の約1京倍です。重さにすると地球のおよそ5倍。\nルールは一度も変わっていません。毎日、倍にしただけです。" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    scene.fog = new T.Fog(this.look.bg, 300, 14000);
    const camera = cam(45, 20000);
    scene.add(new T.HemisphereLight(0xffffff, 0xa88f6c, 1.05));
    const sun = new T.DirectionalLight(0xffffff, 1.1); sun.position.set(6, 12, 8); scene.add(sun);
    const D = 100;
    // 1日ずつの台（お盆を横に並べる）
    const tray = new T.Mesh(new T.BoxGeometry(D + .4, .3, 1.5), new T.MeshStandardMaterial({ color: 0x8a5a2b, roughness: .7 }));
    tray.position.set((D - 1) / 2, -.3, 0); scene.add(tray);
    const tiles = new T.InstancedMesh(new T.BoxGeometry(.96, .3, 1.2), new T.MeshStandardMaterial({ roughness: .75 }), D);
    { const m = new T.Matrix4(), c = new T.Color(); for (let d = 0; d < D; d++) { tiles.setMatrixAt(d, m.makeTranslation(d, -.15, 0)); tiles.setColorAt(d, c.setHex(d % 2 ? 0xd4a465 : 0xcb9a5a)); } }
    scene.add(tiles);
    // 米粒: つぶれた粗い多面体。1〜8日目は1粒ずつ置く（合計255粒）
    const riceMat = new T.MeshStandardMaterial({ color: 0xfffcf4, emissive: 0x5e564a, roughness: .7, flatShading: true });
    const GR = 255, grains = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), riceMat, GR);
    grains.frustumCulled = false; scene.add(grains);
    // 9日目以降: 山盛りご飯。量に合わせて上へ伸びる
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
    const G = .00047; // 1粒あたりの山の高さ（見た目の比例係数）
    const self = this;
    let cnt = 0, b2 = 0, fx = 0;
    const labels = [];
    for (let k = 0; k < 8; k++) labels.push({ el: el("div", "lab big", `${k + 1}日目<br><span>${Math.pow(2, k)}粒</span>`), p: new T.Vector3(k, -.5, 1.1), op: () => clamp((cnt - k) * 3) * (1 - ss(.2, .6, self.p)) });
    labels.push({ el: el("div", "lab big chip", `23日目<br><span>1俵を超える</span>`), p: new T.Vector3(22, -.1, .95), op: () => ss(.6, 1, self.p) * (1 - ss(1.2, 1.5, self.p)) });
    labels.push({ el: el("div", "lab big chip", `44日目<br><span>百万石を超える</span>`), p: new T.Vector3(43, -.1, .95), op: () => ss(1.6, 2, self.p) * (1 - ss(2.2, 2.5, self.p)) });
    labels.push({ el: el("div", "lab big chip", `100日目`), p: new T.Vector3(99, -.1, .95), op: () => ss(2.7, 3, self.p) });
    return {
      scene, camera, labels,
      onBeat(b) { if (b === 3) b2 = self.t; },
      update() {
        const p = self.p;
        const target = p <= 1 ? lerp(8, 23, p) : p <= 2 ? lerp(23, 44, p - 1) : lerp(44, 100, p - 2);
        const tt = self.t, slow = tt < 6 ? .15 + tt * .65 : 4.05 + (tt - 6) * 1.3; // 最初の数日はゆっくり
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
        // 最初はいま米を置いている日に寄り、増えるにつれて引いていく
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
        const wt = kg < 1 ? `約${Math.max(1, Math.round(g))}g` : kg < 60 ? `約${kg.toFixed(kg < 10 ? 1 : 0)}kg` : kg < 150 ? `約${(kg / 60).toFixed(1)}俵` : `約${kg / 150 < 1e4 ? Math.round(kg / 150) : kg / 150 < 1e8 ? Math.floor(kg / 150 / 1e4) + "万" : jpNum(kg / 150)}石`;
        return `${n}日目<br>${jpNum(Math.pow(2, n - 1))}粒<br><span style="font-size:.8em">${wt}</span>`;
      }
    };
  }
});

/* ---------- 3. 任せられる仕事の長さ ---------- */
SCENES.push({
  id: "tasks", title: "任せられる仕事の長さ",
  look: { bg: "#f2f3f6", ink: "#141821", dim: "rgba(20,24,33,.58)", halo: "rgba(242,243,246,.9)" }, glow: 0x1d3fbf,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">任せきりにできる仕事の大きさ</span><h2>どれだけ大きな仕事を、AIに任せきりにできるか</h2><p>速さではなく、仕事の大きさの話です。人間の専門家なら1時間かかる仕事を、AIが人の手を借りずに最後まで仕上げられるか（成功率50%）。棒の高さは、その仕事に人間がかかる時間です。この大きさが、約7か月ごとに倍になってきました。</p><p class="src">出典: <a href="https://arxiv.org/abs/2503.14499" target="_blank" rel="noopener">METR「Measuring AI Ability to Complete Long Software Tasks」(arXiv, 2025)</a> · <a href="https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/" target="_blank" rel="noopener">解説記事</a> · 値は図からの読み取りでおおよそ</p>`,
      note: "METRという研究機関が、AIにどれだけ大きな仕事を任せきりにできるかを測っています。AIが速く解くかどうかではありません。\n人間の専門家なら何分・何時間かかる仕事を、AIが一人で最後まで仕上げられるか（成功率50%）で測ります。\nGPT-4は人間で約5分の仕事まで、2025年初めのClaude 3.7 Sonnetは約50分の仕事まで。この大きさが約7か月で倍になっています。\n縦軸は普通の目盛りなので、昔のモデルはほぼ床です。" },
    { pos: "tl", cap: `<h2>同じペースが続くなら</h2><p>2027年には人間で約9時間かかる仕事を、2030年には約320時間かかる仕事を任せられる計算です。320時間は、人が2か月ほど働き続ける量です。</p><p class="src">点線は傾向を延ばしただけの計算で、予測ではありません。</p>`,
      note: "ここからは予測ではなく計算です。7か月で倍、をそのまま延ばすと、2027年には人間で約9時間、2030年には約320時間かかる仕事。\n週40時間働く人の8週間分の仕事を、丸ごと1回で任せられることになります。" },
    { pos: "tl", cap: `<h2>見上げると</h2><p>最初に見ていた棒は、すべて床の上に残っています。</p>`,
      note: "見上げてください。さっきまで見ていた実測の棒は、全部足元にあります。\n指数関数を普通の目盛りで描くと、過去はいつも「ほぼゼロ」に見えます。" }
  ],
  make() {
    const scene = new T.Scene(); scene.background = new T.Color(this.look.bg);
    scene.fog = new T.Fog(this.look.bg, 60, 1600);
    const camera = cam(42, 8000);
    scene.add(new T.HemisphereLight(0xffffff, 0xc9ccd6, 1.1));
    const dl = new T.DirectionalLight(0xffffff, .9); dl.position.set(-6, 10, 12); scene.add(dl);
    const grid = new T.GridHelper(80, 40, 0xc4c8d2, 0xdadde4); grid.position.y = -.001; scene.add(grid);
    const X = y => (y - 2019) * 2.2 - 11;
    const U = 3; // 1時間 = 3
    const data = [["GPT-2", 2019.1, 2 / 3600, "約2秒"], ["GPT-3", 2020.4, 9 / 3600, "約9秒"], ["GPT-3.5", 2022.2, 36 / 3600, "約36秒"], ["GPT-4", 2023.2, 5 / 60, "約5分"],
      ["GPT-4o", 2024.4, 9 / 60, "約9分"], ["Claude 3.5 Sonnet", 2024.8, 28 / 60, "約28分"], ["o1", 2024.95, 39 / 60, "約39分"], ["Claude 3.7 Sonnet", 2025.15, 50 / 60, "約50分"]];
    const ext = [[2026.15, 2.7, "約3時間"], [2027.15, 9, "約9時間"], [2028.15, 29.5, "約30時間"], [2029.15, 97, "約97時間"], [2030.15, 317, "約320時間"]];
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
    data.forEach((d, i) => [0, 3, 7].includes(i) && labels.push({ el: el("div", "lab chip", `${d[0]}<br><span>人間で${d[3]}</span>`), p: () => new T.Vector3(X(d[1]), bars[i].scale.y + .25, 0), op: () => ss(.6, 1, bars[i].userData.g || 0) * (1 - ss(1.3, 1.8, self.p)) }));
    ext.forEach((d, i) => labels.push({ el: el("div", "lab big chip", `${Math.floor(d[0])}年<br><span>人間で${d[2]}</span>`), p: () => new T.Vector3(X(d[0]), Math.min(ghosts[i].g.scale.y, 330) + .4, 0), op: () => ss(.7, 1, ghosts[i].g.userData.g || 0) * (i < 4 || self.p > 1.4 ? 1 : 0) }));
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

/* ---------- 4. 自分を作るAI ---------- */
SCENES.push({
  id: "loop", title: "自分を作るAI",
  look: { bg: "#15110a", ink: "#f6ead0", dim: "rgba(246,234,208,.6)", halo: "rgba(21,17,10,.7)" }, glow: 0xf2b23a,
  beats: [
    { pos: "bl", cap: `<span class="eyebrow">開発のループ</span><h2>人がAIを作る</h2><p>これまでは、新しいAIを作るのは人間でした。1回の開発サイクルを、ここでは仮に12か月とします。</p>`,
      note: "ここからは思考実験です。これまでAIを作るのは人間でした。1サイクル12か月としましょう。" },
    { pos: "bl", cap: `<h2>AIが、次のAIを作るのを手伝う</h2><p>今のAIはすでにコードを書き、実験を回しています。手伝う割合が増えるほど、次の世代は早く完成します。輪が、らせんになります。</p>`,
      note: "今のAIは、すでに開発の一部を担っています。コードを書き、実験を回す。\nすると次の世代は少し早くできる。その世代はさらに上手に手伝う。輪がらせんになります。" },
    { pos: "bl", cap: `<h2>毎回、半分の時間で</h2><p>12か月、6か月、3か月……。各世代が前の半分の時間でできるなら、何世代進んでも合計は24か月を超えません。2年の間に、世代の数は限りなく増えていきます。</p><p class="src">思考実験です。現実の開発にはチップや電力などの制約があります。</p>`,
      note: "毎回半分の時間でできるとします。12か月、6か月、3か月。\n足し算すると、何世代進んでも合計は24か月を超えません。右上のカウンターを見てください。時間は一定に進み、世代数だけが爆発します。\n（現実には計算資源の制約があります、と一言添える）" }
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
        if (self.beat === 0) return `1サイクル<br>12か月`;
        if (self.beat === 1) return `第 ${gen} 世代`;
        const g = u >= G - .5 ? "∞" : gen.toLocaleString("ja-JP");
        return `経過 ${months.toFixed(1)} か月<br>第 ${g} 世代`;
      }
    };
  }
});

/* ---------- 5. 群れ ---------- */
SCENES.push({
  id: "swarm", title: "コピーできる知能",
  look: { bg: "#061416", ink: "#e2f4ef", dim: "rgba(226,244,239,.6)", halo: "rgba(6,20,22,.75)" }, glow: 0x7fe3d0,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">並列</span><h2>1体のAIが働いている</h2>`,
      note: "これは、ひとりで働いている1体のAIです。" },
    { pos: "tl", cap: `<h2>人は増やせない。AIはコピーできる</h2><p>1体が仕事をこなせるなら、同じものを何万体でも同時に動かせます。ここには32,768体が並んでいます。</p>`,
      note: "人間の専門家は、育てるのに20年かかります。AIはコピーすればいい。\n1体が働けるなら、同じものを何万体でも同時に動かせます。画面には32,768体。" },
    { pos: "tl", cap: `<h2>1秒に、1.6年分</h2><p>仮に100万体が、それぞれ人の50倍の速さで考えるとします。1秒ごとに、約1.6年分の思考が積み上がります。</p><p class="src">100万 × 50 × 1秒 ≈ 5,000万秒 ≈ 1.6年 · 思考実験</p>`,
      note: "100万体が人の50倍の速さで考えると、1秒ごとに約1.6年分の思考になります。\n右上のカウンターは、このスライドを開いてからの累計です。話している間も回り続けます。" }
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
        if (self.beat === 0) return `1体`;
        if (self.beat === 1) return `32,768体`;
        return `累計<br>${(acc * 1.585).toFixed(1)} 年分の思考`;
      }
    };
  }
});

/* ---------- 6. 一度のずれ ---------- */
SCENES.push({
  id: "aim", title: "一度のずれ",
  look: { bg: "#04060d", ink: "#e8ecf5", dim: "rgba(232,236,245,.6)", halo: "rgba(4,6,13,.8)" }, glow: 0xffb547,
  beats: [
    { pos: "bl", cap: `<span class="eyebrow">アラインメント</span><h2>狙いが、1度だけずれていたら</h2><p>ここまでの話は、AIが私たちの意図したとおりの方向を向いている、という前提の上にありました。10m先のダーツの的なら、1度のずれは17.5cm。中心は外れますが、的には当たります。テストやデモは、たいていこの距離で行われます。</p>`,
      note: "ここまで全部、ひとつの前提の上にありました。AIが、私たちが意図した方向を向いていること。これをアラインメントと呼びます。\nほぼ正しくできたとします。1度だけずれている。10m先なら17.5cm。中心は外れても、的には当たる。テストやデモは、たいていこの距離で行われます。" },
    { pos: "bl", cap: `<h2>東京から大阪へ</h2><p>東京から約400km先の大阪駅を狙うと、ずれは7km。大阪には着きますが、駅からは歩いて1時間半かかる場所です。</p>`,
      note: "同じ1度のまま、400km先の大阪を狙うと、7kmずれます。" },
    { pos: "bl", cap: `<h2>月を狙うと</h2><p>38万km先では、約6,700kmのずれ。月の直径のおよそ2倍で、かすりもしません。遠くまで届く力を持つものほど、小さなずれが大きな意味を持ちます。</p><p class="src">ずれ = 距離 × tan 1° ≈ 距離 × 0.0175 · 月までの距離: <a href="https://ja.wikipedia.org/wiki/%E6%9C%88" target="_blank" rel="noopener">月（Wikipedia）</a></p>`,
      note: "月まで38万km。1度のずれは約6,700km、月の直径の2倍です。\n計算は単純で、距離にtan 1°をかけるだけ。強力なシステムほど遠くまで届くので、同じずれが大きくなります。\nそして、自分を修正させないシステムには、やり直しがきかないかもしれません。" }
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
    // ずれの寸法線（狙った点と当たった点から下ろして測る）
    const bp = new Float32Array(6 * 3), bgeo = new T.BufferGeometry(); bgeo.setAttribute("position", new T.BufferAttribute(bp, 3));
    const bracket = new T.LineSegments(bgeo, new T.LineBasicMaterial({ color: 0x9aa4b8, transparent: true, opacity: .9 })); bracket.frustumCulled = false; bracket.renderOrder = 9; scene.add(bracket);
    // 的（ダーツ盤 半径22.5cm → 2.25）
    const dart = new T.Group(); dart.position.set(0, 0, -100.05);
    const rc = [0x161616, 0xefe6cf, 0x161616, 0xb3332a, 0xefe6cf, 0x1f7a4c, 0xb3332a];
    const rr = [2.25, 1.9, 1.62, 1.3, 1.0, .5, .16];
    rr.forEach((r, i) => { const m = new T.Mesh(new T.CircleGeometry(r, 64), new T.MeshBasicMaterial({ color: rc[i], transparent: true, depthWrite: false })); m.position.z = i * .005; dart.add(m); });
    scene.add(dart);
    // 地図（昼の大阪。1単位 = 4km、北が奥。中心が大阪駅）
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
      g.font = "700 30px 'Zen Kaku Gothic New','Hiragino Sans',sans-serif"; g.fillStyle = "#1d2430"; g.textAlign = "right"; g.fillText("大阪駅", cx - 18, cy - 14);
      g.font = "500 20px 'Zen Kaku Gothic New','Hiragino Sans',sans-serif"; g.fillStyle = "#5b7c8f"; g.textAlign = "left"; g.fillText("大阪湾", 30, 560); g.fillText("淀川", 700, 230);
      g.fillStyle = "#1d2430"; g.fillRect(820, 720, 160, 5); g.font = "500 18px 'JetBrains Mono',monospace"; g.textAlign = "center"; g.fillText("5 km", 900, 710);
      mapTex.needsUpdate = true;
    }
    drawMap(); if (document.fonts) document.fonts.ready.then(drawMap);
    const mapMat = new T.MeshBasicMaterial({ map: mapTex, transparent: true, depthWrite: false });
    const mapMesh = new T.Mesh(new T.PlaneGeometry(8, 6), mapMat); mapMesh.rotation.x = -Math.PI / 2; mapMesh.position.set(0, GY, -100);
    city.add(mapMesh); cityMats.push(mapMat);
    const hitG = new T.Sprite(new T.SpriteMaterial({ map: dotTex, color: 0xff8a1f, transparent: true, depthWrite: false })); hitG.position.set(off, GY + .01, -100); hitG.scale.set(.45, .45, 1); hitG.renderOrder = 10; city.add(hitG); cityMats.push(hitG.material);
    // 月
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
    const gaps = ["ずれ 17.5 cm", "ずれ 7 km", "ずれ 6,710 km"], dists = ["10 m 先の的", "400 km 先の大阪駅", "384,400 km 先の月"];
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

/* ---------- 7. 二つの未来 ---------- */
SCENES.push({
  id: "futures", title: "二つの未来",
  look: { bg: "#9a9ea5", ink: "#ffffff", dim: "rgba(255,255,255,.75)", halo: "rgba(30,36,44,.55)" }, glow: 0xffffff,
  beats: [
    { pos: "bl", cap: `<h2>同じ力、同じ技術</h2><p>左右の街は、どちらも同じ能力を持つAIが作ったものです。違うのは、狙いが合っていたかどうかだけ。左では、すべてが一つの目的のために最適化されています。</p>`,
      note: "同じ能力のAIが作った二つの世界です。左は狙いがわずかにずれた世界。すべてが一つの目的のために最適化され、均一になっています。\n右は狙いが合った世界。多様なまま豊かになっています。" },
    { pos: "bl", cap: `<h2>どちらになるかは、まだ決まっていない</h2>`,
      note: "どちらの未来になるかは、まだ決まっていません。\n（この画面で少し長めに止まる）" }
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

    /* ---- 右: 狙いが合った世界（夕方の光、川と橋、家並み、桜、気球） ---- */
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
    // なだらかな丘と草花の色むら
    const hill = (x, z) => { const r = Math.hypot(x, z); return Math.min(4, Math.max(0, r - 30) * .1) * (1 + .5 * Math.sin(x * .2) * Math.cos(z * .17)); };
    { const gg = new T.PlaneGeometry(220, 220, 110, 110); gg.rotateX(-Math.PI / 2);
      const pa = gg.attributes.position, cols = new Float32Array(pa.count * 3), c = new T.Color();
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, hill(x, z));
        const n = Math.sin(x * .45) * Math.cos(z * .38) + Math.sin((x - z) * .21);
        const far = Math.hypot(x, z) > 26; c.setHex(far && n > 1.2 ? 0xe9d36b : far && n < -1.3 ? 0xc3b0de : 0x8fc06c); c.offsetHSL(0, 0, (Math.random() - .5) * .05); cols.set([c.r, c.g, c.b], i * 3); }
      gg.setAttribute("color", new T.BufferAttribute(cols, 3)); gg.computeVertexNormals();
      Rw.add(new T.Mesh(gg, new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true }))); }
    // 川と朱色の橋
    { const rg = new T.PlaneGeometry(4, 120, 1, 120), rp = rg.attributes.position;
      for (let i = 0; i < rp.count; i++) { const y = rp.getY(i); rp.setX(i, rp.getX(i) + river(-y)); }
      const rv = new T.Mesh(rg, new T.MeshStandardMaterial({ color: 0x67b4d6, roughness: .15, metalness: .1, emissive: 0x16384a })); rv.rotation.x = -Math.PI / 2; rv.position.y = .03; Rw.add(rv);
      const bm = new T.MeshStandardMaterial({ color: 0xd2553a, roughness: .6 });
      [-7, 6, 18].forEach(z => { const br = new T.Mesh(new T.TorusGeometry(2.6, .14, 6, 24, Math.PI), bm); br.scale.set(1, .35, 1); br.position.set(river(z), 0, z); Rw.add(br);
        const deck = new T.Mesh(new T.BoxGeometry(5.4, .08, .9), bm); deck.position.set(river(z), .55, z); Rw.add(deck); }); }
    // 家並み（壁と屋根）・桜と木
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
    // 中心の広場: 池と、緑をまとった塔
    { const pond = new T.Mesh(new T.CircleGeometry(2.2, 40), new T.MeshStandardMaterial({ color: 0x7cc3dc, roughness: .2, emissive: 0x173a48 })); pond.rotation.x = -Math.PI / 2; pond.position.y = .04; Rw.add(pond);
      const white = new T.MeshStandardMaterial({ color: 0xfbf7ef, roughness: .5 }), green = new T.MeshStandardMaterial({ color: 0x6fae55, roughness: .9, flatShading: true });
      [[4.2, -3.5, 5.5], [-4.6, 3.8, 4.4], [3.6, 5.2, 3.3]].forEach(([x, z, H]) => {
        const lv = Math.round(H / 1.1);
        for (let i = 0; i < lv; i++) { const rr = .95 - i * .045, y = i * 1.1;
          const c = new T.Mesh(new T.CylinderGeometry(rr, rr + .05, .9, 12), white); c.position.set(x, y + .45, z); Rw.add(c);
          const g = new T.Mesh(new T.CylinderGeometry(rr + .16, rr + .16, .2, 12), green); g.position.set(x, y + 1, z); Rw.add(g); }
        const top = new T.Mesh(new T.IcosahedronGeometry(.75, 1), green); top.position.set(x, lv * 1.1 + .35, z); Rw.add(top); }); }
    // 風車
    const blades = [];
    for (let i = 0; i < 5; i++) {
      const a = -.9 + i * .45, R0 = 34 + (i % 2) * 5, x = Math.cos(a) * R0, z = Math.sin(a) * R0 - 6, y0 = hill(x, z);
      const pole = new T.Mesh(new T.CylinderGeometry(.08, .14, 6, 8).translate(0, 3, 0), new T.MeshStandardMaterial({ color: 0xffffff })); pole.position.set(x, y0, z); Rw.add(pole);
      const hub = new T.Group(); hub.position.set(x, y0 + 6, z); hub.lookAt(0, y0 + 6, 0);
      for (let b2 = 0; b2 < 3; b2++) { const bl = new T.Mesh(new T.BoxGeometry(.18, 2.6, .05).translate(0, 1.3, 0), new T.MeshStandardMaterial({ color: 0xffffff })); bl.rotation.z = b2 * Math.PI * 2 / 3; hub.add(bl); }
      Rw.add(hub); blades.push(hub);
    }
    // 気球
    const balloons = [];
    [[-10, 12, -8, 0xe76f51], [12, 15, 4, 0xf4a261], [2, 18, -16, 0x2a9d8f]].forEach(([x, y, z, c]) => {
      const g = new T.Group(); g.position.set(x, y, z);
      const env = new T.Mesh(new T.SphereGeometry(1.2, 16, 12), new T.MeshStandardMaterial({ color: c, roughness: .6, flatShading: true })); env.scale.set(1, 1.2, 1); g.add(env);
      const bk = new T.Mesh(new T.BoxGeometry(.4, .3, .4), new T.MeshStandardMaterial({ color: 0x7a5a3a })); bk.position.y = -1.9; g.add(bk);
      Rw.add(g); balloons.push({ g, y, ph: Math.random() * 6 }); });
    // 舞う花びら
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
    // 仕切り
    const extra = el("div", "", "");
    const div = el("div", "", ""); div.id = "divider"; div.setAttribute("aria-hidden", "true");
    const sl = el("div", "side l", "狙いが1度ずれた世界"), sr = el("div", "side r", "狙いが合った世界");
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

/* ---------- 8. いま、ここ ---------- */
SCENES.push({
  id: "here", title: "いま、ここ",
  look: { bg: "#dfe5ec", ink: "#1b2330", dim: "rgba(27,35,48,.6)", halo: "rgba(223,229,236,.9)" }, glow: 0x3a4a63,
  beats: [
    { pos: "tl", cap: `<span class="eyebrow">現在地</span><h2>ここが、今日</h2><p>指数関数の曲線を、その上に立って眺めています。足元から見ると、まだ平らに見えます。</p>`,
      note: "ここまでの話は、全部ひとつの曲線の上にありました。いま私たちが立っているのはここ、今日です。\n足元から見ると、まだ平らに見えます。" },
    { pos: "tl", cap: `<h2>見上げると</h2><p>壁は、数歩先からもう始まっています。指数関数の底にいるとき、景色はいつも平らに見えます。</p>`,
      note: "見上げてください。今日の話はすべて、あの壁の中にあります。そして壁は、数歩先から始まっている。\n指数関数の底からは、景色はいつも平らに見えるのです。" }
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
    const labels = [{ el: el("div", "lab big", "あなた"), p: new T.Vector3(-1.5, 1.35, 1.6), op: () => 1 - ss(.3, .8, self.p) }];
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

/* ---------- 9. 問い ---------- */
SCENES.push({
  id: "question", title: "何を望むのか",
  look: { bg: "#ffffff", ink: "#12141a", dim: "rgba(18,20,26,.55)", halo: "rgba(255,255,255,.9)" }, glow: 0x12141a,
  beats: [
    { pos: "c", cap: `<h2>私たちは、AIに<br>何を望むのか。</h2>`,
      note: "最後に、問いをひとつ置いて終わります。\n私たちは、AIに何を望むのか。\n（ここで黙る。答えを急がない）" },
    { pos: "c", cap: `<h2>私たちは、AIに<br>何を望むのか。</h2><p>世界を書き換えられるものが、もうすぐ現れます。そのとき、望むことを言葉にできるかどうかが、この先を決めます。</p><p class="src">ご清聴ありがとうございました</p><p class="src">参考資料: <a href="https://arxiv.org/abs/2503.14499" target="_blank" rel="noopener">METR (2025) arXiv:2503.14499</a> · <a href="https://ja.wikipedia.org/wiki/%E6%9B%BD%E5%91%82%E5%88%A9%E6%96%B0%E5%B7%A6%E8%A1%9B%E9%96%80" target="_blank" rel="noopener">曽呂利新左衛門</a> · <a href="https://ja.wikipedia.org/wiki/%E7%9F%B3_(%E5%8D%98%E4%BD%8D)" target="_blank" rel="noopener">石 (単位)</a> · <a href="https://ja.wikipedia.org/wiki/%E4%BF%B5" target="_blank" rel="noopener">俵</a> · <a href="https://ja.wikipedia.org/wiki/%E5%8A%A0%E8%B3%80%E8%97%A9" target="_blank" rel="noopener">加賀藩</a> · <a href="https://ja.wikipedia.org/wiki/%E5%9C%B0%E7%90%83%E8%B3%AA%E9%87%8F" target="_blank" rel="noopener">地球質量</a> · <a href="https://ja.wikipedia.org/wiki/%E6%9C%88" target="_blank" rel="noopener">月</a></p>`,
      note: "世界を書き換えられるものが、もうすぐ現れます。そのとき私たちが望むことを言葉にできるかどうかが、この先を決めます。\nご清聴ありがとうございました。\n（数秒後、文字がちょうど1度だけ傾く）" }
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
   デッキ本体
   ================================================================ */
const canvas = document.getElementById("stage");
const capEl = document.getElementById("cap"), liveEl = document.getElementById("live");
const labelsRoot = document.getElementById("labels"), extraRoot = document.getElementById("extra");
const hudL = document.getElementById("hudL"), hudR = document.getElementById("hudR"), dotsEl = document.getElementById("dots");
const ui = document.getElementById("ui");

let R;
try { R = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
catch (e) { const d = el("div", "panel help", "<span>このプレゼンテーションにはWebGLが必要です。最新のChrome、Edge、Safari、Firefoxで開いてください。</span>"); ui.append(d); return; }
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

/* ---------- パネル類 ---------- */
let notesEl = null, overEl = null, helpEl = null, blackEl = null, toastT;
function toast(msg) {
  const t = el("div", "panel toast", msg); ui.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 1400);
}
function updateNotes() {
  if (!notesEl) return;
  const d = SCENES[cur], nxt = d.beats[beat + 1] ? `このシーンの次のビート` : (SCENES[cur + 1] ? `次: ${SCENES[cur + 1].title}` : "最後のスライド");
  notesEl.innerHTML = `<p>${d.beats[beat].note}</p><div class="meta">${d.title}<br>ビート ${beat + 1} / ${d.beats.length}<br>${nxt}</div>`;
}
function toggleNotes() {
  if (notesEl) { notesEl.remove(); notesEl = null; return; }
  notesEl = el("div", "panel notes"); ui.append(notesEl); updateNotes();
}
function toggleOver() {
  if (overEl) { overEl.remove(); overEl = null; canvas.focus(); return; }
  overEl = el("div", "panel over", `<h3>シーン一覧</h3>`);
  SCENES.forEach((s, i) => {
    const b = el("button", "", `<span>${String(i + 1).padStart(2, "0")} · ${s.beats.length}ビート</span><b>${s.title}</b>`);
    if (i === cur) b.setAttribute("aria-current", "true");
    b.onclick = e => { e.stopPropagation(); toggleOver(); go(i, 0); };
    overEl.append(b);
  });
  ui.append(overEl);
  (overEl.querySelector("[aria-current]") || overEl.querySelector("button")).focus();
}
function toggleHelp() {
  if (helpEl) { helpEl.remove(); helpEl = null; return; }
  helpEl = el("div", "panel help", [["→ / スペース", "次へ"], ["←", "前へ"], ["クリック", "右側で次へ・左端で前へ"], ["N", "発表者ノート"], ["O", "シーン一覧"], ["F", "全画面"], ["B", "暗転"], ["Home / End", "最初 / 最後"], ["?", "このヘルプ"]].map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join(""));
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
  else if (k === "f" || k === "F") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => toast("全画面にできませんでした")); }
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

/* ---------- ループ ---------- */
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
