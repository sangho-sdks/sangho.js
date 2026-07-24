import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions } from "@/types/common";
import type {
  CheckoutSession,
  CreatePayloads,
  CheckoutSessionCriteria,
} from "@/types/resources/checkout-sessions";

export class CheckoutSessionsModule extends BaseModule {
  public checkoutSessions = {
    list: (criteria?: CheckoutSessionCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: CreatePayloads) => this._create(payloads),
    expire: (id: string) => this._expire(id),
    delete: (id: string) => this._delete(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: CheckoutSessionCriteria): Promise<ListResponse<CheckoutSession>> {
    this.http.assertSecretKey("checkoutSessions.list");
    return this.http.get<ListResponse<CheckoutSession>>("/checkout-sessions/", criteria);
  }

  protected _retrieve(id: string): Promise<CheckoutSession> {
    // Le backend autorise explicitement la clé publique sur cette action
    // (page de confirmation côté navigateur) — ne pas la bloquer ici.
    return this.http.get<CheckoutSession>(`/checkout-sessions/${id}/`);
  }

  protected _create(payloads: CreatePayloads): Promise<CheckoutSession> {
    this.http.assertSecretKey("checkoutSessions.create");
    return this.http.post<CheckoutSession>("/checkout-sessions/", payloads);
  }

  protected _expire(id: string): Promise<CheckoutSession> {
    this.http.assertSecretKey("checkoutSessions.expire");
    return this.http.post<CheckoutSession>(`/checkout-sessions/${id}/expire/`, {});
  }

  protected _delete(id: string): Promise<CheckoutSession> {
    this.http.assertSecretKey("checkoutSessions.delete");
    return this.http.delete<CheckoutSession>(`/checkout-sessions/${id}/`);
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/checkout-sessions/");
  }
}