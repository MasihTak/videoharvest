import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/services/sidecar.js", () => ({
  runYtdlp: vi.fn(async () => {}),
  onOutput: vi.fn(() => Promise.resolve(() => {})),
  onDone: vi.fn(() => Promise.resolve(() => {})),
}));

import { fetchMetadata } from "./metadata.js";
import * as sidecar from "@/services/sidecar.js";

let outputHandler;
let doneHandler;

beforeEach(() => {
  vi.clearAllMocks();
  sidecar.onOutput.mockImplementation((h) => {
    outputHandler = h;
    return Promise.resolve(() => {});
  });
  sidecar.onDone.mockImplementation((h) => {
    doneHandler = h;
    return Promise.resolve(() => {});
  });
});

describe("fetchMetadata", () => {
  it("resolves the parsed JSON on a clean exit", async () => {
    sidecar.runYtdlp.mockImplementation(async (id) => {
      outputHandler({ id, line: '{"title":"Video"}' });
      doneHandler({ id, code: 0 });
    });
    await expect(fetchMetadata("https://x")).resolves.toEqual({ title: "Video" });
  });

  it("ignores output/done events meant for a different in-flight fetch", async () => {
    sidecar.runYtdlp.mockImplementation(async (id) => {
      outputHandler({ id: "other-id", line: "garbage" });
      outputHandler({ id, line: '{"ok":true}' });
      doneHandler({ id: "other-id", code: 0 });
      doneHandler({ id, code: 0 });
    });
    await expect(fetchMetadata("https://x")).resolves.toEqual({ ok: true });
  });

  it("rejects with the collected stderr on a non-zero exit", async () => {
    sidecar.runYtdlp.mockImplementation(async (id) => {
      outputHandler({ id, kind: "stderr", line: "ERROR: Unsupported URL" });
      doneHandler({ id, code: 1 });
    });
    await expect(fetchMetadata("https://x")).rejects.toThrow("ERROR: Unsupported URL");
  });

  it("rejects with a fallback message on a non-zero exit with no stderr", async () => {
    sidecar.runYtdlp.mockImplementation(async (id) => {
      doneHandler({ id, code: 1 });
    });
    await expect(fetchMetadata("https://x")).rejects.toThrow("yt-dlp could not fetch this URL.");
  });

  it("rejects with a fallback message when the output isn't valid JSON", async () => {
    sidecar.runYtdlp.mockImplementation(async (id) => {
      outputHandler({ id, line: "not json" });
      doneHandler({ id, code: 0 });
    });
    await expect(fetchMetadata("https://x")).rejects.toThrow("Could not read video info.");
  });

  it("rejects when starting yt-dlp itself fails", async () => {
    sidecar.runYtdlp.mockRejectedValue(new Error("spawn failed"));
    await expect(fetchMetadata("https://x")).rejects.toThrow("spawn failed");
  });
});
