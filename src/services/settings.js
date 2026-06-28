// App preferences, stored in the `settings` key/value table.

import { getDb } from "./db.js";

export async function getSetting(key, fallback = null) {
  const db = await getDb();
  const rows = await db.select("SELECT value FROM settings WHERE key = $1", [key]);
  return rows.length ? rows[0].value : fallback;
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}
