import type { ListResponse, DRFOptions } from "@/types/common";
import type {
  PaymentLink,
  CreatePayloads,
  Payloads,
  PaymentLinkCriteria,
} from "@/types/resources/payment-links";

export type PaymentLinksProperties = {
  /**
   * Liste les liens de paiement avec filtres optionnels.
   *
   * @param criteria - Filtres (status, currency, search, ordering, pagination)
   * @returns Liste paginée de liens de paiement
   *
   * @example
   * const all      = await sangho.paymentLinks.list()
   * const active   = await sangho.paymentLinks.list({ status: "active" })
   * const search   = await sangho.paymentLinks.list({ search: "promo" })
   */
  list(criteria?: PaymentLinkCriteria): Promise<ListResponse<PaymentLink>>;

  /**
   * Récupère un lien de paiement par son identifiant.
   * Ajouter `?expand=products` pour obtenir les objets Product complets.
   *
   * @param id - Identifiant du lien (ex: `"link_xxx"`)
   * @returns Le lien de paiement correspondant
   *
   * @example
   * const link = await sangho.paymentLinks.retrieve("link_xxx")
   */
  retrieve(id: string): Promise<PaymentLink>;

  /**
   * Crée un nouveau lien de paiement partageable.
   * Si `payment_link_type` vaut `"product"`, le champ `products` est requis.
   * Pour les autres types, `amount` et `currency` sont requis.
   *
   * @param payloads - Paramètres du lien (currency toujours requis)
   * @returns Le lien de paiement créé
   *
   * @example
   * const link = await sangho.paymentLinks.create({
   *   currency: "XAF",
   *   payment_link_type: "product",
   *   products: ["prod_xxx"],
   *   product_quantity_settings: { prod_xxx: 1 },
   *   redirect_url: { success: "https://monsite.com/merci" },
   * })
   * console.log(link.url) // https://pay.sangho.ga/test/...
   */
  create(payloads: CreatePayloads): Promise<PaymentLink>;

  /**
   * Met à jour partiellement un lien de paiement (PATCH).
   * PUT n'est pas supporté côté backend.
   *
   * @param id      - Identifiant du lien
   * @param payloads - Champs à modifier (tous optionnels)
   * @returns Le lien mis à jour
   *
   * @example
   * await sangho.paymentLinks.update("link_xxx", {
   *   max_usage: 100,
   *   redirect_url: { success: "https://monsite.com/merci" },
   * })
   */
  update(id: string, payloads: Payloads): Promise<PaymentLink>;

  /**
   * Archive un lien de paiement (soft delete).
   * Le backend ne supprime pas physiquement — l'historique est conservé.
   * Équivalent à `DELETE /payment-links/:id/` côté API.
   *
   * @param id - Identifiant du lien
   * @returns Le lien archivé (status: "archived")
   *
   * @example
   * const archived = await sangho.paymentLinks.delete("link_xxx")
   */
  delete(id: string): Promise<PaymentLink>;

  /**
   * Archive explicitement un lien via `POST /payment-links/:id/archive/`.
   * Retourne une erreur si le lien est déjà archivé.
   *
   * @param id - Identifiant du lien
   * @returns Le lien archivé
   *
   * @example
   * await sangho.paymentLinks.archive("link_xxx")
   */
  archive(id: string): Promise<PaymentLink>;

  /**
   * Restaure un lien archivé (`POST /payment-links/:id/restore/`).
   * Le lien repasse au statut `"active"`.
   * Retourne une erreur si le lien n'est pas archivé.
   *
   * @param id - Identifiant du lien
   * @returns Le lien restauré
   *
   * @example
   * await sangho.paymentLinks.restore("link_xxx")
   */
  restore(id: string): Promise<PaymentLink>;

  /**
   * Retourne les métadonnées DRF du endpoint `/payment-links/` :
   * actions autorisées, schéma de champs, formats acceptés.
   */
  options(): Promise<DRFOptions>;
};