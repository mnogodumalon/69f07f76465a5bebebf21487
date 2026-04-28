import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Stammdaten, Angebotsanfrage } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [stammdaten, setStammdaten] = useState<Stammdaten[]>([]);
  const [angebotsanfrage, setAngebotsanfrage] = useState<Angebotsanfrage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [stammdatenData, angebotsanfrageData] = await Promise.all([
        LivingAppsService.getStammdaten(),
        LivingAppsService.getAngebotsanfrage(),
      ]);
      setStammdaten(stammdatenData);
      setAngebotsanfrage(angebotsanfrageData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [stammdatenData, angebotsanfrageData] = await Promise.all([
          LivingAppsService.getStammdaten(),
          LivingAppsService.getAngebotsanfrage(),
        ]);
        setStammdaten(stammdatenData);
        setAngebotsanfrage(angebotsanfrageData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const stammdatenMap = useMemo(() => {
    const m = new Map<string, Stammdaten>();
    stammdaten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [stammdaten]);

  return { stammdaten, setStammdaten, angebotsanfrage, setAngebotsanfrage, loading, error, fetchAll, stammdatenMap };
}