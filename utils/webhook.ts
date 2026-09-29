// =============================================================================
// sangho-sdk-js — Vérification des signatures Webhook
// Permet de valider que les événements reçus proviennent bien de Sangho.
// Compatible navigateur (SubtleCrypto) ET Node.js (crypto).
//
// Schéma : en-tête `Sangho-Signature: t=<timestamp>,v1=<hex>[,v1=<hex>…]` avec
//   v1 = HMAC-SHA256(secret, "<timestamp>.<corps brut>") en hexadécimal minuscule.
// Plusieurs `v1` (et plusieurs secrets) sont acceptés pour permettre la rotation d'un secret sans interruption.
// =============================================================================

import { SanghoError, SanghoWebhookSignatureError } from "@/core/errors";
import type { WebhookEvent } from "@/types/resources/webhooks";

const TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Vérifie la signature HMAC-SHA256 d'un événement webhook Sangho et retourne l'événement.
 *
 * Lève `SanghoWebhookSignatureError` (`reason` : `malformed`, `expired` ou `mismatch`) si la signature est refusée.
 * Le corps doit être le corps BRUT reçu (avant tout parsing JSON).
 *
 * @param secret    - Secret du webhook, ou liste de secrets pendant une rotation
 * @param tolerance - Écart maximal d'horodatage en secondes (défaut : 300)
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
 * if (event.type === 'kyc.updated') {
 *   const account = event.data.object // typé : ConnectAccount
 * }
 * ```
 */
export async function constructEvent(
  payload: string | Uint8Array,
  signature: string,
  secret: string | string[],
  tolerance = TOLERANCE_SECONDS
): Promise<WebhookEvent> {
  const rawPayload = typeof payload === "string"
    ? new TextEncoder().encode(payload)
    : payload;

  const { timestamp, signatures } = parseHeader(signature);

  // Rejet des replays (événements trop anciens) et des horodatages du futur
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    throw new SanghoWebhookSignatureError(
      "expired",
      `Webhook timestamp outside the tolerance (${Math.abs(now - timestamp)}s > ${tolerance}s). Possible replay attack.`
    );
  }

  // Calcul HMAC-SHA256 sur "<t>.<corps brut>" ; au moins un v1 doit correspondre à au moins un secret
  const signedPayload = `${timestamp}.${new TextDecoder().decode(rawPayload)}`;
  const secrets = (Array.isArray(secret) ? secret : [secret]).filter(Boolean);
  let matched = false;
  for (const candidate of secrets) {
    const computed = await hmacSha256(candidate, signedPayload);
    // pas de court-circuit : le temps ne dépend pas du v1 qui correspond
    for (const received of signatures) {
      if (timingSafeEqual(computed, received)) matched = true;
    }
  }
  if (!matched) {
    throw new SanghoWebhookSignatureError("mismatch", "Webhook signature mismatch. Verify your webhook secret.");
  }

  // Parse et retourne le payload validé
  try {
    return JSON.parse(new TextDecoder().decode(rawPayload)) as WebhookEvent;
  } catch {
    throw new SanghoError("Webhook body is not valid JSON.", "API_ERROR", 400);
  }
}

/**
 * Génère un en-tête `Sangho-Signature` valide pour tester votre endpoint (tests unitaires d'intégrateur).
 *
 * @example
 * ```typescript
 * const header = await generateTestHeader(body, 'whsec_test')
 * await request(app).post('/webhooks/sangho').set('Sangho-Signature', header).send(body)
 * ```
 */
export async function generateTestHeader(
  payload: string | Uint8Array,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): Promise<string> {
  const body = typeof payload === "string" ? payload : new TextDecoder().decode(payload);
  return `t=${timestamp},v1=${await hmacSha256(secret, `${timestamp}.${body}`)}`;
}

// ─── Internals ────────────────────────────────────────────────────────────────

function parseHeader(header: string): { timestamp: number; signatures: string[] } {
  const malformed = () => new SanghoWebhookSignatureError("malformed", "Invalid Sangho-Signature header format.");
  if (typeof header !== "string" || !header) throw malformed();

  let timestamp: number | undefined;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "t") {
      if (!/^\d+$/.test(value)) throw malformed();
      timestamp = Number(value);
    } else if (key === "v1" && value) {
      signatures.push(value);
    }
  }
  if (timestamp === undefined || signatures.length === 0) throw malformed();
  return { timestamp, signatures };
}

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
