---
name: egov-shinsei-sdk-map
generated-from: egov-shinsei-sdk:6d03a9f976b29726749fa837137e05b255196c0f
paths: [src/]
description: ippoan/egov-shinsei-sdk (TypeScript npm ライブラリ @ippoan/egov-shinsei-sdk、e-Gov 電子申請API v2 SDK) の構造ナビゲーション。EgovClient (全33エンドポイント)・OAuth2 PKCE・XML署名 (xmldsig:C14N/PFX/署名ブロック)・型定義・msw unit test / 手動 integration test の配置と CI 方針を 1 枚にまとめる。トリガー:「egov-shinsei-sdk」「電子申請API」「EgovClient」「e-Gov SDK」「PKCE」「XML署名」「xmldsig」「signKousei」「申請 submitApplication」「@ippoan/egov-shinsei-sdk」等。
---

# egov-shinsei-sdk-map — ippoan/egov-shinsei-sdk 構造ナビゲーション

**npm ライブラリ** (`@ippoan/egov-shinsei-sdk`, v0.1.0, ESM, tsup ビルド)。
e-Gov 電子申請API v2 の TypeScript SDK。Worker ではなく、`EgovClient` クラス +
OAuth2 PKCE + XML署名 (xmldsig) を提供する。

> 細部 (型・正確な行) は repo 側が正。ここは「どこを見るか」の索引。
> frontmatter の `generated-from` が現在の tree-sha とズレたら
> session-start-skill-coverage hook が再生成を促す → その時 tree-sha を更新する。

## 区画 (src/)

| ファイル | 役割 |
|---|---|
| `src/index.ts` | public export (`EgovClient` / types / `EgovApiError` / `generatePKCE` / `buildAuthorizationUrl`) |
| `src/client.ts` | `EgovClient` クラス。**全 33 エンドポイント** (下記カテゴリ) |
| `src/types.ts` | 全型定義 (openapi.json 準拠、自作) |
| `src/errors.ts` | `EgovApiError` + `EgovReportItem` |
| `src/auth/pkce.ts` | `generatePKCE` (PKCE code_verifier/challenge) |
| `src/auth/oauth.ts` | `buildAuthorizationUrl` (`AuthorizationUrlParams`) |
| `src/xmldsig/c14n.ts` | `canonicalize` / `canonicalizeById` (C14N, XHTML 対応) |
| `src/xmldsig/pfx.ts` | `parsePfx` (PFX/PKCS#12 → key/cert) |
| `src/xmldsig/sign.ts` | `createSignatureBlock` / `insertSignatureIntoKousei` / `signKousei` / `signConfig` |
| `src/xmldsig/types.ts` | 署名オプション型 |

### `EgovClient` のエンドポイント分類 (`src/client.ts`)

| カテゴリ | メソッド |
|---|---|
| 認証 | `exchangeCode` `refreshToken` `introspectToken` `logout` `setAccessToken` |
| 申請 | `getProcedure` `getPreprint` `submitApplication` `bulkSubmitApplication` `amendApplication` `withdrawApplication` `checkFormat` |
| 状況照会 | `listApplications` `getApplication` `getErrorReport` |
| メッセージ/通知 | `listMessages` `getMessage` `listNotices` `getNotice` |
| 公文書 | `getOfficialDocument` `completeOfficialDocument` `verifyOfficialDocument` |
| 納付 | `listPaymentBanks` `getPaymentInfo` `displayPaymentSite` |
| 送付/郵送 | `applyPostDelivery` `getPostApplyStatus` `listPostDeliveries` `getPostDelivery` `completePostDelivery` |
| 情報共有設定 | `listShareSettings` `createShareSetting` `updateShareSetting` `deleteShareSetting` `confirmShareSetting` |

## entrypoint (`src/index.ts`)

`export { EgovClient }` + `export * from './types'` + `EgovApiError` +
`generatePKCE` + `buildAuthorizationUrl`。`package.json` の `main`/`types`/`module`
は `src/index.ts` (tsup で dist 生成)。

## gotcha (CLAUDE.md 由来)

- **spec は repo に含めない**: `spec/` 配下 (openapi.json / 申請データ XML 構造 / 構成情報タグ / FAQ / 試験手続ID) が実装の一次参照だが**公開リポジトリには含めない**。詳細索引は `spec/CLAUDE.md`。
- **CI は unit test (msw mock) のみ**。実 e-Gov API 直叩きの **integration test (33 件) は `workflow_dispatch` 手動起動のみ** (実 API 依存 + token rotation で CI が flakey になるため)。
- workflow: `test.yml` (push/PR → lib-ci.yml: typecheck + vitest+msw) / `publish.yml` (`v*` tag → lib-publish.yml: GitHub Packages publish) / `integration-test.yml` (手動) / `tag-release.yml` (手動 semver)。
- 統合テスト状況: 33 pass / 0 fail / 10 skip (32-36 情報共有は検証用 GビズID 必須、09-21 は到達番号収集待ち)。
- vitest config は 2 本: `vitest.config.ts` (unit) / `vitest.config.integration.ts`。`coverage_100.toml` あり。

## CCoW / CI から見た立ち位置

- **npm ライブラリ** (consumer 向け SDK)。GitHub Packages の `@ippoan` scope で publish。
- spec 取得は `egov-spec` skill、API 動作確認/デバッグは `egov-api` skill が担当。仕様書原本は ref-files (`egov-shinsei-sdk-spec` folder) 経由で取得 (`ref-files-bulk`)。

## 関連 skill

- `egov-api` — e-Gov API の動作確認 / OAuth フロー / 申請状況確認
- `egov-spec` — Developer Portal から仕様書/スキーマ取得
- `ref-files-bulk` — `egov-shinsei-sdk-spec` folder の一括取得
- `cross-repo-symbol-index` — per-repo map の運用方針 (鮮度 hook)

## CLAUDE.md から移設 (2026-07-07)

## 構成

- `src/client.ts` — `EgovClient` クラス（全33エンドポイント）
- `src/types.ts` — 全型定義（openapi.json準拠、自作コード）
- `src/errors.ts` — `EgovApiError`
- `src/auth/` — OAuth2 PKCE + URL builder
- `src/xmldsig/` — XML署名モジュール (C14N XHTML対応)
- `tests/` — Vitest + msw、ユニット106テスト + 統合テスト

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

## CI / テスト方針

**CI で走らせるのは unit test (msw mock) のみ**。実 e-Gov API 叩きは
`workflow_dispatch` での手動起動 (= 開発者が必要な時だけローカル相当で
発火する) に限定。

| workflow | trigger | 用途 |
|---|---|---|
| `test.yml` | push (main), pull_request | lib-ci.yml@main: typecheck + test (vitest + msw mock) |
| `publish.yml` | tags `v*` | lib-publish.yml@main: GitHub Packages へ publish |
| `integration-test.yml` | `workflow_dispatch` のみ | 試験 e-Gov API 直叩きの統合テスト 33 件 |
| `tag-release.yml` | `workflow_dispatch` | semver tag 採番 |

integration test を CI 自動実行から外した理由:
- 実 API 依存 + token rotation で CI が flakey になる
- 試験 API でも refresh_token 期限切れのたびに secret 更新が要る運用負担
- unit test (msw mock) が単体動作の検証を担うため CI で必要なのはそちら

### integration-test.yml 手動実行時に必要な secrets

**必須** (Nuxt 利用時の `.env` キーと揃える命名):
- `NUXT_PUBLIC_EGOV_CLIENT_ID` — 試験ソフトウェア ID
- `NUXT_EGOV_CLIENT_SECRET` — 試験 API キー
- `EGOV_REFRESH_TOKEN` — 試験アカウントの refresh_token。job 開始時に
  `grant_type=refresh_token` で access_token を都度発行

**任意** (該当 test の skip 制御):
- `EGOV_GBIZID_ACCESS_TOKEN` / `EGOV_GBIZID_ACCOUNT` / `EGOV_GBIZID_TARGET_ACCOUNT`
- `EGOV_PREPARED_DATA`

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
