/**
 * tests/unit/connect.test.ts
 * Marketplace / Connect : comptes vendeurs, KYC hébergé par Sangho, clé d'idempotence exposée.
 */
import { describe, it, expect, vi } from 'vitest'
import { mockFetchSuccess, mockFetchError } from '../setup'
import Sangho, {
  SanghoConflictError,
  SanghoIdempotencyError,
  SanghoNotFoundError,
  SanghoPublicKeyError,
  SanghoValidationError,
} from '../../index'

const SECRET_KEY = 'sk_test_aaaaaaaaaaaaaaaaaaaaaaaa'
const PUBLIC_KEY = 'pk_test_aaaaaaaaaaaaaaaaaaaaaaaa'
const ACCOUNT_ID = 'acct_' + 'a'.repeat(32)

const account = {
  id: ACCOUNT_ID, object: 'account', external_id: 'seller-1', email: 'ada@example.com', business_name: 'Boutique Ada',
  status: 'pending_claim', charges_enabled: false, payouts_enabled: false, kyc_level: 0, livemode: false, created: 1780000000,
}

function lastCall() {
  const [url, init] = vi.mocked(global.fetch).mock.calls.at(-1) as [string, RequestInit]
  return { url, method: init.method, body: init.body ? JSON.parse(init.body as string) : undefined, headers: init.headers as Record<string, string> }
}

describe('connect.accounts', () => {
  it('create : POST /connect/accounts/ avec le claim_token de la création', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess({ ...account, claim_token: 'tok_xxx' }, 201)
    const created = await sangho.connect.accounts.create({ external_id: 'seller-1', email: 'ada@example.com', business_name: 'Boutique Ada' })
    const call = lastCall()
    expect(call.method).toBe('POST')
    expect(call.url).toMatch(/\/connect\/accounts\/$/)
    expect(call.body).toEqual({ external_id: 'seller-1', email: 'ada@example.com', business_name: 'Boutique Ada' })
    expect(created.claim_token).toBe('tok_xxx')
  })

  it('create : la clé d\'idempotence fournie est envoyée telle quelle', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess(account)
    await sangho.connect.accounts.create({ external_id: 'seller-1', email: 'ada@example.com' }, { idempotencyKey: 'connect-account-seller-1' })
    expect(lastCall().headers['Idempotency-Key']).toBe('connect-account-seller-1')
  })

  it('create : sans clé fournie, une clé est générée', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess(account)
    await sangho.connect.accounts.create({ external_id: 'seller-1', email: 'ada@example.com' })
    expect(lastCall().headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('retrieve : GET /connect/accounts/{id}/', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess({ ...account, status: 'active', charges_enabled: true, kyc_level: 1 })
    const result = await sangho.connect.accounts.retrieve(ACCOUNT_ID)
    expect(lastCall().url).toMatch(new RegExp(`/connect/accounts/${ACCOUNT_ID}/$`))
    expect(result.charges_enabled).toBe(true)
  })

  it('list : GET /connect/accounts/', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess({ object: 'list', data: [account] })
    const result = await sangho.connect.accounts.list()
    expect(lastCall().method).toBe('GET')
    expect(result.data).toHaveLength(1)
  })

  it('reissueClaimToken : POST .../claim-token/', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess({ id: ACCOUNT_ID, claim_token: 'tok_new' })
    const result = await sangho.connect.accounts.reissueClaimToken(ACCOUNT_ID)
    expect(lastCall().url).toMatch(/\/claim-token\/$/)
    expect(result.claim_token).toBe('tok_new')
  })

  it('les méthodes exigent une clé secrète', () => {
    const sangho = new Sangho(PUBLIC_KEY)
    expect(() => sangho.connect.accounts.list()).toThrow(SanghoPublicKeyError)
    expect(() => sangho.connect.accounts.create({ external_id: 'x', email: 'a@b.c' })).toThrow(SanghoPublicKeyError)
  })
})

describe('connect.accounts.createKycSession', () => {
  const session = { object: 'kyc_session', url: 'https://dash.sangho.ga/connect/kyc/?session=abc', expires_at: 1780003600, account: ACCOUNT_ID }

  it('POST .../kyc-session/ avec return_url et refresh_url', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess(session, 201)
    const result = await sangho.connect.accounts.createKycSession(ACCOUNT_ID, {
      return_url: 'https://evangzat.com/wallet/', refresh_url: 'https://evangzat.com/wallet/',
    })
    const call = lastCall()
    expect(call.url).toMatch(new RegExp(`/connect/accounts/${ACCOUNT_ID}/kyc-session/$`))
    expect(call.body).toEqual({ return_url: 'https://evangzat.com/wallet/', refresh_url: 'https://evangzat.com/wallet/' })
    expect(result.url).toContain('/connect/kyc/')
  })

  it('compte non réclamé : 409 account_not_claimed (corps imbriqué) -> SanghoConflictError', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchError(409, { error: { code: 'account_not_claimed', message: 'Le compte doit d\'abord être réclamé.' } })
    const error = await sangho.connect.accounts.createKycSession(ACCOUNT_ID, { return_url: 'https://evangzat.com/wallet/' }).catch((e) => e)
    expect(error).toBeInstanceOf(SanghoConflictError)
    expect(error).not.toBeInstanceOf(SanghoIdempotencyError)
    expect(error.code).toBe('account_not_claimed')
    expect(error.statusCode).toBe(409)
  })

  it('compte inconnu : 404 -> SanghoNotFoundError', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchError(404, { error: { code: 'resource_missing', message: 'Compte introuvable.' } })
    await expect(sangho.connect.accounts.createKycSession(ACCOUNT_ID, { return_url: 'https://x.y/' })).rejects.toBeInstanceOf(SanghoNotFoundError)
  })

  it('adresse non https : 422 -> SanghoValidationError', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchError(422, { code: 'invalid_url', message: 'Les adresses de retour doivent être en https.' })
    await expect(sangho.connect.accounts.createKycSession(ACCOUNT_ID, { return_url: 'http://x.y/' })).rejects.toBeInstanceOf(SanghoValidationError)
  })
})

describe('409 — idempotence', () => {
  it('sans code (ancien backend) : SanghoIdempotencyError', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchError(409, { message: 'Conflict' })
    await expect(sangho.connect.accounts.create({ external_id: 'x', email: 'a@b.c' })).rejects.toBeInstanceOf(SanghoIdempotencyError)
  })

  it('IDEMPOTENCY_CONFLICT : SanghoIdempotencyError', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchError(409, { code: 'IDEMPOTENCY_CONFLICT', message: 'Conflict' })
    await expect(sangho.connect.accounts.create({ external_id: 'x', email: 'a@b.c' })).rejects.toBeInstanceOf(SanghoIdempotencyError)
  })
})

describe('idempotencyKey sur les créations existantes', () => {
  it('paymentIntents.create et refunds.create transmettent la clé', async () => {
    const sangho = new Sangho(SECRET_KEY)
    mockFetchSuccess({ id: 'pi_1' })
    await sangho.paymentIntents.create({ amount: 5000, currency: 'XAF' }, { idempotencyKey: 'order-42' })
    expect(lastCall().headers['Idempotency-Key']).toBe('order-42')

    mockFetchSuccess({ id: 're_1' })
    await sangho.refunds.create({ transaction: 'trans_1' } as never, { idempotencyKey: 'refund-42' })
    expect(lastCall().headers['Idempotency-Key']).toBe('refund-42')
  })
})
