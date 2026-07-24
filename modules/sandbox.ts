// =============================================================================
// sangho-sdk-js — @/modules/sandbox.ts
// =============================================================================
import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { SandboxResetResult } from "@/types/resources/sandbox";

export class SandboxModule extends BaseModule {
  public sandbox = {
    reset: () => this._reset(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  /**
   * Supprime toutes les données sandbox de l'application courante (customers,
   * products, payment_intents, transactions, refunds, invoices,
   * checkout_sessions, subscriptions, payment_methods, receipts).
   *
   * L'app elle-même, ses clés API et ses paramètres sont conservés.
   * Bloqué par le backend si la clé utilisée est une clé live (`sk_prod_*`).
   *
   * @example
   * await sangho.sandbox.reset()
   */
  protected _reset(): Promise<SandboxResetResult> {
    this.http.assertSecretKey("sandbox.reset");
    return this.http.post<SandboxResetResult>("/reset/", {});
  }
}
