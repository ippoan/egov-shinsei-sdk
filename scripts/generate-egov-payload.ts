#!/usr/bin/env npx tsx
/**
 * e-Gov 個別ファイル署名形式 — 申請データ一式ジェネレータ (手続 950A101220029000)
 *
 * 受付 #5370088 の 5/15 回答「エラーが発生する申請データ一式 (kousei.xml、
 * kouseiYYYYMMddHHmmssSSS.xml 等すべて) を送付してほしい」への回答添付を
 * 生成する。e-Gov が 5/7 に提示したサンプル構造を **そのまま** 再現する
 * (= 本番送信で「構成管理情報の申請書属性情報は"申請書送信"の場合は指定する
 * ことができません」エラーになる構造)。
 *
 * 生成物 (--out ディレクトリ):
 *   950A101220029000/kousei.xml                       構成管理情報 (新規申請)
 *   950A101220029000/kousei<ts1>.xml                  WriteAppli (申請書作成 + 申請書属性情報)
 *   950A101220029000/kousei<ts2>.xml                  SignAttach (添付書類署名)
 *   950A101220029000/950A10122002900001_01.xml        申請書本体
 *   950A101220029000/Test.pdf                         添付書類署名ファイル
 *   ...skeleton 同梱の check.xml / xsl 一式
 *   950A101220029000-apply.zip                        /apply POST 用 zip
 *
 * 入力:
 *   --skeleton <path>  /procedure/950A101220029000 のスケルトン zip
 *                      (default: $EGOV_SKELETON or ./spec/skeleton-950A101220029000.zip)
 *   --pfx <path>       検証用 e-GovEE01_sha2.pfx (default: $EGOV_PFX、無ければ
 *                      SDK 同梱のテスト PFX を使用)
 *   --pfx-pass <pw>    PFX パスワード (default: gpkitest)
 *   --out <dir>        出力先 (default: ./egov-payload-950A101220029000)
 *
 * Usage:
 *   npx tsx scripts/generate-egov-payload.ts \
 *     --skeleton /tmp/egov-spec/skeleton-950A101220029000.zip \
 *     --pfx /tmp/egov-spec/certificate-for-inspection-environment-tests2024.zip/e-GovEE01_sha2.pfx
 */
import { DOMParser } from 'linkedom/cached'
;(globalThis as any).DOMParser = DOMParser
if (!(globalThis as any).Node) {
  ;(globalThis as any).Node = {
    ELEMENT_NODE: 1, TEXT_NODE: 3, CDATA_SECTION_NODE: 4,
    COMMENT_NODE: 8, DOCUMENT_NODE: 9, PROCESSING_INSTRUCTION_NODE: 7, ATTRIBUTE_NODE: 2,
  }
}

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import JSZip from 'jszip'
import { signConfig } from '../src/xmldsig/sign'
import { parsePfx } from '../src/xmldsig/pfx'
import type { ParsedPfx } from '../src/xmldsig/types'

const PROC_ID = '950A101220029000'
const FORM_ID = '950A10122002900001'
const FORM_VERSION = '0005'
const FORM_NAME = 'ＡＰＩテスト用手続（社会保険関係手続）（個）１００１＿０１'
const APPLY_FILE = `${FORM_ID}_01.xml`
const PDF_NAME = 'Test.pdf'

// --- arg parse ---
function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const SKELETON = arg('skeleton', process.env.EGOV_SKELETON ?? './spec/skeleton-950A101220029000.zip')!
const PFX_PATH = arg('pfx', process.env.EGOV_PFX)
const PFX_PASS = arg('pfx-pass', 'gpkitest')!
const OUT_DIR = resolve(arg('out', `./egov-payload-${PROC_ID}`)!)

// SDK 同梱テスト PFX (e-GovEE01_sha2.pfx, pw: gpkitest) — --pfx 省略時の fallback。
// scripts/test-apply.* と同値。
const TEST_PFX_BASE64 = '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'

function getPfx(): ParsedPfx {
  let buf: ArrayBuffer
  if (PFX_PATH) {
    const b = readFileSync(PFX_PATH)
    buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
    console.log(`  PFX: ${PFX_PATH}`)
  } else {
    buf = Uint8Array.from(atob(TEST_PFX_BASE64), (c) => c.charCodeAt(0)).buffer
    console.log('  PFX: (SDK 同梱 e-GovEE01_sha2.pfx)')
  }
  return parsePfx(buf, PFX_PASS)
}

function fillTags(xml: string, values: Record<string, string>): string {
  let out = xml
  for (const [tag, value] of Object.entries(values)) {
    out = out.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
    out = out.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
  }
  return out
}

// 最小限の PDF (1 ページ空白)。e-Gov は添付実体の中身は検証しないため
// 構造的に valid な最小 PDF で足りる。
function dummyPdf(): Uint8Array {
  const pdf = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj',
    'xref',
    '0 4',
    '0000000000 65535 f ',
    'trailer<</Root 1 0 R/Size 4>>',
    'startxref',
    '0',
    '%%EOF',
  ].join('\n')
  return new TextEncoder().encode(pdf)
}

async function main() {
  console.log(`=== e-Gov 個別ファイル署名形式 申請データ生成 (${PROC_ID}) ===`)
  const pfx = getPfx()

  const skelBuf = readFileSync(SKELETON)
  const zip = await JSZip.loadAsync(skelBuf)
  console.log(`  skeleton: ${SKELETON}`)

  // skeleton 内のファイル名から 3 構成ファイルを判別する。
  //   kousei.xml          → 構成管理情報 (main)
  //   kousei<ts>.xml で 様式ID 999000000000000009 → WriteAppli (申請書作成)
  //   kousei<ts>.xml で 様式ID 999000000000000001 → SignAttach (添付書類署名)
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir)
  const kouseiTs = names.filter((n) => /\/kousei\d{17}\.xml$/.test(n))
  let writeAppliPath = ''
  let signAttachPath = ''
  for (const n of kouseiTs) {
    const xml = await zip.file(n)!.async('string')
    if (xml.includes('<様式ID>999000000000000009</様式ID>')) writeAppliPath = n
    else if (xml.includes('<様式ID>999000000000000001</様式ID>')) signAttachPath = n
  }
  const mainPath = names.find((n) => /\/kousei\.xml$/.test(n))!
  if (!writeAppliPath || !signAttachPath) {
    throw new Error('skeleton から WriteAppli / SignAttach 構成ファイルを判別できませんでした')
  }
  const waName = writeAppliPath.split('/').pop()!
  const saName = signAttachPath.split('/').pop()!
  console.log(`  WriteAppli: ${waName}  /  SignAttach: ${saName}`)

  const applicant = {
    受付行政機関ID: '100' + PROC_ID.substring(0, 3),
    手続ID: PROC_ID,
    手続名称: `${FORM_NAME}／ＡＰＩテスト用手続（社会保険関係手続）（個）１００１`,
    氏名: 'テスト　太郎',
    氏名フリガナ: 'テスト　タロウ',
    郵便番号: '1000014',
    住所: '東京都千代田区永田町１丁目７番１号',
    住所フリガナ: 'トウキョウトチヨダクナガタチョウ',
    電話番号: '03-1234-5678',
    電子メールアドレス: 'test@example.com',
    法人団体名: 'テスト株式会社',
  }

  // --- 1. 構成管理情報 kousei.xml (申請種別: 新規申請) ---
  // 5/7 サンプル準拠: 4 件の添付書類属性情報 (WriteAppli構成情報 / 申請書本体 /
  // SignAttach構成情報 / Test.pdf) を </管理情報> 直後に挿入。
  let mainXml = await zip.file(mainPath)!.async('string')
  mainXml = fillTags(mainXml, { ...applicant, 申請種別: '新規申請' })
  const attach = [
    { 名称: `${FORM_NAME}の構成情報`, ファイル: waName },
    { 名称: FORM_NAME, ファイル: APPLY_FILE },
    { 名称: '添付書類署名ファイル１の構成情報', ファイル: saName },
    { 名称: '添付書類署名ファイル１', ファイル: PDF_NAME },
  ]
    .map(
      (a) =>
        `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>${a.名称}</添付書類名称><添付書類ファイル名称>${a.ファイル}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`,
    )
    .join('')
  mainXml = mainXml.replace('</管理情報>', '</管理情報>' + attach)
  zip.file(mainPath, mainXml)

  // --- 2. WriteAppli (申請種別: 申請書作成 + 申請書属性情報) ---
  let waXml = await zip.file(writeAppliPath)!.async('string')
  waXml = fillTags(waXml, { ...applicant, 申請種別: '申請書作成' })
  const appliAttr =
    `<申請書属性情報>` +
    `<申請書様式ID>${FORM_ID}</申請書様式ID>` +
    `<申請書様式バージョン>${FORM_VERSION}</申請書様式バージョン>` +
    `<申請書様式名称>${FORM_NAME}</申請書様式名称>` +
    `<申請書ファイル名称>${APPLY_FILE}</申請書ファイル名称>` +
    `</申請書属性情報>`
  if (!waXml.includes('<申請書属性情報>')) {
    waXml = waXml.replace('</構成情報>', appliAttr + '</構成情報>')
  }
  zip.file(writeAppliPath, waXml)

  // --- 3. SignAttach (申請種別: 添付書類署名 + 添付書類属性情報 Test.pdf) ---
  let saXml = await zip.file(signAttachPath)!.async('string')
  saXml = fillTags(saXml, { ...applicant, 申請種別: '添付書類署名' })
  const saAttach =
    `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名ファイル１</添付書類名称><添付書類ファイル名称>${PDF_NAME}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
  saXml = saXml.replace('</管理情報>', '</管理情報>' + saAttach)
  zip.file(signAttachPath, saXml)

  // --- 4. Test.pdf (添付実体) ---
  const pdfBytes = dummyPdf()
  zip.file(`${PROC_ID}/${PDF_NAME}`, pdfBytes)

  // --- 5. 申請書本体の必須フィールドを最小限埋める ---
  // 構造エラー再現が目的のため、本体は空のままでも error は再現するが、
  // e-Gov が中身も確認できるよう申請者情報を流し込む。
  const applyPath = `${PROC_ID}/${APPLY_FILE}`
  if (zip.file(applyPath)) {
    let applyXml = await zip.file(applyPath)!.async('string')
    applyXml = fillTags(applyXml, {
      氏名: 'テスト太郎', 氏名フリガナ: 'テストタロウ',
      事業所名称: 'テスト事業所', 名称: 'テスト事業所',
      所在地: '東京都千代田区永田町', 住所: '東京都千代田区永田町',
    })
    zip.file(applyPath, applyXml)
  }

  // --- 6. WriteAppli / SignAttach 構成情報 XML に xmldsig 署名 ---
  const applyContent = await zip.file(applyPath)!.async('string')
  let waSigned = await zip.file(writeAppliPath)!.async('string')
  waSigned = signConfig(waSigned, APPLY_FILE, applyContent, pfx)
  zip.file(writeAppliPath, waSigned)

  let saSigned = await zip.file(signAttachPath)!.async('string')
  saSigned = signConfig(saSigned, PDF_NAME, pdfBytes, pfx)
  zip.file(signAttachPath, saSigned)

  // --- 出力: 個別ファイル + zip ---
  mkdirSync(OUT_DIR, { recursive: true })
  for (const n of Object.keys(zip.files)) {
    if (zip.files[n].dir) continue
    const content = await zip.file(n)!.async('nodebuffer')
    const rel = n.replace(`${PROC_ID}/`, '')
    const dest = resolve(OUT_DIR, rel)
    mkdirSync(resolve(dest, '..'), { recursive: true })
    writeFileSync(dest, content)
  }
  const zipBuf = await zip.generateAsync({ type: 'nodebuffer' })
  const zipPath = resolve(OUT_DIR, `${PROC_ID}-apply.zip`)
  writeFileSync(zipPath, zipBuf)

  console.log('')
  console.log('=== 生成完了 ===')
  console.log(`  出力先: ${OUT_DIR}`)
  console.log(`  zip:    ${zipPath} (${zipBuf.length} bytes)`)
  console.log('')
  console.log('  構造 (5/7 e-Gov サンプル準拠 = 本番送信で")申請書属性情報は禁止" エラー):')
  console.log(`    kousei.xml          申請種別=新規申請、添付書類属性情報 4 件`)
  console.log(`    ${waName}  WriteAppli 申請種別=申請書作成 + 申請書属性情報 (署名済)`)
  console.log(`    ${saName}  SignAttach 申請種別=添付書類署名 (署名済)`)
  console.log(`    ${APPLY_FILE}  申請書本体`)
  console.log(`    ${PDF_NAME}              添付書類署名ファイル`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
