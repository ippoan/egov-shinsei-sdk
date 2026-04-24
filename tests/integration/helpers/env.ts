import { config } from 'dotenv'
import { resolve } from 'path'
import { createCaptureFetch } from './evidence-collector'

config({ path: resolve(import.meta.dirname, '../../../.env') })

export function getConfig() {
  const apiBase = process.env.NUXT_PUBLIC_EGOV_API_BASE
  const authBase = process.env.NUXT_PUBLIC_EGOV_AUTH_BASE
  const clientId = process.env.NUXT_PUBLIC_EGOV_CLIENT_ID
  const clientSecret = process.env.NUXT_EGOV_CLIENT_SECRET
  const accessToken = process.env.EGOV_ACCESS_TOKEN
  // GビズID: 情報共有 API (32-36) は gBizID でログインしたトークンが必要
  const gbizAccessToken = process.env.EGOV_GBIZID_ACCESS_TOKEN
  const gbizAccount = process.env.EGOV_GBIZID_ACCOUNT
  const gbizTargetAccount = process.env.EGOV_GBIZID_TARGET_ACCOUNT

  if (!apiBase || !authBase || !clientId || !clientSecret || !accessToken) {
    throw new Error(
      'Missing env vars. Required: NUXT_PUBLIC_EGOV_API_BASE, NUXT_PUBLIC_EGOV_AUTH_BASE, '
      + 'NUXT_PUBLIC_EGOV_CLIENT_ID, NUXT_EGOV_CLIENT_SECRET, EGOV_ACCESS_TOKEN'
    )
  }

  // エビデンスキャプチャ用 fetch ラッパー
  const captureFetch = createCaptureFetch(globalThis.fetch)

  return {
    apiBase, authBase, clientId, clientSecret, accessToken,
    gbizAccessToken, gbizAccount, gbizTargetAccount,
    fetch: captureFetch,
  }
}

