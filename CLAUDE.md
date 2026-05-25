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

## CI / 環境構成 (staging=prod 運用)

**staging 環境を持たず、CI から直接「試験 e-Gov API」を叩く 1 系統のみ**。
試験手続 ID (`TID_202604130039`) なので課金・到達番号消費の懸念は無し。

| workflow | trigger | 用途 |
|---|---|---|
| `test.yml` | push (main), tags `v*`, pull_request | unit test + typecheck + (tag 時) GitHub Packages publish |
| `integration-test.yml` | push (main), pull_request, workflow_dispatch | 試験 API 直叩きの統合テスト 33 件 |
| `tag-release.yml` | workflow_dispatch | semver tag 採番 |

integration-test の secrets は GitHub Actions secrets に直接設定:

**必須**:
- `EGOV_CLIENT_ID` / `EGOV_CLIENT_SECRET` — 試験ソフトウェア ID / API キー
- `EGOV_REFRESH_TOKEN` — 試験アカウントの OAuth refresh_token。CI job 開始時に
  `grant_type=refresh_token` で access_token を都度発行する (短命な access_token
  を secret に固定で持たない設計)

**任意** (該当 test の skip 制御):
- `EGOV_GBIZID_ACCESS_TOKEN` / `EGOV_GBIZID_ACCOUNT` / `EGOV_GBIZID_TARGET_ACCOUNT` — 情報共有 API (32-36) 用、検証用 GBiz ID
- `EGOV_PREPARED_DATA` — 事前準備データの到達番号 JSON (09-21 用)

**ハードコード** (公開情報なので workflow `env:` に直書き):
- `EGOV_AUTH_BASE` = `https://account2.sbx.e-gov.go.jp/auth`
- `EGOV_API_BASE` = `https://api2.sbx.e-gov.go.jp/shinsei/v2`

workflow_dispatch の `skip_prepared_data_tests=true` 指定時のみ
`EGOV_PREPARED_DATA` を空にして prepared-data 系を skip する。

## 公開

GitHub Packages: `@ippoan/egov-shinsei-sdk`
- `npm publish` は CI 経由のみ（`prepublishOnly` でガード）
- tag push → `publish-release` ジョブ
- `tag-release.yml` (workflow_dispatch) でバージョニング

## 利用規約

- API仕様書・openapi.json は同梱禁止（第15条3項二）
- 型定義は自作コードとして著作権は開発者に帰属（第15条1項）
- 詳細: `docs/egov-api-terms.md`
