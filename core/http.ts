// =============================================================================
// sangho-sdk-js — HttpClient
// =============================================================================

import {
  SanghoAuthError,
  SanghoError,
  SanghoErrorResponse,
  SanghoIdempotencyError,
  SanghoNetworkError,
  SanghoNotFoundError,
  SanghoPermissionError,
  SanghoPublicKeyError,
  SanghoRateLimitError,
  SanghoTimeoutError,
  SanghoValidationError,
} from "./errors";

export type ApiKeyType = "public" | "secret";

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  sandbox: boolean;
  apiKey: string;
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const SDK_VERSION = "__SDK_VERSION__";

export class HttpClient {
  readonly keyType: ApiKeyType;
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.keyType = config.apiKey.startsWith("pk_") ? "public" : "secret";
  }

  public assertSecretKey(methodName: string): void {
    // Si on est en clé publique (pk_), on interdit l'accès aux méthodes sensibles
    // sauf si le backend accepte aussi un Reader-Token (géré via les headers)
    if (this.keyType === "public") {
      throw new SanghoPublicKeyError(
        `The method "${methodName}" requires a Secret Key or a Terminal Session.`
      );
    }
  }

  async get<T, P extends object = object>(path: string, params?: P): Promise<T> {
    const url = this.buildURL(path, params);
    return this.request<T>("GET", url);
  }

  async post<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("POST", url, body, {
      "Idempotency-Key": idempotencyKey ?? generateUUID(),
    });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("PATCH", url, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("PUT", url, body);
  }

  async delete<T = void>(path: string): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("DELETE", url);
  }

  async options<T = any>(path: string): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("OPTIONS", url);
  }

  private buildURL<P extends object>(path: string, params?: P): string {
    const base = this.config.baseURL.replace(/\/$/, "");
    const full = `${base}${path}`;
    if (!params || Object.keys(params).length === 0) return full;

    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        search.set(k, String(v));
      }
    }
    const qs = search.toString();
    return qs ? `${full}?${qs}` : full;
  }

  private baseHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Sangho-SDK": `js/${SDK_VERSION}`,
      "X-Sangho-Environment": this.config.sandbox ? "sandbox" : "live",
      ...extra,
    };
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
    attempt = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.baseHeaders(extraHeaders),
        signal: controller.signal,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

      clearTimeout(timer);
      return await this.handleResponse<T>(response);
    } catch (err: unknown) {
      clearTimeout(timer);

      if (err instanceof SanghoError) {
        // 429 et 5xx sont transitoires → retry avec backoff exponentiel
        // (ou le délai indiqué par le serveur pour un 429). Tout le reste
        // (400/401/403/404/409/422, ...) est un problème permanent côté
        // client : on ne retry jamais, on relance immédiatement.
        if (this.isRetryable(err) && attempt < this.config.maxRetries) {
          const delay =
            err instanceof SanghoRateLimitError && err.retryAfter
              ? err.retryAfter * 1000
              : Math.pow(2, attempt) * 500;
          await this.sleep(delay);
          return this.request<T>(method, url, body, extraHeaders, attempt + 1);
        }
        throw err;
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        throw new SanghoTimeoutError(this.config.timeout);
      }

      if (err instanceof TypeError) {
        if (attempt < this.config.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 500);
          return this.request<T>(method, url, body, extraHeaders, attempt + 1);
        }
        throw new SanghoNetworkError((err as Error).message);
      }

      throw err;
    }
  }

  /**
   * Détermine si une SanghoError est transitoire et mérite un retry :
   * 429 (rate limit) ou 5xx (erreur serveur). Jamais les 4xx restants
   * (400/401/403/404/409/422) — ce sont des erreurs permanentes côté client.
   */
  private isRetryable(err: SanghoError): boolean {
    if (err instanceof SanghoRateLimitError) return true;
    return typeof err.statusCode === "number" && err.statusCode >= 500;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T;

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.ok) return data as T;

    const raw = data as Record<string, unknown>;

    const errorResponse: SanghoErrorResponse = {
      message: (raw["message"] as string) ?? (raw["detail"] as string) ?? "API error",
      type: raw["type"] as string | undefined,
      code: raw["code"] as string | undefined,
      detail: raw["detail"] as string | Record<string, string[]> | undefined,
      errors: raw["errors"] as Record<string, string[]> | undefined,
      status: response.status,
      param: raw["param"] as string | undefined,
    };

    const message = errorResponse.message;
    // Insensible à la casse : le backend envoie tantôt "PUBLIC_KEY_NOT_ALLOWED"
    // (catalogue d'erreurs DRF moderne), tantôt "public_key_not_allowed"
    // (ancien décorateur Django) selon le chemin qui a rejeté la requête.
    const code = errorResponse.code?.toLowerCase();

    switch (response.status) {
      case 401:
        throw new SanghoAuthError(message, errorResponse);
      case 403:
        if (code === "public_key_not_allowed") {
          throw new SanghoPublicKeyError(message, errorResponse);
        }
        throw new SanghoPermissionError(message, errorResponse);
      case 404:
        throw new SanghoNotFoundError(message, errorResponse);
      case 409:
        throw new SanghoIdempotencyError(errorResponse);
      case 422:
        throw new SanghoValidationError(errorResponse);
      case 429: {
        const retryAfter =
          (raw["retry_after"] as number | undefined) ??
          Number(response.headers.get("Retry-After") ?? 60);
        throw new SanghoRateLimitError(retryAfter, errorResponse);
      }
      default:
        throw new SanghoError(message, "API_ERROR", response.status, errorResponse);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}