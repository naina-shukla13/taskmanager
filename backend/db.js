const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'taskmanager.db');

let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY (project_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date DATE,
      project_id INTEGER NOT NULL,
      assignee_id INTEGER,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  persist();
}

function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function prepare(sql) {
  return {
    run(...params) {
      db.run(sql, params);
      persist();
      const res = db.exec('SELECT last_insert_rowid() as id');
      const lastInsertRowid = res.length ? res[0].values[0][0] : null;
      return { lastInsertRowid };
    },
    get(...params) {
      const result = db.exec(sql, params);
      if (!result.length || !result[0].values.length) return undefined;
      const cols = result[0].columns;
      return Object.fromEntries(cols.map((c, i) => [c, result[0].values[0][i]]));
    },
    all(...params) {
      const result = db.exec(sql, params);
      if (!result.length) return [];
      const cols = result[0].columns;
      return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
    }
  };
}

function exec(sql) {
  db.run(sql);
  persist();
}

module.exports = { initDb, prepare, exec };