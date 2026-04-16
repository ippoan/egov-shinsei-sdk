import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { record } from './helpers/result-recorder'

let client: EgovClient
const hasPreparedData = !!process.env.EGOV_PREPARED_DATA

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

describe('申請書作成 — 再提出・補正 (要テストデータ)', () => {
  it.skipIf(!hasPreparedData)('09-1 申請データ送信 (再提出)', async () => {
    const start = Date.now()
    // e-Gov 側でテストデータ準備が必要。EGOV_PREPARED_DATA に到達番号等を設定
    const prepared = JSON.parse(process.env.EGOV_PREPARED_DATA!)
    const res = await client.submitApplication({
      proc_id: prepared.proc_id_09,
      send_file: { file_name: 'resubmit.zip', file_data: prepared.zip_data_09 },
    })
    expect(res.results.arrive_id).toBeTruthy()
    record('09-1', '申請データ送信（再提出）', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })

  it.skipIf(!hasPreparedData)('10-1 補正データ送信', async () => {
    const start = Date.now()
    const prepared = JSON.parse(process.env.EGOV_PREPARED_DATA!)
    const res = await client.amendApplication({
      arrive_id: prepared.arrive_id_10,
      send_file: { file_name: 'amend.zip', file_data: prepared.zip_data_10 },
    })
    expect(res.results.arrive_id).toBe(prepared.arrive_id_10)
    record('10-1', '補正データ送信', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })
})
