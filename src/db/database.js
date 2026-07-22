/**
 * Habita — Database Initialization
 * Phase 2: Database Layer
 *
 * Singleton database connection with schema migration and seed data.
 * Called once at app startup.
 */

import * as SQLite from 'expo-sqlite';

import {
  ENABLE_FOREIGN_KEYS,
  SCHEMA_VERSION,
  SCHEMA_SQL,
  SEED_DATA,
  generateId,
} from './schema';

const DB_NAME = 'habita.db';

let _db = null;
let _ready = false;
let _error = null;

/**
 * Get the singleton database instance.
 * Must call initializeDatabase() first.
 */
export function getDb() {
  if (!_db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return _db;
}

/**
 * Initialize the database: create tables, run migrations, seed data.
 * Call this once at app startup (from App.js).
 */
export async function initializeDatabase() {
  try {
    _db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable foreign keys
    await _db.runAsync(ENABLE_FOREIGN_KEYS);

    // Create all tables
    for (const sql of SCHEMA_SQL) {
      await _db.runAsync(sql);
    }

    // Check if schema is already initialized
    const versionRows = await _db.getAllAsync(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );

    if (!versionRows || versionRows.length === 0) {
      // First launch — insert schema version and seed data
      await _db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
      await seedDatabase(_db);
    } else if (versionRows[0].version < SCHEMA_VERSION) {
      // Schema needs migration
      console.log(`[Habita DB] Migrating schema: ${versionRows[0].version} -> ${SCHEMA_VERSION}`);
      await migrateSchema(_db, versionRows[0].version);
    }

    _ready = true;
    console.log('[Habita DB] Initialized successfully (v' + SCHEMA_VERSION + ')');
  } catch (err) {
    _error = err;
    _ready = false;
    console.error('[Habita DB] Initialization failed:', err);
  }
}

/**
 * Migrate schema between versions.
 */
async function migrateSchema(db, fromVersion) {
  if (fromVersion < 2) {
    // v1 -> v2: Make rentals.tenancy_id nullable
    await db.runAsync('BEGIN TRANSACTION');
    try {
      const rentals = await db.getAllAsync('SELECT * FROM rentals');
      await db.runAsync(`CREATE TABLE rentals_new (
        id TEXT PRIMARY KEY, tenancy_id TEXT,
        payment_date TEXT NOT NULL, amount REAL NOT NULL CHECK(amount >= 0),
        period_start TEXT NOT NULL, period_end TEXT NOT NULL,
        document_path TEXT, received_via TEXT DEFAULT 'bank_transfer',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (tenancy_id) REFERENCES tenancies(id) ON DELETE CASCADE
      )`);
      for (const r of rentals) {
        await db.runAsync(
          'INSERT INTO rentals_new VALUES (?,?,?,?,?,?,?,?,?,?)',
          [r.id, r.tenancy_id || null, r.payment_date, r.amount, r.period_start, r.period_end, r.document_path, r.received_via, r.created_at, r.updated_at]
        );
      }
      await db.runAsync('DROP TABLE rentals');
      await db.runAsync('ALTER TABLE rentals_new RENAME TO rentals');
      await db.runAsync('DELETE FROM schema_version');
      await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
      await db.runAsync('COMMIT');
      console.log('[Habita DB] Migration v1->v2 complete');
    } catch (err) {
      await db.runAsync('ROLLBACK');
      throw err;
    }
  }
}

/**
 * Seed the database with sample data.
 * Uses manual transaction for atomicity.
 */
async function seedDatabase(db) {
  try {
    // Begin manual transaction
    await db.runAsync('BEGIN TRANSACTION');
    
    // 1. Insert properties
    const propertyIds = [];
    for (const prop of SEED_DATA.properties) {
      await db.runAsync(
        'INSERT OR IGNORE INTO properties (id, name, address) VALUES (?, ?, ?)',
        [prop.id, prop.name, prop.address]
      );
      propertyIds.push(prop.id);
    }

    // 2. Insert tenancies (link to properties)
    const tenancyIds = [];
    for (let i = 0; i < SEED_DATA.tenancies.length; i++) {
      const t = SEED_DATA.tenancies[i];
      const tenancy = { ...t, property_id: propertyIds[i % propertyIds.length] };
      await db.runAsync(
        `INSERT OR IGNORE INTO tenancies (id, property_id, tenant_name, unit_number, start_date, end_date, rental_amount, due_day, document_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenancy.id, tenancy.property_id, tenancy.tenant_name, tenancy.unit_number,
         tenancy.start_date, tenancy.end_date, tenancy.rental_amount, tenancy.due_day,
         tenancy.document_path]
      );
      tenancyIds.push(tenancy.id);
    }

    // 3. Insert rentals (link to tenancies)
    for (let i = 0; i < SEED_DATA.rentals.length; i++) {
      const r = SEED_DATA.rentals[i];
      const rental = { ...r, tenancy_id: tenancyIds[i % tenancyIds.length] };
      await db.runAsync(
        `INSERT OR IGNORE INTO rentals (id, tenancy_id, payment_date, amount, period_start, period_end, document_path, received_via)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [rental.id, rental.tenancy_id, rental.payment_date, rental.amount,
         rental.period_start, rental.period_end, rental.document_path, rental.received_via]
      );
    }

    // 4. Insert expenses (link to properties)
    for (let i = 0; i < SEED_DATA.expenses.length; i++) {
      const e = SEED_DATA.expenses[i];
      const expense = { ...e, property_id: propertyIds[i % propertyIds.length] };
      await db.runAsync(
        `INSERT OR IGNORE INTO expenses (id, property_id, category, payment_date, amount, period_start, period_end, document_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [expense.id, expense.property_id, expense.category, expense.payment_date,
         expense.amount, expense.period_start, expense.period_end, expense.document_path]
      );
    }

    // 5. Insert notifications
    for (const n of SEED_DATA.notifications) {
      await db.runAsync(
        `INSERT OR IGNORE INTO notifications_log (id, type, entity_id, sent_at, status)
         VALUES (?, ?, ?, ?, ?)`,
        [n.id, n.type, n.entity_id, n.sent_at, n.status]
      );
    }

    // Commit transaction
    await db.runAsync('COMMIT');
    console.log('[Habita DB] Seed data inserted successfully');
  } catch (err) {
    // Rollback on error
    try {
      await db.runAsync('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[Habita DB] Rollback failed:', rollbackErr);
    }
    console.error('[Habita DB] Seed data insertion failed:', err);
    throw err;
  }
}

/**
 * Check if the database has been initialized.
 */
export function isDatabaseReady() {
  return _ready;
}

/**
 * Get any initialization error.
 */
export function getDatabaseError() {
  return _error;
}
