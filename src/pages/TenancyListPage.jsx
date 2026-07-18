/**
 * Habita — Tenancy List Page
 * Phase 4: UI Pages
 *
 * Displays all tenancy records with CRUD operations.
 * Integrates DocumentUploader for OCR-based tenancy creation.
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllTenancies, deleteTenancy } from '../db/queries';
import TenancyCard from '../components/TenancyCard';
import DocumentUploader from '../components/DocumentUploader';

export default function TenancyListPage() {
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadTenancies();
  }, []);

  async function loadTenancies() {
    try {
      setLoading(true);
      const data = await getAllTenancies(global.db);
      setTenancies(data);
    } catch (err) {
      console.error('[TenancyList] Failed to load:', err);
      Alert.alert('Error', 'Failed to load tenancies');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert(
      'Delete Tenancy',
      'Are you sure you want to delete this tenancy? This will also remove associated rentals.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTenancy(global.db, id);
              await loadTenancies();
              Alert.alert('Success', 'Tenancy deleted');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete tenancy');
            }
          },
        },
      ]
    );
  }

  async function handleExtracted(result) {
    if (result.type === 'tenancy' && result.data) {
      try {
        const { createTenancyFromOCR } = require('../db/queries');
        // result.result.data contains: tenantName, propertyAddress, unitNumber, startDate, endDate, monthlyRent, dueDay
        // result.result.documentPath contains the saved file path
        const tenancyId = await createTenancyFromOCR(
          global.db,
          result.data,
          result.documentPath || null
        );
        setShowUploader(false);
        await loadTenancies();
        Alert.alert(
          'Tenancy Created',
          `Successfully created tenancy for ${result.data.tenantName || 'Unknown'} at ${result.data.propertyAddress || 'Unknown'} property.`,
          [{ text: 'OK' }]
        );
      } catch (err) {
        console.error('[TenancyList] Failed to create tenancy:', err);
        Alert.alert('Error', `Failed to save tenancy: ${err.message}`);
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
          documentType="tenancy"
          onExtracted={handleExtracted}
          onCancel={() => setShowUploader(false)}
          label="Upload Tenancy Agreement"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tenancies</Text>
          <Text style={styles.count}>{tenancies.length} record{tenancies.length !== 1 ? 's' : ''}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowUploader(true)}>
            <Text style={styles.addButtonText}>+ Upload</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading tenancies...</Text>
          </View>
        ) : (
          <FlatList
            data={tenancies}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TenancyCard
                tenancy={item}
                onDelete={() => handleDelete(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏠</Text>
                <Text style={styles.emptyText}>No tenancies yet</Text>
                <Text style={styles.emptySubtext}>Upload a tenancy agreement to get started</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  safeArea: {
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
