/**
 * XML 署名 (xmldsig) モジュールの公開窓口。
 *
 * consumer (nuxt-egov 等) は `@ippoan/egov-shinsei-sdk/xmldsig` から import する。
 * ここに載せた named export のみ SemVer 対象。
 */
export { canonicalize, canonicalizeById } from './c14n';
export { parsePfx } from './pfx';
export {
  createSignatureBlock,
  insertSignatureIntoKousei,
  signKousei,
  signConfig,
} from './sign';
export type { ParsedPfx, SignatureReference, SignatureOptions } from './types';
