// =============================================================================
// sangho-sdk-js — Vérification des signatures Webhook
// Permet de valider que les événements reçus proviennent bien de Sangho.
// Compatible navigateur (SubtleCrypto) ET Node.js (crypto).
// =============================================================================

import { SanghoError } from "@/core/errors";

const TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Vérifie la signature HMAC-SHA256 d'un événement webhook Sangho.
 *
 * @example
 * ```typescript
 * // `constructEvent` est une méthode statique de `Sangho`, pas une méthode
 * // d'instance sur `sangho.webhooks` — pas besoin d'avoir instancié le client.
 * const event = await Sangho.constructEvent(
 *   rawBody,
 *   request.headers['sangho-signature'],
 *   'whsec_xxxxx'
 * )
 * ```
 */
export async function constructEvent<T = unknown>(
  payload: string | Uint8Array,
  signature: string,
  secret: string,
  tolerance = TOLERANCE_SECONDS
): Promise<{ id: string; type: string; created: number; data: T }> {
  const rawPayload = typeof payload === "string"
    ? new TextEncoder().encode(payload)
    : payload;

  // Format header: t=timestamp,v1=signature
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const idx = part.indexOf("=");
      return [part.slice(0, idx), part.slice(idx + 1)];
    })
  );

  const timestamp = Number(parts["t"]);
  const expectedSig = parts["v1"];

  if (!timestamp || !expectedSig) {
    throw new SanghoError(
      "Invalid Sangho-Signature header format.",
      "API_ERROR"
    );
  }

  // Rejet des replays (événements trop anciens)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    throw new SanghoError(
      `Webhook timestamp too old (${Math.abs(now - timestamp)}s). ` +
        `Possible replay attack. Tolerance is ${tolerance}s.`,
      "API_ERROR"
    );
  }

  // Calcul HMAC-SHA256
  const signedPayload = `${timestamp}.${new TextDecoder().decode(rawPayload)}`;
  const computedSig = await hmacSha256(secret, signedPayload);

  if (!timingSafeEqual(computedSig, expectedSig)) {
    throw new SanghoError(
      "Webhook signature mismatch. Verify your webhook secret.",
      "AUTHENTICATION_ERROR",
      401
    );
  }

  // Parse et retourne le payload validé
  const body = JSON.parse(new TextDecoder().decode(rawPayload));
  return body as { id: string; type: string; created: number; data: T };
}

// ─── Internals ────────────────────────────────────────────────────────────────

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();

  if (typeof crypto !== "undefined" && crypto.subtle) {
    // Navigateur ou Node.js 18+
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback Node.js (import dynamique pour ne pas casser le bundle navigateur)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHmac } = await import("crypto");
  return createHmac("sha256", secret).update(message).digest("hex");
}

/**
 * Comparaison en temps constant pour éviter les timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
