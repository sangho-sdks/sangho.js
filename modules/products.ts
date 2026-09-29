import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Product,
  CreatePayloads,
  Payloads,
  ProductCriteria,
} from "@/types/resources/products";

export class ProductsModule extends BaseModule {
  public products = {
    list: (criteria?: ProductCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: ProductCriteria): Promise<ListResponse<Product>> {
    this.http.assertSecretKey("products.list");
    return this.http.get<ListResponse<Product>>("/products/", criteria);
  }

  protected _retrieve(id: string): Promise<Product> {
    this.http.assertSecretKey("products.retrieve");
    return this.http.get<Product>(`/products/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<Product> {
    this.http.assertSecretKey("products.create");
    return this.http.post<Product>("/products/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<Product> {
    this.http.assertSecretKey("products.update");
    return this.http.patch<Product>(`/products/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<void> {
    this.http.assertSecretKey("products.delete");
    return this.http.delete(`/products/${id}/`);
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/products/");
  }
}