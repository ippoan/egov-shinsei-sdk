import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState } from './helpers/test-context'
import { hasCollectedData, loadCollectedData } from './helpers/test-context'
import { record } from './helpers/result-recorder'

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

describe('公文書 (要テストデータ)', () => {
  it.skipIf(!hasData)('19-1 公文書取得', async () => {
    const collected = loadCollectedData()!
    const sub = collected.submissions['19-1']
    if (!sub?.arrive_id) throw new Error('19-1 data missing in .collect-arrive-ids.json')

    // 通知一覧から notice_sub_id を取得
    const today = new Date().toISOString().slice(0, 10)
    const notices = await client.listNotices({
      date_from: '2020-01-01',
      date_to: today,
      limit: 100,
      offset: 0,
    })
    const items = (notices.results as any)?.notice_list ?? []
    const match = items.find((n: any) => n.arrive_id === sub.arrive_id)
    if (!match?.notice_sub_id) throw new Error(`notice_sub_id not found for arrive_id=${sub.arrive_id}. Auto-transition may not be complete yet.`)

    const start = Date.now()
    const res = await client.getOfficialDocument(sub.arrive_id, match.notice_sub_id)
    expect(res.results).toBeDefined()

    saveState('officialDocArriveId', sub.arrive_id)
    saveState('officialDocNoticeSubId', String(match.notice_sub_id))
    const results = res.results as any
    if (results?.file_data) {
      saveState('officialDocFileData', results.file_data)
    }

    record('19-1', '公文書取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it.skipIf(!hasData)('20-1 公文書取得完了', async () => {
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

  it.skipIf(!hasData)('21-1 公文書署名検証要求', async () => {
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
