import type { ConnectSplit } from "@/types/resources/connect";
import type {
  AmountInCents,
  CurrencyCode,
  ListParams,
  Metadata,
  Timestamps,
} from "@/types/common";

export type CheckoutSessionStatus =
  | "open"
  | "complete"
  | "expired"
  | "payment_failed"
  | "processing";

export type CheckoutMode = "payment" | "subscription" | "setup";

/** Ligne de commande — type local, découplé de payment-links */
export interface LineItem {
  /** ID prod_xxx. Facultatif : une ligne ad hoc (panier libre) porte `name` + `unit_amount` sans produit du catalogue. */
  product?: string;
  quantity: number;
  /** Prix unitaire, unité majeure (5000 = 5000 XAF). Sans `product`, requis (le prix du produit n'est pas relu). */
  unit_amount?: number;
  /** Libellé de la ligne (requis sans `product`). */
  name?: string;
  currency?: CurrencyCode;
}

/**
 * Représente une CheckoutSession Sangho.
 * Préfixe d'identifiant : `sess_xxx`
 */
export interface CheckoutSession extends Timestamps {
  id: string;
  object: "checkout_session";
  app: string;
  url: string;
  status: CheckoutSessionStatus;
  mode: CheckoutMode;
  customer?: string | null;
  customer_email?: string | null;
  currency: CurrencyCode;
  amount_total: AmountInCents;
  shipping_amount?: number | null;
  discount_amount?: number | null;
  line_items: LineItem[];
  success_url: string;
  cancel_url?: string | null;
  payment_intent?: string | null;
  subscription?: string | null;
  /** Paiement Connect (`cpay_xxx`) créé avec la session quand le bloc `connect` a été fourni. */
  connect_payment?: string | null;
  expires_at: string;
  metadata: Metadata;
}

/** Champs POST — `success_url`, `line_items`, `currency` requis */
export interface CreatePayloads {
  success_url: string;
  line_items: LineItem[];
  currency: CurrencyCode;
  mode?: CheckoutMode;              // défaut: "payment"
  customer?: string;                // ID cust_xxx
  customer_email?: string;
  cancel_url?: string;
  shipping_amount?: AmountInCents;
  discount_amount?: AmountInCents;
  payment_method_types?: string[];
  /**
   * Paiement avec répartition au profit d'un compte connecté (séquestre / instantané). `shipping_amount` = part disponible tout de suite
   * pour le vendeur ; le reste est bloqué (`escrow`) ou versé (`instant`). Réponse : `connect_payment`.
   */
  connect?: ConnectSplit;
  /** Durée de validité en secondes (défaut: 1800, max: 86400) */
  expires_in?: number;
  metadata?: Metadata;
}

/** Filtres GET /checkout-sessions/ */
export interface CheckoutSessionCriteria extends ListParams {
  status?: CheckoutSessionStatus;
  mode?: CheckoutMode;
  customer?: string;
  created_after?: string;   // ISO 8601
  created_before?: string;
}