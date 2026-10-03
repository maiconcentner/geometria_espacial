/* Aba Revolução: a bandeirinha gira em torno do palito e desenha um sólido (Atividade 5). */
(function () {
  'use strict';
  const GE = window.GE;
  const G = GE.g3;
  const $ = (id) => document.getElementById(id);
  const esc = GE.esc;

  /* Perfis no plano (r, y): r = distância ao eixo. */
  function arc(cx, cy, R, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    return out;
  }
  const SHAPES = [
    { id: 'ret', name: 'Retângulo', flag: 'Bandeira amarela', color: '#f2c94c', solid: 'Cilindro', book: 'Atividade 5',
      prof: () => [[0, 0], [1.2, 0], [1.2, 2.2], [0, 2.2]],
      opts: ['Cilindro', 'Cubo', 'Cone', 'Esfera'],
      about: 'O lado preso ao palito vira o <b>eixo</b>; o lado oposto desenha a superfície curva; os lados de cima e de baixo desenham as duas <b>bases</b> (círculos).',
      parts: [{ k: 'r', a: [0, 2.2], b: [1.2, 2.2], t: 'raio' }, { k: 'h', a: [1.2, 0], b: [1.2, 2.2], t: 'altura' }],
      daily: 'latas, canos, velas, caixas-d’água, silos' },
    { id: 'tri', name: 'Triângulo retângulo', flag: 'Bandeira verde', color: '#3bb273', solid: 'Cone', book: 'Atividade 5',
      prof: () => [[0, 0], [1.3, 0], [0, 2.3]],
      opts: ['Pirâmide', 'Cone', 'Cilindro', 'Esfera'],
      about: 'Um cateto fica no palito (é o eixo, a <b>altura</b> do cone); o outro cateto desenha a <b>base</b> (um círculo); a hipotenusa desenha a superfície lateral: ela é a <b>geratriz</b>.',
      parts: [{ k: 'r', a: [0, 0], b: [1.3, 0], t: 'raio' }, { k: 'h', a: [0, 0], b: [0, 2.3], t: 'altura' }, { k: 'g', a: [1.3, 0], b: [0, 2.3], t: 'geratriz' }],
      daily: 'casquinha de sorvete, funil, chapéu de festa, cone de trânsito' },
    { id: 'semi', name: 'Semicírculo', flag: 'Semicírculo', color: '#e86f68', solid: 'Esfera', book: 'Organizando as ideias',
      prof: () => arc(0, 1.2, 1.2, -Math.PI / 2, Math.PI / 2, 24),
      opts: ['Cilindro', 'Cone', 'Esfera', 'Círculo'],
      about: 'O diâmetro fica no palito. Girando, cada ponto do arco fica à mesma distância do <b>centro</b>: é a superfície da esfera.',
      parts: [{ k: 'r', a: [0, 1.2], b: [1.2, 1.2], t: 'raio' }],
      daily: 'bolas, bolinhas de gude, laranjas, globos' },
    { id: 'band', name: 'Retângulo com meia-lua', flag: 'Bandeira azul', color: '#2f6fd1', solid: 'Esfera achatada', book: 'Atividade 5',
      prof: () => [[0, 0], [0.7, 0]].concat(arc(0.7, 1.0, 1.0, -Math.PI / 2, Math.PI / 2, 20).slice(1, -1), [[0.7, 2.0], [0, 2.0]]),
      opts: ['Esfera achatada', 'Cilindro', 'Cone', 'Cubo'],
      about: 'A parte reta desenha o topo e o fundo planos; a meia-lua desenha a borda arredondada. O resultado lembra uma esfera achatada (uma pastilha).',
      parts: [],
      daily: 'pastilhas, botões, algumas luminárias' },
    { id: 'trap', name: 'Trapézio retângulo', flag: 'Trapézio', color: '#9b6bd6', solid: 'Tronco de cone', book: 'Explorar',
      prof: () => [[0, 0], [1.4, 0], [0.7, 2.0], [0, 2.0]],
      opts: ['Cone', 'Tronco de cone', 'Cilindro', 'Pirâmide'],
      about: 'É como um cone com a ponta cortada: duas bases circulares de tamanhos diferentes.',
      parts: [{ k: 'R', a: [0, 0], b: [1.4, 0], t: 'raio maior' }, { k: 'r', a: [0, 2], b: [0.7, 2], t: 'raio menor' }],
      daily: 'baldes, copos, vasos de planta, abajures' },
    { id: 'duplo', name: 'Triângulo com um lado no palito', flag: 'Pião', color: '#e0892b', solid: 'Dois cones', book: 'Explorar',
      prof: () => [[0, 0], [1.1, 1.1], [0, 2.4]],
      opts: ['Esfera', 'Dois cones', 'Cilindro', 'Pirâmide'],
      about: 'O vértice mais afastado do palito desenha um círculo onde os dois cones se encontram, base com base.',
      parts: [{ k: 'r', a: [0, 1.1], b: [1.1, 1.1], t: 'raio' }],
      daily: 'pião, alguns pingentes e embalagens' },
    { id: 'tubo', name: 'Retângulo longe do palito', flag: 'Bandeira com vão', color: '#2aa3a3', solid: 'Cilindro oco (cano)', book: 'Explorar',
      prof: () => [[0.6, 0], [1.2, 0], [1.2, 2.2], [0.6, 2.2]],
      opts: ['Cilindro', 'Cilindro oco (cano)', 'Cone', 'Esfera'],
      about: 'Como a figura não toca o palito, sobra um buraco no meio: um cilindro oco, como um cano ou um anel grosso.',
      parts: [],
      daily: 'canos, anéis, arruelas, rolos de fita' },
    { id: 'toro', name: 'Círculo longe do palito', flag: 'Argola', color: '#d6457a', solid: 'Toro (rosquinha)', book: 'Explorar',
      prof: () => arc(1.0, 1.1, 0.45, 0, Math.PI * 2, 28).slice(0, -1),
      opts: ['Esfera', 'Cilindro oco (cano)', 'Toro (rosquinha)', 'Cone'],
      about: 'Um círculo girando em volta do palito, sem tocá-lo, desenha uma rosquinha: o <b>toro</b>.',
      parts: [],
      daily: 'boias, rosquinhas, pneus, argolas' },
  ];
  GE.REV_SHAPES = SHAPES;

  const DEF = { shape: 'ret', step: 0, ok: 0, n: 0, done: [] };
  const S = () => GE.state.rev;
  function sanitize(o) {
    if (!SHAPES.some((x) => x.id === o.shape)) o.shape = 'ret';
    o.step = Math.max(0, Math.round(Number(o.step) || 0));
    o.ok = Math.max(0, Math.round(Number(o.ok) || 0));
    o.n = Math.max(o.ok, Math.round(Number(o.n) || 0));
    o.done = Array.isArray(o.done) ? o.done.filter((x) => SHAPES.some((y) => y.id === x)) : [];
    return o;
  }
  const shape = () => SHAPES.find((x) => x.id === S().shape);

  let vote = null;          // palpite da turma nesta bandeira
  // placar da votação: fica no estado (vai junto no link e nos cenários salvos)

  const B = { ang: 0, flagA: 1, solidA: 0.55, lab: 0, trail: 0, done: 0 };
  const sc = (p) => Object.assign({}, B, p);

  function steps() {
    const sh = shape();
    const ask = '<p>Ao girar a bandeirinha pelo palito, que sólido ela desenha? Votem antes de girar.</p>';
    return [
      { title: sh.flag, tag: sh.book, body: '<p>Uma figura plana (' + sh.name.toLowerCase() + ') presa a um palito, que é o <b>eixo de rotação</b>.</p>' + ask, scene: sc({}) },
      { title: 'Girar um quarto de volta', body: '<p>A bandeira gira 90° em torno do eixo. Cada ponto dela descreve um arco de circunferência.</p>', scene: sc({ ang: 90, trail: 1 }), dur: 1300 },
      { title: 'Meia volta', body: '<p>180°: a superfície já desenhada é metade do sólido.</p>', scene: sc({ ang: 180, trail: 1 }), dur: 1300 },
      { title: 'Volta completa', body: '<p>360°: a bandeira voltou ao lugar e o sólido está completo.</p>', scene: sc({ ang: 360, trail: 1 }), dur: 1500 },
      { title: sh.solid, tag: 'sólido de revolução', body: '<p>' + sh.about + '</p>' + result() + '<p class="note">No dia a dia: ' + sh.daily + '.</p>', scene: sc({ ang: 360, flagA: 0.25, solidA: 1, lab: 1, done: 1 }) },
    ];
  }
  function result() {
    const sh = shape();
    if (!vote) return '';
    const ok = vote === sh.solid;
    return '<p class="vote-res ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'A turma acertou!' : 'A turma votou em ' + esc(vote.toLowerCase()) + '.') + '</p>';
  }

  let view = null;

  function draw(s) {
    const sh = shape();
    const svg = $('rev-svg');
    const prof = sh.prof();
    const cam = G.cam(view.apply({ s: 118, cx: 480, cy: 290, center: [0, 1.15, 0] }));
    const ang = G.rad(s.ang);
    let out = '';
    const ymax = Math.max.apply(null, prof.map((p) => p[1]));
    const rmax = Math.max.apply(null, prof.map((p) => p[0]));
    // sombra
    const fp = cam.p([0, 0, 0]);
    out += '<ellipse class="shadow3" cx="' + G.f1(fp[0]) + '" cy="' + G.f1(fp[1] + 8) + '" rx="' + G.f1(rmax * 118 * 1.15) + '" ry="' + G.f1(rmax * 118 * 0.3 + 4) + '"/>';
    // eixo: parte de trás
    const top = [0, ymax + 0.75, 0], bot = [0, -0.55, 0];
    out += G.line(cam, bot, top, 'axis3');
    // malha: superfície varrida + a bandeira na posição atual
    let mesh = null;
    if (ang > 0.01) mesh = G.revolve(prof, Math.min(ang, Math.PI * 2), 72);
    const V = mesh ? mesh.V.slice() : [];
    const F = mesh ? mesh.F.slice() : [];
    const fi = V.length;
    const pr = prof.map((p) => [p[0] * Math.cos(ang), p[1], -p[0] * Math.sin(ang)]);
    pr.forEach((p) => V.push(p));
    F.push({ v: pr.map((_, i) => fi + i), part: 'flag' });
    const m = G.prep({ V, F, convex: false, featureAngle: 35 });
    const r = G.render(m, cam, {
      side: 'both',
      colors: { rv: '#f2a15f', flag: sh.color },
      alpha: (f) => (f.part === 'flag' ? s.flagA : s.solidA),
      edges: false,
      faceEdges: false,
    });
    out += r.faces;
    // contorno da bandeira
    out += '<g opacity="' + Math.max(0.35, s.flagA).toFixed(2) + '">' + G.poly(cam, pr, 'flag-edge') + '</g>';
    // silhueta do sólido pronto
    if (s.done > 0.5 && mesh) {
      const rr = G.render(mesh, cam, { side: 'front', colors: () => null, edges: true, edgeCls: 'edge', hidden: GE.state.hidden });
      out += rr.hidden + rr.edges;
    }
    // trilhas: o caminho circular de alguns pontos da bandeira
    if (s.trail > 0.01 && ang > 0.02) {
      let tp = '';
      const pts = prof.filter((p) => p[0] > 0.05);
      const pick = [pts.reduce((a, b) => (b[0] > a[0] ? b : a)), pts[0], pts[pts.length - 1]];
      pick.forEach((q) => {
        const arcPts = [];
        const n = Math.max(2, Math.ceil(ang / 0.08));
        for (let i = 0; i <= n; i++) { const a = (ang * i) / n; arcPts.push([q[0] * Math.cos(a), q[1], -q[0] * Math.sin(a)]); }
        tp += G.path(cam, arcPts, false);
      });
      out += '<path class="trail" d="' + tp + '" opacity="' + (s.trail * (1 - s.done * 0.7)).toFixed(2) + '"/>';
    }
    // eixo: parte da frente (por cima) e a seta de giro
    out += G.line(cam, [0, ymax, 0], top, 'pole3');
    out += G.line(cam, bot, [0, 0, 0], 'pole3');
    {
      const R0 = 0.28, y0 = ymax + 0.5;
      const a = [];
      for (let i = 0; i <= 20; i++) { const t = -0.3 + (Math.PI * 1.6 * i) / 20; a.push([R0 * Math.cos(t), y0, -R0 * Math.sin(t)]); }
      out += '<path class="spin" d="' + G.path(cam, a, false) + '" marker-end="url(#rev-arrow)"/>';
      out += G.text(cam, [0.05, ymax + 0.95, 0], 'e', 'axis-lab', 14, 0);
    }
    // medidas do sólido pronto
    if (s.lab > 0.01) {
      let lb = '';
      sh.parts.forEach((p) => {
        const a = [p.a[0], p.a[1], 0], b = [p.b[0], p.b[1], 0];
        const onAxis = p.a[0] < 1e-9 && p.b[0] < 1e-9;
        lb += G.line(cam, a, b, 'part3 ' + p.k) + (onAxis
          ? G.text(cam, G.lerp3(a, b, 0.5), p.t, 'dim3 part-lab', -12, 0, 'end')
          : G.dimLabel(cam, a, b, [-0.5, ymax / 2, 0], p.t, 'dim3 part-lab', 16));
      });
      out += '<g opacity="' + s.lab.toFixed(2) + '">' + lb + '</g>';
    }
    // bandeira desenhada ao lado (plano), como no livro
    out += flat(sh, prof, s);
    svg.innerHTML = '<defs><marker id="rev-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" class="spin-head"/></marker></defs>' + out;
  }

  function flat(sh, prof, s) {
    const X0 = 800, Y0 = 70, k = 70;
    const ymax = Math.max.apply(null, prof.map((p) => p[1]));
    const P = (p) => G.f1(X0 + p[0] * k) + ' ' + G.f1(Y0 + 40 + (ymax - p[1]) * k);
    let o = '<g class="flat" opacity="' + (1 - s.done * 0.35).toFixed(2) + '"><text class="flat-cap" x="' + (X0 - 30) + '" y="' + Y0 + '">A figura</text>';
    o += '<line class="pole2" x1="' + X0 + '" y1="' + (Y0 + 20) + '" x2="' + X0 + '" y2="' + G.f1(Y0 + 60 + ymax * k + 30) + '"/>';
    o += '<path d="M' + prof.map(P).join('L') + 'Z" fill="' + sh.color + '" class="flat-flag"/>';
    o += '</g>';
    return o;
  }

  let stp = null;
  function renderCards() {
    const sh = shape();
    document.querySelectorAll('#rev-shapes [data-sh]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sh === sh.id));
    $('rev-name').textContent = sh.flag;
    $('rev-vote').innerHTML = sh.opts.map((o) => '<button class="vote" data-o="' + esc(o) + '" aria-pressed="' + (vote === o) + '">' + esc(o) + '</button>').join('');
    const o = S();
    $('rev-score').innerHTML = o.n ? 'Placar da turma: <b>' + o.ok + '</b> acerto' + (o.ok === 1 ? '' : 's') + ' em ' + o.n + ' bandeira' + (o.n === 1 ? '' : 's') + '. <button class="linkbtn" id="rev-zero">Zerar</button>' : 'O resultado aparece no último passo.';
  }
  function thumb(x) {
    const prof = x.prof();
    const ymax = Math.max.apply(null, prof.map((p) => p[1]));
    const k = 13;
    return '<svg class="sicon" viewBox="0 0 40 40" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="38" stroke="currentColor" stroke-width="1.6"/><path d="M' +
      prof.map((p) => G.f1(8 + p[0] * k) + ' ' + G.f1(6 + (ymax - p[1]) * k)).join('L') + 'Z" fill="' + x.color + '" stroke="currentColor" stroke-width="1"/></svg>';
  }

  const mod = {
    defaults: DEF,
    sanitize,
    svgId: 'rev-svg',
    name: () => 'Revolução · ' + shape().flag,
    init() {
      view = G.viewer({ svg: $('rev-svg'), prefix: 'rev', cam0: { yaw: -30, pitch: 18 }, redraw: () => stp && stp.redraw() });
      stp = GE.stepper({
        prefix: 'rev', steps, draw,
        getIndex: () => S().step,
        setIndex: (i) => {
          GE.set({ rev: Object.assign({}, S(), { step: i }) }, { quiet: true });
          const o = S();
          if (i === steps().length - 1 && vote && !o.done.includes(o.shape)) {
            GE.set({ rev: Object.assign({}, o, { done: o.done.concat([o.shape]), n: o.n + 1, ok: o.ok + (vote === shape().solid ? 1 : 0) }) }, { quiet: true });
            renderCards();
          }
        },
      });
      stp.bind();
      $('rev-shapes').innerHTML = SHAPES.map((x) => '<button class="solid-btn" data-sh="' + x.id + '">' + thumb(x) + '<span>' + esc(x.flag) + '</span></button>').join('');
      $('rev-shapes').addEventListener('click', (e) => {
        const b = e.target.closest('[data-sh]');
        if (!b) return;
        vote = null;
        const o = S();
        if (o.done.includes(b.dataset.sh)) GE.set({ rev: Object.assign({}, o, { done: o.done.filter((x) => x !== b.dataset.sh) }) }, { quiet: true });
        GE.patch('rev', { shape: b.dataset.sh, step: 0 });
      });
      $('rev-score').addEventListener('click', (e) => {
        if (e.target.id === 'rev-zero') { GE.set({ rev: Object.assign({}, S(), { ok: 0, n: 0, done: [] }) }, { quiet: true }); renderCards(); }
      });
      $('rev-vote').addEventListener('click', (e) => {
        const b = e.target.closest('[data-o]');
        if (!b || stp.index() === stp.count() - 1) return;
        vote = b.dataset.o;
        renderCards();
        stp.rebuild(false);
      });
      GE.on((changed, prev, opts) => {
        if (!changed.includes('rev') || opts.quiet) return;
        const a = prev.rev || {}, b = S();
        if (a.shape !== b.shape) { renderCards(); stp.rebuild(false); }
        else if (GE.state.view === 'rev') stp.rebuild(true);
      });
      renderCards();
      stp.rebuild(false);
    },
    render() { renderCards(); stp.rebuild(false); },
    redraw() { stp.redraw(); },
    next() { stp.next(); }, prev() { stp.prev(); }, first() { stp.first(); },
    stepper: () => stp,
  };
  GE.register('rev', mod);
})();
