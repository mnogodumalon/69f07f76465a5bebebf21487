import type { EnrichedAngebotsanfrage } from '@/types/enriched';
import type { Angebotsanfrage, Stammdaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AngebotsanfrageMaps {
  stammdatenMap: Map<string, Stammdaten>;
}

export function enrichAngebotsanfrage(
  angebotsanfrage: Angebotsanfrage[],
  maps: AngebotsanfrageMaps
): EnrichedAngebotsanfrage[] {
  return angebotsanfrage.map(r => ({
    ...r,
    stammdaten_refName: resolveDisplay(r.fields.stammdaten_ref, maps.stammdatenMap, 'bezeichnung'),
  }));
}
