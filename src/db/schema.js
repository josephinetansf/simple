/**
 * Habita — Database Schema Definitions
 * Phase 2: Database Layer
 *
 * SQLite CREATE TABLE statements for all entities.
 * All dates stored as ISO 8601 strings (YYYY-MM-DD).
 * IDs are UUID v4 strings.
 */

// Enable foreign keys on every connection
export const ENABLE_FOREIGN_KEYS = 'PRAGMA foreign_keys = ON;';

// Schema version — increment when tables change
export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = [
  // ── Version tracking ──────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
  );`,

  // ── 1. Properties ────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS properties (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    address     TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );`,

  // ── 2. Tenancies ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS tenancies (
    id            TEXT PRIMARY KEY,
    property_id   TEXT NOT NULL,
    tenant_name   TEXT NOT NULL,
    unit_number   TEXT,
    start_date    TEXT NOT NULL,
    end_date      TEXT NOT NULL,
    rental_amount REAL NOT NULL CHECK(rental_amount >= 0),
    due_day       INTEGER NOT NULL CHECK(due_day BETWEEN 1 AND 31),
    document_path TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
  );`,

  // ── 3. Rentals (individual rent payments) ────────────────────
  `CREATE TABLE IF NOT EXISTS rentals (
    id            TEXT PRIMARY KEY,
    tenancy_id    TEXT NOT NULL,
    payment_date  TEXT NOT NULL,
    amount        REAL NOT NULL CHECK(amount >= 0),
    period_start  TEXT NOT NULL,
    period_end    TEXT NOT NULL,
    document_path TEXT,
    received_via  TEXT DEFAULT 'bank_transfer',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenancy_id) REFERENCES tenancies(id) ON DELETE CASCADE
  );`,

  // ── 4. Expenses ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS expenses (
    id            TEXT PRIMARY KEY,
    property_id   TEXT NOT NULL,
    category      TEXT NOT NULL,
    payment_date  TEXT NOT NULL,
    amount        REAL NOT NULL CHECK(amount >= 0),
    period_start  TEXT,
    period_end    TEXT,
    document_path TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
  );`,

  // ── 5. Notifications Log ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS notifications_log (
    id        TEXT PRIMARY KEY,
    type      TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    sent_at   TEXT DEFAULT (datetime('now')),
    status    TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed'))
  );`,
];

// ── Seed data ──────────────────────────────────────────────────

/**
 * Generate a simple UUID v4 string.
 * Falls back to Math.random if crypto.randomUUID is unavailable.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: pseudo-UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const SEED_DATA = {
  properties: [
    {
      id: generateId(),
      name: 'Vina Residence',
      address: '123 Jalan Tun Razak, Kuala Lumpur',
    },
    {
      id: generateId(),
      name: 'Condo KLCC',
      address: '456 Jalan Ampang, Kuala Lumpur',
    },
  ],

  tenancies: [
    {
      id: generateId(),
      property_id: null, // will be set after properties are inserted
      tenant_name: 'Ahmad bin Ali',
      unit_number: '01-01',
      start_date: '2026-01-01',
      end_date: '2027-12-31',
      rental_amount: 1200,
      due_day: 5,
      document_path: null,
    },
    {
      id: generateId(),
      property_id: null,
      tenant_name: 'Sarah Tan',
      unit_number: '12-05',
      start_date: '2026-03-01',
      end_date: '2028-02-28',
      rental_amount: 1800,
      due_day: 1,
      document_path: null,
    },
  ],

  rentals: [
    {
      id: generateId(),
      tenancy_id: null,
      payment_date: '2026-01-05',
      amount: 1200,
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      document_path: null,
      received_via: 'bank_transfer',
    },
    {
      id: generateId(),
      tenancy_id: null,
      payment_date: '2026-02-05',
      amount: 1200,
      period_start: '2026-02-01',
      period_end: '2026-02-28',
      document_path: null,
      received_via: 'bank_transfer',
    },
    {
      id: generateId(),
      tenancy_id: null,
      payment_date: '2026-03-01',
      amount: 1800,
      period_start: '2026-03-01',
      period_end: '2026-03-31',
      document_path: null,
      received_via: 'cash',
    },
    {
      id: generateId(),
      tenancy_id: null,
      payment_date: '2026-04-01',
      amount: 1800,
      period_start: '2026-04-01',
      period_end: '2026-04-30',
      document_path: null,
      received_via: 'bank_transfer',
    },
  ],

  expenses: [
    {
      id: generateId(),
      property_id: null,
      category: 'Maintenance',
      payment_date: '2026-02-15',
      amount: 250,
      period_start: null,
      period_end: null,
      document_path: null,
    },
    {
      id: generateId(),
      property_id: null,
      category: 'Utilities',
      payment_date: '2026-03-01',
      amount: 180,
      period_start: '2026-02-01',
      period_end: '2026-02-28',
      document_path: null,
    },
    {
      id: generateId(),
      property_id: null,
      category: 'Insurance',
      payment_date: '2026-01-10',
      amount: 450,
      period_start: '2026-01-01',
      period_end: '2026-12-31',
      document_path: null,
    },
  ],

  notifications: [
    {
      id: generateId(),
      type: 'rent_reminder',
      entity_id: null,
      sent_at: '2026-05-01T10:00:00Z',
      status: 'sent',
    },
  ],
};

