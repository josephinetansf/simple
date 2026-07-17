/**
 * Habita — OCR Processing Hook
 * Phase 3: OCR Pipeline
 *
 * React hook that orchestrates the full OCR workflow:
 * 1. Pick document via expo-image-picker
 * 2. Save file to persistent storage
 * 3. Run OCR text extraction
 * 4. Parse extracted text into structured data
 * 5. Return result to caller
 *
 * Usage:
 *   const { status, result, pickDocument, reset } = useOCR();
 *   // status: 'idle' | 'picking' | 'saving' | 'processing' | 'success' | 'error'
 *   // result: { type: 'tenancy'|'rental'|'expense', data: {...} } | null
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { extractText } from '../ocr/mlkit';
import { detectAndParse, parseTenancyAgreement, parseRentalSlip, parseExpenseBill } from '../ocr/parsers';
import { saveUploadedDocument } from '../storage/fileManager';

/**
 * Custom hook for OCR document processing.
 * 
 * @returns {{
 *   status: string,
 *   result: object|null,
 *   error: string|null,
 *   progress: number,
 *   pickDocument: (type?: string) => Promise<void>,
 *   reset: () => void
 * }}
 */
export function useOCR() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  /**
   * Main workflow: pick → save → OCR → parse
   * @param {string} [documentType] - Hint for parser ('tenancy', 'rental', 'expense')
   */
  const pickDocument = useCallback(async (documentType) => {
    let pickerResult;
    
    try {
      // Step 1: Pick image
      setStatus('picking');
      setProgress(10);
      
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false, // Don't load base64 for large images
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        setStatus('idle');
        return;
      }

      const asset = pickerResult.assets[0];
      
      // Step 2: Save to persistent storage
      setStatus('saving');
      setProgress(30);
      
      const fileName = `ocr_${Date.now()}.jpg`;
      const savedPath = await saveUploadedDocument(asset.uri, fileName);
      
      // Step 3: OCR text extraction
      setStatus('processing');
      setProgress(50);
      
      const extractedText = await extractText(savedPath);
      setProgress(80);
      
      if (!extractedText || extractedText.trim().length === 0) {
        setError('No text found in document. Please try a clearer image.');
        setStatus('error');
        return;
      }
      
      // Step 4: Parse extracted text
      let parsedData;
      
      if (documentType) {
        // Use specific parser based on hint
        switch (documentType) {
          case 'tenancy': {
            const tenancyData = parseTenancyAgreement(extractedText);
            parsedData = tenancyData ? { type: 'tenancy', data: tenancyData } : null;
            break;
          }
          case 'rental': {
            const rentalData = parseRentalSlip(extractedText);
            parsedData = rentalData ? { type: 'rental', data: rentalData } : null;
            break;
          }
          case 'expense': {
            const expenseData = parseExpenseBill(extractedText);
            parsedData = expenseData ? { type: 'expense', data: expenseData } : null;
            break;
          }
          default:
            parsedData = detectAndParse(extractedText);
        }
      } else {
        // Auto-detect document type
        parsedData = detectAndParse(extractedText);
      }
      
      setProgress(100);
      
      if (!parsedData) {
        setError('Could not parse document. Please enter details manually.');
        setStatus('error');
        return;
      }
      
      // Success!
      setResult({ ...parsedData, documentPath: savedPath });
      setStatus('success');
      setError(null);
      
    } catch (err) {
      console.error('[useOCR] Processing failed:', err);
      setError(err.message || 'OCR processing failed');
      setStatus('error');
    }
  }, []);

  /**
   * Reset hook state to initial values.
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    status,
    result,
    error,
    progress,
    pickDocument,
    reset,
  };
}
