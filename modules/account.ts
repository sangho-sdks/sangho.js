// =============================================================================
// sangho-sdk-js — @/modules/account.ts
// =============================================================================
import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { App } from "@/types/resources/apps";

export class AccountModule extends BaseModule {
  public account = {
    retrieve: () => this._retrieve(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  /**
   * Retourne l'application associée à la clé secrète utilisée pour la requête.
   * Équivalent de `apps.retrieve(id)` sans avoir à connaître l'ID au préalable —
   * pratique comme "who am I" / health-check d'introspection.
   */
  protected _retrieve(): Promise<App> {
    this.http.assertSecretKey("account.retrieve");
    return this.http.get<App>("/account/");
  }
}
