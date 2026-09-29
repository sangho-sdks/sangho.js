import type { ListParams, Metadata } from "@/types/common";

/**
 * `pending_claim` : compte créé pour le vendeur, en attente de réclamation par lui ; `linked` : réclamé ; `restricted` : capacités limitées
 * (KYC incomplet, litige…) ; `active` : KYC validé, encaissements possibles ; `disabled` : désactivé par Sangho.
 */
export type ConnectAccountStatus = "pending_claim" | "linked" | "restricted" | "active" | "disabled";

/** Compte d'un vendeur d'une plateforme (Connect). Préfixe : `acct_xxx`. Les capacités sont posées par Sangho, jamais par la plateforme. */
export interface ConnectAccount {
  id: string;
  object: "account";
  /** Identifiant du vendeur chez la plateforme (création idempotente par cet identifiant). */
  external_id: string;
  email: string;
  business_name: string;
  status: ConnectAccountStatus;
  /** Le vendeur peut encaisser : ses produits peuvent être achetés. */
  charges_enabled: boolean;
  /** Le vendeur peut retirer ses fonds. */
  payouts_enabled: boolean;
  /** 0 = non vérifié, 1 = identité vérifiée (KYC). */
  kyc_level: number;
  livemode: boolean;
  /** Timestamp Unix (secondes). */
  created: number;
}

/**
 * Réponse de la création : `claim_token` n'est présent QU'À la création (compte neuf). À transmettre au vendeur par e-mail,
 * jamais à stocker ni à journaliser ; `reissueClaimToken` en émet un nouveau (l'ancien est invalidé).
 */
export interface CreatedConnectAccount extends ConnectAccount {
  claim_token?: string;
}

/** Champs POST /connect/accounts/ */
export interface CreateConnectAccountPayloads {
  external_id: string;
  email: string;
  business_name?: string;
  phone?: string;
}

/** Filtres GET /connect/accounts/ */
export type ConnectAccountCriteria = ListParams;

/** La liste des comptes n'est pas paginée : `{ object: "list", data }`. */
export interface ConnectAccountList {
  object: "list";
  data: ConnectAccount[];
}

/** Champs POST /connect/accounts/{id}/kyc-session/ */
export interface CreateKycSessionPayloads {
  /** Adresse (https) où Sangho renvoie le vendeur après le parcours. */
  return_url: string;
  /** Adresse (https) de relance si le lien a expiré. */
  refresh_url?: string;
}

/** Session d'onboarding KYC hébergée par Sangho : rediriger le vendeur vers `url` (valable environ une heure). */
export interface KycSession {
  object: "kyc_session";
  url: string;
  /** Timestamp Unix (secondes). */
  expires_at: number;
  account: string;
}

// ─── Paiements Connect (répartition, séquestre) ──────────────────────────────

/** Les montants Connect sont des chaînes décimales (`"27000.00"`) : les convertir avec une bibliothèque décimale, jamais `parseFloat` pour comparer. */
export type DecimalString = string;

export type ConnectPaymentMode = "escrow" | "instant";

/**
 * `pending` : en attente du paiement ; `held` : fonds bloqués ; `released` : libérés ; `partially_refunded` / `refunded` : remboursés ;
 * `frozen` : gelés (litige) ; `canceled` : paiement échoué ou expiré.
 */
export type ConnectPaymentStatus = "pending" | "held" | "released" | "partially_refunded" | "refunded" | "frozen" | "canceled";

/** Paiement au profit d'un compte connecté. Préfixe : `cpay_xxx`. Renvoyé par `connect.payments.*` et en `data.object` des événements de fonds. */
export interface ConnectPayment {
  id: string;
  object: "connect_payment";
  /** Compte bénéficiaire (`acct_xxx`). */
  account: string;
  payment_intent_id: string;
  mode: ConnectPaymentMode;
  currency: string;
  amount_total: DecimalString;
  /** Part disponible dès l'encaissement (frais de livraison, ou tout en mode `instant`). */
  available_amount: DecimalString;
  /** Part bloquée jusqu'à la libération (mode `escrow`). */
  held_amount: DecimalString;
  commission: DecimalString;
  reserve_amount: DecimalString;
  refunded_amount: DecimalString;
  status: ConnectPaymentStatus;
  external_reference: string;
  metadata: Metadata;
  livemode: boolean;
  /** ISO 8601, `null` tant que les fonds ne sont pas libérés. */
  released_at: string | null;
  /** Timestamp Unix (secondes). */
  created: number;
}

/** Portée d'un remboursement : `product` = le produit, livraison conservée ; `full` = produit + livraison (reprise des frais déjà versés) ; `amount` = montant libre. */
export type ConnectRefundScope = "product" | "full" | "amount";

/** Champs POST /connect/payments/{id}/refund/ */
export interface RefundConnectPaymentPayloads {
  scope: ConnectRefundScope;
  /** Obligatoire si `scope: "amount"`. */
  amount?: number | DecimalString;
  reason?: string;
}

/** Soldes d'un compte connecté : GET /connect/accounts/{id}/balance/ (source de vérité pour l'affichage de la plateforme). */
export interface ConnectBalance {
  object: "balance";
  account: string;
  currency: string;
  available: DecimalString;
  held: DecimalString;
  frozen: DecimalString;
  reserve: DecimalString;
  /** Dette issue d'une reprise (positive) : bloque les retraits jusqu'à compensation. */
  negative: DecimalString;
  paid_out: DecimalString;
}

export type ConnectPayoutStatus = "pending" | "paid" | "failed";

/** Retrait d'un compte connecté. Préfixe : `cpo_xxx`. */
export interface ConnectPayout {
  id: string;
  object: "payout";
  account: string;
  amount: DecimalString;
  currency: string;
  status: ConnectPayoutStatus;
  destination: string;
  /** ISO 8601. */
  created_at: string;
}

/** Champs POST /connect/accounts/{id}/payouts/ */
export interface CreateConnectPayoutPayloads {
  amount: number | DecimalString;
  destination: string;
}

/** Liste non paginée : `{ object: "list", data }`. */
export interface ConnectPayoutList {
  object: "list";
  data: ConnectPayout[];
}

/** Bloc `connect` de `checkoutSessions.create` : paiement avec répartition au profit d'un compte connecté. */
export interface ConnectSplit {
  /** Compte bénéficiaire (`acct_xxx`), lié et `charges_enabled`. */
  account: string;
  /** `escrow` : fonds bloqués jusqu'à `release` ; `instant` : versés à l'encaissement. Défaut : `escrow`. */
  mode?: ConnectPaymentMode;
  /** Commission de la plateforme (montant, devise du paiement) : retenue à la libération en escrow, à l'encaissement en instant. */
  commission?: number | DecimalString;
  /** Part (0–1) des frais de livraison mise en réserve de garantie. */
  reserve_rate?: number | DecimalString;
  /** Référence de la commande chez la plateforme (recherchable, renvoyée dans `connect_payment`). */
  external_reference?: string;
  /** Rappel affiché sur la page de paiement. */
  description?: string;
}
