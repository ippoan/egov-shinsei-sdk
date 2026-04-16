import type forge from 'node-forge'

export interface ParsedPfx {
  privateKey: forge.pki.rsa.PrivateKey
  certificateBase64: string
  certSubject: string
}

export interface SignatureReference {
  uri: string
  content: string | Uint8Array
  isXml: boolean
}

export interface SignatureOptions {
  pfx: ParsedPfx
  references: SignatureReference[]
}
