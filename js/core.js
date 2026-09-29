/* Estado compartilhado, números, link, animação e o controlador de passos. */
(function () {
  'use strict';
  const GE = (window.GE = window.GE || {});
  GE.modules = {};

  const VIEWS = ['vol', 'rev', 'cap', 'net', 'proj', 'game', 'box'];
  GE.VIEWS = VIEWS;
  const DEFAULTS = {
    view: 'vol',
    pi: '3.14',         // '3.14' | '3' | 'pi' (deixa o π indicado)
    dec: 2,
    theme: 'light',     // tema claro por padrão ('auto' segue o sistema)
    themeV: 2,
    font: 1,
    speed: 1,
    hidden: true,       // arestas ocultas tracejadas
  };
  const STORE_KEY = 'geometria-espacial:v1';
  const listeners = [];

  GE.DEFAULTS = DEFAULTS;
  GE.state = Object.assign({}, DEFAULTS);

  /* Cada aba guarda o que é seu num objeto próprio (state.vol, state.rev...). */
  GE.register = function (view, mod) {
    GE.modules[view] = mod;
    DEFAULTS[view] = mod.defaults;
    if (!(view in GE.state)) GE.state[view] = JSON.parse(JSON.stringify(mod.defaults));
  };

  GE.on = function (fn) { listeners.push(fn); };
  GE.set = function (patch, opts) {
    const prev = Object.assign({}, GE.state);
    Object.assign(GE.state, patch);
    sanitize(GE.state);
    const changed = Object.keys(patch).filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(GE.state[k]));
    if (!changed.length && !(opts && opts.force)) return;
    save();
    listeners.forEach((fn) => fn(changed, prev, opts || {}));
  };
  /* Muda só alguns campos do objeto de uma aba. */
  GE.patch = function (view, sub, opts) {
    GE.set({ [view]: Object.assign({}, GE.state[view], sub) }, opts);
  };

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  GE.clamp = clamp;
  GE.num = function (v, d, lo, hi) {
    const n = Number(v);
    return isFinite(n) ? clamp(n, lo, hi) : d;
  };
  function sanitize(s) {
    if (!VIEWS.includes(s.view)) s.view = 'vol';
    if (!['3.14', '3', 'pi'].includes(s.pi)) s.pi = '3.14';
    s.dec = clamp(Math.round(Number(s.dec)), 0, 4);
    if (isNaN(s.dec)) s.dec = 2;
    s.font = clamp(Number(s.font) || 1, 0.85, 1.6);
    s.speed = clamp(Number(s.speed) || 1, 0.25, 3);
    s.hidden = s.hidden !== false;
    if (!['auto', 'light', 'dark'].includes(s.theme)) s.theme = 'light';
    Object.keys(GE.modules).forEach((v) => {
      const m = GE.modules[v];
      const o = s[v] && typeof s[v] === 'object' ? s[v] : {};
      s[v] = m.sanitize(Object.assign(JSON.parse(JSON.stringify(m.defaults)), o));
    });
  }
  GE.sanitize = () => sanitize(GE.state);

  /* ---------- Números (vírgula decimal, espaço nos milhares) ---------- */
  GE.tidy = function (v) { return Math.round(v * 1e9) / 1e9; };
  GE.fmt = function (v, dec) {
    if (v == null || isNaN(v)) return '?';
    if (!isFinite(v)) return '∞';
    const d = dec == null ? GE.state.dec : dec;
    const p = Math.pow(10, d);
    let r = Math.round(v * p) / p;
    if (Object.is(r, -0)) r = 0;
    let s = Math.abs(r).toFixed(d);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [ip, fp] = s.split('.');
    if (ip.length > 3) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (r < 0 ? '−' : '') + ip + (fp ? ',' + fp : '');
  };
  /* Arredonda para mostrar mas avisa quando é aproximação. */
  GE.approx = function (v, dec) {
    const d = dec == null ? GE.state.dec : dec;
    const p = Math.pow(10, d);
    return Math.abs(Math.round(v * p) / p - v) > 1e-9;
  };
  GE.eqs = function (v, dec) { return GE.approx(v, dec) ? '≈' : '='; };
  GE.parseNum = function (t) {
    const s = String(t == null ? '' : t).trim().replace(/\s/g, '').replace(',', '.');
    if (!s) return NaN;
    return Number(s);
  };
  /* Valor de π usado nas contas. */
  GE.piVal = function () { return GE.state.pi === '3' ? 3 : GE.state.pi === 'pi' ? Math.PI : 3.14; };
  GE.piTxt = function () { return GE.state.pi === '3' ? '3' : GE.state.pi === 'pi' ? 'π' : '3,14'; };
  GE.sup = (n) => '<sup>' + n + '</sup>';

  /* ---------- Persistência ---------- */
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(GE.state)); } catch (e) { /* sem armazenamento */ }
  }
  GE.loadSaved = function () {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (!saved.themeV) { saved.theme = 'light'; saved.themeV = 2; }
        Object.assign(GE.state, saved);
      }
    } catch (e) { /* ignora */ }
    sanitize(GE.state);
  };

  /* ---------- Link compartilhável: #v=vol~s={...}~pi=3.14~n=2 ---------- */
  GE.encodeHash = function () {
    const s = GE.state;
    const parts = ['v=' + s.view];
    if (s[s.view]) parts.push('s=' + encodeURIComponent(JSON.stringify(s[s.view])));
    parts.push('pi=' + s.pi, 'n=' + s.dec);
    if (!s.hidden) parts.push('h=0');
    return parts.join('~');
  };
  GE.decodeHash = function (hash) {
    const h = (hash || '').replace(/^#/, '');
    if (!h || h.indexOf('=') < 0) return null;
    const out = {};
    let sub = null;
    h.split('~').forEach((tok) => {
      const i = tok.indexOf('=');
      if (i < 1) return;
      const k = tok.slice(0, i);
      let v = tok.slice(i + 1);
      try { v = decodeURIComponent(v); } catch (e) { return; }
      if (k === 'v') out.view = v;
      else if (k === 's') { try { sub = JSON.parse(v); } catch (e) { /* ignora */ } }
      else if (k === 'pi') out.pi = v;
      else if (k === 'n') out.dec = parseInt(v, 10);
      else if (k === 'h') out.hidden = v !== '0';
    });
    if (sub && out.view && VIEWS.includes(out.view)) out[out.view] = sub;
    return Object.keys(out).length ? out : null;
  };

  /* ---------- Animação ---------- */
  GE.reducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  GE.ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  GE.tween = function (duration, onFrame, onDone) {
    let raf = 0, start = 0, cancelled = false;
    if (duration <= 0 || GE.reducedMotion()) {
      onFrame(1);
      if (onDone) onDone();
      return { cancel() {} };
    }
    function frame(ts) {
      if (cancelled) return;
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      onFrame(t);
      if (t < 1) raf = requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    raf = requestAnimationFrame(frame);
    return { cancel() { cancelled = true; cancelAnimationFrame(raf); } };
  };
  GE.lerp = (a, b, t) => a + (b - a) * t;
  /* Parte t de [a, b] (0 antes de a, 1 depois de b). */
  GE.seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

  /* Mistura dois "quadros" de cena: números viram tween, o resto troca na hora. */
  function mixScene(a, b, t) {
    const out = {};
    Object.keys(b).forEach((k) => {
      const va = a[k], vb = b[k];
      if (typeof vb === 'number' && typeof va === 'number') out[k] = va + (vb - va) * t;
      else out[k] = vb;
    });
    return out;
  }
  GE.mixScene = mixScene;

  /* ---------- Controlador de passos (igual em todas as abas) ----------
     opts: { prefix, view, steps() -> [{ title, body, scene, dur }], draw(scene, info), getIndex(), setIndex(i) }
     Nada começa sozinho: cada passo espera o clique em avançar; voltar desfaz animando. */
  GE.stepper = function (opts) {
    const $ = (id) => document.getElementById(opts.prefix + '-' + id);
    let steps = [];
    let cur = null;          // cena mostrada agora
    let anim = null;
    let playing = false;
    let playTimer = 0;
    const self = {};

    function idx() { return clamp(opts.getIndex() || 0, 0, Math.max(0, steps.length - 1)); }

    function card() {
      const i = idx();
      const s = steps[i] || { title: '', body: '' };
      const c = $('count'), t = $('title'), b = $('body');
      if (c) c.textContent = steps.length ? 'Passo ' + (i + 1) + ' de ' + steps.length + (s.tag ? ' · ' + s.tag : '') : '';
      if (t) t.innerHTML = s.title || '';
      if (b) b.innerHTML = s.body || '';
      const dots = $('dots');
      if (dots) {
        dots.innerHTML = steps.map((st, k) =>
          '<button class="dot' + (k < i ? ' done' : '') + (k === i ? ' current' : '') + '" data-k="' + k + '" aria-label="Passo ' + (k + 1) + '"></button>').join('');
      }
      const p = $('prev'), n = $('next');
      if (p) p.disabled = i <= 0;
      if (n) n.disabled = i >= steps.length - 1;
    }

    function stop() { if (anim) { anim.cancel(); anim = null; } }

    function show(i, from) {
      stop();
      const target = (steps[i] && steps[i].scene) || {};
      const base = from || cur || target;
      const dur = from === false || !steps[i] ? 0 : (steps[i].dur == null ? 900 : steps[i].dur) / GE.state.speed;
      if (!from && (!cur || dur === 0)) {
        cur = Object.assign({}, target);
        opts.draw(cur, { step: i, t: 1 });
        return;
      }
      const a = Object.assign({}, base);
      anim = GE.tween(dur, (t) => {
        cur = mixScene(a, target, GE.ease(t));
        opts.draw(cur, { step: i, t });
      }, () => { anim = null; cur = Object.assign({}, target); opts.draw(cur, { step: i, t: 1 }); });
    }

    self.rebuild = function (animate) {
      steps = opts.steps() || [];
      const i = idx();
      if (opts.getIndex() !== i) opts.setIndex(i);
      card();
      if (animate) show(i);
      else { stop(); cur = null; show(i, false); cur = Object.assign({}, (steps[i] && steps[i].scene) || {}); }
    };
    self.go = function (i) {
      i = clamp(i, 0, steps.length - 1);
      if (i === idx()) return;
      opts.setIndex(i);
      card();
      show(i);
    };
    self.next = function () {
      if (idx() < steps.length - 1) { self.go(idx() + 1); return true; }
      return false;
    };
    self.prev = function () { if (idx() > 0) self.go(idx() - 1); };
    self.first = function () { self.go(0); };
    self.last = function () { self.go(steps.length - 1); };
    /* Refaz só o movimento do passo atual. */
    self.replay = function () {
      const i = idx();
      if (i === 0) { show(0, false); return; }
      show(i, Object.assign({}, steps[i - 1].scene));
    };
    self.redraw = function () { if (cur) opts.draw(cur, { step: idx(), t: 1 }); };
    self.index = idx;
    self.count = () => steps.length;
    self.steps = () => steps;
    self.scene = () => cur;
    self.busy = () => !!anim;

    function setPlay(on) {
      playing = on;
      const b = $('play');
      if (b) b.classList.toggle('playing', on);
      clearTimeout(playTimer);
      if (on) tick();
    }
    function tick() {
      if (!playing) return;
      if (anim) { playTimer = setTimeout(tick, 120); return; }
      if (!self.next()) { setPlay(false); return; }
      playTimer = setTimeout(tick, 1600 / GE.state.speed + 300);
    }
    self.stopPlay = () => setPlay(false);

    self.bind = function () {
      const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
      on('prev', () => { setPlay(false); self.prev(); });
      on('next', () => { setPlay(false); self.next(); });
      on('replay', () => { setPlay(false); self.replay(); });
      on('play', () => setPlay(!playing));
      const dots = $('dots');
      if (dots) dots.addEventListener('click', (e) => {
        const d = e.target.closest('[data-k]');
        if (d) { setPlay(false); self.go(Number(d.dataset.k)); }
      });
    };
    return self;
  };

  /* ---------- Utilidades de texto ---------- */
  GE.esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  GE.toast = function (msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(GE.toast.t);
    GE.toast.t = setTimeout(() => { el.hidden = true; }, 3200);
  };
})();
