/* Aba Desafios: exercícios gerados com resolução passo a passo, "Qual é a vista?", "Que sólido gira?",
   placar por equipes e cronômetro. */
(function () {
  'use strict';
  const GE = window.GE;
  const G = GE.g3;
  const $ = (id) => document.getElementById(id);
  const F = (v, d) => GE.fmt(v, d);
  const esc = GE.esc;
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (l) => l[rnd(l.length)];
  const between = (a, b) => a + rnd(b - a + 1);
  const ml = (s) => '<span class="mathline">' + s + '</span>';
  const I = (s) => '<i>' + s + '</i>';
  const Ab = '<i>A</i><sub>base</sub>';
  const COLORS = ['#1b6ec2', '#d1690f', '#1d8a4a', '#a3279f'];

  const DEF = { g: 'ex', lvl: 1, ex: null, step: 0, teams: [{ n: 'Equipe 1', p: 0 }, { n: 'Equipe 2', p: 0 }], clock: 60, vq: null, rq: null };
  const S = () => GE.state.game;
  function sanitize(o) {
    if (!['ex', 'vista', 'rev'].includes(o.g)) o.g = 'ex';
    o.lvl = GE.clamp(Math.round(Number(o.lvl) || 1), 1, 3);
    if (!Array.isArray(o.teams) || !o.teams.length) o.teams = DEF.teams.map((t) => Object.assign({}, t));
    o.teams = o.teams.slice(0, 4).map((t, i) => ({ n: String((t && t.n) || 'Equipe ' + (i + 1)).slice(0, 24), p: Math.round(Number(t && t.p) || 0) }));
    o.clock = [30, 60, 90, 120, 180].includes(Number(o.clock)) ? Number(o.clock) : 60;
    o.step = Math.max(0, Math.round(Number(o.step) || 0));
    if (o.ex && typeof o.ex !== 'object') o.ex = null;
    return o;
  }

  /* ================= Exercícios ================= */
  const TYPES = {
    1: ['Vpara', 'Vcubo', 'cap', 'conv'],
    2: ['Vtri', 'Vcil', 'h', 'areaPara', 'dias'],
    3: ['Vhex', 'a', 'areaCil', 'capCil', 'Vcil'],
  };
  const TNAME = { Vpara: 'Volume do paralelepípedo', Vcubo: 'Volume do cubo', cap: 'Capacidade', conv: 'Unidades de capacidade', Vtri: 'Volume do prisma triangular', Vcil: 'Volume do cilindro', h: 'Descobrir a altura', areaPara: 'Área da superfície', dias: 'Cisterna', Vhex: 'Volume do prisma hexagonal', a: 'Descobrir a aresta', areaCil: 'Área do cilindro', capCil: 'Reservatório' };

  function gen(lvl) {
    const type = pick(TYPES[lvl]);
    const e = { type, lvl };
    switch (type) {
      case 'Vpara': {
        const c = pick([{ w: 'um aquário', u: 'cm', c: [30, 60], L: [20, 40], h: [25, 50] }, { w: 'uma caixa de sapatos', u: 'cm', c: [25, 35], L: [15, 22], h: [10, 14] }, { w: 'uma piscina', u: 'm', c: [6, 12], L: [3, 6], h: [1, 2] }, { w: 'um tijolo maciço', u: 'cm', c: [19, 24], L: [9, 11], h: [5, 7] }]);
        Object.assign(e, { what: c.w, solid: 'para', unit: c.u, d: { c: between(c.c[0], c.c[1]), L: between(c.L[0], c.L[1]), h: between(c.h[0], c.h[1]) } });
        break;
      }
      case 'Vcubo': Object.assign(e, { what: pick(['uma caixa cúbica', 'um dado gigante', 'um cubo mágico de vitrine', 'um reservatório cúbico']), solid: 'cubo', unit: 'cm', d: { a: between(4, 40) } }); break;
      case 'cap': Object.assign(e, { what: pick(['um aquário', 'uma caixa-d’água retangular', 'um tanque de peixes']), solid: 'para', unit: 'cm', d: { c: 10 * between(3, 8), L: 10 * between(2, 5), h: 10 * between(2, 6) } }); break;
      case 'conv': {
        const U = ['kL', 'L', 'dL', 'cL', 'mL'];
        const from = pick(['L', 'L', 'mL', 'kL', 'dL']);
        let to = pick(U.filter((u) => u !== from));
        if (from === 'mL' && to === 'cL') to = 'L';
        const v = from === 'mL' ? pick([250, 350, 500, 1500, 2000, 600]) : from === 'kL' ? pick([1, 2, 3.5, 0.5]) : pick([1.5, 2, 2.5, 0.75, 3, 5]);
        Object.assign(e, { from, to, v });
        break;
      }
      case 'Vtri': Object.assign(e, { what: pick(['uma embalagem de chocolate', 'uma rampa de madeira', 'um peso de porta']), solid: 'tri', unit: 'cm', d: { b: between(3, 12), c: between(4, 12), h: between(8, 25) } }); break;
      case 'Vcil': {
        const c = pick([{ w: 'uma lata', u: 'cm', r: [3, 5], h: [8, 15], half: true }, { w: 'uma caixa-d’água cilíndrica', u: 'm', r: [1, 2], h: [1, 3], half: true }, { w: 'um aquário cilíndrico', u: 'cm', r: [10, 20], h: [30, 50] }, { w: 'uma vela', u: 'cm', r: [2, 4], h: [10, 20] }]);
        const r = c.half && Math.random() < 0.5 ? between(c.r[0] * 2, c.r[1] * 2) / 2 : between(c.r[0], c.r[1]);
        Object.assign(e, { what: c.w, solid: 'cil', unit: c.u, d: { r, h: between(c.h[0], c.h[1]) }, diam: lvl >= 2 && Math.random() < 0.5 });
        break;
      }
      case 'h': {
        const c = between(20, 50), L = between(10, 30), h = between(10, 40);
        Object.assign(e, { what: pick(['Um aquário', 'Uma caixa', 'Um reservatório']), solid: 'para', unit: 'cm', d: { c, L, h }, ask: 'h' });
        break;
      }
      case 'areaPara': Object.assign(e, { what: pick(['uma caixa de presente', 'uma caixa de papelão', 'uma embalagem']), solid: 'para', unit: 'cm', d: { c: between(10, 40), L: between(8, 25), h: between(5, 20) } }); break;
      case 'dias': Object.assign(e, { solid: 'cil', unit: 'm', d: { r: between(5, 12) / 10, h: between(15, 30) / 10 }, people: between(3, 6), per: pick([100, 120, 150, 154]) }); break;
      case 'Vhex': Object.assign(e, { what: pick(['uma embalagem de presente', 'um lápis gigante de vitrine', 'uma caixa de bombons']), solid: 'hex', unit: 'cm', d: { L: between(2, 8), h: between(6, 20) } }); break;
      case 'a': {
        const a = pick([4, 5, 6, 8, 9, 10, 12, 15, 20, 25]), h = between(1, 5);
        Object.assign(e, { what: pick(['Uma piscina', 'Um tanque', 'Um reservatório']), solid: 'quad', unit: 'm', d: { a, h }, ask: 'a' });
        break;
      }
      case 'areaCil': Object.assign(e, { what: pick(['um silo', 'uma caixa-d’água', 'um tanque']), solid: 'cil', unit: 'm', d: { r: between(1, 4), h: between(5, 20) }, paint: pick([5, 6, 8, 10]) }); break;
      case 'capCil': Object.assign(e, { what: pick(['um reservatório de combustível', 'um tanque de leite', 'uma caixa-d’água']), solid: 'cil', unit: 'm', d: { r: between(2, 6) / 2, h: between(2, 8) }, pack: pick([{ n: 'galões de 20 L', v: 20 }, { n: 'botijões de 13 L', v: 13 }, { n: 'garrafas de 2 L', v: 2 }]) }); break;
    }
    return e;
  }

  /* Cada exercício: enunciado, passos (dados → fórmula → substituir → calcular → resposta) e onde abrir. */
  function build(e) {
    const pt = GE.piTxt(), pv = GE.piVal();
    const u = e.unit || '', u2 = u + '²', u3 = u + '³';
    const d = e.d || {};
    const st = [];
    let text = '', ans = '', open = null, figAsk = e.ask || 'V';
    const dados = (items) => ({ title: 'Dados', body: '<ul class="dados">' + items.map((x) => '<li>' + x + '</li>').join('') + '</ul>' });
    const V = () => {
      if (e.solid === 'cubo') return d.a * d.a * d.a;
      if (e.solid === 'para') return d.c * d.L * d.h;
      if (e.solid === 'quad') return d.a * d.a * d.h;
      if (e.solid === 'tri') return d.b * d.c / 2 * d.h;
      if (e.solid === 'hex') return 1.5 * Math.sqrt(3) * d.L * d.L * d.h;
      return pv * d.r * d.r * d.h;
    };
    const figOpen = (extra) => ({ view: 'vol', patch: Object.assign({ solid: e.solid, d: Object.assign({}, GE.state.vol.d, d), unit: u, ask: e.ask || 'V', cap: false, obl: false, lying: false, q: '', step: 0 }, extra || {}) });
    switch (e.type) {
      case 'Vpara': {
        text = 'Qual é o volume de ' + e.what + ' com ' + F(d.c) + ' ' + u + ' de comprimento, ' + F(d.L) + ' ' + u + ' de largura e ' + F(d.h) + ' ' + u + ' de altura?';
        st.push(dados(['comprimento ' + I('c') + ' = ' + F(d.c) + ' ' + u, 'largura ' + I('L') + ' = ' + F(d.L) + ' ' + u, 'altura ' + I('h') + ' = ' + F(d.h) + ' ' + u]));
        st.push({ title: 'Fórmula', body: '<p>Paralelepípedo: área da base × altura.</p>' + ml(I('V') + ' = ' + I('c') + ' · ' + I('L') + ' · ' + I('h')) });
        st.push({ title: 'Substituir', body: ml(I('V') + ' = ' + F(d.c) + ' · ' + F(d.L) + ' · ' + F(d.h)) });
        st.push({ title: 'Calcular', body: ml(I('V') + ' = ' + F(d.c * d.L) + ' · ' + F(d.h) + ' = ' + F(V()) + ' ' + u3), ans: 1 });
        ans = F(V()) + ' ' + u3; open = figOpen();
        break;
      }
      case 'Vcubo': {
        text = 'Qual é o volume de ' + e.what + ' com ' + F(d.a) + ' cm de aresta?';
        st.push(dados(['aresta ' + I('a') + ' = ' + F(d.a) + ' cm']));
        st.push({ title: 'Fórmula', body: '<p>No cubo, comprimento, largura e altura são iguais à aresta.</p>' + ml(I('V') + ' = ' + I('a') + ' · ' + I('a') + ' · ' + I('a') + ' = ' + I('a') + '³') });
        st.push({ title: 'Substituir', body: ml(I('V') + ' = ' + F(d.a) + ' · ' + F(d.a) + ' · ' + F(d.a)) });
        st.push({ title: 'Calcular', body: ml(I('V') + ' = ' + F(d.a * d.a) + ' · ' + F(d.a) + ' = ' + F(V()) + ' cm³'), ans: 1 });
        ans = F(V()) + ' cm³'; open = figOpen();
        break;
      }
      case 'cap': {
        const L = V() / 1000;
        text = 'Quantos litros de água cabem em ' + e.what + ' de ' + F(d.c) + ' cm × ' + F(d.L) + ' cm × ' + F(d.h) + ' cm?';
        st.push(dados(['medidas: ' + F(d.c) + ' cm, ' + F(d.L) + ' cm e ' + F(d.h) + ' cm', '1 dm³ = 1 L e 1 dm = 10 cm']));
        st.push({ title: 'Volume', body: ml(I('V') + ' = ' + F(d.c) + ' · ' + F(d.L) + ' · ' + F(d.h) + ' = ' + F(V()) + ' cm³'), ans: 1 });
        st.push({ title: 'Para litros', body: '<p>1 000 cm³ = 1 dm³ = 1 L.</p>' + ml(F(V()) + ' ÷ 1 000 = ' + F(L) + ' L') + '<p class="note">Outro jeito: em decímetros, ' + F(d.c / 10) + ' · ' + F(d.L / 10) + ' · ' + F(d.h / 10) + ' = ' + F(L) + ' dm³.</p>', ans: 1 });
        ans = F(L) + ' litros'; open = figOpen({ cap: true });
        break;
      }
      case 'conv': {
        const U = ['kL', 'hL', 'daL', 'L', 'dL', 'cL', 'mL'];
        const i0 = U.indexOf(e.from), i1 = U.indexOf(e.to);
        const r = e.v * Math.pow(10, i1 - i0);
        text = 'Transforme ' + F(e.v, 6) + ' ' + e.from + ' em ' + e.to + '.';
        st.push({ title: 'Dados', body: '<p>Na escada kL → hL → daL → L → dL → cL → mL, cada degrau para a direita multiplica por 10.</p>' });
        st.push({ title: 'Contar os degraus', body: '<p>De ' + e.from + ' até ' + e.to + ': ' + Math.abs(i1 - i0) + ' degrau' + (Math.abs(i1 - i0) === 1 ? '' : 's') + ' para a ' + (i1 > i0 ? 'direita (unidade menor)' : 'esquerda (unidade maior)') + '.</p>' });
        st.push({ title: 'Calcular', body: ml(F(e.v, 6) + (i1 > i0 ? ' · ' : ' ÷ ') + F(Math.pow(10, Math.abs(i1 - i0)), 0) + ' = ' + F(r, 6) + ' ' + e.to), ans: 1 });
        ans = F(r, 6) + ' ' + e.to; open = { view: 'cap', patch: { mode: 'escada', val: e.v, from: e.from, to: e.to, step: 0 } };
        break;
      }
      case 'Vtri': {
        const A = d.b * d.c / 2;
        text = 'O(A) ' + e.what + ' tem forma de prisma cuja base é um triângulo retângulo de catetos ' + F(d.b) + ' cm e ' + F(d.c) + ' cm. A aresta lateral mede ' + F(d.h) + ' cm. Qual é o volume?';
        st.push(dados(['catetos ' + F(d.b) + ' cm e ' + F(d.c) + ' cm', 'altura do prisma ' + I('h') + ' = ' + F(d.h) + ' cm']));
        st.push({ title: 'Área da base', body: '<p>Triângulo retângulo: metade do retângulo formado pelos catetos.</p>' + ml(Ab + ' = ' + F(d.b) + ' · ' + F(d.c) + ' ÷ 2 = ' + F(A) + ' cm²') });
        st.push({ title: 'Fórmula', body: ml(I('V') + ' = ' + Ab + ' · ' + I('h')) });
        st.push({ title: 'Calcular', body: ml(I('V') + ' = ' + F(A) + ' · ' + F(d.h) + ' = ' + F(V()) + ' cm³'), ans: 1 });
        ans = F(V()) + ' cm³'; open = figOpen();
        text = text.replace('O(A) uma', 'Uma').replace('O(A) um', 'Um');
        break;
      }
      case 'Vcil': {
        const Ab2 = pv * d.r * d.r;
        text = (e.what.charAt(0).toUpperCase() + e.what.slice(1)) + ' tem forma de cilindro com ' + (e.diam ? F(2 * d.r) + ' ' + u + ' de diâmetro' : F(d.r) + ' ' + u + ' de raio') + ' e ' + F(d.h) + ' ' + u + ' de altura. Qual é o volume? Use π = ' + pt + '.';
        const items = [(e.diam ? 'diâmetro ' + F(2 * d.r) + ' ' + u : 'raio ' + I('r') + ' = ' + F(d.r) + ' ' + u), 'altura ' + I('h') + ' = ' + F(d.h) + ' ' + u, 'π = ' + pt];
        st.push(dados(items));
        if (e.diam) st.push({ title: 'Raio', body: '<p>O raio é metade do diâmetro.</p>' + ml(I('r') + ' = ' + F(2 * d.r) + ' ÷ 2 = ' + F(d.r) + ' ' + u) });
        st.push({ title: 'Fórmula', body: ml(I('V') + ' = π · ' + I('r') + '² · ' + I('h')) });
        st.push({ title: 'Substituir', body: ml(I('V') + ' = ' + pt + ' · ' + F(d.r) + '² · ' + F(d.h) + ' = ' + pt + ' · ' + F(d.r * d.r) + ' · ' + F(d.h)) });
        st.push({ title: 'Calcular', body: ml(I('V') + ' ' + GE.eqs(V()) + ' ' + F(V()) + ' ' + u3) + (GE.state.pi === 'pi' ? '' : '<p class="note">Área da base: ' + F(Ab2) + ' ' + u2 + '.</p>'), ans: 1 });
        ans = F(V()) + ' ' + u3; open = figOpen();
        break;
      }
      case 'h': {
        const A = d.c * d.L, Vv = V();
        text = e.what + ' tem forma de paralelepípedo com base de ' + F(d.c) + ' cm por ' + F(d.L) + ' cm e volume de ' + F(Vv) + ' cm³. Qual é a altura?';
        st.push(dados(['base: ' + F(d.c) + ' cm × ' + F(d.L) + ' cm', 'volume ' + I('V') + ' = ' + F(Vv) + ' cm³', 'altura ' + I('h') + ' = ?']));
        st.push({ title: 'Área da base', body: ml(Ab + ' = ' + F(d.c) + ' · ' + F(d.L) + ' = ' + F(A) + ' cm²') });
        st.push({ title: 'Montar a equação', body: ml(I('V') + ' = ' + Ab + ' · ' + I('h')) + ml(F(Vv) + ' = ' + F(A) + ' · ' + I('h')) });
        st.push({ title: 'Calcular', body: ml(I('h') + ' = ' + F(Vv) + ' ÷ ' + F(A) + ' = ' + F(d.h) + ' cm'), ans: 1 });
        ans = F(d.h) + ' cm'; open = figOpen();
        break;
      }
      case 'areaPara': {
        const a1 = d.c * d.L, a2 = d.c * d.h, a3 = d.L * d.h, T = 2 * (a1 + a2 + a3);
        text = 'Quantos cm² de papelão são necessários para montar ' + e.what + ' fechada de ' + F(d.c) + ' cm × ' + F(d.L) + ' cm × ' + F(d.h) + ' cm (sem contar as abas)?';
        st.push(dados(['medidas: ' + F(d.c) + ', ' + F(d.L) + ' e ' + F(d.h) + ' cm', 'a caixa tem 6 faces, iguais duas a duas']));
        st.push({ title: 'Planificar', body: '<p>Abrindo a caixa: 2 faces de ' + F(d.c) + ' × ' + F(d.L) + ', 2 de ' + F(d.c) + ' × ' + F(d.h) + ' e 2 de ' + F(d.L) + ' × ' + F(d.h) + '.</p>' });
        st.push({ title: 'Área de cada par', body: ml('2 · ' + F(a1) + ' = ' + F(2 * a1)) + ml('2 · ' + F(a2) + ' = ' + F(2 * a2)) + ml('2 · ' + F(a3) + ' = ' + F(2 * a3)) });
        st.push({ title: 'Somar', body: ml(I('A') + ' = ' + F(2 * a1) + ' + ' + F(2 * a2) + ' + ' + F(2 * a3) + ' = ' + F(T) + ' cm²'), ans: 1 });
        ans = F(T) + ' cm²'; open = { view: 'net', patch: { solid: 'para', d: Object.assign({}, GE.state.net.d, d), unit: 'cm', q: '', step: 0 } };
        break;
      }
      case 'dias': {
        const Vv = V(), L = Math.round(Vv * 100) / 100 * 1000, day = e.people * e.per, n = L / day;
        text = 'Uma cisterna cilíndrica tem ' + F(d.r) + ' m de raio e ' + F(d.h) + ' m de altura. Uma família de ' + e.people + ' pessoas gasta ' + F(e.per) + ' L por pessoa, por dia. Cheia, a cisterna dura quantos dias? Use π = ' + pt + '.';
        st.push(dados(['raio ' + F(d.r) + ' m, altura ' + F(d.h) + ' m', e.people + ' pessoas × ' + F(e.per) + ' L por dia']));
        st.push({ title: 'Volume', body: ml(I('V') + ' = ' + pt + ' · ' + F(d.r) + '² · ' + F(d.h) + ' ' + GE.eqs(Vv, 2) + ' ' + F(Vv, 2) + ' m³'), ans: 1 });
        st.push({ title: 'Litros', body: ml(F(Vv, 2) + ' m³ = ' + F(L, 0) + ' L') });
        st.push({ title: 'Consumo por dia', body: ml(e.people + ' · ' + F(e.per) + ' = ' + F(day) + ' L') });
        st.push({ title: 'Dias', body: ml(F(L, 0) + ' ÷ ' + F(day) + ' ≈ ' + F(n, 1)) + '<p>Cerca de <b>' + F(Math.floor(n), 0) + ' dias</b> completos.</p>' });
        ans = 'cerca de ' + F(Math.floor(n), 0) + ' dias'; open = figOpen();
        break;
      }
      case 'Vhex': {
        const At = d.L * d.L * Math.sqrt(3) / 4;
        text = 'Qual é o volume de ' + e.what + ' em forma de prisma de base hexagonal regular com lado de ' + F(d.L) + ' cm e altura de ' + F(d.h) + ' cm?';
        st.push(dados(['lado do hexágono ' + I('L') + ' = ' + F(d.L) + ' cm', 'altura ' + I('h') + ' = ' + F(d.h) + ' cm']));
        st.push({ title: 'Dividir a base', body: '<p>O hexágono regular é formado por 6 triângulos equiláteros de lado ' + F(d.L) + ' cm.</p>' });
        st.push({ title: 'Um triângulo (Pitágoras)', body: ml('altura = ' + I('L') + '√3 / 2 = ' + GE.geom.symTxt(d.L / 2, '√3') + ' cm') + ml(I('A') + '<sub>tri</sub> = ' + F(d.L) + ' · ' + GE.geom.symTxt(d.L / 2, '√3') + ' ÷ 2 = ' + GE.geom.symTxt(d.L * d.L / 4, '√3') + ' cm²') });
        st.push({ title: 'Área da base', body: ml(Ab + ' = 6 · ' + GE.geom.symTxt(d.L * d.L / 4, '√3') + ' = ' + GE.geom.symTxt(1.5 * d.L * d.L, '√3') + ' ≈ ' + F(6 * At) + ' cm²') });
        st.push({ title: 'Volume', body: ml(I('V') + ' = ' + GE.geom.symTxt(1.5 * d.L * d.L, '√3') + ' · ' + F(d.h) + ' = ' + GE.geom.symTxt(1.5 * d.L * d.L * d.h, '√3') + ' ≈ ' + F(V()) + ' cm³'), ans: 1 });
        ans = GE.geom.symTxt(1.5 * d.L * d.L * d.h, '√3') + ' ≈ ' + F(V()) + ' cm³'; open = figOpen();
        break;
      }
      case 'a': {
        const Vv = V(), A = d.a * d.a;
        text = e.what + ' tem forma de prisma de base quadrada, com volume de ' + F(Vv) + ' m³ e altura de ' + F(d.h) + ' m. Quanto mede a aresta da base?';
        st.push(dados(['volume ' + I('V') + ' = ' + F(Vv) + ' m³', 'altura ' + I('h') + ' = ' + F(d.h) + ' m', 'base quadrada de aresta ' + I('a') + ' = ?']));
        st.push({ title: 'Área da base', body: ml(Ab + ' = ' + I('V') + ' ÷ ' + I('h') + ' = ' + F(Vv) + ' ÷ ' + F(d.h) + ' = ' + F(A) + ' m²') });
        st.push({ title: 'Raiz quadrada', body: '<p>A base é um quadrado: ' + I('a') + '² = ' + F(A) + '.</p>' + ml(I('a') + ' = √' + F(A) + ' = ' + F(d.a) + ' m'), ans: 1 });
        ans = F(d.a) + ' m'; open = figOpen();
        break;
      }
      case 'areaCil': {
        const lat = 2 * d.r * d.h, top = d.r * d.r, T = (lat + top) * pv, L = T / e.paint;
        text = 'Vão pintar a parede lateral e a tampa de cima de ' + e.what + ' cilíndrico(a) de ' + F(d.r) + ' m de raio e ' + F(d.h) + ' m de altura. Cada litro de tinta cobre ' + F(e.paint) + ' m². Quantos litros são necessários? Use π = ' + pt + '.';
        text = text.replace('cilíndrico(a)', /^uma/.test(e.what) ? 'cilíndrica' : 'cilíndrico');
        st.push(dados(['raio ' + F(d.r) + ' m, altura ' + F(d.h) + ' m', 'pintar: parede lateral + tampa (o fundo não)', '1 L cobre ' + F(e.paint) + ' m²']));
        st.push({ title: 'Parede (retângulo)', body: '<p>Desenrolada, a parede é um retângulo de base 2π' + I('r') + ' e altura ' + I('h') + '.</p>' + ml('2 · π · ' + F(d.r) + ' · ' + F(d.h) + ' = ' + GE.geom.symTxt(lat, 'π') + ' m²') });
        st.push({ title: 'Tampa (círculo)', body: ml('π · ' + F(d.r) + '² = ' + GE.geom.symTxt(top, 'π') + ' m²') });
        st.push({ title: 'Área total', body: ml(GE.geom.symTxt(lat, 'π') + ' + ' + GE.geom.symTxt(top, 'π') + ' = ' + GE.geom.symTxt(lat + top, 'π') + ' ' + GE.eqs(T) + ' ' + F(T) + ' m²') });
        st.push({ title: 'Litros de tinta', body: ml(F(T) + ' ÷ ' + F(e.paint) + ' ' + GE.eqs(L) + ' ' + F(L)) + '<p>São necessários <b>' + F(Math.ceil(L - 1e-9), 0) + ' litros</b>.</p>', ans: 1 });
        ans = F(Math.ceil(L - 1e-9), 0) + ' litros'; open = { view: 'net', patch: { solid: 'cil', d: Object.assign({}, GE.state.net.d, d), unit: 'm', q: '', step: 0 } };
        break;
      }
      case 'capCil': {
        const Vv = V(), L = Vv * 1000, n = L / e.pack.v;
        text = 'Um(a) ' + e.what.replace(/^um(a)? /, '') + ' cilíndrico(a) tem ' + F(d.r) + ' m de raio e ' + F(d.h) + ' m de altura. Quantos litros cabem nele(a)? Isso enche quantos ' + e.pack.n + '? Use π = ' + pt + '.';
        text = text.replace(/Um\(a\) (\S+)/, (m0, w) => (/^(caixa|tanque de leite)/.test(w) ? 'Uma ' : 'Um ') + w);
        text = /caixa/.test(e.what) ? text.replace('cilíndrico(a)', 'cilíndrica').replace('nele(a)', 'nela') : text.replace('cilíndrico(a)', 'cilíndrico').replace('nele(a)', 'nele');
        text = text.replace(/^Uma tanque/, 'Um tanque');
        st.push(dados(['raio ' + F(d.r) + ' m, altura ' + F(d.h) + ' m', '1 m³ = 1 000 L']));
        st.push({ title: 'Volume', body: ml(I('V') + ' = ' + pt + ' · ' + F(d.r) + '² · ' + F(d.h) + ' ' + GE.eqs(Vv) + ' ' + F(Vv) + ' m³'), ans: 1 });
        st.push({ title: 'Litros', body: ml(F(Vv) + ' · 1 000 = ' + F(L) + ' L') });
        st.push({ title: 'Quantos ' + e.pack.n.split(' ')[0] + '?', body: ml(F(L) + ' ÷ ' + F(e.pack.v) + ' ≈ ' + F(n, 1)) + '<p>Enche ' + F(Math.floor(n), 0) + ' ' + e.pack.n + ' completos.</p>' });
        ans = F(L) + ' L, cerca de ' + F(Math.floor(n), 0) + ' ' + e.pack.n; open = figOpen({ cap: true });
        break;
      }
    }
    st.unshift({ title: TNAME[e.type], tag: 'nível ' + e.lvl, body: '<p class="qtext">' + esc(text) + '</p><p class="note">Resolvam antes de avançar.</p>' });
    st.push({ title: 'Resposta', body: '<p class="qtext">' + esc(text) + '</p><p class="answer"><b>' + ans + '</b></p>', ans: 1 });
    return { text, steps: st, ans, open, figAsk };
  }

  /* ================= Qual é a vista? ================= */
  const VNAMES = { frente: 'frontal', cima: 'superior', esq: 'lateral esquerda', dir: 'lateral direita' };
  function pileRand() {
    let H;
    do {
      H = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => (Math.random() < 0.4 ? 0 : between(1, 3))));
    } while (H.flat().filter((x) => x).length < 5 || H.flat().filter((x) => x).length > 12);
    return H;
  }
  function viewOf(H, k) {
    // matriz de células (linha 0 = em cima)
    if (k === 'cima') return H.map((r) => r.map((h) => (h > 0 ? 1 : 0)));
    const cols = [0, 1, 2, 3].map((j) => {
      if (k === 'frente') return Math.max.apply(null, [0, 1, 2, 3].map((z) => H[z][j]));
      if (k === 'esq') return Math.max.apply(null, H[j]);
      return Math.max.apply(null, H[3 - j]);
    });
    return [3, 2, 1, 0].map((y) => cols.map((c) => (c > y ? 1 : 0)));
  }
  const vkey = (M) => M.map((r) => r.join('')).join('/');
  function trim(M) {
    // tira linhas e colunas vazias (a vista não mostra onde fica)
    let r0 = 0, r1 = M.length - 1, c0 = 0, c1 = M[0].length - 1;
    const rowE = (i) => M[i].every((x) => !x), colE = (j) => M.every((r) => !r[j]);
    while (r0 < r1 && rowE(r0)) r0++;
    while (r1 > r0 && rowE(r1)) r1--;
    while (c0 < c1 && colE(c0)) c0++;
    while (c1 > c0 && colE(c1)) c1--;
    return M.slice(r0, r1 + 1).map((r) => r.slice(c0, c1 + 1));
  }
  function newVistaQ() {
    const H = pileRand();
    const k = pick(['frente', 'cima', 'esq', 'dir']);
    const right = trim(viewOf(H, k));
    const cands = [];
    ['frente', 'cima', 'esq', 'dir'].forEach((x) => cands.push(trim(viewOf(H, x))));
    cands.push(right.map((r) => r.slice().reverse()));
    for (let t = 0; t < 6; t++) {
      const H2 = H.map((r) => r.slice());
      H2[rnd(4)][rnd(4)] = between(0, 3);
      cands.push(trim(viewOf(H2, k)));
    }
    const opts = [right];
    const seen = new Set([vkey(right)]);
    cands.forEach((c) => { if (opts.length < 4 && !seen.has(vkey(c))) { seen.add(vkey(c)); opts.push(c); } });
    while (opts.length < 4) { const c = trim(viewOf(pileRand(), k)); if (!seen.has(vkey(c))) { seen.add(vkey(c)); opts.push(c); } }
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    return { H: H.map((r) => r.join('')).join(''), k, opts: order.map((i) => opts[i]), right: order.indexOf(0), pick: -1 };
  }
  function gridSvg(M, cls) {
    const c = 26, w = M[0].length * c, h = M.length * c;
    let o = '<svg class="vgrid ' + (cls || '') + '" viewBox="-4 -4 ' + (w + 8) + ' ' + (h + 8) + '" style="width:' + Math.min(150, w + 8) + 'px">';
    M.forEach((r, i) => r.forEach((x, j) => { if (x) o += '<rect x="' + j * c + '" y="' + i * c + '" width="' + c + '" height="' + c + '"/>'; }));
    return o + '</svg>';
  }

  /* ================= Que sólido gira? ================= */
  function newRevQ() {
    const L = GE.REV_SHAPES;
    const sh = pick(L);
    const dir = Math.random() < 0.5 ? 'flag' : 'solid';
    let opts;
    if (dir === 'flag') opts = sh.opts.slice().sort(() => Math.random() - 0.5);
    else {
      const others = L.filter((x) => x.id !== sh.id && x.solid !== sh.solid).sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.id);
      opts = others.concat([sh.id]).sort(() => Math.random() - 0.5);
    }
    return { id: sh.id, dir, opts, pick: -1 };
  }
  function flagSvg(sh, big) {
    const prof = sh.prof();
    const ymax = Math.max.apply(null, prof.map((p) => p[1]));
    const k = big ? 70 : 34, W = big ? 220 : 90, Hh = big ? 230 : 110;
    return '<svg class="flagsvg" viewBox="0 0 ' + W + ' ' + Hh + '" style="width:' + W + 'px"><line x1="' + (W / 2 - 20) + '" y1="4" x2="' + (W / 2 - 20) + '" y2="' + (Hh - 4) + '" class="pole2"/><path d="M' +
      prof.map((p) => G.f1(W / 2 - 20 + p[0] * k) + ' ' + G.f1(12 + (ymax - p[1]) * k)).join('L') + 'Z" fill="' + sh.color + '" class="flat-flag"/></svg>';
  }

  /* ================= Estado e desenho ================= */
  let view = null, stp = null;
  function cur() {
    const o = S();
    if (!o.ex) { o.ex = gen(o.lvl); }
    return build(o.ex);
  }
  function steps() {
    const o = S();
    if (o.g !== 'ex') return [{ title: '', body: '', scene: { a: 1 } }];
    return cur().steps.map((st, i) => Object.assign({}, st, { scene: { ans: st.ans ? 1 : 0, k: i } }));
  }
  function drawEx(s) {
    const o = S();
    const e = o.ex;
    const svg = $('game-svg');
    if (!e || e.type === 'conv') {
      const c = build(e);
      const shown = s.ans > 0.5;
      svg.innerHTML = '<text class="bigq" x="500" y="250" text-anchor="middle">' + F(e.v, 6) + ' ' + e.from + ' = ' + (shown ? '<tspan class="found">' + c.ans + '</tspan>' : '<tspan class="unk">? ' + e.to + '</tspan>') + '</text>';
      return;
    }
    const b = build(e);
    const vo = { solid: e.solid, d: Object.assign({}, GE.state.vol.d, e.d), unit: e.unit, ask: b.figAsk, cap: false, obl: false, lying: false, grid: false, lab: true };
    const sc = GE.geom.sc({ ans: s.ans > 0.5 ? 1 : 0 });
    GE.geom.drawTo(svg, vo, sc, view, { size: 190, cy: 270 });
  }
  function drawVista() {
    const o = S();
    if (!o.vq) o.vq = newVistaQ();
    const q = o.vq;
    const H = [0, 1, 2, 3].map((k) => q.H.slice(k * 4, k * 4 + 4).split('').map(Number));
    // pilha em 3D (mesma construção da aba Projeções)
    const m = pileMesh(H);
    const cam = G.cam(view.apply({ s: 62, cx: 500, cy: 300, center: [0, 1.2, 0] }));
    const r = G.render(m, cam, { colors: { '*': '#f2a15f' }, outline: 'edge', edges: false });
    // indica a frente
    const fr = cam.p([0, 0, 2.6]);
    $('game-svg').innerHTML = r.faces + '<text class="tag3" x="' + G.f1(fr[0]) + '" y="' + G.f1(fr[1] + 22) + '">frente</text>';
  }
  const pileMesh = (H) => GE.pileMesh(H);
  function drawRev() {
    const o = S();
    if (!o.rq) o.rq = newRevQ();
    const q = o.rq;
    const sh = GE.REV_SHAPES.find((x) => x.id === q.id);
    if (q.dir === 'flag') {
      $('game-svg').innerHTML = '<g transform="translate(390 60) scale(1.1)">' + flagSvg(sh, true).replace(/<svg[^>]*>|<\/svg>/g, '') + '</g><text class="tag3" x="500" y="500">Girando pelo palito, que sólido aparece?</text>';
    } else {
      const m = G.revolve(sh.prof(), Math.PI * 2, 56);
      const cam = G.cam(view.apply({ s: 110, cx: 500, cy: 280, center: [0, 1.1, 0] }));
      const r = G.render(m, cam, { colors: { '*': '#f2a15f' }, hidden: GE.state.hidden });
      $('game-svg').innerHTML = r.hidden + r.faces + r.edges + '<text class="tag3" x="500" y="510">Que bandeirinha, girando, forma este sólido?</text>';
    }
  }
  function draw(s) {
    const o = S();
    if (o.g === 'ex') drawEx(s);
    else if (o.g === 'vista') drawVista();
    else drawRev();
  }

  /* ---------- Painel do jogo ---------- */
  function renderArea() {
    const o = S();
    document.querySelectorAll('#game-g [data-v]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === o.g));
    document.querySelectorAll('#game-lvl [data-v]').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.v) === o.lvl));
    $('game-lvl').hidden = o.g !== 'ex';
    $('game-stepper').hidden = o.g !== 'ex';
    $('game-exbtns').hidden = o.g !== 'ex';
    $('game-svg').classList.toggle('short', o.g !== 'ex');
    $('game-stepcard').hidden = o.g !== 'ex';
    const area = $('game-opts');
    if (o.g === 'ex') {
      const c = cur();
      $('game-q').innerHTML = '<span class="book">' + TNAME[o.ex.type] + ' · nível ' + o.lvl + '</span> ' + esc(c.text);
      area.innerHTML = '';
    } else if (o.g === 'vista') {
      if (!o.vq) o.vq = newVistaQ();
      const q = o.vq;
      $('game-q').innerHTML = '<span class="book">Qual é a vista?</span> Qual destas figuras é a <b>vista ' + VNAMES[q.k] + '</b> da pilha de cubos? Arraste para girar a pilha.';
      area.innerHTML = '<div class="opt-row">' + q.opts.map((M, i) => '<button class="opt' + (q.pick >= 0 ? (i === q.right ? ' ok' : i === q.pick ? ' no' : '') : '') + '" data-o="' + i + '"><span class="opt-l">' + 'ABCD'[i] + '</span>' + gridSvg(M) + '</button>').join('') + '</div>' + resultBox(q, 'vista');
    } else {
      if (!o.rq) o.rq = newRevQ();
      const q = o.rq;
      const sh = GE.REV_SHAPES.find((x) => x.id === q.id);
      $('game-q').innerHTML = '<span class="book">Que sólido gira?</span> ' + (q.dir === 'flag' ? 'Esta bandeirinha gira em torno do palito. Que sólido ela forma?' : 'Qual bandeirinha forma este sólido ao girar?');
      area.innerHTML = '<div class="opt-row">' + q.opts.map((x, i) => {
        const inner = q.dir === 'flag' ? '<span class="opt-t">' + esc(x) + '</span>' : flagSvg(GE.REV_SHAPES.find((y) => y.id === x), false);
        const right = q.dir === 'flag' ? x === sh.solid : x === sh.id;
        return '<button class="opt' + (q.pick >= 0 ? (right ? ' ok' : i === q.pick ? ' no' : '') : '') + '" data-o="' + i + '"><span class="opt-l">' + 'ABCD'[i] + '</span>' + inner + '</button>';
      }).join('') + '</div>' + resultBox(q, 'rev');
    }
    renderTeams();
  }
  function isRight(q, kind, i) {
    if (kind === 'vista') return i === q.right;
    const sh = GE.REV_SHAPES.find((x) => x.id === q.id);
    return q.dir === 'flag' ? q.opts[i] === sh.solid : q.opts[i] === sh.id;
  }
  function resultBox(q, kind) {
    if (q.pick < 0) return '<p class="note">Cada equipe escolhe uma letra. Toque na resposta da turma para conferir.</p>';
    const ok = isRight(q, kind, q.pick);
    let why = '';
    if (kind === 'rev') { const sh = GE.REV_SHAPES.find((x) => x.id === q.id); why = ' ' + sh.flag + ' → <b>' + sh.solid + '</b>.'; }
    return '<div class="g-msg"><p class="big-msg ' + (ok ? 'ok' : 'err') + '"><b>' + (ok ? 'Certo!' : 'Não é essa.') + '</b>' + why + '</p>' +
      (ok ? '<p>Quem acertou ganha 2 pontos:</p>' + teamButtons('win') : '<p>A resposta certa está em verde.</p>') + '</div>';
  }

  /* ---------- Equipes e cronômetro ---------- */
  function teams() { return S().teams; }
  function saveTeams(t) { GE.set({ game: Object.assign({}, S(), { teams: t }) }, { quiet: true }); renderTeams(); }
  function renderTeams() {
    const t = teams();
    const best = Math.max.apply(null, t.map((x) => x.p));
    $('game-teams').innerHTML = t.map((x, i) =>
      '<li class="team" style="--tc:' + COLORS[i % 4] + '"><input class="team-name" data-t="' + i + '" value="' + esc(x.n) + '" aria-label="Nome da equipe ' + (i + 1) + '">' +
      '<span class="team-pts">' + x.p + (x.p === best && best > 0 ? ' ★' : '') + '</span>' +
      '<button class="icon-btn sm" data-dec="' + i + '" aria-label="Tirar 1 ponto">−</button><button class="icon-btn sm" data-inc="' + i + '" aria-label="Dar 1 ponto">+</button></li>').join('');
    $('game-team-add').disabled = t.length >= 4;
    $('game-team-del').disabled = t.length <= 1;
    const tb = $('game-exteams');
    if (tb) tb.innerHTML = S().g === 'ex' ? '<span class="flabel">Acertou:</span>' + teamButtons('ex') : '';
  }
  function teamButtons(act) {
    return '<div class="team-btns">' + teams().map((x, i) => '<button class="btn team-btn" style="--tc:' + COLORS[i % 4] + '" data-act="' + act + '" data-team="' + i + '">' + esc(x.n) + '</button>').join('') + '</div>';
  }
  function addPoints(i, pts) {
    const t = teams().map((x) => Object.assign({}, x));
    if (!t[i]) return;
    t[i].p += pts;
    saveTeams(t);
    GE.toast('+' + pts + ' para ' + t[i].n);
  }
  let clock = { left: 60, run: false, id: 0 };
  function clockDraw() {
    const s = Math.max(0, clock.left);
    $('game-clock').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    $('game-clock').classList.toggle('end', s === 0);
    $('game-clock').classList.toggle('low', s > 0 && s <= 10);
    $('game-clock-go').textContent = clock.run ? 'Pausar' : clock.left === 0 ? 'Recomeçar' : 'Iniciar';
    document.querySelectorAll('#game-clock-len button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.v) === S().clock));
  }
  function clockReset() { clearInterval(clock.id); clock = { left: S().clock, run: false, id: 0 }; clockDraw(); }
  function clockToggle() {
    if (clock.run) { clearInterval(clock.id); clock.run = false; clockDraw(); return; }
    if (clock.left === 0) clock.left = S().clock;
    clock.run = true;
    clock.id = setInterval(() => {
      clock.left--;
      if (clock.left <= 0) { clock.left = 0; clearInterval(clock.id); clock.run = false; beep(); }
      clockDraw();
    }, 1000);
    clockDraw();
  }
  function beep() {
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      const ctx = new A();
      [0, 0.25, 0.5].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.2, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.21);
      });
    } catch (e) { /* sem som */ }
  }

  function newRound() {
    const o = S();
    const patch = { step: 0 };
    if (o.g === 'ex') patch.ex = gen(o.lvl);
    if (o.g === 'vista') patch.vq = newVistaQ();
    if (o.g === 'rev') patch.rq = newRevQ();
    view.home({ yaw: -32, pitch: 24 });
    GE.patch('game', patch);
  }

  const mod = {
    defaults: DEF,
    sanitize,
    svgId: 'game-svg',
    name: () => 'Desafios · ' + ({ ex: 'exercícios', vista: 'qual é a vista?', rev: 'que sólido gira?' })[S().g],
    init() {
      view = G.viewer({ svg: $('game-svg'), prefix: 'game', cam0: { yaw: -32, pitch: 24 }, redraw: () => stp && stp.redraw() });
      stp = GE.stepper({
        prefix: 'game', steps, draw,
        getIndex: () => S().step,
        setIndex: (i) => GE.set({ game: Object.assign({}, S(), { step: i }) }, { quiet: true }),
      });
      stp.bind();
      $('game-g').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b && b.dataset.v !== S().g) { GE.patch('game', { g: b.dataset.v, step: 0 }); } });
      $('game-lvl').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) GE.patch('game', { lvl: Number(b.dataset.v), ex: gen(Number(b.dataset.v)), step: 0 }); });
      $('game-new').addEventListener('click', newRound);
      $('game-copy').addEventListener('click', () => {
        const t = cur().text;
        try { navigator.clipboard.writeText(t).then(() => GE.toast('Enunciado copiado.'), () => GE.toast(t)); } catch (e) { GE.toast(t); }
      });
      $('game-open').addEventListener('click', () => {
        const op = cur().open;
        if (!op) return;
        const patch = { view: op.view, [op.view]: Object.assign({}, GE.state[op.view], op.patch) };
        GE.set(patch);
      });
      $('game-opts').addEventListener('click', (e) => {
        const o = S();
        const b = e.target.closest('[data-o]');
        const t = e.target.closest('[data-act]');
        if (t) { addPoints(Number(t.dataset.team), 2); return; }
        if (!b) return;
        const key = o.g === 'vista' ? 'vq' : 'rq';
        const q = Object.assign({}, o[key], { pick: Number(b.dataset.o) });
        GE.set({ game: Object.assign({}, o, { [key]: q }) }, { quiet: true });
        renderArea();
        if (o.g === 'vista' && isRight(q, 'vista', q.pick)) {
          // a câmera vai até a vista pedida
          const V = { frente: { yaw: 0, pitch: 0 }, cima: { yaw: 0, pitch: 90 }, esq: { yaw: 90, pitch: 0 }, dir: { yaw: -90, pitch: 0 } }[q.k];
          view.goTo(V, 1200);
        }
      });
      $('game-exteams').addEventListener('click', (e) => { const t = e.target.closest('[data-act]'); if (t) addPoints(Number(t.dataset.team), 2 + S().lvl - 1); });
      $('game-teams').addEventListener('click', (e) => {
        const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
        const t = teams().map((x) => Object.assign({}, x));
        if (inc) { t[Number(inc.dataset.inc)].p++; saveTeams(t); }
        if (dec) { t[Number(dec.dataset.dec)].p--; saveTeams(t); }
      });
      $('game-teams').addEventListener('change', (e) => {
        const inp = e.target.closest('[data-t]');
        if (!inp) return;
        const t = teams().map((x) => Object.assign({}, x));
        t[Number(inp.dataset.t)].n = inp.value.trim() || 'Equipe ' + (Number(inp.dataset.t) + 1);
        saveTeams(t);
      });
      $('game-team-add').addEventListener('click', () => { const t = teams().slice(); if (t.length < 4) { t.push({ n: 'Equipe ' + (t.length + 1), p: 0 }); saveTeams(t); renderArea(); } });
      $('game-team-del').addEventListener('click', () => { const t = teams().slice(); if (t.length > 1) { t.pop(); saveTeams(t); renderArea(); } });
      $('game-team-zero').addEventListener('click', () => saveTeams(teams().map((x) => ({ n: x.n, p: 0 }))));
      $('game-clock-go').addEventListener('click', clockToggle);
      $('game-clock-reset').addEventListener('click', clockReset);
      $('game-clock-len').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { GE.set({ game: Object.assign({}, S(), { clock: Number(b.dataset.v) }) }, { quiet: true }); clockReset(); } });
      GE.on((changed, prev, opts) => {
        if (changed.includes('game') && !opts.quiet) {
          const a = prev.game || {}, b = S();
          const onlyStep = Object.keys(b).every((k) => k === 'step' || JSON.stringify(a[k]) === JSON.stringify(b[k]));
          if (!onlyStep) { renderArea(); stp.rebuild(false); } else if (GE.state.view === 'game') stp.rebuild(true);
        }
        if (changed.some((k) => ['pi', 'dec', 'hidden'].includes(k))) { renderArea(); stp.rebuild(false); }
      });
      clock.left = S().clock;
      clockDraw();
      renderArea();
      stp.rebuild(false);
    },
    render() { renderArea(); stp.rebuild(false); },
    redraw() { stp.redraw(); },
    next() { if (S().g === 'ex') stp.next(); },
    prev() { if (S().g === 'ex') stp.prev(); },
    first() { if (S().g === 'ex') stp.first(); },
    stepper: () => stp,
    key(e) { if (e.key.toLowerCase() === 'n') { newRound(); return true; } return false; },
  };
  GE.register('game', mod);
})();
