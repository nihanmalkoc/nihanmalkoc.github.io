// =========================================================
// Nihan Malkoç, Portfolyo etkileşimleri
// =========================================================

// ---- Yıl ----
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Menü ----
const toggle = document.querySelector(".nav-toggle");
const overlay = document.querySelector(".menu-overlay");
if (toggle && overlay) {
  const setMenu = (open) => {
    overlay.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () =>
    setMenu(!overlay.classList.contains("open"))
  );
  overlay.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
}

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window && revealEls.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));
}

// ---- Ortak: noktalı ızgara ----
const GRID_GAP = 18, GRID_SIZE = 1.4, GRID_INK = "10,10,10";
function buildDots(w, h) {
  const cols = Math.floor(w / GRID_GAP);
  const rows = Math.floor(h / GRID_GAP);
  const offX = (w - (cols - 1) * GRID_GAP) / 2;
  const offY = (h - (rows - 1) * GRID_GAP) / 2;
  const dots = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++)
      dots.push([offX + i * GRID_GAP, offY + j * GRID_GAP]);
  return dots;
}
function drawDots(ctx, dots, alpha) {
  ctx.fillStyle = `rgba(${GRID_INK},${alpha})`;
  for (const [x, y] of dots)
    ctx.fillRect(x - GRID_SIZE / 2, y - GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
}

// =========================================================
// Masters, dönem modülü piksel illüstrasyonları (statik)
// =========================================================
(() => {
  const canvases = document.querySelectorAll(".term-pix");
  if (!canvases.length) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  const arc = (cx, cy, r, a0, a1, st) => {
    const p = []; for (let a = a0; a <= a1; a += st) p.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]); return p;
  };

  const shapes = {
    // ACESD, kabuk/tonoz + kolonlar + güneş ışınları
    structural() {
      const s = [];
      s.push(arc(0, 0.2, 0.62, 0, Math.PI, 0.1));
      s.push([[-0.62, 0.2], [-0.62, 0.6]]);
      s.push([[0.62, 0.2], [0.62, 0.6]]);
      s.push([[-0.3, 0.04], [-0.3, 0.6]]);
      s.push([[0.3, 0.04], [0.3, 0.6]]);
      s.push([[-0.62, 0.6], [0.62, 0.6]]);
      for (const x of [-0.45, -0.15, 0.15, 0.45]) s.push([[x, -0.72], [x, -0.5]]);
      return s;
    },
    // BIM, katmanlı bina + grid
    bim() {
      const s = [];
      for (let k = 0; k < 4; k++) { const y = -0.55 + k * 0.34; s.push(rect(-0.58, y, 1.16, 0.24)); }
      for (const x of [-0.2, 0.18]) s.push([[x, -0.55], [x, 0.51]]);
      return s;
    },
    // AIA, sinir ağı
    neural() {
      const s = [];
      const cols = [-0.58, 0, 0.58];
      const ys = [[-0.42, 0, 0.42], [-0.55, -0.18, 0.18, 0.55], [-0.26, 0.26]];
      for (let c = 0; c < cols.length - 1; c++)
        for (const y1 of ys[c]) for (const y2 of ys[c + 1]) s.push([[cols[c], y1], [cols[c + 1], y2]]);
      for (let c = 0; c < cols.length; c++)
        for (const y of ys[c]) { const q = 0.06; s.push(rect(cols[c] - q, y - q, 2 * q, 2 * q)); }
      return s;
    },
  };

  function sample(strokes, n) {
    const segs = []; let total = 0;
    for (const st of strokes)
      for (let i = 0; i < st.length - 1; i++) {
        const a = st[i], b = st[i + 1];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len > 0) { segs.push({ a, b, len }); total += len; }
      }
    const pts = [];
    for (let k = 0; k < n; k++) {
      const d = (k / n) * total;
      let acc = 0, seg = segs[segs.length - 1], t = 0;
      for (const sg of segs) { if (acc + sg.len >= d) { seg = sg; t = (d - acc) / sg.len; break; } acc += sg.len; }
      pts.push([seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t]);
    }
    return pts;
  }

  function draw(cv) {
    const gen = shapes[cv.dataset.shape] || shapes.neural;
    const pts = sample(gen(), 280);
    const w = cv.clientWidth || 220, h = cv.clientHeight || w;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2;
    pts.forEach((p, i) => {
      ctx.fillStyle = i % 6 === 0 ? "rgba(255,212,0,1)" : "rgba(15,15,15,.9)";
      const sz = 2.6;
      ctx.fillRect(cx + p[0] * scale - sz / 2, cy + p[1] * scale - sz / 2, sz, sz);
    });
  }

  const render = () => canvases.forEach(draw);
  render();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 150); });
})();

// =========================================================
// Proje galerileri, sürükle-kaydır + tam ekran lightbox
// =========================================================
(() => {
  const galleries = document.querySelectorAll(".work-images, .feat-grid, .flow, .img-row, .wide-img, .collage-wrap, .side-by-side");
  if (!galleries.length) return;

  // Lightbox katmanı
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML =
    '<button class="lb-close" aria-label="Close">×</button>' +
    '<button class="lb-prev" aria-label="Previous">‹</button>' +
    '<img class="lb-img" alt="" />' +
    '<button class="lb-next" aria-label="Next">›</button>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector(".lb-img");
  let group = [], idx = 0;

  const show = () => { lbImg.src = group[idx].src; lbImg.alt = group[idx].alt || ""; };
  const open = (imgs, i) => {
    group = imgs; idx = i; show();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
  const step = (d) => { idx = (idx + d + group.length) % group.length; show(); };

  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
  lb.querySelector(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); step(1); });
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target === lbImg) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });

  // Her galeri: görsele tıkla → lightbox aç (o proje içinde gezinir)
  galleries.forEach((g) => {
    const imgs = Array.from(g.querySelectorAll("img"));
    imgs.forEach((im, i) => im.addEventListener("click", () => open(imgs, i)));
  });
})();

// =========================================================
// Ana sayfa piksel ızgarası, STATİK
// =========================================================
(() => {
  const canvas = document.getElementById("pixel-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function draw() {
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawDots(ctx, buildDots(w, h), 0.15);
  }
  draw();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
})();

// =========================================================
// Profil fotoğrafı, SİYAH-BEYAZ + yan yankılar
// =========================================================
(() => {
  const canvas = document.querySelector(".photo-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = window.PHOTO_SRC || "photo.jpg";

  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  img.onload = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    const sc = document.createElement("canvas");
    sc.width = w; sc.height = h;
    const sctx = sc.getContext("2d");
    sctx.drawImage(img, 0, 0);
    let sp;
    try { sp = sctx.getImageData(0, 0, w, h).data; }
    catch (e) {
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0);
      canvas.style.filter = "grayscale(1) contrast(1.1)";
      return;
    }
    function layer(tint) {
      const out = new ImageData(w, h);
      const op = out.data;
      for (let i = 0; i < sp.length; i += 4) {
        const lum = (0.299 * sp[i] + 0.587 * sp[i + 1] + 0.114 * sp[i + 2]) / 255;
        const a = 1 - smooth(0.82, 0.99, lum);
        if (tint) { op[i] = tint[0]; op[i + 1] = tint[1]; op[i + 2] = tint[2]; }
        else { const g = clamp01((lum - 0.5) * 1.18 + 0.5) * 255; op[i] = op[i + 1] = op[i + 2] = g; }
        op[i + 3] = a * 255;
      }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").putImageData(out, 0, 0);
      return c;
    }
    const gray = layer(null), yellow = layer([230, 191, 0]), black = layer([12, 12, 12]);
    const pad = 20;
    canvas.width = w + pad * 2; canvas.height = h + pad * 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.3;  ctx.drawImage(black,  pad + 16, pad + 4);
    ctx.globalAlpha = 0.5;  ctx.drawImage(yellow, pad - 16, pad + 4);
    ctx.globalAlpha = 1;    ctx.drawImage(gray,   pad,      pad);
  };
})();

// =========================================================
// AÇILIŞ: pikseller yaratıcı mimari çizimlere dönüşür
//   (yazılı etiket yok, anlam grafiğin kendisinde)
//   Ankara silüeti → plan → teknik çizim → 3D model
//   → parametrik yüzey → grasshopper → AI ağı
// =========================================================
(() => {
  const canvas = document.getElementById("intro-reveal");
  if (!canvas) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finishNow = () => { document.body.style.overflow = ""; canvas.remove(); };
  if (reduce) { finishNow(); return; }

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, dots = [];
  function size() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = buildDots(W, H);
  }
  size();
  document.body.style.overflow = "hidden";

  const N = 860;
  const YELLOW = "255,212,0", INK = "15,15,15";

  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  const arc = (cx, cy, r, a0, a1, st) => {
    const p = []; for (let a = a0; a <= a1; a += st) p.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]); return p;
  };

  // 1) Dubai silüeti, Burj Khalifa · Burj Al Arab · kule kümesi
  function dubai() {
    const s = [], g = 0.55;
    s.push([[-0.98, g], [0.98, g]]);                              // zemin
    const win = (x, w, h) => { for (let k = 1; k < 3; k++) { const y = g - h * k / 3; s.push([[x - w / 2, y], [x + w / 2, y]]); } };

    // sol kule kümesi
    [[-0.86, 0.12, 0.4], [-0.73, 0.1, 0.6], [-0.61, 0.12, 0.34], [-0.49, 0.09, 0.5]]
      .forEach(([x, w, h]) => { s.push(rect(x - w / 2, g - h, w, h)); win(x, w, h); });

    // Burj Khalifa (merkez-sol), kademeli sivrilen kule
    const bx = -0.18;
    const prof = [[0.15, g], [0.15, 0.18], [0.115, 0.18], [0.115, -0.06], [0.085, -0.06],
                  [0.085, -0.3], [0.058, -0.3], [0.058, -0.5], [0.032, -0.5], [0.02, -0.66]];
    const out = [];
    prof.forEach(([dx, y]) => out.push([bx - dx, y]));
    out.push([bx, -0.86]);                                        // sivri uç
    [...prof].reverse().forEach(([dx, y]) => out.push([bx + dx, y]));
    s.push(out);
    s.push([[bx, -0.66], [bx, g]]);                               // dikey cephe hatları
    s.push([[bx - 0.05, -0.5], [bx - 0.05, g]]);
    s.push([[bx + 0.05, -0.5], [bx + 0.05, g]]);
    for (const y of [0.18, -0.06, -0.3, -0.5]) s.push([[bx - 0.09, y], [bx + 0.09, y]]);

    // orta dolgu kuleleri
    [[0.16, 0.11, 0.66], [0.3, 0.1, 0.44]]
      .forEach(([x, w, h]) => { s.push(rect(x - w / 2, g - h, w, h)); win(x, w, h); });

    // Burj Al Arab (sağ), yelken
    const sx = 0.64, sTop = -0.4;
    s.push([[sx - 0.14, g], [sx - 0.14, sTop]]);                  // ön direk
    s.push([[sx - 0.14, sTop], [sx - 0.14, sTop - 0.06]]);        // anten
    const sail = [];
    for (let t = 0; t <= 1.0001; t += 0.08) {
      const y = sTop + (g - sTop) * t;
      sail.push([(sx - 0.14) + t * 0.18 + Math.sin(Math.PI * t) * 0.17, y]);
    }
    s.push(sail);
    s.push([[sx - 0.14, g], [sail[sail.length - 1][0], g]]);      // taban

    // en sağ kule
    s.push(rect(0.85, g - 0.5, 0.1, 0.5)); win(0.9, 0.1, 0.5);
    return s;
  }

  const ell = (cx, cy, rx, ry, st) => {
    const p = []; for (let a = 0; a <= Math.PI * 2 + 0.001; a += st) p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); return p;
  };

  // 2) Detaylı kat planı (construction documentation)
  function plan() {
    const s = [];
    s.push(rect(-0.82, -0.56, 1.64, 1.12));                       // dış duvar (çift)
    s.push(rect(-0.76, -0.5, 1.52, 1.0));
    s.push([[-0.1, -0.5], [-0.1, 0.5]]);                          // iç duvarlar
    s.push([[-0.1, 0.06], [0.76, 0.06]]);
    s.push([[-0.76, 0.0], [-0.42, 0.0]]);
    s.push([[0.36, -0.5], [0.36, 0.06]]);
    s.push(arc(-0.42, 0.0, 0.22, 0, Math.PI / 2, 0.16));          // kapı yayları
    s.push(arc(-0.1, -0.22, 0.2, Math.PI / 2, Math.PI, 0.16));
    s.push(arc(0.36, 0.06, 0.2, Math.PI, 1.5 * Math.PI, 0.16));
    for (let k = 0; k < 7; k++) { const y = -0.44 + k * 0.07; s.push([[0.46, y], [0.72, y]]); } // merdiven
    s.push([[0.46, -0.44], [0.46, -0.44 + 6 * 0.07]]);
    s.push(rect(-0.68, 0.16, 0.22, 0.28));                        // mobilya
    return s;
  }

  // 3) Bina kesiti, döşemeler, merdiven, zemin taraması (teknik çizim)
  function section() {
    const s = [], g = 0.5;
    s.push([[-0.85, g], [0.85, g]]);                              // zemin
    for (let x = -0.8; x <= 0.82; x += 0.11) s.push([[x, g], [x - 0.06, g + 0.09]]); // tarama
    s.push([[-0.6, g], [-0.6, -0.5], [0.1, -0.5], [0.1, -0.72], [0.56, -0.72], [0.56, g]]); // dış hat
    s.push([[-0.6, -0.05], [0.56, -0.05]]);                       // döşemeler
    s.push([[-0.6, -0.5], [0.56, -0.5]]);
    s.push([[0.1, -0.28], [0.56, -0.28]]);
    let zx = -0.5, zy = g; const zz = [[zx, zy]];                 // merdiven zigzag
    for (let k = 0; k < 5; k++) { zx += 0.09; zz.push([zx, zy]); zy -= 0.09; zz.push([zx, zy]); }
    s.push(zz);
    s.push([[0.72, -0.72], [0.72, g]]);                           // ölçü çizgisi
    s.push([[0.68, -0.72], [0.76, -0.72]]);
    s.push([[0.68, g], [0.76, g]]);
    return s;
  }

  // 4) Burgulu kule, dönerek yükselen kareler (parametrik / 3D)
  function twist() {
    const s = [], levels = 11, botY = 0.62, topY = -0.62;
    let prev = null;
    for (let k = 0; k <= levels; k++) {
      const f = k / levels;
      const y = botY + (topY - botY) * f;
      const ang = f * Math.PI * 0.62;
      const sc = 0.33 * (1 - 0.18 * f);
      const c = Math.cos(ang), sn = Math.sin(ang);
      const cor = [[-sc, -sc], [sc, -sc], [sc, sc], [-sc, sc]].map(([x, z]) => {
        const rx = x * c - z * sn;
        const ry = (x * sn + z * c) * 0.34;
        return [rx, y + ry];
      });
      s.push([...cor, cor[0]]);
      if (prev) for (let j = 0; j < 4; j++) s.push([prev[j], cor[j]]);
      prev = cor;
    }
    return s;
  }

  // 5) Tel-kafes küre, boylam/enlem (3D modelling)
  function sphere3d() {
    const s = [], R = 0.62;
    s.push(arc(0, 0, R, 0, Math.PI * 2 + 0.001, 0.13));
    for (const rx of [0.4, 0.17]) s.push(ell(0, 0, rx, R, 0.14));         // boylamlar
    for (const off of [-0.34, 0, 0.34]) {                                 // enlemler
      const rx = Math.sqrt(Math.max(0, R * R - off * off));
      s.push(ell(0, off, rx, rx * 0.3, 0.16));
    }
    return s;
  }

  // 6) Yoğun Grasshopper node ağı (dirsekli teller)
  function grasshopper() {
    const s = [];
    const nodes = [[-0.76, -0.4], [-0.76, 0.32], [-0.16, -0.06], [-0.16, 0.46], [0.36, -0.36], [0.36, 0.24], [0.8, -0.02]];
    const nw = 0.2, nh = 0.13;
    nodes.forEach(([x, y]) => s.push(rect(x - nw / 2, y - nh / 2, nw, nh)));
    const wires = [[0, 2], [1, 2], [1, 3], [2, 4], [2, 5], [3, 5], [4, 6], [5, 6]];
    wires.forEach(([a, b]) => {
      const p = nodes[a], q = nodes[b], mx = (p[0] + q[0]) / 2;
      s.push([[p[0] + nw / 2, p[1]], [mx, p[1]], [mx, q[1]], [q[0] - nw / 2, q[1]]]);
    });
    return s;
  }

  // 7) Sinir ağı (AI / data-driven)
  function neural() {
    const s = [];
    const cols = [-0.62, 0.0, 0.62];
    const ys = [[-0.4, 0, 0.4], [-0.55, -0.18, 0.18, 0.55], [-0.28, 0.28]];
    for (let c = 0; c < cols.length - 1; c++)
      for (const y1 of ys[c]) for (const y2 of ys[c + 1]) s.push([[cols[c], y1], [cols[c + 1], y2]]);
    for (let c = 0; c < cols.length; c++)
      for (const y of ys[c]) { const q = 0.055; s.push(rect(cols[c] - q, y - q, 2 * q, 2 * q)); }
    return s;
  }

  function sample(strokes, n) {
    const segs = []; let total = 0;
    for (const st of strokes)
      for (let i = 0; i < st.length - 1; i++) {
        const a = st[i], b = st[i + 1];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len > 0) { segs.push({ a, b, len }); total += len; }
      }
    const pts = [];
    for (let k = 0; k < n; k++) {
      const d = (k / n) * total;
      let acc = 0, seg = segs[segs.length - 1], t = 0;
      for (const sg of segs) { if (acc + sg.len >= d) { seg = sg; t = (d - acc) / sg.len; break; } acc += sg.len; }
      pts.push([seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t]);
    }
    return pts;
  }

  const GENS = [dubai, twist, neural];
  const M = GENS.length;
  const shapes = GENS.map((g) => sample(g(), N));

  const P = [], startRand = [], endRand = [];
  for (let i = 0; i < N; i++) {
    P.push({ seed: Math.random() * Math.PI * 2, size: 2.4 + Math.random() * 1.4, yellow: i % 6 === 0 });
    startRand.push([(Math.random() * 2 - 1) * 1.4, (Math.random() * 2 - 1) * 1.1]);
    endRand.push([(Math.random() * 2 - 1) * 1.4, (Math.random() * 2 - 1) * 1.1]);
  }

  // Toplam süre sabit (TOTAL); şekil sayısı değişse de aynı kalır
  const ASSEMBLE = 0.45, DISPERSE = 0.42, TOTAL = 3.5, MORPH_RATIO = 0.85;
  const anim = TOTAL - ASSEMBLE - DISPERSE;
  const HOLD = anim / (M + (M - 1) * MORPH_RATIO);
  const MORPH = HOLD * MORPH_RATIO;
  const KF = [{ t: 0, s: -1 }];
  let tt = ASSEMBLE; KF.push({ t: tt, s: 0 });
  for (let k = 0; k < M; k++) {
    tt += HOLD; KF.push({ t: tt, s: k });
    if (k < M - 1) { tt += MORPH; KF.push({ t: tt, s: k + 1 }); }
  }
  tt += DISPERSE; KF.push({ t: tt, s: -2 });
  const DUR = tt;

  const posOf = (s, i) => (s >= 0 ? shapes[s][i] : s === -1 ? startRand[i] : endRand[i]);
  const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

  function interp(t, i) {
    for (let k = 0; k < KF.length - 1; k++) {
      const a = KF[k], b = KF[k + 1];
      if (t >= a.t && t <= b.t) {
        const u = ease((t - a.t) / (b.t - a.t));
        const pa = posOf(a.s, i), pb = posOf(b.s, i);
        return [pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u];
      }
    }
    const last = KF[KF.length - 1];
    return posOf(last.s, i);
  }

  let start = null;
  function frame(now) {
    if (start === null) start = now;
    const t = (now - start) / 1000;

    ctx.clearRect(0, 0, W, H);
    drawDots(ctx, dots, 0.14);

    const scale = Math.min(W, H) * 0.34;
    const cx = W / 2, cy = H / 2;
    const ga = t < DUR - DISPERSE ? 1 : Math.max(0, 1 - (t - (DUR - DISPERSE)) / DISPERSE);

    for (let i = 0; i < N; i++) {
      const p = P[i];
      const [nx, ny] = interp(t, i);
      const wob = 0.012;
      const dx = Math.sin(t * 3.0 + p.seed) * wob;
      const dy = Math.cos(t * 2.3 + p.seed * 1.3) * wob;
      const sx = cx + (nx + dx) * scale * 1.18;
      const sy = cy + (ny + dy) * scale;
      ctx.fillStyle = p.yellow ? `rgba(${YELLOW},${ga})` : `rgba(${INK},${ga})`;
      ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }

    if (t < DUR) requestAnimationFrame(frame);
    else { canvas.classList.add("done"); setTimeout(finishNow, 600); }
  }

  window.addEventListener("resize", size);
  requestAnimationFrame(frame);
})();
