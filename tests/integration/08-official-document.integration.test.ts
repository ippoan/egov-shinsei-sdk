import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState } from './helpers/test-context'
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
    fetch: cfg.fetch,
  })
  client.setAccessToken(cfg.accessToken)
})

describe('公文書 (要テストデータ)', () => {
  it.skipIf(!hasPreparedData)('19-1 公文書取得', async () => {
    const prepared = JSON.parse(process.env.EGOV_PREPARED_DATA!)
    const start = Date.now()

    const res = await client.getOfficialDocument(prepared.arrive_id_19, prepared.notice_sub_id_19)
    expect(res.results).toBeDefined()

    saveState('officialDocArriveId', prepared.arrive_id_19)
    saveState('officialDocNoticeSubId', prepared.notice_sub_id_19)
    // 公文書データを保存 (21-1 の署名検証で使用)
    const results = res.results as any
    if (results?.file_data) {
      saveState('officialDocFileData', results.file_data)
    }

    record('19-1', '公文書取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it.skipIf(!hasPreparedData)('20-1 公文書取得完了', async () => {
    const { loadState } = await import('./helpers/test-context')
    const arriveId = loadState('officialDocArriveId')
    const noticeSubId = loadState('officialDocNoticeSubId')
    if (!arriveId || !noticeSubId) throw new Error('19-1 data missing')

    const start = Date.now()
    const res = await client.completeOfficialDocument({
      arrive_id: arriveId,
      notice_sub_id: Number(noticeSubId),
    })
    expect(res).toBeDefined()

    record('20-1', '公文書取得完了', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it.skipIf(!hasPreparedData)('21-1 公文書署名検証要求', async () => {
    const { loadState } = await import('./helpers/test-context')
    const fileData = loadState('officialDocFileData')
    if (!fileData) throw new Error('19-1 file_data missing')

    const start = Date.now()
    const res = await client.verifyOfficialDocument({
      file_name: 'official_doc.zip',
      file_data: fileData,
      sig_verification_xml_file_name: 'kousei.xml',
    })
    expect(res.results).toBeDefined()

    record('21-1', '公文書署名検証要求', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })
})
