import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { drainEvidence, clearBuffer } from './evidence-collector'

const SPEC_PATH = resolve(import.meta.dirname, '../../../spec/final_confirmation_test_requirements.json')
const OUTPUT_PATH = resolve(import.meta.dirname, '../../../coverage/egov-test-report.json')
const RESULTS_PATH = resolve(import.meta.dirname, '../../../coverage/.test-results-raw.json')

interface TestResult {
  test_no: string
  api_name: string
  status: 'pass' | 'fail' | 'skip'
  http_status?: number
  response_summary?: string
  error?: string
  duration_ms: number
  timestamp: string
}

/** 結果を追記（ファイルベース、マルチプロセス対応） */
export function record(
  testNo: string,
  apiName: string,
  status: 'pass' | 'fail' | 'skip',
  opts: { httpStatus?: number; response?: string; error?: string; durationMs?: number } = {},
): void {
  mkdirSync(dirname(RESULTS_PATH), { recursive: true })
  const existing: TestResult[] = existsSync(RESULTS_PATH)
    ? JSON.parse(readFileSync(RESULTS_PATH, 'utf-8'))
    : []
  existing.push({
    test_no: testNo,
    api_name: apiName,
    status,
    http_status: opts.httpStatus,
    response_summary: opts.response,
    error: opts.error,
    duration_ms: opts.durationMs ?? 0,
    timestamp: new Date().toISOString(),
  })
  writeFileSync(RESULTS_PATH, JSON.stringify(existing, null, 2))

  // エビデンス: バッファに溜まったリクエスト/レスポンスをテスト番号に紐付け
  drainEvidence(testNo)
}

/** エビデンスバッファをクリア (テスト開始前に呼ばれる) */
export function resetEvidence(): void {
  clearBuffer()
}

/** 全結果を spec と合成して最終レポートを出力 */
export function flush(): void {
  const results: TestResult[] = existsSync(RESULTS_PATH)
    ? JSON.parse(readFileSync(RESULTS_PATH, 'utf-8'))
    : []

  const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf-8')) as Array<{
    test_no: string
    api_name: string
    confirmation: string
    result: string
  }>

  const report = spec.map((item) => {
    const r = results.find((r) => r.test_no === item.test_no)
    return {
      ...item,
      result: r?.status ?? 'not_run',
      実施日時: r?.timestamp ?? '',
      http_status: r?.http_status,
      response_summary: r?.response_summary,
      error: r?.error,
      duration_ms: r?.duration_ms,
    }
  })

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2))
}
