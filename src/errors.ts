/**
 * e-Gov 電子申請API エラークラス
 */

/** e-Gov API から返却されるエラーレポート項目 */
export interface EgovReportItem {
  /** 様式名 */
  form_name?: string;
  /** 添付書類名 */
  attached_file_name?: string;
  /** ファイル名 */
  file_name?: string;
  /** 項目名 */
  item?: string;
  /** エラー内容 */
  content?: string;
  /** エラー詳細 */
  detail?: string;
}

/**
 * e-Gov 電子申請API のエラーレスポンスを表すエラークラス。
 * HTTP エラーステータスコード、APIドキュメント上の結果コード、
 * エラーメッセージ一覧を保持する。
 */
export class EgovApiError extends Error {
  /** HTTP ステータスコード */
  readonly statusCode: number;
  /** API 結果コード（title フィールド等に含まれる識別文字列） */
  readonly resultCode: string;
  /** エラーメッセージ配列 */
  readonly errorMessages: string[];
  /** エラーレポート一覧（形式チェック結果等） */
  readonly reportList?: EgovReportItem[];

  constructor(params: {
    statusCode: number;
    resultCode: string;
    errorMessages: string[];
    reportList?: EgovReportItem[];
  }) {
    const msg = params.errorMessages.length > 0
      ? params.errorMessages.join('; ')
      : `e-Gov API error ${params.statusCode}: ${params.resultCode}`;
    super(msg);
    this.name = 'EgovApiError';
    this.statusCode = params.statusCode;
    this.resultCode = params.resultCode;
    this.errorMessages = params.errorMessages;
    this.reportList = params.reportList;
  }
}
