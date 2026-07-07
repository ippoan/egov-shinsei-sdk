# egov-shinsei-sdk

e-Gov 電子申請API v2 TypeScript SDK。

## テスト

```sh
npm test          # unit test (vitest + msw mock)
```

## 規範ルール

- **API仕様書・openapi.json は同梱禁止**（第15条3項二）
- **型定義は自作コードとして著作権は開発者に帰属**（第15条1項）。詳細: `docs/egov-api-terms.md`
- **`npm publish` は CI 経由のみ**（`prepublishOnly` でガード）。手動 publish 禁止
- **CI で走らせるのは unit test (msw mock) のみ**。実 e-Gov API 叩きは `workflow_dispatch` 手動起動のみ

詳細 (構成・仕様書・統合テスト状況・CI 方針・integration-test secrets・公開フロー) は egov-shinsei-sdk-map skill を参照。
