import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { record } from './helpers/result-recorder'
import {
  hasCollectedData,
  loadCollectedData,
  findFinalTestByDataState,
  hasFinalTestData,
} from './helpers/test-context'
import { buildApplicationZip } from './helpers/test-data-builder'

let client: EgovClient

// 09-1 (再提出): collected または standard の「再提出が可能な状態」が必要 (standard 22件には該当無し → skip 継続)
const hasData_09 = hasCollectedData() || hasFinalTestData(/再提出が可能/)
// 10-1 (部分補正): collected のみ。standard の「補正申請が可能な状態」は部分補正非対応で amend API では fail するため fallback しない
const hasData_10 = hasCollectedData()

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
  it.skipIf(!hasData_09)('09-1 申請データ送信 (再提出)', async () => {
    const start = Date.now()
    const collected = loadCollectedData()?.submissions['09-1']
    const fallback = collected?.arrive_id ? null : findFinalTestByDataState(/再提出が可能/)
    const procId = collected?.proc_id ?? fallback?.proc_id
    const arriveId = collected?.arrive_id ?? fallback?.arrive_id
    if (!procId || !arriveId) throw new Error('09-1 data missing (collected / final_confirmation_test_data)')

    // 手続選択 → 再提出用ZIP構築 (初回受付番号を設定)
    const procRes = await client.getProcedure(procId)
    const { zipBase64 } = await buildApplicationZip(
      procRes.results as any, procId,
      undefined, undefined, '再提出', false, arriveId,
    )

    const res = await client.submitApplication({
      proc_id: procId,
      send_file: { file_name: 'resubmit.zip', file_data: zipBase64 },
    })
    expect(res.results.arrive_id).toBeTruthy()
    record('09-1', '申請データ送信（再提出）', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })

  it.skipIf(!hasData_10)('10-1 補正データ送信', async () => {
    const start = Date.now()
    const collected = loadCollectedData()?.submissions['10-1']
    const procId = collected?.proc_id
    const arriveId = collected?.arrive_id
    if (!procId || !arriveId) throw new Error('10-1 data missing in .collect-arrive-ids.json')

    // 手続選択 → 補正用ZIP構築
    const procRes = await client.getProcedure(procId)
    const { zipBase64 } = await buildApplicationZip(
      procRes.results as any, procId,
    )

    const res = await client.amendApplication({
      arrive_id: arriveId,
      send_file: { file_name: 'amend.zip', file_data: zipBase64 },
    })
    expect(res.results.arrive_id).toBe(arriveId)
    record('10-1', '補正データ送信', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })
})
