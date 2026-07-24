import type { ListResponse, DRFOptions } from "@/types/common";
import type {
  PaymentIntent,
  CreatePayloads,
  Payloads,
  ConfirmPayloads,
  CapturePayloads,
  CancelPayloads,
  PaymentIntentCriteria,
} from "@/types/resources/payment-intents";

export type PaymentIntentsProperties = {
  /**
   * Liste les PaymentIntents avec filtres et pagination.
   *
   * @param criteria - Filtres optionnels (status, currency, customer, dates, pagination)
   * @returns Liste paginée de PaymentIntents
   *
   * @example
   * const all       = await sangho.paymentIntents.list()
   * const succeeded = await sangho.paymentIntents.list({ status: "succeeded" })
   * const byEmail   = await sangho.paymentIntents.list({ customer: "jean@example.com" })
   */
  list(criteria?: PaymentIntentCriteria): Promise<ListResponse<PaymentIntent>>;

  /**
   * Récupère un PaymentIntent par son identifiant.
   * Ajouter `?expand=customer` ou `?expand=payment_link` pour les objets complets.
   *
   * @param id - Identifiant du PaymentIntent (format `pi_xxx`)
   * @returns Le PaymentIntent correspondant
   *
   * @example
   * const intent = await sangho.paymentIntents.retrieve("pi_xxx")
   */
  retrieve(id: string): Promise<PaymentIntent>;

  /**
   * Crée un nouveau PaymentIntent.
   * Statut initial : `"requires_payment_method"`.
   * Si `confirm: true`, passe immédiatement en `"processing"`.
   *
   * @param payloads - `amount` et `currency` requis
   * @returns Le PaymentIntent créé
   *
   * @example
   * const intent = await sangho.paymentIntents.create({
   *   amount: 5000,
   *   currency: "XAF",
   *   description: "Commande #42",
   * })
   */
  create(payloads: CreatePayloads): Promise<PaymentIntent>;

  /**
   * Met à jour un PaymentIntent avant sa confirmation (PATCH).
   *
   * @param id      - Identifiant du PaymentIntent (format `pi_xxx`)
   * @param payloads - Champs à modifier (tous optionnels)
   * @returns Le PaymentIntent mis à jour
   *
   * @example
   * await sangho.paymentIntents.update("pi_xxx", {
   *   description: "Nouvelle description",
   *   metadata: { order_id: "42" },
   * })
   */
  update(id: string, payloads: Payloads): Promise<PaymentIntent>;

  /**
   * Annule un PaymentIntent via DELETE (alias de `cancel()`).
   * Retourne le PaymentIntent avec `status: "canceled"` (HTTP 200).
   * Ne fonctionne pas sur les statuts `"canceled"` ou `"succeeded"`.
   *
   * @param id - Identifiant du PaymentIntent (format `pi_xxx`)
   * @returns Le PaymentIntent annulé
   *
   * @example
   * const canceled = await sangho.paymentIntents.delete("pi_xxx")
   */
  delete(id: string): Promise<PaymentIntent>;

  /**
   * Confirme un PaymentIntent pour déclencher le paiement.
   * Statuts acceptés : `"requires_payment_method"`, `"requires_confirmation"`.
   * Passe en `"processing"` après confirmation.
   *
   * @param id      - Identifiant du PaymentIntent (format `pi_xxx`)
   * @param payloads - Mode de paiement optionnel
   * @returns Le PaymentIntent confirmé
   *
   * @example
   * const intent = await sangho.paymentIntents.confirm("pi_xxx", {
   *   payment_method: "meth_xxx",
   * })
   */
  confirm(id: string, payloads?: ConfirmPayloads): Promise<PaymentIntent>;

  /**
   * Capture un PaymentIntent en mode de capture manuelle.
   * Nécessite `status: "requires_capture"`.
   * Passe en `"succeeded"` après capture.
   *
   * @param id      - Identifiant du PaymentIntent (format `pi_xxx`)
   * @param payloads - Montant à capturer (≤ montant original, optionnel)
   * @returns Le PaymentIntent capturé
   *
   * @example
   * await sangho.paymentIntents.capture("pi_xxx", { amount_to_capture: 3000 })
   */
  capture(id: string, payloads?: CapturePayloads): Promise<PaymentIntent>;

  /**
   * Annule explicitement un PaymentIntent.
   * Impossible si `status` vaut `"canceled"` ou `"succeeded"`.
   *
   * @param id      - Identifiant du PaymentIntent (format `pi_xxx`)
   * @param payloads - Raison d'annulation (défaut: `"requested_by_customer"`)
   * @returns Le PaymentIntent annulé avec `status: "canceled"`
   *
   * @example
   * await sangho.paymentIntents.cancel("pi_xxx", {
   *   cancellation_reason: "duplicate",
   * })
   */
  cancel(id: string, payloads?: CancelPayloads): Promise<PaymentIntent>;

  /**
   * Retourne les métadonnées DRF du endpoint `/payment-intents/` :
   * actions autorisées, schéma de champs, formats acceptés.
   */
  options(): Promise<DRFOptions>;
};