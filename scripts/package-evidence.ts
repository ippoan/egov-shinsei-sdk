#!/usr/bin/env npx tsx
/**
 * e-Gov 最終確認試験 — エビデンスパッケージングスクリプト
 *
 * 1. テスト結果 (egov-test-report.json) から成績書記入用の一覧を出力
 * 2. エビデンスファイルを仕様準拠のフォルダ構造で生成
 * 3. パスワード付きZIP (5MB分割) を作成
 *
 * Usage:
 *   npx tsx scripts/package-evidence.ts
 *   npx tsx scripts/package-evidence.ts --password <zip-password>
 *   npx tsx scripts/package-evidence.ts --tid <TID_XXXXXXXX>
 */
import { resolve, dirname } from 'path'
import { existsSync, readFileSync, statSync, readdirSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { generateEvidenceFiles } from '../tests/integration/helpers/evidence-collector'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- 設定 ---
const SOFTWARE_ID = process.env.NUXT_PUBLIC_EGOV_CLIENT_ID ?? 'K26XGOmbDusxfKsp'
const REPORT_PATH = resolve(__dirname, '../coverage/egov-test-report.json')
const MAX_ZIP_SIZE = 5 * 1024 * 1024 // 5MB

// --- CLI 引数 ---
function parseArgs() {
  const args = process.argv.slice(2)
  let password = ''
  let tid = ''
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--password' && args[i + 1]) password = args[++i]
    if (args[i] === '--tid' && args[i + 1]) tid = args[++i]
  }
  return { password, tid }
}

const { password, tid: tidArg } = parseArgs()
const TID = tidArg || process.env.EGOV_TID || ''

// ============================================================
// 1. 成績書記入用の結果一覧出力
// ============================================================
console.log('=== 成績書記入用 結果一覧 ===\n')
console.log('「3_電子申請API最終確認試験テスト項目」シートに記入:\n')

if (!existsSync(REPORT_PATH)) {
  console.error(`Not found: ${REPORT_PATH}`)
  console.error('Run integration tests first: npm run test:integration')
  process.exit(1)
}

interface ReportEntry {
  test_no: string
  api_name: string
  result: string
  実施日時: string
  http_status?: number
}

const report: ReportEntry[] = JSON.parse(readFileSync(REPORT_PATH, 'utf-8'))

// 実施対象API (O) + 実施日時 + 結果 (OK/NG)
console.log('試験No | 実施対象API | 実施日時            | 結果')
console.log('-------|------------|--------------------|---------')
for (const r of report) {
  const status = r.result === 'pass' ? 'OK'
    : r.result === 'fail' ? 'NG'
    : r.result === 'skip' ? '(skip)'
    : '---'
  const target = (r.result === 'pass' || r.result === 'fail') ? 'O' : ''
  // yyyy/mm/dd hh:mm 形式
  let datetime = ''
  if (r.実施日時) {
    const d = new Date(r.実施日時)
    datetime = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  console.log(`${r.test_no.padEnd(6)} | ${target.padEnd(10)} | ${datetime.padEnd(18)} | ${status}`)
}

// ============================================================
// 2. エビデンスファイル生成
// ============================================================
if (!TID) {
  console.log('\n--tid を指定するとエビデンスフォルダとZIPを生成します。')
  console.log('例: npx tsx scripts/package-evidence.ts --tid TID_202604200001')
  process.exit(0)
}

console.log(`\n=== エビデンスファイル生成 (${SOFTWARE_ID}_${TID}) ===\n`)

const evidenceDir = generateEvidenceFiles(SOFTWARE_ID, TID)
if (!evidenceDir) {
  console.error('No evidence data. Run integration tests with fetch capture enabled.')
  process.exit(1)
}

// ============================================================
// 3. パスワード付きZIP作成 (5MB分割)
// ============================================================
if (!password) {
  console.log('\n--password を指定するとパスワード付きZIPを生成します。')
  console.log('例: npx tsx scripts/package-evidence.ts --tid TID_202604200001 --password myPass123')
  process.exit(0)
}

// zip コマンドの確認
let zipCmd = ''
try {
  execSync('which zip', { stdio: 'pipe' })
  zipCmd = 'zip'
} catch {
  try {
    execSync('which 7z', { stdio: 'pipe' })
    zipCmd = '7z'
  } catch {
    console.error('zip or 7z command not found. Install with: sudo apt install zip  or  sudo apt install p7zip-full')
    process.exit(1)
  }
}

console.log(`\n=== パスワード付きZIP作成 (${zipCmd}) ===\n`)

const outputDir = resolve(__dirname, '../coverage/submission')
mkdirSync(outputDir, { recursive: true })

// エビデンスフォルダの総サイズ計算
function getDirSize(dir: string): number {
  let total = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) total += getDirSize(full)
    else total += statSync(full).size
  }
  return total
}

const totalSize = getDirSize(evidenceDir)
const numZips = Math.ceil(totalSize / MAX_ZIP_SIZE) || 1

console.log(`Total evidence size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`)
console.log(`ZIPs needed: ${numZips} (max 5MB each)`)

// ZIP名称: 最終確認試験テスト結果_{ソフトウェアID}_{受付番号}_{送付回数}.ZIP
const zipBaseName = `最終確認試験テスト結果_${SOFTWARE_ID}_${TID}`

if (numZips === 1) {
  // 1ファイルで収まる
  const zipPath = resolve(outputDir, `${zipBaseName}_01.ZIP`)
  if (zipCmd === 'zip') {
    execSync(`zip -r -P "${password}" "${zipPath}" .`, { cwd: dirname(evidenceDir), stdio: 'inherit' })
  } else {
    execSync(`7z a -p"${password}" -tzip "${zipPath}" .`, { cwd: dirname(evidenceDir), stdio: 'inherit' })
  }
  console.log(`\nCreated: ${zipPath}`)
} else {
  // 分割: テストフォルダ単位で振り分け
  const testDirs = readdirSync(evidenceDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({ name: e.name, size: getDirSize(resolve(evidenceDir, e.name)) }))

  // 大きい順にソートしてビンパッキング
  testDirs.sort((a, b) => b.size - a.size)
  const bins: Array<{ dirs: string[]; size: number }> = []
  for (const td of testDirs) {
    let placed = false
    for (const bin of bins) {
      if (bin.size + td.size <= MAX_ZIP_SIZE) {
        bin.dirs.push(td.name)
        bin.size += td.size
        placed = true
        break
      }
    }
    if (!placed) {
      bins.push({ dirs: [td.name], size: td.size })
    }
  }

  for (let i = 0; i < bins.length; i++) {
    const zipPath = resolve(outputDir, `${zipBaseName}_${String(i + 1).padStart(2, '0')}.ZIP`)
    const dirs = bins[i].dirs.join(' ')
    if (zipCmd === 'zip') {
      execSync(`zip -r -P "${password}" "${zipPath}" ${dirs}`, { cwd: evidenceDir, stdio: 'inherit' })
    } else {
      execSync(`7z a -p"${password}" -tzip "${zipPath}" ${dirs}`, { cwd: evidenceDir, stdio: 'inherit' })
    }
    console.log(`Created: ${zipPath} (${(bins[i].size / 1024 / 1024).toFixed(1)}MB, ${bins[i].dirs.length} tests)`)
  }
}

console.log('\n=== メール送信手順 ===')
console.log(`1通目: 件名「最終確認試験結果の提出（成績書）（1／${numZips}）」`)
console.log(`       添付: ${zipBaseName}_01.ZIP (成績書Excel + テスト結果)`)
if (numZips > 1) {
  for (let i = 2; i <= numZips; i++) {
    console.log(`${i}通目: 件名「最終確認試験結果の提出（成績書）（${i}／${numZips}）」`)
    console.log(`       添付: ${zipBaseName}_${String(i).padStart(2, '0')}.ZIP`)
  }
}
console.log(`最終:  件名「最終確認試験結果の提出（パスワード）」`)
console.log(`       本文: ZIPパスワード = ${password}`)
