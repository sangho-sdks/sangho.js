/**
 * tests/setup.ts
 * Configuration globale Vitest — exécuté avant chaque fichier de test
 */

import { beforeAll, afterAll, afterEach, vi, expect } from 'vitest'

// ─────────────────────────────────────────────
// Variables d'environnement de test
// ─────────────────────────────────────────────
process.env.SANGHO_ENV = 'sandbox'
process.env.SANGHO_BASE_URL = 'https://api.sangho.com'
process.env.SANGHO_API_VERSION = 'v1'
process.env.SANGHO_API_KEY = 'sk_test_eQzcjDg760wBNF2OzFd6nSr49wFWEEG0Tc7jjTZZIB0'

// ─────────────────────────────────────────────
// Mock global de fetch (pas de vrais appels réseau en unit)
// ─────────────────────────────────────────────
const originalFetch = global.fetch

beforeAll(() => {
  // On remplace fetch par un mock vi — chaque test peut le surcharger
  global.fetch = vi.fn()
})

afterEach(() => {
  // Réinitialise tous les mocks entre chaque test
  vi.clearAllMocks()
  vi.resetAllMocks()
})

afterAll(() => {
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
