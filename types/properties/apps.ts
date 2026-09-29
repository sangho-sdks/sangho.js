import type { RequestOptions } from "@/types/common";

// =============================================================================
// sangho-sdk-js — @/types/properties/apps.ts
// =============================================================================
import type { App, AppCriteria, AppKeys, Payloads } from "@/types/resources/apps";
import { DRFOptions } from "@/types/common";

export type AppsProperties = {
  /**
   * Liste toutes les applications de l'owner authentifié.
   * Si `criteria` est fourni, filtre les apps par les champs indiqués
   * (transmis en query params). Sans critères, retourne tout.
   *
   * @param criteria - Filtres optionnels ex: `{ is_active: true, mode: "prod" }`
   * @returns Tableau des apps correspondant aux critères
   *
   * @example
   * const all  = await sangho.apps.list()
   * const prod = await sangho.apps.list({ mode: "prod", is_active: true })
   */
  list(criteria?: AppCriteria): Promise<App[]>;

  /**
   * Récupère une application par son identifiant.
   *
   * @param id - Identifiant de l'application (ex: `"app_xxx"`)
   * @returns Les données de l'application
   *
   * @example
   * const app = await sangho.apps.retrieve("app_xxx")
   * console.log(app.mode) // "test" | "prod"
   */
  retrieve(id: string): Promise<App>;

  /**
   * Crée une nouvelle application.
   * Si une app portant le même `name` existe déjà pour cet owner,
   * le backend la retourne telle quelle (idempotent, HTTP 200).
   *
   * @param payloads - Champs de création (`name` recommandé)
   * @returns L'application créée (HTTP 201) ou existante (HTTP 200)
   *
   * @example
   * const app = await sangho.apps.create({ name: "Mon App" })
   */
  create(payloads: Payloads, options?: RequestOptions): Promise<App>;

  /**
   * Met à jour les paramètres de l'application (mise à jour partielle).
   * La modification est propagée en sandbox et en live automatiquement.
   *
   * @param id      - Identifiant de l'application
   * @param payloads - Champs à modifier (tous optionnels)
   * @returns L'application mise à jour
   *
   * @example
   * const app = await sangho.apps.update("app_xxx", {
   *   name: "Mon App v2",
   *   allowed_hosts: ["mon-site.com"],
   * })
   */
  update(id: string, payloads: Payloads): Promise<App>;

  /**
   * Suppression douce (soft-delete) de l'application.
   * L'app est marquée `is_ready_to_delete` et purgée définitivement
   * après un délai configuré côté backend.
   *
   * @param id - Identifiant de l'application
   *
   * @example
   * await sangho.apps.delete("app_xxx")
   */
  delete(id: string): Promise<void>;

  /**
   * Récupère les clés publique et secrète de l'application.
   * Les valeurs retournées sont partiellement obfusquées
   * (13 caractères visibles, reste masqué).
   *
   * @param id - Identifiant de l'application
   * @returns `{ pk: AppKey, sk: AppKey }`
   *
   * @example
   * const { pk, sk } = await sangho.apps.keys("app_xxx")
   * console.log(pk.value) // "apk_live_xxxxx..."
   */
  keys(id: string): Promise<AppKeys>;

  /**
   * Retourne les métadonnées DRF du endpoint `/apps/` :
   * actions autorisées, schéma de champs, formats acceptés.
   * N'exige pas d'authentification (découverte de schéma).
   */
  options(): Promise<DRFOptions>;
};