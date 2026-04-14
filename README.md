# egov-shinsei-sdk

TypeScript SDK for [e-Gov Electronic Application API](https://developer.e-gov.go.jp/) (電子申請API v2).

## Install

```bash
npm install egov-shinsei-sdk
```

## Usage

```typescript
import { EgovClient } from 'egov-shinsei-sdk'

const client = new EgovClient({
  apiBase: 'https://api.e-gov.go.jp/shinsei/v2',
  authBase: 'https://account.e-gov.go.jp/auth',
  clientId: 'your-software-id',
  clientSecret: 'your-api-key', // server-side only
})

// Set access token (obtained via OAuth2 flow)
client.setAccessToken('your-access-token')

// List applications
const list = await client.listApplications({
  date_from: '2026-01-01',
  date_to: '2026-04-14',
})

// Submit application
const result = await client.submitApplication({
  proc_id: '950A010700000000',
  send_file: {
    file_name: 'application.zip',
    file_data: '<base64-encoded-zip>',
  },
})

console.log(result.results.arrive_id)
```

## OAuth2 Authentication

```typescript
import { generatePKCE } from 'egov-shinsei-sdk'

// Browser: Generate PKCE pair
const { codeVerifier, codeChallenge } = await generatePKCE()

// Server: Exchange authorization code for tokens
const tokens = await client.exchangeCode(code, redirectUri, codeVerifier)

// Server: Refresh token
const newTokens = await client.refreshToken(refreshToken)
```

## API Coverage

All 33 endpoints from e-Gov Electronic Application API v2:

- Electronic Application (電子申請): procedure, apply, bulk-apply, amend, withdraw, check, lists, detail, report
- Notifications (通知): message lists/detail, notice lists/detail
- Official Documents (公文書): get, complete, verify
- Electronic Payment (電子納付): lists, info, payment site
- Electronic Delivery (電子送達): apply, status, lists, get, complete
- Account Sharing (情報共有): lists, create, update, delete, confirm
- Authentication (認証): token, introspect, logout

## Requirements

- Node.js >= 18 (uses native `fetch` and `crypto.subtle`)
- e-Gov API key (requires [registration](https://developer.e-gov.go.jp/))

## License

MIT

## Disclaimer

This is an unofficial SDK. See [docs/egov-api-terms.md](docs/egov-api-terms.md) for e-Gov API terms of use.
