use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Child, Stdio};
use std::sync::Mutex;
use std::thread;

use tauri::{AppHandle, Emitter, Manager};

use crate::binaries;

#[derive(Default)]
pub struct ProcessRegistry(pub Mutex<HashMap<String, Child>>);

#[derive(Clone, serde::Serialize)]
struct OutputPayload {
    id: String,
    line: String,
    kind: &'static str,
}

#[derive(Clone, serde::Serialize)]
struct DonePayload {
    id: String,
    code: Option<i32>,
}

pub fn run(
    app: AppHandle,
    registry: tauri::State<'_, ProcessRegistry>,
    program: &Path,
    id: String,
    args: Vec<String>,
) -> Result<(), String> {
    let mut child = binaries::command(program)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().ok_or("no stdout handle")?;
    let stderr = child.stderr.take().ok_or("no stderr handle")?;
    registry.0.lock().unwrap().insert(id.clone(), child);

    let stderr_thread = {
        let app = app.clone();
        let id = id.clone();
        thread::spawn(move || {
            for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                let _ = app.emit(
                    "sidecar://output",
                    OutputPayload {
                        id: id.clone(),
                        line,
                        kind: "stderr",
                    },
                );
            }
        })
    };

    thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let _ = app.emit(
                "sidecar://output",
                OutputPayload {
                    id: id.clone(),
                    line,
                    kind: "stdout",
                },
            );
        }
        // Drain stderr fully before signalling done, so consumers (e.g. the
        // metadata fetch) see the error text before the done event.
        let _ = stderr_thread.join();
        let code = app
            .state::<ProcessRegistry>()
            .0
            .lock()
            .unwrap()
            .remove(&id)
            .and_then(|mut child| child.wait().ok())
            .and_then(|status| status.code());
        let _ = app.emit("sidecar://done", DonePayload { id, code });
    });

    Ok(())
}

/// Kill a running process by id. No-op if it already finished or was cancelled.
pub fn cancel(registry: tauri::State<'_, ProcessRegistry>, id: &str) -> Result<(), String> {
    let child = registry.0.lock().unwrap().remove(id);
    if let Some(mut child) = child {
        child.kill().map_err(|e| e.to_string())?;
    }
    Ok(())
}
