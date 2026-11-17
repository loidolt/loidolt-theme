---
'@loidolt/theme-styles': patch
---

Date and time inputs (`type="date"`, `time`, `datetime-local`, `month`, `week`) no longer run past their column on iOS. iOS sized their native control by its content box, so `width: 100%` plus the field's padding overflowed it, in Safari and in Capacitor apps alike; `.ldt-input` now drops the native appearance for these types, and their value starts where other fields' text does instead of centred. Tapping one still opens the system picker.
