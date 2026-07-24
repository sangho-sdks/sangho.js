// =============================================================================
// sangho-sdk-js — @/types/resources/sandbox.ts
// =============================================================================

/** Résultat de la purge des données sandbox — voir SandboxModule.reset(). */
export interface SandboxResetResult {
  object: "sandbox.reset";
  /** Nombre d'enregistrements supprimés par modèle (ex: `{ customer: 12, product: 5 }`) */
  deleted: Record<string, number>;
  total_deleted: number;
  errors: string[];
}
