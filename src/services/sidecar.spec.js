import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async () => {}) }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}) }));

import { runYtdlp, runFfmpeg, cancelProcess, onOutput, onDone } from "./sidecar.js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("process invocations", () => {
  it("runYtdlp invokes run_ytdlp with id and args", () => {
    runYtdlp("dl-1", ["-f", "best"]);
    expect(invoke).toHaveBeenCalledWith("run_ytdlp", { id: "dl-1", args: ["-f", "best"] });
  });

  it("runFfmpeg invokes run_ffmpeg with id and args", () => {
    runFfmpeg("dl-1", ["-i", "in.mp4"]);
    expect(invoke).toHaveBeenCalledWith("run_ffmpeg", { id: "dl-1", args: ["-i", "in.mp4"] });
  });

  it("cancelProcess invokes cancel_process with id", () => {
    cancelProcess("dl-1");
    expect(invoke).toHaveBeenCalledWith("cancel_process", { id: "dl-1" });
  });
});

describe("event listeners", () => {
  it("onOutput subscribes to sidecar://output and forwards the payload", async () => {
    const handler = vi.fn();
    await onOutput(handler);
    expect(listen).toHaveBeenCalledWith("sidecar://output", expect.any(Function));
    const wrapped = listen.mock.calls[0][1];
    wrapped({ payload: { id: "dl-1", line: "..." } });
    expect(handler).toHaveBeenCalledWith({ id: "dl-1", line: "..." });
  });

  it("onDone subscribes to sidecar://done and forwards the payload", async () => {
    const handler = vi.fn();
    await onDone(handler);
    expect(listen).toHaveBeenCalledWith("sidecar://done", expect.any(Function));
    const wrapped = listen.mock.calls[0][1];
    wrapped({ payload: { id: "dl-1", code: 0 } });
    expect(handler).toHaveBeenCalledWith({ id: "dl-1", code: 0 });
  });
});
