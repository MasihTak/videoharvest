// yt-dlp download arg building + progress parsing (pure, no Tauri imports).
// Progress is emitted by yt-dlp via --progress-template lines prefixed "VHP|";
// the final saved path via --print "after_move:VHF|...".

const PROGRESS_PREFIX = "VHP|";
const FILE_PREFIX = "VHF|";

const PROGRESS_TEMPLATE =
  PROGRESS_PREFIX +
  "%(progress.status)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|" +
  "%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s";

export function buildArgs({ selector, dir, url }) {
  return [
    "-P",
    dir,
    "-o",
    "%(title)s.%(ext)s",
    "-f",
    selector,
    "--newline",
    "--no-warnings",
    "--progress-template",
    PROGRESS_TEMPLATE,
    "--print",
    `after_move:${FILE_PREFIX}%(filepath)s`,
    url,
  ];
}

const num = (s) => (s && s !== "NA" ? Number(s) : null);

export function parseProgress(line) {
  if (!line.startsWith(PROGRESS_PREFIX)) return null;
  const [status, downloaded, total, estimate, speed, eta] = line
    .slice(PROGRESS_PREFIX.length)
    .split("|");
  const totalBytes = num(total) ?? num(estimate);
  const downloadedBytes = num(downloaded);
  const percent =
    totalBytes && downloadedBytes != null ? (downloadedBytes / totalBytes) * 100 : null;
  return {
    status,
    downloaded: downloadedBytes,
    total: totalBytes,
    speed: num(speed),
    eta: num(eta),
    percent,
  };
}

export function parseFilepath(line) {
  return line.startsWith(FILE_PREFIX) ? line.slice(FILE_PREFIX.length) : null;
}
