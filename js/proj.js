/* Aba Projeções e vistas: projeção ortogonal (segmento, círculo, sólidos nos planos) e vistas ortográficas. */
(function () {
  'use strict';
  const GE = window.GE;
  const G = GE.g3;
  const $ = (id) => document.getElementById(id);
  const F = (v, d) => GE.fmt(v, d);
  const esc = GE.esc;
  const ml = (s) => '<span class="mathline">' + s + '</span>';

  /* ---------- Objetos ---------- */
  const PL = { X: 3, Z: 3, Y: 4.4 }; // planos: α (chão y = 0), β (fundo z = −Z), γ (lado x = −X)
  function hull(pts) {
    const p = pts.map((q, i) => [q[0], q[1], i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    p.forEach((q) => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-12) lo.pop(); lo.push(q); });
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 1e-12) up.pop(); up.push(q); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  const move = (m, d) => G.xform(m, (p) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]]);
  function halfDisk(R, t, n) {
    // chaveta meia-lua: semicírculo no plano xy (lado reto em cima), espessura t em z
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = Math.PI + (Math.PI * i) / n; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
    const base = pts.map((p) => [p[0], p[1]]);
    const m = G.prism(base, t, [0, 0], { smooth: true, featureAngle: 30 });
    // prisma "deitado": o perfil fica no plano xy e a espessura em z
    const out = G.xform(m, (p) => [p[0], p[2], p[1] - t / 2]);
    out.center = [0, -0.42 * R, 0]; // centro de verdade (o do prisma cai sobre a face reta)
    return G.prep(out);
  }
  function house() {
    const prof = [[-1, 0], [1, 0], [1, 1.1], [0, 1.9], [-1, 1.1]]; // pentágono (x, y)
    const m = G.prism(prof.map((p) => [p[0], p[1]]), 1.6);
    return G.xform(m, (p) => [p[0], p[2], p[1] - 0.8]);
  }
  function cone(r, h) {
    const m = G.revolve([[0, 0], [r, 0], [0, h]], Math.PI * 2, 56);
    return m;
  }
  function triPrism() {
    const m = G.prism([[-1, 0.7], [1, 0.7], [-1, -0.7]], 1.4);
    return m;
  }

  /* Pilha de cubos: alturas numa grade 4 × 4 (linha = z, coluna = x). */
  function voxels(H) {
    const V = [], Fc = [], key = new Map();
    const vid = (x, y, z) => { const k = x + ',' + y + ',' + z; if (!key.has(k)) { key.set(k, V.length); V.push([x, y, z]); } return key.get(k); };
    const at = (i, j, k) => i >= 0 && i < 4 && k >= 0 && k < 4 && j >= 0 && j < (H[k][i] || 0);
    const quad = (pts, out) => Fc.push({ v: pts.map((p) => vid(p[0], p[1], p[2])), part: 'box', out });
    for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) for (let j = 0; j < (H[k][i] || 0); j++) {
      const x = i - 2, y = j, z = k - 2;
      if (!at(i, j + 1, k)) quad([[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], [0, 1, 0]);
      if (!at(i, j - 1, k)) quad([[x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z]], [0, -1, 0]);
      if (!at(i + 1, j, k)) quad([[x + 1, y, z], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z]], [1, 0, 0]);
      if (!at(i - 1, j, k)) quad([[x, y, z], [x, y + 1, z], [x, y + 1, z + 1], [x, y, z + 1]], [-1, 0, 0]);
      if (!at(i, j, k + 1)) quad([[x, y, z + 1], [x, y + 1, z + 1], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], [0, 0, 1]);
      if (!at(i, j, k - 1)) quad([[x, y, z], [x + 1, y, z], [x + 1, y + 1, z], [x, y + 1, z]], [0, 0, -1]);
    }
    return G.prep({ V, F: Fc, convex: false, featureAngle: 10 });
  }
  function parsePile(s) {
    const a = String(s || '').split('').map((c) => Math.max(0, Math.min(4, Number(c) || 0)));
    while (a.length < 16) a.push(0);
    return [0, 1, 2, 3].map((k) => a.slice(k * 4, k * 4 + 4));
  }

  /* Dado: faces opostas somam 7. Frente 5, trás 2, esquerda 4, direita 3, baixo 6, cima 1. */
  function dice() {
    const m = G.box(-1, -1, -1, 2, 2, 2);
    const V = [], Fc = [];
    const PIPS = { 1: [[0, 0]], 2: [[-1, 1], [1, -1]], 3: [[-1, 1], [0, 0], [1, -1]], 4: [[-1, 1], [1, 1], [-1, -1], [1, -1]], 5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]], 6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]] };
    const faces = [
      { n: 5, c: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, { n: 2, c: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
      { n: 4, c: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] }, { n: 3, c: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
      { n: 1, c: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] }, { n: 6, c: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    ];
    faces.forEach((f) => {
      PIPS[f.n].forEach((q) => {
        const cen = G.add(G.mul(f.c, 1.004), G.add(G.mul(f.u, q[0] * 0.5), G.mul(f.v, q[1] * 0.5)));
        const k0 = V.length;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          V.push(G.add(cen, G.add(G.mul(f.u, 0.17 * Math.cos(a)), G.mul(f.v, 0.17 * Math.sin(a)))));
        }
        Fc.push({ v: Array.from({ length: 12 }, (_, i) => k0 + i), part: 'pip' });
      });
    });
    // as bolinhas vão numa malha própria, desenhada depois do cubo (o dado é convexo)
    m.pips = G.prep({ V, F: Fc, convex: true, center: [0, 0, 0] });
    m.dice = true;
    return m;
  }
  const OBJS = {
    dado: { name: 'Dado', book: 'Atividade 15', make: () => dice(), all6: true },
    chaveta: { name: 'Chaveta meia-lua', book: 'Atividade 14', make: () => halfDisk(1.4, 0.7, 36) },
    casa: { name: 'Casinha', book: 'Explorar', make: () => house() },
    cil: { name: 'Cilindro', book: 'Explorar', make: () => G.cylinder(1, 1.8, [0, 0], 56) },
    cone: { name: 'Cone', book: 'Explorar', make: () => cone(1.1, 2) },
    tri: { name: 'Prisma triangular', book: 'Explorar', make: () => triPrism() },
    pilha: { name: 'Pilha de cubos', book: 'Montar', make: (o) => voxels(parsePile(o.pile)), voxel: true },
  };
  const PSOL = {
    cil: { name: 'Cilindro', book: 'Atividade 13a', make: () => G.cylinder(0.9, 1.7, [0, 0], 56) },
    para: { name: 'Paralelepípedo', book: 'Atividade 13b', make: () => G.box(-0.6, 0, -0.5, 1.2, 2.1, 1.0) },
    cone: { name: 'Cone', book: 'Explorar', make: () => cone(0.95, 1.9) },
    tri: { name: 'Prisma triangular', book: 'Explorar', make: () => triPrism() },
    chaveta: { name: 'Chaveta meia-lua', book: 'Atividade 14', make: () => move(halfDisk(1.2, 0.6, 30), [0, 1.2, 0]) },
  };

  const VIEWS = {
    frente: { name: 'Vista frontal', yaw: 0, pitch: 0 },
    cima: { name: 'Vista superior', yaw: 0, pitch: 90 },
    esq: { name: 'Vista lateral esquerda', yaw: 90, pitch: 0 },
    dir: { name: 'Vista lateral direita', yaw: -90, pitch: 0 },
    tras: { name: 'Vista posterior', yaw: 180, pitch: 0 },
    baixo: { name: 'Vista inferior', yaw: 0, pitch: -90 },
  };

  const DEF = { mode: 'vistas', step: 0, ang: 30, cang: 50, psol: 'cil', gamma: false, obj: 'dado', six: true, pile: '3210221011000000' };
  const S = () => GE.state.proj;
  function sanitize(o) {
    if (!['seg', 'circ', 'planos', 'vistas'].includes(o.mode)) o.mode = 'vistas';
    if (!PSOL[o.psol]) o.psol = 'cil';
    if (!OBJS[o.obj]) o.obj = 'dado';
    o.ang = GE.num(o.ang, 30, 0, 90); o.cang = GE.num(o.cang, 50, 0, 90);
    o.gamma = !!o.gamma; o.six = o.six !== false;
    o.pile = String(o.pile || '').replace(/[^0-4]/g, '').slice(0, 16).padEnd(16, '0');
    o.step = Math.max(0, Math.round(Number(o.step) || 0));
    return o;
  }

  /* ---------- Passos ---------- */
  function steps() {
    const o = S();
    if (o.mode === 'seg') return stepsSeg(o);
    if (o.mode === 'circ') return stepsCirc(o);
    if (o.mode === 'planos') return stepsPlanos(o);
    return stepsVistas(o);
  }
  function stepsSeg(o) {
    const sc = (p) => Object.assign({ t: o.ang, da: 0, db: 0, pr: 0 }, p);
    return [
      { title: 'Segmento e plano', tag: 'Organizando as ideias', body: '<p>Um segmento ' + seg('AB') + ' fora do plano α.</p><p><b>Ortogonal</b> quer dizer <b>perpendicular</b>: que forma 90°.</p>', scene: sc({}) },
      { title: 'Projetar o ponto A', body: '<p>Do ponto A, descemos uma reta perpendicular ao plano. Onde ela toca o plano está A′, a projeção de A.</p>', scene: sc({ da: 1 }), dur: 1100 },
      { title: 'Projetar o ponto B', body: '<p>Do mesmo jeito, B vai para B′.</p>', scene: sc({ da: 1, db: 1 }), dur: 1100 },
      { title: 'A projeção do segmento', body: '<p>O segmento ' + seg('A′B′') + ' é a <b>projeção ortogonal</b> de ' + seg('AB') + ' sobre o plano α.</p><p class="note">Pense na sombra de um lápis com o sol a pino.</p>', scene: sc({ da: 1, db: 1, pr: 1 }) },
      { title: 'Segmento perpendicular ao plano', body: '<p>Se ' + seg('AB') + ' fica perpendicular ao plano, A e B caem no mesmo lugar: a projeção é um <b>ponto</b>.</p>', scene: sc({ t: 90, da: 1, db: 1, pr: 1 }), dur: 1500 },
      { title: 'Segmento paralelo ao plano', body: '<p>Se ' + seg('AB') + ' fica paralelo ao plano, a projeção tem o <b>mesmo comprimento</b> do segmento.</p>', scene: sc({ t: 0, da: 1, db: 1, pr: 1 }), dur: 1500 },
      { title: 'Explorar', body: '<p>Use o controle <b>Inclinação</b> ao lado: quanto mais inclinado, mais curta fica a projeção.</p>', scene: sc({ da: 1, db: 1, pr: 1 }), dur: 700 },
    ];
  }
  const seg = (t) => '<span class="ovl">' + t + '</span>';
  function stepsCirc(o) {
    const sc = (p) => Object.assign({ t: 0, pl: 0, pr: 0 }, p);
    return [
      { title: 'Círculo paralelo ao plano', tag: 'Atividade 12', body: '<p>Qual é o formato da projeção ortogonal de um círculo? Discutam antes de avançar.</p>', scene: sc({}) },
      { title: 'Projeção: um círculo igual', body: '<p>Paralelo ao plano, cada ponto desce a mesma distância: a projeção é um <b>círculo de mesmo diâmetro</b>.</p>', scene: sc({ pl: 1, pr: 1 }), dur: 1100 },
      { title: 'Inclinando o círculo', body: '<p>Inclinado, o círculo fica “achatado” na projeção: vira uma <b>elipse</b>.</p>', scene: sc({ t: 45, pl: 1, pr: 1 }), dur: 1300 },
      { title: 'Mais inclinado', body: '<p>Quanto mais inclinado, mais estreita a elipse. A largura continua igual ao diâmetro.</p>', scene: sc({ t: 75, pl: 1, pr: 1 }), dur: 1100 },
      { title: 'Perpendicular ao plano', body: '<p>Em pé, perpendicular ao plano, a projeção é um <b>segmento de reta</b> com a mesma medida do diâmetro.</p>', scene: sc({ t: 90, pl: 1, pr: 1 }), dur: 1100 },
      { title: 'Explorar', body: '<p>Use o controle <b>Inclinação</b> ao lado. Experimente com uma lanterna e um objeto redondo, como sugere o livro.</p>', scene: sc({ t: o.cang, pl: 1, pr: 1 }), dur: 700 },
    ];
  }
  function stepsPlanos(o) {
    const P = PSOL[o.psol];
    const sc = (p) => Object.assign({ a: 0, b: 0, c: 0 }, p);
    const shp = shapesOf(o.psol);
    const out = [
      { title: P.name + ' e os planos', tag: P.book, body: '<p>Os planos α (chão) e β (parede) são perpendiculares. As bases do sólido estão paralelas a α.</p><p>Como fica a projeção em cada plano? Desenhem antes de avançar.</p>', scene: sc({}) },
      { title: 'Projeção sobre α', body: '<p>As linhas de projeção descem perpendiculares ao plano α. A projeção é ' + shp.a + '.</p>', scene: sc({ a: 1 }), dur: 1400 },
      { title: 'Projeção sobre β', body: '<p>Agora perpendiculares ao plano β: a projeção é ' + shp.b + '.</p>', scene: sc({ a: 1, b: 1 }), dur: 1400 },
    ];
    if (o.gamma) out.push({ title: 'Projeção sobre γ', body: '<p>No terceiro plano, γ: ' + shp.c + '.</p>', scene: sc({ a: 1, b: 1, c: 1 }), dur: 1400 });
    out.push({ title: 'Conclusões', body: '<p>A imagem de cada projeção depende de qual face do sólido está <b>paralela</b> ao plano. As linhas de projeção (tracejadas) são sempre perpendiculares ao plano.</p><p class="note">Na sala: a sombra de uma latinha, com uma lanterna, sobre a mesa e sobre a parede.</p>', scene: sc({ a: 1, b: 1, c: o.gamma ? 1 : 0 }) });
    return out;
  }
  function shapesOf(k) {
    return {
      cil: { a: 'um <b>círculo</b> (do tamanho da base)', b: 'um <b>retângulo</b> (altura × diâmetro)', c: 'também um <b>retângulo</b>' },
      para: { a: 'um <b>retângulo</b> igual à base', b: 'um <b>retângulo</b> igual à face da frente', c: 'um <b>retângulo</b> igual à face do lado' },
      cone: { a: 'um <b>círculo</b>', b: 'um <b>triângulo</b> isósceles', c: 'também um <b>triângulo</b>' },
      tri: { a: 'um <b>triângulo</b>', b: 'um <b>retângulo</b>', c: 'um <b>retângulo</b>' },
      chaveta: { a: 'um <b>retângulo</b>', b: 'um <b>semicírculo</b>', c: 'um <b>retângulo</b>' },
    }[k];
  }
  function viewList(o) {
    if (o.obj === 'dado') return ['frente', 'esq', 'baixo', 'dir', 'cima', 'tras'];
    return o.six ? ['frente', 'cima', 'esq', 'dir', 'tras', 'baixo'] : ['frente', 'cima', 'esq'];
  }
  function stepsVistas(o) {
    const O = OBJS[o.obj];
    const list = viewList(o);
    const out = [];
    const sc = (p) => Object.assign({ vw: 0, vy: 0, vp: 0, n: 0, q: 0 }, p);
    const dice = o.obj === 'dado';
    out.push({ title: O.name, tag: O.book, body: dice
      ? '<p>No dado, as faces opostas <b>somam sempre 7</b>. Cada face é vista de frente numa das <b>vistas ortográficas</b>.</p>'
      : '<p><b>Vistas ortográficas</b> são as projeções ortogonais do objeto, olhando de frente para cada lado. São a base do <b>desenho técnico</b>.</p>' + (O.voxel ? '<p class="note">Monte a pilha tocando na grade ao lado.</p>' : ''), scene: sc({}) });
    const ASK = { dir: 3, cima: 1, tras: 2 };
    list.forEach((k, i) => {
      const V = VIEWS[k];
      const cam = { vw: 1, vy: V.yaw, vp: V.pitch };
      if (dice && ASK[k]) {
        const opp = { dir: 'esquerda (4)', cima: 'inferior (6)', tras: 'frontal (5)' }[k];
        out.push({ title: V.name + ': qual número?', tag: 'Atividade 15', body: '<p>A face oposta é a ' + opp + '. Qual número aparece?</p>', scene: sc({ n: i, q: 1 }) });
        out.push({ title: V.name + ': ' + ASK[k], body: '<p>7 − ' + (7 - ASK[k]) + ' = <b>' + ASK[k] + '</b>.</p>', scene: sc(Object.assign({ n: i + 1 }, cam)), dur: 1200 });
      } else {
        const given = dice ? '<p>O livro diz: ' + V.name.toLowerCase() + ' = ' + { frente: 5, esq: 4, baixo: 6 }[k] + '.</p>' : '<p>' + viewHint(o.obj, k) + '</p>';
        out.push({ title: V.name, body: '<p>Olhamos de frente para esse lado, com as linhas de projeção perpendiculares.</p>' + given, scene: sc(Object.assign({ n: i + 1 }, cam)), dur: 1200 });
      }
    });
    out.push({ title: 'As vistas juntas', body: dice ? '<p>Vista lateral direita: <b>3</b>; vista superior: <b>1</b>; vista posterior: <b>2</b>.</p>' : '<p>Com as vistas, dá para fabricar a peça sem vê-la. As arestas escondidas aparecem <b>tracejadas</b>.</p>' + (o.obj === 'chaveta' ? '<p>Chaveta: dois <b>semicírculos</b> (frente e trás), um <b>retângulo</b> (em cima) e retângulos menores olhando para a superfície curva.</p>' : ''), scene: sc({ n: list.length }) });
    return out;
  }
  function viewHint(obj, k) {
    const H = {
      chaveta: { frente: 'De frente, a chaveta é um semicírculo.', cima: 'De cima, vemos o lado reto: um retângulo.', esq: 'Do lado, a parte curva aparece como um retângulo menor.', dir: 'Do outro lado, outro retângulo.', tras: 'De trás, outro semicírculo.', baixo: 'De baixo, a superfície curva: um retângulo.' },
      casa: { frente: 'De frente, um pentágono: a fachada com o telhado.', cima: 'De cima, um retângulo dividido pela cumeeira do telhado.', esq: 'Do lado, um retângulo com a linha do beiral.' },
      cil: { frente: 'De frente, um retângulo.', cima: 'De cima, um círculo.', esq: 'Do lado, também um retângulo.' },
      cone: { frente: 'De frente, um triângulo.', cima: 'De cima, um círculo com o vértice no centro.', esq: 'Do lado, um triângulo.' },
      tri: { frente: 'De frente, um retângulo.', cima: 'De cima, um triângulo.', esq: 'Do lado, um retângulo.' },
      pilha: { frente: 'De frente, contamos a coluna mais alta de cada fileira.', cima: 'De cima, vemos quais quadradinhos da grade têm cubos.', esq: 'Do lado esquerdo, a coluna mais alta de cada fileira de trás para a frente.' },
    };
    return (H[obj] && H[obj][k]) || '';
  }

  /* ---------- Desenho ---------- */
  let view = null;
  const COL = { solid: '#f2a15f', a: '#f6df86', b: '#a9d6f2', c: '#c6e8c2', proj: '#c0392b' };

  function planeQuad(k) {
    if (k === 'a') return [[-PL.X, 0, -PL.Z], [PL.X, 0, -PL.Z], [PL.X, 0, PL.Z], [-PL.X, 0, PL.Z]];
    if (k === 'b') return [[-PL.X, 0, -PL.Z], [PL.X, 0, -PL.Z], [PL.X, PL.Y, -PL.Z], [-PL.X, PL.Y, -PL.Z]];
    return [[-PL.X, 0, -PL.Z], [-PL.X, 0, PL.Z], [-PL.X, PL.Y, PL.Z], [-PL.X, PL.Y, -PL.Z]];
  }
  const PN = { a: [0, 1, 0], b: [0, 0, 1], c: [1, 0, 0] };
  const projTo = (k, p) => (k === 'a' ? [p[0], 0.004, p[2]] : k === 'b' ? [p[0], p[1], -PL.Z + 0.004] : [-PL.X + 0.004, p[1], p[2]]);
  function planeSvg(cam, k, label, alpha) {
    const q = planeQuad(k);
    return '<path d="' + G.path(cam, q, true) + '" class="plane plane-' + k + '" fill-opacity="' + (alpha == null ? 0.85 : alpha) + '"/>' +
      G.text(cam, k === 'a' ? [PL.X - 0.4, 0, PL.Z - 0.3] : k === 'b' ? [PL.X - 0.4, PL.Y - 0.4, -PL.Z] : [-PL.X, PL.Y - 0.4, PL.Z - 0.4], label, 'plane-lab');
  }
  /* Planos voltados para a câmera ficam atrás do sólido; os de costas vão por cima, transparentes. */
  function planesSplit(cam, keys) {
    const back = [], front = [];
    keys.forEach((k) => (cam.dir(PN[k])[2] >= 0 ? back : front).push(k));
    return { back, front };
  }

  function draw(s) {
    const o = S();
    const svg = $('proj-svg');
    let out;
    if (o.mode === 'seg') out = drawSeg(o, s);
    else if (o.mode === 'circ') out = drawCirc(o, s);
    else if (o.mode === 'planos') out = drawPlanos(o, s);
    else out = drawVistas(o, s);
    svg.innerHTML = out;
  }

  function camFor(s, center, scale, cx) {
    return G.cam(view.apply({ s: scale, cx: cx || 480, cy: 285, center }));
  }
  const NAMES = { a: 'α', b: 'β', c: 'γ' };

  function drawSeg(o, s) {
    const cam = camFor(s, [0, 1.3, 0], 70);
    let out = '';
    const sp = planesSplit(cam, ['a']);
    sp.back.forEach((k) => { out += planeSvg(cam, k, NAMES[k]); });
    const t = G.rad(s.t), yaw = G.rad(-25);
    const dir = [Math.cos(t) * Math.cos(yaw), Math.sin(t), -Math.cos(t) * Math.sin(yaw)];
    const M = [0.2, 2.2, 0.4];
    const A = G.add(M, G.mul(dir, -1.3)), B = G.add(M, G.mul(dir, 1.3));
    const A1 = [A[0], 0.004, A[2]], B1 = [B[0], 0.004, B[2]];
    if (s.da > 0.01) out += G.line(cam, A, G.lerp3(A, A1, s.da), 'projline');
    if (s.db > 0.01) out += G.line(cam, B, G.lerp3(B, B1, s.db), 'projline');
    if (s.da > 0.99) out += rightMark(cam, A1, [0, 1, 0], [1, 0, 0]) + G.dot(cam, A1, 4.5, 'pt3 proj') + G.text(cam, A1, 'A′', 'plab proj', -16, 14);
    if (s.db > 0.99) out += rightMark(cam, B1, [0, 1, 0], [1, 0, 0]) + G.dot(cam, B1, 4.5, 'pt3 proj') + G.text(cam, B1, 'B′', 'plab proj', 16, 14);
    if (s.pr > 0.01) out += '<g opacity="' + s.pr.toFixed(2) + '">' + G.line(cam, A1, B1, 'projseg') + '</g>';
    out += G.line(cam, A, B, 'segAB') + G.dot(cam, A, 5, 'pt3') + G.dot(cam, B, 5, 'pt3') + G.text(cam, A, 'A', 'plab', -16, -8) + G.text(cam, B, 'B', 'plab', 16, -8);
    sp.front.forEach((k) => { out += planeSvg(cam, k, NAMES[k], 0.3); });
    const Lp = Math.hypot(B1[0] - A1[0], B1[2] - A1[2]);
    out += '<text class="readout" x="820" y="80" text-anchor="middle">AB = 2,6</text><text class="readout proj" x="820" y="116" text-anchor="middle">A′B′ ' + (s.pr > 0.5 ? '= ' + F(Lp, 2) : '') + '</text><text class="readout small" x="820" y="150" text-anchor="middle">inclinação: ' + F(s.t, 0) + '°</text>';
    return out;
  }
  function rightMark(cam, p, u, v) {
    const k = 0.22;
    const a = G.add(p, G.mul(u, k)), b = G.add(a, G.mul(v, k)), c = G.add(p, G.mul(v, k));
    return '<path class="rmark" d="' + G.path(cam, [a, b, c], false) + '"/>';
  }

  function drawCirc(o, s) {
    const cam = camFor(s, [0, 1.3, 0], 70);
    let out = '';
    const sp = planesSplit(cam, ['a']);
    sp.back.forEach((k) => { out += planeSvg(cam, k, NAMES[k]); });
    const R = 1.25, C = [0, 2.7, 0.2];
    const t = G.rad(s.t);
    const ex = [1, 0, 0], ez = [0, Math.sin(t), Math.cos(t)];
    const rim = [];
    for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; rim.push(G.add(C, G.add(G.mul(ex, R * Math.cos(a)), G.mul(ez, R * Math.sin(a))))); }
    const proj = rim.map((p) => [p[0], 0.004, p[2]]);
    if (s.pr > 0.01) {
      let lines = '';
      for (let i = 0; i < 64; i += 8) lines += G.line(cam, rim[i], G.lerp3(rim[i], proj[i], s.pl), 'projline');
      out += lines;
      out += '<g opacity="' + s.pr.toFixed(2) + '"><path class="projshape" d="' + G.path(cam, proj, true) + '"/></g>';
    }
    out += '<path class="disk" d="' + G.path(cam, rim, true) + '"/>';
    out += G.line(cam, G.add(C, G.mul(ex, -R)), G.add(C, G.mul(ex, R)), 'diam');
    sp.front.forEach((k) => { out += planeSvg(cam, k, NAMES[k], 0.3); });
    const shape = s.t < 1 ? 'círculo' : s.t > 89 ? 'segmento de reta' : 'elipse';
    out += '<text class="readout" x="970" y="80" text-anchor="end">inclinação: ' + F(s.t, 0) + '°</text><text class="readout proj" x="970" y="116" text-anchor="end">' + (s.pr > 0.5 ? 'projeção: ' + shape : '') + '</text>';
    return out;
  }

  function drawPlanos(o, s) {
    const P = PSOL[o.psol];
    const cam = camFor(s, [0, 1.6, 0], 62);
    let out = '';
    const keys = o.gamma ? ['a', 'b', 'c'] : ['a', 'b'];
    const sp = planesSplit(cam, keys);
    // sólido flutuando no meio
    let m = P.make();
    const ys = m.V.map((p) => p[1]);
    const lift = 1.05 - Math.min.apply(null, ys);
    m = move(m, [0.3, lift, 0.4]);
    const drawPlaneAndShadow = (k, alpha) => {
      let g = planeSvg(cam, k, NAMES[k], alpha);
      const t = s[k];
      if (t > 0.01) {
        const pts2 = m.V.map((p) => (k === 'a' ? [p[0], p[2]] : k === 'b' ? [p[0], p[1]] : [p[2], p[1]]));
        const h = hull(pts2);
        const poly = h.map((q) => projTo(k, m.V[q[2]]));
        g += '<g opacity="' + GE.seg(t, 0.55, 1).toFixed(2) + '"><path class="projshape" d="' + G.path(cam, poly, true) + '"/></g>';
        // linhas de projeção: até 8 pontos do contorno
        const step = Math.max(1, Math.ceil(h.length / 8));
        for (let i = 0; i < h.length; i += step) {
          const p = m.V[h[i][2]];
          g += G.line(cam, p, G.lerp3(p, projTo(k, p), GE.seg(t, 0, 0.8)), 'projline');
        }
      }
      return g;
    };
    sp.back.forEach((k) => { out += drawPlaneAndShadow(k); });
    const r = G.render(m, cam, { colors: { '*': COL.solid }, alpha: 0.92, hidden: GE.state.hidden });
    out += r.hidden + r.faces + r.edges;
    sp.front.forEach((k) => { out += drawPlaneAndShadow(k, 0.3); });
    return out;
  }

  function drawVistas(o, s) {
    const O = OBJS[o.obj];
    const m = O.make(o);
    const list = viewList(o);
    // câmera: o passo pode "tomar conta" dela para olhar de frente para um lado
    const w = s.vw;
    let dy = s.vy - view.c.yaw;
    while (dy > 180) dy -= 360;
    while (dy < -180) dy += 360;
    const yaw = view.c.yaw + dy * w, pitch = view.c.pitch + (s.vp - view.c.pitch) * w;
    const ys = m.V.map((p) => p[1]);
    const cy = (Math.max.apply(null, ys) + Math.min.apply(null, ys)) / 2;
    const Rb = Math.max.apply(null, m.V.map((p) => Math.hypot(p[0], p[1] - cy, p[2])));
    const cam = G.cam(view.apply({ yaw, pitch, s: 150 / Rb, cx: 300, cy: 275, center: [0, cy, 0] }));
    let out = '';
    out += drawObj(m, cam, O, true);
    // painel das vistas
    const X0 = 590, Y0 = 20, cw = 190, ch = 160;
    out += '<rect class="inset-bg" x="' + X0 + '" y="' + Y0 + '" width="' + (cw * 2 + 20) + '" height="' + (ch * 3 + 20) + '" rx="14"/>';
    list.forEach((k, i) => {
      const cx = X0 + 10 + (i % 2) * cw + cw / 2, cyy = Y0 + 10 + Math.floor(i / 2) * ch + ch / 2 + 8;
      const V = VIEWS[k];
      const shown = s.n > i + 0.5;
      const q = s.q > 0.5 && Math.floor(s.n) === i;
      out += '<text class="slot-lab" x="' + cx + '" y="' + (cyy - ch / 2 + 18) + '" text-anchor="middle">' + V.name.replace('Vista ', '') + '</text>';
      if (shown) {
        const c2 = G.cam({ yaw: V.yaw, pitch: V.pitch, s: 52 / Rb, cx, cy: cyy + 6, center: [0, cy, 0] });
        out += '<g opacity="' + GE.seg(s.n - i, 0.5, 1).toFixed(2) + '">' + drawObj(m, c2, O, false) + '</g>';
      } else {
        out += '<rect class="slot-empty" x="' + (cx - 55) + '" y="' + (cyy - 40) + '" width="110" height="92" rx="8"/>';
        if (q) out += '<text class="slot-q" x="' + cx + '" y="' + (cyy + 18) + '" text-anchor="middle">?</text>';
      }
    });
    return out;
  }
  function drawObj(m, cam, O, shade) {
    const colors = (f) => (m.dice ? '#f5f7fa' : shade ? COL.solid : '#fbe7d4');
    const r = G.render(m, cam, {
      colors, hidden: GE.state.hidden && !O.voxel, twoSided: !shade,
      outline: O.voxel ? 'edge' : false, edges: !O.voxel,
    });
    let out = r.hidden + r.faces + r.edges;
    if (m.pips) out += G.render(m.pips, cam, { colors: { '*': '#1d2630' }, edges: false }).faces;
    return out;
  }

  /* ---------- Controles ---------- */
  let stp = null;
  function renderControls() {
    const o = S();
    $('proj-mode').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.mode));
    ['seg', 'circ', 'planos', 'vistas'].forEach((k) => { $('proj-' + k).hidden = o.mode !== k; });
    const TITLES = { seg: 'Projeção ortogonal de um segmento', circ: 'Projeção de um círculo', planos: 'Projeções nos planos α e β', vistas: 'Vistas ortográficas' };
    $('proj-name').textContent = o.mode === 'vistas' ? 'Vistas ortográficas · ' + OBJS[o.obj].name : o.mode === 'planos' ? 'Projeções · ' + PSOL[o.psol].name : TITLES[o.mode];
    $('proj-ang').value = o.ang; $('proj-ang-v').textContent = F(o.ang, 0) + '°';
    $('proj-cang').value = o.cang; $('proj-cang-v').textContent = F(o.cang, 0) + '°';
    document.querySelectorAll('#proj-psol [data-v]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.psol));
    document.querySelectorAll('#proj-objs [data-v]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.obj));
    $('proj-gamma').setAttribute('aria-pressed', o.gamma);
    $('proj-six').setAttribute('aria-pressed', o.six);
    $('proj-six').hidden = o.obj === 'dado';
    $('proj-pilebox').hidden = o.obj !== 'pilha';
    const H = parsePile(o.pile);
    $('proj-pile').innerHTML = [0, 1, 2, 3].map((k) => [0, 1, 2, 3].map((i) => '<button class="pcell h' + H[k][i] + '" data-i="' + i + '" data-k="' + k + '" aria-label="Linha ' + (k + 1) + ', coluna ' + (i + 1) + ': ' + H[k][i] + ' cubos">' + (H[k][i] || '') + '</button>').join('')).join('');
  }
  const edit = (sub) => GE.patch('proj', Object.assign({ step: 0 }, sub));
  function setHome() {
    const m = S().mode;
    view.home(m === 'vistas' ? { yaw: -35, pitch: 24 } : { yaw: -38, pitch: 20 });
  }

  const mod = {
    defaults: DEF,
    sanitize,
    svgId: 'proj-svg',
    name: () => { const o = S(); return 'Projeções · ' + (o.mode === 'vistas' ? OBJS[o.obj].name : o.mode === 'planos' ? PSOL[o.psol].name : o.mode === 'seg' ? 'segmento' : 'círculo'); },
    init() {
      view = G.viewer({ svg: $('proj-svg'), prefix: 'proj', cam0: { yaw: -35, pitch: 24 }, redraw: () => stp && stp.redraw() });
      stp = GE.stepper({
        prefix: 'proj', steps, draw,
        getIndex: () => S().step,
        setIndex: (i) => GE.set({ proj: Object.assign({}, S(), { step: i }) }, { quiet: true }),
      });
      stp.bind();
      $('proj-psol').innerHTML = Object.keys(PSOL).map((k) => '<button class="qbtn" data-v="' + k + '"><span class="book">' + PSOL[k].book + '</span>' + PSOL[k].name + '</button>').join('');
      $('proj-objs').innerHTML = Object.keys(OBJS).map((k) => '<button class="qbtn" data-v="' + k + '"><span class="book">' + OBJS[k].book + '</span>' + OBJS[k].name + '</button>').join('');
      $('proj-mode').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ mode: b.dataset.v }); });
      $('proj-psol').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ psol: b.dataset.v }); });
      $('proj-objs').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ obj: b.dataset.v }); });
      $('proj-gamma').addEventListener('click', () => edit({ gamma: !S().gamma }));
      $('proj-six').addEventListener('click', () => edit({ six: !S().six }));
      // controles livres: vão para o último passo ("Explorar")
      const free = (id, key) => $(id).addEventListener('input', (e) => {
        const n = steps().length;
        GE.patch('proj', { [key]: Number(e.target.value), step: n - 1 });
      });
      free('proj-ang', 'ang'); free('proj-cang', 'cang');
      $('proj-pile').addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        const H = parsePile(S().pile);
        const k = Number(b.dataset.k), i = Number(b.dataset.i);
        H[k][i] = (H[k][i] + 1) % 5;
        GE.patch('proj', { pile: H.map((r) => r.join('')).join(''), step: S().step });
      });
      $('proj-pile-clear').addEventListener('click', () => GE.patch('proj', { pile: '0'.repeat(16), step: 0 }));
      $('proj-pile-rand').addEventListener('click', () => {
        let p = '';
        for (let k = 0; k < 16; k++) p += Math.random() < 0.35 ? '0' : String(1 + Math.floor(Math.random() * 3));
        GE.patch('proj', { pile: p, step: 0 });
      });
      GE.on((changed, prev, opts) => {
        if (changed.includes('proj') && !opts.quiet) {
          const a = prev.proj || {}, b = S();
          if (a.mode !== b.mode) setHome();
          const onlyStep = Object.keys(b).every((k) => k === 'step' || JSON.stringify(a[k]) === JSON.stringify(b[k]));
          if (!onlyStep) { renderControls(); stp.rebuild(false); } else if (GE.state.view === 'proj') stp.rebuild(true);
        }
        if (changed.some((k) => ['dec', 'hidden'].includes(k))) stp.rebuild(false);
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
  GE.register('proj', mod);
  GE.pileMesh = voxels;
})();
