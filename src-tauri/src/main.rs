// Parascape desktop shell. Launches the bundled Parabun server as a sidecar in
// guest mode — it serves the built site AND /api over a local SQLite file — then
// points the window at it once the port is accepting connections. Entirely local;
// nothing is exposed publicly.
#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;

const PORT: u16 = 8788;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let resources = app.path().resource_dir()?;
            let server = resources.join("server").join("account-server.ts");
            let dist = resources.join("dist");

            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir).ok();
            let db = data_dir.join("parascape.sqlite");

            // bundled Parabun runtime running the guest/self-contained server
            let (_rx, _child) = app
                .shell()
                .sidecar("parabun")?
                .args([server.to_string_lossy().to_string()])
                .env("PARASCAPE_GUEST", "1")
                .env("PARASCAPE_DIST", dist.to_string_lossy().to_string())
                .env("PARASCAPE_DB", db.to_string_lossy().to_string())
                .env("PARASCAPE_ACCOUNT_PORT", PORT.to_string())
                .spawn()?;

            let win = app.get_webview_window("main").expect("main window");
            std::thread::spawn(move || {
                // wait (up to ~20s) for the server, then navigate the window to it
                for _ in 0..200 {
                    if std::net::TcpStream::connect(("127.0.0.1", PORT)).is_ok() {
                        break;
                    }
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
                let _ = win.eval(&format!("window.location.replace('http://localhost:{PORT}/')"));
                let _ = win.show();
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Parascape");
}
