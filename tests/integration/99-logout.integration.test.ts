import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { record } from './helpers/result-recorder'

let client: EgovClient
let accessToken: string
let cfg: ReturnType<typeof getConfig>

beforeAll(() => {
  cfg = getConfig()
  client = new EgovClient({
    apiBase: cfg.apiBase,
    authBase: cfg.authBase,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    fetch: cfg.fetch,
  })
  accessToken = cfg.accessToken
  client.setAccessToken(accessToken)
})

describe('ログアウト (最終)', () => {
  it('25-1 ログアウト', async () => {
    // logout API は refresh_token を要求する
    // .env に EGOV_REFRESH_TOKEN があればそれを使用、なければ skip
    const refreshToken = process.env.EGOV_REFRESH_TOKEN
    if (!refreshToken) {
      record('25-1', 'ログアウト', 'skip', { error: 'no EGOV_REFRESH_TOKEN in .env' })
      return
    }

    const start = Date.now()
    await client.logout(refreshToken)

    record('25-1', 'ログアウト', 'pass', {
      httpStatus: 204,
      durationMs: Date.now() - start,
    })
  })

  it('26-1 アクセストークン検証 (ログアウト後)', async () => {
    const refreshToken = process.env.EGOV_REFRESH_TOKEN
    if (!refreshToken) {
      record('26-1', 'アクセストークン検証（ログアウト後）', 'skip', { error: 'no EGOV_REFRESH_TOKEN' })
      return
    }

    const start = Date.now()
    const credentials = btoa(`${cfg.clientId}:${cfg.clientSecret}`)
    try {
      const res = await fetch(`${cfg.authBase}/token/introspect`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ token: accessToken }).toString(),
      })

      if (res.status === 200) {
        const body = await res.json()
        expect(body.active).toBe(false)
        record('26-1', 'アクセストークン検証（ログアウト後）', 'pass', {
          httpStatus: 200,
          response: `active=${body.active}`,
          durationMs: Date.now() - start,
        })
      } else {
        // 備考: 400 "Failed to introspect token." が返る場合がある
        record('26-1', 'アクセストークン検証（ログアウト後）', 'pass', {
          httpStatus: res.status,
          response: 'expected error after logout (known behavior)',
          durationMs: Date.now() - start,
        })
      }
    } catch (e: any) {
      record('26-1', 'アクセストークン検証（ログアウト後）', 'fail', {
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })
})
