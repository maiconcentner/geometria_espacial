/* Aba Capacidade: 1 L = 1 dm³, escada de unidades, latas (Atividade 9) e cisternas (Atividade 10). */
(function () {
  'use strict';
  const GE = window.GE;
  const G = GE.g3;
  const $ = (id) => document.getElementById(id);
  const F = (v, d) => GE.fmt(v, d);
  const ml = (s) => '<span class="mathline">' + s + '</span>';
  const I = (s) => '<i>' + s + '</i>';

  const UNITS = ['kL', 'hL', 'daL', 'L', 'dL', 'cL', 'mL'];
  const UNAME = { kL: 'quilolitro', hL: 'hectolitro', daL: 'decalitro', L: 'litro', dL: 'decilitro', cL: 'centilitro', mL: 'mililitro' };
  const LATAS = [{ d: 7, h: 15 }, { d: 5, h: 20 }, { d: 6, h: 11 }, { d: 6, h: 5 }, { d: 7, h: 3 }];
  const CIST = [{ d: 1.58, h: 1.81 }, { d: 2.24, h: 1.83 }, { d: 2.24, h: 3.22 }];

  const DEF = { mode: 'litro', step: 0, val: 2.5, from: 'L', to: 'mL', need: 350, folga: 10, people: 5, perDay: 154 };
  const S = () => GE.state.cap;
  function sanitize(o) {
    if (!['litro', 'escada', 'latas', 'cist'].includes(o.mode)) o.mode = 'litro';
    if (!UNITS.includes(o.from)) o.from = 'L';
    if (!UNITS.includes(o.to)) o.to = 'mL';
    o.val = GE.num(o.val, 2.5, 0, 1e9);
    o.need = GE.num(o.need, 350, 1, 1e6);
    o.folga = GE.num(o.folga, 10, 0, 90);
    o.people = Math.round(GE.num(o.people, 5, 1, 50));
    o.perDay = GE.num(o.perDay, 154, 1, 5000);
    o.step = Math.max(0, Math.round(Number(o.step) || 0));
    return o;
  }

  const volCyl = (d, h) => GE.piVal() * (d / 2) * (d / 2) * h;
  const piTxt = () => GE.piTxt();

  /* ---------- Passos ---------- */
  function steps() {
    const o = S();
    if (o.mode === 'litro') return stepsLitro();
    if (o.mode === 'escada') return stepsEscada(o);
    if (o.mode === 'latas') return stepsLatas(o);
    return stepsCist(o);
  }
  const BL = { n: 1, water: 0, big: 0 };
  function stepsLitro() {
    const sc = (p) => Object.assign({}, BL, p);
    return [
      { title: 'Um cubinho de 1 cm³', tag: 'volume e capacidade', body: '<p>Um cubo de 1 cm de aresta tem volume de <b>1 cm³</b>. Cheio de água, ele guarda <b>1 mL</b> (umas 20 gotas).</p>' + ml('1 cm³ = 1 mL'), scene: sc({}) },
      { title: 'Uma fileira', body: '<p>10 cubinhos lado a lado:</p>' + ml('10 cm³ = 10 mL'), scene: sc({ n: 10 }), dur: 1300 },
      { title: 'Uma placa', body: '<p>10 fileiras formam uma placa de 10 cm × 10 cm × 1 cm:</p>' + ml('100 cm³ = 100 mL'), scene: sc({ n: 100 }), dur: 1500 },
      { title: 'O cubo de 1 dm', body: '<p>10 placas empilhadas formam um cubo de 10 cm (1 dm) de aresta:</p>' + ml('10 · 10 · 10 = 1 000 cm³') + ml('1 dm³ = 1 000 cm³'), scene: sc({ n: 1000 }), dur: 2000 },
      { title: '1 dm³ = 1 L', body: '<p>Cheio de água, o cubo de 1 dm guarda exatamente <b>1 litro</b>: 1 000 mL.</p>' + ml('1 dm³ = 1 L = 1 000 mL'), scene: sc({ n: 1000, water: 1 }), dur: 1600 },
      { title: '1 m³ = 1 000 L', body: '<p>Um cubo de 1 m de aresta cabe 10 × 10 × 10 = 1 000 cubos de 1 dm. Cada um é 1 litro:</p>' + ml('1 m³ = 1 000 dm³ = 1 000 L') + '<p class="note">É o tamanho de uma caixa-d’água de 1 000 litros.</p>', scene: sc({ n: 1000, water: 1, big: 1 }), dur: 1600 },
    ];
  }
  function stepsEscada(o) {
    const i0 = UNITS.indexOf(o.from), i1 = UNITS.indexOf(o.to);
    const out = [];
    const cube = { mL: 'cm³', L: 'dm³', kL: 'm³' };
    const valAt = (i) => o.val * Math.pow(10, i - i0);
    out.push({ title: F(o.val, 6) + ' ' + o.from, tag: 'escada de unidades', body: '<p>Vamos transformar ' + F(o.val, 6) + ' ' + UNAME[o.from] + (o.val === 1 ? '' : 's') + ' em ' + UNAME[o.to] + 's.</p><p>Descendo um degrau (unidade menor), <b>multiplicamos por 10</b>; subindo, <b>dividimos por 10</b>.</p>', scene: { pos: i0, i0 } });
    const dir = i1 > i0 ? 1 : -1;
    for (let i = i0 + dir; dir > 0 ? i <= i1 : i >= i1; i += dir) {
      const prev = valAt(i - dir), cur = valAt(i);
      out.push({ title: (dir > 0 ? '× 10' : '÷ 10') + ' → ' + UNITS[i], body: ml(F(prev, 6) + ' ' + UNITS[i - dir] + ' = ' + F(prev, 6) + (dir > 0 ? ' · 10' : ' ÷ 10') + ' = ' + F(cur, 6) + ' ' + UNITS[i]), scene: { pos: i, i0 }, dur: 800 });
    }
    const fin = valAt(i1);
    let extra = '';
    if (cube[o.to]) extra = ml(F(fin, 6) + ' ' + o.to + ' = ' + F(fin, 6) + ' ' + cube[o.to]);
    out.push({ title: 'Resposta', body: ml(F(o.val, 6) + ' ' + o.from + ' = ' + F(fin, 6) + ' ' + o.to) + extra + '<p class="note">Andamos ' + Math.abs(i1 - i0) + ' degrau' + (Math.abs(i1 - i0) === 1 ? '' : 's') + ': ' + (dir > 0 ? 'multiplicamos' : 'dividimos') + ' por ' + F(Math.pow(10, Math.abs(i1 - i0)), 0) + '.</p>', scene: { pos: i1, i0, done: 1 } });
    return out;
  }
  function stepsLatas(o) {
    const sc = (p) => Object.assign({ hi: -1, tags: 0, w: 0, line: 0, verdict: 0 }, p);
    const V = LATAS.map((l) => volCyl(l.d, l.h));
    const out = [];
    out.push({ title: 'As latas', tag: 'Atividade 9', body: '<p>Calcule o volume de cada lata e a sua capacidade em mililitros. Considere π = ' + piTxt() + '.</p><p class="note">Nas figuras, a medida horizontal é o <b>diâmetro</b>: o raio é a metade.</p>', scene: sc({}) });
    LATAS.forEach((l, i) => {
      const r = l.d / 2;
      out.push({ title: 'Lata ' + (i + 1), body: ml(I('r') + ' = ' + F(l.d) + ' ÷ 2 = ' + F(r) + ' cm') + ml(I('V') + ' = π · ' + F(r) + '² · ' + F(l.h) + ' = π · ' + F(r * r) + ' · ' + F(l.h) + ' = π · ' + F(r * r * l.h)) + ml(I('V') + ' ' + GE.eqs(V[i]) + ' ' + F(V[i]) + ' cm³') + ml('Capacidade ≈ ' + F(V[i], 1) + ' mL'), scene: sc({ hi: i, tags: i + 1 }) });
    });
    const need = o.need, f = o.folga / 100;
    const ok = V.map((v) => need <= v * (1 - f) + 1e-9);
    const best = V.reduce((b, v, i) => (ok[i] && (b < 0 || v < V[b]) ? i : b), -1);
    out.push({ title: F(need) + ' mL em cada lata', body: '<p>Colocando ' + F(need) + ' mL de suco em cada lata: nas latas pequenas, o suco <b>transborda</b>.</p>', scene: sc({ tags: 5, w: 1 }), dur: 1800 });
    out.push({ title: 'Folga de ' + F(o.folga) + '%', body: '<p>Pelo menos ' + F(o.folga) + '% da lata deve ficar vazio para o líquido se expandir. Então o suco pode ocupar no máximo ' + F(100 - o.folga) + '% da capacidade (a linha tracejada).</p>' + ml(F(need) + ' mL ≤ ' + F(100 - o.folga) + '% da capacidade') + ml('capacidade ≥ ' + F(need) + ' ÷ ' + F(1 - f) + ' ' + GE.eqs(need / (1 - f)) + ' ' + F(need / (1 - f)) + ' mL'), scene: sc({ tags: 5, w: 1, line: 1 }) });
    out.push({ title: 'A lata mais apropriada', body: best < 0 ? '<p>Nenhuma lata serve com essa folga.</p>' : '<p>Servem as latas ' + ok.map((b, i) => (b ? i + 1 : null)).filter(Boolean).join(' e ') + '. A mais apropriada é a que sobra menos espaço: a <b>lata ' + (best + 1) + '</b>, de ' + F(V[best]) + ' mL.</p>' + ml(F(need) + ' + ' + F(o.folga) + '% de ' + F(V[best]) + ' = ' + F(need) + ' + ' + F(V[best] * f) + ' = ' + F(need + V[best] * f) + ' ≤ ' + F(V[best])), scene: sc({ tags: 5, w: 1, line: 1, verdict: 1, hi: best }) });
    return out;
  }
  function stepsCist(o) {
    const sc = (p) => Object.assign({ tags: 0, water: 0, liters: 0, days: 0, hi: -1 }, p);
    const V = CIST.map((c) => volCyl(c.d, c.h));
    const R2 = (v) => Math.round(v * 100) / 100; // o livro usa duas casas
    const out = [];
    out.push({ title: 'As cisternas', tag: 'Atividade 10', body: '<p>Três cisternas cilíndricas. Considere duas casas decimais e π = ' + piTxt() + '.</p><p class="note">A pessoa ao lado tem 1,70 m, para comparar os tamanhos.</p>', scene: sc({}) });
    CIST.forEach((c, i) => {
      const r = c.d / 2;
      out.push({ title: 'Cisterna ' + (i + 1), body: ml(I('V') + ' = π · (' + F(c.d) + ' ÷ 2)² · ' + F(c.h) + ' = π · ' + F(r, 4) + '² · ' + F(c.h)) + ml(I('V') + ' = ' + piTxt() + ' · ' + F(r * r, 4) + ' · ' + F(c.h) + ' ≈ ' + F(R2(V[i]), 2) + ' m³'), scene: sc({ tags: i + 1, hi: i }) });
    });
    out.push({ title: 'Capacidade', body: '<p>1 m³ = 1 000 dm³ = 1 000 L.</p>' + V.map((v, i) => ml('Cisterna ' + (i + 1) + ': ' + F(R2(v), 2) + ' m³ = ' + F(R2(v) * 1000, 0) + ' L')).join('') + (GE.state.pi === '3.14' ? '<p class="note">As respostas do livro (3,54; 7,20; 12,68 m³) cortam as casas decimais em vez de arredondar.</p>' : ''), scene: sc({ tags: 3, water: 1, liters: 1 }), dur: 1600 });
    const day = o.people * o.perDay;
    out.push({ title: 'Consumo da família', body: '<p>Cada pessoa gasta, em média, ' + F(o.perDay) + ' L de água por dia (40% a mais do que recomenda a OMS).</p>' + ml(F(o.people, 0) + ' · ' + F(o.perDay) + ' = ' + F(day) + ' L por dia'), scene: sc({ tags: 3, water: 1, liters: 1 }) });
    out.push({ title: 'Quantos dias?', body: V.map((v, i) => ml('Cisterna ' + (i + 1) + ': ' + F(R2(v) * 1000, 0) + ' ÷ ' + F(day) + ' ≈ ' + F(R2(v) * 1000 / day, 1) + ' dias')).join('') + '<p>Cada quadradinho embaixo das cisternas é um dia de água para a família.</p>', scene: sc({ tags: 3, water: 1, liters: 1, days: 1 }), dur: 1600 });
    out.push({ title: 'Para debater', body: '<p>O que cada um pode fazer no dia a dia para diminuir o consumo de água em casa?</p><p class="note">Sugestão do livro: a animação <i>Calango Lengo: morte e vida sem ver água</i> e a canção “Asa branca”.</p>', scene: sc({ tags: 3, water: 1, liters: 1, days: 1 }) });
    return out;
  }

  /* ---------- Desenho ---------- */
  let view = null;
  const COL = { solid: '#f2a15f', glass: '#d7e7f2', water: '#3d8fd6', can: '#c9d2da' };

  function glassCyl(cam, x, r, h, lvl, o) {
    o = o || {};
    let out = '';
    const T = (p) => [p[0] + x, p[1], p[2]];
    const m = G.xform(G.cylinder(r, h, [0, 0], 56), T);
    out += G.render(m, cam, { side: 'back', colors: { '*': o.col || COL.glass }, alpha: 0.6, edges: false }).faces;
    if (lvl > 1e-4) {
      const wm = G.xform(G.cylinder(r * 0.97, Math.min(lvl, h) * 0.995, [0, 0], 56), T);
      out += G.render(wm, cam, { colors: { '*': o.wcol || COL.water, top: '#71b3ea' }, alpha: 0.78, edges: false }).faces;
    }
    const fr = G.render(m, cam, { colors: { '*': o.col || COL.glass }, alpha: o.hi ? 0.28 : 0.2, hidden: GE.state.hidden, edgeCls: 'edge glass-edge' + (o.hi ? ' hi' : '') });
    out += fr.hidden + fr.faces + fr.edges;
    return out;
  }
  const tagAt = (cam, p, txt, cls, dy) => G.text(cam, p, txt, cls || 'tag3', 0, dy || 0);

  function draw(s) {
    const o = S();
    const svg = $('cap-svg');
    let out = '';
    if (o.mode === 'escada') out = drawEscada(o, s);
    else if (o.mode === 'litro') out = drawLitro(s);
    else if (o.mode === 'latas') out = drawLatas(o, s);
    else out = drawCist(o, s);
    svg.innerHTML = out;
  }

  function drawLitro(s) {
    let out = '';
    const n = Math.round(s.n);
    const small = 1 - s.big;
    if (small > 0.01) {
      const cam = G.cam(view.apply({ s: 25, cx: 470, cy: 280, center: [5, 5, 5] }));
      let g = '';
      // contorno do cubo de 1 dm
      const outline = G.box(0, 0, 0, 10, 10, 10);
      if (s.water > 0.01) {
        const bk = G.render(outline, cam, { side: 'back', colors: { '*': COL.glass }, alpha: 0.5, edges: false });
        g += bk.faces;
        const wm = G.box(0.1, 0, 0.1, 9.8, Math.max(0.01, 9.9 * s.water), 9.8);
        g += G.render(wm, cam, { colors: { '*': COL.water, top: '#71b3ea' }, alpha: 0.72 * s.water + 0.0, edges: false }).faces;
      }
      const L = Math.floor(n / 100), rem = n - 100 * L, R = Math.floor(rem / 10), c = rem - 10 * R;
      const boxes = [];
      if (L) boxes.push([0, 0, 0, 10, L, 10]);
      if (R) boxes.push([0, L, 0, 10, 1, R]);
      if (c) boxes.push([0, L, R, c, 1, 1]);
      const cubeA = 1 - s.water * 0.85;
      boxes.forEach((b) => {
        const m = G.box.apply(null, b);
        const r = G.render(m, cam, { colors: { '*': COL.solid }, alpha: cubeA, hidden: false });
        g += '<g opacity="' + cubeA.toFixed(2) + '">' + r.faces + G.boxGrid(cam, b[0], b[1], b[2], b[3], b[4], b[5], 1) + r.edges + '</g>';
      });
      const ol = G.render(outline, cam, { colors: () => null, hidden: true, edgeCls: 'edge-ghost', hiddenCls: 'edge-ghost' });
      g += ol.hidden + ol.edges;
      g += G.dimLabel(cam, [0, 0, 10], [10, 0, 10], [5, 5, 5], '10 cm = 1 dm', 'dim3', 26);
      g += G.dimLabel(cam, [10, 0, 10], [10, 10, 10], [5, 5, 5], '10 cm', 'dim3', 20);
      out += '<g opacity="' + small.toFixed(2) + '">' + g + '</g>';
      out += '<text class="bigcount" x="840" y="130" text-anchor="middle" opacity="' + small.toFixed(2) + '">' + F(n, 0) + '</text><text class="bigcount-sub" x="840" y="170" text-anchor="middle" opacity="' + small.toFixed(2) + '">' + (n === 1 ? 'cubinho de 1 cm³' : 'cubinhos de 1 cm³') + '</text>';
      out += '<text class="bigcount-sub" x="840" y="205" text-anchor="middle" opacity="' + small.toFixed(2) + '">= ' + F(n, 0) + ' mL' + (n === 1000 ? ' = 1 L' : '') + '</text>';
    }
    if (s.big > 0.01) {
      const cam = G.cam(view.apply({ s: 27, cx: 470, cy: 280, center: [5, 5, 5] }));
      let g = '';
      const m = G.box(0, 0, 0, 10, 10, 10);
      const r = G.render(m, cam, { colors: { '*': '#9fc8ec' }, hidden: false });
      g += r.faces + G.boxGrid(cam, 0, 0, 0, 10, 10, 10, 1) + r.edges;
      const one = G.box(0, 9, 9, 1, 1, 1);
      g += G.render(one, cam, { colors: { '*': COL.solid } }).faces + G.render(one, cam, { colors: () => null, edgeCls: 'edge hi' }).edges;
      g += G.text(cam, [0.5, 10.2, 9.5], '1 L', 'tag3 hi', 0, -16);
      g += G.dimLabel(cam, [0, 0, 10], [10, 0, 10], [5, 5, 5], '1 m = 10 dm', 'dim3', 26);
      out += '<g opacity="' + s.big.toFixed(2) + '">' + g + '</g>';
      out += '<text class="bigcount" x="840" y="130" text-anchor="middle" opacity="' + s.big.toFixed(2) + '">1 000</text><text class="bigcount-sub" x="840" y="170" text-anchor="middle" opacity="' + s.big.toFixed(2) + '">cubos de 1 dm³</text><text class="bigcount-sub" x="840" y="205" text-anchor="middle" opacity="' + s.big.toFixed(2) + '">= 1 000 L = 1 m³</text>';
    }
    return out;
  }

  function drawEscada(o, s) {
    let out = '';
    const x0 = 70, y0 = 90, w = 118, dh = 50;
    const i0 = s.i0 == null ? UNITS.indexOf(o.from) : s.i0;
    UNITS.forEach((u, i) => {
      const x = x0 + i * w, y = y0 + i * dh;
      const cur = Math.abs(s.pos - i) < 0.5;
      out += '<rect class="stair' + (cur ? ' cur' : '') + '" x="' + x + '" y="' + y + '" width="' + (w - 6) + '" height="' + (460 - y) + '" rx="6"/>';
      out += '<text class="stair-u' + (cur ? ' cur' : '') + '" x="' + (x + w / 2 - 3) + '" y="' + (y + 32) + '" text-anchor="middle">' + u + '</text>';
      out += '<text class="stair-n" x="' + (x + w / 2 - 3) + '" y="' + (y + 56) + '" text-anchor="middle">' + UNAME[u] + '</text>';
    });
    UNITS.forEach((u, i) => {
      if (i === UNITS.length - 1) return;
      const x = x0 + i * w;
      out += '<g class="opchip"><rect x="' + (x + w - 36) + '" y="420" width="66" height="42" rx="8"/>' +
        '<text class="stair-op" x="' + (x + w - 3) + '" y="437" text-anchor="middle">× 10 →</text>' +
        '<text class="stair-op inv" x="' + (x + w - 3) + '" y="455" text-anchor="middle">← ÷ 10</text></g>';
    });
    // equivalências com o volume
    const eq = { 0: 'm³', 3: 'dm³', 6: 'cm³' };
    Object.keys(eq).forEach((k) => {
      const x = x0 + Number(k) * w + w / 2 - 3;
      out += '<text class="stair-eq" x="' + x + '" y="495" text-anchor="middle">= 1 ' + eq[k] + '</text>';
    });
    // marcador com o valor
    const pos = s.pos;
    const x = x0 + pos * w + w / 2 - 3, y = y0 + pos * dh - 34;
    const iv = Math.round(pos);
    const v = o.val * Math.pow(10, iv - i0);
    const txt = F(v, 6) + ' ' + UNITS[iv];
    out += '<g class="marker"><rect x="' + G.f1(x - 70) + '" y="' + G.f1(y - 24) + '" width="140" height="36" rx="18"/><text x="' + G.f1(x) + '" y="' + G.f1(y) + '" text-anchor="middle" dominant-baseline="middle">' + txt + '</text></g>';
    return out;
  }

  function lineup(items, gap) {
    const tot = items.reduce((a, it) => a + it.d, 0) + gap * (items.length - 1);
    let x = -tot / 2;
    return items.map((it) => { const c = x + it.d / 2; x += it.d + gap; return c; });
  }
  function drawLatas(o, s) {
    let out = '';
    const xs = lineup(LATAS, 4);
    const cam = G.cam(view.apply({ s: 17, cx: 500, cy: 300, center: [0, 8, 0] }));
    const V = LATAS.map((l) => volCyl(l.d, l.h));
    const f = o.folga / 100;
    out += '<ellipse class="shadow3" cx="500" cy="' + G.f1(cam.p([0, 0, 0])[1] + 10) + '" rx="440" ry="40"/>';
    LATAS.forEach((l, i) => {
      const r = l.d / 2;
      const want = s.w * o.need / (GE.piVal() * r * r);
      const over = want > l.h + 1e-9;
      const okF = o.need <= V[i] * (1 - f) + 1e-9;
      const hi = Math.round(s.hi) === i;
      out += glassCyl(cam, xs[i], r, l.h, Math.min(want, l.h), { hi, wcol: over && s.w > 0.99 ? '#d9534f' : COL.water });
      if (s.line > 0.01) {
        const yl = l.h * (1 - f);
        const pts = G.circlePts(r * 1.01, 40).map((p) => [p[0] + xs[i], yl, p[1]]);
        out += '<g opacity="' + s.line.toFixed(2) + '">' + G.poly(cam, pts, 'folga') + '</g>';
      }
      const top = [xs[i], l.h, 0];
      out += G.text(cam, [xs[i], 0, r], 'd = ' + F(l.d) + ' cm', 'dim3 small', 0, 22);
      out += G.text(cam, [xs[i] + r, l.h / 2, 0], F(l.h) + ' cm', 'dim3 small', 8, 0, 'start');
      out += G.text(cam, top, 'Lata ' + (i + 1), 'tag3' + (hi ? ' hi' : ''), 0, -52);
      if (s.tags > i + 0.5) out += G.text(cam, top, '≈ ' + F(V[i], 1) + ' mL', 'tag3 val', 0, -30);
      if (over && s.w > 0.99) out += G.text(cam, [xs[i], 0, r], 'transborda', 'tag3 bad', 0, 46) + G.text(cam, [xs[i], 0, r], F(o.need - V[i], 0) + ' mL', 'tag3 bad', 0, 66);
      else if (s.line > 0.5) out += G.text(cam, [xs[i], 0, r], okF ? '✓ serve' : '✗ sem folga', 'tag3 ' + (okF ? 'ok' : 'bad'), 0, 46);
      if (s.verdict > 0.5 && hi) out += G.text(cam, [xs[i], 0, r], 'a mais apropriada', 'tag3 ok', 0, 70);
    });
    return out;
  }

  function person(cam, x) {
    const P = (p) => cam.p([x + p[0], p[1], 0]);
    const head = P([0, 1.58]);
    const a = P([0, 1.45]), b = P([0, 0.85]);
    const l1 = P([-0.15, 0]), l2 = P([0.15, 0]), h1 = P([-0.28, 1.0]), h2 = P([0.28, 1.0]), sh = P([0, 1.35]);
    const r = Math.abs(P([0, 1.7])[1] - P([0, 1.58])[1]);
    const L = (p, q) => 'M' + G.f1(p[0]) + ' ' + G.f1(p[1]) + 'L' + G.f1(q[0]) + ' ' + G.f1(q[1]);
    return '<g class="person"><circle cx="' + G.f1(head[0]) + '" cy="' + G.f1(head[1]) + '" r="' + G.f1(r) + '"/><path d="' + L(a, b) + L(b, l1) + L(b, l2) + L(sh, h1) + L(sh, h2) + '"/></g>' +
      G.text(cam, [x, 0, 0], '1,70 m', 'dim3 small', 0, 20);
  }
  function drawCist(o, s) {
    let out = '';
    const items = CIST.concat([{ d: 0.6, h: 1.7, person: true }]);
    const xs = lineup(items, 0.9);
    const cam = G.cam(view.apply({ s: 88, cx: 500, cy: 300, center: [0, 1.4, 0] }));
    const V = CIST.map((c) => volCyl(c.d, c.h));
    const R2 = (v) => Math.round(v * 100) / 100;
    const day = o.people * o.perDay;
    out += '<ellipse class="shadow3" cx="500" cy="' + G.f1(cam.p([0, 0, 0])[1] + 10) + '" rx="440" ry="42"/>';
    items.forEach((c, i) => {
      if (c.person) { out += person(cam, xs[i]); return; }
      const r = c.d / 2;
      const hi = Math.round(s.hi) === i;
      out += glassCyl(cam, xs[i], r, c.h, c.h * 0.96 * s.water, { hi });
      const top = [xs[i], c.h, 0];
      out += G.text(cam, [xs[i], 0, r], 'd = ' + F(c.d) + ' m', 'dim3 small', 0, 22);
      out += G.text(cam, [xs[i] + r, c.h / 2, 0], F(c.h) + ' m', 'dim3 small', 8, 0, 'start');
      out += G.text(cam, top, 'Cisterna ' + (i + 1), 'tag3' + (hi ? ' hi' : ''), 0, -56);
      if (s.tags > i + 0.5) out += G.text(cam, top, (s.liters > 0.5 ? F(R2(V[i]) * 1000, 0) + ' L' : '≈ ' + F(R2(V[i]), 2) + ' m³'), 'tag3 val', 0, -32);
      if (s.days > 0.01) {
        const nd = R2(V[i]) * 1000 / day;
        const full = Math.floor(nd);
        const q = cam.p([xs[i], 0, r]);
        const per = 8, size = 13;
        let g = '';
        for (let k = 0; k < Math.ceil(nd); k++) {
          const col = k % per, row = Math.floor(k / per);
          const x = q[0] - (per * (size + 3)) / 2 + col * (size + 3);
          const y = q[1] + 40 + row * (size + 3);
          const part = k < full ? 1 : nd - full;
          g += '<rect class="day" x="' + G.f1(x) + '" y="' + G.f1(y) + '" width="' + G.f1(size * part) + '" height="' + size + '" rx="2"/>';
        }
        g += '<text class="tag3" x="' + G.f1(q[0]) + '" y="' + G.f1(q[1] + 40 + (Math.ceil(nd / per)) * (size + 3) + 14) + '" text-anchor="middle">≈ ' + F(nd, 1) + ' dias</text>';
        out += '<g opacity="' + s.days.toFixed(2) + '">' + g + '</g>';
      }
    });
    return out;
  }

  /* ---------- Controles ---------- */
  let stp = null;
  function renderControls() {
    const o = S();
    $('cap-mode').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.mode));
    $('cap-esc').hidden = o.mode !== 'escada';
    $('cap-lat').hidden = o.mode !== 'latas';
    $('cap-cis').hidden = o.mode !== 'cist';
    $('cap-viewbar').hidden = o.mode === 'escada';
    $('cap-svg').classList.toggle('flat', o.mode === 'escada');
    const TITLES = { litro: '1 litro = 1 dm³', escada: 'Escada das unidades de capacidade', latas: 'Latas de suco (Atividade 9)', cist: 'Cisternas (Atividade 10)' };
    $('cap-name').textContent = TITLES[o.mode];
    const set = (id, v) => { if (document.activeElement !== $(id)) $(id).value = v; };
    set('cap-val', F(o.val, 6)); $('cap-from').value = o.from; $('cap-to').value = o.to;
    set('cap-need', F(o.need)); set('cap-folga', F(o.folga));
    set('cap-people', o.people); set('cap-perday', F(o.perDay));
  }
  const edit = (sub) => GE.patch('cap', Object.assign({ step: 0 }, sub));
  function setHome() {
    const m = S().mode;
    view.home(m === 'latas' || m === 'cist' ? { yaw: -6, pitch: 14 } : { yaw: -30, pitch: 22 });
  }

  const mod = {
    defaults: DEF,
    sanitize,
    svgId: 'cap-svg',
    name: () => 'Capacidade · ' + ({ litro: '1 L = 1 dm³', escada: 'escada', latas: 'latas', cist: 'cisternas' })[S().mode],
    init() {
      view = G.viewer({ svg: $('cap-svg'), prefix: 'cap', cam0: { yaw: -30, pitch: 22 }, redraw: () => stp && stp.redraw(), locked: () => S().mode === 'escada' });
      stp = GE.stepper({
        prefix: 'cap', steps, draw,
        getIndex: () => S().step,
        setIndex: (i) => GE.set({ cap: Object.assign({}, S(), { step: i }) }, { quiet: true }),
      });
      stp.bind();
      $('cap-from').innerHTML = $('cap-to').innerHTML = UNITS.map((u) => '<option value="' + u + '">' + u + ' (' + UNAME[u] + ')</option>').join('');
      $('cap-mode').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ mode: b.dataset.v }); });
      const num = (id, key, int) => $(id).addEventListener('change', (e) => {
        const v = GE.parseNum(e.target.value);
        if (!(v >= 0)) { e.target.classList.add('invalid'); return; }
        e.target.classList.remove('invalid');
        edit({ [key]: int ? Math.round(v) : v });
      });
      num('cap-val', 'val'); num('cap-need', 'need'); num('cap-folga', 'folga'); num('cap-people', 'people', true); num('cap-perday', 'perDay');
      $('cap-from').addEventListener('change', (e) => edit({ from: e.target.value }));
      $('cap-to').addEventListener('change', (e) => edit({ to: e.target.value }));
      $('cap-swap').addEventListener('click', () => { const o = S(); edit({ from: o.to, to: o.from }); });
      GE.on((changed, prev, opts) => {
        if (changed.includes('cap') && !opts.quiet) {
          const a = prev.cap || {}, b = S();
          const onlyStep = Object.keys(b).every((k) => k === 'step' || JSON.stringify(a[k]) === JSON.stringify(b[k]));
          if (a.mode !== b.mode) setHome();
          if (!onlyStep) { renderControls(); stp.rebuild(false); } else if (GE.state.view === 'cap') stp.rebuild(true);
        }
        if (changed.some((k) => ['pi', 'dec', 'hidden'].includes(k))) stp.rebuild(false);
      });
      setHome();
      renderControls();
      stp.rebuild(false);
    },
    render() { renderControls(); stp.rebuild(false); },
    redraw() { stp.redraw(); },
    next() { stp.next(); }, prev() { stp.prev(); }, first() { stp.first(); },
    stepper: () => stp,
  };
  GE.register('cap', mod);
})();
