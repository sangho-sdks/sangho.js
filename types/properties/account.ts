// =============================================================================
// sangho-sdk-js — @/types/properties/account.ts
// =============================================================================
import type { App } from "@/types/resources/apps";

export type AccountProperties = {
  /**
   * Retourne l'application liée à la clé secrète courante.
   * Nécessite une clé secrète (`sk_prod_*` ou `sk_test_*`).
   *
   * @example
   * const app = await sangho.account.retrieve()
   * console.log(app.id, app.mode)
   */
  retrieve(): Promise<App>;
};
