import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Subscription,
  CreatePayloads,
  Payloads,
  SubscriptionCriteria,
} from "@/types/resources/subscriptions";

export type SubscriptionsProperties = {
  list(criteria?: SubscriptionCriteria): Promise<ListResponse<Subscription>>;
  retrieve(id: string): Promise<Subscription>;
  /**
   * Crée un abonnement récurrent.
   * Si `trial_period_days > 0`, démarre en statut `"trialing"`.
   * @param payloads - `customer`, `unit_amount` et `interval` requis
   */
  create(payloads: CreatePayloads, options?: RequestOptions): Promise<Subscription>;
  update(id: string, payloads: Payloads): Promise<Subscription>;
  /**
   * Annule un abonnement.
   * `cancel_at_period_end: true` (défaut) → annulation à la fin de la période.
   * `cancel_at_period_end: false` → annulation immédiate.
   */
  cancel(id: string, payloads?: { cancel_at_period_end?: boolean }): Promise<Subscription>;
  /** Réactive un abonnement `canceled`, `past_due` ou `unpaid`. */
  reactivate(id: string): Promise<Subscription>;
  /** Suspend un abonnement actif (passe en `"paused"`). */
  pause(id: string): Promise<Subscription>;
  /** Reprend un abonnement `"paused"`. */
  resume(id: string): Promise<Subscription>;
  options(): Promise<DRFOptions>;
};