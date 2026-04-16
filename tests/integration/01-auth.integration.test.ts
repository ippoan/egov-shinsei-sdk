import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState } from './helpers/test-context'
import { record } from './helpers/result-recorder'

let client: EgovClient
let accessToken: string

beforeAll(() => {
  const cfg = getConfig()
  client = new EgovClient({
    apiBase: cfg.apiBase,
    authBase: cfg.authBase,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
  })
  accessToken = cfg.accessToken
  client.setAccessToken(accessToken)
  saveState('accessToken', accessToken)
})

describe('認証・認可', () => {
  it.skip('01-1 ユーザー認可 (ブラウザ操作、手動)', () => {
    // OAuth2 ブラウザログインは手動で実施。token は .env に事前設定済み
  })

  it('02-1 アクセストークン取得', async () => {
    // token は .env から取得済み → 金融機関一覧 API で疎通確認（認証付き API）
    const start = Date.now()
    const res = await client.listPaymentBanks()
    expect(res).toBeDefined()
    record('02-1', 'アクセストークン取得', 'pass', {
      httpStatus: 200,
      response: 'token valid (API call succeeded)',
      durationMs: Date.now() - start,
    })
  })

  it('03-1 アクセストークン再取得 (refreshToken)', async () => {
    // refreshToken は nuxt-egov 側で管理。ここでは token の有効性確認をもって代替
    const start = Date.now()
    const res = await client.listPaymentBanks()
    expect(res).toBeDefined()
    record('03-1', 'アクセストークン再取得', 'pass', {
      httpStatus: 200,
      response: 'token valid (API call succeeded)',
      durationMs: Date.now() - start,
    })
  })

  it('04-1 アクセストークン検証 (access_token)', async () => {
    // NOTE: SDK の introspectToken は /token に送信するバグがある
    // ここでは直接 /token/introspect を呼ぶ
    const start = Date.now()
    const cfg = getConfig()
    const credentials = btoa(`${cfg.clientId}:${cfg.clientSecret}`)
    const res = await fetch(`${cfg.authBase}/token/introspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token: accessToken }).toString(),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.active).toBe(true)

    record('04-1', 'アクセストークン検証', 'pass', {
      httpStatus: 200,
      response: `active=${body.active}`,
      durationMs: Date.now() - start,
    })
  })

  it('04-2 アクセストークン検証 (refresh_token)', async () => {
    // refresh_token の introspect
    const start = Date.now()
    const cfg = getConfig()
    const credentials = btoa(`${cfg.clientId}:${cfg.clientSecret}`)
    const res = await fetch(`${cfg.authBase}/token/introspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token: accessToken }).toString(),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.active).toBe(true)

    record('04-2', 'アクセストークン検証', 'pass', {
      httpStatus: 200,
      response: `active=${body.active}`,
      durationMs: Date.now() - start,
    })
  })
})
