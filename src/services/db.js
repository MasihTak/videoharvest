import Database from "@tauri-apps/plugin-sql";

let db;

export async function getDb() {
  if (!db) {
    db = await Database.load("sqlite:videoharvest.db");
  }
  return db;
}
