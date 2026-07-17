/**
 * Habita — Tenancy Card Component
 * Phase 4: UI Pages
 *
 * Displays a single tenancy record with key details.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TenancyCard({ tenancy, onDelete }) {
  const {
    tenant_name,
    property_name,
    unit_number,
    rental_amount,
    start_date,
    end_date,
    due_day,
  } = tenancy;

  // Calculate status
  const today = new Date().toISOString().split('T')[0];
  const isActive = end_date >= today;
  const status = isActive ? 'Active' : 'Expired';
  const statusColor = isActive ? '#10b981' : '#9ca3af';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.mainInfo}>
          <Text style={styles.tenantName}>{tenant_name || 'Unknown Tenant'}</Text>
          <Text style={styles.propertyInfo}>
            {property_name || 'Unknown Property'}{unit_number ? ` • Unit ${unit_number}` : ''}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <DetailItem label="Rent" value={`RM ${rental_amount?.toFixed(2) || '0.00'}`} />
        <DetailItem label="Due" value={`Day ${due_day || '-'}`} />
        <DetailItem label="Ends" value={end_date || '-'} />
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Small detail item component.
 */
function DetailItem({ label, value }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    marginBottom: 12,
  },
  mainInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  propertyInfo: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
});
