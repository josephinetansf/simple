/**
 * Habita — Expense Card Component
 * Phase 4: UI Pages
 *
 * Displays a single expense record with key details.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ExpenseCard({ expense, onDelete }) {
  const {
    title,
    category,
    amount,
    payment_date,
    status,
    receipt_path,
  } = expense;

  const statusColors = {
    paid: '#10b981',
    unpaid: '#ef4444',
    pending: '#f59e0b',
  };

  const displayStatus = status || 'unpaid';
  const badgeColor = statusColors[displayStatus] || '#ef4444';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            {receipt_path && <Text style={styles.receiptIcon}>📎</Text>}
            <Text style={styles.title}>{title || 'Untitled Expense'}</Text>
          </View>
          <Text style={styles.categoryText}>{category || 'Uncategorized'}</Text>
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>RM {amount?.toFixed(2) || '0.00'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.statusText}>{displayStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.dateText}>
          {payment_date ? `Paid: ${payment_date}` : 'No payment date recorded'}
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mainInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  receiptIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
});
