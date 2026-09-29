/* Pequenos desenhos dos sólidos para botões. */
(function () {
  'use strict';
  const GE = window.GE;
  const w = (d) => '<svg class="sicon" viewBox="0 0 40 40" aria-hidden="true">' + d + '</svg>';
  const S = 'fill="var(--solid-fill)" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"';
  const L = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
  const D = 'fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2.5 2.5"';
  const SOL = {
    cubo: '<path ' + S + ' d="M8 14h18v18H8zM8 14l7-7h18l-7 7M26 14l7-7v18l-7 7"/><path ' + D + ' d="M8 32l7-7h18M15 25V7"/>',
    quad: '<path ' + S + ' d="M11 12h13v22H11zM11 12l6-6h13l-6 6M24 12l6-6v22l-6 6"/><path ' + D + ' d="M11 34l6-6h13M17 28V6"/>',
    para: '<path ' + S + ' d="M5 16h22v16H5zM5 16l8-7h22l-8 7M27 16l8-7v16l-8 7"/><path ' + D + ' d="M5 32l8-7h22M13 25V9"/>',
    tri: '<path ' + S + ' d="M6 30 26 34 16 24ZM6 30V12l10-6v18M26 34V16L16 6M6 12l20 4"/><path ' + D + ' d="M16 24V6"/>',
    hex: '<path ' + S + ' d="M8 13 14 8h12l6 5-6 5H14Z"/><path ' + L + ' d="M8 13v16l6 5h12l6-5V13M14 18v16M26 18v16"/>',
    cil: '<ellipse cx="20" cy="9" rx="11" ry="4" ' + S + '/><path ' + L + ' d="M9 9v22M31 9v22"/><path ' + L + ' d="M9 31a11 4 0 0 0 22 0"/><path ' + D + ' d="M9 31a11 4 0 0 1 22 0"/>',
    cone: '<path ' + L + ' d="M20 5 9 31M20 5l11 26"/><path ' + L + ' d="M9 31a11 4 0 0 0 22 0"/><path ' + D + ' d="M9 31a11 4 0 0 1 22 0"/>',
    esfera: '<circle cx="20" cy="20" r="13" ' + S + '/><path ' + L + ' d="M7 20a13 4.5 0 0 0 26 0"/><path ' + D + ' d="M7 20a13 4.5 0 0 1 26 0"/>',
  };
  GE.icons = {
    solid(k) { return w(SOL[k] || SOL.cubo); },
  };
})();
