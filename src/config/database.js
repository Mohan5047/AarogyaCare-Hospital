const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'hospital.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and initialize tables
function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      qualification TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      fee REAL NOT NULL,
      rating REAL DEFAULT 4.8,
      available_days TEXT NOT NULL,
      time_start TEXT NOT NULL,
      time_end TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      avatar_url TEXT,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT NOT NULL UNIQUE,
      doctor_id INTEGER NOT NULL,
      patient_name TEXT NOT NULL,
      patient_age INTEGER NOT NULL,
      patient_gender TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      patient_state TEXT DEFAULT 'Delhi',
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      symptoms TEXT,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_date_doc ON appointments (doctor_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments (patient_phone);
    CREATE INDEX IF NOT EXISTS idx_appointments_ref ON appointments (reference_no);
  `);

  try {
    db.exec("ALTER TABLE appointments ADD COLUMN patient_state TEXT DEFAULT 'Delhi';");
  } catch (e) {
    // Column already exists
  }
}

initDatabase();

module.exports = db;
