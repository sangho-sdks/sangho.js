/**
 * tests/unit/webhook.test.ts
 * Vérification de signature (spéc. SDK-06) : erreurs typées, rotation, tolérance, corps brut.
 */
import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import Sangho, { SanghoWebhookSignatureError, generateTestHeader } from '../../index'
import type { KycUpdatedEvent } from '../../index'

const SECRET = 'whsec_test_secret'
const NOW = () => Math.floor(Date.now() / 1000)

const account = {
  id: 'acct_' + 'b'.repeat(32), object: 'account', external_id: 'seller-1', email: 'ada@example.com', business_name: 'Boutique Ada',
  status: 'active', charges_enabled: true, payouts_enabled: false, kyc_level: 1, livemode: true, created: 1780000000,
}
const body = JSON.stringify({ id: 'evt_1', object: 'event', type: 'kyc.updated', created: 1780000100, livemode: true, data: { object: account } })

const sign = (secret: string, t: number, raw: string) => createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')

async function reason(promise: Promise<unknown>) {
  const error = await promise.then(() => null, (e) => e)
  expect(error).toBeInstanceOf(SanghoWebhookSignatureError)
  return error as SanghoWebhookSignatureError
}

describe('Sangho.constructEvent', () => {
  it('signature valide : retourne l\'événement, typé pour kyc.updated', async () => {
    const t = NOW()
    const event = await Sangho.constructEvent(body, `t=${t},v1=${sign(SECRET, t, body)}`, SECRET)
    expect(event.type).toBe('kyc.updated')
    if (event.type === 'kyc.updated') {
      const typed: KycUpdatedEvent = event
      expect(typed.data.object.charges_enabled).toBe(true)
      expect(typed.data.object.kyc_level).toBe(1)
    }
  })

  it('accepte un corps binaire (Uint8Array) et un corps UTF-8 accentué', async () => {
    const t = NOW()
    const raw = JSON.stringify({ id: 'evt_2', type: 'account.updated', data: { object: { business_name: 'Café Épicé — Libreville' } } })
    const event = await Sangho.constructEvent(new TextEncoder().encode(raw), `t=${t},v1=${sign(SECRET, t, raw)}`, SECRET)
    expect(event.type).toBe('account.updated')
  })

  it('corps altéré : mismatch (401)', async () => {
    const t = NOW()
    const error = await reason(Sangho.constructEvent(body + ' ', `t=${t},v1=${sign(SECRET, t, body)}`, SECRET))
    expect(error.reason).toBe('mismatch')
    expect(error.statusCode).toBe(401)
  })

  it('mauvais secret : mismatch', async () => {
    const t = NOW()
    expect((await reason(Sangho.constructEvent(body, `t=${t},v1=${sign('autre', t, body)}`, SECRET))).reason).toBe('mismatch')
  })

  it('horodatage expiré ou dans le futur : expired (400)', async () => {
    const old = NOW() - 3600
    const future = NOW() + 3600
    const expired = await reason(Sangho.constructEvent(body, `t=${old},v1=${sign(SECRET, old, body)}`, SECRET))
    expect(expired.reason).toBe('expired')
    expect(expired.statusCode).toBe(400)
    expect((await reason(Sangho.constructEvent(body, `t=${future},v1=${sign(SECRET, future, body)}`, SECRET))).reason).toBe('expired')
  })

  it('tolérance personnalisée', async () => {
    const t = NOW() - 600
    const header = `t=${t},v1=${sign(SECRET, t, body)}`
    await reason(Sangho.constructEvent(body, header, SECRET))
    await expect(Sangho.constructEvent(body, header, SECRET, 900)).resolves.toBeTruthy()
  })

  it.each(['', 'nimportequoi', 't=abc,v1=deadbeef', 't=123', 'v1=deadbeef', 't=,v1='])('en-tête mal formé %j : malformed', async (header) => {
    expect((await reason(Sangho.constructEvent(body, header, SECRET))).reason).toBe('malformed')
  })

  it('rotation : plusieurs v1 dans l\'en-tête (l\'un des deux est bon)', async () => {
    const t = NOW()
    const header = `t=${t},v1=${sign('ancien-secret', t, body)},v1=${sign(SECRET, t, body)}`
    await expect(Sangho.constructEvent(body, header, SECRET)).resolves.toBeTruthy()
  })

  it('rotation : plusieurs secrets acceptés', async () => {
    const t = NOW()
    const header = `t=${t},v1=${sign('ancien-secret', t, body)}`
    await expect(Sangho.constructEvent(body, header, [SECRET, 'ancien-secret'])).resolves.toBeTruthy()
    await reason(Sangho.constructEvent(body, header, [SECRET]))
  })

  it('corps non JSON : erreur explicite (signature pourtant valide)', async () => {
    const t = NOW()
    const raw = 'pas du json'
    await expect(Sangho.constructEvent(raw, `t=${t},v1=${sign(SECRET, t, raw)}`, SECRET)).rejects.toThrow(/valid JSON/)
  })
})

describe('generateTestHeader', () => {
  it('produit un en-tête accepté par constructEvent', async () => {
    const header = await generateTestHeader(body, SECRET)
    await expect(Sangho.constructEvent(body, header, SECRET)).resolves.toBeTruthy()
  })

  it('respecte l\'horodatage fourni', async () => {
    expect(await generateTestHeader(body, SECRET, 1780000000)).toMatch(/^t=1780000000,v1=[0-9a-f]{64}$/)
  })
})
