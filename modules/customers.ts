import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
import type {
  Customer,
  CreatePayloads,
  Payloads,
  CustomerCriteria,
  TransactionCriteria,
} from "@/types/resources/customers";
import type { Transaction } from "@/types/resources/transactions";
import type { PaymentMethod } from "@/types/resources/payment-methods";

export class CustomersModule extends BaseModule {
  public customers = {
    list: (criteria?: CustomerCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    listTransactions: (id: string, criteria?: TransactionCriteria) => this._listTransactions(id, criteria),
    listPaymentMethods: (id: string) => this._listPaymentMethods(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: CustomerCriteria): Promise<ListResponse<Customer>> {
    this.http.assertSecretKey("customers.list");
    return this.http.get<ListResponse<Customer>>("/customers/", criteria);
  }

  protected _retrieve(id: string): Promise<Customer> {
    this.http.assertSecretKey("customers.retrieve");
    return this.http.get<Customer>(`/customers/${id}/`);
  }

  protected _create(payloads: CreatePayloads, options?: RequestOptions): Promise<Customer> {
    this.http.assertSecretKey("customers.create");
    return this.http.post<Customer>("/customers/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<Customer> {
    this.http.assertSecretKey("customers.update");
    return this.http.patch<Customer>(`/customers/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<void> {
    this.http.assertSecretKey("customers.delete");
    return this.http.delete(`/customers/${id}/`);
  }

  protected _listTransactions(
    id: string,
    criteria?: TransactionCriteria
  ): Promise<ListResponse<Transaction>> {
    this.http.assertSecretKey("customers.listTransactions");
    return this.http.get<ListResponse<Transaction>>(
      `/customers/${id}/transactions/`,
      criteria
    );
  }

  protected _listPaymentMethods(id: string): Promise<ListResponse<PaymentMethod>> {
    this.http.assertSecretKey("customers.listPaymentMethods");
    return this.http.get<ListResponse<PaymentMethod>>(
      `/customers/${id}/payment-methods/`
    );
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/customers/");
  }
}