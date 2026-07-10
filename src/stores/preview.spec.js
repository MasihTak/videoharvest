import { describe, it, expect } from "vitest";
import { previewState } from "./preview.js";

describe("previewState", () => {
  it("starts empty, unloaded, with no error", () => {
    expect(previewState).toEqual({ data: null, error: "", loading: false });
  });
});
