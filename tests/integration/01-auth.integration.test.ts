import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState } from './helpers/test-context'
import { record } from './helpers/result-recorder'

let client: EgovClient
let accessToken: string
let refreshToken: string

beforeAll(() => {
  const cfg = getConfig()
  client = new EgovClient({
    apiBase: cfg.apiBase,
    authBase: cfg.authBase,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    fetch: cfg.fetch,
  })
  accessToken = cfg.accessToken
  refreshToken = process.env.EGOV_REFRESH_TOKEN ?? ''
  client.setAccessToken(accessToken)
  saveState('accessToken', accessToken)
})

describe('認証・認可', () => {
  it.skip('01-1 ユーザー認可 (ブラウザ操作、手動)', () => {
    // OAuth2 ブラウザログインは手動で実施。token は .env に事前設定済み
  })

  it('02-1 アクセストークン取得', async () => {
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
    if (!refreshToken) {
      record('03-1', 'アクセストークン再取得', 'skip', { error: 'no EGOV_REFRESH_TOKEN' })
      return
    }

    const start = Date.now()
    const res = await client.refreshToken(refreshToken)
    expect(res.access_token).toBeTruthy()
    expect(res.refresh_token).toBeTruthy()

    // 新しいトークンで以降のテストを実行
    accessToken = res.access_token
    refreshToken = res.refresh_token
    client.setAccessToken(accessToken)
    saveState('accessToken', accessToken)
    saveState('refreshToken', refreshToken)

    record('03-1', 'アクセストークン再取得', 'pass', {
      httpStatus: 200,
      response: 'new token obtained via refresh',
      durationMs: Date.now() - start,
    })
  })

  it('04-1 アクセストークン検証 (access_token)', async () => {
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
    if (!refreshToken) {
      record('04-2', 'アクセストークン検証', 'skip', { error: 'no refresh_token' })
      return
    }

    const start = Date.now()
    const cfg = getConfig()
    const credentials = btoa(`${cfg.clientId}:${cfg.clientSecret}`)
    const res = await fetch(`${cfg.authBase}/token/introspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }).toString(),
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
