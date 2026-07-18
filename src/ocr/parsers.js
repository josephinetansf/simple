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
  
  // Try DD Month YYYY (e.g., "15 January 2026") — also handles ordinals like "01ST", "31ST"
  match = dateString.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/i);
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
  
  // ═══════════════════════════════════════════════════════════
  // STRATEGY A: Standard agreement format (most common)
  // "Tenant: Ms. Sarah Tan" or "BETWEEN: ... Tenant: ..."
  // Only matches if we find a reasonable tenant name (2+ words, not just "Name")
  // ═══════════════════════════════════════════════════════════
  
  // Tenant name — standard format: "Tenant: Name" or "AND Tenant: Name"
  // Exclude IC number words from capture
  let match = text.match(/(?:AND\s+)?Tenant[:\s]+(?:Ms\.?|Mr\.?|Mrs\.?|Dr\.?|Dato\'?|Tan\s+Sri)?\s*([A-Z][a-zA-Z\s\.\'\-]+?)(?:\s+IC|\s+No\.|$)/im);
  if (!match) {
    match = text.match(/(?:AND\s+)?Tenant[:\s]+(?:Ms\.?|Mr\.?|Mrs\.?|Dr\.?|Dato\'?|Tan\s+Sri)?\s*([A-Z][a-zA-Z\s\.\'\-]+)/im);
  }
  if (match && match[1].trim().split(/\s+/).length >= 2 && !/^(?:NAME|ADDRESS|NRIC)$/i.test(match[1].trim())) {
    result.tenantName = match[1].trim().replace(/\s+/g, ' ');
  }
  
  // Property address — "Address:" or "Address <value>" on same line
  match = text.match(/Address[:\s]+([^\n]{10,})/im);
  if (!match) {
    match = text.match(/(?:Building|Premises)[:\s]+([^\n]{10,})/im);
  }
  if (match && match[1].trim().length > 10) {
    const addr = match[1].trim().replace(/\s+IC\s*$/i, '').replace(/\s+No\.\s*[\d\-]+\s*$/i, '').trim();
    // Reject if it looks like a bank name (common in SCHEDULE format)
    const bankNames = /BANK|RHB|CIMB|MAYBANK|PUBLIC\s*BANK|HONG\s*LEONG|AM\s*BANK|OCBC|UOB/i;
    if (!bankNames.test(addr)) {
      result.propertyAddress = addr;
    }
  }
  
  // Unit number — "Unit No:" or "Unit:"
  match = text.match(/(?:Unit\s+No\.?|Unit|Lot)[:\s]+([^\n]+)/im);
  if (match) {
    result.unitNumber = match[1].trim();
  }
  
  // Start date — "Start Date:" or "Commencement Date:" or "From:"
  match = text.match(/(?:Start\s+Date|Commencement\s+Date|From|Tenancy\s+Start)[:\s]+([^\n]+)/im);
  if (match) {
    result.startDate = parseDate(match[1].trim());
  }
  
  // End date — "End Date:" or "Expiry Date:" or "To:"
  match = text.match(/(?:End\s+Date|Expiry\s+Date|To|Tenancy\s+End|Termination\s+Date)[:\s]+([^\n]+)/im);
  if (match) {
    result.endDate = parseDate(match[1].trim());
  }
  
  // Monthly rent — "Monthly Rent:" or "Rent:"
  match = text.match(/(?:Monthly\s+)?Rent(?:al)?[:\s]*RM?\s*([\d,]+\.?\d*)/im);
  if (match) {
    result.monthlyRent = parseAmount(match[1]);
  }
  
  // Due day — "Due Day:" or "payable on or before the Xth day"
  match = text.match(/Due\s+Day[:\s]*(\d{1,2})(?:st|nd|rd|th)?/im);
  if (!match) {
    match = text.match(/payable\s+on\s+or\s+before\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\s+day/im);
  }
  if (!match) {
    match = text.match(/Due\s+(?:Day)[:\s]*(\d{1,2})(?:st|nd|rd|th)?/im);
  }
  if (match) {
    result.dueDay = parseInt(match[1], 10);
  }
  
  // Security deposit — "Security Deposit:" or "Deposit:"
  match = text.match(/(?:Security\s+)?Deposit[:\s]*RM?\s*([\d,]+\.?\d*)/im);
  if (!match) {
    match = text.match(/Deposit[:\s]*RM?\s*([\d,]+\.?\d*)/im);
  }
  if (match) {
    result.securityDeposit = parseAmount(match[1]);
  }
  
  // ═══════════════════════════════════════════════════════════
  // FALLBACK: If Strategy A didn't find enough fields, try Strategy B
  // ═══════════════════════════════════════════════════════════
  
  const strategyAMatchCount = [result.tenantName, result.propertyAddress, result.monthlyRent, result.startDate, result.endDate].filter(f => f !== null).length;
  
  // Also check if this looks like a SCHEDULE format (has "SCHEDULE" keyword or numbered items)
  const isScheduleFormat = /SCHEDULE|Date\s+of\s+Commencement|Reserved\s+Rent|Date\s+of\s+Termination/i.test(text);
  
  if (strategyAMatchCount < 3 || (isScheduleFormat && !result.unitNumber)) {
    // ── Strategy B: Table/SCHEDULE format ──
    
    if (!result.tenantName) {
      match = text.match(/Tenant\s+Name\s*\n\s*NRIC\s*\n\s*\d{6}-\d{4}-\d{4}\s*\n\s*Address\s*\n\s*[^\n]*\s*\n\s*[^\n]*\s*\n\s*([A-Z][A-Z\s]{5,})/i);
      if (!match) match = text.match(/Tenant\s+Name\s*\n\s*\n\s*([A-Z][A-Z\s]{5,})/i);
      if (!match) match = text.match(/Tenant\s+Name[^0-9]*?(?:NRIC[^0-9]*?\d{6}-\d{4}-\d{4})?(?:Address[^0-9]*)?([A-Z][A-Z\s]{5,})/i);
      if (!match) match = text.match(/3\)\s*Tenant\s+Name[^0-9]*?(?:NRIC[^0-9]*?)?([A-Z][A-Z\s\.]+)/i);
      if (match) {
        result.tenantName = match[1].trim().replace(/\s+/g, ' ').toUpperCase();
        const metaWords = 'NRIC|IC|PASSPORT|DATE\\s+OF\\s+BIRTH|BIRTHDATE|ADDRESS|ADDR|NO\\.?|LOT|JALAN|JL|TMN|TAMAN|KOTA|CITY|POSTAL\\s*CODE|POS\\s*KOD|WANGISAN|NAME|BUILDING|BLOCK|STREET';
        result.tenantName = result.tenantName.replace(new RegExp(`\\b(?:${metaWords})\\b`, 'gi'), '');
        result.tenantName = result.tenantName.replace(/\s{2,}/g, ' ').trim();
      }
    }
    
    if (!result.propertyAddress) {
      match = text.match(/Property\s+Address[^0-9]*?([^\n]+)/i);
      if (!match) match = text.match(/4\)\s*Property\s+Address[^0-9]*?([^\n]+)/i);
      if (match) result.propertyAddress = match[1].trim();
    }
    
    if (!result.startDate) {
      match = text.match(/Date\s+of\s+Commencement[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+(?:\s+\d{4})?)/i);
      if (!match) match = text.match(/Commencement[^0-9]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
      if (!match) match = text.match(/Commencement[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z]+\s+\d{4})/i);
      if (match) result.startDate = parseDate(match[1].trim());
    }
    
    if (!result.endDate) {
      match = text.match(/Date\s+of\s+Termination[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+(?:\s+\d{4})?)/i);
      if (!match) match = text.match(/Termination[^0-9]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
      if (!match) match = text.match(/Termination[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z]+\s+\d{4})/i);
      if (match) result.endDate = parseDate(match[1].trim());
    }
    
    if (!result.monthlyRent) {
      match = text.match(/Reserved\s+Rent[^0-9]*?RM\s*([\d,]+\.?\d*)/i);
      if (!match) match = text.match(/per\s+month[^0-9]*?RM\s*([\d,]+\.?\d*)/i);
      if (!match) match = text.match(/Rent[:\s]*RM?\s*([\d,]+\.?\d*)/i);
      if (match) result.monthlyRent = parseAmount(match[1]);
    }
  }
  
  if (!result.tenantName) {
    match = text.match(/Tenant\s+Name\s*\n\s*NRIC\s*\n\s*\d{6}-\d{4}-\d{4}\s*\n\s*Address\s*\n\s*[^\n]*\s*\n\s*[^\n]*\s*\n\s*([A-Z][A-Z\s]{5,})/i);
    if (!match) match = text.match(/Tenant\s+Name\s*\n\s*\n\s*([A-Z][A-Z\s]{5,})/i);
    if (!match) match = text.match(/Tenant\s+Name[^0-9]*?(?:NRIC[^0-9]*?\d{6}-\d{4}-\d{4})?(?:Address[^0-9]*)?([A-Z][A-Z\s]{5,})/i);
    if (!match) match = text.match(/3\)\s*Tenant\s+Name[^0-9]*?(?:NRIC[^0-9]*?)?([A-Z][A-Z\s\.]+)/i);
    if (match) {
      result.tenantName = match[1].trim().replace(/\s+/g, ' ').toUpperCase();
      const metaWords = 'NRIC|IC|PASSPORT|DATE\\s+OF\\s+BIRTH|BIRTHDATE|ADDRESS|ADDR|NO\\.?|LOT|JALAN|JL|TMN|TAMAN|KOTA|CITY|POSTAL\\s*CODE|POS\\s*KOD|WANGISAN|NAME|BUILDING|BLOCK|STREET';
      result.tenantName = result.tenantName.replace(new RegExp(`\\b(?:${metaWords})\\b`, 'gi'), '');
      result.tenantName = result.tenantName.replace(/\s{2,}/g, ' ').trim();
    }
  }
  
  if (!result.propertyAddress) {
    match = text.match(/Property\s+Address[^0-9]*?([^\n]+)/i);
    if (!match) match = text.match(/4\)\s*Property\s+Address[^0-9]*?([^\n]+)/i);
    if (match) result.propertyAddress = match[1].trim();
  }
  
  if (!result.startDate) {
    match = text.match(/Date\s+of\s+Commencement[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+(?:\s+\d{4})?)/i);
    if (!match) match = text.match(/Commencement[^0-9]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (!match) match = text.match(/Commencement[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z]+\s+\d{4})/i);
    if (match) result.startDate = parseDate(match[1].trim());
  }
  
  if (!result.endDate) {
    match = text.match(/Date\s+of\s+Termination[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+(?:\s+\d{4})?)/i);
    if (!match) match = text.match(/Termination[^0-9]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (!match) match = text.match(/Termination[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z]+\s+\d{4})/i);
    if (match) result.endDate = parseDate(match[1].trim());
  }
  
  if (!result.monthlyRent) {
    match = text.match(/Reserved\s+Rent[^0-9]*?RM\s*([\d,]+\.?\d*)/i);
    if (!match) match = text.match(/per\s+month[^0-9]*?RM\s*([\d,]+\.?\d*)/i);
    if (!match) match = text.match(/Rent[:\s]*RM?\s*([\d,]+\.?\d*)/i);
    if (match) result.monthlyRent = parseAmount(match[1]);
  }
  
  // ═══════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════
  
  const keyFields = [result.tenantName, result.propertyAddress, result.monthlyRent, result.startDate, result.endDate];
  const matchedCount = keyFields.filter(f => f !== null).length;
  
  console.log('[Parser] Tenancy match count:', matchedCount, '/', keyFields.length);
  console.log('[Parser] Fields:', JSON.stringify(result));
  
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
