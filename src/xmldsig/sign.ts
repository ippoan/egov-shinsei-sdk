import forge from 'node-forge'
import { canonicalize, canonicalizeById } from './c14n'
import type { SignatureOptions, SignatureReference } from './types'

const DSIG_NS = 'http://www.w3.org/2000/09/xmldsig#'
const C14N_ALGO = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
const SIG_ALGO = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'
const DIGEST_ALGO = 'http://www.w3.org/2001/04/xmlenc#sha256'

/**
 * XML-DSig 署名を生成し、<署名情報> ブロックの XML 文字列を返す
 */
export function createSignatureBlock(options: SignatureOptions, secondsOffset = 0): string {
  const { pfx, references } = options

  // 1. 各 Reference の DigestValue を計算
  const referenceXmls = references.map(ref => {
    const digestValue = computeDigest(ref)
    return buildReferenceXml(ref.uri, digestValue, ref.isXml)
  })

  // 2. SignedInfo XML を構築
  const signedInfoXml = buildSignedInfoXml(referenceXmls)

  // 3. SignedInfo を C14N → RSA-SHA256 署名
  const canonicalSignedInfo = canonicalize(signedInfoXml)
  const signatureValue = rsaSha256Sign(canonicalSignedInfo, pfx.privateKey)

  // 4. Signature Id = yyyyMMddHHmmss（14桁固定、連署時は秒をオフセットしてユニーク化）
  const now = new Date(Date.now() + secondsOffset * 1000)
  const id = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
    + String(now.getHours()).padStart(2, '0')
    + String(now.getMinutes()).padStart(2, '0')
    + String(now.getSeconds()).padStart(2, '0')

  // 5. 完全な ds:Signature XML を組立て
  return buildFullSignatureXml(id, signedInfoXml, signatureValue, pfx.certificateBase64)
}

/**
 * kousei.xml に署名ブロッ���を挿入する
 * </構成情報> の後に <署名情報> ���挿入
 */
export function insertSignatureIntoKousei(kouseiXml: string, signatureBlockXml: string): string {
  // 署名情報は </構成情報> と <その他> の間に挿入
  const pattern = '</構成情報>\n\t\t\t\t<その他>'
  const idx = kouseiXml.indexOf(pattern)
  if (idx !== -1) {
    return kouseiXml.substring(0, idx + '</構成情報>'.length)
      + '\n\t\t\t\t' + signatureBlockXml
      + '\n\t\t\t\t<その他>'
      + kouseiXml.substring(idx + pattern.length)
  }
  // Fallback: insert after last </構成情報>
  const insertPoint = '</構成情報>'
  const fallbackIdx = kouseiXml.lastIndexOf(insertPoint)
  if (fallbackIdx === -1) {
    throw new Error('kousei.xml に </構成情報> タグが見つかりません')
  }
  const after = fallbackIdx + insertPoint.length
  return kouseiXml.substring(0, after)
    + '\n\t\t\t\t' + signatureBlockXml
    + kouseiXml.substring(after)
}

/**
 * kousei.xml の構成情報要素と申請書ファイルから署名付き kousei.xml を返す
 * pfxList で複数証明書を渡すと連署（複数Signature）になる
 */
export function signKousei(
  kouseiXml: string,
  applicationFiles: Map<string, string | Uint8Array>,
  pfx: SignatureOptions['pfx'],
  pfxList?: SignatureOptions['pfx'][],
): string {
  const signers = pfxList && pfxList.length > 0 ? pfxList : [pfx]

  const references: SignatureReference[] = []

  // Reference 1: 構成情報要素 (URI="#構成情報")
  const canonicalizedKouseiInfo = canonicalizeById(kouseiXml, '構成情報')
  references.push({
    uri: '#%E6%A7%8B%E6%88%90%E6%83%85%E5%A0%B1',
    content: canonicalizedKouseiInfo,
    isXml: true,
  })

  // Reference 2+: 申請書XMLファイル
  for (const [fileName, content] of applicationFiles) {
    references.push({ uri: fileName, content, isXml: false })
  }

  // 各署名者で Signature ブロックを生成し、1つの <署名情報> にまとめる
  const signatureBlocks = signers.map((signerPfx, i) => {
    const block = createSignatureBlock({ pfx: signerPfx, references }, i)
    if (i === 0) return block
    // 2つ目以降: <署名情報>...</署名情報> のラッパーを除去して Signature 要素だけ返す
    return block.replace(/^<署名情報>/, '').replace(/<\/署名情報>$/, '')
  })

  // 1つ目のブロック（<署名情報>...<Signature>...</Signature></署名情報>）の閉じタグの前に残りを挿入
  let combined = signatureBlocks[0]!
  for (let i = 1; i < signatureBlocks.length; i++) {
    combined = combined.replace('</署名情報>', signatureBlocks[i] + '</署名情報>')
  }

  return insertSignatureIntoKousei(kouseiXml, combined)
}

/**
 * 構成情報ファイル（WriteAppli / SignAttach）用の署名
 * XSD が Reference minOccurs=2 を要求するため #構成情報 + ファイルの2つ
 * ただし Transforms は不要（仕様 2-20: 申請書、添付書類は設定不要）
 */
export function signConfig(
  configXml: string,
  referencedFileName: string,
  referencedFileContent: string | Uint8Array,
  pfx: SignatureOptions['pfx'],
): string {
  const references: SignatureReference[] = []

  // Reference 1: #構成情報（XSD が2つ要求するため必要、ただし C14N Transform なし）
  const canonicalizedKouseiInfo = canonicalizeById(configXml, '構成情報')
  references.push({
    uri: '#%E6%A7%8B%E6%88%90%E6%83%85%E5%A0%B1',
    content: canonicalizedKouseiInfo,
    isXml: false, // isXml=false → Transform なしで直接ダイジェスト
  })

  // Reference 2: 対象ファイル（申請書 or 添付書類）
  references.push({ uri: referencedFileName, content: referencedFileContent, isXml: false })

  const signatureBlock = createSignatureBlock({ pfx, references })
  return insertSignatureIntoKousei(configXml, signatureBlock)
}

// --- Internal helpers ---

function computeDigest(ref: SignatureReference): string {
  let bytes: string

  if (typeof ref.content === 'string') {
    if (ref.isXml && !ref.uri.startsWith('#')) {
      // 外部XMLファイルで Transform 指定がある場合は C14N してから hash
      bytes = canonicalize(ref.content)
    } else {
      // #構成情報 は既に canonicalize 済み / バイナリは直接
      bytes = ref.content
    }
  } else {
    // Uint8Array
    bytes = String.fromCharCode(...ref.content)
  }

  const md = forge.md.sha256.create()
  md.update(forge.util.encodeUtf8(bytes), 'raw')
  return forge.util.encode64(md.digest().getBytes())
}

function rsaSha256Sign(data: string, privateKey: forge.pki.rsa.PrivateKey): string {
  const md = forge.md.sha256.create()
  md.update(forge.util.encodeUtf8(data), 'raw')
  const signature = privateKey.sign(md)
  return forge.util.encode64(signature)
}

function buildReferenceXml(uri: string, digestValue: string, hasTransform: boolean): string {
  const transformBlock = hasTransform
    ? `<Transforms><Transform Algorithm="${C14N_ALGO}"/></Transforms>`
    : ''
  return `<Reference URI="${escapeXmlAttr(uri)}">`
    + transformBlock
    + `<DigestMethod Algorithm="${DIGEST_ALGO}"/>`
    + `<DigestValue>${digestValue}</DigestValue>`
    + `</Reference>`
}

function buildSignedInfoXml(referenceXmls: string[]): string {
  return `<SignedInfo xmlns="${DSIG_NS}">`
    + `<CanonicalizationMethod Algorithm="${C14N_ALGO}"/>`
    + `<SignatureMethod Algorithm="${SIG_ALGO}"/>`
    + referenceXmls.join('')
    + `</SignedInfo>`
}

function buildFullSignatureXml(
  id: string,
  signedInfoXml: string,
  signatureValue: string,
  certificateBase64: string,
): string {
  // SignedInfo から xmlns を除去（親の Signature が宣言するため）
  const signedInfoInner = signedInfoXml.replace(` xmlns="${DSIG_NS}"`, '')

  return `<署名情報>`
    + `<Signature xmlns="${DSIG_NS}" Id="${id}">`
    + signedInfoInner
    + `<SignatureValue>${signatureValue}</SignatureValue>`
    + `<KeyInfo><X509Data><X509Certificate>${certificateBase64}</X509Certificate></X509Data></KeyInfo>`
    + `</Signature>`
    + `</署名情報>`
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}
