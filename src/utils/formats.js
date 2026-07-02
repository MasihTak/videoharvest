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

// yt-dlp's flat-playlist extraction never sets `thumbnail`, only the
// `thumbnails[]` array (ascending by size) — fall back to its largest entry.
export function pickThumbnail(data) {
  if (data?.thumbnail) return data.thumbnail;
  const list = data?.thumbnails;
  return list?.length ? list[list.length - 1].url : null;
}

function pickSize(fmt) {
  return fmt.filesize ?? fmt.filesize_approx ?? null;
}

const hasVideo = (f) => f.vcodec && f.vcodec !== "none";
const hasAudio = (f) => f.acodec && f.acodec !== "none";

function resLabel(f) {
  const res = f.format_note || (f.height ? `${f.height}p` : f.resolution) || "video";
  const fps = f.fps && f.fps > 30 ? `${f.fps}` : "";
  return [`${res}${fps}`, f.ext].filter(Boolean).join(" · ");
}

function dedupeByHeight(videoFormats) {
  const best = new Map();
  for (const f of videoFormats) {
    const key = f.height ?? f.format_id;
    const cur = best.get(key);
    if (!cur || (f.tbr ?? 0) > (cur.tbr ?? 0)) best.set(key, f);
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

export function categorizeFormats(formats = []) {
  const audioFormats = formats
    .filter((f) => hasAudio(f) && !hasVideo(f))
    .sort((a, b) => (b.abr ?? 0) - (a.abr ?? 0));

  const videoFormats = dedupeByHeight(formats.filter((f) => hasVideo(f) && !hasAudio(f)));

  const bestAudio = audioFormats[0] ?? null;
  const bestAudioSize = bestAudio ? pickSize(bestAudio) : null;

  const audio = audioFormats.map((f) => ({
    id: f.format_id,
    label: `${f.abr ? `${Math.round(f.abr)} kbps` : "audio"} · ${f.ext}`,
    size: humanSize(pickSize(f)),
    selector: `${f.format_id}/bestaudio`,
  }));

  const video = videoFormats.map((f) => ({
    id: f.format_id,
    label: resLabel(f),
    size: humanSize(pickSize(f)),
    selector: videoSelector(f),
  }));

  const full = videoFormats.map((f) => {
    const vid = pickSize(f);
    const total = vid != null && bestAudioSize != null ? vid + bestAudioSize : null;
    return {
      id: `${f.format_id}+audio`,
      label: resLabel(f),
      size: humanSize(total),
      selector: fullSelector(f, Boolean(bestAudio)),
    };
  });

  return { full, video, audio };
}
