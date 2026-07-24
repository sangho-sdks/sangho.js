// =============================================================================
// sangho-sdk-js — Point d'entrée public
// N'exporte que ce qui est utile à l'intégrateur.
// =============================================================================

// ─── Client principal ─────────────────────────────────────────────────────────
export { Sangho } from "./client";
export { Sangho as default } from "./client";

// ─── Erreurs (pour les catch typés) ──────────────────────────────────────────
export {
  SanghoError,
  SanghoAuthError,
  SanghoPublicKeyError,
  SanghoPermissionError,
  SanghoNotFoundError,
  SanghoValidationError,
  SanghoRateLimitError,
  SanghoIdempotencyError,
  SanghoNetworkError,
  SanghoTimeoutError,
} from "./core/errors";
export type { SanghoErrorType, SanghoErrorResponse } from "./core/errors";

// ─── Types communs ────────────────────────────────────────────────────────────
export type {
  ListParams,
  ListResponse,
  Timestamps,
  AmountInCents,
  CurrencyCode,
  Address,
  Metadata,
  SanghoOptions,
} from "./types/common";

// ─── Types de ressources ──────────────────────────────────────────────────────
export type { App, AppKey, AppKeys } from "./types/resources/apps";
export type { SandboxResetResult } from "./types/resources/sandbox";
export type { Customer } from "./types/resources/customers";
export type {
  Product,
  ProductImage
} from "./types/resources/products";
export type {
  PaymentIntent
} from "./types/resources/payment-intents";
export type {
  Transaction
} from "./types/resources/transactions";
export type {
  Refund
} from "./types/resources/refunds";
export type {
  Invoice
} from "./types/resources/invoices";
export type {
  PaymentLink
} from "./types/resources/payment-links";
export type {
  CheckoutSession
} from "./types/resources/checkout-sessions";
export type {
  Subscription
} from "./types/resources/subscriptions";
export type {
  PaymentMethod
} from "./types/resources/payment-methods";
export type {
  Receipt
} from "./types/resources/receipts";
export type {
  Webhook,
  WebhookDelivery
} from "./types/resources/webhooks";
export type {
  SecurityProfile,
  UpdateSecurityProfileParams
} from "./types/resources/security";
export type {
  Partner
} from "./types/resources/partners";

// ─── Utilitaires ─────────────────────────────────────────────────────────────
export { constructEvent } from "./utils/webhook";
