---
'@loidolt/theme-styles': patch
---

Stop hover styles sticking after a tap on touch screens. Mobile Safari, and the iOS and Android
web views behind Capacitor, keep `:hover` on the last element tapped, so a `ThemeToggle` or any
other button kept its inverse hover fill until something else was tapped and read as pressed.
Every `:hover` rule that changes a control's background, colour or border now sits inside
`@media (hover: hover)`, as the `TabBar` item already did. Rules shared with a non-hover state —
`[data-highlighted]` menu items, `[aria-pressed='true']` media and password toggles,
`[data-hovered]` image-viewer regions — keep that state everywhere. `:focus-visible` and `:active`
styling is unchanged, and hover-only text-decoration tweaks (links in prose, the brand, heading
anchors) are left as they were.
