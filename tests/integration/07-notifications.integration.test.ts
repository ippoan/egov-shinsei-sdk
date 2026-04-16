import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState } from './helpers/test-context'
import { record } from './helpers/result-recorder'

let client: EgovClient

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

const today = new Date().toISOString().slice(0, 10)

describe('お知らせ・通知', () => {
  it('16-1 手続に関するご案内一覧取得', async () => {
    const start = Date.now()
    const res = await client.listMessages({
      date_from: '2020-11-24',
      date_to: today,
      limit: 10,
      offset: 0,
    })
    expect(res.results).toBeDefined()

    // 最初のお知らせIDを保存
    const items = res.results as any
    if (items?.message_list?.[0]?.information_id) {
      saveState('informationId_16_1', items.message_list[0].information_id)
    }

    record('16-1', '手続に関するご案内一覧取得', 'pass', {
      httpStatus: 200,
      response: `count=${res.resultset?.count ?? 'N/A'}`,
      durationMs: Date.now() - start,
    })
  })

  it('17-1 手続に関するご案内取得', async () => {
    // 16-1 で取得した informationId を使用。なければ固定値で試行
    const informationId = (await import('./helpers/test-context')).loadState('informationId_16_1')
    if (!informationId) {
      record('17-1', '手続に関するご案内取得', 'skip', { error: 'no informationId from 16-1' })
      return
    }

    const start = Date.now()
    const res = await client.getMessage(informationId)
    expect(res.results).toBeDefined()

    record('17-1', '手続に関するご案内取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it('18-1 申請案件に関する通知一覧取得', async () => {
    const start = Date.now()
    const res = await client.listNotices({
      date_from: today,
      date_to: today,
      limit: 10,
      offset: 0,
    })
    expect(res.results).toBeDefined()

    // 最初の通知の arriveId + noticeSubId を保存
    const items = res.results as any
    if (items?.notice_list?.[0]) {
      const notice = items.notice_list[0]
      saveState('noticeArriveId_18_1', notice.arrive_id)
      saveState('noticeSubId_18_1', String(notice.notice_sub_id))
    }

    record('18-1', '申請案件に関する通知一覧取得', 'pass', {
      httpStatus: 200,
      response: `count=${res.resultset?.count ?? 'N/A'}`,
      durationMs: Date.now() - start,
    })
  })

  it('18-2 申請案件に関する通知取得', async () => {
    const { loadState } = await import('./helpers/test-context')
    const arriveId = loadState('noticeArriveId_18_1')
    const noticeSubId = loadState('noticeSubId_18_1')
    if (!arriveId || !noticeSubId) {
      record('18-2', '申請案件に関する通知取得', 'skip', { error: 'no notice data from 18-1' })
      return
    }

    const start = Date.now()
    const res = await client.getNotice(arriveId, noticeSubId)
    expect(res.results).toBeDefined()

    record('18-2', '申請案件に関する通知取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })
})
