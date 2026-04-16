import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { loadState } from './helpers/test-context'
import { record } from './helpers/result-recorder'
import { buildApplicationZip, buildInvalidZip, buildWithdrawZip } from './helpers/test-data-builder'

let client: EgovClient
const PROC_ID = '950A010700005000'

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

function getProcResult() {
  const raw = loadState<string>('procResult_05_1')
  if (!raw) throw new Error('procResult_05_1 not found. Run 02-procedure first.')
  return JSON.parse(raw)
}

describe('取下げ・形式チェック', () => {
  it('11-1 取下げ依頼送信', async () => {
    const arriveId = loadState('arriveId_07_1')
    if (!arriveId) throw new Error('arriveId_07_1 not found. Run 03-apply first.')

    const start = Date.now()
    const procResult = getProcResult()
    const fi0 = procResult.file_info[0]
    const baseName = fi0?.form_name?.replace(/＿[０-９\d]+$/, '') ?? PROC_ID
    const procName = `${baseName}／${baseName}`
    const { zipBase64 } = await buildWithdrawZip(procResult, PROC_ID, arriveId, procName)

    try {
      const res = await client.withdrawApplication({
        arrive_id: arriveId,
        send_file: { file_name: 'withdraw.zip', file_data: zipBase64 },
      })
      expect(res).toBeDefined()

      record('11-1', '取下げ依頼送信', 'pass', {
        httpStatus: 200,
        durationMs: Date.now() - start,
      })
    } catch (e: unknown) {
      // 取下げは対象案件が「審査中」状態でないと実行不可
      console.error('[11-1] error:', (e as any).resultCode, (e as any).errorMessages?.[0])
      throw e
    }
  })

  it('12-1 形式チェック実行 (正常)', async () => {
    const start = Date.now()
    const procResult = getProcResult()
    const { zipBase64 } = await buildApplicationZip(procResult, PROC_ID)

    const res = await client.checkFormat({
      proc_id: PROC_ID,
      send_file: { file_name: 'check.zip', file_data: zipBase64 },
    })
    expect(res).toBeDefined()

    record('12-1', '形式チェック実行', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it('12-2 形式チェック実行 (エラーあり)', async () => {
    const start = Date.now()
    const procResult = getProcResult()
    const { zipBase64 } = await buildInvalidZip(procResult, PROC_ID)

    const res = await client.checkFormat({
      proc_id: PROC_ID,
      send_file: { file_name: 'check-error.zip', file_data: zipBase64 },
    })
    expect(res).toBeDefined()
    // エラー内容が返却されること
    expect(res.results).toBeDefined()

    record('12-2', '形式チェック実行（エラーあり）', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })
})
