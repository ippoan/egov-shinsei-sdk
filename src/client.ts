/**
 * e-Gov 電子申請API v2 クライアント
 */
import { EgovApiError } from './errors';
import type {
  TokenResponse,
  IntrospectResponse,
  ProcedureResponse,
  PreprintRequest,
  PreprintResponse,
  ApplyRequest,
  ApplyResponse,
  BulkApplyRequest,
  BulkApplyResponse,
  AmendRequest,
  AmendResponse,
  WithdrawRequest,
  WithdrawResponse,
  CheckRequest,
  CheckResponse,
  ApplyListsRequest,
  ApplyListsResponse,
  ApplyDetailResponse,
  ApplyReportRequest,
  ApplyReportResponse,
  MessageListsRequest,
  MessageListsResponse,
  MessageDetailResponse,
  NoticeListsRequest,
  NoticeListsResponse,
  NoticeDetailResponse,
  OfficialDocumentResponse,
  OfficialDocumentCompleteRequest,
  OfficialDocumentCompleteResponse,
  OfficialDocumentVerifyRequest,
  OfficialDocumentVerifyResponse,
  PaymentListsResponse,
  PaymentResponse,
  PaymentSiteRequest,
  PaymentSiteResponse,
  PostApplyRequest,
  PostApplyResponse,
  PostApplyDetailResponse,
  PostListsRequest,
  PostListsResponse,
  PostDetailResponse,
  PostCompleteRequest,
  PostCompleteResponse,
  ShareSettingListsResponse,
  ShareSettingCreateRequest,
  ShareSettingCreateResponse,
  ShareSettingUpdateRequest,
  ShareSettingUpdateResponse,
  ShareSettingDeleteRequest,
  ShareSettingDeleteResponse,
  ShareConfirmationRequest,
  ShareConfirmationResponse,
} from './types';

export interface EgovClientConfig {
  /** API ベースURL (e.g. https://api.e-gov.go.jp/shinsei/v2) */
  apiBase: string;
  /** 認証ベースURL (e.g. https://account.e-gov.go.jp/auth) */
  authBase: string;
  /** ソフトウェアID */
  clientId: string;
  /** クライアントシークレット (サーバーサイドのみ) */
  clientSecret?: string;
  /** カスタム fetch 関数 (プロキシ、Nuxt $fetch 等) */
  fetch?: typeof globalThis.fetch;
}

export class EgovClient {
  private config: EgovClientConfig;
  private accessToken: string | null = null;
  private fetchFn: typeof globalThis.fetch;

  constructor(config: EgovClientConfig) {
    this.config = config;
    this.fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** アクセストークンをセットする */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // ----------------------------------------------------------------
  // Internal: token endpoint (Basic auth + form-urlencoded)
  // ----------------------------------------------------------------

  private async tokenRequest<T>(body: Record<string, string>): Promise<T> {
    const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret ?? ''}`);
    const res = await this.fetchFn(`${this.config.authBase}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new EgovApiError({
        statusCode: res.status,
        resultCode: errorBody.error ?? errorBody.title ?? 'UNKNOWN',
        errorMessages: [errorBody.error_description ?? errorBody.detail ?? res.statusText],
      });
    }
    return res.json() as Promise<T>;
  }

  // ----------------------------------------------------------------
  // Internal: API request (Bearer token + JSON)
  // ----------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string>;
    },
  ): Promise<T> {
    let url = `${this.config.apiBase}${path}`;
    if (options?.params) {
      const qs = new URLSearchParams(options.params).toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let bodyStr: string | undefined;
    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      bodyStr = JSON.stringify(options.body);
    }

    const res = await this.fetchFn(url, { method, headers, body: bodyStr });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new EgovApiError({
        statusCode: res.status,
        resultCode: errorBody.title ?? 'UNKNOWN',
        errorMessages: errorBody.detail ? [errorBody.detail] : [res.statusText],
        reportList: errorBody.report_list,
      });
    }

    // 204 No Content (logout 等)
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  }

  // ================================================================
  // Auth --- 利用者認証
  // ================================================================

  /** 認可コードをアクセストークンに交換する */
  async exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<TokenResponse> {
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    };
    if (codeVerifier) body.code_verifier = codeVerifier;
    return this.tokenRequest<TokenResponse>(body);
  }

  /** リフレッシュトークンでアクセストークンを再取得する */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    return this.tokenRequest<TokenResponse>({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
  }

  /** トークンの有効性を検証する */
  async introspectToken(accessToken: string): Promise<IntrospectResponse> {
    return this.tokenRequest<IntrospectResponse>({
      token: accessToken,
      token_type_hint: 'access_token',
    });
  }

  /** ログアウト (セッション無効化) */
  async logout(accessToken: string): Promise<void> {
    const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret ?? ''}`);
    const res = await this.fetchFn(`${this.config.authBase}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ refresh_token: accessToken }).toString(),
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new EgovApiError({
        statusCode: res.status,
        resultCode: errorBody.error ?? errorBody.title ?? 'UNKNOWN',
        errorMessages: [errorBody.error_description ?? errorBody.detail ?? res.statusText],
      });
    }
  }

  // ================================================================
  // 電子申請
  // ================================================================

  /** 手続情報を取得する */
  async getProcedure(procId: string): Promise<ProcedureResponse> {
    return this.request<ProcedureResponse>('GET', `/procedure/${procId}`);
  }

  /** プレ印字データを取得する */
  async getPreprint(req: PreprintRequest): Promise<PreprintResponse> {
    return this.request<PreprintResponse>('POST', '/preprint', { body: req });
  }

  /** 申請データを送信する */
  async submitApplication(req: ApplyRequest): Promise<ApplyResponse> {
    return this.request<ApplyResponse>('POST', '/apply', { body: req });
  }

  /** 申請データを一括送信する */
  async bulkSubmitApplication(req: BulkApplyRequest): Promise<BulkApplyResponse> {
    return this.request<BulkApplyResponse>('POST', '/bulk-apply', { body: req });
  }

  /** 補正データを送信する */
  async amendApplication(req: AmendRequest): Promise<AmendResponse> {
    return this.request<AmendResponse>('POST', '/apply/amend', { body: req });
  }

  /** 取り下げ依頼を送信する */
  async withdrawApplication(req: WithdrawRequest): Promise<WithdrawResponse> {
    return this.request<WithdrawResponse>('POST', '/apply/withdraw', { body: req });
  }

  /** 形式チェックを実行する */
  async checkFormat(req: CheckRequest): Promise<CheckResponse> {
    return this.request<CheckResponse>('POST', '/apply/check', { body: req });
  }

  // ================================================================
  // 照会
  // ================================================================

  /** 申請案件一覧を取得する */
  async listApplications(params: ApplyListsRequest): Promise<ApplyListsResponse> {
    const qs: Record<string, string> = {};
    if (params.send_number) qs.send_number = params.send_number;
    if (params.date_from) qs.date_from = params.date_from;
    if (params.date_to) qs.date_to = params.date_to;
    if (params.limit !== undefined) qs.limit = String(params.limit);
    if (params.offset !== undefined) qs.offset = String(params.offset);
    return this.request<ApplyListsResponse>('GET', '/apply/lists', { params: qs });
  }

  /** 申請案件の詳細を取得する */
  async getApplication(arriveId: string): Promise<ApplyDetailResponse> {
    return this.request<ApplyDetailResponse>('GET', `/apply/${arriveId}`);
  }

  /** エラーレポートを取得する */
  async getErrorReport(params: ApplyReportRequest): Promise<ApplyReportResponse> {
    const qs: Record<string, string> = {};
    if (params.send_number) qs.send_number = params.send_number;
    if (params.date_from) qs.date_from = params.date_from;
    if (params.date_to) qs.date_to = params.date_to;
    if (params.limit !== undefined) qs.limit = String(params.limit);
    if (params.offset !== undefined) qs.offset = String(params.offset);
    return this.request<ApplyReportResponse>('GET', '/apply/report', { params: qs });
  }

  // ================================================================
  // 通知
  // ================================================================

  /** 手続に関するご案内一覧を取得する */
  async listMessages(params: MessageListsRequest): Promise<MessageListsResponse> {
    return this.request<MessageListsResponse>('GET', '/message/lists', {
      params: {
        date_from: params.date_from,
        date_to: params.date_to,
        limit: String(params.limit),
        offset: String(params.offset),
      },
    });
  }

  /** 手続に関するご案内の詳細を取得する */
  async getMessage(informationId: string): Promise<MessageDetailResponse> {
    return this.request<MessageDetailResponse>('GET', `/message/${informationId}`);
  }

  /** 申請案件に関する通知一覧を取得する */
  async listNotices(params: NoticeListsRequest): Promise<NoticeListsResponse> {
    return this.request<NoticeListsResponse>('GET', '/notice/lists', {
      params: {
        date_from: params.date_from,
        date_to: params.date_to,
        limit: String(params.limit),
        offset: String(params.offset),
      },
    });
  }

  /** 申請案件に関する通知の詳細を取得する */
  async getNotice(arriveId: string, noticeSubId: string): Promise<NoticeDetailResponse> {
    return this.request<NoticeDetailResponse>('GET', `/notice/${arriveId}/${noticeSubId}`);
  }

  // ================================================================
  // 公文書
  // ================================================================

  /** 公文書を取得する */
  async getOfficialDocument(arriveId: string, noticeSubId: string): Promise<OfficialDocumentResponse> {
    return this.request<OfficialDocumentResponse>('GET', `/official_document/${arriveId}/${noticeSubId}`);
  }

  /** 公文書の取得完了を通知する */
  async completeOfficialDocument(req: OfficialDocumentCompleteRequest): Promise<OfficialDocumentCompleteResponse> {
    return this.request<OfficialDocumentCompleteResponse>('POST', '/official_document', { body: req });
  }

  /** 公文書の署名を検証する */
  async verifyOfficialDocument(req: OfficialDocumentVerifyRequest): Promise<OfficialDocumentVerifyResponse> {
    return this.request<OfficialDocumentVerifyResponse>('POST', '/official_document/verify', { body: req });
  }

  // ================================================================
  // 電子納付
  // ================================================================

  /** 国庫金電子納付取扱金融機関一覧を取得する */
  async listPaymentBanks(): Promise<PaymentListsResponse> {
    return this.request<PaymentListsResponse>('GET', '/payment/lists');
  }

  /** 電子納付情報を取得する */
  async getPaymentInfo(arriveId: string): Promise<PaymentResponse> {
    return this.request<PaymentResponse>('GET', `/payment/${arriveId}`);
  }

  /** 電子納付金融機関サイトURLを取得する */
  async displayPaymentSite(req: PaymentSiteRequest): Promise<PaymentSiteResponse> {
    return this.request<PaymentSiteResponse>('POST', '/payment', { body: req });
  }

  // ================================================================
  // 電子送達
  // ================================================================

  /** 電子送達利用申込みを行う */
  async applyPostDelivery(req: PostApplyRequest): Promise<PostApplyResponse> {
    return this.request<PostApplyResponse>('POST', '/post-apply', { body: req });
  }

  /** 電子送達利用申込みの状況を確認する */
  async getPostApplyStatus(arriveId: string): Promise<PostApplyDetailResponse> {
    return this.request<PostApplyDetailResponse>('GET', `/post-apply/${arriveId}`);
  }

  /** 電子送達一覧を取得する */
  async listPostDeliveries(params: PostListsRequest): Promise<PostListsResponse> {
    return this.request<PostListsResponse>('GET', '/post/lists', {
      params: {
        date_from: params.date_from,
        date_to: params.date_to,
        limit: String(params.limit),
        offset: String(params.offset),
      },
    });
  }

  /** 電子送達の通知文書を取得する */
  async getPostDelivery(postId: string): Promise<PostDetailResponse> {
    return this.request<PostDetailResponse>('GET', `/post/${postId}`);
  }

  /** 電子送達の取得完了を通知する */
  async completePostDelivery(req: PostCompleteRequest): Promise<PostCompleteResponse> {
    return this.request<PostCompleteResponse>('POST', '/post', { body: req });
  }

  // ================================================================
  // アカウント間情報共有
  // ================================================================

  /** 情報共有設定一覧を取得する */
  async listShareSettings(): Promise<ShareSettingListsResponse> {
    return this.request<ShareSettingListsResponse>('GET', '/share-setting/lists');
  }

  /** 情報共有を設定する */
  async createShareSetting(req: ShareSettingCreateRequest): Promise<ShareSettingCreateResponse> {
    return this.request<ShareSettingCreateResponse>('POST', '/share-setting', { body: req });
  }

  /** 情報共有設定を更新する */
  async updateShareSetting(req: ShareSettingUpdateRequest): Promise<ShareSettingUpdateResponse> {
    return this.request<ShareSettingUpdateResponse>('PUT', '/share-setting', { body: req });
  }

  /** 情報共有設定を解除する */
  async deleteShareSetting(req: ShareSettingDeleteRequest): Promise<ShareSettingDeleteResponse> {
    return this.request<ShareSettingDeleteResponse>('DELETE', '/share-setting', { body: req });
  }

  /** 共有設定を確認 (許可/不許可) する */
  async confirmShareSetting(req: ShareConfirmationRequest): Promise<ShareConfirmationResponse> {
    return this.request<ShareConfirmationResponse>('POST', '/share-confirmation', { body: req });
  }
}
