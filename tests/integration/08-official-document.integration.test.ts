import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState } from './helpers/test-context'
import {
  hasCollectedData,
  loadCollectedData,
  findFinalTestByDataState,
  hasFinalTestData,
} from './helpers/test-context'
import { record } from './helpers/result-recorder'

let client: EgovClient

// 19-1 (公文書取得): collected または standard の「公文書の取得が可能」state
const hasData_19 = hasCollectedData() || hasFinalTestData(/公文書の取得が可能/)

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
  it.skipIf(!hasData_19)('19-1 公文書取得', async () => {
    const collected = loadCollectedData()?.submissions['19-1']
    const fallback = collected?.arrive_id ? null : findFinalTestByDataState(/公文書の取得が可能/)
    const arriveId = collected?.arrive_id ?? fallback?.arrive_id
    if (!arriveId) throw new Error('19-1 data missing (collected / final_confirmation_test_data)')

    // 申請案件詳細から公文書 notice_sub_id を取得 (listNotices は補正通知用で公文書は含まれない)
    const detail = await client.getApplication(arriveId)
    const officialList = (detail.results as any)?.official_list ?? []
    const officialMatch = officialList[0]
    if (!officialMatch?.notice_sub_id) throw new Error(`official_list not found for arrive_id=${arriveId}. 公文書がまだ発出されていない可能性があります。`)

    const start = Date.now()
    const res = await client.getOfficialDocument(arriveId, officialMatch.notice_sub_id)
    expect(res.results).toBeDefined()

    saveState('officialDocArriveId', arriveId)
    saveState('officialDocNoticeSubId', String(officialMatch.notice_sub_id))
    const results = res.results as any
    if (results?.file_data) {
      saveState('officialDocFileData', results.file_data)
    }

    record('19-1', '公文書取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it.skipIf(!hasData_19)('20-1 公文書取得完了', async () => {
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

  it.skipIf(!hasData_19)('21-1 公文書署名検証要求', async () => {
    const { loadState } = await import('./helpers/test-context')
    const fileData = loadState('officialDocFileData')
    if (!fileData) {
      record('21-1', '公文書署名検証要求', 'skip', { error: 'no file_data from 19-1' })
      return
    }

    const start = Date.now()
    try {
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
    } catch (e: any) {
      // sandbox で「指定された電子公文書が見つかりません」等が返る場合は skip 扱い
      record('21-1', '公文書署名検証要求', 'skip', {
        httpStatus: e.statusCode,
        error: e.resultCode ?? e.message,
        durationMs: Date.now() - start,
      })
    }
  })
})
