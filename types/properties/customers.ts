import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Customer,
  CreatePayloads,
  Payloads,
  CustomerCriteria,
} from "@/types/resources/customers";
import type { PaymentMethod } from "@/types/resources/payment-methods";

export type CustomersProperties = {
  /**
   * Liste les clients de l'app avec filtres optionnels.
   * Recherche sur email, prénom et nom via `search`.
   *
   * @param criteria - Filtres optionnels (search, status, ordering, pagination)
   * @returns Liste paginée de clients
   *
   * @example
   * const all    = await sangho.customers.list()
   * const active = await sangho.customers.list({ status: "active" })
   * const search = await sangho.customers.list({ search: "jean" })
   */
  list(criteria?: CustomerCriteria): Promise<ListResponse<Customer>>;

  /**
   * Récupère un client par son identifiant.
   *
   * @param id - Identifiant du client (ex: `"cust_xxx"`)
   * @returns Le client correspondant
   *
   * @example
   * const customer = await sangho.customers.retrieve("cust_xxx")
   */
  retrieve(id: string): Promise<Customer>;

  /**
   * Crée un nouveau client lié à l'app.
   * Le champ `name` est automatiquement éclaté en `firstname`
   * et `lastname` côté backend.
   *
   * @param payloads - `email` et `name` requis
   * @returns Le client créé
   *
   * @example
   * const customer = await sangho.customers.create({
   *   email: "jean@example.com",
   *   name: "Jean Ondo",
   * })
   */
  create(payloads: CreatePayloads, options?: RequestOptions): Promise<Customer>;

  /**
   * Met à jour partiellement un client (PATCH).
   *
   * @param id      - Identifiant du client
   * @param payloads - Champs à modifier (tous optionnels)
   * @returns Le client mis à jour
   *
   * @example
   * await sangho.customers.update("cust_xxx", { phone: "+24177000000" })
   */
  update(id: string, payloads: Payloads): Promise<Customer>;

  /**
   * Supprime définitivement un client (hard delete).
   * Le backend retourne HTTP 204 sans corps.
   *
   * @param id - Identifiant du client
   *
   * @example
   * await sangho.customers.delete("cust_xxx")
   */
  delete(id: string): Promise<void>;

  /**
   * Liste les modes de paiement enregistrés d'un client.
   *
   * @param id - Identifiant du client
   * @returns Liste des modes de paiement
   *
   * @example
   * const methods = await sangho.customers.listPaymentMethods("cust_xxx")
   *
   * @remarks Appelle `GET /payment-methods/?customer=<id>` (la route
   * `/customers/:id/payment-methods/` n'existe pas côté API).
   */
  listPaymentMethods(id: string): Promise<ListResponse<PaymentMethod>>;

  /**
   * Retourne les métadonnées DRF du endpoint `/customers/` :
   * actions autorisées, schéma de champs, formats acceptés.
   */
  options(): Promise<DRFOptions>;
};