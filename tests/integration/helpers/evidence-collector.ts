/**
 * エビデンス収集 — e-Gov 最終確認試験のエビデンスファイルを生成する
 *
 * 仕様:
 *   テスト結果格納フォルダ: {ソフトウェアID}_{最終確認試験受付番号}/
 *   API別テスト結果格納フォルダ: {ソフトウェアID}_{試験No}/
 *     _01.txt — リクエスト情報 (URL, HTTPヘッダ部)
 *     _02.txt — リクエスト情報 (HTTPボディ部)
 *     _03.txt — レスポンス情報 (JSON)
 *     _04.ZIP — 添付ファイル (申請データ、補正データ、公文書等)
 *
 * 使い方:
 *   1. createCaptureFetch() で fetch ラッパーを作り、EgovClient に渡す
 *   2. テスト内で API 呼び出し → リクエスト/レスポンスがバッファに溜まる
 *   3. record() 内から drainEvidence(testNo) を呼び、バッファをテスト番号に紐付け
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'

const EVIDENCE_STATE_PATH = resolve(import.meta.dirname, '../../../coverage/.evidence-state.json')

export interface CapturedRequest {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  responseStatus: number
  responseHeaders: Record<string, string>
  responseBody: string
  timestamp: string
}

export interface EvidenceEntry {
  testNo: string
  requests: CapturedRequest[]
}

// --- バッファ: テスト番号が決まる前のリクエスト/レスポンスを溜める ---
let requestBuffer: CapturedRequest[] = []

/** バッファをクリア (テスト開始前に呼ぶ) */
export function clearBuffer(): void {
  requestBuffer = []
}

/** バッファの中身をテスト番号に紐付けて保存し、バッファをクリアする */
export function drainEvidence(testNo: string): void {
  if (requestBuffer.length === 0) return
  const entries = loadEntries()
  const idx = entries.findIndex(e => e.testNo === testNo)
  if (idx >= 0) {
    entries[idx] = { testNo, requests: requestBuffer }
  } else {
    entries.push({ testNo, requests: requestBuffer })
  }
  saveEntries(entries)
  requestBuffer = []
}

// --- 永続ストレージ ---
function loadEntries(): EvidenceEntry[] {
  if (!existsSync(EVIDENCE_STATE_PATH)) return []
  return JSON.parse(readFileSync(EVIDENCE_STATE_PATH, 'utf-8'))
}

function saveEntries(entries: EvidenceEntry[]): void {
  mkdirSync(dirname(EVIDENCE_STATE_PATH), { recursive: true })
  writeFileSync(EVIDENCE_STATE_PATH, JSON.stringify(entries, null, 2))
}

/**
 * fetch ラッパー — リクエスト/レスポンスをバッファにキャプチャする
 */
export function createCaptureFetch(baseFetch: typeof globalThis.fetch): typeof globalThis.fetch {
  return async function captureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = init?.method ?? 'GET'

    const reqHeaders: Record<string, string> = {}
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      for (const [k, v] of Object.entries(h)) {
        // Authorization ヘッダのトークンをマスク
        if (k.toLowerCase() === 'authorization' && v.length > 30) {
          reqHeaders[k] = v.substring(0, 27) + '...'
        } else {
          reqHeaders[k] = v
        }
      }
    }

    const res = await baseFetch(input, init)

    // レスポンスを clone して body を読む
    const cloned = res.clone()
    let responseBody = ''
    try {
      responseBody = await cloned.text()
    } catch { /* empty */ }

    const resHeaders: Record<string, string> = {}
    res.headers.forEach((v, k) => { resHeaders[k] = v })

    // リクエストボディ — send_file.file_data (base64) は巨大なので省略
    let requestBody = init?.body as string | undefined
    if (requestBody && requestBody.length > 10000) {
      try {
        const parsed = JSON.parse(requestBody)
        if (parsed.send_file?.file_data) {
          parsed.send_file.file_data = `(base64, ${parsed.send_file.file_data.length} chars)`
        }
        requestBody = JSON.stringify(parsed, null, 2)
      } catch { /* keep original */ }
    }

    requestBuffer.push({
      url, method,
      headers: reqHeaders,
      body: requestBody,
      responseStatus: res.status,
      responseHeaders: resHeaders,
      responseBody,
      timestamp: new Date().toISOString(),
    })

    return res
  }
}

/**
 * エビデンスファイルを生成する
 * @param softwareId ソフトウェアID (e.g. K26XGOmbDusxfKsp)
 * @param tid 最終確認試験受付番号 (e.g. TID_202604200001)
 * @param outputDir 出力先ディレクトリ
 */
export function generateEvidenceFiles(
  softwareId: string,
  tid: string,
  outputDir?: string,
): string {
  const entries = loadEntries()
  if (entries.length === 0) {
    console.warn('No evidence entries found.')
    return ''
  }

  const baseDir = outputDir ?? resolve(import.meta.dirname, '../../../coverage/evidence')
  const rootDir = resolve(baseDir, `${softwareId}_${tid}`)
  mkdirSync(rootDir, { recursive: true })

  for (const entry of entries) {
    const testDir = resolve(rootDir, `${softwareId}_${entry.testNo}`)
    mkdirSync(testDir, { recursive: true })
    const prefix = `${softwareId}_${entry.testNo}`

    // 各テストの主要リクエスト (最後のAPIコール) をエビデンスにする
    // 複数リクエストがある場合はすべて連結
    for (let i = 0; i < entry.requests.length; i++) {
      const req = entry.requests[i]
      const suffix = entry.requests.length > 1 ? `_${String(i + 1).padStart(2, '0')}` : ''

      // _01.txt — リクエスト情報 (URL, HTTPヘッダ部)
      const headerLines = [
        `${req.method} ${req.url}`,
        '',
        ...Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`),
      ]
      writeFileSync(resolve(testDir, `${prefix}${suffix}_01.txt`), headerLines.join('\n'))

      // _02.txt — リクエスト情報 (HTTPボディ部)
      if (req.body) {
        writeFileSync(resolve(testDir, `${prefix}${suffix}_02.txt`), req.body)
      }

      // _03.txt — レスポンス情報
      const responseLines = [
        `HTTP ${req.responseStatus}`,
        '',
        ...Object.entries(req.responseHeaders).map(([k, v]) => `${k}: ${v}`),
        '',
        req.responseBody,
      ]
      writeFileSync(resolve(testDir, `${prefix}${suffix}_03.txt`), responseLines.join('\n'))
    }
  }

  console.log(`Evidence files generated: ${rootDir}`)
  console.log(`  ${entries.length} test(s)`)
  return rootDir
}
