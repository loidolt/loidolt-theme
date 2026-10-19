---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Safe-area support for apps that set `viewport-fit=cover` (Capacitor, home-screen web apps): `Topbar`, `AppShell`, `Drawer`, `ToastViewport` and `FloatingBar` now pad or offset themselves clear of the notch, rounded corners and home indicator with `env(safe-area-inset-*)`. The insets are 0 in desktop browsers and in pages without `viewport-fit=cover`, so existing layouts render exactly as before. Each edge reads a `--ldt-safe-top`/`-right`/`-bottom`/`-left` knob first, to opt an element out (`0px`) or preview an inset.

New `TabBar`: bottom navigation for phones. It takes `TabBarItem`s (`label`, `href`, `current`, optional `icon` snippet) as real links with `aria-current="page"` on the current one, marks it with the `--loidolt-stroke-indicator` accent edge, gives every destination a 44px minimum target, and pads clear of the home indicator. `AppShell` gains a `tabBar` slot that pins it to the bottom of the screen.
