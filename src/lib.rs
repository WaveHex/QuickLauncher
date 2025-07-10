// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;
use tauri_plugin_sql::{Builder as SqlPlugin, Migration, MigrationKind};
use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent},
    menu::{Menu, MenuItem, MenuId, PredefinedMenuItem},
    Manager,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn run_app(path: String) -> Result<(), String> {
    if std::path::Path::new(&path).is_dir() {
        Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    } else {
        Command::new(&path).spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn run_cmd(command: String) -> Result<(), String> {
    Command::new("cmd")
        .args(&["/C", &command])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            SqlPlugin::default()
                .add_migrations(
                    "sqlite:quicklauncher.db",
                    vec![Migration {
                        version: 1,
                        description: "create profiles table",
                        kind: MigrationKind::Up,
                        sql: r#"
                            CREATE TABLE IF NOT EXISTS profiles (
                                id TEXT PRIMARY KEY,
                                name TEXT NOT NULL,
                                category TEXT,
                                actions_json TEXT NOT NULL
                            );
                        "#,
                    }],
                )
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let mut menu = Menu::new(app).unwrap();

            let show_item = MenuItem::new(app, MenuId::new("show"), true, None::<&str>).unwrap();
            show_item.set_text("Открыть").unwrap();

            let quit_item = MenuItem::new(app, MenuId::new("quit"), true, None::<&str>).unwrap();
            quit_item.set_text("Выйти").unwrap();

            let separator = PredefinedMenuItem::separator(app).unwrap();

            menu.append(&show_item).unwrap();
            menu.append(&separator).unwrap();
            menu.append(&quit_item).unwrap();

            TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            match event.id().0.as_str() {
                "show" => {
                    let window = app.get_webview_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|app, event| {
            if let TrayIconEvent::Click { .. } = event {
                let window = app.get_webview_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        })
        .invoke_handler(tauri::generate_handler![greet, run_app, run_cmd, open_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
