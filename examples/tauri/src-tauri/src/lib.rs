use serde::Serialize;
use tauri::{Emitter, Manager};

/// A second launch, as `handleSecondInstance` in `@loidolt/theme-tauri` reads it. `files` is
/// optional there: without it the JS side reads the paths from `args`.
#[derive(Clone, Serialize)]
struct SecondInstance {
    args: Vec<String>,
    cwd: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    files: Option<Vec<String>>,
}

/// Brings the main window back, from the tray or the dock or a minimised state.
fn focus_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Registered first, so a second launch exits before anything else starts: it focuses the
        // running window and hands over its command line as the `single-instance` event.
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            focus_main(app);
            let _ = app.emit("single-instance", SecondInstance { args, cwd, files: None });
        }))
        // `@tauri-apps/plugin-deep-link`, passed as `plugins: { deepLink }`.
        .plugin(tauri_plugin_deep_link::init())
        // `@tauri-apps/plugin-os` on the JS side, passed to `setupTauri({ plugins: { os } })`.
        .plugin(tauri_plugin_os::init())
        .setup(|_app| {
            // Windows and Linux register the scheme at run time (macOS does it from the bundle).
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                _app.deep_link().register_all()?;
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the example app")
        .run(|_app, _event| {
            // macOS keeps one instance itself: files opened from the Finder while the app runs
            // arrive here instead of as a second launch, so forward them the same way.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = &_event {
                let files: Vec<String> = urls
                    .iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .map(|path| path.to_string_lossy().into_owned())
                    .collect();
                if !files.is_empty() {
                    focus_main(_app);
                    let _ = _app.emit(
                        "single-instance",
                        SecondInstance { args: Vec::new(), cwd: String::new(), files: Some(files) },
                    );
                }
            }
        });
}
