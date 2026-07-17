/**
 * Habita — Expense List Page
 * Phase 4: UI Pages
 *
 * Displays all expense records with CRUD operations.
 * Integrates DocumentUploader for OCR-based expense bill upload.
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { getAllExpenses, deleteExpense } from '../db/queries';
import ExpenseCard from '../components/ExpenseCard';
import DocumentUploader from '../components/DocumentUploader';

export default function ExpenseListPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      const data = await getAllExpenses(global.db);
      setExpenses(data);
    } catch (err) {
      console.error('[ExpenseList] Failed to load:', err);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(global.db, id);
              await loadExpenses();
              Alert.alert('Success', 'Expense deleted');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  }

  async function handleExtracted(result) {
    if (result.type === 'expense' && result.data) {
      try {
        const { createExpenseFromOCR } = require('../db/queries');
        // result.data contains: amount, paymentDate, category, vendor, propertyName
        // result.documentPath contains the saved file path
        const expenseId = await createExpenseFromOCR(
          global.db,
          result.data,
          result.documentPath || null
        );
        setShowUploader(false);
        await loadExpenses();
        Alert.alert(
          'Expense Record Created',
          `${result.data.category || 'Expense'}: RM ${result.data.amount?.toFixed(2) || '0.00'} from ${result.data.vendor || 'unknown vendor'}`,
          [{ text: 'OK' }]
        );
      } catch (err) {
        console.error('[ExpenseList] Failed to create expense:', err);
        Alert.alert('Error', `Failed to save expense record: ${err.message}`);
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
          documentType="expense"
          onExtracted={handleExtracted}
          onCancel={() => setShowUploader(false)}
          label="Upload Expense Bill"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.count}>{expenses.length} record{expenses.length !== 1 ? 's' : ''}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowUploader(true)}>
          <Text style={styles.addButtonText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Upload a bill to track expenses</Text>
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
