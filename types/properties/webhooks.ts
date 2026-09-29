import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Webhook,
  WebhookDelivery,
  CreatePayloads,
  Payloads,
  WebhookCriteria,
  DeliveryCriteria,
} from "@/types/resources/webhooks";

export type WebhooksProperties = {
  list(criteria?: WebhookCriteria): Promise<ListResponse<Webhook>>;
  retrieve(id: string): Promise<Webhook>;
  /**
   * Crée un endpoint webhook.
   * Le secret de signature est retourné en clair une seule fois dans la réponse.
   * Stockez-le immédiatement — il ne sera plus accessible ensuite.
   */
  create(payloads: CreatePayloads, options?: RequestOptions): Promise<Webhook & { secret: string }>;
  update(id: string, payloads: Payloads): Promise<Webhook>;
  /** Supprime un webhook (HTTP 204). */
  delete(id: string): Promise<void>;
  /** Désactive un webhook sans le supprimer (passe en `"INACTIVE"`). */
  disable(id: string): Promise<Webhook>;
  /** Réactive un webhook désactivé (passe en `"ACTIVE"`). */
  enable(id: string): Promise<Webhook>;
  /**
   * Régénère le secret HMAC du webhook.
   * L'ancien secret est invalidé immédiatement.
   * @returns Le nouveau secret en clair (une seule fois)
   */
  rollSecret(id: string): Promise<{ secret: string }>;
  /** Envoie un événement test au webhook pour vérifier la connectivité. */
  sendTestEvent(id: string): Promise<WebhookDelivery>;
  listDeliveries(id: string, criteria?: DeliveryCriteria): Promise<ListResponse<WebhookDelivery>>;
  retrieveDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery>;
  /** Rejoue une livraison échouée. */
  retryDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery>;
  options(): Promise<DRFOptions>;
};