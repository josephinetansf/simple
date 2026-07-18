import { parseTenancyAgreement } from './src/ocr/parsers.js';

const sampleText = `C-22-21 Residensi Vista Wirajaya 2

SCHEDULE
(which is to be taken and construed as an essential and integral part of this agreement)

1) Date of Agreement    27TH AUGUST 2025

2) Landlord Name
   NRIC
   Address
   PUBLIC BANK
   JOSEPHINE TAN SIANG FEI
   840622-13-5164
   288 RESIDENCY, JALAN SEMARAK API 4, SETAPAK
   53300 KUALA LUMPUR
   6451181836

3) Tenant Name
   NRIC
   Address
   WINCENT ONG KAI ZHEN
   040326-02-0607
   57, TAMAN SELAYANG, JLN SULTANAH BAHIYAH
   05350 ALOR SETAR KEDAH

4) Property Address
   C-22-21, Residensi Vista Wirajaya 2, No. 26, Jalan Tumbuhan, Taman Melati, Setapak, 53300 KL
   SMALL ROOM

5) Duration OF TENANCY
   ONE (1) YEAR

6) Date of Commencement
   01ST NOVEMBER 2025

7) Date of Termination
   31ST OCTOBER 2026

8) Reserved Rent
   RM 450.00 per month
   (Ringgit Malaysia FOUR HUNDRED and FIFTY Only)
   The Rental shall be payable in advance on or before the COMMENCEMENT day of each and every succeeding month.

9) Deposits
   a) Security
   RM 1,125.00 for TWO AND A HALF (2.5) months
   (Ringgit Malaysia ONE THOUSAND ONE HUNDRED and TWENTY FIVE Only)
   b) Access Card
   RM 100.00
   (Ringgit Malaysia ONE HUNDRED Only)
   THESE DEPOSITS SHALL NOT BE USED TO OFFSET WITH ANY OUTSTANDING MONTHLY RENT

10) Purpose of Property
    RESIDENTIAL

11) Option of Renewal
    ONE (1) YEAR`;

const result = parseTenancyAgreement(sampleText);
console.log('Parsed result:', JSON.stringify(result, null, 2));
