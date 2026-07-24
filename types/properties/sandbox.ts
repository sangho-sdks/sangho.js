// =============================================================================
// sangho-sdk-js — @/types/properties/sandbox.ts
// =============================================================================
import type { SandboxResetResult } from "@/types/resources/sandbox";

export type SandboxProperties = {
  /**
   * Purge toutes les données sandbox de l'application (clé test uniquement).
   *
   * @example
   * await sangho.sandbox.reset()
   */
  reset(): Promise<SandboxResetResult>;
};
