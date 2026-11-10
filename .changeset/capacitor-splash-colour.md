---
'@loidolt/theme-capacitor': minor
---

`themeConfig()` and `withTheme()` no longer set `SplashScreen.backgroundColor`. On iOS the plugin painted that one colour over `LaunchScreen.storyboard`, which hid a launch colour that follows dark mode, and Android 12 and newer ignore it at launch. The splash now shows the native launch screen's own colour; the README explains how to give it the theme's light and dark backgrounds. An app that wants the old behaviour can set `plugins.SplashScreen.backgroundColor` itself, and `withTheme` keeps it.
