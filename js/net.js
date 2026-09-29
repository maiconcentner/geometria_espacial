/* Aba Planificação: abrir o sólido, ver as faces no plano e somar as áreas (silo da Atividade 11). */
(function () {
  'use strict';
  const GE = window.GE;
  const G = GE.g3;
  const $ = (id) => document.getElementById(id);
  const F = (v, d) => GE.fmt(v, d);
  const esc = GE.esc;
  const GM = () => GE.geom;

  const LIST = ['cubo', 'para', 'tri', 'hex', 'cil'];
  const BOOK = [
    { id: 'a11', book: 'Atividade 11', solid: 'cil', d: { r: 2, h: 20 }, unit: 'm', pi: '3', onlyTop: true, paint: 6,
      text: 'Um silo precisa de pintura nova na parede lateral e na tampa de cima (o fundo é o piso). O raio é 2 m e a altura, 20 m. Um galão de 1 litro de tinta cobre 6 m². Quantos litros serão necessários?' },
    { id: 'caixa', book: 'Explorar', solid: 'para', d: { c: 30, L: 20, h: 10 }, unit: 'cm',
      text: 'Quanto papelão é preciso para montar uma caixa fechada de 30 cm × 20 cm × 10 cm?' },
    { id: 'lata', book: 'Explorar', solid: 'cil', d: { r: 3, h: 11 }, unit: 'cm',
      text: 'Quanto de alumínio (área) tem uma lata de 6 cm de diâmetro e 11 cm de altura?' },
  ];
  const DEF = { solid: 'cubo', d: { a: 4, c: 6, L: 4, h: 5, b: 3, r: 2 }, unit: 'cm', q: '', step: 0 };
  const S = () => GE.state.net;
  function sanitize(o) {
    if (!LIST.includes(o.solid)) o.solid = 'cubo';
    const d = Object.assign({}, DEF.d, o.d || {});
    Object.keys(DEF.d).forEach((k) => { d[k] = GE.num(d[k], DEF.d[k], 0.1, 10000); });
    o.d = d;
    if (!['cm', 'dm', 'm'].includes(o.unit)) o.unit = 'cm';
    if (!BOOK.some((b) => b.id === o.q)) o.q = '';
    o.step = Math.max(0, Math.round(Number(o.step) || 0));
    return o;
  }
  const book = () => BOOK.find((b) => b.id === S().q);
  const U = () => S().unit;
  const ml = (s) => '<span class="mathline">' + s + '</span>';
  const I = (s) => '<i>' + s + '</i>';

  /* ---------- Geometria da planificação ---------- */
  const up = [0, 1, 0];
  function prismNet(base, h, la, lt) {
    const n = base.length;
    const c = base.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]);
    const P3 = (p) => [p[0], 0, p[1]];
    const a = (Math.PI / 2) * (1 - la);
    const V = [], Fc = [];
    base.forEach((p) => V.push(P3(p)));
    Fc.push({ v: base.map((_, i) => i), part: 'base' });
    const info = [];
    for (let i = 0; i < n; i++) {
      const p = base[i], q = base[(i + 1) % n];
      const e = [q[0] - p[0], q[1] - p[1]];
      const L = Math.hypot(e[0], e[1]);
      let nn = [e[1] / L, -e[0] / L];
      const mid = [(p[0] + q[0]) / 2 - c[0], (p[1] + q[1]) / 2 - c[1]];
      if (nn[0] * mid[0] + nn[1] * mid[1] < 0) nn = [-nn[0], -nn[1]];
      const n3 = [nn[0], 0, nn[1]];
      const w = G.add(G.mul(n3, Math.cos(a)), G.mul(up, Math.sin(a)));
      const k = V.length;
      V.push(P3(p), P3(q), G.add(P3(q), G.mul(w, h)), G.add(P3(p), G.mul(w, h)));
      Fc.push({ v: [k, k + 1, k + 2, k + 3], part: 'lat', k: i, len: L });
      info.push({ p, q, e: [e[0] / L, e[1] / L], n3, w, L });
    }
    // tampa presa à face 0
    const f0 = info[0];
    const b = (Math.PI / 2) * (1 - lt);
    const wp = G.add(G.mul(f0.n3, -Math.sin(a)), G.mul(up, Math.cos(a)));
    const dir = G.add(G.mul(f0.w, Math.cos(b)), G.mul(wp, Math.sin(b)));
    const k = V.length;
    base.forEach((q) => {
      const rel = [q[0] - f0.p[0], q[1] - f0.p[1]];
      const lam = rel[0] * f0.e[0] + rel[1] * f0.e[1];
      const del = -(rel[0] * f0.n3[0] + rel[1] * f0.n3[2]);
      V.push(G.add(G.add(G.add(P3(f0.p), [f0.e[0] * lam, 0, f0.e[1] * lam]), G.mul(f0.w, h)), G.mul(dir, del)));
    });
    Fc.push({ v: base.map((_, i) => k + i), part: 'top' });
    return G.prep({ V, F: Fc, convex: false, featureAngle: 1 });
  }

  function cylNet(r, h, tb, tl) {
    const N = 64;
    const V = [], Fc = [];
    const t = Math.min(tl, 0.9995);
    const rho = r / (1 - t);
    for (let k = 0; k <= N; k++) {
      const sArc = -Math.PI * r + (2 * Math.PI * r * k) / N;
      const al = sArc / rho;
      const x = tl > 0.9995 ? sArc : rho * Math.sin(al);
      const z = tl > 0.9995 ? r : r - rho * (1 - Math.cos(al));
      V.push([x, 0, z], [x, h, z]);
    }
    for (let k = 0; k < N; k++) Fc.push({ v: [2 * k, 2 * k + 2, 2 * k + 3, 2 * k + 1], part: 'lat', smooth: true, noEdge: false });
    const disk = (cy, hinge, ang, part) => {
      const k0 = V.length;
      const pts = G.circlePts(r, 60, 0).map((p) => G.rotAxis([p[0], cy, p[1]], hinge, [1, 0, 0], ang));
      pts.forEach((p) => V.push(p));
      Fc.push({ v: pts.map((_, i) => k0 + i), part });
    };
    disk(h, [0, h, r], (Math.PI / 2) * tb, 'top');
    disk(0, [0, 0, r], (-Math.PI / 2) * tb, 'base');
    return G.prep({ V, F: Fc, convex: false, featureAngle: 20 });
  }

  /* ---------- Áreas ---------- */
  function edges(o, d) {
    const b = GE.SOLIDS[o.solid].base;
    if (b === 'sq') return [d.a, d.a, d.a, d.a];
    if (b === 'rect') return [d.c, d.L, d.c, d.L];
    if (b === 'tri') return [d.b, Math.hypot(d.b, d.c), d.c];
    if (b === 'hex') return [d.L, d.L, d.L, d.L, d.L, d.L];
    return [];
  }

  const B = { la: 0, lt: 0, tb: 0, tl: 0, lift: 0, hiB: 0, hiL: 0, hiT: 0, lab: 0, circ: 0 };
  const sc = (p) => Object.assign({}, B, p);

  function steps() {
    const o = S();
    const d = GM().dims(o);
    const q = book();
    const u = U(), u2 = u + '²';
    const qTxt = q ? '<p class="qtext"><span class="book">' + esc(q.book) + '</span> ' + esc(q.text) + '</p>' : '';
    const out = [];
    if (o.solid === 'cil') {
      const pi = GE.piVal(), pt = GE.piTxt();
      const C = { k: 2 * d.r, sym: 'π' }, Al = { k: 2 * d.r * d.h, sym: 'π' }, Ab = { k: d.r * d.r, sym: 'π' };
      const v = (x) => x.k * pi;
      const st = GM().symTxt, tl = GM().tail;
      const only = q && q.onlyTop;
      out.push({ title: q ? 'O silo' : 'Cilindro', tag: 'planificação', body: qTxt + '<p>Vamos abrir o cilindro para ver de que figuras planas é feita a sua superfície.</p>', scene: sc({}) });
      out.push({ title: 'Abrir as bases', body: '<p>A tampa e o fundo são dois <b>círculos</b> de raio ' + I('r') + ' = ' + F(d.r) + ' ' + u + '.</p>', scene: sc({ tb: 1 }), dur: 1100 });
      out.push({ title: 'Desenrolar a parede', body: '<p>Cortando a parede na vertical e desenrolando, ela vira um <b>retângulo</b> de altura ' + I('h') + ' = ' + F(d.h) + ' ' + u + '.</p>', scene: sc({ tb: 1, tl: 1, lift: 1 }), dur: 1700 });
      out.push({ title: 'Comprimento do retângulo', body: '<p>A base do retângulo é o <b>contorno</b> do círculo (o comprimento da circunferência):</p>' + ml(I('C') + ' = 2 · π · ' + I('r') + ' = 2 · π · ' + F(d.r) + ' = ' + st(C.k, 'π') + (only ? '' : tl(C)) + ' ' + u), scene: sc({ tb: 1, tl: 1, lift: 1, circ: 1, lab: 1 }) });
      out.push({ title: 'Área da parede (lateral)', body: '<p>Área do retângulo = base × altura:</p>' + ml(I('A') + '<sub>lateral</sub> = 2π' + I('r') + ' · ' + I('h') + ' = ' + st(C.k, 'π') + ' · ' + F(d.h) + ' = ' + st(Al.k, 'π') + (only ? '' : tl(Al)) + ' ' + u2), scene: sc({ tb: 1, tl: 1, lift: 1, hiL: 1, lab: 1 }) });
      if (only) {
        out.push({ title: 'Área da tampa', body: '<p>Só a tampa de cima é pintada: o fundo é o piso do silo.</p>' + ml(I('A') + '<sub>tampa</sub> = π · ' + I('r') + '² = π · ' + F(d.r) + '² = ' + st(Ab.k, 'π') + ' ' + u2), scene: sc({ tb: 1, tl: 1, lift: 1, hiT: 1, lab: 1 }) });
        const tot = { k: Al.k + Ab.k, sym: 'π' };
        out.push({ title: 'Área a pintar', body: '<p>Parede + tampa, com π = ' + pt + ':</p>' + ml(I('A') + ' = ' + st(Al.k, 'π') + ' + ' + st(Ab.k, 'π') + ' = ' + st(tot.k, 'π') + tl(tot) + ' ' + u2), scene: sc({ tb: 1, tl: 1, lift: 1, hiL: 1, hiT: 1, lab: 1 }) });
        const litros = v(tot) / q.paint;
        out.push({ title: 'Litros de tinta', body: '<p>Cada litro cobre ' + F(q.paint) + ' m².</p>' + ml(F(v(tot)) + ' ÷ ' + F(q.paint) + ' ' + GE.eqs(litros) + ' ' + F(litros)) + '<p class="answer">Serão necessários <b>' + F(Math.ceil(litros - 1e-9), 0) + ' litros</b> de tinta.</p>', scene: sc({ tb: 1, tl: 1, lift: 1, hiL: 1, hiT: 1, lab: 1 }) });
      } else {
        out.push({ title: 'Área das bases', body: '<p>São dois círculos iguais:</p>' + ml('2 · π · ' + I('r') + '² = 2 · π · ' + F(d.r) + '² = ' + st(2 * Ab.k, 'π') + tl({ k: 2 * Ab.k, sym: 'π' }) + ' ' + u2), scene: sc({ tb: 1, tl: 1, lift: 1, hiB: 1, hiT: 1, lab: 1 }) });
        const tot = { k: Al.k + 2 * Ab.k, sym: 'π' };
        out.push({ title: 'Área total', body: ml(I('A') + '<sub>total</sub> = 2π' + I('r') + '² + 2π' + I('r') + I('h')) + ml(I('A') + '<sub>total</sub> = ' + st(2 * Ab.k, 'π') + ' + ' + st(Al.k, 'π') + ' = ' + st(tot.k, 'π') + tl(tot) + ' ' + u2), scene: sc({ tb: 1, tl: 1, lift: 1, hiL: 1, hiB: 1, hiT: 1, lab: 1 }) });
        out.push({ title: 'Montar de novo', body: '<p>Enrolando o retângulo e fechando as bases, o cilindro volta a se formar.</p>', scene: sc({}), dur: 1800 });
      }
      return out;
    }
    const def = GE.SOLIDS[o.solid];
    const A = GM().areaOf(o, d);
    const Ab = GM().val(A);
    const es = edges(o, d);
    const per = es.reduce((a, b) => a + b, 0);
    const Al = per * d.h;
    out.push({ title: def.name, tag: 'planificação', body: qTxt + '<p>Vamos abrir o sólido, como uma caixa de papelão, para ver as figuras planas que formam a sua superfície.</p>', scene: sc({}) });
    out.push({ title: 'Abrir as faces laterais', body: '<p>As ' + es.length + ' faces laterais giram em torno das arestas da base e deitam no plano.</p>', scene: sc({ la: 1 }), dur: 1400 });
    out.push({ title: 'Abrir a tampa', body: '<p>A outra base (a tampa) está presa a uma face lateral e também deita. Esta é uma <b>planificação</b> do ' + def.name.toLowerCase() + '.</p>', scene: sc({ la: 1, lt: 1, lift: 1 }), dur: 1200 });
    let bodyB = '<p>As duas bases são iguais:</p>' + ml('2 · ' + I('A') + '<sub>base</sub> = 2 · ' + GM().symTxt(A.k, A.sym) + (A.sym ? ' ' + GE.eqs(2 * Ab) + ' ' + F(2 * Ab) : ' = ' + F(2 * Ab)) + ' ' + u2);
    out.push({ title: 'As bases', body: bodyB, scene: sc({ la: 1, lt: 1, lift: 1, hiB: 1, hiT: 1, lab: 1 }) });
    let bodyL = '';
    if (def.base === 'tri') bodyL += '<p>A terceira aresta da base é a hipotenusa (Pitágoras): √(' + F(d.b) + '² + ' + F(d.c) + '²) = ' + F(es[1]) + ' ' + u + '.</p>';
    bodyL += '<p>Cada face lateral é um retângulo com altura ' + I('h') + ' = ' + F(d.h) + ' ' + u + ':</p>';
    const groups = {};
    es.forEach((e) => { const k = F(e); groups[k] = (groups[k] || 0) + 1; });
    bodyL += ml(Object.keys(groups).map((k) => (groups[k] > 1 ? groups[k] + ' · ' : '') + '(' + k + ' · ' + F(d.h) + ')').join(' + ') + ' = ' + F(Al) + ' ' + u2);
    bodyL += '<p class="note">Atalho: perímetro da base × altura = ' + F(per) + ' · ' + F(d.h) + ' = ' + F(Al) + '.</p>';
    out.push({ title: 'As faces laterais', body: bodyL, scene: sc({ la: 1, lt: 1, lift: 1, hiL: 1, lab: 1 }) });
    const tot = 2 * Ab + Al;
    out.push({ title: 'Área total', body: ml(I('A') + '<sub>total</sub> = 2 · ' + I('A') + '<sub>base</sub> + ' + I('A') + '<sub>lateral</sub>') + ml(I('A') + '<sub>total</sub> = ' + F(2 * Ab) + ' + ' + F(Al) + ' ' + GE.eqs(tot) + ' ' + F(tot) + ' ' + u2) + (q ? '<p class="answer">São necessários cerca de <b>' + F(tot) + ' ' + u2 + '</b> de material (sem contar as abas de colagem).</p>' : ''), scene: sc({ la: 1, lt: 1, lift: 1, hiL: 1, hiB: 1, hiT: 1, lab: 1 }) });
    out.push({ title: 'Montar de novo', body: '<p>Dobrando nas arestas, a planificação volta a ser o sólido.</p>', scene: sc({}), dur: 1800 });
    return out;
  }

  /* ---------- Desenho ---------- */
  let view = null;
  const COL = { solid: '#f2a15f', base: '#5aa7e8', lat: '#6cc38a', off: '#c7cdd3' };

  function draw(s) {
    const o = S();
    const d = GM().dims(o);
    const q = book();
    const svg = $('net-svg');
    let out = '';
    let m, cam, scale;
    const hid = GE.state.hidden;
    const color = (f) => {
      if (f.part === 'lat') return G.mix(COL.solid, COL.lat, s.hiL);
      if (f.part === 'top') return G.mix(COL.solid, COL.base, s.hiT);
      if (q && q.onlyTop && f.part === 'base') return G.mix(COL.solid, COL.off, Math.max(s.hiT, s.hiL));
      return G.mix(COL.solid, COL.base, s.hiB);
    };
    if (o.solid === 'cil') {
      const r = d.r, h = d.h;
      scale = Math.min(820 / (2 * Math.PI * r), 430 / (h + 4 * r));
      m = cylNet(r, h, s.tb, s.tl);
      const yaw = view.c.yaw * (1 - s.lift), pitch = view.c.pitch * (1 - s.lift) + 6 * s.lift;
      cam = G.cam(view.apply({ yaw, pitch, s: scale, cx: 500, cy: 280, center: [0, h / 2 + 0 * s.tb, r * s.tl] }));
      const rr = G.render(m, cam, { side: 'both', twoSided: true, colors: color, faceEdges: true, edges: false });
      out += rr.faces;
      if (s.lab > 0.01) {
        let lb = '';
        const x0 = -Math.PI * r, x1 = Math.PI * r;
        if (s.circ > 0.01) lb += G.line(cam, [x0, h, r], [x1, h, r], 'circ-hi');
        const IT = (t) => '<tspan class="it">' + t + '</tspan>';
        lb += G.text(cam, [x1 * 0.62, h, r], '2π' + IT('r') + ' = ' + GM().symTxt(2 * r, 'π') + ' ' + U(), 'dim3', 0, -18);
        lb += G.dimLabel(cam, [x1, 0, r], [x1, h, r], [0, h / 2, r], IT('h') + ' = ' + F(h) + ' ' + U(), 'dim3', 14);
        const tc = G.rotAxis([0, h, 0], [0, h, r], [1, 0, 0], (Math.PI / 2) * s.tb);
        lb += G.text(cam, tc, (q && q.onlyTop ? 'tampa' : 'base'), 'lab3');
        const bc = G.rotAxis([0, 0, 0], [0, 0, r], [1, 0, 0], (-Math.PI / 2) * s.tb);
        lb += G.text(cam, bc, q && q.onlyTop ? 'piso (não pinta)' : 'base', 'lab3');
        if (s.hiL > 0.5) lb += G.text(cam, [0, h / 2, r], 'lateral', 'lab3');
        out += '<g opacity="' + s.lab.toFixed(2) + '">' + lb + '</g>';
      }
    } else {
      const base = GM().basePoly(o, d);
      const h = d.h;
      const rb = GM().baseRadius(base);
      scale = 290 / (rb + 1.2 * h + 0.6 * rb);
      m = prismNet(base, h, s.la, s.lt);
      const pitch = view.c.pitch + (68 - view.c.pitch) * s.lift;
      cam = G.cam(view.apply({ pitch, s: scale, cx: 500, cy: 280, center: [0, h / 2 * (1 - s.la), 0] }));
      const rr = G.render(m, cam, { side: 'both', twoSided: true, colors: color, outline: 'edge' });
      if (s.la < 0.01 && s.lt < 0.01) {
        // fechado: desenha como sólido (arestas ocultas tracejadas)
        const solid = G.prism(base, h);
        const r2 = G.render(solid, cam, { colors: (f) => color(f), hidden: hid });
        out += r2.hidden + r2.faces + r2.edges;
      } else out += rr.faces;
      if (s.lab > 0.01) {
        let lb = '';
        m.F.forEach((f, i) => {
          if (f.part !== 'lat' && !(s.hiB > 0.5 || s.hiT > 0.5)) return;
          if (f.part === 'lat' && s.hiL < 0.5) return;
          const c = G.centroid(f.v.map((k) => m.V[k]));
          const t = f.part === 'lat' ? F(f.len) + ' · ' + F(h) : F(GM().val(GM().areaOf(o, d)));
          lb += G.text(cam, c, t, 'face-lab');
        });
        out += '<g opacity="' + s.lab.toFixed(2) + '">' + lb + '</g>';
      }
    }
    svg.innerHTML = out;
  }

  /* ---------- Controles ---------- */
  let stp = null;
  function renderControls() {
    const o = S();
    document.querySelectorAll('#net-solids [data-s]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === o.solid));
    document.querySelectorAll('#net-book [data-q]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.q === o.q));
    $('net-name').textContent = GE.SOLIDS[o.solid].name + (book() && book().id === 'a11' ? ' · silo' : '');
    const keys = GE.SOLIDS[o.solid].dims;
    const box = $('net-dims');
    const want = keys.join(',') + '|' + o.unit;
    if (box.dataset.k !== want) {
      box.dataset.k = want;
      box.innerHTML = keys.map((k) => '<div class="dimrow"><label for="nd-' + k + '"><i>' + k + '</i> <span>' + GM().dimName(o.solid, k) + '</span></label>' +
        '<input type="text" inputmode="decimal" id="nd-' + k + '" data-k="' + k + '"><span class="du">' + o.unit + '</span>' +
        '<input type="range" data-r="' + k + '" aria-label="' + GM().dimName(o.solid, k) + '" min="1" max="30" step="0.5"></div>').join('');
    }
    keys.forEach((k) => {
      const inp = box.querySelector('[data-k="' + k + '"]');
      if (document.activeElement !== inp) inp.value = F(o.d[k], 4);
      box.querySelector('[data-r="' + k + '"]').value = o.d[k];
    });
    $('net-unit').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.unit));
  }
  const edit = (sub) => GE.patch('net', Object.assign({ q: '', step: 0 }, sub));

  const mod = {
    defaults: DEF,
    sanitize,
    svgId: 'net-svg',
    name: () => 'Planificação · ' + (book() ? book().book : GE.SOLIDS[S().solid].name),
    init() {
      view = G.viewer({ svg: $('net-svg'), prefix: 'net', cam0: { yaw: -30, pitch: 26 }, redraw: () => stp && stp.redraw() });
      stp = GE.stepper({
        prefix: 'net', steps, draw,
        getIndex: () => S().step,
        setIndex: (i) => GE.set({ net: Object.assign({}, S(), { step: i }) }, { quiet: true }),
      });
      stp.bind();
      $('net-solids').innerHTML = LIST.map((k) => '<button class="solid-btn" data-s="' + k + '">' + GE.icons.solid(k) + '<span>' + GE.SOLIDS[k].name + '</span></button>').join('');
      $('net-solids').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) edit({ solid: b.dataset.s }); });
      $('net-book').innerHTML = BOOK.map((q) => '<button class="qbtn" data-q="' + q.id + '"><span class="book">' + q.book + '</span>' + esc(q.text.split(/[.?]/)[0].slice(0, 80)) + '…</button>').join('');
      $('net-book').addEventListener('click', (e) => {
        const b = e.target.closest('[data-q]');
        if (!b) return;
        const q = BOOK.find((x) => x.id === b.dataset.q);
        const patch = { net: Object.assign({}, S(), { solid: q.solid, d: Object.assign({}, S().d, q.d), unit: q.unit, q: q.id, step: 0 }) };
        if (q.pi) patch.pi = q.pi;
        GE.set(patch);
      });
      const box = $('net-dims');
      box.addEventListener('change', (e) => {
        const k = e.target.dataset.k;
        if (!k) return;
        const v = GE.parseNum(e.target.value);
        if (!(v > 0)) { e.target.classList.add('invalid'); return; }
        e.target.classList.remove('invalid');
        edit({ d: Object.assign({}, S().d, { [k]: v }) });
      });
      box.addEventListener('input', (e) => { const k = e.target.dataset.r; if (k) edit({ d: Object.assign({}, S().d, { [k]: Number(e.target.value) }) }); });
      $('net-unit').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ unit: b.dataset.v }); });
      GE.on((changed, prev, opts) => {
        if (changed.includes('net') && !opts.quiet) {
          const a = prev.net || {}, b = S();
          const onlyStep = Object.keys(b).every((k) => k === 'step' || JSON.stringify(a[k]) === JSON.stringify(b[k]));
          if (!onlyStep) { renderControls(); stp.rebuild(false); } else if (GE.state.view === 'net') stp.rebuild(true);
        }
        if (changed.some((k) => ['pi', 'dec', 'hidden'].includes(k))) stp.rebuild(false);
      });
      renderControls();
      stp.rebuild(false);
    },
    render() { renderControls(); stp.rebuild(false); },
    redraw() { stp.redraw(); },
    next() { stp.next(); }, prev() { stp.prev(); }, first() { stp.first(); },
    stepper: () => stp,
  };
  GE.register('net', mod);
})();
