/* Motor 3D em SVG: câmera, malhas, sombreamento e arestas (visíveis e ocultas).
   Mundo: x para a direita, y para cima, z para quem olha. Projeção ortogonal. */
(function () {
  'use strict';
  const GE = window.GE;
  const G = (GE.g3 = {});

  /* ---------- Vetores ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  Object.assign(G, { add, sub, mul, dot, cross, len, norm, lerp3 });
  const rad = (d) => d * Math.PI / 180;
  G.rad = rad;

  /* Rotação de um ponto em torno de um eixo (fórmula de Rodrigues). */
  G.rotAxis = function (p, o, axis, ang) {
    const k = norm(axis);
    const v = sub(p, o);
    const c = Math.cos(ang), s = Math.sin(ang);
    const r = add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
    return add(o, r);
  };

  /* ---------- Câmera ---------- */
  G.cam = function (o) {
    const yaw = rad(o.yaw), pitch = rad(o.pitch);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const s = o.s, X0 = o.cx, Y0 = o.cy;
    const c = o.center || [0, 0, 0];
    const cam = {
      yaw: o.yaw, pitch: o.pitch, s, cx: X0, cy: Y0,
      view(p) {
        const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      },
      dir(v) {
        const x1 = v[0] * cy + v[2] * sy;
        const z1 = -v[0] * sy + v[2] * cy;
        return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp];
      },
      p(p) { const v = cam.view(p); return [X0 + s * v[0], Y0 - s * v[1], v[2]]; },
    };
    return cam;
  };
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  G.f1 = f1;
  G.path = function (cam, pts, close) {
    return pts.map((p, i) => { const q = cam.p(p); return (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1]); }).join('') + (close ? 'Z' : '');
  };

  /* ---------- Cores ---------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, k) {
    const c = hex2rgb(hex);
    const f = (v) => Math.max(0, Math.min(255, Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1))));
    return 'rgb(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ')';
  }
  G.shade = shade;
  G.mix = function (h1, h2, t) {
    const a = hex2rgb(h1), b = hex2rgb(h2);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  const LIGHT = norm([-0.35, 0.8, 0.5]);

  /* ---------- Malhas ---------- */
  /* mesh = { V: [[x,y,z]], F: [{ v: [índices], part }], convex } */
  function faceNormal(V, f) {
    // Método de Newell (serve para qualquer polígono plano)
    let nx = 0, ny = 0, nz = 0;
    const n = f.v.length;
    for (let i = 0; i < n; i++) {
      const a = V[f.v[i]], b = V[f.v[(i + 1) % n]];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
      nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return norm([nx, ny, nz]);
  }
  function centroid(V, idx) {
    const c = [0, 0, 0];
    idx.forEach((i) => { c[0] += V[i][0]; c[1] += V[i][1]; c[2] += V[i][2]; });
    return mul(c, 1 / idx.length);
  }
  G.centroid = (pts) => mul(pts.reduce((a, p) => add(a, p), [0, 0, 0]), 1 / pts.length);

  /* Prepara normais (para fora) e arestas. */
  G.prep = function (m) {
    const V = m.V;
    const C = m.center || centroid(V, V.map((_, i) => i));
    m.N = m.F.map((f) => {
      let n = faceNormal(V, f);
      if (m.convex !== false) {
        const fc = centroid(V, f.v);
        if (dot(n, sub(fc, C)) < 0) n = mul(n, -1);
      } else if (f.out) {
        if (dot(n, f.out) < 0) n = mul(n, -1);
      }
      return n;
    });
    const map = new Map();
    m.F.forEach((f, fi) => {
      const n = f.v.length;
      for (let i = 0; i < n; i++) {
        const a = f.v[i], b = f.v[(i + 1) % n];
        const k = a < b ? a + '-' + b : b + '-' + a;
        let e = map.get(k);
        if (!e) { e = { a: Math.min(a, b), b: Math.max(a, b), f: [] }; map.set(k, e); }
        e.f.push(fi);
      }
    });
    const cosT = Math.cos(rad(m.featureAngle || 24));
    m.E = Array.from(map.values()).map((e) => {
      let feat = e.f.length === 1;
      if (e.f.length >= 2) {
        const fa = m.F[e.f[0]], fb = m.F[e.f[1]];
        feat = dot(m.N[e.f[0]], m.N[e.f[1]]) < cosT || (fa.part !== fb.part && !(fa.smooth && fb.smooth && fa.part === fb.part));
        if (fa.noEdge && fb.noEdge) feat = false;
      }
      e.feat = feat;
      return e;
    });
    // arestas marcantes de cada face (para desenhar junto com a face)
    m.FE = m.F.map(() => []);
    m.E.forEach((e) => { if (e.feat) e.f.forEach((fi) => m.FE[fi].push(e)); });
    return m;
  };

  /* Prisma: base (polígono no plano xz, y = 0) e topo em y = h, deslocado por sh = [dx, dz]. */
  G.prism = function (base, h, sh, opts) {
    opts = opts || {};
    sh = sh || [0, 0];
    const n = base.length;
    const V = [];
    base.forEach((p) => V.push([p[0], 0, p[1]]));
    base.forEach((p) => V.push([p[0] + sh[0], h, p[1] + sh[1]]));
    const F = [];
    F.push({ v: base.map((_, i) => i).reverse(), part: 'base' });
    F.push({ v: base.map((_, i) => n + i), part: 'top' });
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      F.push({ v: [i, j, n + j, n + i], part: 'lat', k: i, smooth: !!opts.smooth });
    }
    const m = { V, F, convex: true, center: [sh[0] / 2, h / 2, sh[1] / 2], n, featureAngle: opts.featureAngle };
    return G.prep(m);
  };
  G.circlePts = function (r, n, a0) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (a0 || 0) + (i / n) * Math.PI * 2;
      out.push([r * Math.cos(a), -r * Math.sin(a)]);
    }
    return out;
  };
  G.regular = function (n, R, a0) { return G.circlePts(R, n, a0 == null ? 0 : a0); };
  G.cylinder = function (r, h, sh, n) {
    return G.prism(G.circlePts(r, n || 72), h, sh, { smooth: true });
  };

  /* Sólido de revolução: gira o perfil [[r, y], ...] (fechado) em torno do eixo y, de 0 até ang. */
  G.revolve = function (profile, ang, n, a0) {
    n = Math.max(2, n || 48);
    a0 = a0 || 0;
    // perfil no sentido anti-horário (normais para fora)
    let area2 = 0;
    profile.forEach((p, i) => { const q = profile[(i + 1) % profile.length]; area2 += p[0] * q[1] - q[0] * p[1]; });
    if (area2 < 0) profile = profile.slice().reverse();
    const full = ang >= Math.PI * 2 - 1e-6;
    const segs = Math.max(1, Math.ceil(n * ang / (Math.PI * 2)));
    const rings = full ? segs : segs + 1;
    const V = [];
    const P = profile.length;
    for (let k = 0; k < rings; k++) {
      const a = a0 + (ang * k) / segs;
      const c = Math.cos(a), s = Math.sin(a);
      profile.forEach((q) => V.push([q[0] * c, q[1], -q[0] * s]));
    }
    const F = [];
    for (let k = 0; k < segs; k++) {
      const k2 = full ? (k + 1) % segs : k + 1;
      const am = a0 + (ang * (k + 0.5)) / segs;
      for (let i = 0; i < P; i++) {
        const j = (i + 1) % P;
        const pa = profile[i], pb = profile[j];
        if (pa[0] < 1e-9 && pb[0] < 1e-9) continue; // segmento sobre o eixo
        // pontos sobre o eixo são o mesmo vértice em todos os anéis
        const at = (kk, ii) => (profile[ii][0] < 1e-9 ? ii : kk * P + ii);
        const idx = [at(k, i), at(k, j), at(k2, j), at(k2, i)];
        // tira vértices repetidos (no eixo)
        const uniq = [];
        idx.forEach((v) => { if (!uniq.some((u) => len(sub(V[u], V[v])) < 1e-9)) uniq.push(v); });
        if (uniq.length < 3) continue;
        // normal para fora: perpendicular ao segmento do perfil, no sentido de r crescente
        const dr = pb[0] - pa[0], dy = pb[1] - pa[1];
        let nr = dy, ny = -dr; // normal do segmento no plano (r, y)
        const mid = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
        // perfil fechado no sentido anti-horário no plano (r, y): normal (dy, -dr) aponta para fora
        const out = [nr * Math.cos(am), ny, -nr * Math.sin(am)];
        F.push({ v: uniq, part: 'rv', seg: i, out, smooth: true, mid });
      }
    }
    return G.prep({ V, F, convex: false, featureAngle: 30 });
  };

  /* Aplica uma função a todos os vértices (girar, deitar, deslocar) e refaz as normais. */
  G.xform = function (m, fn) {
    const out = { V: m.V.map(fn), F: m.F.map((f) => Object.assign({}, f, f.out ? { out: fnDir(fn, f.out) } : {})), convex: m.convex, n: m.n, featureAngle: m.featureAngle };
    if (m.center) out.center = fn(m.center);
    return G.prep(out);
  };
  function fnDir(fn, d) { return sub(fn(d), fn([0, 0, 0])); }

  /* ---------- Desenho ----------
     o: { colors: { part: '#hex' } | fn(face) , alpha, side: 'front'|'back'|'both', hidden, edgeCls, faceCls, edges: true }
     Devolve { faces, edges, hiddenEdges } (strings SVG), para quem chama escolher a ordem. */
  G.render = function (m, cam, o) {
    o = o || {};
    const V = m.V;
    const P = V.map((p) => cam.p(p));
    const NV = m.N.map((n) => cam.dir(n));
    const side = o.side || 'front';
    const colorOf = typeof o.colors === 'function' ? o.colors : (f) => (o.colors && (o.colors[f.part] || o.colors['*'])) || '#f2a15f';
    const alphaOf = typeof o.alpha === 'function' ? o.alpha : () => (o.alpha == null ? 1 : o.alpha);
    const list = [];
    m.F.forEach((f, i) => {
      const front = NV[i][2] > 1e-6;
      if (side === 'front' && !front) return;
      if (side === 'back' && front) return;
      const col = colorOf(f, i);
      if (!col) return;
      let d = 0;
      f.v.forEach((v) => { d += P[v][2]; });
      list.push({ i, f, d: d / f.v.length, front, col });
    });
    list.sort((a, b) => a.d - b.d);
    let faces = '';
    list.forEach((it) => {
      const n = NV[it.i];
      const lam = o.twoSided ? Math.abs(dot(n, LIGHT)) : Math.max(0, (it.front ? 1 : -1) * dot(n, LIGHT));
      const k = (o.twoSided || it.front ? 0.66 : 0.5) + 0.42 * lam;
      const fill = shade(it.col, k);
      const a = alphaOf(it.f, it.i);
      if (a <= 0.001) return;
      const d = it.f.v.map((v, j) => (j ? 'L' : 'M') + f1(P[v][0]) + ' ' + f1(P[v][1])).join('') + 'Z';
      const seam = a >= 0.999 ? ' stroke="' + fill + '" stroke-width="0.7"' : '';
      const fc = o.faceCls ? (typeof o.faceCls === 'function' ? o.faceCls(it.f, it.i) : o.faceCls) : '';
      faces += '<path d="' + d + '" fill="' + fill + '"' + (a < 0.999 ? ' fill-opacity="' + a.toFixed(3) + '"' : '') + seam + (fc ? ' class="' + fc + '"' : '') + '/>';
      // contorno da face junto com ela (a ordem de pintura cuida do que fica escondido)
      if (o.outline) faces += '<path d="' + d + '" class="' + (typeof o.outline === 'string' ? o.outline : 'edge') + '"/>';
      if (o.faceEdges && m.FE) {
        const ed = m.FE[it.i];
        if (ed.length) faces += '<path class="' + (o.edgeCls || 'edge') + '" d="' + ed.map((e) => 'M' + f1(P[e.a][0]) + ' ' + f1(P[e.a][1]) + 'L' + f1(P[e.b][0]) + ' ' + f1(P[e.b][1])).join('') + '"/>';
      }
    });
    let edges = '', hid = '';
    if (o.edges !== false) {
      // faces de perfil contam como visíveis (o contorno não vira tracejado)
      const frontF = NV.map((n) => n[2] > -1e-6);
      const vis = [], hidden = [];
      m.E.forEach((e) => {
        const fr = e.f.map((fi) => frontF[fi]);
        const anyFront = fr.some(Boolean);
        const sil = e.f.length === 2 && fr[0] !== fr[1];
        if (o.edgeFilter && !o.edgeFilter(e, m)) return;
        if (e.feat || sil) {
          if (m.convex === false && side !== 'front') { if (e.feat) vis.push(e); return; }
          if (anyFront) vis.push(e);
          else if (e.feat) hidden.push(e);
        }
      });
      const seg = (e) => 'M' + f1(P[e.a][0]) + ' ' + f1(P[e.a][1]) + 'L' + f1(P[e.b][0]) + ' ' + f1(P[e.b][1]);
      if (vis.length) edges = '<path class="' + (o.edgeCls || 'edge') + '" d="' + vis.map(seg).join('') + '"/>';
      if (hidden.length && o.hidden) hid = '<path class="' + (o.hiddenCls || 'edge-hid') + '" d="' + hidden.map(seg).join('') + '"/>';
    }
    return { faces, edges, hidden: hid, P, NV };
  };

  /* Tudo junto, na ordem: arestas ocultas, faces, arestas visíveis. */
  G.draw = function (m, cam, o) {
    const r = G.render(m, cam, o);
    return r.hidden + r.faces + r.edges;
  };

  /* ---------- Rótulos e linhas ---------- */
  G.text = function (cam, p, txt, cls, dx, dy, anchor) {
    const q = cam.p(p);
    return '<text x="' + f1(q[0] + (dx || 0)) + '" y="' + f1(q[1] + (dy || 0)) + '" class="' + (cls || 'lab3') + '" text-anchor="' + (anchor || 'middle') + '" dominant-baseline="middle">' + txt + '</text>';
  };
  G.line = function (cam, a, b, cls) {
    const p = cam.p(a), q = cam.p(b);
    return '<line x1="' + f1(p[0]) + '" y1="' + f1(p[1]) + '" x2="' + f1(q[0]) + '" y2="' + f1(q[1]) + '" class="' + (cls || 'ln3') + '"/>';
  };
  G.poly = function (cam, pts, cls, extra) {
    return '<path d="' + G.path(cam, pts, true) + '" class="' + (cls || '') + '"' + (extra || '') + '/>';
  };
  G.dot = function (cam, p, r, cls) {
    const q = cam.p(p);
    return '<circle cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="' + r + '" class="' + (cls || 'pt3') + '"/>';
  };
  /* Rótulo de medida no meio de uma aresta, empurrado para fora da figura (na tela). */
  G.dimLabel = function (cam, a, b, center, txt, cls, push) {
    const pa = cam.p(a), pb = cam.p(b), pc = cam.p(center);
    const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
    let dx = mx - pc[0], dy = my - pc[1];
    // perpendicular à aresta, do lado de fora
    let ex = pb[0] - pa[0], ey = pb[1] - pa[1];
    const el = Math.hypot(ex, ey) || 1;
    let nx = -ey / el, ny = ex / el;
    if (nx * dx + ny * dy < 0) { nx = -nx; ny = -ny; }
    const k = push == null ? 22 : push;
    const tx = mx + nx * k, ty = my + ny * k;
    const anchor = Math.abs(nx) > 0.55 ? (nx > 0 ? 'start' : 'end') : 'middle';
    return '<text x="' + f1(tx - (anchor === 'start' ? 6 : anchor === 'end' ? -6 : 0)) + '" y="' + f1(ty) + '" class="' + (cls || 'dim3') + '" text-anchor="' + anchor + '" dominant-baseline="middle">' + txt + '</text>';
  };

  /* ---------- Controle da vista: girar, mover, aproximar ----------
     arrastar: gira · botão direito, Shift ou dois dedos: move · roda ou pinça: aproxima
     Botões: Perspectiva (padrão), Frente, Cima, Lado, −, +, Girar sozinho. */
  const ICO = {
    persp: '<path d="M4 8 12 4l8 4v8l-8 4-8-4Z M4 8l8 4 8-4M12 12v8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    front: '<rect x="5" y="5" width="14" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
    top: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v6m-2.5-2.5L12 8l2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    side: '<path d="M5 6h9v12H5zM14 6l5 3v12l-5-3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    zout: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5h5M15 15l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    zin: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5h5M10.5 8v5M15 15l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    spin: '<path d="M20 12a8 8 0 1 1-2.3-5.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 4v4h-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  G.viewer = function (o) {
    const svg = o.svg;
    const P = o.prefix;
    const cam0 = Object.assign({ yaw: -32, pitch: 24 }, o.cam0);
    const lo = o.pitchMin == null ? -90 : o.pitchMin, hi = o.pitchMax == null ? 90 : o.pitchMax;
    const v = { c: { yaw: cam0.yaw, pitch: cam0.pitch, zoom: 1, px: 0, py: 0 } };
    let last = { cx: 500, cy: 270 };
    let tw = null, spinRaf = 0;
    const redraw = () => o.redraw();
    const locked = () => !!(o.locked && o.locked());

    /* Aplica zoom e deslocamento às opções da câmera de cada aba. */
    v.apply = function (co) {
      last = { cx: co.cx, cy: co.cy };
      return Object.assign({}, co, {
        yaw: co.yaw == null ? v.c.yaw : co.yaw,
        pitch: co.pitch == null ? v.c.pitch : co.pitch,
        s: co.s * v.c.zoom, cx: co.cx + v.c.px, cy: co.cy + v.c.py,
      });
    };
    function stopSpin() {
      if (spinRaf) cancelAnimationFrame(spinRaf);
      spinRaf = 0;
      const b = document.getElementById(P + '-spin');
      if (b) b.setAttribute('aria-pressed', 'false');
    }
    v.goTo = function (to, dur) {
      stopSpin();
      if (tw) tw.cancel();
      const from = Object.assign({}, v.c);
      let dy = to.yaw - from.yaw;
      while (dy > 180) dy -= 360;
      while (dy < -180) dy += 360;
      const z1 = to.zoom == null ? from.zoom : to.zoom;
      const px1 = to.px == null ? from.px : to.px, py1 = to.py == null ? from.py : to.py;
      tw = GE.tween((dur == null ? 700 : dur) / GE.state.speed, (t) => {
        const e = GE.ease(t);
        v.c.yaw = from.yaw + dy * e;
        v.c.pitch = from.pitch + (to.pitch - from.pitch) * e;
        v.c.zoom = from.zoom + (z1 - from.zoom) * e;
        v.c.px = from.px + (px1 - from.px) * e;
        v.c.py = from.py + (py1 - from.py) * e;
        redraw();
      }, () => { tw = null; });
    };
    v.reset = () => v.goTo({ yaw: cam0.yaw, pitch: cam0.pitch, zoom: 1, px: 0, py: 0 });
    /* Troca a vista padrão (e vai para ela sem animação). */
    v.home = function (c) {
      stopSpin();
      Object.assign(cam0, c);
      Object.assign(v.c, { yaw: cam0.yaw, pitch: cam0.pitch, zoom: 1, px: 0, py: 0 });
    };
    v.zoomBy = function (f, mx, my) {
      const z0 = v.c.zoom;
      const z1 = GE.clamp(z0 * f, 0.4, 4);
      if (mx != null) {
        // o ponto sob o cursor fica parado
        const k = z1 / z0;
        v.c.px = mx - last.cx - (mx - last.cx - v.c.px) * k;
        v.c.py = my - last.cy - (my - last.cy - v.c.py) * k;
      } else {
        v.c.px *= z1 / z0; v.c.py *= z1 / z0;
      }
      v.c.zoom = z1;
      redraw();
    };
    v.toggleSpin = function () {
      if (spinRaf) { stopSpin(); return; }
      if (locked()) return;
      const b = document.getElementById(P + '-spin');
      if (b) b.setAttribute('aria-pressed', 'true');
      let t0 = 0;
      const step = (ts) => {
        if (t0) v.c.yaw += (ts - t0) * 0.03 * GE.state.speed;
        t0 = ts;
        redraw();
        spinRaf = requestAnimationFrame(step);
      };
      spinRaf = requestAnimationFrame(step);
    };

    /* Botões */
    const bar = document.getElementById(P + '-viewbar');
    if (bar) {
      const btn = (id, ico, label, title, extra) => '<button class="fb vb" id="' + P + '-' + id + '" title="' + title + '" aria-label="' + label + '"' + (extra || '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ico + '</svg><span>' + label + '</span></button>';
      bar.innerHTML =
        btn('cam0', ICO.persp, 'Perspectiva', 'Vista padrão, em perspectiva (tecla 0)') +
        btn('vfront', ICO.front, 'Frente', 'Olhar de frente') +
        btn('vtop', ICO.top, 'Cima', 'Olhar de cima') +
        btn('vside', ICO.side, 'Lado', 'Olhar do lado direito') +
        '<span class="vb-sep" aria-hidden="true"></span>' +
        btn('zout', ICO.zout, 'Afastar', 'Afastar (tecla −)', ' data-icon') +
        btn('zin', ICO.zin, 'Aproximar', 'Aproximar (tecla +)', ' data-icon') +
        btn('spin', ICO.spin, 'Girar sozinho', 'Girar sozinho até clicar de novo', ' aria-pressed="false"');
      const on = (id, fn) => document.getElementById(P + '-' + id).addEventListener('click', fn);
      on('cam0', () => v.reset());
      on('vfront', () => { if (!locked()) v.goTo({ yaw: 0, pitch: 0 }); });
      on('vtop', () => { if (!locked()) v.goTo({ yaw: 0, pitch: Math.min(90, hi) }); });
      on('vside', () => { if (!locked()) v.goTo({ yaw: -90, pitch: 0 }); });
      on('zout', () => v.zoomBy(1 / 1.25));
      on('zin', () => v.zoomBy(1.25));
      on('spin', () => v.toggleSpin());
    }

    /* Mouse e toque */
    const pts = new Map();
    let drag = null, pinch = null;
    const toSvg = (e) => {
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const k = Math.max(vb.width / r.width, vb.height / r.height);
      const ox = (r.width * k - vb.width) / 2, oy = (r.height * k - vb.height) / 2;
      return [(e.clientX - r.left) * k - ox, (e.clientY - r.top) * k - oy, k];
    };
    svg.addEventListener('contextmenu', (e) => e.preventDefault());
    svg.addEventListener('pointerdown', (e) => {
      if (o.skip && o.skip(e)) return;
      pts.set(e.pointerId, toSvg(e));
      svg.setPointerCapture(e.pointerId);
      stopSpin();
      if (tw) { tw.cancel(); tw = null; }
      if (pts.size === 2) {
        const [a, b] = Array.from(pts.values());
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
        drag = null;
        return;
      }
      const pan = e.button === 2 || e.button === 1 || e.shiftKey || locked();
      drag = { p: toSvg(e), c: Object.assign({}, v.c), pan };
      svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, toSvg(e));
      if (pinch && pts.size === 2) {
        const [a, b] = Array.from(pts.values());
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        v.c.px += m[0] - pinch.m[0]; v.c.py += m[1] - pinch.m[1];
        v.zoomBy(d / (pinch.d || d), m[0], m[1]);
        pinch = { d, m };
        return;
      }
      if (!drag) return;
      const q = toSvg(e);
      const dx = q[0] - drag.p[0], dy = q[1] - drag.p[1];
      if (drag.pan) { v.c.px = drag.c.px + dx; v.c.py = drag.c.py + dy; }
      else {
        v.c.yaw = drag.c.yaw + dx * 0.35;
        v.c.pitch = GE.clamp(drag.c.pitch + dy * 0.3, lo, hi);
      }
      redraw();
    });
    const end = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (!pts.size) { drag = null; svg.classList.remove('dragging'); }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const q = toSvg(e);
      v.zoomBy(Math.exp(-e.deltaY * 0.0015), q[0], q[1]);
    }, { passive: false });
    return v;
  };

  /* Anima a câmera até outra posição. */
  G.camTween = function (from, to, dur, onFrame, onDone) {
    let dy = to.yaw - from.yaw;
    while (dy > 180) dy -= 360;
    while (dy < -180) dy += 360;
    return GE.tween(dur / GE.state.speed, (t) => {
      const e = GE.ease(t);
      onFrame({ yaw: from.yaw + dy * e, pitch: from.pitch + (to.pitch - from.pitch) * e });
    }, onDone);
  };

  /* Caixa alinhada aos eixos a partir do canto (x0, y0, z0), com medidas sx, sy, sz. */
  G.box = function (x0, y0, z0, sx, sy, sz) {
    const m = G.prism([[0, 0], [sx, 0], [sx, sz], [0, sz]], sy);
    return G.xform(m, (p) => [p[0] + x0, p[1] + y0, p[2] + z0]);
  };
  /* Linhas de grade (passo g) nas faces visíveis de uma caixa alinhada aos eixos. */
  G.boxGrid = function (cam, x0, y0, z0, sx, sy, sz, g) {
    g = g || 1;
    let d = '';
    const P = (x, y, z) => { const q = cam.p([x, y, z]); return G.f1(q[0]) + ' ' + G.f1(q[1]); };
    const seg = (a, b) => { d += 'M' + P(a[0], a[1], a[2]) + 'L' + P(b[0], b[1], b[2]); };
    const vis = (n) => cam.dir(n)[2] > 1e-6;
    const X1 = x0 + sx, Y1 = y0 + sy, Z1 = z0 + sz;
    const steps = (a, len) => { const out = []; for (let t = g; t < len - 1e-6; t += g) out.push(a + t); return out; };
    const faces = [
      [[0, 1, 0], Y1, 'y'], [[0, -1, 0], y0, 'y'], [[1, 0, 0], X1, 'x'], [[-1, 0, 0], x0, 'x'], [[0, 0, 1], Z1, 'z'], [[0, 0, -1], z0, 'z'],
    ];
    faces.forEach(([n, c, ax]) => {
      if (!vis(n)) return;
      if (ax === 'y') {
        steps(x0, sx).forEach((x) => seg([x, c, z0], [x, c, Z1]));
        steps(z0, sz).forEach((z) => seg([x0, c, z], [X1, c, z]));
      } else if (ax === 'x') {
        steps(y0, sy).forEach((y) => seg([c, y, z0], [c, y, Z1]));
        steps(z0, sz).forEach((z) => seg([c, y0, z], [c, Y1, z]));
      } else {
        steps(x0, sx).forEach((x) => seg([x, y0, c], [x, Y1, c]));
        steps(y0, sy).forEach((y) => seg([x0, y, c], [X1, y, c]));
      }
    });
    return d ? '<path class="grid3" d="' + d + '"/>' : '';
  };

  /* Passo "bonito" para grades: 1, 2, 5, 10... com no máximo maxN divisões. */
  G.niceStep = function (v, maxN) {
    const raw = v / (maxN || 12);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    const k = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
    return Math.max(k * p, 1e-9);
  };
})();
