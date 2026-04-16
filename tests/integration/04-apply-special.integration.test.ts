import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { record } from './helpers/result-recorder'
import { buildApplicationZip } from './helpers/test-data-builder'

let client: EgovClient
const hasPreparedData = !!process.env.EGOV_PREPARED_DATA

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

describe('申請書作成 — 再提出・補正 (要テストデータ)', () => {
  it.skipIf(!hasPreparedData)('09-1 申請データ送信 (再提出)', async () => {
    const start = Date.now()
    const prepared = JSON.parse(process.env.EGOV_PREPARED_DATA!)

    // 手続選択 → 再提出用ZIP構築 (初回受付番号を設定)
    const procRes = await client.getProcedure(prepared.proc_id_09)
    const { zipBase64 } = await buildApplicationZip(
      procRes.results as any, prepared.proc_id_09,
      undefined, undefined, '再提出', false, prepared.arrive_id_09,
    )

    const res = await client.submitApplication({
      proc_id: prepared.proc_id_09,
      send_file: { file_name: 'resubmit.zip', file_data: zipBase64 },
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

    // 手続選択 → 補正用ZIP構築
    const procRes = await client.getProcedure(prepared.proc_id_10)
    const { zipBase64 } = await buildApplicationZip(
      procRes.results as any, prepared.proc_id_10,
    )

    const res = await client.amendApplication({
      arrive_id: prepared.arrive_id_10,
      send_file: { file_name: 'amend.zip', file_data: zipBase64 },
    })
    expect(res.results.arrive_id).toBe(prepared.arrive_id_10)
    record('10-1', '補正データ送信', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })
})
