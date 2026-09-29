import type { RequestOptions } from "@/types/common";
import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type {
  CompanyAddress,
  CreatePayloads,
  Payloads,
  AddressCriteria,
} from "@/types/resources/addresses";
import { DRFOptions } from "@/types/common";

export class AddressesModule extends BaseModule {
  public addresses = {
    list: (criteria?: AddressCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: AddressCriteria): Promise<CompanyAddress[]> {
    this.http.assertSecretKey("addresses.list");
    return this.http.get<CompanyAddress[]>("/addresses/", criteria);
  }

  protected _retrieve(id: string): Promise<CompanyAddress> {
    this.http.assertSecretKey("addresses.retrieve");
    return this.http.get<CompanyAddress>(`/addresses/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<CompanyAddress> {
    this.http.assertSecretKey("addresses.create");
    return this.http.post<CompanyAddress>("/addresses/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<CompanyAddress> {
    this.http.assertSecretKey("addresses.update");
    return this.http.patch<CompanyAddress>(`/addresses/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<void> {
    this.http.assertSecretKey("addresses.delete");
    return this.http.delete(`/addresses/${id}/`);
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/addresses/");
  }
}