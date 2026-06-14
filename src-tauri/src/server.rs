#![cfg(feature = "local-server")]

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::post, Json, Router};
use rusqlite::{types::ValueRef, Connection, params_from_iter};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use tower_http::cors::CorsLayer;

type Db = Arc<Mutex<Connection>>;

#[derive(Deserialize)]
struct SqlRequest {
    sql: String,
    #[serde(default)]
    params: Vec<Value>,
}

#[derive(Serialize)]
struct ExecuteResult {
    #[serde(rename = "lastInsertId")]
    last_insert_id: i64,
    #[serde(rename = "rowsAffected")]
    rows_affected: usize,
}

fn to_sql_params(params: &[Value]) -> Vec<Box<dyn rusqlite::ToSql>> {
    params
        .iter()
        .map(|v| -> Box<dyn rusqlite::ToSql> {
            match v {
                Value::Null => Box::new(rusqlite::types::Null),
                Value::Bool(b) => Box::new(*b as i64),
                Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        Box::new(i)
                    } else {
                        Box::new(n.as_f64().unwrap_or(0.0))
                    }
                }
                Value::String(s) => Box::new(s.clone()),
                other => Box::new(other.to_string()),
            }
        })
        .collect()
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        out.push(CHARS[b0 >> 2] as char);
        out.push(CHARS[((b0 & 3) << 4) | (b1 >> 4)] as char);
        out.push(if chunk.len() > 1 { CHARS[((b1 & 15) << 2) | (b2 >> 6)] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[b2 & 63] as char } else { '=' });
    }
    out
}

// Scoped in a plain fn so Statement<'_> lifetime is confined here and dropped before the MutexGuard.
fn run_query(conn: &Connection, sql: &str, params: &[Value]) -> (StatusCode, Json<Value>) {
    let sql_params = to_sql_params(params);
    let param_refs: Vec<&dyn rusqlite::ToSql> = sql_params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = match conn.prepare(sql) {
        Err(e) => return (StatusCode::BAD_REQUEST, Json(Value::String(e.to_string()))),
        Ok(s) => s,
    };

    let col_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();

    let rows_result: rusqlite::Result<Vec<Map<String, Value>>> = stmt
        .query_map(params_from_iter(param_refs.iter().copied()), |row| {
            let mut map = Map::new();
            for (i, name) in col_names.iter().enumerate() {
                let val = match row.get_ref(i).unwrap() {
                    ValueRef::Null => Value::Null,
                    ValueRef::Integer(n) => Value::Number(n.into()),
                    ValueRef::Real(f) => {
                        Value::Number(serde_json::Number::from_f64(f).unwrap())
                    }
                    ValueRef::Text(t) => Value::String(String::from_utf8_lossy(t).into_owned()),
                    ValueRef::Blob(b) => Value::String(base64_encode(b)),
                };
                map.insert(name.clone(), val);
            }
            Ok(map)
        })
        .and_then(|iter| iter.collect());

    match rows_result {
        Ok(rows) => (
            StatusCode::OK,
            Json(Value::Array(rows.into_iter().map(Value::Object).collect())),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Value::String(e.to_string())),
        ),
    }
}

fn run_execute(conn: &Connection, sql: &str, params: &[Value]) -> (StatusCode, Json<Value>) {
    let sql_params = to_sql_params(params);
    let param_refs: Vec<&dyn rusqlite::ToSql> = sql_params.iter().map(|p| p.as_ref()).collect();

    match conn.execute(sql, params_from_iter(param_refs.iter().copied())) {
        Ok(rows_affected) => {
            let last_insert_id = conn.last_insert_rowid();
            (
                StatusCode::OK,
                Json(
                    serde_json::to_value(ExecuteResult {
                        last_insert_id,
                        rows_affected,
                    })
                    .unwrap(),
                ),
            )
        }
        Err(e) => (StatusCode::BAD_REQUEST, Json(Value::String(e.to_string()))),
    }
}

async fn handle_query(State(db): State<Db>, Json(req): Json<SqlRequest>) -> impl IntoResponse {
    let conn = db.lock().unwrap();
    run_query(&conn, &req.sql, &req.params)
}

async fn handle_execute(State(db): State<Db>, Json(req): Json<SqlRequest>) -> impl IntoResponse {
    let conn = db.lock().unwrap();
    run_execute(&conn, &req.sql, &req.params)
}

pub async fn start(db_path: PathBuf) {
    let conn = Connection::open(&db_path).expect("failed to open SQLite for local server");
    conn.execute_batch("PRAGMA journal_mode=WAL;")
        .expect("failed to set WAL mode");

    let db: Db = Arc::new(Mutex::new(conn));

    let app = Router::new()
        .route("/api/query", post(handle_query))
        .route("/api/execute", post(handle_execute))
        .layer(CorsLayer::permissive())
        .with_state(db);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:7421")
        .await
        .expect("failed to bind port 7421");

    println!("[local-server] Listening on 0.0.0.0:7421");
    axum::serve(listener, app).await.unwrap();
}
