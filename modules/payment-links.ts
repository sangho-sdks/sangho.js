import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  PaymentLink,
  CreatePayloads,
  Payloads,
  PaymentLinkCriteria,
} from "@/types/resources/payment-links";

export class PaymentLinksModule extends BaseModule {
  public paymentLinks = {
    list: (criteria?: PaymentLinkCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    archive: (id: string) => this._archive(id),
    restore: (id: string) => this._restore(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: PaymentLinkCriteria): Promise<ListResponse<PaymentLink>> {
    this.http.assertSecretKey("paymentLinks.list");
    return this.http.get<ListResponse<PaymentLink>>("/payment-links/", criteria);
  }

  protected _retrieve(id: string): Promise<PaymentLink> {
    this.http.assertSecretKey("paymentLinks.retrieve");
    return this.http.get<PaymentLink>(`/payment-links/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<PaymentLink> {
    this.http.assertSecretKey("paymentLinks.create");
    return this.http.post<PaymentLink>("/payment-links/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<PaymentLink> {
    this.http.assertSecretKey("paymentLinks.update");
    return this.http.patch<PaymentLink>(`/payment-links/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<PaymentLink> {
    this.http.assertSecretKey("paymentLinks.delete");
    return this.http.delete<PaymentLink>(`/payment-links/${id}/`);
  }

  protected _archive(id: string): Promise<PaymentLink> {
    this.http.assertSecretKey("paymentLinks.archive");
    return this.http.post<PaymentLink>(`/payment-links/${id}/archive/`, {});
  }

  protected _restore(id: string): Promise<PaymentLink> {
    this.http.assertSecretKey("paymentLinks.restore");
    return this.http.post<PaymentLink>(`/payment-links/${id}/restore/`, {});
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/payment-links/");
  }
}