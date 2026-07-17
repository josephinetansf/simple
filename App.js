import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { initializeDatabase, getDb } from './src/db/database';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Habita — Tenancy/Rental/Expense Manager
 * Phase 4: UI Pages Implemented
 *
 * Navigation: Dashboard | Tenancies | Rentals | Expenses
 */

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    async function initDb() {
      try {
        await initializeDatabase();
        // Store database globally for pages to access
        global.db = getDb();
        setDbReady(true);
      } catch (err) {
        console.error('[App] Database initialization failed:', err);
        setDbError(err.message || 'Unknown error');
      }
    }
    initDb();
  }, []);

  if (dbError) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorMessage}>{dbError}</Text>
        <Text style={styles.version}>v1.4.0 — Phase 4: UI Pages</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1a1a2e" />
        <Text style={styles.version}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorContainer: {
    borderColor: '#e74c3c',
    borderWidth: 2,
    borderRadius: 8,
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  version: {
    fontSize: 12,
    color: '#666',
    marginTop: 24,
  },
});
