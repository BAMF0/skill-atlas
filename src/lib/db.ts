import Database from "@tauri-apps/plugin-sql";

const isTauri = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
// Use the same host the page was loaded from so the phone reaches the laptop, not itself.
const API_BASE = `http://${window.location.hostname}:7421`;

// Minimal HTTP shim — mirrors the tauri-plugin-sql Database interface.
// Used when running in a plain browser (no Tauri IPC available).
// To remove: delete this class, remove the isTauri branch in getDb(), and
// revert the return type to Promise<Database>.
class HttpDatabase {
  async select<T>(sql: string, params: unknown[] = []): Promise<T> {
    const res = await fetch(`${API_BASE}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ lastInsertId: number; rowsAffected: number }> {
    const res = await fetch(`${API_BASE}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

let _db: Database | HttpDatabase | null = null;

export async function getDb(): Promise<Database | HttpDatabase> {
  if (!_db) {
    if (isTauri) {
      _db = await Database.load("sqlite:skillatlas.db");
    } else {
      _db = new HttpDatabase();
    }
  }
  return _db;
}
