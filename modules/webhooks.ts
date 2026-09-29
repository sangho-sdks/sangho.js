import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Webhook,
  WebhookDelivery,
  CreatePayloads,
  Payloads,
  WebhookCriteria,
  DeliveryCriteria,
} from "@/types/resources/webhooks";

export class WebhooksModule extends BaseModule {
  public webhooks = {
    list: (criteria?: WebhookCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    disable: (id: string) => this._disable(id),
    enable: (id: string) => this._enable(id),
    rollSecret: (id: string) => this._rollSecret(id),
    sendTestEvent: (id: string) => this._sendTestEvent(id),
    listDeliveries: (id: string, criteria?: DeliveryCriteria) => this._listDeliveries(id, criteria),
    retrieveDelivery: (webhookId: string, deliveryId: string) => this._retrieveDelivery(webhookId, deliveryId),
    retryDelivery: (webhookId: string, deliveryId: string) => this._retryDelivery(webhookId, deliveryId),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: WebhookCriteria): Promise<ListResponse<Webhook>> {
    this.http.assertSecretKey("webhooks.list");
    return this.http.get<ListResponse<Webhook>>("/webhooks/", criteria);
  }

  protected _retrieve(id: string): Promise<Webhook> {
    this.http.assertSecretKey("webhooks.retrieve");
    return this.http.get<Webhook>(`/webhooks/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<Webhook & { secret: string }> {
    this.http.assertSecretKey("webhooks.create");
    return this.http.post<Webhook & { secret: string }>("/webhooks/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<Webhook> {
    this.http.assertSecretKey("webhooks.update");
    return this.http.patch<Webhook>(`/webhooks/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<void> {
    this.http.assertSecretKey("webhooks.delete");
    return this.http.delete(`/webhooks/${id}/`);
  }

  protected _disable(id: string): Promise<Webhook> {
    this.http.assertSecretKey("webhooks.disable");
    return this.http.post<Webhook>(`/webhooks/${id}/disable/`, {});
  }

  protected _enable(id: string): Promise<Webhook> {
    this.http.assertSecretKey("webhooks.enable");
    return this.http.post<Webhook>(`/webhooks/${id}/enable/`, {});
  }

  protected _rollSecret(id: string): Promise<{ secret: string }> {
    this.http.assertSecretKey("webhooks.rollSecret");
    return this.http.post<{ secret: string }>(`/webhooks/${id}/roll-secret/`, {});
  }

  protected _sendTestEvent(id: string): Promise<WebhookDelivery> {
    this.http.assertSecretKey("webhooks.sendTestEvent");
    return this.http.post<WebhookDelivery>(`/webhooks/${id}/test/`, {});
  }

  protected _listDeliveries(
    id: string,
    criteria?: DeliveryCriteria
  ): Promise<ListResponse<WebhookDelivery>> {
    this.http.assertSecretKey("webhooks.listDeliveries");
    return this.http.get<ListResponse<WebhookDelivery>>(
      `/webhooks/${id}/deliveries/`,
      criteria
    );
  }

  protected _retrieveDelivery(
    webhookId: string,
    deliveryId: string
  ): Promise<WebhookDelivery> {
    this.http.assertSecretKey("webhooks.retrieveDelivery");
    return this.http.get<WebhookDelivery>(
      `/webhooks/${webhookId}/deliveries/${deliveryId}/`
    );
  }

  protected _retryDelivery(
    webhookId: string,
    deliveryId: string
  ): Promise<WebhookDelivery> {
    this.http.assertSecretKey("webhooks.retryDelivery");
    return this.http.post<WebhookDelivery>(
      `/webhooks/${webhookId}/deliveries/${deliveryId}/retry/`,
      {}
    );
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/webhooks/");
  }
}