import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Product,
  CreatePayloads,
  Payloads,
  ProductCriteria,
} from "@/types/resources/products";

export type ProductsProperties = {
  /**
   * Liste les produits du catalogue avec filtres optionnels.
   * Accessible avec clé publique ou secrète.
   *
   * @param criteria - Filtres (status, currency, search, ordering, pagination)
   * @returns Liste paginée de produits
   *
   * @example
   * const all    = await sangho.products.list()
   * const active = await sangho.products.list({ status: "active" })
   * const search = await sangho.products.list({ search: "premium" })
   */
  list(criteria?: ProductCriteria): Promise<ListResponse<Product>>;

  /**
   * Récupère un produit par son identifiant.
   * Accessible avec clé publique ou secrète.
   *
   * @param id - Identifiant du produit (format `prod_xxx`)
   * @returns Le produit correspondant
   *
   * @example
   * const product = await sangho.products.retrieve("prod_xxx")
   */
  retrieve(id: string): Promise<Product>;

  /**
   * Crée un nouveau produit dans le catalogue.
   * Nécessite une clé secrète.
   *
   * @param payloads - `name`, `unit_amount` et `currency` requis
   * @returns Le produit créé
   *
   * @example
   * const product = await sangho.products.create({
   *   name: "Abonnement Premium",
   *   unit_amount: 9900,
   *   currency: "XAF",
   *   type: "service",
   * })
   */
  create(payloads: CreatePayloads, options?: RequestOptions): Promise<Product>;

  /**
   * Met à jour partiellement un produit (PATCH).
   * Nécessite une clé secrète.
   *
   * @param id      - Identifiant du produit (format `prod_xxx`)
   * @param payloads - Champs à modifier (tous optionnels)
   * @returns Le produit mis à jour
   *
   * @example
   * await sangho.products.update("prod_xxx", { stock: 50 })
   */
  update(id: string, payloads: Payloads): Promise<Product>;

  /**
   * Archive un produit (soft delete — `status: "archived"`).
   * Le backend retourne HTTP 204 sans corps.
   * Le produit reste accessible en lecture.
   * Nécessite une clé secrète.
   *
   * @param id - Identifiant du produit (format `prod_xxx`)
   *
   * @example
   * await sangho.products.delete("prod_xxx")
   *
   * @remarks
   * Les actions dédiées `archive()` et `unarchive()` n'existent pas
   * encore côté backend. Pour restaurer un produit archivé,
   * utilisez `update(id, { status: "active" })`.
   */
  delete(id: string): Promise<void>;

  /**
   * Retourne les métadonnées DRF du endpoint `/products/` :
   * actions autorisées, schéma de champs, formats acceptés.
   */
  options(): Promise<DRFOptions>;
};