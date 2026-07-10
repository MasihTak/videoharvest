import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/plugin-notification", () => ({
  isPermissionGranted: vi.fn(async () => false),
  requestPermission: vi.fn(async () => "denied"),
  sendNotification: vi.fn(),
}));
vi.mock("./settings.js", () => ({ getSetting: vi.fn(async () => "1") }));

import { notify } from "./notifications.js";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { getSetting } from "./settings.js";

beforeEach(() => {
  vi.clearAllMocks();
  isPermissionGranted.mockResolvedValue(false);
  requestPermission.mockResolvedValue("denied");
  getSetting.mockResolvedValue("1");
});

describe("notify", () => {
  it("does nothing when notifications are disabled in settings", async () => {
    getSetting.mockResolvedValue("0");
    await notify("Title", "Body");
    expect(isPermissionGranted).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sends immediately when permission is already granted", async () => {
    isPermissionGranted.mockResolvedValue(true);
    await notify("Title", "Body");
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalledWith({ title: "Title", body: "Body" });
  });

  it("requests permission and sends when the user grants it", async () => {
    isPermissionGranted.mockResolvedValue(false);
    requestPermission.mockResolvedValue("granted");
    await notify("Title", "Body");
    expect(sendNotification).toHaveBeenCalledWith({ title: "Title", body: "Body" });
  });

  it("does not send when the user denies the permission request", async () => {
    isPermissionGranted.mockResolvedValue(false);
    requestPermission.mockResolvedValue("denied");
    await notify("Title", "Body");
    expect(sendNotification).not.toHaveBeenCalled();
  });
});
