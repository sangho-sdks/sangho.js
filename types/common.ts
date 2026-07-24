// =============================================================================
// sangho-sdk-js — Types communs
// =============================================================================

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface ListParams {
  /** Numéro de page (défaut : 1) */
  page?: number;
  /** Nombre d'éléments par page (défaut : 20, max : 100) */
  page_size?: number;
  /** Tri ex: "-created_at" (préfixe - pour DESC) */
  ordering?: string;
  /** Recherche full-text */
  search?: string;
}

export interface ListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

// ─── Timestamps ───────────────────────────────────────────────────────────────

export interface Timestamps {
  created_at: string; // ISO 8601
  updated_at: string;
}

// ─── Monnaie ──────────────────────────────────────────────────────────────────

/** Montant monétaire exprimé en centimes (integer). Ex: 5000 = 50.00 XAF */
export type AmountInCents = number;

/**
 * Codes ISO 4217 actifs acceptés au niveau du *type* par le SDK.
 *
 * Important : cette liste ne représente que la validité ISO 4217 générale,
 * PAS ce qu'un marchand donné a le droit d'utiliser. Sangho facture/entitle
 * les devises par plan — un marchand ne peut utiliser à l'exécution que le
 * sous-ensemble de devises inclus dans son plan (ou activé en backoffice).
 * Utiliser une devise valide ISO 4217 mais hors plan est un problème
 * *runtime*, tranché par le backend, qui répond avec une `SanghoError` dont
 * `.code` vaut `CURRENCY_NOT_IN_PLAN` (ou `INVALID_CURRENCY` si le code
 * n'est même pas un ISO 4217 reconnu) — voir `core/errors.ts`. Le SDK ne
 * peut pas connaître statiquement le plan d'un marchand donné : il n'essaie
 * donc pas d'imposer cette restriction au niveau des types, seulement la
 * validité ISO 4217 elle-même.
 */
export const ISO_4217_CURRENCIES = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD",
  "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CUP", "CVE", "CZK",
  "DJF", "DKK", "DOP", "DZD",
  "EGP", "ERN", "ETB", "EUR",
  "FJD", "FKP",
  "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD",
  "HKD", "HNL", "HTG", "HUF",
  "IDR", "ILS", "INR", "IQD", "IRR", "ISK",
  "JMD", "JOD", "JPY",
  "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT",
  "LAK", "LBP", "LKR", "LRD", "LSL", "LYD",
  "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN",
  "NAD", "NGN", "NIO", "NOK", "NPR", "NZD",
  "OMR",
  "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG",
  "QAR",
  "RON", "RSD", "RUB", "RWF",
  "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SOS", "SRD", "SSP", "STN", "SYP", "SZL",
  "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS",
  "UAH", "UGX", "USD", "UYU", "UZS",
  "VES", "VND", "VUV",
  "WST",
  "XAF", "XCD", "XOF", "XPF",
  "YER",
  "ZAR", "ZMW", "ZWL",
] as const;

/**
 * Devise ISO 4217 valide (union dérivée de `ISO_4217_CURRENCIES` — source
 * de vérité unique). Ne préjuge pas de ce qu'un marchand a le droit
 * d'utiliser : voir la note sur `ISO_4217_CURRENCIES` ci-dessus.
 */
export type CurrencyCode = (typeof ISO_4217_CURRENCIES)[number];

// ─── Statuts génériques ───────────────────────────────────────────────────────

export type ActiveStatus = "active" | "inactive";
export type SandboxMode = "live" | "test";

// ─── Métadonnées libres ───────────────────────────────────────────────────────

/** Dictionnaire clé/valeur libre, max 50 clés, valeurs string. */
export type Metadata = Record<string, string>;

// ─── Adresse ──────────────────────────────────────────────────────────────────

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string; // code ISO 3166-1 alpha-2
}

// ─── Options SDK ──────────────────────────────────────────────────────────────

export interface SanghoOptions {
  /** Override URL de base (utile pour tests/staging) */
  baseURL?: string;
  /** Timeout en ms (défaut : 30 000) */
  timeout?: number;
  /** Nombre de retries auto (défaut : 3) */
  maxRetries?: number;
}

/**
 * A utility type for creating class property interfaces that don't overwrite 
 * actual implementation values when used as type definitions
 */
export type InterfaceOnly<T> = {
  [P in keyof T]?: T[P];
}


export interface DRFOptions {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions?: Record<string, unknown>;
}

export type ForeignKey = string | number | null;