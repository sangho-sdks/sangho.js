/**
 * Alignement avec l'API Sangho réelle (backend/api) : chaque route testée existe côté backend ; les méthodes
 * retirées appelaient des routes inexistantes (404/405) et ne doivent pas revenir.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Sangho from '../../index'

const KEY = 'sk_test_aaaaaaaaaaaaaaaaaaaaaaaa'

describe('alignement sur l\'API', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'x', data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit]
    return `${init.method} ${new URL(url).pathname}${new URL(url).search}`
  }

  it('les moyens de paiement d\'un client passent par le filtre ?customer=', async () => {
    await new Sangho(KEY).customers.listPaymentMethods('cus_1')
    expect(lastCall()).toBe('GET /v1/payment-methods/?customer=cus_1')
  })

  it('customers.listTransactions n\'existe plus (route inexistante côté API)', () => {
    expect((new Sangho(KEY).customers as Record<string, unknown>).listTransactions).toBeUndefined()
  })

  it('subscriptions.reactivate appelle POST /subscriptions/{id}/reactivate/', async () => {
    await new Sangho(KEY).subscriptions.reactivate('sub_1')
    expect(lastCall()).toBe('POST /v1/subscriptions/sub_1/reactivate/')
  })
})
