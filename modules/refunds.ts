import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Refund,
  CreatePayloads,
  RefundCriteria,
} from "@/types/resources/refunds";

export class RefundsModule extends BaseModule {
  public refunds = {
    list: (criteria?: RefundCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    cancel: (id: string) => this._cancel(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: RefundCriteria): Promise<ListResponse<Refund>> {
    this.http.assertSecretKey("refunds.list");
    return this.http.get<ListResponse<Refund>>("/refunds/", criteria);
  }

  protected _retrieve(id: string): Promise<Refund> {
    this.http.assertSecretKey("refunds.retrieve");
    return this.http.get<Refund>(`/refunds/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<Refund> {
    this.http.assertSecretKey("refunds.create");
    return this.http.post<Refund>("/refunds/", payloads, options?.idempotencyKey);
  }

  protected _cancel(id: string): Promise<Refund> {
    this.http.assertSecretKey("refunds.cancel");
    return this.http.post<Refund>(`/refunds/${id}/cancel/`, {});
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/refunds/");
  }
}