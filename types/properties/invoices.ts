import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Invoice,
  CreatePayloads,
  Payloads,
  InvoiceCriteria,
} from "@/types/resources/invoices";

export type InvoicesProperties = {
  /**
   * Liste les factures avec filtres optionnels.
   *
   * @param criteria - Filtres (customer, status, currency, due_date, pagination)
   */
  list(criteria?: InvoiceCriteria): Promise<ListResponse<Invoice>>;

  /**
   * Récupère une facture par son identifiant.
   *
   * @param id - Identifiant de la facture (format `inv_xxx`)
   */
  retrieve(id: string): Promise<Invoice>;

  /**
   * Crée une nouvelle facture en statut `draft`.
   * Si `send_immediately: true`, passe directement en `open`.
   *
   * @param payloads - `customer` et `line_items` requis
   */
  create(payloads: CreatePayloads, options?: RequestOptions): Promise<Invoice>;

  /**
   * Met à jour une facture en statut `draft` (PATCH).
   * Impossible sur les factures `open`, `paid`, `void` ou `uncollectible`.
   *
   * @param id      - Identifiant de la facture
   * @param payloads - Champs modifiables (description, footer, due_date, tax_rate)
   */
  update(id: string, payloads: Payloads): Promise<Invoice>;

  /**
   * Supprime définitivement une facture.
   * Uniquement possible si `status === "draft"`.
   * Retourne HTTP 204 sans corps.
   *
   * @param id - Identifiant de la facture
   */
  delete(id: string): Promise<void>;

  /**
   * Finalise et envoie une facture draft.
   * Passe en `status: "open"`.
   *
   * @param id - Identifiant de la facture
   */
  send(id: string): Promise<Invoice>;

  /**
   * Marque une facture ouverte comme payée manuellement.
   * Passe en `status: "paid"`, peuple `paid_at` et `amount_paid`.
   *
   * @param id - Identifiant de la facture
   */
  pay(id: string): Promise<Invoice>;

  /**
   * Annule une facture ouverte.
   * Passe en `status: "void"`, peuple `voided_at`.
   * Impossible sur les factures `paid` ou déjà `void`.
   *
   * @param id - Identifiant de la facture
   */
  void(id: string): Promise<Invoice>;

  /**
   * Marque une facture ouverte comme irrécupérable.
   * Passe en `status: "uncollectible"`.
   *
   * @param id - Identifiant de la facture
   */
  markUncollectible(id: string): Promise<Invoice>;

  /**
   * Retourne l'URL de téléchargement PDF d'une facture.
   * L'URL expire après 1 heure.
   *
   * @param id - Identifiant de la facture
   * @returns URL temporaire + date d'expiration ISO 8601
   */
  getPdfUrl(id: string): Promise<{ url: string; expires_at: string }>;

  /** Retourne les métadonnées DRF du endpoint `/invoices/`. */
  options(): Promise<DRFOptions>;
};