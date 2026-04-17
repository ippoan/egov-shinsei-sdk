# egov-shinsei-sdk

e-Gov 電子申請API v2 TypeScript SDK。

## 構成

- `src/client.ts` — `EgovClient` クラス（全33エンドポイント）
- `src/types.ts` — 全型定義（openapi.json準拠、自作コード）
- `src/errors.ts` — `EgovApiError`
- `src/auth/` — OAuth2 PKCE + URL builder
- `src/xml/` — XML署名モジュール (C14N XHTML対応)
- `tests/` — Vitest + msw、ユニット103テスト + 統合テスト

## 仕様書

`spec/` 配下に原本 (PDF/xlsx) と派生 JSON/md。詳細インデックスは [spec/CLAUDE.md](./spec/CLAUDE.md) を参照。

SDK 実装時の主な参照:
- API エンドポイント: `spec/openapi.json` (公開リポジトリには含めない)
- 申請データ XML 構造: `spec/shinseisyodata_0/`
- 構成情報タグ定義: `spec/beshi_kyoutsudata_{kousei,kouseikanri,torisageirai}/`
- 開発時Q&A: `spec/denshishinsei-api_faq_v2/denshishinsei-api_faq_v2.json`
- 試験手続ID: `spec/最終確認試験用データ情報(TID_202604130039)_1版/{standard,individual-signature}.json`

## 統合テスト状況

33pass / 0fail / 10skip。詳細は memory `project_integration_test_status.md`。
- 32-36 情報共有テスト: 検証用GビズID必須 (未取得時はskip)
- 09-21: 到達番号収集待ち

## 公開

GitHub Packages: `@ippoan/egov-shinsei-sdk`
- `npm publish` は CI 経由のみ（`prepublishOnly` でガード）
- tag push → `publish-release` ジョブ
- `tag-release.yml` (workflow_dispatch) でバージョニング

## 利用規約

- API仕様書・openapi.json は同梱禁止（第15条3項二）
- 型定義は自作コードとして著作権は開発者に帰属（第15条1項）
- 詳細: `docs/egov-api-terms.md`
