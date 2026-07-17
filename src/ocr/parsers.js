/**
 * Habita — OCR Text Parsers
 * Phase 3: OCR Pipeline
 *
 * Regex-based parsers that extract structured data from OCR-extracted text.
 * Handles common Malaysian document formats.
 *
 * Each parser returns an object with extracted fields, or null if
 * the text doesn't match the expected document type.
 */

// ── Date Parsing Utilities ─────────────────────────────────────

/**
 * Parse various date formats to ISO 8601 (YYYY-MM-DD).
 * Handles: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD Month YYYY, etc.
 * 
 * @param {string} dateString
 * @returns {string|null} ISO date string or null
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  
  dateString = dateString.trim();
  
  // Try YYYY-MM-DD first
  let match = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return normalizeDate(match[1], match[2], match[3]);
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  match = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return normalizeDate(match[3], match[2], match[1]);
  }
  
  // Try DD Month YYYY (e.g., "15 January 2026")
  match = dateString.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const monthMap = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
      jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const month = monthMap[match[2].toLowerCase()];
    if (month) {
      return normalizeDate(match[3], month, match[1]);
    }
  }
  
  return null;
}

/**
 * Normalize day/month/year to zero-padded ISO format.
 */
function normalizeDate(year, month, day) {
  const m = String(Math.min(12, Math.max(1, parseInt(month, 10)))).padStart(2, '0');
  const d = String(Math.min(31, Math.max(1, parseInt(day, 10)))).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Parse a monetary amount, stripping RM, commas, etc.
 * 
 * @param {string} amountString
 * @returns {number|null}
 */
export function parseAmount(amountString) {
  if (!amountString) return null;
  
  // Remove RM, commas, spaces
  const cleaned = amountString.replace(/RM\s*/gi, '').replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

// ── Tenancy Agreement Parser ───────────────────────────────────

/**
 * Extract tenancy agreement fields from OCR text.
 * 
 * Expected fields:
 * - tenantName: string
 * - propertyAddress: string
 * - unitNumber: string
 * - startDate: string (ISO 8601)
 * - endDate: string (ISO 8601)
 * - monthlyRent: number
 * - dueDay: number (1-31)
 * - securityDeposit: number (optional)
 * 
 * @param {string} text - OCR-extracted text
 * @returns {object|null} Parsed fields or null if no match
 */
export function parseTenancyAgreement(text) {
  if (!text || text.length < 50) return null;
  
  const result = {
    tenantName: null,
    propertyAddress: null,
    unitNumber: null,
    startDate: null,
    endDate: null,
    monthlyRent: null,
    dueDay: null,
    securityDeposit: null,
  };
  
  // Extract tenant name
  let match = text.match(/(?:Tenant|Lessee)[:\s]+([A-Z][a-zA-Z\s\.]+?)(?=IC|No|:|$)/i);
  if (match) result.tenantName = match[1].trim();
  
  // Extract property address
  match = text.match(/(?:Building|Property|Address)[:\s]+([^\n]+)/i);
  if (match) result.propertyAddress = match[1].trim();
  
  // Extract unit number
  match = text.match(/(?:Unit|No\.?|Lot)[:\s]+([^\n]+)/i);
  if (match) result.unitNumber = match[1].trim();
  
  // Extract start date
  match = text.match(/(?:Start|Commencement|From)[:\s]+([^\n]+)/i);
  if (match) result.startDate = parseDate(match[1].trim());
  
  // Extract end date
  match = text.match(/(?:End|Expiry|To)[:\s]+([^\n]+)/i);
  if (match) result.endDate = parseDate(match[1].trim());
  
  // Extract monthly rent
  match = text.match(/(?:Monthly\s+)?Rent[:\s]*RM?\s*([\d,]+\.?\d*)/i);
  if (match) result.monthlyRent = parseAmount(match[1]);
  
  // Extract due day
  match = text.match(/Due\s+(?:Day)[:\s]*(\d{1,2})(?:st|nd|rd|th)?/i);
  if (!match) {
    match = text.match(/(?:due|payable)[:\s]+(\d{1,2})(?:st|nd|rd|th)?/i);
  }
  if (match) result.dueDay = parseInt(match[1], 10);
  
  // Extract security deposit
  match = text.match(/(?:Security\s+)?Deposit[:\s]*RM?\s*([\d,]+\.?\d*)/i);
  if (match) result.securityDeposit = parseAmount(match[1]);
  
  // Validate: need at least 3 key fields to consider it a match
  const keyFields = [result.tenantName, result.propertyAddress, result.monthlyRent, result.startDate, result.endDate];
  const matchedCount = keyFields.filter(f => f !== null).length;
  
  if (matchedCount < 3) return null;
  
  return result;
}

// ── Rental Payment Slip Parser ─────────────────────────────────

/**
 * Extract rental payment slip fields from OCR text.
 * 
 * Expected fields:
 * - payerName: string
 * - amount: number
 * - paymentDate: string (ISO 8601)
 * - periodStart: string (ISO 8601)
 * - periodEnd: string (ISO 8601)
 * - referenceNumber: string (optional)
 * 
 * @param {string} text - OCR-extracted text
 * @returns {object|null} Parsed fields or null if no match
 */
export function parseRentalSlip(text) {
  if (!text || text.length < 30) return null;
  
  const result = {
    payerName: null,
    amount: null,
    paymentDate: null,
    periodStart: null,
    periodEnd: null,
    referenceNumber: null,
  };
  
  // Extract amount
  let match = text.match(/(?:Amount|Total|Paid)[:\s]*RM?\s*([\d,]+\.?\d*)/i);
  if (match) result.amount = parseAmount(match[1]);
  
  // Alternative: look for RM followed by number anywhere
  if (!result.amount) {
    match = text.match(/RM\s*([\d,]+\.?\d*)/i);
    if (match) result.amount = parseAmount(match[1]);
  }
  
  // Extract payment date
  match = text.match(/(?:Date|Payment\s+Date|Trans\s+Date)[:\s]+([^\n]+)/i);
  if (match) result.paymentDate = parseDate(match[1].trim());
  
  // Alternative: look for any date near "payment" or "date"
  if (!result.paymentDate) {
    match = text.match(/(?:payment|date|trans)[^]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (match) result.paymentDate = parseDate(match[1]);
  }
  
  // Extract period start
  match = text.match(/(?:Period|For\s+Month|From)[:\s]+([^\n]+)/i);
  if (match) result.periodStart = parseDate(match[1].trim());
  
  // Extract period end
  match = text.match(/(?:To|Until|End)[:\s]+([^\n]+)/i);
  if (match) result.periodEnd = parseDate(match[1].trim());
  
  // Extract reference number
  match = text.match(/(?:Reference|Ref|Transaction|ID)[:\s]+([^\s\n]+)/i);
  if (match) result.referenceNumber = match[1].trim();
  
  // Extract payer name (from bank transfer)
  match = text.match(/(?:From|Paid\s+By|Account\s+Holder)[:\s]+([A-Z][a-zA-Z\s]+?)(?=\n|$)/i);
  if (match) result.payerName = match[1].trim();
  
  // Validate: need amount + at least one other field
  if (!result.amount) return null;
  
  const otherFields = [result.paymentDate, result.periodStart, result.payerName];
  const matchedCount = otherFields.filter(f => f !== null).length;
  
  if (matchedCount < 1) return null;
  
  return result;
}

// ── Expense Bill Parser ────────────────────────────────────────

/**
 * Extract expense bill fields from OCR text.
 * 
 * Expected fields:
 * - vendor: string
 * - category: string (best guess)
 * - amount: number
 * - date: string (ISO 8601)
 * - description: string (optional)
 * 
 * @param {string} text - OCR-extracted text
 * @returns {object|null} Parsed fields or null if no match
 */
export function parseExpenseBill(text) {
  if (!text || text.length < 30) return null;
  
  const result = {
    vendor: null,
    category: null,
    amount: null,
    date: null,
    description: null,
  };
  
  // Extract amount (look for TOTAL or AMOUNT)
  let match = text.match(/(?:Total|Amount\s+Due|Grand\s+Total)[:\s]*RM?\s*([\d,]+\.?\d*)/i);
  if (match) result.amount = parseAmount(match[1]);
  
  // Alternative: largest number near "RM"
  if (!result.amount) {
    match = text.match(/RM\s*([\d,]+\.?\d*)/i);
    if (match) result.amount = parseAmount(match[1]);
  }
  
  // Extract date
  match = text.match(/(?:Date|Invoice\s+Date|Bill\s+Date)[:\s]+([^\n]+)/i);
  if (match) result.date = parseDate(match[1].trim());
  
  // Alternative: look for date pattern anywhere
  if (!result.date) {
    match = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (match) result.date = parseDate(match[1]);
  }
  
  // Extract vendor/company name (usually at top)
  match = text.match(/^([A-Z][A-Za-z\s\.]+?)\n/i);
  if (match) result.vendor = match[1].trim();
  
  // Alternative: look for "From" or company patterns
  if (!result.vendor) {
    match = text.match(/(?:From|Company)[:\s]+([^\n]+)/i);
    if (match) result.vendor = match[1].trim();
  }
  
  // Categorize based on keywords
  const lowerText = text.toLowerCase();
  const categoryMap = [
    { keywords: ['maintenance', 'repair', 'renovation'], category: 'Maintenance' },
    { keywords: ['electric', 'tenaga', 'water', 'syabas', 'gas'], category: 'Utilities' },
    { keywords: ['insurance', 'takaful'], category: 'Insurance' },
    { keywords: ['internet', 'streamyx', 'unifi', 'wifi'], category: 'Internet' },
    { keywords: ['gas', 'petronas', 'petrol', 'fuel'], category: 'Fuel' },
    { keywords: ['management', 'service\s+charge'], category: 'Management Fee' },
    { keywords: ['assessment', 'quitrent', 'dog\s+license'], category: 'Assessment & License' },
    { keywords: ['cleaning', 'pest\s+control'], category: 'Cleaning' },
  ];
  
  for (const { keywords, category } of categoryMap) {
    if (new RegExp(keywords.join('|'), 'i').test(lowerText)) {
      result.category = category;
      break;
    }
  }
  
  // Default category if none matched
  if (!result.category) {
    result.category = 'Other';
  }
  
  // Extract description/items
  match = text.match(/(?:Description|Items|Particulars)[:\s]+([^\n]+)/i);
  if (match) result.description = match[1].trim();
  
  // Validate: need amount + at least one other field
  if (!result.amount) return null;
  
  const otherFields = [result.vendor, result.date];
  const matchedCount = otherFields.filter(f => f !== null).length;
  
  if (matchedCount < 1) return null;
  
  return result;
}

// ── Auto-Detect Parser ─────────────────────────────────────────

/**
 * Attempt to detect document type and parse accordingly.
 * 
 * @param {string} text - OCR-extracted text
 * @returns {{type: string, data: object}|null} Detected type and parsed data
 */
export function detectAndParse(text) {
  if (!text || text.length < 30) return null;
  
  const lowerText = text.toLowerCase();
  
  // Heuristic: check for keywords indicating document type
  if (
    /tenanc|agreement|lessee|landlord|tenant|rental\s+term/i.test(lowerText)
  ) {
    const data = parseTenancyAgreement(text);
    if (data) return { type: 'tenancy', data };
  }
  
  if (
    /payment\s+slip|bank\s+transfer|receipt|transaction|proof\s+of\s+payment/i.test(lowerText)
  ) {
    const data = parseRentalSlip(text);
    if (data) return { type: 'rental', data };
  }
  
  if (
    /invoice|bill|receipt|total|amount|vendor|company/i.test(lowerText)
  ) {
    const data = parseExpenseBill(text);
    if (data) return { type: 'expense', data };
  }
  
  // Fallback: try all parsers
  let data = parseTenancyAgreement(text);
  if (data) return { type: 'tenancy', data };
  
  data = parseRentalSlip(text);
  if (data) return { type: 'rental', data };
  
  data = parseExpenseBill(text);
  if (data) return { type: 'expense', data };
  
  return null;
}
