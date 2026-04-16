#!/usr/bin/env npx tsx
/**
 * e-Gov 最終確認試験 — 到達番号収集スクリプト
 *
 * 指定された手続IDで申請送信し、到達番号 (arrive_id) を収集する。
 * 09-1 (再提出), 10-1 (補正), 19-1 (公文書) の前提データを作る Phase 1。
 *
 * Usage:
 *   npx tsx scripts/collect-arrive-ids.ts --09 <proc_id> --10 <proc_id> --19 <proc_id>
 *   npx tsx scripts/collect-arrive-ids.ts --09 <proc_id> --10 <proc_id> --19 <proc_id> --dry
 *
 * 環境変数でも指定可:
 *   PROC_ID_09=xxx PROC_ID_10=xxx PROC_ID_19=xxx npx tsx scripts/collect-arrive-ids.ts
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { EgovClient } from '../src/client'
import { buildApplicationZip } from '../tests/integration/helpers/test-data-builder'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

// --- CLI 引数パース ---
function parseArgs() {
  const args = process.argv.slice(2)
  const result: Record<string, string> = {}
  let dry = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry') { dry = true; continue }
    const m = args[i].match(/^--(09|10|19)$/)
    if (m && args[i + 1] && !args[i + 1].startsWith('--')) {
      result[m[1]] = args[++i]
    }
  }

  return {
    procId09: result['09'] || process.env.PROC_ID_09 || '',
    procId10: result['10'] || process.env.PROC_ID_10 || '',
    procId19: result['19'] || process.env.PROC_ID_19 || '',
    dry,
  }
}

const { procId09, procId10, procId19, dry } = parseArgs()

const submissions = [
  { testNo: '09-1', procId: procId09, purpose: '再提出' },
  { testNo: '10-1', procId: procId10, purpose: '補正' },
  { testNo: '19-1', procId: procId19, purpose: '公文書' },
].filter(s => s.procId)

if (submissions.length === 0) {
  console.error('Usage: npx tsx scripts/collect-arrive-ids.ts --09 <proc_id> [--10 <proc_id>] [--19 <proc_id>] [--dry]')
  console.error('  or set PROC_ID_09, PROC_ID_10, PROC_ID_19 environment variables')
  process.exit(1)
}

// --- クライアント初期化 ---
const apiBase = process.env.NUXT_PUBLIC_EGOV_API_BASE
const authBase = process.env.NUXT_PUBLIC_EGOV_AUTH_BASE
const clientId = process.env.NUXT_PUBLIC_EGOV_CLIENT_ID
const clientSecret = process.env.NUXT_EGOV_CLIENT_SECRET
const accessToken = process.env.EGOV_ACCESS_TOKEN

if (!apiBase || !authBase || !clientId || !clientSecret || !accessToken) {
  console.error('Missing env vars. Required: NUXT_PUBLIC_EGOV_API_BASE, NUXT_PUBLIC_EGOV_AUTH_BASE,')
  console.error('NUXT_PUBLIC_EGOV_CLIENT_ID, NUXT_EGOV_CLIENT_SECRET, EGOV_ACCESS_TOKEN')
  process.exit(1)
}

const client = new EgovClient({ apiBase, authBase, clientId, clientSecret })
client.setAccessToken(accessToken)

// --- メイン処理 ---
interface SubmissionResult {
  proc_id: string
  arrive_id: string
  purpose: string
  error?: string
}

const results: Record<string, SubmissionResult> = {}

console.log(`\n=== 到達番号収集 ${dry ? '(DRY RUN)' : ''} ===\n`)

for (const { testNo, procId, purpose } of submissions) {
  console.log(`--- ${testNo} ${purpose} (${procId}) ---`)
  try {
    // 1. 手続選択 → スケルトン取得
    console.log('  getProcedure...')
    const procRes = await client.getProcedure(procId)
    const procResult = procRes.results as any

    // 2. 署名付きZIP構築
    console.log('  buildApplicationZip...')
    const { zipBase64 } = await buildApplicationZip(procResult, procId)
    console.log(`  ZIP built (${Math.round(zipBase64.length * 3 / 4 / 1024)}KB)`)

    if (dry) {
      console.log('  [DRY RUN] skipping submitApplication')
      results[testNo] = { proc_id: procId, arrive_id: '(dry-run)', purpose }
      continue
    }

    // 3. 申請送信
    console.log('  submitApplication...')
    const res = await client.submitApplication({
      proc_id: procId,
      send_file: { file_name: `${procId}.zip`, file_data: zipBase64 },
    })

    const arriveId = res.results.arrive_id
    console.log(`  arrive_id: ${arriveId}`)
    results[testNo] = { proc_id: procId, arrive_id: arriveId, purpose }
  } catch (err: any) {
    const errMsg = err.message || JSON.stringify(err)
    console.error(`  ERROR: ${errMsg}`)
    if (err.statusCode) console.error(`  HTTP ${err.statusCode}: ${err.errorMessages?.join(', ') ?? ''}`)
    results[testNo] = { proc_id: procId, arrive_id: '', purpose, error: errMsg }
  }
}

// --- 結果出力 ---
const output = {
  timestamp: new Date().toISOString(),
  dry,
  submissions: results,
}

console.log('\n=== 結果 ===')
console.log(JSON.stringify(output, null, 2))

// ファイルに保存
const coverageDir = resolve(__dirname, '../coverage')
mkdirSync(coverageDir, { recursive: true })
const outPath = resolve(coverageDir, '.collect-arrive-ids.json')
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(`\nSaved to: ${outPath}`)

// エラーチェック
const errors = Object.entries(results).filter(([, r]) => r.error)
if (errors.length > 0) {
  console.error(`\n${errors.length} submission(s) failed.`)
  process.exit(1)
}

if (!dry) {
  console.log('\n次のステップ:')
  console.log('  1. 自動遷移を待つ (数分)')
  console.log('  2. npx tsx scripts/build-prepared-data.ts')
  console.log('  3. npm run test:integration')
}
