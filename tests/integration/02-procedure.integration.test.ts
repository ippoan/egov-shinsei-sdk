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

// テスト用手続 (社会保険関係手続)
const PROC_ID = '950A010700005000'

describe('申請書作成 — 手続選択・プレ印字', () => {
  it('05-1 手続選択', async () => {
    const start = Date.now()
    const res = await client.getProcedure(PROC_ID)
    expect(res.results).toBeDefined()
    expect(res.results.file_data).toBeTruthy()
    expect(res.results.configuration_file_name).toBeTruthy()

    // 手続レスポンスを保存 (後続テストで ZIP 構築に使用)
    saveState('procResult_05_1', JSON.stringify(res.results))
    saveState('procId_05_1', PROC_ID)

    record('05-1', '手続選択', 'pass', {
      httpStatus: 200,
      response: `configFiles=${res.results.configuration_file_name.length}`,
      durationMs: Date.now() - start,
    })
  })

  it('06-1 プレ印字データ取得', async () => {
    // プレ印字テスト用手続 (労働保険適用徴収関係手続)
    const preprintProcId = '900A102800072000'
    const start = Date.now()

    try {
      const procRes = await client.getProcedure(preprintProcId)
      const fi = procRes.results.file_info?.[0]
      if (!fi) throw new Error('file_info not found')

      // スケルトン ZIP から申請書 XML を抽出して Base64 化
      const JSZip = (await import('jszip')).default
      const zipBytes = Buffer.from(procRes.results.file_data, 'base64')
      const zip = await JSZip.loadAsync(zipBytes)
      const applyPath = `${preprintProcId}/${fi.apply_file_name}`
      const applyXml = await zip.file(applyPath)!.async('nodebuffer')
      const fileDataBase64 = applyXml.toString('base64')

      const res = await client.getPreprint({
        proc_id: preprintProcId,
        form_id: fi.form_id ?? '999000000000000001',
        form_version: fi.form_version ?? 1,
        file_data: fileDataBase64,
        application_info: [
          { label: '労働保険番号', value: '12345678901234' },
          { label: 'アクセスコード', value: '0000000000' },
        ],
      })
      expect(res.results).toBeDefined()
      record('06-1', 'プレ印字データ取得', 'pass', {
        httpStatus: 200,
        durationMs: Date.now() - start,
      })
    } catch (e: any) {
      // プレ印字は手続によって利用不可の場合がある
      record('06-1', 'プレ印字データ取得', 'fail', {
        httpStatus: e.statusCode,
        error: e.message,
        durationMs: Date.now() - start,
      })
      throw e
    }
  })
})
