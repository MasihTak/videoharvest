// Parse yt-dlp `formats[]` into download-mode buckets for the preview UI.

export function humanSize(bytes) {
  if (bytes == null) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// yt-dlp's duration_string omits the leading "0:" for sub-minute clips, so a
// 52-second video reads as a bare "52" instead of a time.
export function formatDuration(durationString) {
  if (!durationString) return null;
  const text = String(durationString);
  return text.includes(":") ? text : `0:${text.padStart(2, "0")}`;
}

// yt-dlp's flat-playlist extraction never sets `thumbnail`, only the
// `thumbnails[]` array (ascending by size) — fall back to its largest entry.
export function pickThumbnail(data) {
  if (data?.thumbnail) return data.thumbnail;
  const list = data?.thumbnails;
  return list?.length ? list[list.length - 1].url : null;
}

// Returns { bytes, exact }. HLS/DASH-only sources report no size at all, so
// fall back to bitrate x runtime and flag it — an estimate renders with a "~"
// rather than posing as a measured number.
function pickSize(fmt, duration) {
  const known = fmt.filesize ?? fmt.filesize_approx;
  if (known != null) return { bytes: known, exact: true };
  if (fmt.tbr && duration) return { bytes: Math.round((fmt.tbr * 1000 * duration) / 8), exact: false };
  return { bytes: null, exact: true };
}

function sizeLabel({ bytes, exact }) {
  if (bytes == null) return "—";
  return `${exact ? "" : "~"}${humanSize(bytes)}`;
}

const hasVideo = (f) => f.vcodec && f.vcodec !== "none";
const hasAudio = (f) => f.acodec && f.acodec !== "none";

// yt-dlp serves HLS variants alongside the plain https ones. They advertise a
// higher tbr but carry no filesize and always need an ffmpeg remux, so a naive
// bitrate comparison picks the worse stream and loses the size.
const isDirect = (f) => (f.protocol ?? "https").startsWith("http");

// Best-first comparator: a direct stream beats a manifest, then bitrate decides.
function byQuality(bitrate) {
  return (a, b) => Number(isDirect(b)) - Number(isDirect(a)) || (bitrate(b) ?? 0) - (bitrate(a) ?? 0);
}

function resLabel(f) {
  // format_note is yt-dlp's own label ("1080p60", "1440p60 HDR") and already
  // carries the frame rate — only the height fallback has to append it.
  const fps = f.fps > 30 ? `${Math.round(f.fps)}` : "";
  const res = f.format_note || (f.height ? `${f.height}p${fps}` : f.resolution) || "video";
  return [res, f.ext].filter(Boolean).join(" · ");
}

const byTbr = byQuality((f) => f.tbr);

function dedupeByHeight(videoFormats) {
  const best = new Map();
  for (const f of videoFormats) {
    const key = f.height ?? f.format_id;
    const cur = best.get(key);
    if (!cur || byTbr(f, cur) < 0) best.set(key, f);
  }
  return [...best.values()].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
}

function videoSelector(f) {
  return f.height ? `${f.format_id}/bestvideo[height<=${f.height}]` : f.format_id;
}

function fullSelector(f, hasBestAudio) {
  if (!hasBestAudio) return f.height ? `${f.format_id}/best[height<=${f.height}]` : f.format_id;
  if (!f.height) return `${f.format_id}+bestaudio`;
  return `${f.format_id}+bestaudio/bestvideo[height<=${f.height}]+bestaudio/best[height<=${f.height}]`;
}

export function categorizeFormats(formats = [], duration = null) {
  const audioFormats = formats
    .filter((f) => hasAudio(f) && !hasVideo(f))
    .sort(byQuality((f) => f.abr));

  const videoFormats = dedupeByHeight(formats.filter((f) => hasVideo(f) && !hasAudio(f)));

  const bestAudio = audioFormats[0] ?? null;
  const bestAudioSize = bestAudio ? pickSize(bestAudio, duration) : { bytes: null, exact: true };

  const audio = audioFormats.map((f) => ({
    id: f.format_id,
    label: `${f.abr ? `${Math.round(f.abr)} kbps` : "audio"} · ${f.ext}`,
    size: sizeLabel(pickSize(f, duration)),
    selector: `${f.format_id}/bestaudio`,
  }));

  const video = videoFormats.map((f) => ({
    id: f.format_id,
    label: resLabel(f),
    size: sizeLabel(pickSize(f, duration)),
    selector: videoSelector(f),
  }));

  const full = videoFormats.map((f) => {
    const vid = pickSize(f, duration);
    const bothKnown = vid.bytes != null && bestAudioSize.bytes != null;
    return {
      id: `${f.format_id}+audio`,
      label: resLabel(f),
      size: sizeLabel({
        bytes: bothKnown ? vid.bytes + bestAudioSize.bytes : null,
        exact: vid.exact && bestAudioSize.exact,
      }),
      selector: fullSelector(f, Boolean(bestAudio)),
    };
  });

  return { full, video, audio };
}
