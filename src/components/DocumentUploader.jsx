/**
 * Habita — Document Uploader Component
 * Phase 3: OCR Pipeline
 *
 * Reusable UI component for uploading documents via image picker,
 * processing with OCR, and displaying extracted fields.
 *
 * Props:
 * - documentType: 'tenancy' | 'rental' | 'expense' | null (auto-detect)
 * - onExtracted: callback(result) when parsing succeeds
 * - onError: callback(error) when processing fails
 * - onCancel: callback when user cancels
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useOCR } from '../hooks/useOCR';

/**
 * DocumentUploader component.
 * 
 * @param {object} props
 * @param {'tenancy'|'rental'|'expense'|null} props.documentType - Hint for parser
 * @param {function} props.onExtracted - Called with parsed data on success
 * @param {function} props.onError - Called with error message on failure
 * @param {function} props.onCancel - Called when user cancels
 * @param {string} [props.label='Upload Document'] - Button label
 */
export default function DocumentUploader({
  documentType = null,
  onExtracted,
  onError,
  onCancel,
  label = 'Upload Document',
}) {
  const { status, result, error, progress, pickDocument, reset } = useOCR();
  const [selectedImage, setSelectedImage] = useState(null);

  const handlePick = async () => {
    reset();
    await pickDocument(documentType);
  };

  // Handle successful extraction
  React.useEffect(() => {
    if (status === 'success' && result) {
      // Show preview of extracted data
      setSelectedImage(null); // Clear any cached image
      onExtracted?.(result);
    }
  }, [status, result]);

  // Handle error
  React.useEffect(() => {
    if (status === 'error' && error) {
      Alert.alert(
        'Processing Error',
        error,
        [
          { text: 'Try Again', onPress: handlePick },
          { text: 'Cancel', onPress: () => { onCancel?.(); reset(); } },
        ]
      );
    }
  }, [status, error]);

  // Render based on status
  if (status === 'picking' || status === 'saving' || status === 'processing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1a1a2e" />
        <Text style={styles.processingText}>
          {status === 'picking' && 'Selecting document...'}
          {status === 'saving' && 'Saving document...'}
          {status === 'processing' && 'Processing with OCR...'}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => { onCancel?.(); reset(); }}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'success' && result) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>✓ Document Processed</Text>
          <Text style={styles.documentType}>
            Type: {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
          </Text>
          
          <View style={styles.fieldsContainer}>
            {renderFields(result.data, result.type)}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.confirmButton} onPress={() => onExtracted?.(result)}>
              <Text style={styles.confirmButtonText}>Confirm & Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardButton} onPress={() => { reset(); onCancel?.(); }}>
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Default: show upload button
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadButton} onPress={handlePick}>
        <Text style={styles.uploadIcon}>📄</Text>
        <Text style={styles.uploadText}>{label}</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Supported: JPG, PNG (tenancy agreements, payment slips, bills)
      </Text>
    </View>
  );
}

/**
 * Render extracted fields based on document type.
 */
function renderFields(data, type) {
  const fields = [];

  if (type === 'tenancy') {
    if (data.tenantName) fields.push({ label: 'Tenant', value: data.tenantName });
    if (data.propertyAddress) fields.push({ label: 'Property', value: data.propertyAddress });
    if (data.unitNumber) fields.push({ label: 'Unit', value: data.unitNumber });
    if (data.startDate) fields.push({ label: 'Start Date', value: data.startDate });
    if (data.endDate) fields.push({ label: 'End Date', value: data.endDate });
    if (data.monthlyRent) fields.push({ label: 'Monthly Rent', value: `RM ${data.monthlyRent.toFixed(2)}` });
    if (data.dueDay) fields.push({ label: 'Due Day', value: `Day ${data.dueDay}` });
    if (data.securityDeposit) fields.push({ label: 'Security Deposit', value: `RM ${data.securityDeposit.toFixed(2)}` });
  } else if (type === 'rental') {
    if (data.payerName) fields.push({ label: 'Payer', value: data.payerName });
    if (data.amount) fields.push({ label: 'Amount', value: `RM ${data.amount.toFixed(2)}` });
    if (data.paymentDate) fields.push({ label: 'Payment Date', value: data.paymentDate });
    if (data.periodStart) fields.push({ label: 'Period From', value: data.periodStart });
    if (data.periodEnd) fields.push({ label: 'Period To', value: data.periodEnd });
    if (data.referenceNumber) fields.push({ label: 'Reference', value: data.referenceNumber });
  } else if (type === 'expense') {
    if (data.vendor) fields.push({ label: 'Vendor', value: data.vendor });
    if (data.category) fields.push({ label: 'Category', value: data.category });
    if (data.amount) fields.push({ label: 'Amount', value: `RM ${data.amount.toFixed(2)}` });
    if (data.date) fields.push({ label: 'Date', value: data.date });
    if (data.description) fields.push({ label: 'Description', value: data.description });
  }

  return fields.map((field, index) => (
    <View key={index} style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{field.label}:</Text>
      <Text style={styles.fieldValue}>{field.value}</Text>
    </View>
  ));
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#1a1a2e',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a1a2e',
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  successCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 12,
  },
  fieldsContainer: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  discardButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    alignItems: 'center',
  },
  discardButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
