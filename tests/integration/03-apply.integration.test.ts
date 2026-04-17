import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState, loadState } from './helpers/test-context'
import { record } from './helpers/result-recorder'
import { buildApplicationZip, buildApplicationZipWithAttachments, buildInvalidZip, buildBulkZip } from './helpers/test-data-builder'

let client: EgovClient
const PROC_ID = '950A010700005000'

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

function getProcResult() {
  const raw = loadState<string>('procResult_05_1')
  if (!raw) throw new Error('procResult_05_1 not found in state. Run 02-procedure first.')
  return JSON.parse(raw)
}

describe('申請書作成 — 申請データ送信', () => {
  it('07-1 申請データ送信 (添付なし)', async () => {
    const start = Date.now()
    const procResult = getProcResult()
    const { zipBase64 } = await buildApplicationZip(procResult, PROC_ID)

    const res = await client.submitApplication({
      proc_id: PROC_ID,
      send_file: { file_name: `${PROC_ID}.zip`, file_data: zipBase64 },
    })

    expect(res.results.arrive_id).toBeTruthy()
    saveState('arriveId_07_1', res.results.arrive_id)
    saveState('zipBase64_07_1', zipBase64)

    record('07-1', '申請データ送信（添付なし）', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })

  it('07-2 申請データ送信 (添付あり)', async () => {
    const start = Date.now()
    const procResult = getProcResult()

    const attachments = [
      { name: 'テスト添付書類１', fileName: '最終確認試験用添付１.pdf', content: Buffer.from('test-pdf-1') },
      { name: 'テスト添付書類２', fileName: '最終確認試験用添付２.doc', content: Buffer.from('test-doc-2') },
    ]
    const { zipBase64, zipBuffer } = await buildApplicationZipWithAttachments(procResult, PROC_ID, attachments)

    const res = await client.submitApplication({
      proc_id: PROC_ID,
      send_file: { file_name: `${PROC_ID}.zip`, file_data: zipBase64 },
    })

    expect(res.results.arrive_id).toBeTruthy()
    saveState('arriveId_07_2', res.results.arrive_id)
    saveState('zipBuffer_07_2', zipBuffer.toString('base64'))

    record('07-2', '申請データ送信（添付あり）', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${res.results.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })

  it.skip('IND-1 申請データ送信 (個別署名形式) — Catch-22 ブロック中', async () => {
    // 個別署名形式の Apply API は spec と server 実装に乖離あり (Catch-22):
    //   - spec (shinseisyodata p.2-20, 図2-7): WriteAppli に 申請書属性情報 は必須
    //   - server: 申請書属性情報 ありで "構成管理情報の申請書属性情報は申請書送信の場合指定できません" で拒否
    //   - 申請書属性情報 なしで "添付必須のファイル(form_name) が添付されていません" で拒否
    // 打開には e-Gov 問い合わせ回答 or デスクトップクライアントの送信 XML キャプチャが必要。
    // 詳細: memory `project_individual_sign_blocker.md`
    const start = Date.now()
    const INDIVIDUAL_PROC_ID = '950A101220029000'
    const procRes = await client.getProcedure(INDIVIDUAL_PROC_ID)
    expect(procRes.results.configuration_file_name.length).toBeGreaterThanOrEqual(3)

    const { zipBase64 } = await buildApplicationZip(procRes.results as any, INDIVIDUAL_PROC_ID)

    try {
      const res = await client.submitApplication({
        proc_id: INDIVIDUAL_PROC_ID,
        send_file: { file_name: `${INDIVIDUAL_PROC_ID}.zip`, file_data: zipBase64 },
      })
      expect(res.results.arrive_id).toBeTruthy()
      saveState('arriveId_ind_1', res.results.arrive_id)
      record('IND-1', '申請データ送信（個別署名形式）', 'pass', {
        httpStatus: 200,
        response: `arrive_id=${res.results.arrive_id}`,
        durationMs: Date.now() - start,
      })
    } catch (e: any) {
      record('IND-1', '申請データ送信（個別署名形式）', 'fail', {
        httpStatus: e.statusCode,
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })

  it('08-1 申請データbulk送信 (エラーなし)', async () => {
    const start = Date.now()
    const procResult = getProcResult()
    const { zipBuffer: zip1 } = await buildApplicationZip(procResult, PROC_ID)
    const { zipBuffer: zip2 } = await buildApplicationZip(procResult, PROC_ID)
    const { zipBase64 } = await buildBulkZip([zip1, zip2])

    const res = await client.bulkSubmitApplication({
      send_file: { file_name: 'bulk.zip', file_data: zipBase64 },
    })

    expect(res.results.send_number).toBeTruthy()
    saveState('sendNumber_08_1', res.results.send_number)

    record('08-1', '申請データbulk送信（エラーなし）', 'pass', {
      httpStatus: 202,
      response: `send_number=${res.results.send_number}`,
      durationMs: Date.now() - start,
    })
  })

  it('08-2 申請データbulk送信 (エラーあり)', async () => {
    const start = Date.now()
    const procResult = getProcResult()
    const { zipBase64 } = await buildInvalidZip(procResult, PROC_ID)

    const res = await client.bulkSubmitApplication({
      send_file: { file_name: 'bulk-error.zip', file_data: zipBase64 },
    })

    expect(res.results.send_number).toBeTruthy()
    saveState('sendNumber_08_2', res.results.send_number)

    record('08-2', '申請データbulk送信（エラーあり）', 'pass', {
      httpStatus: 202,
      response: `send_number=${res.results.send_number}`,
      durationMs: Date.now() - start,
    })
  })
})
