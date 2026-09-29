import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Refund,
  CreatePayloads,
  RefundCriteria,
} from "@/types/resources/refunds";

export type RefundsProperties = {
  list(criteria?: RefundCriteria): Promise<ListResponse<Refund>>;
  retrieve(id: string): Promise<Refund>;
  /**
   * Crée un remboursement sur une transaction réussie.
   * Si `amount` est inférieur au montant original, le remboursement est partiel.
   * @param payloads - `transaction` requis (ID `trans_xxx`)
   */
  create(payloads: CreatePayloads, options?: RequestOptions): Promise<Refund>;
  /**
   * Annule un remboursement en statut `pending`.
   * Impossible sur les remboursements `succeeded`, `failed` ou `expired`.
   */
  cancel(id: string): Promise<Refund>;
  options(): Promise<DRFOptions>;
};