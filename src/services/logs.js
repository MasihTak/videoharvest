// App logs, stored in the `logs` table.
// Levels: INFO | SUCCESS | WARNING | ERROR

import { getDb } from "./db.js";

export async function writeLog(level, message) {
  const db = await getDb();
  await db.execute("INSERT INTO logs (level, message) VALUES ($1, $2)", [level, message]);
}

export async function getLogs(limit = 200) {
  const db = await getDb();
  return db.select(
    "SELECT id, level, message, created_at FROM logs ORDER BY id DESC LIMIT $1",
    [limit],
  );
}
