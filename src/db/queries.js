/**
 * Habita — Database CRUD Queries
 * Phase 2: Database Layer
 *
 * All query functions receive a SQLiteTransaction or SQLiteDatabase
 * and return typed results.
 *
 * JSDoc types used for runtime documentation (no TypeScript).
 */

// ── Properties ─────────────────────────────────────────────────

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @returns {Promise<Array<{id: string, name: string, address: string, created_at: string, updated_at: string}>>}
 */
export async function getAllProperties(db) {
  const results = await db.getAllAsync(
    'SELECT * FROM properties ORDER BY name ASC'
  );
  return results.map(rowToProperty);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @returns {Promise<{id: string, name: string, address: string, created_at: string, updated_at: string} | null>}
 */
export async function getPropertyById(db, id) {
  const rows = await db.getAllAsync(
    'SELECT * FROM properties WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rowToProperty(rows[0]) : null;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {{name: string, address: string}} data
 * @returns {Promise<string>} inserted id
 */
export async function createProperty(db, data) {
  const id = generateId();
  await db.runAsync(
    'INSERT INTO properties (id, name, address) VALUES (?, ?, ?)',
    [id, data.name, data.address]
  );
  return id;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @param {{name?: string, address?: string}} data
 * @returns {Promise<void>}
 */
export async function updateProperty(db, id, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.address !== undefined) {
    fields.push('address = ?');
    values.push(data.address);
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.runAsync(
    `UPDATE properties SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteProperty(db, id) {
  await db.runAsync('DELETE FROM properties WHERE id = ?', [id]);
}

// ── Tenancies ──────────────────────────────────────────────────

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @returns {Promise<Array<{id: string, property_id: string, tenant_name: string, unit_number: string|null, start_date: string, end_date: string, rental_amount: number, due_day: number, document_path: string|null, created_at: string, updated_at: string, property_name: string}>>}
 */
export async function getAllTenancies(db) {
  const results = await db.getAllAsync(
    `SELECT t.*, p.name AS property_name
     FROM tenancies t
     JOIN properties p ON t.property_id = p.id
     ORDER BY t.end_date DESC`
  );
  return results.map(rowToTenancy);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} propertyId
 * @returns {Promise<Array<any>>}
 */
export async function getTenanciesByProperty(db, propertyId) {
  const results = await db.getAllAsync(
    `SELECT t.*, p.name AS property_name
     FROM tenancies t
     JOIN properties p ON t.property_id = p.id
     WHERE t.property_id = ?
     ORDER BY t.end_date DESC`,
    [propertyId]
  );
  return results.map(rowToTenancy);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {object} data
 * @returns {Promise<string>}
 */
export async function createTenancy(db, data) {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO tenancies (id, property_id, tenant_name, unit_number, start_date, end_date, rental_amount, due_day, document_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.property_id, data.tenant_name, data.unit_number || null,
      data.start_date, data.end_date, data.rental_amount, data.due_day,
      data.document_path || null,
    ]
  );
  return id;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function updateTenancy(db, id, data) {
  const fields = [];
  const values = [];
  const mappings = {
    property_id: 'property_id', tenant_name: 'tenant_name',
    unit_number: 'unit_number', start_date: 'start_date',
    end_date: 'end_date', rental_amount: 'rental_amount',
    due_day: 'due_day', document_path: 'document_path',
  };
  for (const [key, col] of Object.entries(mappings)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(data[key]);
    }
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.runAsync(
    `UPDATE tenancies SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTenancy(db, id) {
  await db.runAsync('DELETE FROM tenancies WHERE id = ?', [id]);
}

// ── Rentals ────────────────────────────────────────────────────

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @returns {Promise<Array<any>>}
 */
export async function getAllRentals(db) {
  const results = await db.getAllAsync(
    `SELECT r.*, t.tenant_name, p.name AS property_name
     FROM rentals r
     JOIN tenancies t ON r.tenancy_id = t.id
     JOIN properties p ON t.property_id = p.id
     ORDER BY r.payment_date DESC`
  );
  return results.map(rowToRental);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} tenancyId
 * @returns {Promise<Array<any>>}
 */
export async function getRentalsByTenancy(db, tenancyId) {
  const results = await db.getAllAsync(
    'SELECT * FROM rentals WHERE tenancy_id = ? ORDER BY payment_date DESC',
    [tenancyId]
  );
  return results.map(rowToRental);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {number} year
 * @param {number} month
 * @returns {Promise<Array<any>>}
 */
export async function getRentalsByMonth(db, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const results = await db.getAllAsync(
    `SELECT r.*, t.tenant_name, p.name AS property_name
     FROM rentals r
     JOIN tenancies t ON r.tenancy_id = t.id
     JOIN properties p ON t.property_id = p.id
     WHERE r.payment_date >= ? AND r.payment_date < ?
     ORDER BY r.payment_date DESC`,
    [startDate, nextMonth]
  );
  return results.map(rowToRental);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {object} data
 * @returns {Promise<string>}
 */
export async function createRental(db, data) {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO rentals (id, tenancy_id, payment_date, amount, period_start, period_end, document_path, received_via)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.tenancy_id, data.payment_date, data.amount,
      data.period_start, data.period_end, data.document_path || null,
      data.received_via || 'bank_transfer',
    ]
  );
  return id;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function updateRental(db, id, data) {
  const fields = [];
  const values = [];
  const mappings = {
    tenancy_id: 'tenancy_id', payment_date: 'payment_date',
    amount: 'amount', period_start: 'period_start',
    period_end: 'period_end', document_path: 'document_path',
    received_via: 'received_via',
  };
  for (const [key, col] of Object.entries(mappings)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(data[key]);
    }
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.runAsync(
    `UPDATE rentals SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteRental(db, id) {
  await db.runAsync('DELETE FROM rentals WHERE id = ?', [id]);
}

// ── Expenses ───────────────────────────────────────────────────

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @returns {Promise<Array<any>>}
 */
export async function getAllExpenses(db) {
  const results = await db.getAllAsync(
    `SELECT e.*, p.name AS property_name
     FROM expenses e
     JOIN properties p ON e.property_id = p.id
     ORDER BY e.payment_date DESC`
  );
  return results.map(rowToExpense);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} propertyId
 * @returns {Promise<Array<any>>}
 */
export async function getExpensesByProperty(db, propertyId) {
  const results = await db.getAllAsync(
    `SELECT * FROM expenses WHERE property_id = ? ORDER BY payment_date DESC`,
    [propertyId]
  );
  return results.map(rowToExpense);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {number} year
 * @param {number} month
 * @returns {Promise<Array<any>>}
 */
export async function getExpensesByMonth(db, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const results = await db.getAllAsync(
    `SELECT e.*, p.name AS property_name
     FROM expenses e
     JOIN properties p ON e.property_id = p.id
     WHERE e.payment_date >= ? AND e.payment_date < ?
     ORDER BY e.payment_date DESC`,
    [startDate, nextMonth]
  );
  return results.map(rowToExpense);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {object} data
 * @returns {Promise<string>}
 */
export async function createExpense(db, data) {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO expenses (id, property_id, category, payment_date, amount, period_start, period_end, document_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.property_id, data.category, data.payment_date, data.amount,
      data.period_start || null, data.period_end || null,
      data.document_path || null,
    ]
  );
  return id;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function updateExpense(db, id, data) {
  const fields = [];
  const values = [];
  const mappings = {
    property_id: 'property_id', category: 'category',
    payment_date: 'payment_date', amount: 'amount',
    period_start: 'period_start', period_end: 'period_end',
    document_path: 'document_path',
  };
  for (const [key, col] of Object.entries(mappings)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(data[key]);
    }
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.runAsync(
    `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteExpense(db, id) {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

// ── Notifications ──────────────────────────────────────────────

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @returns {Promise<Array<any>>}
 */
export async function getUnsentNotifications(db) {
  const results = await db.getAllAsync(
    "SELECT * FROM notifications_log WHERE status = 'pending' ORDER BY sent_at ASC"
  );
  return results.map(rowToNotification);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function markNotificationSent(db, id) {
  await db.runAsync(
    "UPDATE notifications_log SET status = 'sent' WHERE id = ?",
    [id]
  );
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {object} data
 * @returns {Promise<string>}
 */
export async function createNotification(db, data) {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO notifications_log (id, type, entity_id, sent_at, status)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.type, data.entity_id, data.sent_at || null, data.status || 'pending']
  );
  return id;
}

// ── Helper functions for OCR-based record creation ─────────────

/**
 * Find a property by name (case-insensitive partial match).
 * Returns property id or null.
 */
export async function findPropertyByName(db, name) {
  if (!name) return null;
  const rows = await db.getAllAsync(
    "SELECT id FROM properties WHERE LOWER(name) LIKE LOWER(?) LIMIT 1",
    [`%${name}%`]
  );
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * Find an active tenancy by tenant name and property id.
 * An active tenancy has end_date >= today.
 */
export async function findActiveTenancy(db, tenantName, propertyId) {
  if (!tenantName || !propertyId) return null;
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.getAllAsync(
    `SELECT id FROM tenancies 
     WHERE tenant_name LIKE ? AND property_id = ? AND end_date >= ?
     ORDER BY end_date DESC LIMIT 1`,
    [`%${tenantName}%`, propertyId, today]
  );
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * Ensure a property exists. If not found by name, create one.
 * Returns the property id.
 */
export async function ensureProperty(db, propertyName, address) {
  let propId = await findPropertyByName(db, propertyName);
  if (propId) return propId;
  
  // Create new property
  const name = propertyName || 'Unknown Property';
  const addr = address || '';
  const id = generateId();
  await db.runAsync(
    'INSERT INTO properties (id, name, address) VALUES (?, ?, ?)',
    [id, name, addr]
  );
  return id;
}

/**
 * Create a tenancy record from OCR-extracted data.
 * Ensures the property exists first.
 * Returns the tenancy id.
 */
export async function createTenancyFromOCR(db, data, documentPath) {
  // Ensure property exists
  const propertyId = await ensureProperty(
    db,
    data.propertyAddress || data.propertyName || 'Unknown',
    ''
  );
  
  // Build tenancy data
  const tenancyData = {
    property_id: propertyId,
    tenant_name: data.tenantName || data.tenant || 'Unknown Tenant',
    unit_number: data.unitNumber || data.unit || null,
    start_date: data.startDate || data.start_date || new Date().toISOString().split('T')[0],
    end_date: data.endDate || data.end_date || '',
    rental_amount: data.monthlyRent || data.rentalAmount || data.rent || 0,
    due_day: data.dueDay || data.due_day || 1,
    document_path: documentPath || null,
  };
  
  return await createTenancy(db, tenancyData);
}

/**
 * Create a rental record from OCR-extracted data.
 * Finds or creates the tenancy link.
 * Returns the rental id.
 */
export async function createRentalFromOCR(db, data, documentPath) {
  // Try to find matching tenancy by tenant name
  let tenancyId = null;
  if (data.tenantName || data.payerName) {
    // Search across all tenancies for a name match
    const allTenancies = await getAllTenancies(db);
    const searchName = (data.tenantName || data.payerName || '').toLowerCase();
    for (const t of allTenancies) {
      if (t.tenant_name.toLowerCase().includes(searchName) || 
          searchName.includes(t.tenant_name.toLowerCase())) {
        tenancyId = t.id;
        break;
      }
    }
  }
  
  // If no tenancy found, use the first active one (or null if none)
  if (!tenancyId) {
    const today = new Date().toISOString().split('T')[0];
    const rows = await db.getAllAsync(
      `SELECT id FROM tenancies WHERE end_date >= ? LIMIT 1`,
      [today]
    );
    if (rows.length > 0) tenancyId = rows[0].id;
  }
  
  // Build rental data
  const rentalData = {
    tenancy_id: tenancyId || '',
    payment_date: data.paymentDate || data.date || new Date().toISOString().split('T')[0],
    amount: data.amount || 0,
    period_start: data.periodStart || data.period_start || '',
    period_end: data.periodEnd || data.period_end || '',
    document_path: documentPath || null,
    received_via: data.receivedVia || data.method || 'bank_transfer',
  };
  
  return await createRental(db, rentalData);
}

/**
 * Create an expense record from OCR-extracted data.
 * Ensures the property exists first.
 * Returns the expense id.
 */
export async function createExpenseFromOCR(db, data, documentPath) {
  // Ensure property exists
  const propertyId = await ensureProperty(
    db,
    data.propertyName || data.property || 'Unknown',
    ''
  );
  
  // Build expense data
  const expenseData = {
    property_id: propertyId,
    category: data.category || 'Other',
    payment_date: data.paymentDate || data.date || new Date().toISOString().split('T')[0],
    amount: data.amount || 0,
    period_start: data.periodStart || data.period_start || null,
    period_end: data.periodEnd || data.period_end || null,
    document_path: documentPath || null,
  };
  
  return await createExpense(db, expenseData);
}

// ── Row-to-object mappers ──────────────────────────────────────

function rowToProperty(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToTenancy(row) {
  return {
    id: row.id,
    property_id: row.property_id,
    tenant_name: row.tenant_name,
    unit_number: row.unit_number,
    start_date: row.start_date,
    end_date: row.end_date,
    rental_amount: row.rental_amount,
    due_day: row.due_day,
    document_path: row.document_path,
    created_at: row.created_at,
    updated_at: row.updated_at,
    property_name: row.property_name || null,
  };
}

function rowToRental(row) {
  return {
    id: row.id,
    tenancy_id: row.tenancy_id,
    payment_date: row.payment_date,
    amount: row.amount,
    period_start: row.period_start,
    period_end: row.period_end,
    document_path: row.document_path,
    received_via: row.received_via,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tenant_name: row.tenant_name || null,
    property_name: row.property_name || null,
  };
}

function rowToExpense(row) {
  return {
    id: row.id,
    property_id: row.property_id,
    category: row.category,
    payment_date: row.payment_date,
    amount: row.amount,
    period_start: row.period_start,
    period_end: row.period_end,
    document_path: row.document_path,
    created_at: row.created_at,
    updated_at: row.updated_at,
    property_name: row.property_name || null,
  };
}

function rowToNotification(row) {
  return {
    id: row.id,
    type: row.type,
    entity_id: row.entity_id,
    sent_at: row.sent_at,
    status: row.status,
  };
}

// Re-export generateId for seed data FK linking
export { generateId } from './schema.js';
