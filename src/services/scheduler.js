// Scheduled downloads, stored in the `schedules` table.
// Each schedule runs its download exactly once, then stays "completed" —
// re-downloading the same video would just waste bandwidth and disk.
// status: "pending" | "disabled" | "completed".

import { getDb } from "./db.js";

// sqlite's datetime('now') is UTC — store next_run/last_run in the same
// format so string comparison against it (`next_run <= datetime('now')`) works.
function toSqliteUtc(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// date: "YYYY-MM-DD", time: "HH:MM" (both from <input type="date"/"time">, local).
export function nextRunOnce(date, time) {
  return toSqliteUtc(new Date(`${date}T${time}`));
}

export async function listSchedules() {
  const db = await getDb();
  return db.select(
    `SELECT s.id, s.download_id, s.next_run, s.last_run, s.status,
            d.title, d.url
     FROM schedules s
     JOIN downloads d ON d.id = s.download_id
     ORDER BY s.next_run ASC`,
  );
}

export async function listDueSchedules(nowIso) {
  const db = await getDb();
  return db.select(
    "SELECT id, download_id FROM schedules WHERE status = 'pending' AND next_run <= $1",
    [nowIso],
  );
}

// Schedules whose linked download failed — surfaced separately so the
// "retry failed downloads" setting can pick them up outside their next_run.
export async function listFailedSchedules() {
  const db = await getDb();
  return db.select(
    `SELECT s.id, s.download_id
     FROM schedules s
     JOIN downloads d ON d.id = s.download_id
     WHERE s.status = 'pending' AND d.status = 'failed'`,
  );
}

export async function createSchedule({ downloadId, nextRun }) {
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO schedules (download_id, recurrence, next_run, status) VALUES ($1, 'once', $2, 'pending')",
    [downloadId, nextRun],
  );
  return res.lastInsertId;
}

export async function touchSchedule(id, { nextRun, lastRun, status }) {
  const db = await getDb();
  await db.execute(
    "UPDATE schedules SET next_run = $1, last_run = $2, status = $3 WHERE id = $4",
    [nextRun, lastRun, status, id],
  );
}

export async function setScheduleStatus(id, status) {
  const db = await getDb();
  await db.execute("UPDATE schedules SET status = $1 WHERE id = $2", [status, id]);
}

export async function deleteSchedule(id) {
  const db = await getDb();
  await db.execute("DELETE FROM schedules WHERE id = $1", [id]);
}
