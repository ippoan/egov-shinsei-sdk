#!/usr/bin/env node
/**
 * e-Gov 最終確認試験 — 個別手続テスト送信
 *
 * Usage:
 *   EGOV_TOKEN=eyJ... node scripts/test-apply.mjs 950A101220029000
 *   EGOV_TOKEN=eyJ... node scripts/test-apply.mjs 950A101220029000 --trial  (署名なしTrial)
 *   EGOV_TOKEN=eyJ... node scripts/test-apply.mjs 950A101220029000 --dry    (送信せずZIP内容確認)
 */
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const JSZip = require('jszip')

const API_BASE = process.env.EGOV_API_BASE || 'https://api2.sbx.e-gov.go.jp/shinsei/v2'
const TOKEN = process.env.EGOV_TOKEN
const PROC_ID = process.argv[2]
const DRY = process.argv.includes('--dry')
const TRIAL = process.argv.includes('--trial')

if (!TOKEN || !PROC_ID) {
  console.error('Usage: EGOV_TOKEN=... node scripts/test-apply.mjs <proc_id> [--trial] [--dry]')
  process.exit(1)
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, ...opts.headers },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

// --- 1. Procedure + Skeleton ---
console.log(`=== ${PROC_ID} ===`)
const proc = await apiFetch(`/procedure/${PROC_ID}`)
const configFiles = proc.results.configuration_file_name
const fileInfo = proc.results.file_info
const fi0 = fileInfo[0]
console.log('configFiles:', configFiles)
console.log('fileInfo:', fileInfo.map(f => f.apply_file_name))

const zipBytes = Buffer.from(proc.results.file_data, 'base64')
const zip = await JSZip.loadAsync(zipBytes)

// --- 2. Main kousei.xml ---
const mainPath = `${PROC_ID}/${configFiles[0]}`
let mainXml = await zip.file(mainPath).async('string')

const kouseiValues = {
  受付行政機関ID: '100' + PROC_ID.substring(0, 3),
  手続ID: PROC_ID,
  手続名称: proc.results.proc_name || PROC_ID,
  申請種別: '新規申請',
  氏名: 'テスト　太郎',
  氏名フリガナ: 'テスト　タロウ',
  郵便番号: '1000014',
  住所: '東京都千代田区永田町１丁目７番１号',
  住所フリガナ: 'トウキョウトチヨダクナガタチョウ',
  電話番号: '03-1234-5678',
  電子メールアドレス: 'test@example.com',
}
for (const [tag, value] of Object.entries(kouseiValues)) {
  mainXml = mainXml.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
  mainXml = mainXml.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
}

// 個別署名形式: 添付書類属性情報を追加
if (configFiles.length >= 3 && fi0) {
  let attachBlocks = ''
  attachBlocks += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>${fi0.form_name}</添付書類名称><添付書類ファイル名称>${fi0.apply_file_name}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  attachBlocks += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>申請書作成構成情報</添付書類名称><添付書類ファイル名称>${configFiles[1]}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  attachBlocks += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名構成情報</添付書類名称><添付書類ファイル名称>${configFiles[2]}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  attachBlocks += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名ファイル１</添付書類名称><添付書類ファイル名称>dummy.txt</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  mainXml = mainXml.replace('</管理情報>', '</管理情報>' + attachBlocks)
}
zip.file(mainPath, mainXml)
console.log('\n[Main] kousei.xml OK')

// --- 3. WriteAppli ---
if (configFiles.length >= 3) {
  const waPath = `${PROC_ID}/${configFiles[1]}`
  let waXml = await zip.file(waPath).async('string')
  waXml = waXml.split('999000000000000001').join('999000000000000009')
  const waValues = {
    受付行政機関ID: '100' + PROC_ID.substring(0, 3),
    手続ID: PROC_ID,
    手続名称: proc.results.proc_name || PROC_ID,
    申請種別: '申請書作成',
  }
  for (const [tag, value] of Object.entries(waValues)) {
    waXml = waXml.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
    waXml = waXml.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
  }
  // 申請書属性情報を追加（署名で申請書ファイルを参照するため必須）
  if (fi0) {
    const block = `<申請書属性情報><申請書様式ID>${fi0.form_id}</申請書様式ID><申請書様式バージョン>${String(fi0.form_version).padStart(4, '0')}</申請書様式バージョン><申請書様式名称>${fi0.form_name}</申請書様式名称><申請書ファイル名称>${fi0.apply_file_name}</申請書ファイル名称></申請書属性情報>`
    waXml = waXml.replace('</構成情報>', block + '</構成情報>')
    console.log('[WriteAppli] 申請書属性情報 追加済み')
  }
  zip.file(waPath, waXml)
  console.log('[WriteAppli] OK')

  // --- 4. SignAttach ---
  const saPath = `${PROC_ID}/${configFiles[2]}`
  let saXml = await zip.file(saPath).async('string')
  saXml = saXml.split('999000000000000009').join('999000000000000001')
  const saValues = {
    受付行政機関ID: '100' + PROC_ID.substring(0, 3),
    手続ID: PROC_ID,
    手続名称: proc.results.proc_name || PROC_ID,
    申請種別: '添付書類署名',
  }
  for (const [tag, value] of Object.entries(saValues)) {
    saXml = saXml.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
    saXml = saXml.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
  }
  if (!saXml.includes('<添付書類属性情報>')) {
    const block = `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名ファイル１</添付書類名称><添付書類ファイル名称>dummy.txt</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
    saXml = saXml.replace('</管理情報>', '</管理情報>' + block)
  }
  zip.file(saPath, saXml)
  zip.file(`${PROC_ID}/dummy.txt`, 'test')
  console.log('[SignAttach] OK')
}

// --- 5. Apply XML (最小限) ---
// スケルトンのapply XMLをそのまま使用（check.xmlベースの自動填入は省略）
console.log(`[Apply] ${fi0.apply_file_name} — スケルトンのまま使用`)

// --- 6. Summary ---
console.log('\n=== ZIP contents ===')
const files = []
zip.forEach((path, f) => { if (!f.dir) files.push(path) })
files.forEach(f => console.log(`  ${f}`))

// --- 7. Send or dry-run ---
if (DRY) {
  console.log('\n--dry: 送信せず終了')
  // WriteAppli の内容を表示
  const waPath2 = `${PROC_ID}/${configFiles[1]}`
  const waContent = await zip.file(waPath2).async('string')
  console.log('\n[WriteAppli XML (tail 500)]')
  console.log(waContent.substring(waContent.length - 500))
  process.exit(0)
}

// ZIP を base64 化して送信
const zipBuf = await zip.generateAsync({ type: 'nodebuffer' })
const sendFile = { file_name: `${PROC_ID}.zip`, file_data: zipBuf.toString('base64') }

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
if (TRIAL) headers['X-eGovAPI-Trial'] = 'true'

console.log(`\n>>> Submitting (${TRIAL ? 'TRIAL' : 'REAL'})...`)
const applyRes = await fetch(`${API_BASE}/apply`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ proc_id: PROC_ID, send_file: sendFile }),
})
const result = await applyRes.json()
console.log(`Status: ${applyRes.status}`)
console.log(JSON.stringify(result, null, 2))
