import { describe, it, expect, beforeAll } from 'vitest'
import { EgovClient } from '../../src/client'
import { getConfig } from './helpers/env'
import { saveState, loadState } from './helpers/test-context'
import { record } from './helpers/result-recorder'
import { buildUnsignedZip } from './helpers/test-data-builder'

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
// 電子送達用の手続ID (APIテスト用手続（電子送達関係手続）（通）０００１)
const POST_PROC_ID = '900A013800001000'

describe('電子送達', () => {
  it('27-1 電子送達利用申込み', async () => {
    const start = Date.now()
    // 電子送達は専用手続なので procedure API から取得
    const procRes = await client.getProcedure(POST_PROC_ID)
    const { zipBase64 } = await buildUnsignedZip(procRes.results as any, POST_PROC_ID)

    const res = await client.applyPostDelivery({
      proc_id: POST_PROC_ID,
      send_file: { file_name: 'post-apply.zip', file_data: zipBase64 },
    })
    expect(res.results).toBeDefined()
    const results = res.results as any
    if (results?.arrive_id) {
      saveState('postArriveId_27_1', results.arrive_id)
    }

    record('27-1', '電子送達利用申込み', 'pass', {
      httpStatus: 200,
      response: `arrive_id=${results?.arrive_id}`,
      durationMs: Date.now() - start,
    })
  })

  it('28-1 電子送達状況確認', async () => {
    const arriveId = loadState('postArriveId_27_1')
    if (!arriveId) {
      record('28-1', '電子送達状況確認', 'skip', { error: 'no postArriveId from 27-1' })
      return
    }

    const start = Date.now()
    const res = await client.getPostApplyStatus(arriveId)
    expect(res.results).toBeDefined()

    record('28-1', '電子送達状況確認', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it('29-1 電子送達一覧取得', async () => {
    const start = Date.now()
    const res = await client.listPostDeliveries({
      date_from: '2020-11-24',
      date_to: today,
      limit: 10,
      offset: 0,
    })
    expect(res.results).toBeDefined()

    // post_id を保存
    const items = res.results as any
    if (items?.post_list?.[0]?.post_id) {
      saveState('postId_29_1', items.post_list[0].post_id)
    }

    record('29-1', '電子送達一覧取得', 'pass', {
      httpStatus: 200,
      response: `count=${res.resultset?.count ?? 'N/A'}`,
      durationMs: Date.now() - start,
    })
  })

  it('30-1 電子送達取得', async () => {
    const postId = loadState('postId_29_1')
    if (!postId) {
      record('30-1', '電子送達取得', 'skip', { error: 'no postId from 29-1' })
      return
    }

    const start = Date.now()
    const res = await client.getPostDelivery(postId)
    expect(res.results).toBeDefined()

    record('30-1', '電子送達取得', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })

  it('31-1 電子送達取得完了', async () => {
    const postId = loadState('postId_29_1')
    if (!postId) {
      record('31-1', '電子送達取得完了', 'skip', { error: 'no postId from 29-1' })
      return
    }

    const start = Date.now()
    const res = await client.completePostDelivery({ post_id: postId })
    expect(res).toBeDefined()

    record('31-1', '電子送達取得完了', 'pass', {
      httpStatus: 200,
      durationMs: Date.now() - start,
    })
  })
})
