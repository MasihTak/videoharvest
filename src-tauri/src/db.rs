use tauri_plugin_sql::{Migration, MigrationKind};

pub const DB_URL: &str = "sqlite:videoharvest.db";

pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create downloads, settings, logs, schedules tables",
            sql: include_str!("../migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add selector column to downloads for retry",
            sql: include_str!("../migrations/0002_downloads_selector.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
