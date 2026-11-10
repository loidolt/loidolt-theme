#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // `@tauri-apps/plugin-os` on the JS side, passed to `setupTauri({ plugins: { os } })`.
        .plugin(tauri_plugin_os::init())
        // `@tauri-apps/plugin-notification`, passed as `plugins: { notification }`.
        .plugin(tauri_plugin_notification::init())
        .run(tauri::generate_context!())
        .expect("error while running the example app");
}
