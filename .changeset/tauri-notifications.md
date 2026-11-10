---
'@loidolt/theme-tauri': minor
---

Add OS notifications. Pass `@tauri-apps/plugin-notification` to `setupTauri({ plugins: { notification } })` and `desktop.notifications` sends notifications from Rust, with the permission handled: `permission` is reactive (`'granted'`, `'denied'`, `'default'` or `'unsupported'`), `requestPermission()` asks only while nobody has answered and never throws, and `notify({ title, body })` resolves whether the notification reached the OS without ever prompting, so background work can call it freely. In a browser the same code goes through the Web Notifications API (ask from a click: browsers ignore a prompt no user gesture asked for), and with `notifications: { toaster }` anything that cannot be shown becomes an in-app toast. `createNotifications({ plugin, toaster })` is the same on its own.
