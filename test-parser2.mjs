import { parseTenancyAgreement } from './src/ocr/parsers.js';

const ocrText = `TENANCY AGREEMENT

This Agreement is made on 15th day of January 2026

BETWEEN:

Landlord: Mr. Ahmad bin Ali
IC No.: 850101-01-1234

AND

Tenant: Ms. Sarah Tan
IC No.: 900505-05-5678

PROPERTY DETAILS:
Unit No: 01-01
Building: Vina Residence
Address: 123 Jalan Tun Razak, 50400 Kuala Lumpur

TENANCY PERIOD:
Start Date: 01/01/2026
End Date: 31/12/2027

RENTAL TERMS:
Monthly Rent: RM 1,200.00
Due Day: 5th of each month
Security Deposit: RM 2,400.00 (2 months)
Deposit for Utility: RM 1,000.00

PAYMENT METHOD:
Bank Transfer to:
Bank: Maybank
Account: 1234-5678-9010
Name: Ahmad bin Ali

TERMS AND CONDITIONS:
1. Tenant shall pay rent on or before the 5th day of each month
2. Late payment incurs 10% penalty per month
3. Tenant must maintain the premises in good condition
4. Subletting is not permitted without landlord consent
5. This agreement may be terminated with 2 months notice`;

const result = parseTenancyAgreement(ocrText);
console.log('\n=== PARSED RESULT ===');
console.log(JSON.stringify(result, null, 2));
