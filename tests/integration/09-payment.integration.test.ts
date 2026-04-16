import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState } from './helpers/test-context'
import { record } from './helpers/result-recorder'

let client: EgovClient

beforeAll(() => {
  const cfg = getConfig()
  client = new EgovClient({
    apiBase: cfg.apiBase,
    authBase: cfg.authBase,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    fetch: cfg.fetch,
  })
  client.setAccessToken(cfg.accessToken)
})

describe('電子納付', () => {
  it('22-1 国庫金電子納付取扱金融機関一覧取得', async () => {
    const start = Date.now()
    const res = await client.listPaymentBanks()
    expect(res.results).toBeDefined()

    record('22-1', '国庫金電子納付取扱金融機関一覧取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it('23-1 電子納付情報一覧取得', async () => {
    // 納付待ちの案件が必要 — 手続 950A010002018000 (労働保険関係手続) で申請後
    // テストデータがなければ skip
    const { loadState } = await import('./helpers/test-context')
    const arriveId = loadState('arriveId_07_1')
    if (!arriveId) {
      record('23-1', '電子納付情報一覧取得', 'skip', { error: 'no arriveId' })
      return
    }

    const start = Date.now()
    try {
      const res = await client.getPaymentInfo(arriveId)
      expect(res.results).toBeDefined()

      const results = res.results as any
      if (results?.pay_number) {
        saveState('payNumber_23_1', results.pay_number)
        saveState('payArriveId_23_1', arriveId)
      }

      record('23-1', '電子納付情報一覧取得', 'pass', {
        httpStatus: 200,
        durationMs: Date.now() - start,
      })
    } catch (e: any) {
      // 納付待ち状態でなければ 404 等が返る
      record('23-1', '電子納付情報一覧取得', 'fail', {
        httpStatus: e.statusCode,
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })

  it('24-1 電子納付金融機関サイト表示', async () => {
    const { loadState } = await import('./helpers/test-context')
    const payNumber = loadState('payNumber_23_1')
    const arriveId = loadState('payArriveId_23_1')
    if (!payNumber || !arriveId) {
      record('24-1', '電子納付金融機関サイト表示', 'skip', { error: 'no payment data from 23-1' })
      return
    }

    const start = Date.now()
    const res = await client.displayPaymentSite({
      arrive_id: arriveId,
      pay_number: payNumber,
      bank_name: 'テスト銀行',
      proc_id: '950A010002018000',
    })
    expect(res.results).toBeDefined()

    record('24-1', '電子納付金融機関サイト表示', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })
})
