import type { ListParams, Metadata, Timestamps } from "@/types/common";
import type { ConnectAccount, ConnectPayment, ConnectPayout } from "@/types/resources/connect";

export type WebhookEventType =
  | "payment_intent.created" | "payment_intent.succeeded"
  | "payment_intent.payment_failed" | "payment_intent.canceled"
  | "payment_intent.requires_action"
  | "transaction.created" | "transaction.succeeded"
  | "transaction.failed" | "transaction.refunded"
  | "customer.created" | "customer.updated" | "customer.deleted"
  | "invoice.created" | "invoice.paid"
  | "invoice.payment_failed" | "invoice.voided"
  | "subscription.created" | "subscription.updated"
  | "subscription.canceled" | "subscription.trial_ending"
  | "refund.created" | "refund.updated" | "refund.failed"
  | "checkout.session.completed" | "checkout.session.expired"
  | "payout.created" | "payout.paid" | "payout.failed"
  | "account.updated" | "kyc.updated"
  | "account.verified" | "account.restricted"
  | "payment.succeeded" | "payment.failed"
  | "funds.released" | "funds.frozen" | "funds.unfrozen"
  | "refund.succeeded" | "clawback.succeeded";

/** Enveloppe d'un événement reçu (objet de l'événement dans `data.object`). */
export interface WebhookEventEnvelope<TType extends string, TObject> {
  id: string;
  object: "event";
  api_version?: string;
  type: TType;
  /** Timestamp Unix (secondes). */
  created: number;
  livemode?: boolean;
  data: { object: TObject };
}

/** Compte Connect modifié (statut ou capacités). */
export type AccountUpdatedEvent = WebhookEventEnvelope<"account.updated", ConnectAccount>;
/** Résultat du KYC d'un compte Connect (`kyc_level`, `charges_enabled`, `payouts_enabled` à jour). */
export type KycUpdatedEvent = WebhookEventEnvelope<"kyc.updated", ConnectAccount>;

/** Compte devenu capable d'encaisser (KYC validé) / ayant perdu cette capacité (KYC rejeté, suspension). */
export type AccountVerifiedEvent = WebhookEventEnvelope<"account.verified", ConnectAccount>;
export type AccountRestrictedEvent = WebhookEventEnvelope<"account.restricted", ConnectAccount>;
/** Encaissement d'un paiement Connect (répartition inscrite au registre) / échec ou expiration (répartition annulée). */
export type PaymentSucceededEvent = WebhookEventEnvelope<"payment.succeeded", ConnectPayment>;
export type PaymentFailedEvent = WebhookEventEnvelope<"payment.failed", ConnectPayment>;
/** Fonds libérés / gelés / dégelés (`data.object` = paiement Connect à jour). */
export type FundsReleasedEvent = WebhookEventEnvelope<"funds.released", ConnectPayment>;
export type FundsFrozenEvent = WebhookEventEnvelope<"funds.frozen", ConnectPayment>;
export type FundsUnfrozenEvent = WebhookEventEnvelope<"funds.unfrozen", ConnectPayment>;
/** Remboursement exécuté ; `clawback.succeeded` = reprise des frais déjà versés au vendeur (son disponible peut devenir négatif). */
export type ConnectRefundSucceededEvent = WebhookEventEnvelope<"refund.succeeded", ConnectPayment>;
export type ClawbackSucceededEvent = WebhookEventEnvelope<"clawback.succeeded", ConnectPayment>;
/** Retrait versé / échoué (`data.object` = retrait). */
export type PayoutPaidEvent = WebhookEventEnvelope<"payout.paid", ConnectPayout>;
export type PayoutFailedEvent = WebhookEventEnvelope<"payout.failed", ConnectPayout>;

type TypedEventType =
  | "account.updated" | "kyc.updated" | "account.verified" | "account.restricted"
  | "payment.succeeded" | "payment.failed" | "funds.released" | "funds.frozen" | "funds.unfrozen"
  | "refund.succeeded" | "clawback.succeeded" | "payout.paid" | "payout.failed";

/**
 * Union discriminée sur `type` : les événements Connect sont typés ; les autres restent génériques (`data.object: unknown`)
 * en attendant leur typage.
 */
export type WebhookEvent =
  | AccountUpdatedEvent
  | KycUpdatedEvent
  | AccountVerifiedEvent
  | AccountRestrictedEvent
  | PaymentSucceededEvent
  | PaymentFailedEvent
  | FundsReleasedEvent
  | FundsFrozenEvent
  | FundsUnfrozenEvent
  | ConnectRefundSucceededEvent
  | ClawbackSucceededEvent
  | PayoutPaidEvent
  | PayoutFailedEvent
  | WebhookEventEnvelope<Exclude<WebhookEventType, TypedEventType>, unknown>;

export type WebhookStatus = "ACTIVE" | "INACTIVE" | "DISABLED";
export type WebhookSecurityProfile = "HMAC_SHA256" | "JWT" | "BASIC";
export type DeliveryStatus = "pending" | "delivered" | "failed" | "retrying";

export interface WebhookRetryPolicy {
  max_attempts: number;
  backoff_type: "linear" | "exponential";
  initial_delay_seconds: number;
}

/** Représente un webhook Sangho. Préfixe : `wh_xxx` */
export interface Webhook extends Timestamps {
  id: string;
  object: "webhook";
  app: string;
  name: string;
  url: string;
  status: WebhookStatus;
  events: WebhookEventType[];
  security_profile: WebhookSecurityProfile;
  secret_preview: string;       // jamais la valeur complète
  ssl_verification: boolean;
  retry_policy: WebhookRetryPolicy;
  rate_limit: number;
  timeout: number;
  failure_count: number;
  last_delivery_at?: string | null;
  metadata: Metadata;
}

export interface WebhookDelivery extends Timestamps {
  id: string;
  object: "webhook_delivery";
  webhook: string;
  event_type: WebhookEventType | "webhook.test";
  url: string;
  status: DeliveryStatus;
  http_status?: number | null;
  is_successful: boolean;
  attempts: number;
  next_retry_at?: string | null;
  response_body?: string | null;
  response_time_ms?: number | null;
  delivered_at?: string | null;
  metadata: Metadata;
}

/** Champs POST */
export interface CreatePayloads {
  name: string;
  url: string;
  events: WebhookEventType[];
  security_profile?: WebhookSecurityProfile;
  ssl_verification?: boolean;
  retry_policy?: Partial<WebhookRetryPolicy>;
  rate_limit?: number;
  timeout?: number;
  metadata?: Metadata;
}

/** Champs PATCH */
export interface Payloads {
  name?: string;
  url?: string;
  events?: WebhookEventType[];
  status?: WebhookStatus;
  security_profile?: WebhookSecurityProfile;
  ssl_verification?: boolean;
  retry_policy?: Partial<WebhookRetryPolicy>;
  rate_limit?: number;
  timeout?: number;
  metadata?: Metadata;
}

/** Filtres GET /webhooks/ */
export interface WebhookCriteria extends ListParams {
  status?: WebhookStatus;
}

/** Filtres GET /webhooks/:id/deliveries/ */
export interface DeliveryCriteria extends ListParams {
  event_type?: WebhookEventType;
  status?: DeliveryStatus;
}