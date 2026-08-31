/**
 * tests/setup.ts
 * Configuration globale Vitest — exécuté avant chaque fichier de test
 */

import { beforeAll, afterAll, afterEach, vi, expect } from 'vitest'

// ─────────────────────────────────────────────
// Détection tests d'intégration vs tests unitaires
// ─────────────────────────────────────────────
// Ce setup.ts est chargé (setupFiles) pour TOUS les fichiers de test, y
// compris tests/integration/sandbox.test.ts qui a besoin du vrai `fetch`
// pour parler au sandbox réel. On ne doit donc JAMAIS mocker fetch ni
// écraser SANGHO_API_KEY quand une vraie clé sandbox a été exportée par
// l'appelant (cf. Makefile `test-integration` / README de sandbox.test.ts) :
//   SANGHO_API_KEY=sk_test_xxx pnpm vitest run tests/integration
const isRealIntegrationRun =
  /^(sk|pk)_test_/.test(process.env.SANGHO_API_KEY ?? '') &&
  (process.env.SANGHO_API_KEY?.length ?? 0) >= 20

// ─────────────────────────────────────────────
// Variables d'environnement de test
// ─────────────────────────────────────────────
process.env.SANGHO_ENV = 'sandbox'
process.env.SANGHO_BASE_URL = process.env.SANGHO_BASE_URL || 'https://api.sangho.ga'
process.env.SANGHO_API_VERSION = 'v1'
// Pas de clé factice committée ici : tests/unit/client.test.ts construit ses
// propres clés locales (SECRET_KEY / PUBLIC_KEY) et n'a pas besoin de
// process.env.SANGHO_API_KEY. Écraser cette variable avec une fausse valeur
// empêchait aussi tests/integration/*.test.ts de détecter correctement
// l'absence de vraie clé et de s'auto-skip.

// ─────────────────────────────────────────────
// Mock global de fetch (uniquement pour les tests unitaires)
// ─────────────────────────────────────────────
const originalFetch = global.fetch

beforeAll(() => {
  if (isRealIntegrationRun) return // tests d'intégration : on garde le vrai fetch
  // On remplace fetch par un mock vi — chaque test peut le surcharger
  global.fetch = vi.fn()
})

afterEach(() => {
  if (isRealIntegrationRun) return
  // Réinitialise tous les mocks entre chaque test
  vi.clearAllMocks()
  vi.resetAllMocks()
})

afterAll(() => {
  if (isRealIntegrationRun) return
  // Restaure le fetch original après tous les tests
  global.fetch = originalFetch
})

// ─────────────────────────────────────────────
// Helpers globaux réutilisables dans tous les tests
// ─────────────────────────────────────────────

/**
 * Simule une réponse fetch réussie (200)
 */
export function mockFetchSuccess<T>(data: T, status = 200): void {
  vi.mocked(global.fetch).mockResolvedValueOnce(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

/**
 * Simule une réponse fetch en erreur (4xx / 5xx).
 * Le payload est à plat (mêmes clés au top-level), pas imbriqué sous "error" —
 * c'est le format réellement renvoyé par l'API (cf. backend/api/exceptions.py).
 */
export function mockFetchError(status: number, body: Record<string, unknown> = {}): void {
  vi.mocked(global.fetch).mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

/**
 * Simule un échec réseau (pas de réponse du tout)
 */
export function mockFetchNetworkFailure(message = 'Network error'): void {
  vi.mocked(global.fetch).mockRejectedValueOnce(new Error(message))
}

/**
 * Vérifie que fetch a été appelé avec les bons paramètres
 */
export function expectFetchCalledWith(
  url: string,
  options?: Partial<RequestInit>
): void {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(url),
    expect.objectContaining(options ?? {})
  )
}