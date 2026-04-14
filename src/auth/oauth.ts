/**
 * OAuth2 認可URL ビルダー
 */

export interface AuthorizationUrlParams {
  /** 認証エンドポイントのベースURL (e.g. https://account.e-gov.go.jp/auth) */
  authBase: string;
  /** ソフトウェアID (client_id) */
  clientId: string;
  /** リダイレクトURI */
  redirectUri: string;
  /** CSRF対策用ランダム値 */
  state: string;
  /** PKCE code_challenge (S256) */
  codeChallenge: string;
  /** スコープ (デフォルト: 'openid offline_access') */
  scope?: string;
}

/**
 * e-Gov OAuth2 認可エンドポイントへのURLを構築する。
 */
export function buildAuthorizationUrl(params: AuthorizationUrlParams): string {
  const scope = params.scope ?? 'openid offline_access';
  const url = new URL(`${params.authBase}/auth`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}
