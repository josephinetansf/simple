/**
 * Habita — Database Hook
 * Phase 2: Database Layer
 *
 * React hook that initializes the database on mount
 * and exposes the db instance to components.
 */

import { useState, useEffect } from 'react';

import { initializeDatabase, getDb, isDatabaseReady, getDatabaseError } from '../db/database';

/**
 * Custom hook to initialize and access the database.
 *
 * @returns {{ db: object | null, ready: boolean, error: Error | null }}
 */
export function useDb() {
  const [db, setDb] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeDatabase();
        if (mounted) {
          setDb(getDb());
          setReady(isDatabaseReady());
          setError(getDatabaseError());
        }
      } catch (err) {
        if (mounted) {
          setReady(false);
          setError(err);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { db, ready, error };
}
