/* Aba Volume: prismas e cilindro. Base → área da base → camadas → V = A·h → capacidade. */
(function () {
  'use strict';
  const GE = window.GE;
  const G = GE.g3;
  const $ = (id) => document.getElementById(id);
  const F = (v, d) => GE.fmt(v, d);
  const esc = GE.esc;

  const SOLIDS = {
    cubo: { name: 'Cubo', base: 'sq', dims: ['a'], desc: 'prisma com as 6 faces quadradas e iguais' },
    quad: { name: 'Prisma de base quadrada', base: 'sq', dims: ['a', 'h'], desc: 'as bases são quadrados' },
    para: { name: 'Paralelepípedo', base: 'rect', dims: ['c', 'L', 'h'], desc: 'prisma de base retangular' },
    tri: { name: 'Prisma triangular', base: 'tri', dims: ['b', 'c', 'h'], desc: 'as bases são triângulos retângulos' },
    hex: { name: 'Prisma hexagonal regular', base: 'hex', dims: ['L', 'h'], desc: 'as bases são hexágonos regulares' },
    cil: { name: 'Cilindro', base: 'circ', dims: ['r', 'h'], desc: 'corpo redondo: as bases são círculos' },
  };
  GE.SOLIDS = SOLIDS;
  const DIM_NAME = {
    a: 'aresta da base', c: 'comprimento', L: 'largura', h: 'altura', b: 'cateto', r: 'raio',
  };
  const dimName = (solid, k) => {
    if (solid === 'cubo' && k === 'a') return 'aresta';
    if (solid === 'tri' && k === 'b') return '1º cateto da base';
    if (solid === 'tri' && k === 'c') return '2º cateto da base';
    if (solid === 'hex' && k === 'L') return 'lado do hexágono';
    return DIM_NAME[k];
  };

  /* Atividades do livro (Capítulo 9) */
  const BOOK = [
    { id: 'a1d', book: 'Atividade 1d', solid: 'cubo', d: { a: 30 }, unit: 'cm', ask: 'V', cap: true,
      text: 'O primeiro aquário de Leonardo é um cubo com 30 cm de aresta. Qual é o volume de água, em cm³, para enchê-lo completamente?' },
    { id: 'a1e', book: 'Atividade 1e', solid: 'para', d: { c: 40, L: 20, h: 40 }, unit: 'cm', ask: 'V', cap: true,
      text: 'O segundo aquário tem 20 cm de largura, 40 cm de comprimento e 40 cm de altura. Qual é o volume de água, em cm³, para enchê-lo completamente?' },
    { id: 'a2', book: 'Atividade 2', solid: 'quad', d: { a: 25, h: 5 }, unit: 'm', ask: 'a', cap: false,
      text: 'Uma piscina tem volume igual a 3 125 m³. Ela tem formato de prisma de base quadrada e altura de 5 m. Qual é a medida da aresta da base?' },
    { id: 'a3', book: 'Atividade 3', solid: 'tri', d: { b: 6, c: 8, h: 10 }, unit: 'cm', ask: 'V', cap: false,
      text: 'Uma caixa de chocolate tem formato de prisma triangular. A base é um triângulo retângulo de catetos 6 cm e 8 cm, e a aresta lateral mede 10 cm. Qual é o volume da caixa, em cm³?' },
    { id: 'a4', book: 'Atividade 4', solid: 'hex', d: { L: 4, h: 12 }, unit: 'cm', ask: 'V', cap: false,
      text: 'Talita quer construir uma embalagem de presente em forma de prisma, com 12 cm de altura e base hexagonal regular de lado 4 cm. Qual será o volume da embalagem?' },
    { id: 'a7', book: 'Atividade 7d', solid: 'cil', d: { r: 10, h: 30 }, unit: 'cm', ask: 'V', cap: true, pi: '3.14',
      text: 'O novo aquário de Leonardo é um cilindro com 30 cm de altura e base de 10 cm de raio. Que volume de água enche o aquário completamente? Considere π = 3,14.' },
    { id: 'a8', book: 'Atividade 8', solid: 'cil', d: { r: 2.5, h: 20 }, unit: 'm', ask: 'V', cap: true, pi: '3.14', lying: true, diam: 5, botijao: 13,
      text: 'O reservatório de uma distribuidora de gás é um cilindro deitado, com 20 m de comprimento e base de 5 m de diâmetro. Qual é o volume do reservatório? A capacidade total equivale a quantos botijões de 13 L? (1 m³ = 1 000 L)' },
  ];
  GE.VOL_BOOK = BOOK;

  const DEF = {
    solid: 'para', d: { a: 30, c: 40, L: 20, h: 40, b: 6, r: 10 }, unit: 'cm',
    ask: 'V', cap: true, obl: false, lying: false, q: '', step: 0, grid: true, lab: true,
  };

  function S() { return GE.state.vol; }
  function sanitize(o) {
    if (!SOLIDS[o.solid]) o.solid = 'para';
    const d = Object.assign({}, DEF.d, o.d || {});
    Object.keys(DEF.d).forEach((k) => { d[k] = GE.num(d[k], DEF.d[k], 0.1, 10000); });
    o.d = d;
    if (!['cm', 'dm', 'm'].includes(o.unit)) o.unit = 'cm';
    if (!['V', 'h', 'a'].includes(o.ask)) o.ask = 'V';
    if (o.ask === 'a' && !['cubo', 'quad', 'cil'].includes(o.solid)) o.ask = 'V';
    if (o.ask === 'h' && o.solid === 'cubo') o.ask = 'V';
    o.cap = !!o.cap; o.obl = !!o.obl; o.lying = !!o.lying && o.solid === 'cil';
    o.grid = o.grid !== false; o.lab = o.lab !== false;
    if (!BOOK.some((b) => b.id === o.q)) o.q = '';
    o.step = Math.max(0, Math.round(Number(o.step) || 0));
    return o;
  }

  /* ---------- Geometria do sólido ---------- */
  function dims(o) {
    const d = Object.assign({}, o.d);
    if (o.solid === 'cubo') { d.h = d.a; d.c = d.a; d.L = d.a; }
    if (o.solid === 'quad') { d.c = d.a; d.L = d.a; }
    return d;
  }
  function basePoly(o, d) {
    const b = SOLIDS[o.solid].base;
    if (b === 'sq' || b === 'rect') {
      const c = b === 'sq' ? d.a : d.c, L = b === 'sq' ? d.a : d.L;
      return [[-c / 2, -L / 2], [c / 2, -L / 2], [c / 2, L / 2], [-c / 2, L / 2]];
    }
    if (b === 'tri') {
      // ângulo reto na frente, à esquerda; catetos b (em x) e c (em z)
      // ângulo reto na frente, à direita: os dois catetos ficam à vista
      const gx = d.b / 3, gz = d.c / 3;
      return [[gx, gz], [gx - d.b, gz], [gx, gz - d.c]];
    }
    if (b === 'hex') return G.regular(6, d.L, 0);
    return G.circlePts(d.r, 72);
  }
  function baseRadius(poly) { return Math.max.apply(null, poly.map((p) => Math.hypot(p[0], p[1]))); }

  /* Área da base: coeficiente k, símbolo ('', '√3', 'π') e valor numérico. */
  const SYMV = { '': 1, '√3': Math.sqrt(3), 'π': null };
  function symVal(sym) { return sym === 'π' ? GE.piVal() : SYMV[sym]; }
  function symTxt(k, sym) {
    if (!sym) return F(k);
    if (Math.abs(k - 1) < 1e-12) return sym;
    return F(k) + sym;
  }
  function areaOf(o, d) {
    const b = SOLIDS[o.solid].base;
    if (b === 'sq') return { k: d.a * d.a, sym: '' };
    if (b === 'rect') return { k: d.c * d.L, sym: '' };
    if (b === 'tri') return { k: d.b * d.c / 2, sym: '' };
    if (b === 'hex') return { k: 1.5 * d.L * d.L, sym: '√3' };
    return { k: d.r * d.r, sym: 'π' };
  }
  function volOf(o, d) {
    const A = areaOf(o, d);
    return { k: A.k * d.h, sym: A.sym, A };
  }
  GE.volOf = (o) => volOf(o, dims(o));
  const val = (x) => x.k * symVal(x.sym);

  /* "= 288√3 ≈ 498,83" ou "= 3 000π = 3 000 · 3,14 = 9 420" */
  function tail(x) {
    if (!x.sym) return '';
    const v = val(x);
    if (x.sym === 'π' && GE.state.pi !== 'pi') {
      const k = F(x.k);
      return ' = ' + k + ' · ' + GE.piTxt() + ' ' + GE.eqs(v) + ' ' + F(v);
    }
    return ' ' + GE.eqs(v) + ' ' + F(v);
  }

  function layerUnit(H) {
    if (Math.abs(H - Math.round(H)) < 1e-9 && H <= 40) return 1;
    let u = G.niceStep(H, 20);
    const n = Math.max(1, Math.round(H / u));
    return H / n;
  }

  /* ---------- Texto ---------- */
  const U = () => S().unit;
  const u2 = () => U() + '²';
  const u3 = () => U() + '³';
  const ml = (s) => '<span class="mathline">' + s + '</span>';
  const I = (s) => '<i>' + s + '</i>';
  const Ab = '<i>A</i><sub>base</sub>';

  function capTxt(Vn) {
    const u = U();
    if (u === 'cm') {
      let s = ml(F(Vn) + ' cm³ = ' + F(Vn) + ' mL');
      if (Vn >= 1000) s += ml(F(Vn) + ' mL = ' + F(Vn / 1000) + ' L');
      return '<p>1 cm³ = 1 mL.</p>' + s;
    }
    if (u === 'dm') return '<p>1 dm³ = 1 L.</p>' + ml(F(Vn) + ' dm³ = ' + F(Vn) + ' L');
    return '<p>1 m³ = 1 000 L.</p>' + ml(F(Vn) + ' m³ = ' + F(Vn) + ' · 1 000 L = ' + F(Vn * 1000) + ' L');
  }
  function capL(Vn) { const u = U(); return u === 'cm' ? Vn / 1000 : u === 'dm' ? Vn : Vn * 1000; }

  /* Passos da área da base (a figura ao lado muda a cada passo). */
  function areaSteps(o, d) {
    const b = SOLIDS[o.solid].base;
    const A = areaOf(o, d);
    const u = U();
    if (b === 'sq' || b === 'rect') {
      const c = b === 'sq' ? d.a : d.c, L = b === 'sq' ? d.a : d.L;
      const unit1 = Math.abs(c - Math.round(c)) < 1e-9 && Math.abs(L - Math.round(L)) < 1e-9 && Math.max(c, L) <= 20;
      const f = b === 'sq' ? I('a') + ' · ' + I('a') + ' = ' + I('a') + '²' : I('c') + ' · ' + I('L');
      return [{
        title: 'Área da base: ' + (b === 'sq' ? 'quadrado' : 'retângulo'),
        body: '<p>' + (unit1 ? 'Cada quadradinho tem 1 ' + u2() + '. São ' + F(L) + ' fileiras de ' + F(c) + ' quadradinhos.' : 'Contamos quantos quadrados de 1 ' + u2() + ' cabem na base: fileiras × quadrados por fileira.') + '</p>' +
          ml(Ab + ' = ' + f + ' = ' + F(c) + ' · ' + F(L) + ' = ' + F(A.k) + ' ' + u2()),
      }];
    }
    if (b === 'tri') {
      return [{
        title: 'Área da base: triângulo',
        body: '<p>Uma cópia do triângulo, girada, completa um retângulo de ' + F(d.b) + ' por ' + F(d.c) + '. O triângulo é metade dele.</p>' +
          ml(Ab + ' = ' + '<span class="frac"><span>' + I('b') + ' · ' + I('c') + '</span><span>2</span></span> = <span class="frac"><span>' + F(d.b) + ' · ' + F(d.c) + '</span><span>2</span></span> = ' + F(A.k) + ' ' + u2()),
      }];
    }
    if (b === 'hex') {
      const L = d.L;
      return [{
        title: 'Área da base: 6 triângulos',
        body: '<p>Ligando o centro aos vértices, o hexágono regular fica dividido em <b>6 triângulos equiláteros</b> de lado ' + I('L') + ' = ' + F(L) + ' ' + u + '.</p>' +
          ml(Ab + ' = 6 · ' + I('A') + '<sub>triângulo</sub>'),
      }, {
        title: 'Altura do triângulo (Pitágoras)',
        body: '<p>A altura divide o triângulo equilátero em dois triângulos retângulos, com hipotenusa ' + I('L') + ' e cateto ' + I('L') + '/2:</p>' +
          ml(I('L') + '² = ' + I('h') + '² + (' + I('L') + '/2)² → ' + I('h') + ' = <span class="frac"><span>' + I('L') + '√3</span><span>2</span></span> = <span class="frac"><span>' + F(L) + '√3</span><span>2</span></span> = ' + symTxt(L / 2, '√3')) +
          ml(I('A') + '<sub>tri</sub> = <span class="frac"><span>' + F(L) + ' · ' + symTxt(L / 2, '√3') + '</span><span>2</span></span> = ' + symTxt(L * L / 4, '√3')) +
          ml(Ab + ' = 6 · ' + symTxt(L * L / 4, '√3') + ' = ' + symTxt(A.k, '√3') + tail(A) + ' ' + u2()),
      }];
    }
    // círculo
    return [{
      title: 'Área da base: círculo',
      body: '<p>Cortamos o círculo em fatias iguais, como uma pizza.</p>',
    }, {
      title: 'Fatias lado a lado',
      body: '<p>Encaixando as fatias, uma para cima e outra para baixo, formamos quase um paralelogramo: a base é metade do contorno (' + I('π') + I('r') + ') e a altura é o raio ' + I('r') + '.</p>' +
        ml(Ab + ' = ' + I('π') + I('r') + ' · ' + I('r') + ' = ' + I('π') + ' · ' + I('r') + '²') +
        ml(Ab + ' = π · ' + F(d.r) + '² = ' + symTxt(A.k, 'π') + tail(A) + ' ' + u2()),
    }];
  }
  function insetKind(o) { return SOLIDS[o.solid].base; }

  const B = { fill: 1, ghost: 0, baseHi: 0, tint: 0, grid: 0, inset: 0, ia: 0, glass: 0, water: 0, shear: 0, hl: 0, ans: 0, rev: 0 };
  const sc = (p) => Object.assign({}, B, p);

  function steps() {
    const o = S();
    const d = dims(o);
    const def = SOLIDS[o.solid];
    const q = BOOK.find((b) => b.id === o.q);
    const V = volOf(o, d);
    const A = V.A;
    const Vn = val(V), An = val(A);
    const H = d.h;
    const lu = layerUnit(H);
    const nL = H / lu;
    const out = [];
    const u = U();
    const qTxt = q ? '<p class="qtext"><span class="book">' + esc(q.book) + '</span> ' + esc(q.text) + '</p>' : '';
    const grid = o.grid ? 1 : 0;
    const aSt = areaSteps(o, d);
    const nA = aSt.length;
    const isCyl = def.base === 'circ';

    // 0. O sólido
    let intro;
    if (o.ask === 'V') intro = '<p>' + (isCyl ? 'O cilindro tem duas bases que são círculos iguais e paralelos, ligadas por uma superfície curva.' : 'Todo prisma tem duas <b>bases</b> iguais (congruentes) e paralelas, e faces laterais que são paralelogramos.') + '</p>';
    else if (o.ask === 'h') intro = '<p>Sabemos o volume, ' + I('V') + ' = ' + F(Vn) + ' ' + u3() + ', e as medidas da base. Falta a <b>altura</b>.</p>';
    else intro = '<p>Sabemos o volume, ' + I('V') + ' = ' + F(Vn) + ' ' + u3() + (o.solid === 'cubo' ? '' : ', e a altura, ' + I('h') + ' = ' + F(H) + ' ' + u) + '. Falta ' + (isCyl ? 'o <b>raio</b> da base' : o.solid === 'cubo' ? 'a <b>aresta</b>' : 'a <b>aresta da base</b>') + '.</p>';
    out.push({ title: def.name, tag: def.desc, body: qTxt + (q ? '' : intro) + (q ? intro : ''), scene: sc({ rev: 1 }) });
    if (q && q.diam) {
      out.push({ title: 'Do diâmetro para o raio', body: '<p>O enunciado dá o <b>diâmetro</b> da base. O raio é a metade:</p>' + ml(I('r') + ' = ' + F(q.diam) + ' ÷ 2 = ' + F(d.r) + ' ' + u), scene: sc({ rev: 1 }) });
    }
    // 1. Bases
    out.push({
      title: 'As bases',
      body: isCyl ? '<p>As bases são dois <b>círculos</b> de raio ' + I('r') + (o.ask === 'a' ? '' : ' = ' + F(d.r) + ' ' + u) + '.</p>' : '<p>As bases (em azul) são ' + (def.base === 'sq' ? 'quadrados' : def.base === 'rect' ? 'retângulos' : def.base === 'tri' ? 'triângulos retângulos' : 'hexágonos regulares') + ' iguais e paralelos. A <b>altura</b> é a distância entre elas.</p>',
      scene: sc({ baseHi: 1, rev: 1 }),
    });

    if (o.ask === 'a') {
      // ----- Descobrir a aresta (ou o raio) -----
      if (o.solid === 'cubo') {
        out.push({ title: 'Montar a equação', body: '<p>No cubo, as três medidas são iguais à aresta ' + I('a') + ':</p>' + ml(I('V') + ' = ' + I('a') + ' · ' + I('a') + ' · ' + I('a') + ' = ' + I('a') + '³') + ml(I('a') + '³ = ' + F(Vn)), scene: sc({ baseHi: 0, rev: 1 }) });
        out.push({ title: 'Raiz cúbica', body: '<p>Qual número multiplicado por ele mesmo três vezes dá ' + F(Vn) + '?</p>' + ml(I('a') + ' = ∛' + F(Vn) + ' = ' + F(d.a) + ' ' + u) + ml('Conferindo: ' + F(d.a) + ' · ' + F(d.a) + ' · ' + F(d.a) + ' = ' + F(Vn)), scene: sc({ ans: 1, grid, rev: 1 }) });
      } else {
        out.push({ title: 'Área da base', body: '<p>Do volume, tiramos a área da base:</p>' + ml(I('V') + ' = ' + Ab + ' · ' + I('h')) + ml(F(Vn) + ' = ' + Ab + ' · ' + F(H)) + ml(Ab + ' = ' + F(Vn) + ' ÷ ' + F(H) + ' = ' + F(An) + ' ' + u2()), scene: sc({ fill: 0, ghost: 1, baseHi: 1, inset: 1, ia: 0, rev: 1 }) });
        if (isCyl) {
          const r2 = An / GE.piVal();
          out.push({ title: 'Do círculo para o raio', body: ml(Ab + ' = π · ' + I('r') + '²') + ml(F(An) + ' = ' + GE.piTxt() + ' · ' + I('r') + '²') + ml(I('r') + '² = ' + F(An) + ' ÷ ' + GE.piTxt() + ' ' + GE.eqs(r2) + ' ' + F(r2)) + ml(I('r') + ' = √' + F(r2) + ' ' + GE.eqs(Math.sqrt(r2)) + ' ' + F(Math.sqrt(r2)) + ' ' + u), scene: sc({ fill: 0, ghost: 1, baseHi: 1, inset: 1, ia: 1, ans: 1, rev: 1 }) });
        } else {
          out.push({ title: 'Do quadrado para a aresta', body: '<p>A base é um quadrado: a área é a aresta ao quadrado.</p>' + ml(I('a') + '² = ' + F(An)) + ml(I('a') + ' = √' + F(An) + ' = ' + F(d.a) + ' ' + u) + '<p class="note">Não basta dividir por 2: precisamos do número que, multiplicado por ele mesmo, dá ' + F(An) + '.</p>', scene: sc({ fill: 0, ghost: 1, baseHi: 1, inset: 1, ia: 1, ans: 1, rev: 1 }) });
        }
        out.push({ title: 'Conferir', body: ml(I('V') + ' = ' + Ab + ' · ' + I('h') + ' = ' + F(An) + ' · ' + F(H) + ' = ' + F(Vn) + ' ' + u3()), scene: sc({ ans: 1, grid, rev: 1 }) });
      }
    } else {
      // ----- Área da base -----
      out.push({
        title: 'Começar pela base',
        body: '<p>Para calcular o volume, primeiro descobrimos quanto mede a <b>área da base</b>.</p>',
        scene: sc({ fill: 0, ghost: 1, baseHi: 1, inset: 1, ia: 0, rev: 1 }),
      });
      aSt.forEach((st, i) => out.push(Object.assign({}, st, { scene: sc({ fill: 0, ghost: 1, baseHi: 1, inset: 1, ia: i + 1, rev: 1 }) })));

      if (o.ask === 'V') {
        // ----- Camadas -----
        const lay = F(lu) + ' ' + u;
        out.push({
          title: 'Uma camada',
          body: '<p>Sobre a base, uma camada de ' + lay + ' de altura. ' + (lu === 1 && !A.sym && Math.abs(An - Math.round(An)) < 1e-9 ? 'Nela cabem ' + F(An) + ' cubinhos de 1 ' + u3() + '.' : 'O volume dela é a área da base vezes ' + lay + '.') + '</p>' +
            ml(I('V') + '<sub>camada</sub> = ' + F(An) + ' · ' + F(lu) + ' = ' + F(An * lu) + ' ' + u3()),
          scene: sc({ fill: lu / H, tint: 1, ghost: 1, inset: 1, ia: nA, grid, rev: 1 }),
        });
        out.push({
          title: 'Empilhar até a altura',
          body: '<p>Empilhamos camadas iguais até a altura ' + I('h') + ' = ' + F(H) + ' ' + u + ': são ' + F(nL) + ' camadas.</p>' +
            ml(I('V') + ' = ' + F(nL) + ' camadas · ' + F(An * lu) + ' ' + u3()) + '<p>Isso é o mesmo que multiplicar a área da base pela altura:</p>' + ml(I('V') + ' = ' + Ab + ' · ' + I('h')),
          scene: sc({ fill: 1, ghost: 1, inset: 1, ia: nA, grid, rev: 1 }),
          dur: 1500,
        });
        out.push({
          title: 'Volume',
          body: '<p>O volume de ' + (isCyl ? 'um cilindro' : 'um prisma') + ' é a área da base vezes a altura.</p>' +
            ml(I('V') + ' = ' + Ab + ' · ' + I('h') + (isCyl ? ' = π · ' + I('r') + '² · ' + I('h') : '')) +
            ml(I('V') + ' = ' + symTxt(A.k, A.sym) + ' · ' + F(H) + ' = ' + symTxt(V.k, V.sym) + tail(V) + ' ' + u3()),
          scene: sc({ fill: 1, grid, rev: 1 }),
        });
      } else {
        // ----- Descobrir a altura -----
        out.push({ title: 'Montar a equação', body: ml(I('V') + ' = ' + Ab + ' · ' + I('h')) + ml(F(Vn) + ' = ' + F(An) + ' · ' + I('h')), scene: sc({ fill: 0, ghost: 1, inset: 1, ia: nA, baseHi: 1, rev: 1 }) });
        out.push({ title: 'Calcular a altura', body: '<p>Dividimos o volume pela área da base:</p>' + ml(I('h') + ' = ' + F(Vn) + ' ÷ ' + F(An) + ' = ' + F(H) + ' ' + u) + '<p>São ' + F(nL) + ' camadas de ' + F(lu) + ' ' + u + ' empilhadas.</p>', scene: sc({ fill: 1, ghost: 1, ans: 1, inset: 1, ia: nA, grid, rev: 1 }), dur: 1500 });
      }
    }

    if (o.cap) {
      out.push({ title: 'Capacidade', body: '<p>Quanto de líquido cabe? Volume e capacidade se relacionam:</p>' + capTxt(Vn), scene: sc({ glass: 1, water: 1, ans: 1, rev: 1 }), dur: 1800 });
      if (q && q.botijao) {
        const L = capL(Vn);
        const n = L / q.botijao;
        out.push({ title: 'Quantos botijões?', body: '<p>Cada botijão tem capacidade de ' + F(q.botijao) + ' L.</p>' + ml(F(L) + ' ÷ ' + F(q.botijao) + ' ≈ ' + F(n, 1)) + '<p>Cabe o gás de aproximadamente <b>' + F(Math.floor(n), 0) + ' botijões</b>.</p>', scene: sc({ glass: 1, water: 1, ans: 1, rev: 1 }) });
      }
    }
    if (o.obl && !o.lying) {
      out.push({
        title: 'Inclinar: o volume muda?',
        body: '<p>Empurrando as camadas para o lado, como uma pilha de moedas, o sólido fica <b>oblíquo</b>. Cada camada continua com a mesma área e a pilha continua com a mesma altura ' + I('h') + ' (medida na perpendicular às bases).</p>' +
          '<p><b>Princípio de Cavalieri:</b> o volume não muda.</p>' + ml(I('V') + ' = ' + Ab + ' · ' + I('h') + ' = ' + F(Vn) + ' ' + u3()),
        scene: sc({ fill: 1, grid, shear: 1, hl: 1, ans: 1, rev: 1 }),
        dur: 1400,
      });
    }
    if (q) {
      let ans;
      if (o.ask === 'a') ans = (isCyl ? 'O raio da base mede ' : o.solid === 'cubo' ? 'A aresta mede ' : 'A aresta da base mede ') + '<b>' + F(isCyl ? d.r : d.a) + ' ' + u + '</b>.';
      else if (o.ask === 'h') ans = 'A altura mede <b>' + F(H) + ' ' + u + '</b>.';
      else {
        ans = 'O volume é <b>' + symTxt(V.k, V.sym) + (V.sym ? ' ' + GE.eqs(Vn) + ' ' + F(Vn) : '') + ' ' + u3() + '</b>';
        if (o.cap) ans += ', ou seja, ' + (u === 'cm' ? F(Vn) + ' mL' + (Vn >= 1000 ? ' = ' + F(Vn / 1000) + ' L' : '') : F(capL(Vn)) + ' L');
        if (q.botijao) ans += ', o equivalente a cerca de ' + F(Math.floor(capL(Vn) / q.botijao), 0) + ' botijões';
        ans += '.';
      }
      out.push({ title: 'Resposta', body: qTxt + '<p class="answer">' + ans + '</p>', scene: sc({ ans: 1, grid: 0, rev: 1, glass: o.cap ? 1 : 0, water: o.cap ? 1 : 0 }) });
    }
    return out;
  }

  /* ---------- Desenho ---------- */
  const COL = { solid: '#f2a15f', base: '#5aa7e8', layer: '#79b8f0', glass: '#d7e7f2', water: '#3d8fd6', ghost: '#8a98a6' };
  let view = null;   // controle da vista (girar, mover, aproximar)

  function draw(s) { drawTo($('vol-svg'), S(), s, view); }
  /* Desenha o sólido de qualquer configuração (usado também pelos Desafios e por Minha caixa). */
  function drawTo(svg, o, s, view, opt) {
    opt = opt || {};
    const d = dims(o);
    const def = SOLIDS[o.solid];
    const H = d.h;
    const base = basePoly(o, d);
    const rb = baseRadius(base);
    const lying = o.lying;
    const shMax = o.obl && !lying ? 0.5 * H : 0;
    const sh = s.shear * shMax;
    const T = lying ? (p) => [p[1] - H / 2, d.r - p[0], p[2]] : (p) => p;
    const full = G.xform(G.prism(base, H, [sh, 0], { smooth: def.base === 'circ' }), T);
    const R = Math.sqrt(rb * rb + (H / 2) * (H / 2)) + shMax / 2;
    const scale = ((opt.size || 170) / R) * GE.lerp(1, 0.78, s.inset);
    const cx = GE.lerp(opt.cx || 500, 300, s.inset);
    const cam = G.cam(view.apply({ s: scale, cx, cy: opt.cy || 275, center: T([sh / 2, H / 2, 0]) }));
    let out = '';
    const hid = GE.state.hidden;
    const hp = Math.max(1e-6, s.fill * H);
    const part = s.fill > 0.004 ? G.xform(G.prism(base, hp, [sh * hp / H, 0], { smooth: def.base === 'circ' }), T) : null;

    // chão (sombra)
    {
      const C = T([sh / 2, H / 2, 0]);
      const fp = cam.p([C[0], 0, C[2]]);
      const rx = lying ? (H / 2 + d.r) * scale * 1.05 : rb * scale * 1.25 + sh * scale * 0.5;
      out += '<ellipse class="shadow3" cx="' + G.f1(fp[0]) + '" cy="' + G.f1(fp[1] + 6) + '" rx="' + G.f1(rx) + '" ry="' + G.f1(rx * 0.22 + 4) + '"/>';
    }
    if (s.glass > 0.001) {
      // recipiente de vidro com água
      const back = G.render(full, cam, { side: 'back', colors: { '*': COL.glass }, alpha: 0.55 * s.glass, edges: false });
      out += back.faces;
      const lvl = Math.max(1e-6, s.water * H * 0.97);
      if (s.water > 0.002) {
        const wm = lying
          ? G.xform(G.prism(G.circlePts(d.r * 0.985, 72), H * 0.995, [0, 0], { smooth: true }), (p) => T([p[0], p[1] + H * 0.0025, p[2]]))
          : G.xform(G.prism(base.map((p) => [p[0] * 0.985, p[1] * 0.985]), lvl, [sh * lvl / H, 0], { smooth: def.base === 'circ' }), T);
        const wa = lying ? 0.75 * s.water : 0.72;
        const wr = G.render(wm, cam, { colors: { '*': COL.water, top: '#6fb2ea' }, alpha: wa, edges: false });
        out += wr.faces;
      }
      const fr = G.render(full, cam, {
        colors: (f) => G.mix(COL.solid, COL.glass, s.glass),
        alpha: GE.lerp(1, 0.22, s.glass), hidden: hid, edgeCls: 'edge glass-edge',
      });
      out += fr.hidden + fr.faces + fr.edges;
    } else {
      if (s.ghost > 0.01) {
        const gr = G.render(full, cam, { colors: () => null, hidden: true, edgeCls: 'edge-ghost', hiddenCls: 'edge-ghost' });
        out += '<g opacity="' + s.ghost.toFixed(3) + '">' + gr.hidden + gr.edges + '</g>';
      }
      if (part) {
        const col = G.mix(COL.solid, COL.layer, s.tint);
        const topCol = s.fill > 0.999 ? G.mix(col, COL.base, s.baseHi) : col;
        const pr = G.render(part, cam, { colors: { lat: col, top: topCol, base: G.mix(col, COL.base, s.baseHi) }, hidden: hid });
        out += pr.hidden + pr.faces;
        if (s.grid > 0.01 && o.grid) out += '<g opacity="' + s.grid.toFixed(3) + '">' + gridLines(o, d, base, hp, sh * hp / H, T, cam, pr.NV) + '</g>';
        out += pr.edges;
      }
      if (s.baseHi > 0.01) {
        // base de baixo em azul, vista "através" do sólido
        const bp = base.map((p) => T([p[0], 0, p[1]]));
        out += '<g opacity="' + s.baseHi.toFixed(3) + '">' + G.poly(cam, bp, 'base-hi') + '</g>';
        if (s.fill > 0.99 && !lying) out += '<g opacity="' + s.baseHi.toFixed(3) + '">' + G.poly(cam, base.map((p) => [p[0] + sh, H, p[1]]), 'base-hi top') + '</g>';
      }
    }

    // altura perpendicular (quando inclinado)
    if (s.hl > 0.01 && shMax) {
      const top = [sh, H, 0], foot = [sh, 0, 0];
      out += '<g opacity="' + s.hl.toFixed(3) + '">' + G.line(cam, top, foot, 'hline') + G.dot(cam, top, 3.5, 'hdot') + G.dot(cam, foot, 3.5, 'hdot') +
        G.text(cam, [sh, H / 2, 0], labTxt('h', H, o, s), 'dim3 hlab', 12, 0, 'start') + '</g>';
    }
    if (o.lab) out += labels(o, d, base, H, sh, T, cam, s);

    // área da base (figura plana ao lado)
    if (s.inset > 0.01) out += '<g class="inset" opacity="' + s.inset.toFixed(3) + '" transform="translate(' + G.f1((1 - s.inset) * 60) + ' 0)">' + inset(o, d, s) + '</g>';
    svg.innerHTML = out;
  }

  function labTxt(k, v, o, s) {
    const hide = (o.ask === 'h' && k === 'h') || (o.ask === 'a' && (k === 'a' || k === 'r'));
    if (hide && s.ans < 0.5) return '<tspan class="unk">' + k + ' = ?</tspan>';
    return (hide ? '<tspan class="found">' : '<tspan>') + k + ' = ' + F(v) + ' ' + o.unit + '</tspan>';
  }

  function labels(o, d, base, H, sh, T, cam, s) {
    const b = SOLIDS[o.solid].base;
    const C = T([sh / 2, H / 2, 0]);
    let out = '';
    const depth = (p) => cam.p(p)[2];
    const sx = (p) => cam.p(p)[0];
    const bot = (i) => T([base[i][0], 0, base[i][1]]);
    const top = (i) => T([base[i][0] + sh, H, base[i][1]]);
    const edgeBest = (cands) => cands.reduce((best, e) => (depth(G.lerp3(e[0], e[1], 0.5)) > depth(G.lerp3(best[0], best[1], 0.5)) ? e : best));
    const lab = (a, bb, t) => G.dimLabel(cam, a, bb, C, t, 'dim3');
    if (b === 'circ') {
      const n = base.length;
      const pick = (fn) => { let bi = 0, bv = -Infinity; for (let i = 0; i < n; i++) { const v = fn(i); if (v > bv) { bv = v; bi = i; } } return bi; };
      if (!o.lying) {
        const i = pick((k) => sx(top(k)));
        const tc = T([sh, H, 0]);
        out += G.line(cam, tc, top(i), 'rline') + G.dot(cam, tc, 3, 'hdot');
        out += G.text(cam, G.lerp3(tc, top(i), 0.5), labTxt('r', d.r, o, s), 'dim3', 0, -14);
        if (s.hl < 0.5) out += lab(bot(i), top(i), labTxt('h', H, o, s));
      } else {
        // cilindro deitado: raio na tampa da frente, comprimento em cima
        const caps = [[T([0, 0, 0]), bot], [T([0, H, 0]), top]];
        const cap = depth(caps[0][0]) > depth(caps[1][0]) ? caps[0] : caps[1];
        const i = pick((k) => -cam.p(cap[1](k))[1]);
        const j = pick((k) => sx(cap[1](k)) + (cam.p(cap[1](k))[1]) * 0.2);
        out += G.line(cam, cap[0], cap[1](j), 'rline') + G.dot(cam, cap[0], 3, 'hdot');
        out += G.text(cam, cap[1](j), labTxt('r', d.r, o, s), 'dim3', 12, 14, 'start');
        out += lab(bot(i), top(i), labTxt('h', H, o, s));
      }
      return out;
    }
    const n = base.length;
    const vert = () => { let bi = 0; for (let i = 1; i < n; i++) if (sx(bot(i)) > sx(bot(bi))) bi = i; return bi; };
    const vi = vert();
    if (b === 'sq' || b === 'rect') {
      const ex = edgeBest([[bot(0), bot(1)], [bot(3), bot(2)]]);
      const ez = edgeBest([[bot(1), bot(2)], [bot(0), bot(3)]]);
      if (o.solid === 'cubo') {
        out += lab(ex[0], ex[1], labTxt('a', d.a, o, s));
        out += lab(ez[0], ez[1], s.ans < 0.5 && o.ask === 'a' ? '<tspan class="unk">a</tspan>' : F(d.a) + ' ' + o.unit);
        out += lab(bot(vi), top(vi), s.ans < 0.5 && o.ask === 'a' ? '<tspan class="unk">a</tspan>' : F(d.a) + ' ' + o.unit);
        return out;
      }
      if (b === 'sq') { out += lab(ex[0], ex[1], labTxt('a', d.a, o, s)); out += lab(ez[0], ez[1], s.ans < 0.5 && o.ask === 'a' ? '<tspan class="unk">a</tspan>' : F(d.a) + ' ' + o.unit); }
      else { out += lab(ex[0], ex[1], labTxt('c', d.c, o, s)); out += lab(ez[0], ez[1], labTxt('L', d.L, o, s)); }
    } else if (b === 'tri') {
      out += lab(bot(0), bot(1), labTxt('b', d.b, o, s));
      out += lab(bot(2), bot(0), labTxt('c', d.c, o, s));
    } else if (b === 'hex') {
      const cands = [];
      for (let i = 0; i < n; i++) cands.push([bot(i), bot((i + 1) % n)]);
      const e = edgeBest(cands);
      out += lab(e[0], e[1], labTxt('L', d.L, o, s));
    }
    if (s.hl < 0.5) out += lab(bot(vi), top(vi), labTxt('h', H, o, s));
    return out;
  }

  /* Linhas das camadas (e dos cubinhos, quando as medidas são inteiras e pequenas). */
  function gridLines(o, d, base, hp, shp, T, cam, NV) {
    const n = base.length;
    const H = d.h;
    const lu = layerUnit(H);
    let path = '';
    const P = (x, y, z) => { const q = cam.p(T([x + shp * y / hp, y, z])); return G.f1(q[0]) + ' ' + G.f1(q[1]); };
    const front = (i) => NV[2 + i][2] > 1e-6;
    for (let y = lu; y < hp - 1e-6; y += lu) {
      for (let i = 0; i < n; i++) {
        if (!front(i)) continue;
        const a = base[i], b = base[(i + 1) % n];
        path += 'M' + P(a[0], y, a[1]) + 'L' + P(b[0], y, b[1]);
      }
    }
    // cubinhos (bases retangulares com medidas inteiras até 20)
    const b = SOLIDS[o.solid].base;
    if ((b === 'sq' || b === 'rect') && lu === 1) {
      const c = b === 'sq' ? d.a : d.c, L = b === 'sq' ? d.a : d.L;
      const ok = (v) => Math.abs(v - Math.round(v)) < 1e-9 && v <= 20;
      if (ok(c) && ok(L)) {
        for (let i = 0; i < n; i++) {
          if (!front(i)) continue;
          const a = base[i], bb = base[(i + 1) % n];
          const ln = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
          for (let k = 1; k < ln - 1e-6; k++) {
            const t = k / ln;
            const x = a[0] + (bb[0] - a[0]) * t, z = a[1] + (bb[1] - a[1]) * t;
            path += 'M' + P(x, 0, z) + 'L' + P(x, hp, z);
          }
        }
        if (NV[1][2] > 1e-6) {
          for (let k = 1; k < c; k++) { const x = -c / 2 + k; path += 'M' + P(x, hp, -L / 2) + 'L' + P(x, hp, L / 2); }
          for (let k = 1; k < L; k++) { const z = -L / 2 + k; path += 'M' + P(-c / 2, hp, z) + 'L' + P(c / 2, hp, z); }
        }
      }
    }
    return path ? '<path class="grid3" d="' + path + '"/>' : '';
  }

  /* ---------- Figura plana da base (ao lado) ---------- */
  function inset(o, d, s) {
    const kind = insetKind(o);
    const X0 = 590, Y0 = 26, W = 390, Hh = 480;
    const cx = X0 + W / 2, cy = Y0 + 220;
    let out = '<rect class="inset-bg" x="' + X0 + '" y="' + Y0 + '" width="' + W + '" height="' + Hh + '" rx="14"/>';
    out += '<text class="inset-title" x="' + (X0 + 18) + '" y="' + (Y0 + 30) + '">Área da base</text>';
    const u = o.unit;
    const A = areaOf(o, d);
    const An = val(A);
    const t1 = GE.seg(s.ia, 0, 1), t2 = GE.seg(s.ia, 1, 2);
    const txt = (x, y, t, cls, anc) => '<text x="' + G.f1(x) + '" y="' + G.f1(y) + '" class="' + (cls || 'ilab') + '" text-anchor="' + (anc || 'middle') + '" dominant-baseline="middle">' + t + '</text>';
    const vtxt = (x, y, t, left) => '<text transform="translate(' + G.f1(x) + ' ' + G.f1(y) + ') rotate(' + (left ? -90 : 90) + ')" class="ilab" text-anchor="middle" dominant-baseline="middle">' + t + '</text>';
    const rev = o.ask === 'a';
    const unk = (k, v) => (rev && s.ans < 0.5 ? '<tspan class="unk">' + k + ' = ?</tspan>' : k + ' = ' + F(v) + ' ' + u);
    let foot = '';
    if (kind === 'sq' || kind === 'rect') {
      const c = kind === 'sq' ? d.a : d.c, L = kind === 'sq' ? d.a : d.L;
      const k = Math.min(270 / c, 250 / L);
      const w = c * k, h = L * k;
      const x = cx - w / 2, y = cy - h / 2;
      out += '<rect class="ibase" x="' + G.f1(x) + '" y="' + G.f1(y) + '" width="' + G.f1(w) + '" height="' + G.f1(h) + '"/>';
      if (!rev) {
        const g = Math.abs(c - Math.round(c)) < 1e-9 && Math.abs(L - Math.round(L)) < 1e-9 && Math.max(c, L) <= 40 ? 1 : G.niceStep(Math.max(c, L), 10);
        const rows = L / g;
        const filled = t1 * rows;
        if (t1 > 0) {
          const fh = Math.min(rows, Math.ceil(filled - 1e-9)) * g * k;
          out += '<clipPath id="vclip"><rect x="' + G.f1(x) + '" y="' + G.f1(y + h - fh) + '" width="' + G.f1(w) + '" height="' + G.f1(fh) + '"/></clipPath>';
          out += '<rect class="ifill" clip-path="url(#vclip)" x="' + G.f1(x) + '" y="' + G.f1(y) + '" width="' + G.f1(w) + '" height="' + G.f1(h) + '" opacity="' + Math.min(1, filled).toFixed(2) + '"/>';
          let gp = '';
          for (let i = 1; i * g < c - 1e-9; i++) gp += 'M' + G.f1(x + i * g * k) + ' ' + G.f1(y) + 'v' + G.f1(h);
          for (let i = 1; i * g < L - 1e-9; i++) gp += 'M' + G.f1(x) + ' ' + G.f1(y + i * g * k) + 'h' + G.f1(w);
          out += '<path class="igrid" d="' + gp + '" opacity="' + t1.toFixed(2) + '"/>';
        }
        out += txt(cx, y + h + 22, kind === 'sq' ? 'a = ' + F(c) + ' ' + u : 'c = ' + F(c) + ' ' + u);
        out += vtxt(x + w + 14, cy, kind === 'sq' ? F(L) + ' ' + u : 'L = ' + F(L) + ' ' + u);
        if (t1 > 0.6) foot = 'A = ' + F(An) + ' ' + u + '²';
      } else {
        out += txt(cx, cy, 'A = ' + F(An) + ' ' + u + '²', 'ibig');
        out += txt(cx, y + h + 22, unk('a', c));
        out += vtxt(x + w + 14, cy, rev && s.ans < 0.5 ? '<tspan class="unk">a</tspan>' : F(L) + ' ' + u);
      }
    } else if (kind === 'tri') {
      const k = Math.min(280 / d.b, 250 / d.c);
      const w = d.b * k, h = d.c * k;
      const ox = cx - w / 2, oy = cy + h / 2; // ângulo reto embaixo, à esquerda
      const Pt = (x, y) => [ox + x * k, oy - y * k];
      const tri = [Pt(0, 0), Pt(d.b, 0), Pt(0, d.c)];
      const pth = (pts) => 'M' + pts.map((p) => G.f1(p[0]) + ' ' + G.f1(p[1])).join('L') + 'Z';
      if (t1 > 0) {
        const M = Pt(d.b / 2, d.c / 2);
        const ang = Math.PI * t1;
        const rot = (p) => { const dx = p[0] - M[0], dy = p[1] - M[1]; return [M[0] + dx * Math.cos(ang) - dy * Math.sin(ang), M[1] + dx * Math.sin(ang) + dy * Math.cos(ang)]; };
        out += '<path class="icopy" d="' + pth(tri.map(rot)) + '"/>';
      }
      out += '<path class="ibase" d="' + pth(tri) + '"/>';
      out += '<path class="iright" d="M' + G.f1(ox + 12) + ' ' + G.f1(oy) + 'v-12h-12"/>';
      out += txt(cx, oy + 22, 'b = ' + F(d.b) + ' ' + u);
      out += vtxt(ox - 14, cy, 'c = ' + F(d.c) + ' ' + u, true);
      if (t1 > 0.9) foot = 'A = ' + F(d.b) + ' · ' + F(d.c) + ' ÷ 2 = ' + F(An) + ' ' + u + '²';
    } else if (kind === 'hex') {
      const R = 130;
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pts.push([cx + R * Math.cos(a), cy - R * Math.sin(a)]); }
      const pth = (p) => 'M' + p.map((q) => G.f1(q[0]) + ' ' + G.f1(q[1])).join('L') + 'Z';
      out += '<path class="ibase" d="' + pth(pts) + '"/>';
      if (t2 > 0) {
        // triângulo de baixo em destaque, com a altura
        out += '<path class="ihl" d="' + pth([[cx, cy], pts[4], pts[5]]) + '" opacity="' + t2.toFixed(2) + '"/>';
      }
      if (t1 > 0) {
        let lp = '';
        pts.forEach((p) => { lp += 'M' + cx + ' ' + cy + 'L' + G.f1(cx + (p[0] - cx) * t1) + ' ' + G.f1(cy + (p[1] - cy) * t1); });
        out += '<path class="isplit" d="' + lp + '"/>';
      }
      if (t2 > 0) {
        const m = [(pts[4][0] + pts[5][0]) / 2, (pts[4][1] + pts[5][1]) / 2];
        out += '<g opacity="' + t2.toFixed(2) + '"><line class="ihgt" x1="' + cx + '" y1="' + cy + '" x2="' + G.f1(m[0]) + '" y2="' + G.f1(m[1]) + '"/>' +
          '<path class="iright" d="M' + G.f1(m[0] + 10) + ' ' + G.f1(m[1]) + 'v-10h-10"/>' +
          txt(m[0] + 8, (cy + m[1]) / 2, 'h', 'ilab it', 'start') + txt((m[0] + pts[5][0]) / 2, m[1] + 18, 'L/2', 'ilab it') + '</g>';
      }
      out += txt((pts[0][0] + pts[1][0]) / 2 + 16, (pts[0][1] + pts[1][1]) / 2 - 8, 'L = ' + F(d.L) + ' ' + u, 'ilab', 'start');
      if (t1 > 0.9 && t2 < 0.5) foot = '6 triângulos equiláteros';
      if (t2 > 0.9) foot = 'A = ' + symTxt(A.k, '√3') + ' ≈ ' + F(An) + ' ' + u + '²';
    } else {
      // círculo: fatias e paralelogramo
      const r = rev ? d.r : d.r;
      const Rpx = rev ? 120 : Math.min(118, 330 / Math.PI);
      const N = 16, w = (Math.PI * 2) / N;
      if (rev) {
        out += '<circle class="ibase" cx="' + cx + '" cy="' + cy + '" r="' + Rpx + '"/>';
        out += '<line class="rline2" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Rpx) + '" y2="' + cy + '"/>';
        out += txt(cx + Rpx / 2, cy - 14, unk('r', r));
        out += txt(cx, cy + 36, 'A = ' + F(An) + ' ' + u + '²', 'ibig');
      } else {
        const L = Math.PI * Rpx;
        let sp = '';
        for (let i = 0; i < N; i++) {
          const a0 = (i + 0.5) * w; // bissetriz original (y para cima)
          const up = i % 2 === 0;
          const fx = cx - L / 2 + (i + 0.5) * (L / N);
          const fy = up ? cy - Rpx / 2 : cy + Rpx / 2;
          const af = up ? -Math.PI / 2 : Math.PI / 2; // bissetriz final: para baixo (up) ou para cima
          const e = t2;
          const apx = GE.lerp(cx, fx, e), apy = GE.lerp(cy, fy, e);
          // ângulo em coordenadas de tela (y para baixo): original = -a0
          let aS = -a0, aT = up ? Math.PI / 2 : -Math.PI / 2;
          let da = aT - aS;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          const ab = aS + da * e;
          let dd = 'M' + G.f1(apx) + ' ' + G.f1(apy);
          for (let k = 0; k <= 6; k++) {
            const t = ab - w / 2 + (w * k) / 6;
            dd += 'L' + G.f1(apx + Rpx * Math.cos(t)) + ' ' + G.f1(apy + Rpx * Math.sin(t));
          }
          dd += 'Z';
          void af;
          sp += '<path class="isec ' + (i % 2 ? 'b' : 'a') + '" d="' + dd + '"/>';
        }
        if (t1 <= 0) out += '<circle class="ibase" cx="' + cx + '" cy="' + cy + '" r="' + Rpx + '"/><line class="rline2" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Rpx) + '" y2="' + cy + '"/>' + txt(cx + Rpx / 2, cy - 14, 'r = ' + F(r) + ' ' + u);
        else {
          out += '<g opacity="' + Math.min(1, t1 * 2).toFixed(2) + '">' + sp + '</g>';
          if (t2 < 0.05) out += txt(cx + Rpx / 2, cy - 14, 'r = ' + F(r) + ' ' + u);
          if (t2 > 0.9) {
            out += txt(cx, cy + Rpx / 2 + 24, 'metade do contorno: π · r', 'ilab');
            out += txt(cx - L / 2 - 12, cy, 'r', 'ilab it', 'end');
            foot = 'A = π · r² = ' + symTxt(A.k, 'π') + (GE.state.pi === 'pi' ? ' ≈ ' : ' = ') + F(An) + ' ' + u + '²';
          }
        }
      }
    }
    if (foot) out += txt(cx, Y0 + Hh - 30, foot, 'ifoot');
    return out;
  }

  /* ---------- Cartões e controles ---------- */
  let stp = null;
  function renderControls() {
    const o = S();
    const def = SOLIDS[o.solid];
    document.querySelectorAll('#vol-solids [data-s]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === o.solid));
    const box = $('vol-dims');
    const keys = def.dims;
    const want = keys.join(',') + '|' + o.unit;
    if (box.dataset.k !== want) {
      box.dataset.k = want;
      box.innerHTML = keys.map((k) => '<div class="dimrow"><label for="vd-' + k + '"><i>' + k + '</i> <span>' + dimName(o.solid, k) + '</span></label>' +
        '<input type="text" inputmode="decimal" id="vd-' + k + '" data-k="' + k + '"><span class="du">' + o.unit + '</span>' +
        '<input type="range" data-r="' + k + '" aria-label="' + dimName(o.solid, k) + '" min="1" max="' + (o.unit === 'm' ? 30 : 60) + '" step="' + (o.unit === 'm' ? 0.5 : 1) + '"></div>').join('');
    }
    keys.forEach((k) => {
      const inp = box.querySelector('[data-k="' + k + '"]');
      if (document.activeElement !== inp) inp.value = F(o.d[k], 4);
      const rg = box.querySelector('[data-r="' + k + '"]');
      rg.value = o.d[k];
    });
    const seg = $('vol-ask');
    seg.querySelector('[data-v="a"]').hidden = !['cubo', 'quad', 'cil'].includes(o.solid);
    seg.querySelector('[data-v="a"]').textContent = o.solid === 'cil' ? 'Raio' : 'Aresta';
    seg.querySelector('[data-v="h"]').hidden = o.solid === 'cubo';
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.ask));
    $('vol-unit').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.unit));
    $('vol-cap').setAttribute('aria-pressed', o.cap);
    $('vol-obl').setAttribute('aria-pressed', o.obl);
    $('vol-obl').disabled = o.lying;
    $('vol-lying').hidden = o.solid !== 'cil';
    $('vol-lying').setAttribute('aria-pressed', o.lying);
    document.querySelectorAll('#vol-book [data-q]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.q === o.q));
    $('vol-name').textContent = def.name;
    document.querySelector('#view-vol [data-vflag="lab"]').setAttribute('aria-pressed', o.lab);
    document.querySelector('#view-vol [data-vflag="grid"]').setAttribute('aria-pressed', o.grid);
    document.querySelector('#view-vol [data-vflag="hidden"]').setAttribute('aria-pressed', GE.state.hidden);
  }

  function loadBook(id) {
    const q = BOOK.find((b) => b.id === id);
    if (!q) return;
    const d = Object.assign({}, S().d, q.d);
    const patch = { vol: Object.assign({}, S(), { solid: q.solid, d, unit: q.unit, ask: q.ask, cap: q.cap, obl: false, lying: !!q.lying, q: q.id, step: 0 }) };
    if (q.pi) patch.pi = q.pi;
    GE.set(patch);
  }

  function edit(sub) { GE.patch('vol', Object.assign({ q: '', step: 0 }, sub)); }

  const mod = {
    defaults: DEF,
    sanitize,
    svgId: 'vol-svg',
    name() { const o = S(); const q = BOOK.find((b) => b.id === o.q); return 'Volume · ' + (q ? q.book : SOLIDS[o.solid].name); },
    init() {
      view = G.viewer({ svg: $('vol-svg'), prefix: 'vol', cam0: { yaw: -32, pitch: 26 }, redraw: () => stp && stp.redraw() });
      stp = GE.stepper({
        prefix: 'vol',
        steps,
        draw,
        getIndex: () => S().step,
        setIndex: (i) => { GE.state.vol.step = i; GE.set({ vol: Object.assign({}, S(), { step: i }) }, { quiet: true }); },
      });
      stp.bind();
      $('vol-solids').innerHTML = Object.keys(SOLIDS).map((k) => '<button class="solid-btn" data-s="' + k + '">' + GE.icons.solid(k) + '<span>' + SOLIDS[k].name + '</span></button>').join('');
      $('vol-solids').addEventListener('click', (e) => {
        const b = e.target.closest('[data-s]');
        if (b) edit({ solid: b.dataset.s, lying: false, ask: 'V' });
      });
      $('vol-book').innerHTML = BOOK.map((q) => '<button class="qbtn" data-q="' + q.id + '"><span class="book">' + q.book + '</span>' + esc(q.text.split('.')[0].slice(0, 70)) + '…</button>').join('');
      $('vol-book').addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) loadBook(b.dataset.q); });
      const box = $('vol-dims');
      box.addEventListener('change', (e) => {
        const k = e.target.dataset.k;
        if (!k) return;
        const v = GE.parseNum(e.target.value);
        if (!(v > 0)) { e.target.classList.add('invalid'); return; }
        e.target.classList.remove('invalid');
        edit({ d: Object.assign({}, S().d, { [k]: v }) });
      });
      box.addEventListener('input', (e) => {
        const k = e.target.dataset.r;
        if (!k) return;
        edit({ d: Object.assign({}, S().d, { [k]: Number(e.target.value) }) });
      });
      $('vol-ask').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ ask: b.dataset.v }); });
      $('vol-unit').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) edit({ unit: b.dataset.v }); });
      $('vol-cap').addEventListener('click', () => edit({ cap: !S().cap }));
      $('vol-obl').addEventListener('click', () => edit({ obl: !S().obl }));
      $('vol-lying').addEventListener('click', () => edit({ lying: !S().lying }));
      document.querySelectorAll('#view-vol [data-vflag]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.vflag;
        if (k === 'hidden') GE.set({ hidden: !GE.state.hidden });
        else GE.patch('vol', { [k]: !S()[k] });
      }));
      GE.on((changed, prev, opts) => {
        if (changed.includes('vol') && !opts.quiet) {
          const a = prev.vol || {}, b = S();
          const onlyStep = Object.keys(b).every((k) => k === 'step' || JSON.stringify(a[k]) === JSON.stringify(b[k]));
          if (!onlyStep) { renderControls(); stp.rebuild(false); }
          else if (GE.state.view === 'vol') { stp.rebuild(true); }
        }
        if (changed.some((k) => ['pi', 'dec', 'hidden'].includes(k))) { renderControls(); stp.rebuild(false); }
      });
      renderControls();
      stp.rebuild(false);
    },
    render() { renderControls(); stp.rebuild(false); },
    next() { stp.next(); },
    prev() { stp.prev(); },
    first() { stp.first(); },
    stepper: () => stp,
    load: loadBook,
    redraw() { if (stp) stp.redraw(); },
  };
  GE.register('vol', mod);
  GE.geom = { dims, basePoly, areaOf, volOf, val, symTxt, tail, dimName, baseRadius, drawTo, sc: (p) => Object.assign({}, B, p), SOLIDS };
})();
