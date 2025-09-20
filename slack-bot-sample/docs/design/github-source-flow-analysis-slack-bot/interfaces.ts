// GitHub 소스코드 플로우 분석 Slack Bot - TypeScript 인터페이스 정의

// =====================================
// GitHub Integration Types
// =====================================

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  default_branch: string;
  language: string;
  size: number;
  clone_url: string;
  ssh_url: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  type: 'User' | 'Organization';
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  created_at: string;
  updated_at: string;
  repository: GitHubRepository;
}

export interface GitHubPullRequest extends GitHubIssue {
  head: GitHubPRBranch;
  base: GitHubPRBranch;
  merged: boolean;
  merged_at: string | null;
  diff_url: string;
  patch_url: string;
  changed_files: number;
  additions: number;
  deletions: number;
}

export interface GitHubPRBranch {
  label: string;
  ref: string;
  sha: string;
  user: GitHubUser;
  repo: GitHubRepository;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string;
}

export interface GitHubFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
}

export interface GitHubFileContent {
  path: string;
  content: string;
  encoding: 'base64' | 'utf-8';
  size: number;
  sha: string;
  type: 'file' | 'dir';
}

// =====================================
// Code Analysis Types
// =====================================

export interface AnalysisRequest {
  id: string;
  github_url: string;
  issue_type: 'issue' | 'pr' | 'auto';
  analysis_depth: 'shallow' | 'deep';
  output_format: 'tree' | 'diagram' | 'json';
  user_id: string;
  workspace_id: string;
  created_at: Date;
  status: AnalysisStatus;
  metadata?: Record<string, any>;
}

export type AnalysisStatus =
  | 'pending'
  | 'fetching_github_data'
  | 'analyzing_code'
  | 'generating_report'
  | 'completed'
  | 'failed'
  | 'timeout';

export interface AnalysisResult {
  id: string;
  request_id: string;
  flow_data: CodeFlowGraph;
  markdown_report: string;
  summary: AnalysisSummary;
  completed_at: Date;
  execution_time_ms: number;
  file_count: number;
  errors: AnalysisError[];
  warnings: AnalysisWarning[];
}

export interface AnalysisSummary {
  total_files: number;
  analyzed_files: number;
  skipped_files: number;
  entry_points: string[];
  api_endpoints: number;
  database_queries: number;
  potential_issues: number;
  flow_depth: number;
}

export interface AnalysisError {
  type: 'github_api' | 'parsing' | 'analysis' | 'timeout' | 'file_too_large';
  message: string;
  file_path?: string;
  line_number?: number;
  details?: Record<string, any>;
}

export interface AnalysisWarning {
  type: 'missing_validation' | 'no_error_handling' | 'circular_dependency' | 'performance';
  message: string;
  file_path: string;
  line_number?: number;
  severity: 'low' | 'medium' | 'high';
}

// =====================================
// Code Flow Analysis Types
// =====================================

export interface CodeFlowGraph {
  entry_points: FlowNode[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata: FlowMetadata;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  file_path: string;
  line_number?: number;
  name: string;
  description?: string;
  code_snippet?: string;
  metadata?: Record<string, any>;
}

export type FlowNodeType =
  | 'router'
  | 'api_endpoint'
  | 'controller'
  | 'service'
  | 'repository'
  | 'model'
  | 'database'
  | 'external_api'
  | 'middleware'
  | 'utility';

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  type: FlowEdgeType;
  description?: string;
  metadata?: Record<string, any>;
}

export type FlowEdgeType =
  | 'import'
  | 'function_call'
  | 'api_request'
  | 'database_query'
  | 'data_flow'
  | 'dependency';

export interface FlowMetadata {
  analysis_timestamp: Date;
  github_url: string;
  starting_file: string;
  max_depth_reached: number;
  total_flow_paths: number;
}

// =====================================
// AST & Parsing Types
// =====================================

export interface ParsedFile {
  path: string;
  content: string;
  content_hash: string;
  file_type: SupportedFileType;
  ast_data: ASTNode;
  imports: ImportStatement[];
  exports: ExportStatement[];
  functions: FunctionDefinition[];
  classes: ClassDefinition[];
  api_calls: APICall[];
  database_queries: DatabaseQuery[];
}

export type SupportedFileType =
  | 'typescript'
  | 'javascript'
  | 'tsx'
  | 'jsx'
  | 'json'
  | 'sql'
  | 'md';

export interface ASTNode {
  type: string;
  start: number;
  end: number;
  children: ASTNode[];
  metadata: Record<string, any>;
}

export interface ImportStatement {
  source: string;
  imports: string[];
  is_default: boolean;
  is_namespace: boolean;
  line_number: number;
}

export interface ExportStatement {
  name: string;
  is_default: boolean;
  type: 'function' | 'class' | 'const' | 'interface' | 'type';
  line_number: number;
}

export interface FunctionDefinition {
  name: string;
  parameters: Parameter[];
  return_type?: string;
  is_async: boolean;
  is_exported: boolean;
  line_number: number;
  body_snippet: string;
}

export interface ClassDefinition {
  name: string;
  extends?: string;
  implements: string[];
  methods: FunctionDefinition[];
  properties: PropertyDefinition[];
  is_exported: boolean;
  line_number: number;
}

export interface PropertyDefinition {
  name: string;
  type?: string;
  is_static: boolean;
  is_readonly: boolean;
  line_number: number;
}

export interface Parameter {
  name: string;
  type?: string;
  is_optional: boolean;
  default_value?: string;
}

export interface APICall {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  line_number: number;
  function_context: string;
  parameters?: Record<string, any>;
}

export interface DatabaseQuery {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP';
  table: string;
  query_snippet: string;
  line_number: number;
  function_context: string;
}

// =====================================
// Slack Integration Types
// =====================================

export interface SlackCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export interface SlackCommandArgs {
  github_url: string;
  type?: 'issue' | 'pr' | 'auto';
  depth?: 'shallow' | 'deep';
  format?: 'tree' | 'diagram' | 'json';
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  thread_ts?: string;
  reply_broadcast?: boolean;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'context' | 'actions';
  text?: SlackText;
  fields?: SlackText[];
  elements?: SlackElement[];
  accessory?: SlackElement;
}

export interface SlackText {
  type: 'mrkdwn' | 'plain_text';
  text: string;
  emoji?: boolean;
}

export interface SlackElement {
  type: 'button' | 'select' | 'overflow' | 'datepicker';
  text: SlackText;
  value?: string;
  url?: string;
  action_id?: string;
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: SlackField[];
  footer?: string;
  ts?: number;
}

export interface SlackField {
  title: string;
  value: string;
  short: boolean;
}

export interface SlackProgressUpdate {
  request_id: string;
  channel: string;
  thread_ts: string;
  progress: number;
  status: string;
  message: string;
}

// =====================================
// Claude Code Integration Types
// =====================================

export interface ClaudeCodeCommand {
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  examples: ClaudeCodeExample[];
}

export interface ClaudeCodeExample {
  input: string;
  output: string;
  description: string;
}

export interface AnalyzeGitHubUrlRequest {
  github_url: string;
  output_file?: string;
  analysis_depth?: 'shallow' | 'deep';
}

export interface AnalyzeGitHubUrlResponse {
  success: boolean;
  output_file: string;
  analysis_summary: AnalysisSummary;
  execution_time_ms: number;
  error?: string;
}

export interface ExportToSlackRequest {
  report_file_path: string;
  slack_channel?: string;
  include_attachments?: boolean;
}

export interface ExportToSlackResponse {
  success: boolean;
  message_url?: string;
  channel: string;
  timestamp: string;
  error?: string;
}

// =====================================
// API Response Types
// =====================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface ApiMeta {
  request_id: string;
  execution_time_ms: number;
  rate_limit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_at: Date;
  retry_after?: number;
}

// =====================================
// Configuration Types
// =====================================

export interface AppConfig {
  github: GitHubConfig;
  slack: SlackConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  analysis: AnalysisConfig;
}

export interface GitHubConfig {
  token: string;
  webhook_secret?: string;
  api_base_url: string;
  rate_limit: {
    requests_per_hour: number;
    requests_per_minute: number;
  };
}

export interface SlackConfig {
  bot_token: string;
  signing_secret: string;
  app_token?: string;
  allowed_workspaces: string[];
}

export interface DatabaseConfig {
  url: string;
  max_connections: number;
  connection_timeout_ms: number;
  query_timeout_ms: number;
}

export interface RedisConfig {
  url: string;
  db: number;
  key_prefix: string;
  default_ttl_seconds: number;
}

export interface AnalysisConfig {
  max_file_size_bytes: number;
  max_analysis_time_ms: number;
  max_files_per_analysis: number;
  supported_file_extensions: string[];
  entry_point_patterns: string[];
}

// =====================================
// Utility Types
// =====================================

export type Timestamp = string; // ISO 8601 format
export type UUID = string;
export type GitHubURL = string;
export type FilePath = string;
export type FileContent = string;
export type Base64Content = string;

export interface PaginationParams {
  page: number;
  per_page: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}