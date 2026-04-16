import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { loadState } from './helpers/test-context'
import { record } from './helpers/result-recorder'

let client: EgovClient

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

const today = new Date().toISOString().slice(0, 10)

describe('申請案件取得', () => {
  it('13-1 申請案件一覧取得 (送信番号指定)', async () => {
    const sendNumber = loadState('sendNumber_08_1')
    if (!sendNumber) throw new Error('sendNumber_08_1 not found. Run 03-apply first.')

    const start = Date.now()
    const res = await client.listApplications({ send_number: sendNumber })
    expect(res.results).toBeDefined()

    record('13-1', '申請案件一覧取得', 'pass', {
      httpStatus: 200,
      response: `count=${res.resultset?.count ?? 'N/A'}`,
      durationMs: Date.now() - start,
    })
  })

  it('13-2 申請案件一覧取得 (期間指定)', async () => {
    const start = Date.now()
    const res = await client.listApplications({
      date_from: today,
      date_to: today,
      limit: 10,
      offset: 0,
    })
    expect(res.results).toBeDefined()

    record('13-2', '申請案件一覧取得（期間指定）', 'pass', {
      httpStatus: 200,
      response: `count=${res.resultset?.count ?? 'N/A'}`,
      durationMs: Date.now() - start,
    })
  })

  it('14-1 申請案件取得', async () => {
    const arriveId = loadState('arriveId_07_1')
    if (!arriveId) throw new Error('arriveId_07_1 not found. Run 03-apply first.')

    const start = Date.now()
    const res = await client.getApplication(arriveId)
    expect(res.results).toBeDefined()

    record('14-1', '申請案件取得', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${arriveId}`,
      durationMs: Date.now() - start,
    })
  })

  it('15-1 エラーレポート取得 (送信番号指定)', async () => {
    const sendNumber = loadState('sendNumber_08_2')
    if (!sendNumber) throw new Error('sendNumber_08_2 not found. Run 03-apply first.')

    const start = Date.now()
    const res = await client.getErrorReport({ send_number: sendNumber })
    expect(res.results).toBeDefined()

    record('15-1', 'エラーレポート取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it('15-2 エラーレポート取得 (期間指定)', async () => {
    const start = Date.now()
    const res = await client.getErrorReport({
      date_from: today,
      date_to: today,
      limit: 10,
      offset: 0,
    })
    expect(res.results).toBeDefined()

    record('15-2', 'エラーレポート取得（期間指定）', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })
})
