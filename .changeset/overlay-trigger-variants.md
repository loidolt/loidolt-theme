---
'@loidolt/theme-svelte': minor
---

Dialog, AlertDialog, Drawer, and Popover accept `triggerVariant` and `triggerSize`, composing the default trigger's button classes instead of consumers hand-assembling `ldt-button …` strings. An explicit `triggerClass` still wins wholesale; Popover keeps its quiet default.
