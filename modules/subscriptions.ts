import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Subscription,
  CreatePayloads,
  Payloads,
  SubscriptionCriteria,
} from "@/types/resources/subscriptions";

export class SubscriptionsModule extends BaseModule {
  public subscriptions = {
    list: (criteria?: SubscriptionCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    cancel: (id: string, payloads?: { cancel_at_period_end?: boolean }) => this._cancel(id, payloads),
    reactivate: (id: string) => this._reactivate(id),
    pause: (id: string) => this._pause(id),
    resume: (id: string) => this._resume(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: SubscriptionCriteria): Promise<ListResponse<Subscription>> {
    this.http.assertSecretKey("subscriptions.list");
    return this.http.get<ListResponse<Subscription>>("/subscriptions/", criteria);
  }

  protected _retrieve(id: string): Promise<Subscription> {
    this.http.assertSecretKey("subscriptions.retrieve");
    return this.http.get<Subscription>(`/subscriptions/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<Subscription> {
    this.http.assertSecretKey("subscriptions.create");
    return this.http.post<Subscription>("/subscriptions/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<Subscription> {
    this.http.assertSecretKey("subscriptions.update");
    return this.http.patch<Subscription>(`/subscriptions/${id}/`, payloads);
  }

  protected _cancel(
    id: string,
    payloads?: { cancel_at_period_end?: boolean }
  ): Promise<Subscription> {
    this.http.assertSecretKey("subscriptions.cancel");
    return this.http.post<Subscription>(`/subscriptions/${id}/cancel/`, payloads ?? {});
  }

  protected _reactivate(id: string): Promise<Subscription> {
    this.http.assertSecretKey("subscriptions.reactivate");
    return this.http.post<Subscription>(`/subscriptions/${id}/reactivate/`, {});
  }

  protected _pause(id: string): Promise<Subscription> {
    this.http.assertSecretKey("subscriptions.pause");
    return this.http.post<Subscription>(`/subscriptions/${id}/pause/`, {});
  }

  protected _resume(id: string): Promise<Subscription> {
    this.http.assertSecretKey("subscriptions.resume");
    return this.http.post<Subscription>(`/subscriptions/${id}/resume/`, {});
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/subscriptions/");
  }
}