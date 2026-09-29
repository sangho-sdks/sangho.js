import type { RequestOptions } from "@/types/common";

// =============================================================================
// sangho-sdk-js — @/modules/apps.ts
// =============================================================================
import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { App, AppCriteria, AppKeys, Payloads } from "@/types/resources/apps";
import { DRFOptions } from "@/types/common";

export class AppsModule extends BaseModule {
  public apps = {
    list: (criteria?: AppCriteria) => this._list(criteria),
    retrieve: (id: string) => this._retrieve(id),
    create: (payloads: Payloads, options?: RequestOptions) => this._create(payloads, options),
    update: (id: string, payloads: Payloads) => this._update(id, payloads),
    delete: (id: string) => this._delete(id),
    keys: (id: string) => this._keys(id),
    options: () => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: AppCriteria): Promise<App[]> {
    this.http.assertSecretKey("apps.list");
    return this.http.get<App[]>("/apps/", criteria);
  }

  protected _retrieve(id: string): Promise<App> {
    this.http.assertSecretKey("apps.retrieve");
    return this.http.get<App>(`/apps/${id}/`);
  }

  protected _create(payloads: Payloads, options?: RequestOptions): Promise<App> {
    this.http.assertSecretKey("apps.create");
    return this.http.post<App>("/apps/", payloads, options?.idempotencyKey);
  }

  protected _update(id: string, payloads: Payloads): Promise<App> {
    this.http.assertSecretKey("apps.update");
    return this.http.patch<App>(`/apps/${id}/`, payloads);
  }

  protected _delete(id: string): Promise<void> {
    this.http.assertSecretKey("apps.delete");
    return this.http.delete(`/apps/${id}/`);
  }

  protected _keys(id: string): Promise<AppKeys> {
    this.http.assertSecretKey("apps.keys");
    return this.http.get<AppKeys>(`/apps/${id}/keys/`);
  }

  protected _options(): Promise<DRFOptions> {
    return this.http.options<DRFOptions>("/apps/");
  }
}