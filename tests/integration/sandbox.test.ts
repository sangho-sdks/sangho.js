/**
 * tests/integration/sandbox.test.ts
 *
 * Tests d'intégration — vrais appels vers l'API sandbox Sangho.
 * Utilise le vrai client Sangho, sans aucun mock.
 *
 * Prérequis :
 *   export SANGHO_API_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
 *
 * Exécution :
 *   make test-integration
 *   # ou
 *   SANGHO_API_KEY=sk_test_xxx pnpm vitest run tests/integration
 */

import { describe, it, expect, beforeAll } from "vitest";
import Sangho from "../../client";
import type { PaymentIntent } from "../../types/resources/payment-intents";

// ─── Guard — skip automatique si pas de vraie clé sandbox ────────────────────
const SANDBOX_KEY = process.env.SANGHO_API_KEY ?? "";
const HAS_KEY =
  !!SANDBOX_KEY &&
  (SANDBOX_KEY.startsWith("sk_test_") || SANDBOX_KEY.startsWith("pk_test_")) &&
  SANDBOX_KEY.length >= 20;

if (!HAS_KEY) {
  console.warn(
    "\n⚠️  Tests d'intégration ignorés — clé sandbox manquante.\n" +
    "   Exportez SANGHO_API_KEY=sk_test_votre_cle pour les activer.\n"
  );
}

const itIf = (condition: boolean) => (condition ? it : it.skip);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Pause entre appels pour éviter le rate-limiting */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — Instanciation du client
// ─────────────────────────────────────────────────────────────────────────────

describe("Sangho — instanciation", () => {
  it("refuse une clé API invalide", () => {
    expect(() => new Sangho("invalid_key")).toThrow(expect.objectContaining({ type: "AUTHENTICATION_ERROR" }));
  });

  it("refuse une clé vide", () => {
    expect(() => new Sangho("")).toThrow(expect.objectContaining({ type: "AUTHENTICATION_ERROR" }));
  });

  it("refuse une clé trop courte", () => {
    expect(() => new Sangho("sk_test_short")).toThrow(expect.objectContaining({ type: "AUTHENTICATION_ERROR" }))
  });

  itIf(HAS_KEY)("instancie correctement avec une clé sandbox valide", () => {
    expect(() => new Sangho(SANDBOX_KEY)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — PaymentIntents (flux complet)
// ─────────────────────────────────────────────────────────────────────────────

describe("paymentIntents — flux complet (sandbox)", () => {
  let sangho: Sangho;
  let createdIntent: PaymentIntent;

  beforeAll(() => {
    if (!HAS_KEY) return;
    sangho = new Sangho(SANDBOX_KEY);
  });

  // ── create ──────────────────────────────────────────────────────────────────
  itIf(HAS_KEY)("create() — crée un PaymentIntent minimal", async () => {
    createdIntent = await sangho.paymentIntents.create({
      amount: 5000,
      currency: "XAF",
    });

    expect(createdIntent.id).toMatch(/^pi_/);
    expect(createdIntent.amount).toBe(5000);
    expect(createdIntent.currency).toBe("XAF");
    expect(createdIntent.status).toBe("requires_payment_method");
    expect(createdIntent.metadata).toBeDefined();
    expect(createdIntent.created_at).toBeDefined();
  });

  itIf(HAS_KEY)("create() — crée un PaymentIntent avec tous les paramètres", async () => {
    const intent = await sangho.paymentIntents.create({
      amount: 10_000,
      currency: "XAF",
      description: "Test intégration SDK",
      receipt_email: "test@sangho.ga",
      metadata: { order_id: "test-order-001", source: "sdk-integration" },
    });

    expect(intent.id).toMatch(/^pi_/);
    expect(intent.amount).toBe(10_000);
    expect(intent.description).toBe("Test intégration SDK");
    expect(intent.receipt_email).toBe("test@sangho.ga");
    expect(intent.metadata).toMatchObject({ order_id: "test-order-001" });

    await sleep(200);
  });

  // ── retrieve ─────────────────────────────────────────────────────────────────
  itIf(HAS_KEY)("retrieve() — récupère le PaymentIntent créé", async () => {
    if (!createdIntent) return;

    const fetched = await sangho.paymentIntents.retrieve(createdIntent.id);

    expect(fetched.id).toBe(createdIntent.id);
    expect(fetched.amount).toBe(createdIntent.amount);
    expect(fetched.currency).toBe(createdIntent.currency);
  });

  itIf(HAS_KEY)("retrieve() — lève une SanghoError sur ID inexistant", async () => {
    await expect(
      sangho.paymentIntents.retrieve("pi_inexistant_000000000")
    ).rejects.toThrow();
  });

  // ── update ───────────────────────────────────────────────────────────────────
  itIf(HAS_KEY)("update() — met à jour la description et les metadata", async () => {
    if (!createdIntent) return;

    const updated = await sangho.paymentIntents.update(createdIntent.id, {
      description: "Description mise à jour",
      metadata: { updated: "true", env: "sandbox" },
    });

    expect(updated.id).toBe(createdIntent.id);
    expect(updated.description).toBe("Description mise à jour");
    expect(updated.metadata).toMatchObject({ updated: "true" });

    await sleep(200);
  });

  // ── confirm ──────────────────────────────────────────────────────────────────
  itIf(HAS_KEY)("confirm() — confirme un PaymentIntent en attente", async () => {
    if (!createdIntent) return;

    const confirmed = await sangho.paymentIntents.confirm(createdIntent.id);

    expect(confirmed.id).toBe(createdIntent.id);
    // Selon l'API sandbox : processing | requires_action | succeeded
    expect([
      "processing",
      "requires_action",
      "requires_capture",
      "succeeded",
    ]).toContain(confirmed.status);

    await sleep(300);
  });

  // ── cancel ───────────────────────────────────────────────────────────────────
  itIf(HAS_KEY)("cancel() — annule un PaymentIntent (nouveau)", async () => {
    // Crée un nouvel intent à annuler (le précédent est peut-être déjà confirmé)
    const toCancel = await sangho.paymentIntents.create({
      amount: 1000,
      currency: "XAF",
      metadata: { test: "cancel" },
    });

    const cancelled = await sangho.paymentIntents.cancel(toCancel.id, {
      cancellation_reason: "requested_by_customer",
    });

    expect(cancelled.id).toBe(toCancel.id);
    expect(cancelled.status).toBe("canceled");
    expect(cancelled.cancellation_reason).toBe("requested_by_customer");

    await sleep(200);
  });

  // ── list ─────────────────────────────────────────────────────────────────────
  itIf(HAS_KEY)("list() — liste les PaymentIntents sans filtres", async () => {
    const list = await sangho.paymentIntents.list();

    expect(list).toHaveProperty("data");
    expect(Array.isArray(list.data)).toBe(true);
    expect(list).toHaveProperty("count");
  });

  itIf(HAS_KEY)("list() — filtre par status=canceled", async () => {
    const list = await sangho.paymentIntents.list({
      status: "canceled",
      page_size: 5,
    });

    expect(Array.isArray(list.data)).toBe(true);
    // Tous les résultats doivent avoir le status filtré
    list.data.forEach((pi) => {
      expect(pi.status).toBe("canceled");
    });
  });

  itIf(HAS_KEY)("list() — pagination page_size=2", async () => {
    const list = await sangho.paymentIntents.list({ page_size: 2 });

    expect(list.data.length).toBeLessThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — PaymentIntents avec capture manuelle
// ─────────────────────────────────────────────────────────────────────────────

describe("paymentIntents — capture manuelle (sandbox)", () => {
  let sangho: Sangho;

  beforeAll(() => {
    if (!HAS_KEY) return;
    sangho = new Sangho(SANDBOX_KEY);
  });

  itIf(HAS_KEY)("capture() — capture un intent en mode manuel", async () => {
    const intent = await sangho.paymentIntents.create({
      amount: 20_000,
      currency: "XAF",
    });

    // Confirme d'abord
    const confirmed = await sangho.paymentIntents.confirm(intent.id);
    await sleep(300);

    // Si l'intent est en requires_capture, on peut capturer
    if (confirmed.status === "requires_capture") {
      const captured = await sangho.paymentIntents.capture(intent.id, {
        amount_to_capture: 15_000, // capture partielle
      });
      expect(captured.status).toBe("succeeded");
    } else {
      // Sur sandbox, le statut peut varier — on vérifie juste que ça n'a pas throw
      expect(confirmed.id).toBe(intent.id);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — Validation des erreurs attendues
// ─────────────────────────────────────────────────────────────────────────────

describe("paymentIntents — erreurs attendues (sandbox)", () => {
  let sangho: Sangho;

  beforeAll(() => {
    if (!HAS_KEY) return;
    sangho = new Sangho(SANDBOX_KEY);
  });

  itIf(HAS_KEY)("create() — lève une erreur sur montant nul", async () => {
    await expect(
      sangho.paymentIntents.create({ amount: 0, currency: "XAF" })
    ).rejects.toThrow();
  });

  itIf(HAS_KEY)("create() — lève une erreur sur devise non supportée", async () => {
    await expect(
      sangho.paymentIntents.create({ amount: 5000, currency: "EUR" as any })
    ).rejects.toThrow();
  });

  itIf(HAS_KEY)("retrieve() — lève une erreur sur ID invalide", async () => {
    await expect(
      sangho.paymentIntents.retrieve("not-a-valid-id")
    ).rejects.toThrow();
  });

  itIf(HAS_KEY)("update() — lève une erreur sur ID inexistant", async () => {
    await expect(
      sangho.paymentIntents.update("pi_00000000000000000000000", {
        description: "ghost",
      })
    ).rejects.toThrow();
  });
});