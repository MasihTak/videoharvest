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

/// Recover from mutex poisoning instead of panicking every call after the first panic.
fn lock(m: &Mutex<HashMap<String, Child>>) -> std::sync::MutexGuard<'_, HashMap<String, Child>> {
    m.lock().unwrap_or_else(|e| e.into_inner())
}

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
    lock(&registry.0).insert(id.clone(), child);

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
        let code = lock(&app.state::<ProcessRegistry>().0)
            .remove(&id)
            .and_then(|mut child| child.wait().ok())
            .and_then(|status| status.code());
        let _ = app.emit("sidecar://done", DonePayload { id, code });
    });

    Ok(())
}

/// Kill a running process and its children by id. No-op if already finished or cancelled.
pub fn cancel(registry: tauri::State<'_, ProcessRegistry>, id: &str) -> Result<(), String> {
    let child = lock(&registry.0).remove(id);
    if let Some(mut child) = child {
        #[cfg(windows)]
        {
            // taskkill /F /T kills the process and all its descendants (e.g. ffmpeg spawned by yt-dlp).
            // child.kill() alone only terminates the direct process on Windows.
            let pid = child.id();
            let _ = binaries::command(Path::new("taskkill"))
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }
        #[cfg(not(windows))]
        {
            let _ = child.kill();
        }
        // Reap so the OS process table entry doesn't linger as a zombie.
        let _ = child.wait();
    }
    Ok(())
}
