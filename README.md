# Pinterest Dark

A Tampermonkey userscript that gives Pinterest a dark theme without breaking its buttons.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey) in your browser.
2. Open the raw script, and Tampermonkey will offer to install it:
   **[pinterest-dark.user.js](https://github.com/tropical-luv/pinterest-dark/raw/main/pinterest-dark.user.js)**
3. Reload Pinterest.

It runs on `pinterest.com` and the regional domains (`.com.br`, `.pt`, `.co.uk`, `.ca`, `.com.au`, `.com.mx`, `.fr`, `.de`, `.es`, `.it`, `.jp`). If you use another domain, add a `@match` line for it.

## How it works

Many dark-theme extensions force every element to have a transparent or dark background, for example `* { background: transparent !important }`. On Pinterest that wipes out button colours and makes some controls invisible.

This script doesn't touch individual elements. Pinterest's design system (Gestalt) paints almost everything through CSS custom properties on `:root`, so the script overrides those tokens instead:

- **Neutral palette flipped.** `--base-color-grayscale-*`, including the hover and pressed variants, now runs from dark to light. The semantic tokens built on it (text, backgrounds, borders) follow automatically.
- **Fixed tokens pinned.** Tokens ending in `-light` or `-dark`, such as white text over a pin image or the dark hover scrim, are meant to look the same in every theme. The script sets them back to Pinterest's original values.
- **Elevated surfaces.** Menus and popovers are lifted to `#212121` so they stand out from the page. The frosted "wash" overlays, which Pinterest hard-codes as off-white, are darkened.
- **Grey primary button.** The Save button uses `#4a4a4a` instead of red.

The rules are scoped to `html:root`, which wins over Pinterest's `:root`, so load order doesn't matter. The script runs at `document-start` so the page never flashes white.

## Customising

All colours are constants at the top of the IIFE in `pinterest-dark.user.js`:

| Constant | What it controls |
| --- | --- |
| `DARK_GRAYSCALE` (+ `_HOVER`, `_PRESSED`) | Main neutral palette, from darkest to lightest |
| `ELEVATED_OPAQUE` | Menus, popovers, dropdowns |
| `WASH_RGB`, `SCRIM_OPAQUE` | Translucent overlays |
| `--sema-color-background-primary` in `buildStylesheet()` | Save button colour. Delete that block to keep Pinterest's red. |

## Tip: pasting the script

If you paste the code into Tampermonkey's editor by hand, copy it straight from the file, not from terminal output. Terminal copies can mangle long lines and leave the page white. On Wayland:

```sh
wl-copy < pinterest-dark.user.js
```
