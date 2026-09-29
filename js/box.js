/* Aba Minha caixa (O que sei agora): projetar uma caixa, ver as vistas, o volume, a capacidade e o material. */
(function () {
  'use strict';
  const GE = window.GE;
  const G = GE.g3;
  const $ = (id) => document.getElementById(id);
  const F = (v, d) => GE.fmt(v, d);
  const esc = GE.esc;

  const MODELS = [
    { id: 'sapato', name: 'Caixa de sapatos', solid: 'para', d: { c: 30, L: 18, h: 12 }, unit: 'cm' },
    { id: 'leite', name: 'Caixa de leite', solid: 'para', d: { c: 9.5, L: 6.3, h: 16.5 }, unit: 'cm' },
    { id: 'lata', name: 'Lata de refrigerante', solid: 'cil', d: { r: 3.3, h: 12.2 }, unit: 'cm' },
    { id: 'pizza', name: 'Caixa de pizza', solid: 'quad', d: { a: 35, h: 4 }, unit: 'cm' },
    { id: 'presente', name: 'Presente hexagonal', solid: 'hex', d: { L: 6, h: 10 }, unit: 'cm' },
    { id: 'choco', name: 'Chocolate triangular', solid: 'tri', d: { b: 4, c: 4, h: 20 }, unit: 'cm' },
    { id: 'agua', name: 'Caixa-d’água', solid: 'cil', d: { r: 0.6, h: 1 }, unit: 'm' },
  ];
  const LIST = ['cubo', 'quad', 'para', 'tri', 'hex', 'cil'];
  const DEF = { team: '', prod: 'Nossa caixa', solid: 'para', d: { a: 10, c: 30, L: 18, h: 12, b: 6, r: 5 }, unit: 'cm', model: 'sapato' };
  const S = () => GE.state.box;
  function sanitize(o) {
    if (!LIST.includes(o.solid)) o.solid = 'para';
    const d = Object.assign({}, DEF.d, o.d || {});
    Object.keys(DEF.d).forEach((k) => { d[k] = GE.num(d[k], DEF.d[k], 0.1, 10000); });
    o.d = d;
    if (!['cm', 'dm', 'm'].includes(o.unit)) o.unit = 'cm';
    o.team = String(o.team || '').slice(0, 60);
    o.prod = String(o.prod == null ? 'Nossa caixa' : o.prod).slice(0, 60);
    if (!MODELS.some((m) => m.id === o.model)) o.model = '';
    return o;
  }

  function geo() {
    const o = S();
    const d = GE.geom.dims(o);
    const base = GE.geom.basePoly(o, d);
    const m = o.solid === 'cil' ? G.cylinder(d.r, d.h, [0, 0], 64) : G.prism(base, d.h);
    const A = GE.geom.areaOf(o, d);
    const Ab = GE.geom.val(A);
    let per;
    if (o.solid === 'cil') per = 2 * GE.piVal() * d.r;
    else per = base.reduce((s, p, i) => { const q = base[(i + 1) % base.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
    const V = Ab * d.h;
    const area = 2 * Ab + per * d.h;
    return { o, d, m, V, area, Ab, per };
  }
  function capTxt(V, u) {
    const L = u === 'cm' ? V / 1000 : u === 'dm' ? V : V * 1000;
    return { L, txt: L >= 1 ? F(L) + ' L' : F(L * 1000) + ' mL' };
  }

  let view = null;
  const VIEWS = [
    { k: 'frente', name: 'Vista frontal', yaw: 0, pitch: 0, ax: [0, 1] },
    { k: 'cima', name: 'Vista superior', yaw: 0, pitch: 90, ax: [0, 2] },
    { k: 'esq', name: 'Vista lateral esquerda', yaw: 90, pitch: 0, ax: [2, 1] },
  ];
  function draw() {
    const g = geo();
    const { o, d, m } = g;
    const svg = $('box-svg');
    const ext = (i) => { const vs = m.V.map((p) => p[i]); return [Math.min.apply(null, vs), Math.max.apply(null, vs)]; };
    const E = [ext(0), ext(1), ext(2)];
    const R = Math.max(E[0][1] - E[0][0], E[1][1] - E[1][0], E[2][1] - E[2][0]);
    const C = [(E[0][0] + E[0][1]) / 2, (E[1][0] + E[1][1]) / 2, (E[2][0] + E[2][1]) / 2];
    let out = '';
    const cam = G.cam(view.apply({ s: 250 / R, cx: 280, cy: 280, center: C }));
    const r = G.render(m, cam, { colors: { '*': '#f2a15f', top: '#f6b27a' }, hidden: GE.state.hidden });
    out += '<ellipse class="shadow3" cx="280" cy="' + G.f1(cam.p([C[0], E[1][0], C[2]])[1] + 8) + '" rx="' + G.f1(250 / 2 * 1.05) + '" ry="' + G.f1(250 * 0.12 + 4) + '"/>';
    out += r.hidden + r.faces + r.edges;
    out += '<text class="box-title" x="280" y="40" text-anchor="middle">' + esc(o.prod || 'Nossa caixa') + '</text>';
    // vistas com cotas
    const X0 = 560, Y0 = 16, W = 420, H = 508;
    out += '<rect class="inset-bg" x="' + X0 + '" y="' + Y0 + '" width="' + W + '" height="' + H + '" rx="14"/>';
    const k = 118 / R;
    const cells = [[X0 + W * 0.28, Y0 + 130], [X0 + W * 0.28, Y0 + 370], [X0 + W * 0.74, Y0 + 130]];
    VIEWS.forEach((V, i) => {
      const [cx, cy] = cells[i];
      const c2 = G.cam({ yaw: V.yaw, pitch: V.pitch, s: k, cx, cy, center: C });
      const rr = G.render(m, c2, { colors: { '*': '#fbe7d4' }, twoSided: true, hidden: GE.state.hidden });
      out += rr.hidden + rr.faces + rr.edges;
      out += '<text class="slot-lab" x="' + cx + '" y="' + (cy - 98) + '" text-anchor="middle">' + V.name + '</text>';
      // cotas: largura e altura da vista
      const [ia, ib] = V.ax;
      const wv = E[ia][1] - E[ia][0], hv = E[ib][1] - E[ib][0];
      const pw = wv * k, ph = hv * k;
      const y1 = cy + ph / 2 + 16, x1 = cx + pw / 2 + 14;
      out += '<path class="cota" d="M' + G.f1(cx - pw / 2) + ' ' + G.f1(y1) + 'h' + G.f1(pw) + 'M' + G.f1(cx - pw / 2) + ' ' + G.f1(y1 - 5) + 'v10M' + G.f1(cx + pw / 2) + ' ' + G.f1(y1 - 5) + 'v10"/>';
      out += '<text class="cota-t" x="' + G.f1(cx) + '" y="' + G.f1(y1 + 16) + '" text-anchor="middle">' + F(wv) + ' ' + o.unit + '</text>';
      out += '<path class="cota" d="M' + G.f1(x1) + ' ' + G.f1(cy - ph / 2) + 'v' + G.f1(ph) + 'M' + G.f1(x1 - 5) + ' ' + G.f1(cy - ph / 2) + 'h10M' + G.f1(x1 - 5) + ' ' + G.f1(cy + ph / 2) + 'h10"/>';
      out += '<text class="cota-t" x="' + G.f1(x1 + 8) + '" y="' + G.f1(cy + 5) + '">' + F(hv) + ' ' + o.unit + '</text>';
    });
    out += '<text class="slot-lab" x="' + (X0 + W * 0.74) + '" y="' + (Y0 + 300) + '" text-anchor="middle">1º diedro</text>';
    out += '<text class="note-s" x="' + (X0 + W * 0.74) + '" y="' + (Y0 + 322) + '" text-anchor="middle">frontal no centro,</text><text class="note-s" x="' + (X0 + W * 0.74) + '" y="' + (Y0 + 340) + '" text-anchor="middle">superior embaixo,</text><text class="note-s" x="' + (X0 + W * 0.74) + '" y="' + (Y0 + 358) + '" text-anchor="middle">lateral esquerda à direita</text>';
    svg.innerHTML = out;
    renderKpis(g);
  }

  function renderKpis(g) {
    const { o, d, V, area, Ab } = g;
    const u = o.unit;
    const cap = capTxt(V, u);
    const piN = o.solid === 'cil' && GE.state.pi !== 'pi' ? ' (π = ' + GE.piTxt() + ')' : '';
    const cmp = cap.L >= 1 ? '≈ ' + F(Math.floor(cap.L + 1e-9), 0) + ' caixas de leite de 1 L' : '≈ ' + F(cap.L * 1000 / 350, 1) + ' latas de 350 mL';
    $('box-kpis').innerHTML =
      '<div class="kpi vol"><span>Volume</span><b>' + F(V) + ' ' + u + '³</b><small>' + F(Ab) + ' ' + u + '² × ' + F(d.h) + ' ' + u + piN + '</small></div>' +
      '<div class="kpi cap"><span>Capacidade</span><b>' + cap.txt + '</b><small>' + cmp + '</small></div>' +
      '<div class="kpi area"><span>Material (área)</span><b>' + F(area) + ' ' + u + '²</b><small>2 bases + faces laterais</small></div>';
  }

  function renderControls() {
    const o = S();
    document.querySelectorAll('#box-solids [data-s]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === o.solid));
    $('box-model').value = o.model;
    if (document.activeElement !== $('box-team')) $('box-team').value = o.team;
    if (document.activeElement !== $('box-prod')) $('box-prod').value = o.prod;
    const keys = GE.SOLIDS[o.solid].dims;
    const box = $('box-dims');
    const want = keys.join(',') + '|' + o.unit;
    if (box.dataset.k !== want) {
      box.dataset.k = want;
      box.innerHTML = keys.map((k) => '<div class="dimrow"><label for="bd-' + k + '"><i>' + k + '</i> <span>' + GE.geom.dimName(o.solid, k) + '</span></label>' +
        '<input type="text" inputmode="decimal" id="bd-' + k + '" data-k="' + k + '"><span class="du">' + o.unit + '</span>' +
        '<input type="range" data-r="' + k + '" aria-label="' + GE.geom.dimName(o.solid, k) + '" min="' + (o.unit === 'm' ? 0.1 : 1) + '" max="' + (o.unit === 'm' ? 5 : 50) + '" step="' + (o.unit === 'm' ? 0.1 : 0.5) + '"></div>').join('');
    }
    keys.forEach((k) => {
      const inp = box.querySelector('[data-k="' + k + '"]');
      if (document.activeElement !== inp) inp.value = F(o.d[k], 4);
      box.querySelector('[data-r="' + k + '"]').value = o.d[k];
    });
    $('box-unit').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.unit));
    $('box-print-head').innerHTML = '<b>' + esc(o.prod || 'Nossa caixa') + '</b>' + (o.team ? ' · ' + esc(o.team) : '') + ' · ' + esc(GE.SOLIDS[o.solid].name);
  }
  const edit = (sub) => GE.patch('box', Object.assign({ model: '' }, sub));

  const mod = {
    defaults: DEF,
    sanitize,
    svgId: 'box-svg',
    name: () => 'Minha caixa · ' + (S().prod || ''),
    init() {
      view = G.viewer({ svg: $('box-svg'), prefix: 'box', cam0: { yaw: -32, pitch: 24 }, redraw: draw });
      $('box-solids').innerHTML = LIST.map((k) => '<button class="solid-btn" data-s="' + k + '">' + GE.icons.solid(k) + '<span>' + GE.SOLIDS[k].name + '</span></button>').join('');
      $('box-model').innerHTML = '<option value="">— escolha um modelo —</option>' + MODELS.map((m) => '<option value="' + m.id + '">' + esc(m.name) + '</option>').join('');
      $('box-solids').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) edit({ solid: b.dataset.s }); });
      $('box-model').addEventListener('change', (e) => {
        const m = MODELS.find((x) => x.id === e.target.value);
        if (m) GE.patch('box', { model: m.id, solid: m.solid, d: Object.assign({}, S().d, m.d), unit: m.unit, prod: m.name });
      });
      $('box-team').addEventListener('input', (e) => GE.patch('box', { team: e.target.value }));
      $('box-prod').addEventListener('input', (e) => GE.patch('box', { prod: e.target.value }));
      const box = $('box-dims');
      box.addEventListener('change', (e) => {
        const k = e.target.dataset.k;
        if (!k) return;
        const v = GE.parseNum(e.target.value);
        if (!(v > 0)) { e.target.classList.add('invalid'); return; }
        e.target.classList.remove('invalid');
        edit({ d: Object.assign({}, S().d, { [k]: v }) });
      });
      box.addEventListener('input', (e) => { const k = e.target.dataset.r; if (k) edit({ d: Object.assign({}, S().d, { [k]: Number(e.target.value) }) }); });
      $('box-unit').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ unit: b.dataset.v }); });
      $('box-to-vol').addEventListener('click', () => {
        const o = S();
        GE.set({ view: 'vol', vol: Object.assign({}, GE.state.vol, { solid: o.solid, d: Object.assign({}, GE.state.vol.d, o.d), unit: o.unit, ask: 'V', cap: true, obl: false, lying: false, q: '', step: 0 }) });
      });
      $('box-to-net').addEventListener('click', () => {
        const o = S();
        const solid = o.solid === 'quad' ? 'para' : o.solid;
        const d = Object.assign({}, GE.state.net.d, o.d);
        if (o.solid === 'quad') { d.c = o.d.a; d.L = o.d.a; }
        GE.set({ view: 'net', net: Object.assign({}, GE.state.net, { solid, d, unit: o.unit, q: '', step: 0 }) });
      });
      $('box-print').addEventListener('click', () => {
        document.body.classList.add('print-box');
        const done = () => { document.body.classList.remove('print-box'); window.removeEventListener('afterprint', done); };
        window.addEventListener('afterprint', done);
        window.print();
        setTimeout(done, 1500);
      });
      GE.on((changed) => {
        if (changed.includes('box')) { renderControls(); draw(); }
        if (changed.some((k) => ['pi', 'dec', 'hidden'].includes(k))) draw();
      });
      renderControls();
      draw();
    },
    render() { renderControls(); draw(); },
    redraw: draw,
    next() {}, prev() {}, first() {},
  };
  GE.register('box', mod);
})();
