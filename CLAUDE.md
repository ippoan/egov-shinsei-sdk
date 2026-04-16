# egov-shinsei-sdk

e-Gov 電子申請API v2 TypeScript SDK。

## 構成

- `src/client.ts` — `EgovClient` クラス（全33エンドポイント）
- `src/types.ts` — 全型定義（openapi.json準拠、自作コード）
- `src/errors.ts` — `EgovApiError`
- `src/auth/` — OAuth2 PKCE + URL builder
- `tests/` — Vitest + msw、103テスト、カバレッジ100%

## 公開

GitHub Packages: `@ippoan/egov-shinsei-sdk`
- `npm publish` は CI 経由のみ（`prepublishOnly` でガード）
- tag push → `publish-release` ジョブ
- `tag-release.yml` (workflow_dispatch) でバージョニング

## 利用規約

- API仕様書・openapi.json は同梱禁止（第15条3項二）
- 型定義は自作コードとして著作権は開発者に帰属（第15条1項）
- 詳細: `docs/egov-api-terms.md`
