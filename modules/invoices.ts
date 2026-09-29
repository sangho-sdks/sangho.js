import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Invoice,
  CreatePayloads,
  Payloads,
  InvoiceCriteria,
} from "@/types/resources/invoices";

export class InvoicesModule extends BaseModule {
  public invoices = {
    list: (criteria?: InvoiceCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    send: (id: string) => this._send(id),
    pay: (id: string) => this._pay(id),
    void: (id: string) => this._void(id),
    markUncollectible: (id: string) => this._markUncollectible(id),
    getPdfUrl: (id: string) => this._getPdfUrl(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: InvoiceCriteria): Promise<ListResponse<Invoice>> {
    this.http.assertSecretKey("invoices.list");
    return this.http.get<ListResponse<Invoice>>("/invoices/", criteria);
  }

  protected _retrieve(id: string): Promise<Invoice> {
    this.http.assertSecretKey("invoices.retrieve");
    return this.http.get<Invoice>(`/invoices/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<Invoice> {
    this.http.assertSecretKey("invoices.create");
    return this.http.post<Invoice>("/invoices/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<Invoice> {
    this.http.assertSecretKey("invoices.update");
    return this.http.patch<Invoice>(`/invoices/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<void> {
    this.http.assertSecretKey("invoices.delete");
    return this.http.delete(`/invoices/${id}/`);
  }

  protected _send(id: string): Promise<Invoice> {
    this.http.assertSecretKey("invoices.send");
    return this.http.post<Invoice>(`/invoices/${id}/send/`, {});
  }

  protected _pay(id: string): Promise<Invoice> {
    this.http.assertSecretKey("invoices.pay");
    return this.http.post<Invoice>(`/invoices/${id}/pay/`, {});
  }

  protected _void(id: string): Promise<Invoice> {
    this.http.assertSecretKey("invoices.void");
    return this.http.post<Invoice>(`/invoices/${id}/void/`, {});
  }

  protected _markUncollectible(id: string): Promise<Invoice> {
    this.http.assertSecretKey("invoices.markUncollectible");
    return this.http.post<Invoice>(`/invoices/${id}/mark-uncollectible/`, {});
  }

  protected _getPdfUrl(id: string): Promise<{ url: string; expires_at: string }> {
    this.http.assertSecretKey("invoices.getPdfUrl");
    return this.http.get<{ url: string; expires_at: string }>(`/invoices/${id}/pdf/`);
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/invoices/");
  }
}