import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async () => {}) }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}) }));

import {
  binariesReady,
  bootstrapBinaries,
  getYtdlpVersion,
  updateYtdlp,
  onBootstrapProgress,
  checkLatestYtdlp,
} from "./binaries.js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("command wrappers", () => {
  it("binariesReady invokes binaries_ready", () => {
    binariesReady();
    expect(invoke).toHaveBeenCalledWith("binaries_ready");
  });

  it("bootstrapBinaries invokes bootstrap_binaries", () => {
    bootstrapBinaries();
    expect(invoke).toHaveBeenCalledWith("bootstrap_binaries");
  });

  it("getYtdlpVersion invokes ytdlp_version", () => {
    getYtdlpVersion();
    expect(invoke).toHaveBeenCalledWith("ytdlp_version");
  });

  it("updateYtdlp invokes update_ytdlp", () => {
    updateYtdlp();
    expect(invoke).toHaveBeenCalledWith("update_ytdlp");
  });
});

describe("onBootstrapProgress", () => {
  it("subscribes to bootstrap://progress and forwards the payload", async () => {
    const handler = vi.fn();
    await onBootstrapProgress(handler);
    expect(listen).toHaveBeenCalledWith("bootstrap://progress", expect.any(Function));
    const wrapped = listen.mock.calls[0][1];
    wrapped({ payload: { file: "yt-dlp.exe", received: 10, total: 100 } });
    expect(handler).toHaveBeenCalledWith({ file: "yt-dlp.exe", received: 10, total: 100 });
  });
});

describe("checkLatestYtdlp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the latest release tag", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ tag_name: "2025.06.01" }) })));
    await expect(checkLatestYtdlp()).resolves.toBe("2025.06.01");
  });

  it("throws when the GitHub request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await expect(checkLatestYtdlp()).rejects.toThrow("Could not reach GitHub.");
  });
});
