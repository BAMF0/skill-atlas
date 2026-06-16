#[cfg(feature = "local-server")]
mod server;

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

// Opens a native save-file dialog and writes `content` to the chosen path.
// Returns true if saved, false if the user cancelled.
#[tauri::command]
fn save_backup(app: tauri::AppHandle, content: String) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app
        .dialog()
        .file()
        .set_file_name("skill-atlas-backup.json")
        .add_filter("JSON backup", &["json"])
        .blocking_save_file();
    match path {
        Some(tauri_plugin_dialog::FilePath::Path(p)) => {
            std::fs::write(&p, content).map_err(|e| e.to_string())?;
            Ok(true)
        }
        _ => Ok(false),
    }
}

// Opens a native open-file dialog and returns the contents of the chosen file.
// Returns None if the user cancelled.
#[tauri::command]
fn load_backup(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app
        .dialog()
        .file()
        .add_filter("JSON backup", &["json"])
        .blocking_pick_file();
    match path {
        Some(tauri_plugin_dialog::FilePath::Path(p)) => {
            let content = std::fs::read_to_string(&p).map_err(|e| e.to_string())?;
            Ok(Some(content))
        }
        _ => Ok(None),
    }
}

// Checks whether a local Ollama server is reachable. Generation is entirely
// on-device — nothing is sent to a remote service.
#[tauri::command]
async fn ollama_status() -> Result<bool, String> {
    let client = reqwest::Client::new();
    match client
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
    {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

// Sends the same prompt the manual flow uses to a local Ollama model and returns
// the raw text answer. The frontend extracts/validates it exactly like a paste.
#[tauri::command]
async fn generate_via_ollama(prompt: String, model: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false,
        "format": "json",
    });
    let resp = client
        .post("http://localhost:11434/api/generate")
        .json(&body)
        .timeout(std::time::Duration::from_secs(180))
        .send()
        .await
        .map_err(|e| format!("Couldn't reach Ollama: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("Ollama returned status {}", resp.status()));
    }
    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    json.get("response")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "Ollama response missing 'response' field".to_string())
}

fn library_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("library");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn safe_filename(filename: &str) -> Result<(), String> {
    if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
        return Err("Invalid filename".to_string());
    }
    Ok(())
}

#[tauri::command]
fn library_dir_path(app: tauri::AppHandle) -> Result<String, String> {
    let dir = library_dir(&app)?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn list_library_modules(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = library_dir(&app)?;
    let mut results = Vec::new();
    let entries = std::fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(content) = std::fs::read_to_string(&path) {
                results.push(content);
            }
        }
    }
    Ok(results)
}

#[tauri::command]
fn read_library_module(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    safe_filename(&filename)?;
    let path = library_dir(&app)?.join(&filename);
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_library_module(app: tauri::AppHandle, filename: String, content: String) -> Result<(), String> {
    safe_filename(&filename)?;
    let path = library_dir(&app)?.join(&filename);
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "skill_description_fields",
            sql: include_str!("../migrations/002_skill_description_fields.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "quest_active",
            sql: include_str!("../migrations/003_quest_active.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "skill_materials",
            sql: include_str!("../migrations/004_skill_materials.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(feature = "local-server")]
            {
                let db_path = app
                    .path()
                    .app_data_dir()
                    .expect("no app data dir")
                    .join("skillatlas.db");
                tauri::async_runtime::spawn(server::start(db_path));
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:skillatlas.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            save_backup,
            load_backup,
            generate_via_ollama,
            ollama_status,
            library_dir_path,
            list_library_modules,
            read_library_module,
            save_library_module,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
