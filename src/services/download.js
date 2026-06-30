// yt-dlp download arg building + progress parsing (pure, no Tauri imports).
// Progress is parsed from yt-dlp's default stderr output format.
// The final saved path comes via --print "after_move:VHF|...".

const FILE_PREFIX = "VHF|";

export function buildArgs({ selector, dir, url }) {
  return [
    "-P",
    dir,
    "-o",
    "%(title)s.%(ext)s",
    "-f",
    selector,
    "--newline",
    "--progress",
    "--no-warnings",
    "--print",
    `after_move:${FILE_PREFIX}%(filepath)s`,
    url,
  ];
}

// Parse "1.05MiB" -> bytes. Handles KiB, MiB, GiB, TiB, B.
const SIZE_UNITS = { B: 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 };

function parseHumanSize(str) {
  if (!str) return null;
  const m = str.match(/^([\d.]+)\s*([BKMGT]?)i?B$/i);
  if (!m) return null;
  return parseFloat(m[1]) * (SIZE_UNITS[(m[2] || "B").toUpperCase()] ?? 1);
}

// Parse "MM:SS" or "HH:MM:SS" -> seconds.
function parseHumanEta(str) {
  if (!str) return null;
  const parts = str.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

// Match: [download]  50.0% of 100.00MiB at  1.05MiB/s ETA 00:41
const PROGRESS_RE =
  /^\[download\]\s+([\d.]+)%(?:\s+of\s+[\d.]+\S+)?(?:\s+at\s+([\d.]+\s*[BKMGT]?i?B)\/s)?(?:\s+ETA\s+([\d:]+))?/i;

export function parseProgress(line) {
  const m = line.match(PROGRESS_RE);
  if (!m) return null;
  const percent = parseFloat(m[1]);
  return {
    percent: Number.isNaN(percent) ? null : percent,
    speed: parseHumanSize(m[2]),
    eta: parseHumanEta(m[3]),
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
