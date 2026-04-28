// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Stammdaten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kunden_csv?: string;
    ansprechpartner_csv?: string;
    artikel_csv?: string;
    bezeichnung?: string;
    stand_datum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Angebotsanfrage {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    stammdaten_ref?: string; // applookup -> URL zu 'Stammdaten' Record
    anfrage_pdf?: string;
    ergebnis_json?: string;
    notizen?: string;
  };
}

export const APP_IDS = {
  STAMMDATEN: '69f07f61282730cf2b912ea7',
  ANGEBOTSANFRAGE: '69f07f65d4576b77d41e08cc',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'stammdaten': {
    'kunden_csv': 'string/textarea',
    'ansprechpartner_csv': 'string/textarea',
    'artikel_csv': 'string/textarea',
    'bezeichnung': 'string/text',
    'stand_datum': 'date/date',
  },
  'angebotsanfrage': {
    'stammdaten_ref': 'applookup/select',
    'anfrage_pdf': 'file',
    'ergebnis_json': 'string/textarea',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateStammdaten = StripLookup<Stammdaten['fields']>;
export type CreateAngebotsanfrage = StripLookup<Angebotsanfrage['fields']>;