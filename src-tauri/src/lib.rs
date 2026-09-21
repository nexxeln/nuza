// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::Manager;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
#[cfg(target_os = "windows")]
use window_vibrancy::apply_blur;
use std::fs;
use tauri_plugin_dialog::DialogExt;
use std::path::Path;

#[derive(serde::Serialize)]
struct FilePayload {
    path: String, 
    content: String,
}
#[derive(serde::Serialize)]
struct FileEntry {
    name: String, 
    path: String,
    #[serde(rename = "isDirectory")] // this ensures the JSON key is camel case
    is_directory: bool,
    children: Option<Vec<FileEntry>>,
}

fn read_dir_recursive(path: &Path) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    
    if path.is_dir() {
        // Read the directory contents
        for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let entry_path = entry.path();
            let name = entry.file_name().to_string_lossy().into_owned();
            let is_directory = entry_path.is_dir();
            
            // If it's a directory, recursively read its children
            let children = if is_directory {
                Some(read_dir_recursive(&entry_path)?)
            } else {
                None
            };
            
            entries.push(FileEntry {
                name,
                path: entry_path.to_string_lossy().into_owned(),
                is_directory,
                children,
            });
        }
    }
    
    // Sort so directories appear first, then alphabetically
    entries.sort_by(|a, b| {
        b.is_directory.cmp(&a.is_directory)
            .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    
    Ok(entries)
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
async fn load_folder_picker(app_handle: tauri::AppHandle) -> Result<Option<Vec<FileEntry>>, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app_handle.dialog().file()
        .pick_folder(move |folder_path| {
            let result = match folder_path {
                Some(path) => {
                    let path_str = path.to_string();
                    // Call our recursive function on the selected folder
                    read_dir_recursive(Path::new(&path_str)).map(Some)
                }
                None => Ok(None),
            };
            let _ = tx.send(result);
        });

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

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // apply the macOS vibrancy effect to the window
            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
                .expect("Unsupported platform!");

            #[cfg(target_os = "windows")]
            apply_blur(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform!");
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_file_picker, save_file_picker, load_folder_picker, read_file, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
