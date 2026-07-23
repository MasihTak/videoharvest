import { describe, it, expect } from "vitest";
import { buildArgs, parseProgress, parseFilepath, classifyError } from "./download.js";

describe("buildArgs", () => {
  it("builds the yt-dlp arg list from selector/dir/url", () => {
    const args = buildArgs({ selector: "137+140", dir: "C:/dl", url: "https://youtu.be/x" });
    expect(args).toEqual([
      "-P",
      "C:/dl",
      "-o",
      "%(title)s.%(ext)s",
      "-f",
      "137+140",
      "--newline",
      "--progress",
      "--print",
      "after_move:VHF|%(filepath)s",
      "https://youtu.be/x",
    ]);
  });
});

describe("parseProgress", () => {
  it("parses percent, speed, and eta from a full progress line", () => {
    const line = "[download]  50.0% of 100.00MiB at  1.05MiB/s ETA 00:41";
    expect(parseProgress(line)).toEqual({ percent: 50, speed: 1.05 * 1024 ** 2, eta: 41 });
  });

  it("parses an HH:MM:SS eta", () => {
    const line = "[download]  10.0% of 1.00GiB at 500.00KiB/s ETA 01:02:03";
    expect(parseProgress(line).eta).toBe(3600 + 2 * 60 + 3);
  });

  it("handles a line with no speed or eta (e.g. right at completion)", () => {
    const line = "[download] 100.0% of 100.00MiB";
    expect(parseProgress(line)).toEqual({ percent: 100, speed: null, eta: null });
  });

  it("returns a null eta for a malformed (non MM:SS/HH:MM:SS) eta value", () => {
    const line = "[download]  10.0% of 1.00GiB at 500.00KiB/s ETA 41";
    expect(parseProgress(line).eta).toBeNull();
  });

  it("returns null for non-progress lines", () => {
    expect(parseProgress("[youtube] Extracting URL")).toBeNull();
    expect(parseProgress("")).toBeNull();
  });
});

describe("parseFilepath", () => {
  it("extracts the path from a VHF-prefixed line", () => {
    expect(parseFilepath("VHF|C:/dl/video.mp4")).toBe("C:/dl/video.mp4");
  });

  it("returns null for lines without the prefix", () => {
    expect(parseFilepath("[Merger] Merging formats into video.mp4")).toBeNull();
  });
});

describe("classifyError", () => {
  it("maps a private-video error to a non-retryable message", () => {
    expect(classifyError("ERROR: Private video. Sign in if you've been granted access")).toEqual({
      message: "This video is private or members-only.",
      retryable: false,
    });
  });

  it("maps a network error to a retryable message", () => {
    expect(classifyError("urlopen error timed out")).toEqual({
      message: "Network error — check your connection and retry.",
      retryable: true,
    });
  });

  it("falls back to the raw text and retryable=true for unrecognized errors", () => {
    expect(classifyError("something completely unexpected")).toEqual({
      message: "something completely unexpected",
      retryable: true,
    });
  });

  it("falls back to a generic message for empty input", () => {
    expect(classifyError("")).toEqual({ message: "Download failed.", retryable: true });
  });
});
