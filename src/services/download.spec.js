import { describe, it, expect } from "vitest";
import {
  buildArgs,
  parseTimestamp,
  parseProgress,
  parseFilepath,
  isStreamStart,
  classifyError,
} from "./download.js";

describe("parseTimestamp", () => {
  it("parses bare seconds, mm:ss, and hh:mm:ss", () => {
    expect(parseTimestamp("90")).toBe(90);
    expect(parseTimestamp("2:30")).toBe(150);
    expect(parseTimestamp("1:02:30")).toBe(3750);
  });

  it("returns null for input that isn't a timestamp", () => {
    expect(parseTimestamp("a:b")).toBeNull();
    expect(parseTimestamp("-30")).toBeNull();
    expect(parseTimestamp("1:2:3:4")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseTimestamp("")).toBeNull();
    expect(parseTimestamp(null)).toBeNull();
  });
});

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

  it("adds --download-sections and a clip-tagged filename for a time range", () => {
    const args = buildArgs({
      selector: "137+140",
      dir: "C:/dl",
      url: "https://youtu.be/x",
      sectionStart: 150,
      sectionEnd: 180,
    });
    expect(args).toContain("--download-sections");
    expect(args[args.indexOf("--download-sections") + 1]).toBe("*150-180");
    expect(args).toContain("--force-keyframes-at-cuts");
    expect(args[args.indexOf("-o") + 1]).toBe("%(title)s [clip 150-180].%(ext)s");
  });

  it("leaves the range open-ended when only a start is given", () => {
    const args = buildArgs({
      selector: "137+140",
      dir: "C:/dl",
      url: "https://youtu.be/x",
      sectionStart: 150,
    });
    expect(args[args.indexOf("--download-sections") + 1]).toBe("*150-inf");
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

describe("isStreamStart", () => {
  it("matches the Destination line that begins each stream", () => {
    expect(isStreamStart(String.raw`[download] Destination: C:\Videos\clip.f137.mp4`)).toBe(true);
  });

  it("ignores progress lines and other yt-dlp output", () => {
    expect(isStreamStart("[download]  30.0% of ~ 45.00MiB")).toBe(false);
    expect(isStreamStart("[Merger] Merging formats into \"clip.mp4\"")).toBe(false);
    expect(isStreamStart("")).toBe(false);
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
