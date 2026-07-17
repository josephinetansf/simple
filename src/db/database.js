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
      // Schema needs migration — TODO in future phases
      console.warn(`Schema migration needed: ${versionRows[0].version} -> ${SCHEMA_VERSION}`);
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
 * Seed the database with sample data.
 * Wrapped in a transaction for atomicity.
 */
async function seedDatabase(db) {
  try {
    await db.withTransactionAsync(async (tx) => {
      // 1. Insert properties
      const propertyIds = [];
      for (const prop of SEED_DATA.properties) {
        await tx.runAsync(
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
        await tx.runAsync(
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
        await tx.runAsync(
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
        await tx.runAsync(
          `INSERT OR IGNORE INTO expenses (id, property_id, category, payment_date, amount, period_start, period_end, document_path)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [expense.id, expense.property_id, expense.category, expense.payment_date,
           expense.amount, expense.period_start, expense.period_end, expense.document_path]
        );
      }

      // 5. Insert notifications
      for (const n of SEED_DATA.notifications) {
        await tx.runAsync(
          `INSERT OR IGNORE INTO notifications_log (id, type, entity_id, sent_at, status)
           VALUES (?, ?, ?, ?, ?)`,
          [n.id, n.type, n.entity_id, n.sent_at, n.status]
        );
      }

      console.log('[Habita DB] Seed data inserted successfully');
    });
  } catch (err) {
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
