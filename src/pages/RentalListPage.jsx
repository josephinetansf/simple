/**
 * Habita — Rental List Page
 * Phase 4: UI Pages
 *
 * Displays all rental/income records with CRUD operations.
 * Integrates DocumentUploader for OCR-based rental slip upload.
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { getAllRentals, deleteRental } from '../db/queries';
import RentalCard from '../components/RentalCard';
import DocumentUploader from '../components/DocumentUploader';

export default function RentalListPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadRentals();
  }, []);

  async function loadRentals() {
    try {
      setLoading(true);
      const data = await getAllRentals(global.db);
      setRentals(data);
    } catch (err) {
      console.error('[RentalList] Failed to load:', err);
      Alert.alert('Error', 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert(
      'Delete Rental',
      'Are you sure you want to delete this rental record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRental(global.db, id);
              await loadRentals();
              Alert.alert('Success', 'Rental record deleted');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete rental');
            }
          },
        },
      ]
    );
  }

  async function handleExtracted(result) {
    if (result.type === 'rental' && result.data) {
      try {
        const { createRentalFromOCR } = require('../db/queries');
        // result.data contains: amount, paymentDate, periodStart, periodEnd, payerName, tenantName
        // result.documentPath contains the saved file path
        const rentalId = await createRentalFromOCR(
          global.db,
          result.data,
          result.documentPath || null
        );
        setShowUploader(false);
        await loadRentals();
        Alert.alert(
          'Rental Record Created',
          `Successfully recorded payment of RM ${result.data.amount?.toFixed(2) || '0.00'} on ${result.data.paymentDate || 'unknown date'}.`,
          [{ text: 'OK' }]
        );
      } catch (err) {
        console.error('[RentalList] Failed to create rental:', err);
        Alert.alert('Error', `Failed to save rental record: ${err.message}`);
      }
    }
  }

  if (showUploader) {
    return (
      <View style={styles.fullScreen}>
        <TouchableOpacity style={styles.backButton} onPress={() => setShowUploader(false)}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <DocumentUploader
          documentType="rental"
          onExtracted={handleExtracted}
          onCancel={() => setShowUploader(false)}
          label="Upload Payment Slip"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rentals</Text>
        <Text style={styles.count}>{rentals.length} record{rentals.length !== 1 ? 's' : ''}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowUploader(true)}>
          <Text style={styles.addButtonText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading rentals...</Text>
        </View>
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RentalCard
              rental={item}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>No rental records yet</Text>
              <Text style={styles.emptySubtext}>Upload a payment slip to get started</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  count: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
