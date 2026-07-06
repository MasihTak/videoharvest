use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

const HTTP_TIMEOUT: Duration = Duration::from_secs(30);

#[cfg(windows)]
const EXE: &str = ".exe";
#[cfg(not(windows))]
const EXE: &str = "";

#[cfg(target_os = "windows")]
const YTDLP_URL: &str = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
#[cfg(target_os = "macos")]
const YTDLP_URL: &str = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";
#[cfg(target_os = "linux")]
const YTDLP_URL: &str = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";

#[cfg(target_os = "windows")]
const FFMPEG_URL: &str = "https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip";
#[cfg(target_os = "windows")]
const FFMPEG_ARCHIVE: &str = "ffmpeg-archive.zip";
#[cfg(target_os = "linux")]
const FFMPEG_URL: &str = "https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-linux64-gpl.tar.xz";
#[cfg(target_os = "linux")]
const FFMPEG_ARCHIVE: &str = "ffmpeg-archive.tar.xz";
#[cfg(target_os = "macos")]
const FFMPEG_URL: &str = "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip";
#[cfg(target_os = "macos")]
const FFMPEG_ARCHIVE: &str = "ffmpeg-archive.zip";

#[derive(Clone, serde::Serialize)]
struct Progress {
    file: String,
    received: u64,
    total: u64,
}

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub fn command(program: &Path) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

pub fn bin_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?
        .join("bin");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

pub fn ytdlp_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(bin_dir(app)?.join(format!("yt-dlp{EXE}")))
}

pub fn ffmpeg_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(bin_dir(app)?.join(format!("ffmpeg{EXE}")))
}

pub fn is_ready(app: &AppHandle) -> Result<bool, String> {
    Ok(ytdlp_path(app)?.exists() && ffmpeg_path(app)?.exists())
}

/// Download both binaries into the app-data bin dir. Emits `bootstrap://progress`.
pub fn bootstrap(app: &AppHandle) -> Result<(), String> {
    let dir = bin_dir(app)?;

    let ytdlp = ytdlp_path(app)?;
    if !ytdlp.exists() {
        download(app, YTDLP_URL, "yt-dlp", &ytdlp)?;
        set_executable(&ytdlp)?;
    }

    if !ffmpeg_path(app)?.exists() {
        fetch_ffmpeg(app, &dir)?;
    }
    Ok(())
}

pub fn ytdlp_version(app: &AppHandle) -> Result<String, String> {
    let out = command(&ytdlp_path(app)?)
        .arg("--version")
        .output()
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

/// `yt-dlp -U` — it downloads the latest release, verifies it, and replaces
/// itself. Returns its combined output for display.
pub fn update_ytdlp(app: &AppHandle) -> Result<String, String> {
    let out = command(&ytdlp_path(app)?)
        .arg("-U")
        .output()
        .map_err(|e| e.to_string())?;
    let mut text = String::from_utf8_lossy(&out.stdout).into_owned();
    text.push_str(&String::from_utf8_lossy(&out.stderr));
    let text = text.trim().to_string();
    if out.status.success() {
        Ok(text)
    } else {
        Err(text)
    }
}

fn fetch_ffmpeg(app: &AppHandle, dir: &Path) -> Result<(), String> {
    let archive = dir.join(FFMPEG_ARCHIVE);
    download(app, FFMPEG_URL, "ffmpeg", &archive)?;

    let extract = dir.join("ffmpeg-extract");
    let _ = fs::remove_dir_all(&extract);
    fs::create_dir_all(&extract).map_err(|e| e.to_string())?;

    // System tar handles both .zip and .tar.xz (Win10 1803+ ships bsdtar).
    let status = command(Path::new("tar"))
        .arg("-xf")
        .arg(&archive)
        .arg("-C")
        .arg(&extract)
        .status()
        .map_err(|e| format!("could not run tar to extract ffmpeg: {e}"))?;
    if !status.success() {
        return Err("ffmpeg archive extraction failed".into());
    }

    let found =
        find_file(&extract, &format!("ffmpeg{EXE}")).ok_or("ffmpeg binary not found in archive")?;
    // Stage the new binary before touching dest, so a failed rename never leaves
    // ffmpeg missing entirely.
    let dest = ffmpeg_path(app)?;
    let staged = dest.with_extension("new");
    let _ = fs::remove_file(&staged);
    fs::rename(&found, &staged).map_err(|e| e.to_string())?;
    let _ = fs::remove_file(&dest);
    fs::rename(&staged, &dest).map_err(|e| e.to_string())?;
    set_executable(&dest)?;

    let _ = fs::remove_file(&archive);
    let _ = fs::remove_dir_all(&extract);
    Ok(())
}

fn download(app: &AppHandle, url: &str, label: &str, dest: &Path) -> Result<(), String> {
    let agent = ureq::AgentBuilder::new()
        .timeout_connect(HTTP_TIMEOUT)
        .timeout_read(HTTP_TIMEOUT)
        .build();
    let resp = agent.get(url).call().map_err(|e| e.to_string())?;
    let total: u64 = resp
        .header("Content-Length")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);

    let tmp = dest.with_extension("part");
    let mut file = fs::File::create(&tmp).map_err(|e| e.to_string())?;
    let mut reader = resp.into_reader();
    let mut buf = [0u8; 64 * 1024];
    let mut received: u64 = 0;
    loop {
        let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        received += n as u64;
        let _ = app.emit(
            "bootstrap://progress",
            Progress {
                file: label.to_string(),
                received,
                total,
            },
        );
    }
    drop(file);
    fs::rename(&tmp, dest).map_err(|e| e.to_string())?;
    Ok(())
}

fn find_file(dir: &Path, name: &str) -> Option<PathBuf> {
    for entry in fs::read_dir(dir).ok()?.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(hit) = find_file(&path, name) {
                return Some(hit);
            }
        } else if path.file_name().and_then(|n| n.to_str()) == Some(name) {
            return Some(path);
        }
    }
    None
}

fn set_executable(path: &Path) -> Result<(), String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perm = fs::metadata(path).map_err(|e| e.to_string())?.permissions();
        perm.set_mode(0o755);
        fs::set_permissions(path, perm).map_err(|e| e.to_string())?;
    }
    #[cfg(not(unix))]
    let _ = path;
    Ok(())
}
