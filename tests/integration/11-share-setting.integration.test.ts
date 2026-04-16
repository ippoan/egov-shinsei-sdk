import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { record } from './helpers/result-recorder'

let client: EgovClient

// 検証用 gBizID（stg.gbiz-id.go.jp）が必要。e-Gov に取得申請中。
// 仕様書: 32-1/33-1/34-1 はそれぞれ異なるアカウントで実施が必要
const hasGbizId = !!process.env.EGOV_GBIZID_ACCOUNT

beforeAll(() => {
  const cfg = getConfig()
  client = new EgovClient({
    apiBase: cfg.apiBase,
    authBase: cfg.authBase,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
  })
  client.setAccessToken(cfg.accessToken)
})

const TEST_GBIZ_ID = process.env.EGOV_GBIZID_ACCOUNT ?? 'test-share@example.com'

describe('アカウント間情報共有', () => {
  it.skipIf(!hasGbizId)('32-1 情報共有設定', async () => {
    const start = Date.now()
    try {
      const res = await client.createShareSetting({
        gbiz_id: TEST_GBIZ_ID,
        official_doc_permission: 'READ',
        post_doc_permission: 'READ',
      })
      expect(res).toBeDefined()

      record('32-1', '情報共有設定', 'pass', {
        httpStatus: 200,
        durationMs: Date.now() - start,
      })
    } catch (e: any) {
      record('32-1', '情報共有設定', 'fail', {
        httpStatus: e.statusCode,
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })

  it.skipIf(!hasGbizId)('33-1 情報共有更新', async () => {
    const start = Date.now()
    try {
      const res = await client.updateShareSetting({
        gbiz_id: TEST_GBIZ_ID,
        official_doc_permission: 'DOWNLOAD',
        post_doc_permission: 'DOWNLOAD',
      })
      expect(res).toBeDefined()

      record('33-1', '情報共有更新', 'pass', {
        httpStatus: 200,
        durationMs: Date.now() - start,
      })
    } catch (e: any) {
      record('33-1', '情報共有更新', 'fail', {
        httpStatus: e.statusCode,
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })

  it.skipIf(!hasGbizId)('34-1 情報共有解除', async () => {
    const start = Date.now()
    try {
      const res = await client.deleteShareSetting({
        gbiz_id: TEST_GBIZ_ID,
      })
      expect(res).toBeDefined()

      record('34-1', '情報共有解除', 'pass', {
        httpStatus: 200,
        durationMs: Date.now() - start,
      })
    } catch (e: any) {
      record('34-1', '情報共有解除', 'fail', {
        httpStatus: e.statusCode,
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })

  it.skipIf(!hasGbizId)('35-1 情報共有確認', async () => {
    const start = Date.now()
    try {
      const res = await client.confirmShareSetting({
        gbiz_id: TEST_GBIZ_ID,
        share_acceptance: 'ACCEPT',
      })
      expect(res).toBeDefined()

      record('35-1', '情報共有確認', 'pass', {
        httpStatus: 200,
        durationMs: Date.now() - start,
      })
    } catch (e: any) {
      record('35-1', '情報共有確認', 'fail', {
        httpStatus: e.statusCode,
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })

  it.skipIf(!hasGbizId)('36-1 情報共有一覧取得', async () => {
    const start = Date.now()
    const res = await client.listShareSettings()
    expect(res).toBeDefined()

    record('36-1', '情報共有一覧取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })
})
