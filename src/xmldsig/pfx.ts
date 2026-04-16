import forge from 'node-forge'
import type { ParsedPfx } from './types'

/**
 * PFX (PKCS#12) ファイルを解析し、秘密鍵と証明書を抽出する
 */
export function parsePfx(pfxArrayBuffer: ArrayBuffer, password: string): ParsedPfx {
  const pfxDer = forge.util.createBuffer(new Uint8Array(pfxArrayBuffer))
  const asn1 = forge.asn1.fromDer(pfxDer)
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password)

  // 秘密鍵を取得
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const keyBagList = Object.values(keyBags).flat()
  const keyBag = keyBagList[0]
  if (!keyBag?.key) {
    throw new Error('PFXファイルから秘密鍵を取得できません')
  }

  // 証明書を取得
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const certBagList = Object.values(certBags).flat()
  const certBag = certBagList[0]
  if (!certBag?.cert) {
    throw new Error('PFXファイルから証明書を取得できません')
  }

  // 証明書を DER → base64
  const certAsn1 = forge.pki.certificateToAsn1(certBag.cert)
  const certDer = forge.asn1.toDer(certAsn1).getBytes()
  const certificateBase64 = forge.util.encode64(certDer)

  // Subject DN を読みやすい形式で取得
  const subject = certBag.cert.subject
  const certSubject = subject.attributes
    .map((attr: forge.pki.CertificateField) => `${attr.shortName}=${attr.value}`)
    .join(', ')

  return {
    privateKey: keyBag.key as forge.pki.rsa.PrivateKey,
    certificateBase64,
    certSubject,
  }
}
