import Database from "@tauri-apps/plugin-sql";

// Cache the promise, not the resolved handle: callers that ask concurrently
// (the stores both load at app startup) must share one connection attempt.
// Two parallel Database.load() calls race the first-run migrations and one of
// them fails, which is what blanked the window on a fresh install.
let connecting;

export function getDb() {
  connecting ??= Database.load("sqlite:videoharvest.db").catch((err) => {
    connecting = undefined; // let the next caller retry
    throw err;
  });
  return connecting;
}
