import type {
  AmountInCents,
  CurrencyCode,
  ListParams,
  Metadata,
  Timestamps,
} from "@/types/common";

export type PaymentIntentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "pending"
  | "processing"
  | "requires_capture"
  | "canceled"
  | "succeeded";

export type CancellationReason =
  | "duplicate"
  | "fraudulent"
  | "requested_by_customer"
  | "abandoned";

/**
 * Représente un PaymentIntent Sangho.
 * Préfixe d'identifiant : `pi_xxx`
 * Expand disponibles : `?expand=customer`, `?expand=payment_link`
 */
export interface PaymentIntent extends Timestamps {
  id: string;
  object: "payment_intent";
  reference: string;              // UUID unique, read-only
  customer_email?: string | null;
  customer?: object | null;       // injecté par to_representation() ou ?expand=customer
  currency: CurrencyCode;
  amount: number;                 // Decimal converti par le serializer
  status: PaymentIntentStatus;
  description?: string | null;
  payment_method?: string | null;
  payment_method_types: string[]; // ex: ["mobile_money", "card"]
  category?: string | null;       // ex: "product", "service", "donation"
  url?: string | null;            // URL du checkout
  payment_link?: string | null;   // ID ou objet si ?expand=payment_link
  cancellation_reason?: string | null;
  receipt_email?: string | null;
  expires_at?: string | null;
  metadata: Metadata;
}

/** Champs POST — alignés sur PaymentIntentSerializer + perform_create() */
export interface CreatePayloads {
  amount: AmountInCents;
  currency: CurrencyCode;
  customer?: string;              // email du customer
  description?: string;
  payment_method?: string;
  payment_method_types?: string[];
  category?: string;
  receipt_email?: string;
  metadata?: Metadata;
  /**
   * Si `true`, le PaymentIntent passe immédiatement en `"processing"`
   * après création (géré via `metadata._confirm_on_create` backend).
   */
  confirm?: boolean;
}

/** Champs PATCH — tous optionnels */
export interface Payloads {
  amount?: AmountInCents;
  currency?: CurrencyCode;
  customer?: string;
  description?: string;
  payment_method?: string;
  payment_method_types?: string[];
  receipt_email?: string;
  metadata?: Metadata;
}

/** Paramètres POST /payment-intents/:id/confirm/ */
export interface ConfirmPayloads {
  payment_method?: string;
}

/** Paramètres POST /payment-intents/:id/capture/ */
export interface CapturePayloads {
  /** Montant à capturer en centimes (≤ montant original) */
  amount_to_capture?: AmountInCents;
}

/** Paramètres POST /payment-intents/:id/cancel/ */
export interface CancelPayloads {
  cancellation_reason?: CancellationReason;
}

/** Filtres GET /payment-intents/ — alignés sur get_queryset() */
export interface PaymentIntentCriteria extends ListParams {
  status?: PaymentIntentStatus;
  currency?: CurrencyCode;
  customer?: string;        // filtré sur customer_email
  created_after?: string;   // ISO 8601
  created_before?: string;  // ISO 8601
}