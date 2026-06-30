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

// yt-dlp fatal errors are cryptic. Map the common ones to a plain message and a
// retryable flag so the UI can show "why" and only offer Retry when it helps.
const ERROR_RULES = [
  [/private video|sign in if you|join this channel|members-only/i, "This video is private or members-only.", false],
  [/video unavailable|has been removed|been terminated|account associated|no longer available|removed by the user|video does not exist/i, "This video is unavailable or has been removed.", false],
  [/not available in your (country|region)|geo|blocked it in your country/i, "Not available in your region.", false],
  [/age.?restricted|confirm your age|inappropriate for some users/i, "Age-restricted — sign-in required.", false],
  [/unsupported url|no video formats found|requested format is not available/i, "This URL or format isn't supported.", false],
  [/requested format is not available|format is not available/i, "That quality isn't available — pick another format.", false],
  [/http error 4\d\d|forbidden/i, "The server refused the download — try again or pick another format.", true],
  [/unable to download|urlopen error|getaddrinfo|timed out|timeout|connection (reset|refused|aborted)|network is unreachable|temporary failure in name resolution|ssl|http error 5\d\d|read error/i, "Network error — check your connection and retry.", true],
];

export function classifyError(raw) {
  const text = (raw || "").trim();
  for (const [test, message, retryable] of ERROR_RULES) {
    if (test.test(text)) return { message, retryable };
  }
  return { message: text || "Download failed.", retryable: true };
}
