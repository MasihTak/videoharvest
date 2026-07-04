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

// Resolves the default-time quick-schedule option to a concrete local
// date/time: today at defaultTime if that hasn't passed yet, else tomorrow.
export function resolveDefaultRun(defaultTime) {
  const [hours, minutes] = defaultTime.split(":").map(Number);
  const now = new Date();
  const run = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  if (run <= now) run.setDate(run.getDate() + 1);

  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${run.getFullYear()}-${pad(run.getMonth() + 1)}-${pad(run.getDate())}`,
    time: `${pad(run.getHours())}:${pad(run.getMinutes())}`,
  };
}

// next_run is stored as sqlite UTC ("YYYY-MM-DD HH:MM:SS", no zone).
export function formatCountdown(nextRun) {
  if (!nextRun) return null;
  const diffMs = new Date(`${nextRun}Z`) - Date.now();
  if (diffMs <= 0) return "overdue";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
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
