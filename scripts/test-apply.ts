#!/usr/bin/env npx tsx
/**
 * e-Gov 最終確認試験 — 個別手続テスト送信（署名付き）
 *
 * Usage:
 *   EGOV_TOKEN=eyJ... npx tsx scripts/test-apply.ts 950A101220029000
 *   EGOV_TOKEN=eyJ... npx tsx scripts/test-apply.ts 950A101220029000 --dry
 */
// Node.js polyfill for browser APIs used by xmldsig
import { DOMParser } from 'linkedom/cached'
;(globalThis as any).DOMParser = DOMParser
// Node.ELEMENT_NODE etc. constants
if (!(globalThis as any).Node) {
  ;(globalThis as any).Node = { ELEMENT_NODE: 1, TEXT_NODE: 3, CDATA_SECTION_NODE: 4, COMMENT_NODE: 8, DOCUMENT_NODE: 9, PROCESSING_INSTRUCTION_NODE: 7, ATTRIBUTE_NODE: 2 }
}

import JSZip from 'jszip'
import { signKousei, signConfig } from '../src/xmldsig/sign'
import { parsePfx } from '../src/xmldsig/pfx'

const API_BASE = process.env.EGOV_API_BASE || 'https://api2.sbx.e-gov.go.jp/shinsei/v2'
const TOKEN = process.env.EGOV_TOKEN!
const PROC_ID = process.argv[2]
const PROC_NAME = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : PROC_ID
const DRY = process.argv.includes('--dry')

if (!TOKEN || !PROC_ID) {
  console.error('Usage: EGOV_TOKEN=... npx tsx scripts/test-apply.ts <proc_id> [--dry]')
  process.exit(1)
}

// テスト証明書 (e-GovEE01_sha2.pfx, pw: gpkitest)
const TEST_PFX_BASE64 = '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'
const pfxBuf = Uint8Array.from(atob(TEST_PFX_BASE64), c => c.charCodeAt(0)).buffer
const pfx = parsePfx(pfxBuf, 'gpkitest')

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, ...opts.headers as Record<string, string> },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

// --- 1. Procedure + Skeleton ---
console.log(`=== ${PROC_ID} ===`)
const proc = await apiFetch(`/procedure/${PROC_ID}`) as any
const configFiles: string[] = proc.results.configuration_file_name
const fileInfo = proc.results.file_info
const fi0 = fileInfo[0]
console.log('configFiles:', configFiles)

const zipBytes = Buffer.from(proc.results.file_data, 'base64')
const zip = await JSZip.loadAsync(zipBytes)

// --- 2. Main kousei.xml ---
const mainPath = `${PROC_ID}/${configFiles[0]}`
let mainXml = await zip.file(mainPath)!.async('string')
const kouseiValues: Record<string, string> = {
  受付行政機関ID: '100' + PROC_ID.substring(0, 3),
  手続ID: PROC_ID,
  手続名称: PROC_NAME,
  申請種別: '新規申請',
  氏名: 'テスト　太郎', 氏名フリガナ: 'テスト　タロウ',
  郵便番号: '1000014', 住所: '東京都千代田区永田町１丁目７番１号',
  住所フリガナ: 'トウキョウトチヨダクナガタチョウ',
  電話番号: '03-1234-5678', 電子メールアドレス: 'test@example.com',
}
for (const [tag, value] of Object.entries(kouseiValues)) {
  mainXml = mainXml.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
  mainXml = mainXml.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
}
// 個別署名形式: 添付書類属性情報
if (configFiles.length >= 3 && fi0) {
  let ab = ''
  ab += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>${fi0.form_name}</添付書類名称><添付書類ファイル名称>${fi0.apply_file_name}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  ab += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>申請書作成構成情報</添付書類名称><添付書類ファイル名称>${configFiles[1]}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  ab += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名構成情報</添付書類名称><添付書類ファイル名称>${configFiles[2]}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  ab += `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名ファイル１</添付書類名称><添付書類ファイル名称>dummy.txt</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  mainXml = mainXml.replace('</管理情報>', '</管理情報>' + ab)
}
zip.file(mainPath, mainXml)

// --- 3. SignAttach (configFiles[1], 様式ID 1) ---
if (configFiles.length >= 3) {
  const saPath = `${PROC_ID}/${configFiles[1]}`
  let saXml = await zip.file(saPath)!.async('string')
  for (const [tag, value] of Object.entries({ 受付行政機関ID: '100' + PROC_ID.substring(0, 3), 手続ID: PROC_ID, 手続名称: PROC_NAME, 申請種別: '添付書類署名' })) {
    saXml = saXml.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
    saXml = saXml.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
  }
  const saAttach = `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名ファイル１</添付書類名称><添付書類ファイル名称>dummy.txt</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  saXml = saXml.replace('</管理情報>', '</管理情報>' + saAttach)
  zip.file(saPath, saXml)
  zip.file(`${PROC_ID}/dummy.txt`, 'test')
  console.log('[SignAttach] OK')

  // --- 4. WriteAppli (configFiles[2], 様式ID 9) ---
  const waPath = `${PROC_ID}/${configFiles[2]}`
  let waXml = await zip.file(waPath)!.async('string')
  for (const [tag, value] of Object.entries({ 受付行政機関ID: '100' + PROC_ID.substring(0, 3), 手続ID: PROC_ID, 手続名称: PROC_NAME, 申請種別: '申請書作成' })) {
    waXml = waXml.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
    waXml = waXml.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
  }
  // NOTE: spec (shinseisyodata p.2-20/図2-7) では 申請書属性情報 は設定必須だが、
  //       server は「"申請書送信"の場合指定できません」で拒否するCatch-22。
  zip.file(waPath, waXml)
  console.log('[WriteAppli] OK')
}

// --- 5. 署名 ---
const applyContent = await zip.file(`${PROC_ID}/${fi0.apply_file_name}`)!.async('string')
if (configFiles.length < 3) {
  // 標準形式: Main kousei.xml に署名
  let signedMain = await zip.file(mainPath)!.async('string')
  const appFiles = new Map<string, string>()
  appFiles.set(fi0.apply_file_name, applyContent)
  signedMain = signKousei(signedMain, appFiles, pfx)
  zip.file(mainPath, signedMain)
  console.log('[Sign] Main OK')
} else {
  // 個別署名形式: Main kousei.xml は署名不要
  console.log('[Sign] Main skipped（個別署名形式は構成管理XMLに署名なし）')
}

if (configFiles.length >= 3) {
  // SignAttach: dummy.txt を Reference に
  const saPath = `${PROC_ID}/${configFiles[1]}`
  let saXml = await zip.file(saPath)!.async('string')
  saXml = signConfig(saXml, 'dummy.txt', 'test', pfx)
  zip.file(saPath, saXml)
  console.log('[Sign] SignAttach OK')

  // WriteAppli: 申請書ファイルを Reference に
  const waPath = `${PROC_ID}/${configFiles[2]}`
  let waXml = await zip.file(waPath)!.async('string')
  waXml = signConfig(waXml, fi0.apply_file_name, applyContent, pfx)
  zip.file(waPath, waXml)
  console.log('[Sign] WriteAppli OK')
}

// --- 6. Summary ---
// 各構成情報の様式IDを確認
for (const cf of configFiles) {
  const xml = await zip.file(`${PROC_ID}/${cf}`)!.async('string')
  const m = xml.match(/様式ID[>]([^<]*)</)
  console.log(`[様式ID] ${cf}: ${m ? m[1] : '(not found)'}`)
}
if (DRY) {
  console.log('\n--dry: 送信せず終了')
  process.exit(0)
}

// --- 7. Submit ---
const zipBuf = await zip.generateAsync({ type: 'nodebuffer' })
const sendFile = { file_name: `${PROC_ID}.zip`, file_data: zipBuf.toString('base64') }
console.log(`\n>>> Submitting...`)
const applyRes = await fetch(`${API_BASE}/apply`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ proc_id: PROC_ID, send_file: sendFile }),
})
const result = await applyRes.json()
console.log(`Status: ${applyRes.status}`)
console.log(JSON.stringify(result, null, 2))
