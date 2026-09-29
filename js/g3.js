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
        const idx = [k * P + i, k * P + j, k2 * P + j, k2 * P + i];
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
      const lam = Math.max(0, (it.front ? 1 : -1) * dot(n, LIGHT));
      const k = (it.front ? 0.66 : 0.5) + 0.42 * lam;
      const fill = shade(it.col, k);
      const a = alphaOf(it.f, it.i);
      if (a <= 0.001) return;
      const d = it.f.v.map((v, j) => (j ? 'L' : 'M') + f1(P[v][0]) + ' ' + f1(P[v][1])).join('') + 'Z';
      const seam = a >= 0.999 ? ' stroke="' + fill + '" stroke-width="0.7"' : '';
      faces += '<path d="' + d + '" fill="' + fill + '"' + (a < 0.999 ? ' fill-opacity="' + a.toFixed(3) + '"' : '') + seam + (o.faceCls ? ' class="' + o.faceCls + '"' : '') + '/>';
    });
    let edges = '', hid = '';
    if (o.edges !== false) {
      const frontF = NV.map((n) => n[2] > 1e-6);
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

  /* ---------- Arrastar para girar ---------- */
  G.orbit = function (svg, get, set, opts) {
    opts = opts || {};
    let drag = null;
    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (opts.skip && opts.skip(e)) return;
      if (opts.locked && opts.locked()) return;
      drag = { x: e.clientX, y: e.clientY, c: get() };
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = svg.getBoundingClientRect();
      const k = 1000 / Math.max(1, r.width);
      const dyaw = (e.clientX - drag.x) * k * 0.35;
      const dp = (e.clientY - drag.y) * k * 0.3;
      const lo = opts.pitchMin == null ? -85 : opts.pitchMin, hi = opts.pitchMax == null ? 85 : opts.pitchMax;
      let yaw = drag.c.yaw + dyaw;
      if (opts.yawMin != null) yaw = GE.clamp(yaw, opts.yawMin, opts.yawMax);
      set({ yaw, pitch: GE.clamp(drag.c.pitch + dp, lo, hi) });
    });
    const end = () => { drag = null; svg.classList.remove('dragging'); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
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

  /* Passo "bonito" para grades: 1, 2, 5, 10... com no máximo maxN divisões. */
  G.niceStep = function (v, maxN) {
    const raw = v / (maxN || 12);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    const k = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
    return Math.max(k * p, 1e-9);
  };
})();
