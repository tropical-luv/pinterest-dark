// ==UserScript==
// @name         Pinterest Dark
// @namespace    local.pinterest-dark
// @version      1.1.0
// @description  Dark theme for Pinterest that re-maps Pinterest's own Gestalt colour tokens, so buttons keep their colours.
// @match        *://*.pinterest.com/*
// @match        *://*.pinterest.com.br/*
// @match        *://*.pinterest.pt/*
// @match        *://*.pinterest.co.uk/*
// @match        *://*.pinterest.ca/*
// @match        *://*.pinterest.com.au/*
// @match        *://*.pinterest.com.mx/*
// @match        *://*.pinterest.fr/*
// @match        *://*.pinterest.de/*
// @match        *://*.pinterest.es/*
// @match        *://*.pinterest.it/*
// @match        *://*.pinterest.jp/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

/*
 * How it works
 * ------------
 * Pinterest's UI (the Gestalt design system) paints almost everything through
 * CSS custom properties on :root:
 *
 *   --base-color-grayscale-0 ... -500   raw neutral palette (#fff ... #000)
 *   --sema-color-*                      semantic tokens built on that palette
 *
 * We flip the neutral palette (light <-> dark). Semantic tokens such as
 * text-default, background-secondary and border-* follow automatically, while
 * brand colours (the red Save button, blue links) are left alone.
 *
 * Tokens whose name ends in -light / -dark (white text over a pin image, the
 * dark hover scrim, ...) are meant to look the same in every theme, so they are
 * pinned back to their original literal colours.
 *
 * `html:root` out-ranks Pinterest's `:root`, so load order doesn't matter.
 */

(() => {
  'use strict';

  const SCALE_STEPS = [0, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 475, 500];

  // Index i of each palette lines up with SCALE_STEPS[i].
  const DARK_GRAYSCALE = [
    '#121212', '#161616', '#1e1e1e', '#2b2b2b', '#3d3d3d', '#6e6e6e', '#8a8a8a',
    '#a5a5a5', '#c4c4c4', '#dcdcdc', '#ebebeb', '#f2f2f2', '#f5f5f5',
  ];
  const DARK_GRAYSCALE_HOVER = [
    '#1e1e1e', '#1e1e1e', '#262626', '#363636', '#474747', '#7a7a7a', '#969696',
    '#b0b0b0', '#cfcfcf', '#e6e6e6', '#f0f0f0', '#f7f7f7', '#e6e6e6',
  ];
  const DARK_GRAYSCALE_PRESSED = [
    '#262626', '#262626', '#2e2e2e', '#3e3e3e', '#525252', '#858585', '#a0a0a0',
    '#b8b8b8', '#d6d6d6', '#ececec', '#f5f5f5', '#ffffff', '#d6d6d6',
  ];

  // Theme-independent tokens, with Pinterest's original (light theme) values.
  const FIXED_TOKENS = {
    'background-light': '#fff',
    'background-dark': '#000',
    'border-light-decorative': '#c8c8c1',
    'border-light-interactive': '#91918c',
    'border-dark-decorative': '#494943',
    'border-dark-interactive': '#91918c',
    'border-focus-inner-dark': '#000',
    'border-focus-inner-light': '#fff',
    'text-light': '#fff',
    'text-dark': '#000',
    'icon-light': '#fff',
    'icon-dark': '#000',
    'hover-background-light': '#f6f6f3',
    'hover-background-dark': '#181816',
    'hover-border-light-decorative': '#bcbcb3',
    'hover-border-light-interactive': '#85857f',
    'hover-border-dark-decorative': '#3b3b36',
    'hover-border-dark-interactive': '#85857f',
    'hover-text-light': '#f6f6f3',
    'hover-text-dark': '#181816',
    'hover-icon-light': '#f6f6f3',
    'hover-icon-dark': '#181816',
    'pressed-background-light': '#efefeb',
    'pressed-background-dark': '#242421',
    'pressed-border-light-decorative': '#b0b0a6',
    'pressed-border-light-interactive': '#787873',
    'pressed-border-dark-decorative': '#2d2d29',
    'pressed-border-dark-interactive': '#787873',
    'pressed-text-light': '#efefeb',
    'pressed-text-dark': '#242421',
    'pressed-icon-light': '#efefeb',
    'pressed-icon-dark': '#242421',
  };

  // Frosted "elevated" washes are hard-coded off-white in Pinterest's CSS.
  const WASH_OPACITIES = [50, 60, 70, 80, 90, 95];
  const WASH_RGB = { '': '18, 18, 18', 'hover-': '30, 30, 30', 'pressed-': '38, 38, 38' };
  const SCRIM_OPAQUE = { '': 'rgba(30, 30, 30, .8)', 'hover-': 'rgba(42, 42, 42, .8)', 'pressed-': 'rgba(54, 54, 54, .8)' };

  function grayscaleDeclarations() {
    const lines = [];
    SCALE_STEPS.forEach((step, i) => {
      lines.push(`--base-color-grayscale-${step}: ${DARK_GRAYSCALE[i]};`);
      lines.push(`--base-color-grayscale-translucent-${step}: ${DARK_GRAYSCALE[i]};`);
      lines.push(`--base-color-hover-grayscale-${step}: ${DARK_GRAYSCALE_HOVER[i]};`);
      lines.push(`--base-color-pressed-grayscale-${step}: ${DARK_GRAYSCALE_PRESSED[i]};`);
    });
    return lines;
  }

  function fixedTokenDeclarations() {
    return Object.entries(FIXED_TOKENS).map(([name, value]) => `--sema-color-${name}: ${value};`);
  }

  // Menus/popovers sit on grayscale-0 like the page; lift them so they don't blend in.
  const ELEVATED_OPAQUE = { '': '#212121', 'hover-': '#2b2b2b', 'pressed-': '#333333' };

  function elevatedSurfaceDeclarations() {
    const lines = Object.entries(ELEVATED_OPAQUE).map(
      ([state, colour]) => `--sema-color-${state}background-elevated-opaque-default: ${colour};`,
    );
    for (const [state, rgb] of Object.entries(WASH_RGB)) {
      const prefix = `--sema-color-${state}background-elevated`;
      for (const opacity of WASH_OPACITIES) {
        lines.push(`${prefix}-wash-${opacity}-default: rgba(${rgb}, .${opacity});`);
      }
      const scrim = SCRIM_OPAQUE[state];
      lines.push(`${prefix}-scrim-opaque-gradient-from: ${scrim};`);
      lines.push(`${prefix}-scrim-opaque-gradient-to: ${scrim};`);
      lines.push(`${prefix}-scrim-opaque: linear-gradient(180deg, ${scrim}, ${scrim});`);
    }
    return lines;
  }

  function buildStylesheet() {
    const tokens = [
      ...grayscaleDeclarations(),
      ...fixedTokenDeclarations(),
      ...elevatedSurfaceDeclarations(),
    ];
    return `
      html:root {
        color-scheme: dark;
        ${tokens.join('\n        ')}
      }
      html:root {
        --sema-color-background-primary: #4a4a4a;
        --sema-color-hover-background-primary: #5a5a5a;
        --sema-color-pressed-background-primary: #3a3a3a;
      }
      html:root, html:root body {
        background-color: var(--sema-color-background-default);
        color: var(--sema-color-text-default);
      }
    `;
  }

  function injectStylesheet(css) {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement('style');
    style.id = 'pinterest-dark-userscript';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  injectStylesheet(buildStylesheet());
})();
