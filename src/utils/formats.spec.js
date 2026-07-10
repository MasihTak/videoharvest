import { describe, it, expect } from "vitest";
import { humanSize, pickThumbnail, categorizeFormats } from "./formats.js";

describe("humanSize", () => {
  it("formats bytes into the largest whole unit", () => {
    expect(humanSize(500)).toBe("500 B");
    expect(humanSize(1536)).toBe("1.5 KB");
    expect(humanSize(5 * 1024 ** 3)).toBe("5.0 GB");
  });

  it("returns an em dash for null/undefined", () => {
    expect(humanSize(null)).toBe("—");
    expect(humanSize(undefined)).toBe("—");
  });
});

describe("pickThumbnail", () => {
  it("prefers the direct thumbnail field", () => {
    expect(pickThumbnail({ thumbnail: "a.jpg", thumbnails: [{ url: "b.jpg" }] })).toBe("a.jpg");
  });

  it("falls back to the largest entry in thumbnails[]", () => {
    expect(pickThumbnail({ thumbnails: [{ url: "small.jpg" }, { url: "large.jpg" }] })).toBe("large.jpg");
  });

  it("returns null when there's no thumbnail data", () => {
    expect(pickThumbnail({})).toBeNull();
    expect(pickThumbnail(null)).toBeNull();
  });
});

describe("categorizeFormats", () => {
  const formats = [
    { format_id: "140", acodec: "mp4a", vcodec: "none", abr: 128, ext: "m4a", filesize: 3_000_000 },
    { format_id: "251", acodec: "opus", vcodec: "none", abr: 160, ext: "webm", filesize: 3_500_000 },
    { format_id: "137", acodec: "none", vcodec: "avc1", height: 1080, ext: "mp4", tbr: 5000, filesize: 50_000_000 },
    { format_id: "136", acodec: "none", vcodec: "avc1", height: 720, ext: "mp4", tbr: 2000, filesize: 20_000_000 },
    // Lower-bitrate duplicate at the same height — should lose to 137 in dedupe.
    { format_id: "137-lowfps", acodec: "none", vcodec: "avc1", height: 1080, ext: "mp4", tbr: 1000, filesize: 40_000_000 },
  ];

  it("splits audio-only and video-only formats, picking the best audio bitrate", () => {
    const { audio, video } = categorizeFormats(formats);
    expect(audio.map((f) => f.id)).toEqual(["251", "140"]);
    expect(video.map((f) => f.id)).toEqual(["137", "136"]);
  });

  it("dedupes video formats by height, keeping the highest-bitrate entry", () => {
    const { video } = categorizeFormats(formats);
    expect(video.find((f) => f.label.startsWith("1080")).id).toBe("137");
  });

  it("sums video + best-audio size for the full bucket", () => {
    const { full } = categorizeFormats(formats);
    const best1080 = full.find((f) => f.id === "137+audio");
    expect(best1080.size).toBe(humanSize(50_000_000 + 3_500_000));
  });

  it("returns empty buckets for no formats", () => {
    expect(categorizeFormats([])).toEqual({ full: [], video: [], audio: [] });
    expect(categorizeFormats(undefined)).toEqual({ full: [], video: [], audio: [] });
  });

  it("omits formats that have neither audio nor video codecs", () => {
    const { audio, video, full } = categorizeFormats([{ format_id: "0", acodec: "none", vcodec: "none" }]);
    expect(audio).toEqual([]);
    expect(video).toEqual([]);
    expect(full).toEqual([]);
  });

  it("replaces the kept duplicate when a later entry at the same height has a higher bitrate", () => {
    const { video } = categorizeFormats([
      { format_id: "a", acodec: "none", vcodec: "avc1", height: 1080, ext: "mp4", tbr: 1000, filesize: 10 },
      { format_id: "b", acodec: "none", vcodec: "avc1", height: 1080, ext: "mp4", tbr: 9000, filesize: 20 },
    ]);
    expect(video.map((f) => f.id)).toEqual(["b"]);
  });

  it("falls back to filesize_approx when filesize is absent", () => {
    const { audio } = categorizeFormats([
      { format_id: "x", acodec: "opus", vcodec: "none", abr: 128, ext: "webm", filesize_approx: 1024 },
    ]);
    expect(audio[0].size).toBe("1.0 KB");
  });

  it("labels a heightless video format by its resolution/format_note fallbacks", () => {
    const { video } = categorizeFormats([
      { format_id: "a", acodec: "none", vcodec: "avc1", format_note: "HD", ext: "mp4" },
      { format_id: "b", acodec: "none", vcodec: "avc1", resolution: "854x480", ext: "mp4" },
      { format_id: "c", acodec: "none", vcodec: "avc1", ext: "mp4" },
    ]);
    expect(video.map((f) => f.label)).toEqual(["HD · mp4", "854x480 · mp4", "video · mp4"]);
  });

  it("appends fps to the label only above 30fps", () => {
    const { video } = categorizeFormats([
      { format_id: "a", acodec: "none", vcodec: "avc1", height: 1080, fps: 60, ext: "mp4" },
      { format_id: "b", acodec: "none", vcodec: "avc1", height: 1080, fps: 24, ext: "webm" },
    ]);
    expect(video[0].label).toBe("1080p60 · mp4");
  });

  it("builds a plain format_id selector for a heightless video with no bonus audio", () => {
    const { video, full } = categorizeFormats([
      { format_id: "a", acodec: "none", vcodec: "avc1", ext: "mp4" },
    ]);
    expect(video[0].selector).toBe("a");
    expect(full[0].selector).toBe("a");
  });

  it("combines a heightless video with bestaudio when audio is available", () => {
    const { full } = categorizeFormats([
      { format_id: "a", acodec: "none", vcodec: "avc1", ext: "mp4" },
      { format_id: "aud", acodec: "opus", vcodec: "none", abr: 128, ext: "webm", filesize: 100 },
    ]);
    expect(full[0].selector).toBe("a+bestaudio");
  });
});
