// =============================================================================
// sangho-sdk-js — Core Errors
// Hiérarchie complète d'erreurs, calquée sur l'API DRF Sangho
// =============================================================================

/**
 * Catégorie large de l'erreur (`err.type`).
 *
 * Les 7 premières valeurs sont exactement le taxonomie `type` renvoyée par
 * le backend (cf. `backend/api/exceptions.py`) sur toute réponse HTTP
 * d'erreur. `NETWORK_ERROR` et `TIMEOUT_ERROR` sont deux catégories
 * additionnelles, propres au SDK : elles ne correspondent à aucune réponse
 * HTTP puisque la requête n'a justement jamais abouti côté serveur.
 */
export type SanghoErrorType =
  | "AUTHENTICATION_ERROR"
  | "PERMISSION_ERROR"
  | "NOT_FOUND_ERROR"
  | "CONFLICT_ERROR"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR";

const KNOWN_ERROR_TYPES: readonly SanghoErrorType[] = [
  "AUTHENTICATION_ERROR",
  "PERMISSION_ERROR",
  "NOT_FOUND_ERROR",
  "CONFLICT_ERROR",
  "VALIDATION_ERROR",
  "RATE_LIMIT_ERROR",
  "API_ERROR",
  "NETWORK_ERROR",
  "TIMEOUT_ERROR",
];

/**
 * Résout la catégorie finale d'une erreur : si le backend a renvoyé un
 * `type` reconnu dans le corps de la réponse, il prime (mapping 1:1) ;
 * sinon on retombe sur la catégorie déduite de la sous-classe utilisée.
 */
function resolveErrorType(
  defaultType: SanghoErrorType,
  raw?: SanghoErrorResponse
): SanghoErrorType {
  const backendType = raw?.type?.toUpperCase();
  if (backendType && (KNOWN_ERROR_TYPES as string[]).includes(backendType)) {
    return backendType as SanghoErrorType;
  }
  return defaultType;
}

export interface SanghoErrorResponse {
  message: string;
  type?: string;
  code?: string;
  detail?: string | Record<string, string[]>;
  errors?: Record<string, string[]>;
  status?: number;
  param?: string;
}

/**
 * Classe de base — toutes les erreurs Sangho en héritent.
 */
export class SanghoError extends Error {
  /**
   * Catégorie large de l'erreur, une des 9 valeurs `SanghoErrorType`
   * (`VALIDATION_ERROR`, `RATE_LIMIT_ERROR`, `NETWORK_ERROR`, ...).
   * Utile pour un `switch`/branchement générique.
   */
  readonly type: SanghoErrorType;
  /**
   * Code métier précis renvoyé par le backend (`raw.code`), ex :
   * `AMOUNT_TOO_SMALL`, `INSUFFICIENT_FUNDS`, `CUSTOMER_NOT_FOUND`,
   * `INVALID_API_KEY`, `CURRENCY_NOT_IN_PLAN`... Le catalogue de codes est
   * possédé et versionné côté backend et continuera de grandir — c'est
   * pourquoi ce champ est typé `string` plutôt qu'une union fermée.
   *
   * Quand l'erreur n'a jamais atteint le backend (`SanghoNetworkError`,
   * `SanghoTimeoutError` — pas de corps de réponse à lire), `code` retombe
   * sur la même valeur que `type`.
   */
  readonly code: string;
  readonly statusCode?: number;
  readonly raw?: SanghoErrorResponse;

  constructor(
    message: string,
    type: SanghoErrorType = "API_ERROR",
    statusCode?: number,
    raw?: SanghoErrorResponse
  ) {
    super(message);
    this.name = "SanghoError";
    this.type = resolveErrorType(type, raw);
    this.code = raw?.code ?? this.type;
    this.statusCode = statusCode;
    this.raw = raw;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// @/core/errors.ts

/**
 * 401 — Clé API invalide, expirée ou absente.
 */
export class SanghoAuthError extends SanghoError {
  constructor(
    message = "Invalid or missing API key.",
    raw?: SanghoErrorResponse
  ) {
    super(message, "AUTHENTICATION_ERROR", 401, raw);
    this.name = "SanghoAuthError";
  }
}

/**
 * 403 — Clé publique utilisée pour une opération réservée aux clés secrètes.
 * Catégorie (`type`) : `PERMISSION_ERROR` — c'est bien un problème de
 * permission ; `code` reste `PUBLIC_KEY_NOT_ALLOWED` (ou équivalent envoyé
 * par le backend) pour distinguer précisément ce cas des autres 403.
 */
export class SanghoPublicKeyError extends SanghoError {
  constructor(message = "Public key not allowed for this operation.", raw?: SanghoErrorResponse) {
    super(
      message,
      "PERMISSION_ERROR",
      403,
      raw  // ← raw transmis
    );
    this.name = "SanghoPublicKeyError";
  }
}

/**
 * 403 — Permissions insuffisantes.
 */
export class SanghoPermissionError extends SanghoError {
  constructor(message = "You do not have permission to perform this action.", raw?: SanghoErrorResponse) {
    super(message, "PERMISSION_ERROR", 403, raw);  // ← raw transmis
    this.name = "SanghoPermissionError";
  }
}

/**
 * 404 — Ressource introuvable.
 */
export class SanghoNotFoundError extends SanghoError {
  constructor(message = "Resource not found.", raw?: SanghoErrorResponse) {
    super(message, "NOT_FOUND_ERROR", 404, raw);
    this.name = "SanghoNotFoundError";
  }
}

/**
 * 422 — Données invalides (erreurs de validation champ par champ).
 */
export class SanghoValidationError extends SanghoError {
  readonly fieldErrors: Record<string, string[]>;
  readonly param?: string;

  constructor(raw: SanghoErrorResponse) {
    const fields =
      typeof raw.detail === "object"
        ? raw.detail
        : (raw.errors ?? {});
    const summary = Object.entries(fields)
      .map(([k, v]) => `${k}: ${v.join(", ")}`)
      .join(" | ");
    super(summary || raw.message || "Validation error", "VALIDATION_ERROR", 422, raw);
    this.name = "SanghoValidationError";
    this.fieldErrors = fields as Record<string, string[]>;
  }
}

/**
 * 429 — Trop de requêtes. `retryAfter` indique le délai (secondes) avant retry.
 */
export class SanghoRateLimitError extends SanghoError {
  readonly retryAfter?: number;

  constructor(retryAfter?: number, raw?: SanghoErrorResponse) {
    super(
      raw?.message ??
        `Rate limit exceeded.${retryAfter ? ` Retry after ${retryAfter}s.` : ""}`,
      "RATE_LIMIT_ERROR",
      429,
      raw
    );
    this.name = "SanghoRateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * 409 — Clé d'idempotence réutilisée avec un payload différent.
 * Catégorie (`type`) : `CONFLICT_ERROR` — même famille que les autres 409.
 */
export class SanghoIdempotencyError extends SanghoError {
  constructor(raw?: SanghoErrorResponse) {
    super(
      "Idempotency key reused with different request parameters.",
      "CONFLICT_ERROR",
      409,
      raw
    );
    this.name = "SanghoIdempotencyError";
  }
}

/**
 * Erreur réseau (pas de réponse du serveur). Catégorie SDK-only : la requête
 * n'a jamais atteint le backend, donc pas de `raw`/`code` métier précis —
 * `code` retombe sur `NETWORK_ERROR` (== `type`).
 */
export class SanghoNetworkError extends SanghoError {
  constructor(message = "Network error. Please check your connection.") {
    super(message, "NETWORK_ERROR");
    this.name = "SanghoNetworkError";
  }
}

/**
 * Timeout dépassé. Catégorie SDK-only, même raisonnement que
 * `SanghoNetworkError` : `code` retombe sur `TIMEOUT_ERROR` (== `type`).
 */
export class SanghoTimeoutError extends SanghoError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms.`, "TIMEOUT_ERROR");
    this.name = "SanghoTimeoutError";
  }
}
