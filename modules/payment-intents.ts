import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  PaymentIntent,
  CreatePayloads,
  Payloads,
  ConfirmPayloads,
  CapturePayloads,
  CancelPayloads,
  PaymentIntentCriteria,
} from "@/types/resources/payment-intents";

export class PaymentIntentsModule extends BaseModule {
  public paymentIntents = {
    list: (criteria?: PaymentIntentCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    confirm: (id: string, payloads?: ConfirmPayloads) => this._confirm(id, payloads),
    capture: (id: string, payloads?: CapturePayloads) => this._capture(id, payloads),
    cancel: (id: string, payloads?: CancelPayloads) => this._cancel(id, payloads),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: PaymentIntentCriteria): Promise<ListResponse<PaymentIntent>> {
    this.http.assertSecretKey("paymentIntents.list");
    return this.http.get<ListResponse<PaymentIntent>>("/payment-intents/", criteria);
  }

  protected _retrieve(id: string): Promise<PaymentIntent> {
    this.http.assertSecretKey("paymentIntents.retrieve");
    return this.http.get<PaymentIntent>(`/payment-intents/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<PaymentIntent> {
    this.http.assertSecretKey("paymentIntents.create");
    return this.http.post<PaymentIntent>("/payment-intents/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<PaymentIntent> {
    this.http.assertSecretKey("paymentIntents.update");
    return this.http.patch<PaymentIntent>(`/payment-intents/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<PaymentIntent> {
    this.http.assertSecretKey("paymentIntents.delete");
    return this.http.delete<PaymentIntent>(`/payment-intents/${id}/`);
  }

  protected _confirm(id: string, payloads?: ConfirmPayloads): Promise<PaymentIntent> {
    this.http.assertSecretKey("paymentIntents.confirm");
    return this.http.post<PaymentIntent>(`/payment-intents/${id}/confirm/`, payloads ?? {});
  }

  protected _capture(id: string, payloads?: CapturePayloads): Promise<PaymentIntent> {
    this.http.assertSecretKey("paymentIntents.capture");
    return this.http.post<PaymentIntent>(`/payment-intents/${id}/capture/`, payloads ?? {});
  }

  protected _cancel(id: string, payloads?: CancelPayloads): Promise<PaymentIntent> {
    this.http.assertSecretKey("paymentIntents.cancel");
    return this.http.post<PaymentIntent>(`/payment-intents/${id}/cancel/`, payloads ?? {});
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/payment-intents/");
  }
}