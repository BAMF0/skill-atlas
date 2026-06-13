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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "initial_schema",
        sql: include_str!("../migrations/001_initial.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:skillatlas.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![save_backup, load_backup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
