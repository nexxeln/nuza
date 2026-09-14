// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
use std::fs;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Serialize)]
struct FilePayload {
    path: String, 
    content: String,
}

#[tauri::command]
async fn load_file_picker(app_handle: tauri::AppHandle) -> Result<Option<FilePayload>, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    // Open native open dialog using the Dialog plugin channel
    app_handle.dialog().file()
        .add_filter("Markdown Files", &["md", "markdown"])
        .pick_file(move |file_path| {
            let result = match file_path {
                Some(path) => {
                    let path_str = path.to_string();
                    match fs::read_to_string(&path_str) {
                        Ok(content) => Ok(Some(FilePayload { path: path_str, content })),
                        Err(e) => Err(format!("Failed to read file: {}", e)),
                    }
                }
                None => Ok(None), // User canceled the dialog
            };
            let _ = tx.send(result);
        });

    // await the dialog result from the picker thread 
    rx.recv().map_err(|e| format!("Channel error: {}", e))?
}

#[tauri::command]
async fn save_file_picker(app_handle: tauri::AppHandle, content: String) -> Result<Option<String>, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    // Open native save dialog
    app_handle.dialog().file()
        .add_filter("Markdown Files", &["md", "markdown"])
        .set_file_name("untitled.md")
        .save_file(move |file_path| {
            let result = match file_path {
                Some(path) => {
                    let path_str = path.to_string();
                    match fs::write(&path_str, &content) {
                        Ok(_) => Ok(Some(path_str)), 
                        Err(e) => Err(format!("Failed to write file: {}", e)),
                    }
                }
                None => Ok(None),
            };
            let _ = tx.send(result);
        });

    // await the dialog result from the picker thread
    rx.recv().map_err(|e| format!("Channel error: {}", e))?
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // apply the macOS vibrancy effect to the window
            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
                .expect("Unsupported platform!");
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, load_file_picker, save_file_picker])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
