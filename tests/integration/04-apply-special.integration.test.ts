import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { record } from './helpers/result-recorder'
import { hasCollectedData, loadCollectedData } from './helpers/test-context'
import { buildApplicationZip } from './helpers/test-data-builder'

let client: EgovClient
const hasData = hasCollectedData()

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
  it.skipIf(!hasData)('09-1 申請データ送信 (再提出)', async () => {
    const start = Date.now()
    const collected = loadCollectedData()!
    const sub = collected.submissions['09-1']
    if (!sub?.arrive_id) throw new Error('09-1 data missing in .collect-arrive-ids.json')

    // 手続選択 → 再提出用ZIP構築 (初回受付番号を設定)
    const procRes = await client.getProcedure(sub.proc_id)
    const { zipBase64 } = await buildApplicationZip(
      procRes.results as any, sub.proc_id,
      undefined, undefined, '再提出', false, sub.arrive_id,
    )

    const res = await client.submitApplication({
      proc_id: sub.proc_id,
      send_file: { file_name: 'resubmit.zip', file_data: zipBase64 },
    })
    expect(res.results.arrive_id).toBeTruthy()
    record('09-1', '申請データ送信（再提出）', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })

  it.skipIf(!hasData)('10-1 補正データ送信', async () => {
    const start = Date.now()
    const collected = loadCollectedData()!
    const sub = collected.submissions['10-1']
    if (!sub?.arrive_id) throw new Error('10-1 data missing in .collect-arrive-ids.json')

    // 手続選択 → 補正用ZIP構築
    const procRes = await client.getProcedure(sub.proc_id)
    const { zipBase64 } = await buildApplicationZip(
      procRes.results as any, sub.proc_id,
    )

    const res = await client.amendApplication({
      arrive_id: sub.arrive_id,
      send_file: { file_name: 'amend.zip', file_data: zipBase64 },
    })
    expect(res.results.arrive_id).toBe(sub.arrive_id)
    record('10-1', '補正データ送信', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })
})
