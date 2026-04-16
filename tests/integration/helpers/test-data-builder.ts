/**
 * ZIP 構築ロジック — scripts/test-apply.ts から抽出
 * e-Gov 最終確認試験用の申請データ ZIP を構築する
 */
import { DOMParser } from 'linkedom/cached'
;(globalThis as any).DOMParser = DOMParser
if (!(globalThis as any).Node) {
  ;(globalThis as any).Node = {
    ELEMENT_NODE: 1, TEXT_NODE: 3, CDATA_SECTION_NODE: 4,
    COMMENT_NODE: 8, DOCUMENT_NODE: 9, PROCESSING_INSTRUCTION_NODE: 7, ATTRIBUTE_NODE: 2,
  }
}

import JSZip from 'jszip'
import { signKousei, signConfig } from '../../../src/xmldsig/sign'
import { parsePfx } from '../../../src/xmldsig/pfx'
// テスト証明書 (e-GovEE01_sha2.pfx, pw: gpkitest)
const TEST_PFX_BASE64 = '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'

function getPfx() {
  const pfxBuf = Uint8Array.from(atob(TEST_PFX_BASE64), c => c.charCodeAt(0)).buffer
  return parsePfx(pfxBuf, 'gpkitest')
}

/**
 * check.xml から必須フィールドを解析し、タグ名パターンに基づいてテスト値を生成する
 * (nuxt-egov final-test.vue の buildTestValuesFromCheck を移植)
 */
function buildTestValuesFromCheck(checkXml: string): Record<string, string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(checkXml, 'text/xml')
  const items = doc.querySelectorAll('checkItem')
  const values: Record<string, string> = {}
  const now = new Date()

  items.forEach((item: any) => {
    const tag = item.querySelector('errtag')?.textContent
    if (!tag) return
    const required = item.querySelector('omitDisabled') !== null
    if (!required) return

    const isNum = item.querySelector('numerical') !== null
    const isFullWidth = item.querySelector('fullAllChar') !== null
    const maxLenEl = item.querySelector('char > range > number')
    const maxLen = maxLenEl ? Number(maxLenEl.textContent) : 10
    const intDigitEl = item.querySelector('intDigit > number')
    const intDigit = intDigitEl ? Number(intDigitEl.textContent) : 0
    const isEqual = item.querySelector('char > range > equal') !== null

    const lastSeg = tag.includes('/') ? tag.split('/').pop()! : tag
    const fullTag = tag.toLowerCase()
    const t = lastSeg.toLowerCase()
    if (t.includes('年号')) {
      values[tag] = '令和'
    } else if (t.includes('年') && !t.includes('氏名') && !t.includes('名称')) {
      values[tag] = intDigit >= 4 ? String(now.getFullYear()) : '8'
    } else if (t.includes('月') && !t.includes('氏名') && !t.includes('名称')) {
      values[tag] = String(now.getMonth() + 1)
    } else if (t.includes('日') && !t.includes('氏名') && !t.includes('名称')) {
      values[tag] = String(now.getDate())
    } else if (t.includes('配達局番号')) {
      values[tag] = '100'
    } else if (t.includes('町域番号')) {
      values[tag] = '0014'
    } else if (t.includes('郵便番号') && t.includes('親')) {
      values[tag] = '100'
    } else if (t.includes('郵便番号') && t.includes('子')) {
      values[tag] = '0014'
    } else if (t.includes('市外局番')) {
      values[tag] = '03'
    } else if (t.includes('市内局番')) {
      values[tag] = '1234'
    } else if (t.includes('加入者番号')) {
      values[tag] = '5678'
    } else if ((t.includes('フリガナ') || t.includes('カナ')) && (fullTag.includes('氏名') || t.includes('氏名'))) {
      values[tag] = 'テストタロウ'
    } else if (t.includes('カナ') || t.includes('フリガナ')) {
      values[tag] = 'テストジギョウショ'
    } else if ((t.includes('所在地') || t.includes('住所')) && !t.includes('フリガナ') && !t.includes('カナ')) {
      values[tag] = '東京都千代田区永田町'
    } else if (t.includes('あて先') || t.includes('宛先')) {
      values[tag] = 'テスト宛先'
    } else if (t.includes('概要')) {
      values[tag] = 'テスト事業'
    } else if (t.includes('種類') || t.includes('業種')) {
      values[tag] = 'その他'
    } else if (t.includes('名称') || t.includes('事業所名') || t.includes('事業の名称')) {
      values[tag] = 'テスト事業所'
    } else if (t.includes('氏名')) {
      values[tag] = 'テスト太郎'
    } else if (t.includes('チェックボックス') || t.includes('チェック')) {
      values[tag] = '1'
    } else if (t.includes('記号')) {
      values[tag] = isNum ? '1' : 'ア'
    } else if ((t.includes('賃金') || t.includes('金額') || t.includes('見込額')) && !t.includes('日')) {
      values[tag] = maxLen >= 6 ? '100000' : '1'.repeat(Math.min(maxLen, 5))
    } else if (t.includes('番号') && maxLenEl && isEqual) {
      values[tag] = '1'.repeat(maxLen)
    } else if (t.includes('番号') && isNum) {
      values[tag] = '1'.padStart(intDigit || 1, '0').substring(0, intDigit || 5)
    } else if (t.includes('番号')) {
      values[tag] = '0001'
    } else if (t.includes('件数') || t.includes('人数')) {
      values[tag] = '0'
    } else if (isNum) {
      values[tag] = '1'
    } else if (isFullWidth) {
      values[tag] = 'テスト'
    } else {
      values[tag] = 'test'
    }
  })

  return values
}

/**
 * 申請書XMLの必須フィールドをcheck.xmlに基づいて填入し、後処理を行う
 */
function fillApplyXmlFromCheck(applyXml: string, checkXml: string): string {
  const testValues = buildTestValuesFromCheck(checkXml)
  let xml = applyXml

  for (const [tag, value] of Object.entries(testValues)) {
    const actualTag = tag.includes('/') ? tag.split('/').pop()! : tag
    xml = xml.replace(new RegExp(`<${actualTag}(\\s[^>]*)?>([^<]*)</${actualTag}>`, 'g'), (_m, attrs) => `<${actualTag}${attrs || ''}>${value}</${actualTag}>`)
    xml = xml.replace(new RegExp(`<${actualTag}(\\s[^>]*)?\\/>`, 'g'), (_m, attrs) => `<${actualTag}${attrs || ''}>${value}</${actualTag}>`)
  }

  // 残った空の年月日タグを全て埋める
  const now = new Date()
  xml = xml.replace(/<年号(\s[^>]*)?>(\s*)<\/年号>/g, (_m, a) => `<年号${a || ''}>令和</年号>`)
  xml = xml.replace(/<年号(\s[^>]*)?\/>(?!<\/)/g, (_m, a) => `<年号${a || ''}>令和</年号>`)
  xml = xml.replace(/<年(\s[^>]*)?>(\s*)<\/年>/g, (_m, a) => `<年${a || ''}>8</年>`)
  xml = xml.replace(/<年(\s[^>]*)?\/>(?!<\/)/g, (_m, a) => `<年${a || ''}>8</年>`)
  xml = xml.replace(/<月(\s[^>]*)?>(\s*)<\/月>/g, (_m, a) => `<月${a || ''}>${now.getMonth() + 1}</月>`)
  xml = xml.replace(/<月(\s[^>]*)?\/>(?!<\/)/g, (_m, a) => `<月${a || ''}>${now.getMonth() + 1}</月>`)
  xml = xml.replace(/<日(\s[^>]*)?>(\s*)<\/日>/g, (_m, a) => `<日${a || ''}>${now.getDate()}</日>`)
  xml = xml.replace(/<日(\s[^>]*)?\/>(?!<\/)/g, (_m, a) => `<日${a || ''}>${now.getDate()}</日>`)

  // 在留期間の年は西暦4桁に修正
  xml = xml.replace(/<在留期間>([\s\S]*?)<\/在留期間>/g, (m) => m.replace(/<年([^>]*)>8<\/年>/, `<年$1>${now.getFullYear()}</年>`))

  // フォールバック: 残った空タグをタグ名パターンで埋める
  xml = xml.replace(/<([^\s/>]+)(\s[^>]*)?>(\s*)<\/\1>/g, (m, tag, attrs, content) => {
    if (content.trim()) return m
    const t = tag.toLowerCase()
    let val = ''
    if (t.includes('scriptcheck')) val = '1'
    else if (t.includes('配達局番号')) val = '100'
    else if (t.includes('町域番号')) val = '0014'
    else if (t.includes('市外局番')) val = '03'
    else if (t.includes('市内局番')) val = '1234'
    else if (t.includes('加入者番号')) val = '5678'
    else if (t.includes('カナ住所') || t.includes('住所カナ')) val = 'トウキョウト'
    else if (t.includes('カナ名称') || t.includes('名称カナ')) val = 'テスト'
    else if (t.includes('漢字住所')) val = '東京都千代田区永田町'
    else if (t.includes('漢字名称')) val = 'テスト事業所'
    else if (t.includes('所在地') || (t.includes('住所') && !t.includes('届') && !t.includes('変更'))) val = '東京都千代田区永田町'
    else if (t.includes('名称') || t.includes('事業所名')) val = 'テスト事業所'
    else if (t.includes('氏名')) val = 'テスト太郎'
    else if (t.includes('見込額') || t.includes('賃金')) val = '100000'
    else if (t.includes('チェックボックス') || t.includes('チェック')) val = '1'
    if (!val) return m
    return `<${tag}${attrs || ''}>${val}</${tag}>`
  })

  // カタカナ/フリガナフィールドに漢字が入っている場合はカタカナに置換
  xml = xml.replace(/<([^<>]*(?:カタカナ|フリガナ)[^<>]*)>([^<]+)<\/\1>/g, (m, tag, val) => {
    if (/^[\u30A0-\u30FF\u3000\s]+$/.test(val)) return m
    const t = tag.toLowerCase()
    if (t.includes('氏名')) return `<${tag}>テストタロウ</${tag}>`
    if (t.includes('所在地') || t.includes('住所')) return `<${tag}>トウキョウトチヨダクナガタチョウ</${tag}>`
    return `<${tag}>テストジギョウショ</${tag}>`
  })

  // 賃金関連フィールド: 桁数制限
  xml = xml.replace(/<(賃金締切日|賃金支払日当翌|賃金支払日)>(\d{4,})<\/\1>/g, '<$1>1</$1>')

  return xml
}

function fillXmlTags(xml: string, values: Record<string, string>): string {
  for (const [tag, value] of Object.entries(values)) {
    xml = xml.replace(new RegExp(`<${tag}/>`, 'g'), `<${tag}>${value}</${tag}>`)
    xml = xml.replace(new RegExp(`<${tag}></${tag}>`, 'g'), `<${tag}>${value}</${tag}>`)
  }
  return xml
}

interface ProcedureResult {
  configuration_file_name: string[]
  file_info: Array<{ form_id?: string; form_version?: number; form_name: string; apply_file_name: string }>
  file_data: string
}

/**
 * 手続選択 API のレスポンスから署名付き申請 ZIP を構築する
 */
export async function buildApplicationZip(
  procResult: ProcedureResult,
  procId: string,
  procName?: string,
  attachments?: Array<{ name: string; fileName: string; content: Buffer }>,
  applyType?: string,
  skipSign?: boolean,
  initialArriveId?: string,
): Promise<{ zipBase64: string; zipBuffer: Buffer }> {
  const pfx = getPfx()
  const configFiles = procResult.configuration_file_name
  const fi0 = procResult.file_info[0]
  // 手続名称: procName > form_name から＿XX を除去して「名称／名称」形式にする
  const baseName = fi0?.form_name?.replace(/＿[０-９\d]+$/, '') ?? procId
  const name = procName ?? `${baseName}／${baseName}`

  const zipBytes = Buffer.from(procResult.file_data, 'base64')
  const zip = await JSZip.loadAsync(zipBytes)

  // Main kousei.xml
  const mainPath = `${procId}/${configFiles[0]}`
  let mainXml = await zip.file(mainPath)!.async('string')
  const kouseiTags: Record<string, string> = {
    受付行政機関ID: '100' + procId.substring(0, 3),
    手続ID: procId,
    手続名称: name,
    申請種別: applyType ?? '新規申請',
    氏名: 'テスト　太郎', 氏名フリガナ: 'テスト　タロウ',
    郵便番号: '1000014', 住所: '東京都千代田区永田町１丁目７番１号',
    住所フリガナ: 'トウキョウトチヨダクナガタチョウ',
    電話番号: '03-1234-5678', 電子メールアドレス: 'test@example.com',
    法人名: 'テスト株式会社',
  }
  if (initialArriveId) {
    kouseiTags['初回受付番号'] = initialArriveId
  }
  mainXml = fillXmlTags(mainXml, kouseiTags)

  // 提出先情報（必要な手続のみ）
  const PROCS_WITH_DESTINATION = new Set([
    '950A010200003000', '950A010200004000', '900A020700013000', '900A013800001000',
    '950A101810021000', '950A101810022000', '950A101810023000',
    '950A102810037000', '950A102810040000',
    '950A102200044000', '950A102200045000', '950A102200046000', '950A102200047000',
    '950A102810048000', '950A102810049000',
  ])
  if (PROCS_WITH_DESTINATION.has(procId)) {
    const destId = procId.startsWith('950A') ? '950API00000000001001001' : '900API00000000001001001'
    mainXml = fillXmlTags(mainXml, {
      提出先識別子: destId,
      提出先名称: '総務省,行政管理局,API',
    })
  }

  // 標準形式: 申請書属性情報を挿入
  if (configFiles.length < 3 && fi0 && !mainXml.includes('<申請書属性情報>')) {
    const formVersion = String(fi0.form_version ?? 1).padStart(4, '0')
    const block = `\n\t\t\t\t<申請書属性情報>\n\t\t\t\t\t<申請書様式ID>${fi0.form_id}</申請書様式ID>\n\t\t\t\t\t<申請書様式バージョン>${formVersion}</申請書様式バージョン>\n\t\t\t\t\t<申請書様式名称>${fi0.form_name}</申請書様式名称>\n\t\t\t\t\t<申請書ファイル名称>${fi0.apply_file_name}</申請書ファイル名称>\n\t\t\t\t</申請書属性情報>`
    mainXml = mainXml.replace('</構成情報>', block + '\n\t\t\t\t</構成情報>')
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

  // WriteAppli
  if (configFiles.length >= 3) {
    const waPath = `${procId}/${configFiles[1]}`
    let waXml = await zip.file(waPath)!.async('string')
    waXml = waXml.split('999000000000000001').join('999000000000000009')
    waXml = fillXmlTags(waXml, {
      受付行政機関ID: '100' + procId.substring(0, 3),
      手続ID: procId, 手続名称: name, 申請種別: '申請書作成',
    })
    zip.file(waPath, waXml)

    // SignAttach
    const saPath = `${procId}/${configFiles[2]}`
    let saXml = await zip.file(saPath)!.async('string')
    saXml = saXml.split('999000000000000009').join('999000000000000001')
    saXml = fillXmlTags(saXml, {
      受付行政機関ID: '100' + procId.substring(0, 3),
      手続ID: procId, 手続名称: name, 申請種別: '添付書類署名',
    })
    const saAttach = `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>添付書類署名ファイル１</添付書類名称><添付書類ファイル名称>dummy.txt</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
    saXml = saXml.replace('</管理情報>', '</管理情報>' + saAttach)
    zip.file(saPath, saXml)
    zip.file(`${procId}/dummy.txt`, 'test')
  }

  // 添付ファイルを追加（署名前に挿入することで署名を有効にする）
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      zip.file(`${procId}/${att.fileName}`, att.content)
    }
    // kousei.xml に添付書類属性情報を追加
    let mainXmlWithAtt = await zip.file(mainPath)!.async('string')
    for (const att of attachments) {
      const attInfo = `<添付書類属性情報><添付種別>添付</添付種別><添付書類名称>${att.name}</添付書類名称><添付書類ファイル名称>${att.fileName}</添付書類ファイル名称><提出情報>1</提出情報></添付書類属性情報>`
      mainXmlWithAtt = mainXmlWithAtt.replace('</管理情報>', '</管理情報>' + attInfo)
    }
    zip.file(mainPath, mainXmlWithAtt)
  }

  // 申請書XMLの必須フィールドを填入（check.xmlに基づく）
  for (const fi of procResult.file_info) {
    const applyPath = `${procId}/${fi.apply_file_name}`
    const checkPath = `${procId}/${fi.form_id}check.xml`
    const applyFile = zip.file(applyPath)
    const checkFile = zip.file(checkPath)
    if (applyFile && checkFile) {
      const applyXml = await applyFile.async('string')
      const checkXml = await checkFile.async('string')
      zip.file(applyPath, fillApplyXmlFromCheck(applyXml, checkXml))
    }
  }

  // 署名（skipSign=true の場合はスキップ — 署名不要手続用）
  if (!skipSign) {
    const applyContent = await zip.file(`${procId}/${fi0.apply_file_name}`)!.async('string')
    if (configFiles.length < 3) {
      let signedMain = await zip.file(mainPath)!.async('string')
      const appFiles = new Map<string, string>()
      appFiles.set(fi0.apply_file_name, applyContent)
      signedMain = signKousei(signedMain, appFiles, pfx)
      zip.file(mainPath, signedMain)
    }
    if (configFiles.length >= 3) {
      const waPath = `${procId}/${configFiles[1]}`
      let waXml = await zip.file(waPath)!.async('string')
      waXml = signConfig(waXml, fi0.apply_file_name, applyContent, pfx)
      zip.file(waPath, waXml)

      const saPath = `${procId}/${configFiles[2]}`
      let saXml = await zip.file(saPath)!.async('string')
      saXml = signConfig(saXml, 'dummy.txt', 'test', pfx)
      zip.file(saPath, saXml)
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  return { zipBase64: zipBuffer.toString('base64'), zipBuffer }
}

/**
 * 添付書類付き申請 ZIP を構築する (07-2 用)
 * 添付情報は署名前に kousei.xml に挿入する（署名後の変更は署名を無効化するため）
 */
export async function buildApplicationZipWithAttachments(
  procResult: ProcedureResult,
  procId: string,
  attachments: Array<{ name: string; fileName: string; content: Buffer }>,
): Promise<{ zipBase64: string; zipBuffer: Buffer }> {
  return buildApplicationZip(procResult, procId, undefined, attachments)
}

/**
 * 署名なし ZIP を構築する (署名不要手続用: 電子送達等)
 */
export async function buildUnsignedZip(
  procResult: ProcedureResult,
  procId: string,
): Promise<{ zipBase64: string; zipBuffer: Buffer }> {
  return buildApplicationZip(procResult, procId, undefined, undefined, undefined, true)
}

/**
 * 取下げ用 ZIP を構築する (11-1 用)
 * 取下げは専用の XML 構造（様式ID=999000000000000003）
 * 構成管理XMLではなく「取下げ依頼情報」XML を使用
 */
export async function buildWithdrawZip(
  procResult: ProcedureResult,
  procId: string,
  arriveId: string,
  procName: string,
): Promise<{ zipBase64: string; zipBuffer: Buffer }> {
  const now = new Date()
  const pfx = getPfx()

  // 1. スケルトンから全ファイルをコピー（XSL, check.xml 等もサーバーが必要とする可能性）
  const zipBytes = Buffer.from(procResult.file_data, 'base64')
  const zip = await JSZip.loadAsync(zipBytes)

  // 2. kousei.xml を取下げ依頼用に修正
  const mainPath = `${procId}/kousei.xml`
  let mainXml = await zip.file(mainPath)!.async('string')
  // 様式ID/STYLESHEET を 009 に変更
  mainXml = mainXml.split('999000000000000001').join('999000000000000009')
  // フィールド填入
  mainXml = fillXmlTags(mainXml, {
    手続ID: '9990000000000003',
    手続名称: procName,
    初回受付番号: arriveId,
    申請種別: '取下げ依頼',
  })
  // 取下げ依頼時は添付書類属性情報を設定しない
  mainXml = mainXml.replace(/<添付書類属性情報>[\s\S]*?<\/添付書類属性情報>/g, '')
  // 申請書属性情報（取下げ依頼用: 様式ID=003, 名称=取下げ依頼XML）
  if (!mainXml.includes('<申請書属性情報>')) {
    mainXml = mainXml.replace('</構成情報>',
      '<申請書属性情報><申請書様式ID>999000000000000003</申請書様式ID><申請書様式バージョン>0001</申請書様式バージョン><申請書様式名称>取下げ依頼XML</申請書様式名称><申請書ファイル名称>torisageirai.xml</申請書ファイル名称></申請書属性情報></構成情報>')
  }
  zip.file(mainPath, mainXml)

  // 3. 取下げ依頼情報 XML (torisageirai.xml)
  const withdrawXml = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet href="999000000000000003.xsl" type="text/xsl"?><DataRoot><様式ID>999000000000000003</様式ID><様式バージョン>0001</様式バージョン><STYLESHEET>999000000000000003.xsl</STYLESHEET><取下げ依頼情報><到達番号>${arriveId}</到達番号><手続名称>${procName}</手続名称><申請者氏名>テスト　太郎</申請者氏名><依頼年月日><年>${now.getFullYear()}</年><月>${now.getMonth() + 1}</月><日>${now.getDate()}</日></依頼年月日><理由>テスト取下げ</理由></取下げ依頼情報></DataRoot>`
  zip.file(`${procId}/torisageirai.xml`, withdrawXml)

  // 4. 署名（標準形式+署名必須手続は取下げ時も必要）
  const torisageContent = await zip.file(`${procId}/torisageirai.xml`)!.async('string')
  let signedMain = await zip.file(mainPath)!.async('string')
  const appFiles = new Map<string, string>()
  appFiles.set('torisageirai.xml', torisageContent)
  signedMain = signKousei(signedMain, appFiles, pfx)
  zip.file(mainPath, signedMain)

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  return { zipBase64: zipBuffer.toString('base64'), zipBuffer }
}

/**
 * 不正な申請データ ZIP を構築する (08-2, 12-2 用)
 * 手続名を不正なものに変更
 */
export async function buildInvalidZip(
  procResult: ProcedureResult,
  procId: string,
): Promise<{ zipBase64: string; zipBuffer: Buffer }> {
  // 不正な手続名で構築
  return buildApplicationZip(procResult, procId, '偽テスト用手続０００１')
}

/**
 * Bulk 送信用 ZIP を構築する (08-1 用)
 * 複数の申請 ZIP を1つの ZIP にまとめる
 */
export async function buildBulkZip(
  zipBuffers: Buffer[],
): Promise<{ zipBase64: string; zipBuffer: Buffer }> {
  const bulkZip = new JSZip()
  for (let i = 0; i < zipBuffers.length; i++) {
    const innerZip = await JSZip.loadAsync(zipBuffers[i])
    for (const [path, file] of Object.entries(innerZip.files)) {
      if (!file.dir) {
        const content = await file.async('nodebuffer')
        bulkZip.file(path, content)
      }
    }
  }
  const buf = await bulkZip.generateAsync({ type: 'nodebuffer' })
  return { zipBase64: buf.toString('base64'), zipBuffer: buf }
}
