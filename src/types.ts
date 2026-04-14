/**
 * e-Gov 電子申請API v2 TypeScript 型定義
 *
 * OpenAPI 仕様 (openapi.json) の components.schemas および
 * 各エンドポイントのリクエスト/レスポンス構造から導出した型定義。
 */

// ============================================================
// Common --- 共通型
// ============================================================

/** メタデータ (全APIレスポンス共通) */
export interface MetadataCommon {
  /** API名称 */
  title: string;
  /** 詳細情報 */
  detail: string;
  /** APIドキュメントURL */
  type: string;
  /** エンドポイントURI */
  instance: string;
}

/** 結果セット (一覧系APIレスポンス共通) */
export interface ResultSet {
  /** 全件数 */
  all_count: number;
  /** 取得件数 */
  limit: number;
  /** オフセット件数 */
  offset: number;
  /** 取得結果件数 */
  count: number;
}

/** ファイルデータ (ZIP圧縮済み、Base64エンコード) */
export interface FileData {
  /** ファイル名（拡張子 .zip を含む） */
  file_name: string;
  /** ファイルデータ (Base64) */
  file_data: string;
}

/** プレ印字用ファイルデータ */
export interface FileDataPre {
  /** ファイル名 */
  file_name: string;
  /** ファイルデータ (Base64) */
  file_data: string;
}

/** 添付ファイルリスト項目 */
export interface FileDataOptionalItem {
  /** ファイル名 */
  file_name?: string;
  /** ファイルデータ (Base64) */
  file_data?: string;
}

/** ファイル名リスト項目 (公文書用) */
export interface FileNameListOfficial {
  /** ファイル名 */
  file_name: string;
}

/** ファイル名リスト項目 (取得完了用) */
export interface FileNameListItem {
  /** ファイル名 */
  file_name: string;
}

/** 接続URL情報 (一覧系) */
export interface LinksList {
  /** 接続URL情報(自身) */
  self: string;
  /** 接続URL情報（前頁） */
  previous?: string;
  /** 接続URL情報（次頁） */
  next?: string;
}

/** 接続URL情報 (一覧系 - 送信番号指定時は前頁/次頁なし) */
export interface LinksListNote {
  /** 接続URL情報(自身) */
  self: string;
  /** 接続URL情報（前頁） */
  previous?: string;
  /** 接続URL情報（次頁） */
  next?: string;
}

/** 接続URL情報 (申請データ送信レスポンス用) */
export interface LinksApply {
  /** 接続URL情報(自身) */
  self: string;
  /** 接続URL情報(申請案件取得) */
  status: string;
}

/** 接続URL情報 (bulk申請レスポンス用) */
export interface LinksBulkApply {
  /** 接続URL情報(自身) */
  self: string;
  /** 接続URL情報（申請案件一覧） */
  list: string;
  /** 接続URL情報（エラーレポート） */
  report: string;
}

/** 接続URL情報 (公文書/電子送達取得レスポンス用) */
export interface LinksOfficialDocument {
  /** 接続URL情報(自身) */
  self: string;
  /** 接続URL情報(取得完了) */
  complete: string;
}

/** 申請届出識別情報 */
export interface ApplicationInfo {
  /** 入力項目名 */
  label: string;
  /** 入力値 */
  value: string;
}

/** エラーレスポンス (API共通) */
export interface ApiErrorResponse {
  /** エラー内容 */
  title: string;
  /** エラー詳細 */
  detail?: string;
  /** APIドキュメントURI */
  type: string;
  /** エンドポイントURI */
  instance: string;
}

/** エラーレスポンス (エラーレポート付き) */
export interface ApiErrorResponseWithReport extends ApiErrorResponse {
  /** エラーレポート一覧 */
  report_list?: ReportListItem[];
}

/** エラーレスポンス (取下げエラーレポート付き) */
export interface ApiErrorResponseWithWithdrawReport extends ApiErrorResponse {
  /** エラーレポート一覧 */
  report_list?: ReportListWithdrawItem[];
}

/** エラーレスポンス (bulk申請エラー) */
export interface ApiErrorResponseBulk extends ApiErrorResponse {
  /** エラー件数 */
  error_count: number;
  /** エラー内容項目 */
  error?: ErrorBulkItem[];
}

/** エラーレポート項目 */
export interface ReportListItem {
  /** 様式名 (依らない場合は"-") */
  form_name?: string;
  /** 添付書類名 (依らない場合は"-") */
  attached_file_name?: string;
  /** ファイル名 (依らない場合は"-") */
  file_name?: string;
  /** 項目名 (依らない場合は"-") */
  item?: string;
  /** エラー内容 */
  content?: string;
}

/** エラーレポート項目 (取下げ用) */
export interface ReportListWithdrawItem {
  /** ファイル名 (依らない場合は"-") */
  file_name?: string;
  /** 項目名 (依らない場合は"-") */
  item?: string;
  /** エラー内容 */
  content?: string;
}

/** bulk申請エラー内容項目 */
export interface ErrorBulkItem {
  /** エラー申請フォルダ名 */
  errorFolder?: string;
  /** エラー申請ファイル名 */
  errorFile?: string;
  /** エラー内容 */
  content?: string;
}

/** トークンエラーレスポンス (認証系) */
export interface ErrorToken {
  /** HTTPステータスに紐づくエラーコード */
  error: string;
  /** エラーコードに紐づくエラー詳細 */
  error_description?: string;
}

// ============================================================
// Procedure --- 手続選択
// ============================================================

/** 様式情報 */
export interface FileInfoItem {
  /** 様式ID */
  form_id?: string;
  /** 様式バージョン */
  form_version?: number;
  /** 様式名 */
  form_name?: string;
  /** 申請書XMLファイル名 */
  apply_file_name?: string;
  /** スタイルシートファイル名 */
  xsl_file_name?: string;
  /** 形式チェックファイル名 */
  server_check_file_name?: string;
  /** スキーマファイル名 */
  schema_file_name?: string;
  /** 様式記入要領ファイル名 */
  style_indication_file?: string;
}

/** 手続選択の結果データ */
export interface ResultsProcedure {
  /** ファイル圧縮データ (Base64) */
  file_data: string;
  /** 構成管理XMLファイル名（または構成情報XMLファイル名）配列 */
  configuration_file_name: string[];
  /** 様式情報 */
  file_info: FileInfoItem[];
}

/** GET /procedure/{proc_id} リクエストパラメータ */
export interface ProcedureRequest {
  /** 手続識別子 (16桁、半角英数字) */
  proc_id: string;
}

/** GET /procedure/{proc_id} レスポンス */
export interface ProcedureResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsProcedure;
}

// ============================================================
// Preprint --- プレ印字データ取得
// ============================================================

/** プレ印字結果データ */
export interface ResultsPreprint {
  /** プレ印字された申請書XML */
  apply_file: FileDataPre;
}

/** POST /preprint リクエストボディ */
export interface PreprintRequest {
  /** 申請届出識別情報 */
  application_info: ApplicationInfo[];
  /** 手続識別子 (16桁) */
  proc_id: string;
  /** 様式ID (18桁) */
  form_id: string;
  /** 様式バージョン (1-9999) */
  form_version: number;
  /** 申請書XMLデータ (Base64) */
  file_data: string;
}

/** POST /preprint レスポンス */
export interface PreprintResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPreprint;
}

// ============================================================
// Apply --- 申請データ送信
// ============================================================

/** 様式 */
export interface FormItem {
  /** 様式名 */
  form_name?: string;
}

/** 添付書類 */
export interface AttachedFileItem {
  /** 添付書類名 */
  attached_file_name?: string;
}

/** 申請した各様式・書類の内容 */
export interface ApplyForm {
  /** 様式 */
  form?: FormItem[];
  /** 添付書類 */
  attached_file?: AttachedFileItem[];
}

/** 納付情報 (申請用) */
export interface ApplyPayListApplyItem {
  /** 納付番号 */
  pay_number?: string;
  /** 確認番号 */
  confirm_number?: string;
  /** 収納機関番号 */
  facility_number?: string;
  /** 納付手続名（カナ） */
  pay_name_kana?: string;
  /** 払込金額 */
  total_fee?: number;
  /** 払込期限 (YYYY-MM-DD) */
  pay_expired?: string;
}

/** 申請データ送信の結果データ */
export interface ResultsApply {
  /** 到達番号 */
  arrive_id: string;
  /** 到達日時 (YYYY-MM-DD HH:MM:SS) */
  arrive_date: string;
  /** 法人名 */
  corporation_name: string;
  /** 申請者名 */
  applicant_name: string;
  /** 申請区分 (「新規申請」または「再提出」) */
  apply_type: string;
  /** 手続名 */
  proc_name: string;
  /** 府省名 */
  ministry_name: string;
  /** 提出先 */
  submission_destination: string;
  /** 申請した各様式・書類の内容 */
  apply_form: ApplyForm;
  /** 納付情報 */
  apply_pay_list?: ApplyPayListApplyItem[];
}

/** POST /apply リクエストボディ */
export interface ApplyRequest {
  /** 手続識別子 (16桁) */
  proc_id: string;
  /** 申請データ (ZIP圧縮、Base64) */
  send_file: FileData;
}

/** POST /apply レスポンス */
export interface ApplyResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsApply;
  /** 接続URL情報 */
  _links: LinksApply;
}

// ============================================================
// BulkApply --- 申請データbulk送信
// ============================================================

/** bulk申請の結果データ */
export interface ResultsBulkApply {
  /** 発行した送信番号 (18桁) */
  send_number: string;
  /** 送信日時 (YYYY-MM-DD HH:MM:SS) */
  send_date: string;
  /** 一括申請データのファイル名 */
  file_name: string;
  /** 申請件数 */
  apply_count: number;
}

/** POST /bulk-apply リクエストボディ */
export interface BulkApplyRequest {
  /** 申請データ (ZIP圧縮、Base64) */
  send_file: FileData;
}

/** POST /bulk-apply レスポンス (202 Accepted) */
export interface BulkApplyResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsBulkApply;
  /** 接続URL情報 */
  _links: LinksBulkApply;
}

// ============================================================
// Amend --- 補正データ送信
// ============================================================

/** 補正データ送信の結果データ */
export interface ResultsApplyAmend {
  /** 補正対象の到達番号 */
  arrive_id: string;
  /** 補正受付日時 (YYYY-MM-DD HH:MM:SS) */
  amend_date: string;
}

/** POST /apply/amend リクエストボディ */
export interface AmendRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
  /** 補正対象データ (ZIP圧縮、Base64) */
  send_file: FileData;
}

/** POST /apply/amend レスポンス */
export interface AmendResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsApplyAmend;
}

// ============================================================
// Withdraw --- 取り下げ依頼送信
// ============================================================

/** 取り下げ依頼の結果データ */
export interface ResultsApplyWithdraw {
  /** 取り下げ依頼対象の到達番号 */
  arrive_id: string;
  /** 取り下げ依頼日時 (YYYY-MM-DD HH:MM:SS) */
  withdraw_date: string;
  /** 法人名 */
  corporation_name?: string;
  /** 申請者名 */
  applicant_name: string;
  /** 手続名 */
  proc_name: string;
  /** 府省名 */
  ministry_name: string;
  /** 提出先 */
  submission_destination?: string;
}

/** POST /apply/withdraw リクエストボディ */
export interface WithdrawRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
  /** 取下げ依頼データ (ZIP圧縮、Base64) */
  send_file: FileData;
}

/** POST /apply/withdraw レスポンス */
export interface WithdrawResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsApplyWithdraw;
}

// ============================================================
// Check --- 形式チェック実行
// ============================================================

/** 形式チェック実行の結果データ */
export interface ResultsApplyCheck {
  /** 処理結果に基づくメッセージ */
  message: string;
  /** エラーレポート件数 */
  error_count: number;
  /** エラーレポート一覧 */
  report_list?: ReportListItem[];
}

/** POST /apply/check リクエストボディ */
export interface CheckRequest {
  /** 手続識別子 (16桁) */
  proc_id: string;
  /** 申請データ (ZIP圧縮、Base64) */
  send_file: FileData;
}

/** POST /apply/check レスポンス */
export interface CheckResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsApplyCheck;
}

// ============================================================
// ApplyList --- 申請案件一覧取得
// ============================================================

/** 申請案件に関する通知 (一覧内) */
export interface NoticeListApplyItem {
  /** 通知通番 */
  notice_sub_id?: number;
  /** 発行日時 (YYYY-MM-DD HH:MM:SS) */
  issue_date?: string;
  /** 種別 (補正通知含む) */
  notice_data_type?: string;
  /** 件名 */
  notice_title?: string;
  /** 本文 */
  notice_sentence?: string;
  /** 発出元 */
  issuer_organization?: string;
  /** 補正期限年月日 (YYYY-MM-DD) */
  correct_expired_date?: string;
  /** 補正日時 (YYYY-MM-DD HH:MM:SS) */
  correct_completed_date?: string;
}

/** 公文書情報 (一覧内) */
export interface OfficialListItem {
  /** 通知通番 */
  notice_sub_id?: number;
  /** 発行日時 (YYYY-MM-DD HH:MM:SS) */
  allowed_date?: string;
  /** 件名 */
  doc_title?: string;
  /** 取得期限 (YYYY-MM-DD) */
  doc_download_expired_date?: string;
  /** 取得完了日時 (YYYY-MM-DD HH:MM:SS) */
  doc_download_date?: string;
  /** 署名有無 (あり／なし) */
  sign?: string;
}

/** 申請案件一覧情報項目 */
export interface PackageApplyListItem {
  /** 項番 */
  no?: number;
  /** 送信番号 */
  send_number?: string;
  /** 送信日時 (YYYY-MM-DD HH:MM:SS) */
  send_date?: string;
  /** 現在の申請ステータス */
  status?: string;
  /** 到達番号 */
  arrive_id?: string;
  /** 到達日時 (YYYY-MM-DD HH:MM:SS) */
  arrive_date?: string;
  /** 法人名 */
  corporation_name?: string;
  /** 申請者名 */
  applicant_name?: string;
  /** 手続名 */
  proc_name?: string;
  /** 提出先 */
  submission_destination?: string;
  /** 取下げ可能フラグ */
  withdraw_flag?: boolean;
  /** 納付状況 */
  pay_status?: string;
  /** 通知件数 */
  notice_count?: number;
  /** 公文書件数 */
  doc_count?: number;
  /** 納付情報件数 */
  apply_pay_count?: number;
  /** 通知一覧 */
  notice_list?: NoticeListApplyItem[];
  /** 公文書一覧 */
  official_list?: OfficialListItem[];
  /** 納付情報一覧 */
  apply_pay_list?: ApplyPayListApplyItem[];
  /** 提出実施アカウント */
  applied_account?: string;
}

/** 申請案件一覧の結果データ */
export interface ResultsApplyLists {
  /** 申請案件一覧情報 */
  apply_list?: PackageApplyListItem[];
}

/** GET /apply/lists クエリパラメータ */
export interface ApplyListsRequest {
  /** 送信番号 (18桁、送信番号で取得する場合のみ指定) */
  send_number?: string;
  /** 取得対象期間開始日 (YYYY-MM-DD) */
  date_from?: string;
  /** 取得対象期間終了日 (YYYY-MM-DD) */
  date_to?: string;
  /** 取得件数 (1-50) */
  limit?: number;
  /** 取得ページ番号 (1-9999) */
  offset?: number;
}

/** GET /apply/lists レスポンス */
export interface ApplyListsResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果セット */
  resultset: ResultSet;
  /** 結果データ */
  results: ResultsApplyLists;
  /** 接続URL情報 */
  _links: LinksListNote;
}

// ============================================================
// ApplyDetail --- 申請案件取得
// ============================================================

/** 申請案件詳細の結果データ */
export interface ResultsApplyDetail {
  /** 現在の申請ステータス */
  status: string;
  /** 到達番号 */
  arrive_id: string;
  /** 到達日時 (YYYY-MM-DD HH:MM:SS) */
  arrive_date: string;
  /** 法人名 */
  corporation_name: string;
  /** 申請者名 */
  applicant_name: string;
  /** 手続名 */
  proc_name: string;
  /** 提出先 */
  submission_destination: string;
  /** 取下げ可能フラグ */
  withdraw_flag: boolean;
  /** 納付状況 */
  pay_status: string;
  /** 通知件数 */
  notice_count: number;
  /** 公文書件数 */
  doc_count: number;
  /** 納付情報件数 */
  apply_pay_count: number;
  /** 通知一覧 */
  notice_list?: NoticeListApplyItem[];
  /** 公文書一覧 */
  official_list?: OfficialListItem[];
  /** 納付情報一覧 */
  apply_pay_list?: ApplyPayListApplyItem[];
  /** 提出実施アカウント */
  applied_account?: string;
}

/** GET /apply/{arrive_id} リクエストパラメータ */
export interface ApplyDetailRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
}

/** GET /apply/{arrive_id} レスポンス */
export interface ApplyDetailResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsApplyDetail;
}

// ============================================================
// ApplyReport --- エラーレポート取得
// ============================================================

/** 申請結果・エラーの内容 */
export interface ResultReportInfoResultItem {
  /** 到達番号 (エラー時は"-") */
  arrive_id?: string;
  /** 到達日時 (エラー時は"-") */
  arrive_date?: string;
  /** 手続名 */
  proc_name?: string;
  /** 一括申請データ内の申請フォルダ名 */
  folder_name?: string;
  /** エラーレポート一覧 */
  report_list?: (ReportListItem & { detail?: string })[];
}

/** エラーレポート情報 */
export interface ErrorReportInfoItem {
  /** 発行した送信番号 */
  send_number?: string;
  /** 送信日時 (YYYY-MM-DD HH:MM:SS) */
  send_date?: string;
  /** 一括申請データのファイル名 */
  file_name?: string;
  /** 申請件数 */
  apply_count?: number;
  /** 到達した申請件数 */
  arrive_count?: number;
  /** エラーとなった申請件数 */
  error_count?: number;
  /** 申請結果・エラーの内容 */
  result?: ResultReportInfoResultItem[];
}

/** エラーレポート取得の結果データ */
export interface ResultsApplyReport {
  /** エラーレポート情報 */
  error_report_info?: ErrorReportInfoItem[];
}

/** GET /apply/report クエリパラメータ */
export interface ApplyReportRequest {
  /** 送信番号 (18桁) */
  send_number?: string;
  /** 取得対象期間開始日 (YYYY-MM-DD) */
  date_from?: string;
  /** 取得対象期間終了日 (YYYY-MM-DD) */
  date_to?: string;
  /** 取得件数 (1-30) */
  limit?: number;
  /** 取得ページ番号 (1-9999) */
  offset?: number;
}

/** GET /apply/report レスポンス */
export interface ApplyReportResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果セット */
  resultset: ResultSet;
  /** 結果データ */
  results: ResultsApplyReport;
  /** 接続URL情報 */
  _links: LinksListNote;
}

// ============================================================
// Message --- 手続に関するご案内
// ============================================================

/** 手続に関するご案内一覧項目 */
export interface MessageListItem {
  /** お知らせID */
  information_id?: string;
  /** 発出元 */
  issuer_organization?: string;
  /** 発出日時 (YYYY-MM-DD HH:MM:SS) */
  issue_date?: string;
  /** 手続分野大分類 */
  proc_first_category?: string;
  /** 手続分野中分類 */
  proc_second_category?: string;
  /** 手続分野小分類 */
  proc_third_category?: string;
  /** タイトル */
  information_title?: string;
}

/** 手続に関するご案内一覧の結果データ */
export interface ResultsMessageLists {
  /** 手続に関するご案内一覧 */
  information_list?: MessageListItem[];
}

/** 手続に関するご案内の詳細 */
export interface Message {
  /** 発出元 */
  issuer_organization: string;
  /** 発出日時 (YYYY-MM-DD HH:MM:SS) */
  issue_date: string;
  /** 手続分野大分類 */
  proc_first_category: string;
  /** 手続分野中分類 */
  proc_second_category: string;
  /** 手続分野小分類 */
  proc_third_category: string;
  /** タイトル */
  information_title: string;
  /** 本文 */
  information_data: string;
  /** 添付ファイルリスト */
  attached_file_list?: FileDataOptionalItem[];
}

/** 手続に関するご案内取得の結果データ */
export interface ResultsMessage {
  /** 手続に関するご案内 */
  information: Message;
}

/** GET /message/lists クエリパラメータ */
export interface MessageListsRequest {
  /** 取得対象期間開始日 (YYYY-MM-DD) */
  date_from: string;
  /** 取得対象期間終了日 (YYYY-MM-DD) */
  date_to: string;
  /** 取得件数 (1-50) */
  limit: number;
  /** 取得ページ番号 (1-9999) */
  offset: number;
}

/** GET /message/lists レスポンス */
export interface MessageListsResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果セット */
  resultset: ResultSet;
  /** 結果データ */
  results: ResultsMessageLists;
  /** 接続URL情報 */
  _links: LinksList;
}

/** GET /message/{information_id} リクエストパラメータ */
export interface MessageDetailRequest {
  /** お知らせID (1-16桁) */
  information_id: string;
}

/** GET /message/{information_id} レスポンス */
export interface MessageDetailResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsMessage;
}

// ============================================================
// Notice --- 申請案件に関する通知
// ============================================================

/** 法人名リスト項目 */
export interface CorporationNameListItem {
  /** 法人名 */
  corporation_name?: string;
}

/** 申請者名リスト項目 */
export interface ApplicantNameListItem {
  /** 申請者名 */
  applicant_name?: string;
}

/** 申請案件に関する通知一覧項目 */
export interface NoticeListItem {
  /** 発出元 */
  issuer_organization?: string;
  /** 到達番号 */
  arrive_id?: string;
  /** 通知通番 */
  notice_sub_id?: number;
  /** 通知発行日時 (YYYY-MM-DD HH:MM:SS) */
  notice_issue_date?: string;
  /** 種別 */
  type?: string;
  /** タイトル */
  title?: string;
  /** 法人名リスト */
  corporation_name_list?: CorporationNameListItem[];
  /** 申請者名リスト */
  applicant_name_list?: ApplicantNameListItem[];
  /** 手続名 */
  proc_name?: string;
  /** 通知対象アカウント */
  notified_account?: string;
}

/** 申請案件に関する通知一覧の結果データ */
export interface ResultsNoticeLists {
  /** 通知一覧 */
  notice_list?: NoticeListItem[];
}

/** 申請案件に関する通知の詳細 */
export interface Notice {
  /** 発出元 */
  issuer_organization: string;
  /** 通知発行日時 (YYYY-MM-DD HH:MM:SS) */
  notice_issue_date: string;
  /** 種別 (お知らせ、納付、補正、取下げ) */
  notice_type?: string;
  /** 補正種別 (部分補正、再提出、手続終了(再提出可)) */
  correct_type?: string;
  /** 補正期限年月日 (YYYY-MM-DD) */
  correct_expired_date?: string;
  /** 補正完了日時 (YYYY-MM-DD HH:MM:SS) */
  correct_completed_date?: string;
  /** タイトル */
  notice_title: string;
  /** 本文 */
  notice_sentence?: string;
  /** 添付ファイルリスト */
  attached_file_list?: FileDataOptionalItem[];
  /** 法人名リスト */
  corporation_name_list?: CorporationNameListItem[];
  /** 申請者名リスト */
  applicant_name_list?: ApplicantNameListItem[];
  /** 手続名 */
  proc_name: string;
  /** 通知対象アカウント */
  notified_account?: string;
}

/** 申請案件に関する通知取得の結果データ */
export interface ResultsNotice {
  /** 通知 */
  notice: Notice;
}

/** GET /notice/lists クエリパラメータ */
export interface NoticeListsRequest {
  /** 取得対象期間開始日 (YYYY-MM-DD) */
  date_from: string;
  /** 取得対象期間終了日 (YYYY-MM-DD) */
  date_to: string;
  /** 取得件数 (1-50) */
  limit: number;
  /** 取得ページ番号 (1-9999) */
  offset: number;
}

/** GET /notice/lists レスポンス */
export interface NoticeListsResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果セット */
  resultset: ResultSet;
  /** 結果データ */
  results: ResultsNoticeLists;
  /** 接続URL情報 */
  _links: LinksListNote;
}

/** GET /notice/{arrive_id}/{notice_sub_id} リクエストパラメータ */
export interface NoticeDetailRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
  /** 通知通番 (1-999) */
  notice_sub_id: number;
}

/** GET /notice/{arrive_id}/{notice_sub_id} レスポンス */
export interface NoticeDetailResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsNotice;
}

// ============================================================
// OfficialDocument --- 公文書
// ============================================================

/** 公文書取得の結果データ */
export interface ResultsOfficialDocument {
  /** ファイル圧縮データ (Base64) */
  file_data: string;
  /** ファイル名リスト */
  file_name_list: FileNameListOfficial[];
}

/** 公文書取得完了の結果データ */
export interface ResultsOfficialDocumentComplete {
  /** 到達番号 */
  arrive_id: string;
  /** 通知通番 */
  notice_sub_id: number;
  /** 手続名 */
  proc_name: string;
  /** 件名 */
  doc_title: string;
  /** 取得日時 (YYYY-MM-DD HH:MM:SS) */
  download_date: string;
  /** ファイル名リスト */
  file_name_list: FileNameListItem[];
}

/** 官職証明書検証結果 */
export interface OfficialCertVerifyResult {
  /** 署名検証結果 */
  validation_result?: string;
  /** 証明書検証結果 */
  certificate_result?: string;
  /** 証明書件数 */
  certificate_count?: number;
  /** 発行者 */
  publisher?: string;
  /** 所有者 */
  owner?: string;
  /** 発行者[DN] */
  publisher_dn?: string;
  /** 所有者[DN] */
  owner_dn?: string;
  /** シリアルナンバー */
  serial_number?: string;
  /** 有効期間開始日時 (YYYY-MM-DD HH:MM:SS) */
  start_date?: string;
  /** 有効期間終了日時 (YYYY-MM-DD HH:MM:SS) */
  end_date?: string;
}

/** 行政機関証明書検証結果項目 */
export interface GovernmentCertItem {
  /** 発行者[DN] */
  publisher_dn?: string;
  /** 所有者[DN] */
  owner_dn?: string;
  /** シリアルナンバー */
  serial_number?: string;
  /** 有効期間開始日時 (YYYY-MM-DD HH:MM:SS) */
  start_date?: string;
  /** 有効期間終了日時 (YYYY-MM-DD HH:MM:SS) */
  end_date?: string;
}

/** 検証結果項目 */
export interface VerifyResultItem {
  /** 官職証明書検証結果 */
  official?: OfficialCertVerifyResult;
  /** 行政機関証明書検証結果 */
  government?: GovernmentCertItem[];
}

/** 公文書署名検証の結果データ */
export interface ResultsOfficialDocumentVerify {
  /** 署名検証XMLファイル名 */
  sig_verification_xml_file_name: string;
  /** 署名検証対象の添付ファイル名 */
  attached_file_name?: string;
  /** 検証結果 */
  verify_result: VerifyResultItem[];
}

/** GET /official_document/{arrive_id}/{notice_sub_id} リクエストパラメータ */
export interface OfficialDocumentRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
  /** 通知通番 (1-999) */
  notice_sub_id: number;
}

/** GET /official_document/{arrive_id}/{notice_sub_id} レスポンス */
export interface OfficialDocumentResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsOfficialDocument;
  /** 接続URL情報 */
  _links: LinksOfficialDocument;
}

/** POST /official_document リクエストボディ (取得完了) */
export interface OfficialDocumentCompleteRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
  /** 通知通番 (1-999) */
  notice_sub_id: number;
}

/** POST /official_document レスポンス (取得完了) */
export interface OfficialDocumentCompleteResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsOfficialDocumentComplete;
}

/** POST /official_document/verify リクエストボディ (署名検証) */
export interface OfficialDocumentVerifyRequest {
  /** ファイル名 */
  file_name: string;
  /** ファイル圧縮データ (Base64) */
  file_data: string;
  /** 署名検証XMLファイル名 */
  sig_verification_xml_file_name: string;
}

/** POST /official_document/verify レスポンス (署名検証) */
export interface OfficialDocumentVerifyResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsOfficialDocumentVerify;
}

// ============================================================
// Payment --- 電子納付
// ============================================================

/** 金融機関情報 (銀行・信託銀行) */
export interface BankTrustItem {
  /** 金融機関名称 */
  financial_name?: string;
  /** ネットバンク商品名 */
  service_name?: string;
  /** URL */
  url?: string;
}

/** 頭文字別金融機関リスト (銀行・信託銀行) */
export interface TrustBankItem {
  /** 頭文字 */
  initial_name?: string;
  /** 金融機関情報 */
  bank?: BankTrustItem[];
}

/** 金融機関情報 (信金・信組・農中・労金) */
export interface BankItem {
  /** 金融機関名称 */
  financial_name?: string;
  /** URL */
  url?: string;
}

/** 金融機関種別共通 */
export interface BankCommon {
  /** 金融機関情報 */
  bank?: BankItem[];
}

/** 金融機関リスト */
export interface BankList {
  /** 銀行・信託銀行一覧 */
  trust_bank: TrustBankItem[];
  /** 信用金庫情報 */
  shinkin_bank: BankCommon;
  /** 信用組合情報 */
  credit_union: BankCommon;
  /** 農林中央金庫情報 */
  norinchukin_bank: BankCommon;
  /** 労働金庫情報 */
  labour_bank: BankCommon;
}

/** 国庫金電子納付取扱金融機関一覧の結果データ */
export interface ResultsPaymentLists {
  /** 金融機関リスト */
  bank_list: BankList;
  /** 金融機関種別一覧情報日時 (YYYY-MM-DD) */
  financial_type_list_date: string;
}

/** 納付情報 (電子納付情報一覧用) */
export interface ApplyPayListPaymentItem {
  /** 納付番号 */
  pay_number?: string;
  /** 確認番号 */
  confirm_number?: string;
  /** 収納機関番号 */
  facility_number?: string;
  /** 納付手続名（カナ） */
  pay_name_kana?: string;
  /** 払込期限 (YYYY-MM-DD) */
  pay_expired?: string;
  /** 払込金額 */
  total_fee?: number;
  /** 納付状況 */
  pay_status?: string;
  /** 納付日 (YYYY-MM-DD) */
  pay_date?: string;
  /** 通信欄 */
  pay_memo?: string;
  /** 納付フラグ */
  pay_flag?: string;
}

/** 電子納付情報一覧の結果データ */
export interface ResultsPayment {
  /** 到達番号 */
  arrive_id: string;
  /** 手続名 */
  proc_name: string;
  /** 納付情報 */
  apply_pay_list?: ApplyPayListPaymentItem[];
}

/** 電子納付金融機関サイト表示の結果データ */
export interface ResultsPaymentSite {
  /** 電子納付金融機関サイトURL */
  URL: string;
  /** 収納機関番号 */
  facility_number: string;
  /** 国庫金コード */
  treasury_money_code: string;
  /** パラメータタグ名 */
  parameter_tag_name: string;
  /** 情報リンクデータ (Base64) */
  information_link_data: string;
}

/** GET /payment/lists レスポンス */
export interface PaymentListsResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPaymentLists;
}

/** GET /payment/{arrive_id} リクエストパラメータ */
export interface PaymentRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
}

/** GET /payment/{arrive_id} レスポンス */
export interface PaymentResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPayment;
}

/** POST /payment リクエストボディ (金融機関サイト表示) */
export interface PaymentSiteRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
  /** 納付番号 (16桁) */
  pay_number: string;
  /** 金融機関名称 */
  bank_name: string;
  /** 手続識別子 (16桁) */
  proc_id: string;
}

/** POST /payment レスポンス (金融機関サイト表示) */
export interface PaymentSiteResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPaymentSite;
}

// ============================================================
// Post --- 電子送達
// ============================================================

/** 電子送達利用申込みの結果データ */
export interface ResultsPostApply {
  /** 到達番号 */
  arrive_id: string;
  /** 到達日時 (YYYY-MM-DD HH:MM:SS) */
  arrive_date: string;
  /** 法人名 */
  corporation_name: string;
  /** 申込者名 */
  applicant_name: string;
  /** 申請区分 (「新規申請」または「再提出」) */
  apply_type: string;
  /** 利用申込み対象の名称 */
  proc_name: string;
  /** 申込み所管府省 */
  ministry_name: string;
  /** 提出先 */
  submission_destination: string;
  /** 申込みを行った各様式・書類の内容 */
  apply_form: ApplyForm;
  /** 納付情報 */
  apply_pay_list: ApplyPayListApplyItem[];
}

/** 電子送達状況確認の結果データ */
export interface ResultsPostApplyDetail {
  /** 現在の申請ステータス */
  status: string;
  /** 到達番号 */
  arrive_id: string;
  /** 到達日時 (YYYY-MM-DD HH:MM:SS) */
  arrive_date: string;
  /** 法人名 */
  corporation_name: string;
  /** 申込者名 */
  applicant_name: string;
  /** 申込対象の名称 */
  proc_name: string;
  /** 提出先 */
  submission_destination: string;
  /** 取下げ可能フラグ */
  withdraw_flag: boolean;
  /** 納付状況 */
  pay_status: string;
  /** 通知件数 */
  notice_count: number;
  /** 公文書件数 */
  doc_count: number;
  /** 納付情報件数 */
  apply_pay_count: number;
  /** 通知一覧 */
  notice_list?: NoticeListApplyItem[];
  /** 公文書一覧 */
  official_list?: OfficialListItem[];
  /** 納付情報一覧 */
  apply_pay_list?: ApplyPayListApplyItem[];
  /** 提出実施アカウント */
  applied_account?: string;
}

/** 通知文書リスト項目 */
export interface NoticeDataListItem {
  /** 電子送達識別子 */
  post_id?: string;
  /** 通知文書名 */
  notice_data_name?: string;
  /** 通知文書の発出日時 (YYYY-MM-DD HH:MM:SS) */
  notice_issue_date?: string;
  /** 通知文書の取得期限 (YYYY-MM-DD) */
  download_expired_date?: string;
  /** 通知文書の取得完了日時 (YYYY-MM-DD HH:MM:SS) */
  download_date?: string;
  /** 通知文書の署名有無 (あり／なし) */
  sign?: string;
}

/** 電子送達一覧項目 */
export interface PostListItem {
  /** 府省メッセージ通番 */
  ministry_message_id?: string;
  /** 種別 */
  type?: string;
  /** タイトル */
  title?: string;
  /** 本文 */
  message_sentence?: string;
  /** 発出元 */
  issuer_organization?: string;
  /** 発出日時 (YYYY-MM-DD HH:MM:SS) */
  issue_date?: string;
  /** 送達対象アカウント */
  received_account?: string;
  /** 通知文書リスト */
  notice_data_list?: NoticeDataListItem[];
}

/** 電子送達一覧の結果データ */
export interface ResultsPostLists {
  /** 電子送達一覧 */
  post_list: PostListItem[];
}

/** 電子送達取得の結果データ */
export interface ResultsPost {
  /** 取得した通知文書一式の名称 */
  notice_data_name: string;
  /** ファイル圧縮データ (Base64) */
  file_data: string;
  /** ファイル名リスト */
  file_name_list: FileNameListOfficial[];
}

/** 電子送達取得完了の結果データ */
export interface ResultsPostComplete {
  /** 電子送達識別子 */
  post_id: string;
  /** 通知文書一式の名称 */
  notice_data_name: string;
  /** 取得日時 (YYYY-MM-DD HH:MM:SS) */
  download_date: string;
}

/** POST /post-apply リクエストボディ (電子送達利用申込み) */
export interface PostApplyRequest {
  /** 手続識別子 (16桁) */
  proc_id: string;
  /** 申請データ (ZIP圧縮、Base64) */
  send_file: FileData;
}

/** POST /post-apply レスポンス */
export interface PostApplyResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPostApply;
  /** 接続URL情報 */
  _links: LinksApply;
}

/** GET /post-apply/{arrive_id} リクエストパラメータ */
export interface PostApplyDetailRequest {
  /** 到達番号 (16-18桁) */
  arrive_id: string;
}

/** GET /post-apply/{arrive_id} レスポンス */
export interface PostApplyDetailResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPostApplyDetail;
}

/** GET /post/lists クエリパラメータ */
export interface PostListsRequest {
  /** 取得対象期間開始日 (YYYY-MM-DD) */
  date_from: string;
  /** 取得対象期間終了日 (YYYY-MM-DD) */
  date_to: string;
  /** 取得件数 (1-50) */
  limit: number;
  /** 取得ページ番号 (1-9999) */
  offset: number;
}

/** GET /post/lists レスポンス */
export interface PostListsResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果セット */
  resultset: ResultSet;
  /** 結果データ */
  results: ResultsPostLists;
  /** 接続URL情報 */
  _links: LinksList;
}

/** GET /post/{post_id} リクエストパラメータ */
export interface PostDetailRequest {
  /** 電子送達識別子 (1-50桁) */
  post_id: string;
}

/** GET /post/{post_id} レスポンス */
export interface PostDetailResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPost;
  /** 接続URL情報 */
  _links: LinksOfficialDocument;
}

/** POST /post リクエストボディ (電子送達取得完了) */
export interface PostCompleteRequest {
  /** 電子送達識別子 (1-50桁) */
  post_id: string;
}

/** POST /post レスポンス (電子送達取得完了) */
export interface PostCompleteResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsPostComplete;
}

// ============================================================
// ShareSetting --- アカウント間情報共有
// ============================================================

/** 情報共有設定内容 */
export interface ShareSettingInfo {
  /** gBizIDのアカウントID(メールアドレス) */
  gbiz_id: string;
  /** 公文書に関する権限情報 (READ/DOWNLOAD) */
  official_doc_permission: string;
  /** 電子送達の通知文書に関する権限情報 (READ/DOWNLOAD) */
  post_doc_permission: string;
}

/** 情報共有一覧の結果データ */
export interface ResultsShareSettingLists {
  /** 情報共有設定 */
  share_setting_list: ShareSettingInfo;
}

/** 情報共有設定の結果データ */
export interface ResultsShareSettingPost {
  /** 共有対象のgBizID */
  gbiz_id: string;
  /** 公文書に関する権限情報 */
  official_doc_permission: string;
  /** 電子送達の通知文書に関する権限情報 */
  post_doc_permission: string;
}

/** 情報共有更新の結果データ */
export interface ResultsShareSettingPut {
  /** 共有中のgBizID */
  gbiz_id: string;
  /** 公文書に関する権限情報 */
  official_doc_permission: string;
  /** 電子送達の通知文書に関する権限情報 */
  post_doc_permission: string;
}

/** 情報共有解除の結果データ */
export interface ResultsShareSettingDelete {
  /** 解除したgBizID */
  gbiz_id: string;
}

/** 共有設定確認の結果データ */
export interface ResultsShareConfirmation {
  /** 共有依頼元のgBizID */
  gbiz_id: string;
  /** 共有設定の許可/不許可 (ACCEPT/DENY) */
  share_acceptance: string;
}

/** GET /share-setting/lists レスポンス */
export interface ShareSettingListsResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsShareSettingLists;
}

/** POST /share-setting リクエストボディ (情報共有設定) */
export interface ShareSettingCreateRequest {
  /** 共有対象のgBizIDのアカウントID(メールアドレス) */
  gbiz_id: string;
  /** 公文書に関する権限情報 (READ/DOWNLOAD) */
  official_doc_permission: string;
  /** 電子送達の通知文書に関する権限情報 (READ/DOWNLOAD) */
  post_doc_permission: string;
}

/** POST /share-setting レスポンス */
export interface ShareSettingCreateResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsShareSettingPost;
}

/** PUT /share-setting リクエストボディ (情報共有更新) */
export interface ShareSettingUpdateRequest {
  /** 共有中のgBizIDのアカウントID(メールアドレス) */
  gbiz_id: string;
  /** 公文書に関する権限情報 (READ/DOWNLOAD) */
  official_doc_permission: string;
  /** 電子送達の通知文書に関する権限情報 (READ/DOWNLOAD) */
  post_doc_permission: string;
}

/** PUT /share-setting レスポンス */
export interface ShareSettingUpdateResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsShareSettingPut;
}

/** DELETE /share-setting リクエストボディ (情報共有解除) */
export interface ShareSettingDeleteRequest {
  /** 解除対象のgBizIDのアカウントID(メールアドレス) */
  gbiz_id: string;
}

/** DELETE /share-setting レスポンス */
export interface ShareSettingDeleteResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsShareSettingDelete;
}

/** POST /share-confirmation リクエストボディ (共有設定確認) */
export interface ShareConfirmationRequest {
  /** 共有依頼元のgBizIDのアカウントID(メールアドレス) */
  gbiz_id: string;
  /** 共有設定の許可/不許可 (ACCEPT/DENY) */
  share_acceptance: string;
}

/** POST /share-confirmation レスポンス */
export interface ShareConfirmationResponse {
  /** メタデータ */
  metadata: MetadataCommon;
  /** 結果データ */
  results: ResultsShareConfirmation;
}

// ============================================================
// Auth --- 利用者認証 (OAuth2)
// ============================================================

/** GET /auth クエリパラメータ (ユーザー認可) */
export interface AuthRequest {
  /** ソフトウェアID */
  client_id: string;
  /** レスポンス・タイプ (code) */
  response_type: string;
  /** スコープ (openid offline_access) */
  scope: string;
  /** リダイレクトURL */
  redirect_uri: string;
  /** CSRF対策用ランダム値 */
  state?: string;
  /** PKCE code_challenge (SHA-256, BASE64URL) */
  code_challenge?: string;
  /** code_challengeのハッシュアルゴリズム (S256) */
  code_challenge_method?: string;
}

/** ユーザー認可コールバックパラメータ */
export interface AuthCallbackParams {
  /** 認可コード */
  code: string;
  /** ユーザー認可リクエスト時に指定したstate値 */
  state?: string;
  /** セッション状態を表す識別子 */
  session_state: string;
}

/** POST /token リクエストボディ (アクセストークン取得/再取得) */
export interface TokenRequest {
  /** 取得時: authorization_code / 再取得時: refresh_token */
  grant_type: string;
  /** 認可コード (取得時のみ) */
  code?: string;
  /** リダイレクトURI (取得時のみ) */
  redirect_uri?: string;
  /** PKCE code_verifier (取得時のみ) */
  code_verifier?: string;
  /** リフレッシュトークン (再取得時のみ) */
  refresh_token?: string;
  /** スコープ */
  scope?: string;
}

/** POST /token レスポンス */
export interface TokenResponse {
  /** アクセストークン */
  access_token: string;
  /** アクセストークンの有効期限（秒） */
  expires_in: number;
  /** リフレッシュトークンの有効期限（秒） */
  refresh_expires_in: number;
  /** リフレッシュトークン */
  refresh_token: string;
  /** トークン・タイプ (Bearer) */
  token_type: string;
  /** IDトークン */
  id_token: string;
  /** アクセスが有効となる日時 (UNIXタイムスタンプ) */
  'not-before-policy': number;
  /** セッション状態を表す識別子 */
  session_state: string;
  /** スコープ */
  scope: string;
}

/** POST /token/introspect リクエストボディ (トークン検証) */
export interface IntrospectRequest {
  /** アクセストークンまたはリフレッシュトークン */
  token: string;
  /** トークン種別ヒント (access_token / refresh_token) */
  token_type_hint?: string;
}

/** POST /token/introspect レスポンス */
export interface IntrospectResponse {
  /** トークンの有効期限 (UNIXタイムスタンプ) */
  exp?: number;
  /** トークン付与時刻 (UNIXタイムスタンプ) */
  iat?: number;
  /** ユーザー認証時刻 (UNIXタイムスタンプ) */
  auth_time?: number;
  /** トークン識別子 */
  jti?: string;
  /** トークン発行者 */
  iss?: string;
  /** トークン発行対象の識別子 */
  aud?: string;
  /** ユーザー識別子 */
  sub?: string;
  /** トークンタイプ */
  typ?: string;
  /** 認可対象の識別子 */
  azp?: string;
  /** セッション状態識別子 */
  session_state?: string;
  /** メールアドレス */
  email?: string;
  /** メールアドレス確認有無 */
  email_verified?: boolean;
  /** 認証コンテキストクラス */
  acr?: string;
  /** アクセストークンの有効範囲 */
  scope?: string;
  /** セッション識別子 */
  sid?: string;
  /** アイデンティティプロバイダの識別子 */
  egov_idp?: string;
  /** 外部IDP認証時刻 (UNIXタイムスタンプ ミリ秒) */
  egov_extidp_auth_time?: number;
  /** GビズIDのアカウント種別 (1:エントリー, 2:プライム, 3:メンバー) */
  egov_gbizid_account_type?: string;
  /** トークン付与先クライアント */
  client_id?: string;
  /** ユーザー名 */
  username?: string;
  /** トークンの有効性 */
  active: boolean;
}

/** POST /logout リクエストボディ */
export interface LogoutRequest {
  /** リフレッシュトークン */
  refresh_token: string;
}
