#!/usr/bin/env npx tsx
/**
 * e-Gov 最終確認試験 — EGOV_PREPARED_DATA 構築ス���リプト (Phase 2)
 *
 * collect-arrive-ids.ts の出力 (coverage/.collect-arrive-ids.json) を読み込み、
 * 自動遷移後の notice_sub_id を通知一覧APIで取得して EGOV_PREPARED_DATA を構築する。
 *
 * Usage:
 *   npx tsx scripts/build-prepared-data.ts
 *   npx tsx scripts/build-prepared-data.ts --retry  # notice_sub_id 未取得時にリトライ
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { EgovClient } from '../src/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

// --- 到達番号データ読み込み ---
const collectPath = resolve(__dirname, '../coverage/.collect-arrive-ids.json')
if (!existsSync(collectPath)) {
  console.error(`Not found: ${collectPath}`)
  console.error('Run collect-arrive-ids.ts first.')
  process.exit(1)
}

const collected = JSON.parse(readFileSync(collectPath, 'utf-8'))
if (collected.dry) {
  console.error('The collected data is from a dry run. Run collect-arrive-ids.ts without --dry first.')
  process.exit(1)
}

// --- クライアント初期化 ---
const apiBase = process.env.NUXT_PUBLIC_EGOV_API_BASE
const authBase = process.env.NUXT_PUBLIC_EGOV_AUTH_BASE
const clientId = process.env.NUXT_PUBLIC_EGOV_CLIENT_ID
const clientSecret = process.env.NUXT_EGOV_CLIENT_SECRET
const accessToken = process.env.EGOV_ACCESS_TOKEN

if (!apiBase || !authBase || !clientId || !clientSecret || !accessToken) {
  console.error('Missing env vars.')
  process.exit(1)
}

const client = new EgovClient({ apiBase, authBase, clientId, clientSecret })
client.setAccessToken(accessToken)

// --- メイン処理 ---
const subs = collected.submissions as Record<string, { proc_id: string; arrive_id: string }>

const preparedData: Record<string, string> = {}

// 09-1: 再提出用
if (subs['09-1']?.arrive_id) {
  preparedData.proc_id_09 = subs['09-1'].proc_id
  preparedData.arrive_id_09 = subs['09-1'].arrive_id
  console.log(`09-1: proc_id=${subs['09-1'].proc_id}, arrive_id=${subs['09-1'].arrive_id}`)
}

// 10-1: 補正用
if (subs['10-1']?.arrive_id) {
  preparedData.proc_id_10 = subs['10-1'].proc_id
  preparedData.arrive_id_10 = subs['10-1'].arrive_id
  console.log(`10-1: proc_id=${subs['10-1'].proc_id}, arrive_id=${subs['10-1'].arrive_id}`)
}

// 19-1: 公文書 — notice_sub_id を通知一覧から取得
if (subs['19-1']?.arrive_id) {
  const arriveId = subs['19-1'].arrive_id
  preparedData.arrive_id_19 = arriveId
  console.log(`19-1: arrive_id=${arriveId}`)

  console.log('  listNotices...')
  const today = new Date().toISOString().slice(0, 10)
  const notices = await client.listNotices({
    date_from: '2020-01-01',
    date_to: today,
    limit: 100,
    offset: 0,
  })

  // 到達番号に紐づく通知を探す
  const items = (notices.results as any)?.notice_list ?? []
  const match = items.find((n: any) => n.arrive_id === arriveId)

  if (match?.notice_sub_id) {
    preparedData.notice_sub_id_19 = String(match.notice_sub_id)
    console.log(`  notice_sub_id: ${match.notice_sub_id}`)
  } else {
    console.warn(`  notice_sub_id not found for arrive_id=${arriveId}`)
    console.warn('  Data may not have transitioned yet. Try again with --retry.')
  }
}

// --- 出力 ---
console.log('\n=== EGOV_PREPARED_DATA ===')
const json = JSON.stringify(preparedData)
console.log(json)
console.log(`\n.env に追加:\nEGOV_PREPARED_DATA='${json}'`)
console.log(`\nテスト実行:\nnpm run test:integration`)
