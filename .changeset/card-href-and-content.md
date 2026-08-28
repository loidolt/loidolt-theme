---
'@loidolt/theme-svelte': minor
'@loidolt/theme-styles': minor
---

Card accepts `href` and renders the whole card as one block-level link (`.ldt-card--link`, hover accent border). The content region is now always full width — a behavioral CSS change that only affects cards whose root was externally turned into a centering flex/grid container, which previously collapsed intrinsic-less content (viewBox-only SVGs) to its fallback size.
