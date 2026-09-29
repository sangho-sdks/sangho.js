import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  CheckoutSession,
  CreatePayloads,
  CheckoutSessionCriteria,
} from "@/types/resources/checkout-sessions";

export type CheckoutSessionsProperties = {
  /**
   * Liste les sessions de checkout avec filtres optionnels.
   *
   * @param criteria - Filtres (status, mode, customer, dates, pagination)
   * @returns Liste paginée de sessions
   *
   * @example
   * const all    = await sangho.checkoutSessions.list()
   * const open   = await sangho.checkoutSessions.list({ status: "open" })
   * const subs   = await sangho.checkoutSessions.list({ mode: "subscription" })
   */
  list(criteria?: CheckoutSessionCriteria): Promise<ListResponse<CheckoutSession>>;

  /**
   * Récupère une session de checkout par son identifiant.
   * Si la session est expirée mais encore marquée `"open"`,
   * le backend la bascule automatiquement en `"expired"`.
   * Accessible avec clé publique ou secrète.
   *
   * @param id - Identifiant de la session (format `sess_xxx`)
   */
  retrieve(id: string): Promise<CheckoutSession>;

  /**
   * Crée une session de checkout hébergée.
   * En mode `"payment"`, un PaymentIntent est automatiquement créé.
   * `success_url`, `line_items` et `currency` sont requis.
   *
   * @param payloads - Paramètres de la session
   * @returns La session avec son URL de redirection
   *
   * @example
   * const session = await sangho.checkoutSessions.create({
   *   success_url: "https://monsite.com/merci",
   *   cancel_url:  "https://monsite.com/annulation",
   *   currency:    "XAF",
   *   line_items:  [{ product: "prod_xxx", quantity: 1 }],
   * })
   * window.location.href = session.url
   */
  create(payloads: CreatePayloads, options?: RequestOptions): Promise<CheckoutSession>;

  /**
   * Expire manuellement une session ouverte
   * (`POST /checkout-sessions/:id/expire/`).
   * Retourne une erreur si la session n'est pas en statut `"open"`.
   * Équivalent à `DELETE /checkout-sessions/:id/`.
   *
   * @param id - Identifiant de la session (format `sess_xxx`)
   * @returns La session expirée
   *
   * @example
   * await sangho.checkoutSessions.expire("sess_xxx")
   */
  expire(id: string): Promise<CheckoutSession>;

  /**
   * Alias de `expire()` — expire la session au lieu de la supprimer.
   * Le backend ne supprime pas physiquement les sessions.
   *
   * @param id - Identifiant de la session (format `sess_xxx`)
   */
  delete(id: string): Promise<CheckoutSession>;

  /**
   * Retourne les métadonnées DRF du endpoint `/checkout-sessions/`.
   */
  options(): Promise<DRFOptions>;
};