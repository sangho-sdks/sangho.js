/**
 * tests/unit/client.test.ts
 * Tests unitaires du client réel (Sangho / HttpClient / hiérarchie d'erreurs).
 *
 * Ancienne version : redéfinissait une classe `SanghoClient` locale et ne
 * couvrait donc aucune ligne du SDK réellement livré. Cette version importe
 * le vrai client depuis "../../index" et mocke uniquement `fetch`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockFetchSuccess, mockFetchError, mockFetchNetworkFailure } from '../setup'
import Sangho, {
  SanghoError,
  SanghoAuthError,
  SanghoNotFoundError,
  SanghoPublicKeyError,
  SanghoRateLimitError,
  SanghoValidationError,
} from '../../index'

const SECRET_KEY = 'sk_test_aaaaaaaaaaaaaaaaaaaaaaaa'
const PUBLIC_KEY = 'pk_test_aaaaaaaaaaaaaaaaaaaaaaaa'
const EMPTY_LIST = { count: 0, next: null, previous: null, data: [] }

describe('Sangho — instanciation', () => {
  it('accepte une clé secrète valide', () => {
    expect(() => new Sangho(SECRET_KEY)).not.toThrow()
  })

  it('accepte une clé publique valide', () => {
    expect(() => new Sangho(PUBLIC_KEY)).not.toThrow()
  })

  it('refuse une clé vide', () => {
    expect(() => new Sangho('')).toThrow(SanghoError)
  })

  it('refuse un préfixe de clé invalide', () => {
    expect(() => new Sangho('invalid_key_xxxxxxxxxxxx')).toThrow(SanghoError)
  })

  it('refuse une clé trop courte', () => {
    expect(() => new Sangho('sk_test_short')).toThrow(SanghoError)
  })

  it('refuse un baseURL non-HTTPS', () => {
    expect(() => new Sangho(SECRET_KEY, { baseURL: 'http://api.sangho.ga/v1' })).toThrow(SanghoError)
  })

  it('accepte un baseURL http sur localhost (développement)', () => {
    expect(() => new Sangho(SECRET_KEY, { baseURL: 'http://localhost:8000/v1' })).not.toThrow()
  })
})

describe('Sangho — requêtes HTTP', () => {
  it('envoie les bons en-têtes sur une requête GET', async () => {
    mockFetchSuccess(EMPTY_LIST)
    const sangho = new Sangho(SECRET_KEY)

    await sangho.customers.list()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json',
          'X-Sangho-Environment': 'sandbox',
        }),
      })
    )
  })

  it('sérialise le body en JSON et ajoute une Idempotency-Key sur POST', async () => {
    mockFetchSuccess({ id: 'cust_123', object: 'customer' }, 201)
    const sangho = new Sangho(SECRET_KEY)

    await sangho.customers.create({ name: 'Jean Dupont', email: 'jean@example.com' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Jean Dupont', email: 'jean@example.com' }),
        headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }),
      })
    )
  })

  it('bascule X-Sangho-Environment sur "live" pour une clé de production', async () => {
    mockFetchSuccess(EMPTY_LIST)
    const sangho = new Sangho('sk_prod_aaaaaaaaaaaaaaaaaaaaaaaa')

    await sangho.customers.list()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Sangho-Environment': 'live' }) })
    )
  })
})

describe('Sangho — pagination (régression : la clé est `data`, pas `results`)', () => {
  it('expose les résultats sous `data`', async () => {
    mockFetchSuccess({ count: 1, next: null, previous: null, data: [{ id: 'cust_1' }] })
    const sangho = new Sangho(SECRET_KEY)

    const list = await sangho.customers.list()

    expect(list.data).toHaveLength(1)
    expect((list as unknown as { results?: unknown }).results).toBeUndefined()
  })
})

describe('Sangho — mapping des erreurs', () => {
  let sangho: Sangho

  beforeEach(() => {
    sangho = new Sangho(SECRET_KEY, { maxRetries: 0 })
  })

  it('401 → SanghoAuthError, .type = catégorie, .code = code métier précis du backend', async () => {
    mockFetchError(401, { code: 'INVALID_API_KEY', message: 'Clé API invalide.' })
    await expect(sangho.customers.list()).rejects.toBeInstanceOf(SanghoAuthError)

    mockFetchError(401, { code: 'INVALID_API_KEY', message: 'Clé API invalide.' })
    await expect(sangho.customers.list()).rejects.toMatchObject({
      type: 'AUTHENTICATION_ERROR',
      code: 'INVALID_API_KEY',
    })
  })

  it("404 → SanghoNotFoundError porte le message du backend, sans le déformer", async () => {
    mockFetchError(404, { message: "Aucun(e) Customer avec l'identifiant 'cust_x'." })

    await expect(sangho.customers.retrieve('cust_x')).rejects.toMatchObject({
      type: 'NOT_FOUND_ERROR',
      // Pas de `code` métier précis renvoyé par le backend ici → fallback sur `type`.
      code: 'NOT_FOUND_ERROR',
      message: "Aucun(e) Customer avec l'identifiant 'cust_x'.",
    })
  })

  it('422 → SanghoValidationError expose les erreurs par champ', async () => {
    mockFetchError(422, { message: 'Les données fournies sont invalides.', errors: { email: ['obligatoire'] } })

    await expect(sangho.customers.create({ name: 'x', email: '' })).rejects.toBeInstanceOf(SanghoValidationError)
  })

  it('429 → SanghoRateLimitError lit `retry_after` (pas `retry_later`)', async () => {
    mockFetchError(429, { message: 'Trop de requêtes.', retry_after: 42 })

    let err: unknown
    try {
      await sangho.customers.list()
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(SanghoRateLimitError)
    expect((err as SanghoRateLimitError).retryAfter).toBe(42)
  })

  it('403 avec code public_key_not_allowed en minuscules OU majuscules → SanghoPublicKeyError', async () => {
    mockFetchError(403, { code: 'PUBLIC_KEY_NOT_ALLOWED', message: 'Clé secrète requise.' })
    await expect(sangho.customers.list()).rejects.toBeInstanceOf(SanghoPublicKeyError)
  })

  it('403 public_key_not_allowed : .type = PERMISSION_ERROR (catégorie), .code = PUBLIC_KEY_NOT_ALLOWED (précis)', async () => {
    mockFetchError(403, { code: 'PUBLIC_KEY_NOT_ALLOWED', message: 'Clé secrète requise.' })
    await expect(sangho.customers.list()).rejects.toMatchObject({
      type: 'PERMISSION_ERROR',
      code: 'PUBLIC_KEY_NOT_ALLOWED',
    })
  })

  it('panne réseau → rejette (sans retry, maxRetries: 0)', async () => {
    mockFetchNetworkFailure('fetch failed')
    await expect(sangho.customers.list()).rejects.toThrow()
  })
})

describe('Sangho — retry automatique sur erreurs transitoires (429 / 5xx)', () => {
  afterEach(() => {
    // Toujours restaurer les vrais timers, même si un test échoue avant
    // d'appeler useRealTimers() lui-même. `restoreAllMocks()` est indispensable
    // en plus de `useRealTimers()` : le premier test fait un `vi.spyOn(globalThis,
    // 'setTimeout')` qui, sans restauration explicite, survit à `useRealTimers()`
    // et à `vi.resetAllMocks()` (setup.ts) — resetAllMocks() vide juste
    // l'implémentation du spy au lieu de rendre le vrai `setTimeout` global,
    // ce qui cassait tous les tests suivants avec "setTimeout is not defined".
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('429 → retry après le délai `retry_after` du serveur (pas le backoff exponentiel)', async () => {
    vi.useFakeTimers()
    const sangho = new Sangho(SECRET_KEY, { maxRetries: 3 })
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    mockFetchError(429, { message: 'Trop de requêtes.', retry_after: 5 })
    mockFetchSuccess(EMPTY_LIST)

    const promise = sangho.customers.list()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toEqual([])
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Le délai utilisé doit être retry_after (5s → 5000ms), jamais le backoff
    // exponentiel qu'aurait donné Math.pow(2, 0) * 500 = 500ms.
    const delays = setTimeoutSpy.mock.calls.map(([, ms]) => ms)
    expect(delays).toContain(5000)
    expect(delays).not.toContain(500)
  })

  it('500 → retry avec backoff exponentiel puis succès', async () => {
    vi.useFakeTimers()
    const sangho = new Sangho(SECRET_KEY, { maxRetries: 3 })

    mockFetchError(500, { message: 'Erreur serveur.' })
    mockFetchSuccess(EMPTY_LIST)

    const promise = sangho.customers.list()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toEqual([])
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it.each([400, 401, 403, 404, 422])(
    '%i → ne retry jamais, même avec maxRetries > 0 (erreur permanente côté client)',
    async (status) => {
      const sangho = new Sangho(SECRET_KEY, { maxRetries: 3 })
      mockFetchError(status, { message: 'Erreur permanente.' })

      await expect(sangho.customers.list()).rejects.toBeInstanceOf(SanghoError)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    }
  )

  it('429 persistant → épuise maxRetries puis rejette la dernière SanghoRateLimitError', async () => {
    vi.useFakeTimers()
    const sangho = new Sangho(SECRET_KEY, { maxRetries: 2 })

    mockFetchError(429, { message: 'Trop de requêtes (1).', retry_after: 1 })
    mockFetchError(429, { message: 'Trop de requêtes (2).', retry_after: 1 })
    mockFetchError(429, { message: 'Trop de requêtes (3, finale).', retry_after: 1 })

    const promise = sangho.customers.list()
    await vi.runAllTimersAsync()
    await expect(promise).rejects.toBeInstanceOf(SanghoRateLimitError)
    await expect(promise).rejects.toMatchObject({ message: expect.stringContaining('finale') })
    // 1 appel initial + 2 retries (maxRetries: 2)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('500 persistant → épuise maxRetries puis rejette la dernière SanghoError', async () => {
    vi.useFakeTimers()
    const sangho = new Sangho(SECRET_KEY, { maxRetries: 2 })

    mockFetchError(500, { message: 'Erreur serveur (1).' })
    mockFetchError(500, { message: 'Erreur serveur (2).' })
    mockFetchError(500, { message: 'Erreur serveur (3, finale).' })

    const promise = sangho.customers.list()
    await vi.runAllTimersAsync()
    await expect(promise).rejects.toMatchObject({ message: 'Erreur serveur (3, finale).' })
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})

describe('Sangho — clé publique vs clé secrète', () => {
  it('assertSecretKey bloque un appel réservé aux clés secrètes', () => {
    const sangho = new Sangho(PUBLIC_KEY)
    // assertSecretKey lève de façon synchrone, avant même la création d'une
    // Promise — pas un rejet asynchrone.
    expect(() => sangho.customers.list()).toThrow(SanghoPublicKeyError)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("checkoutSessions.retrieve() n'est PAS bloqué pour une clé publique (régression)", async () => {
    mockFetchSuccess({ id: 'cs_123', object: 'checkout_session', status: 'open' })
    const sangho = new Sangho(PUBLIC_KEY)

    await expect(sangho.checkoutSessions.retrieve('cs_123')).resolves.toMatchObject({ id: 'cs_123' })
  })
})

describe('Sangho — module security (régression : sangho.security existe et pointe vers les bonnes routes)', () => {
  it('sangho.security existe et expose les 4 méthodes attendues', () => {
    const sangho = new Sangho(SECRET_KEY)
    expect(sangho.security).toBeDefined()
    expect(typeof sangho.security?.retrieve).toBe('function')
    expect(typeof sangho.security?.update).toBe('function')
    expect(typeof sangho.security?.addAllowedIps).toBe('function')
    expect(typeof sangho.security?.removeAllowedIps).toBe('function')
  })

  it('retrieve() appelle GET /security/me/', async () => {
    mockFetchSuccess({ id: 'sec_1', allowed_ips: [] })
    const sangho = new Sangho(SECRET_KEY)

    await sangho.security!.retrieve()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/security/me/'),
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('update() appelle PATCH /security/update_me/', async () => {
    mockFetchSuccess({ id: 'sec_1', allowed_ips: [] })
    const sangho = new Sangho(SECRET_KEY)

    await sangho.security!.update({ require_3ds: true })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/security/update_me/'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('addAllowedIps() relit le profil puis PATCH la liste fusionnée', async () => {
    mockFetchSuccess({ id: 'sec_1', allowed_ips: ['10.0.0.1'] })
    mockFetchSuccess({ id: 'sec_1', allowed_ips: ['10.0.0.1', '10.0.0.2'] })
    const sangho = new Sangho(SECRET_KEY)

    const profile = await sangho.security!.addAllowedIps(['10.0.0.2'])

    expect(profile.allowed_ips).toEqual(['10.0.0.1', '10.0.0.2'])
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/security/update_me/'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ allowed_ips: ['10.0.0.1', '10.0.0.2'] }),
      })
    )
  })
})

describe('Sangho — modules account et sandbox (endpoints manquants ajoutés)', () => {
  it('account.retrieve() appelle GET /account/', async () => {
    mockFetchSuccess({ id: 'app_123', object: 'app' })
    const sangho = new Sangho(SECRET_KEY)

    await sangho.account!.retrieve()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/account/'),
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('sandbox.reset() appelle POST /reset/', async () => {
    mockFetchSuccess({ object: 'sandbox.reset', deleted: {}, total_deleted: 0, errors: [] })
    const sangho = new Sangho(SECRET_KEY)

    await sangho.sandbox!.reset()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reset/'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
