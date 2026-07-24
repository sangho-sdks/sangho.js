import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { SecurityProfile, UpdateSecurityProfileParams } from "@/types/resources/security";

export class SecurityModule extends BaseModule {
  public security = {
    retrieve: () => this._retrieve(),
    update: (params: UpdateSecurityProfileParams) => this._update(params),
    addAllowedIps: (ips: string[]) => this._addAllowedIps(ips),
    removeAllowedIps: (ips: string[]) => this._removeAllowedIps(ips),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _retrieve(): Promise<SecurityProfile> {
    console.log(12547)
    this.http.assertSecretKey("security.retrieve");
    return this.http.get<SecurityProfile>("/security/me/");
  }

  protected _update(params: UpdateSecurityProfileParams): Promise<SecurityProfile> {
    this.http.assertSecretKey("security.update");
    return this.http.patch<SecurityProfile>("/security/update_me/", params);
  }

  // Pas d'action dédiée côté backend pour l'ajout/retrait d'IPs : on relit le
  // profil, on recompose la liste complète, puis on la renvoie via update_me/.
  protected async _addAllowedIps(ips: string[]): Promise<SecurityProfile> {
    this.http.assertSecretKey("security.addAllowedIps");
    const profile = await this._retrieve();
    const merged = Array.from(new Set([...profile.allowed_ips, ...ips]));
    return this._update({ allowed_ips: merged });
  }

  protected async _removeAllowedIps(ips: string[]): Promise<SecurityProfile> {
    this.http.assertSecretKey("security.removeAllowedIps");
    const profile = await this._retrieve();
    const remaining = profile.allowed_ips.filter((ip) => !ips.includes(ip));
    return this._update({ allowed_ips: remaining });
  }
}
