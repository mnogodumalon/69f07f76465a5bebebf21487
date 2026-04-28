import type { Angebotsanfrage } from './app';

export type EnrichedAngebotsanfrage = Angebotsanfrage & {
  stammdaten_refName: string;
};
