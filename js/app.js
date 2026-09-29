/* Inicialização, abas, painel do professor e atalhos. */
(function () {
  'use strict';
  const GE = window.GE;
  const $ = (id) => document.getElementById(id);

  function views() { return GE.VIEWS.filter((v) => GE.modules[v] && $('view-' + v)); }

  function syncUI() {
    const S = GE.state;
    views().forEach((v) => {
      $('view-' + v).hidden = S.view !== v;
      const t = $('tab-' + v);
      if (t) t.setAttribute('aria-selected', S.view === v);
    });
    segSync('seg-pi', S.pi);
    segSync('seg-dec', String(S.dec));
    segSync('seg-theme', S.theme);
    segSync('seg-speed', String(S.speed));
    $('rg-font').value = S.font;
    document.documentElement.style.setProperty('--fs', S.font);
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
    $('share-url').value = shareUrl();
  }
  function segSync(id, val) {
    Array.from($(id).querySelectorAll('button')).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === val));
  }
  function segBind(id, fn) {
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (b) fn(b.dataset.v);
    });
  }
  function shareUrl() { return GE.share ? GE.share.url() : location.href.split('#')[0] + '#' + GE.encodeHash(); }

  function openPanel(open) {
    $('panel').hidden = !open;
    $('scrim').hidden = !open;
    $('btn-panel').setAttribute('aria-expanded', open);
    if (open) { if (GE.share) GE.share.refresh(); $('panel-close').focus(); }
  }
  function bindPanel() {
    $('btn-panel').addEventListener('click', () => openPanel($('panel').hidden));
    $('panel-close').addEventListener('click', () => { openPanel(false); $('btn-panel').focus(); });
    $('scrim').addEventListener('click', () => openPanel(false));
    segBind('seg-pi', (v) => GE.set({ pi: v }));
    segBind('seg-dec', (v) => GE.set({ dec: Number(v) }));
    segBind('seg-theme', (v) => GE.set({ theme: v }));
    segBind('seg-speed', (v) => GE.set({ speed: Number(v) }));
    $('rg-font').addEventListener('input', (e) => GE.set({ font: Number(e.target.value) }));
    $('share-copy').addEventListener('click', () => {
      const url = shareUrl();
      const input = $('share-url');
      const done = (ok) => {
        $('share-msg').textContent = ok ? 'Link copiado. Cole no chat ou no mural da turma.' : 'Selecione o link acima e copie manualmente.';
        if (!ok) { input.focus(); input.select(); }
      };
      try { navigator.clipboard.writeText(url).then(() => done(true), () => done(false)); } catch (e) { done(false); }
    });
    $('reset-all').addEventListener('click', () => {
      const fresh = JSON.parse(JSON.stringify(GE.DEFAULTS));
      GE.set(fresh, { force: true });
      openPanel(false);
    });
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* sem suporte */ }
  }

  function onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key;
    const mod = GE.modules[GE.state.view];
    if (key === 'Escape') { if (!$('panel').hidden) openPanel(false); return; }
    if (key === 'ArrowRight' || key === 'PageDown' || (key === ' ' && tag !== 'button')) { e.preventDefault(); mod.next(); return; }
    if (key === 'ArrowLeft' || key === 'PageUp') { e.preventDefault(); mod.prev(); return; }
    if (key === 'Home') { e.preventDefault(); mod.first(); return; }
    const vs = views();
    if (/^[1-9]$/.test(key) && vs[Number(key) - 1]) { GE.set({ view: vs[Number(key) - 1] }); return; }
    if (mod.key && mod.key(e)) return;
    switch (key.toLowerCase()) {
      case 'r': if (mod.stepper && mod.stepper()) mod.stepper().replay(); break;
      case '0': { const b = $(GE.state.view + '-cam0'); if (b) b.click(); break; }
      case 'h': GE.set({ hidden: !GE.state.hidden }); break;
      case 'c': GE.exportFig.copyFigure(); break;
      case 'a': GE.annot.toggle(); break;
      case 'f': toggleFullscreen(); break;
      case 'p': openPanel($('panel').hidden); break;
      default: return;
    }
  }

  function init() {
    GE.loadSaved();
    const fromHash = GE.decodeHash(location.hash);
    if (fromHash) Object.assign(GE.state, fromHash);
    GE.sanitize();
    if (!$('view-' + GE.state.view)) GE.state.view = 'vol';
    GE.on(syncUI);
    GE.on((changed) => {
      if (changed.includes('view')) {
        const m = GE.modules[GE.state.view];
        if (m && m.render) m.render();
      }
    });
    document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => GE.set({ view: b.dataset.view })));
    $('btn-full').addEventListener('click', toggleFullscreen);
    bindPanel();
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', () => {
      const h = GE.decodeHash(location.hash);
      if (h) GE.set(h);
    });
    syncUI();
    views().forEach((v) => GE.modules[v].init());
    GE.annot.init();
    GE.share.init();
    GE.exportFig.init();
    const m = GE.modules[GE.state.view];
    if (m.render) m.render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const mm = GE.modules[GE.state.view]; if (mm.redraw) mm.redraw(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
