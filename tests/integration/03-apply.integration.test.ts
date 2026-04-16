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
