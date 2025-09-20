// GitHub API 클라이언트 관련 타입 정의

// 기존 타입들 (호환성 유지)
export interface GitHubUrlInfo {
  owner: string;
  repo: string;
  type: 'issue' | 'pull';
  number: number;
}

export interface UserInfo {
  login: string;
  id: number;
  avatar_url?: string | undefined;
  html_url?: string | undefined;
}

export interface RepositoryInfo {
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  html_url: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export interface FileInfo {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  changes: number;
  additions: number;
  deletions: number;
  content?: string | undefined;
  size: number;
  patch?: string | undefined;
}

export interface IssueInfo {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  author: UserInfo;
  createdAt: string;
  updatedAt: string;
  repository: RepositoryInfo;
  labels: string[];
  assignees: UserInfo[];
}

export interface PullRequestInfo extends IssueInfo {
  baseBranch: string;
  headBranch: string;
  commits: CommitInfo[];
  changedFiles: FileInfo[];
  mergeable: boolean | null;
  merged: boolean;
  mergedAt: string | null;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resetDate: Date;
}

export interface AuthInfo {
  login: string;
  id: number;
  name: string;
  email: string;
  scopes: string[];
  rateLimit: RateLimitInfo;
}

// TASK-303: 새로운 GitHub API 타입들
export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  starCount: number;
  forkCount: number;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean;
  defaultBranch: string;
  size: number;
}

export interface User {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
  type: 'User' | 'Organization';
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Label[];
  assignees: User[];
  author: User;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  url: string;
}

export interface PullRequest extends Issue {
  headBranch: string;
  baseBranch: string;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  mergeable: boolean | null;
  merged: boolean;
  mergedAt: Date | null;
  mergedBy: User | null;
  draft: boolean;
}

export interface FileContent {
  name: string;
  path: string;
  content: string;
  encoding: 'base64' | 'utf-8';
  size: number;
  sha: string;
  url: string;
}

export interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blobUrl: string;
  previousFilename?: string;
}

export interface Comment {
  id: number;
  body: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
  url: string;
  reactions?: Reactions;
}

export interface Review {
  id: number;
  body: string | null;
  author: User;
  state: 'approved' | 'changes_requested' | 'commented' | 'dismissed';
  submittedAt: Date;
  commitSha: string;
  url: string;
}

export interface Reactions {
  '+1': number;
  '-1': number;
  laugh: number;
  confused: number;
  heart: number;
  hooray: number;
  eyes: number;
  rocket: number;
  totalCount: number;
}

export interface GitHubApiError {
  status: number;
  message: string;
  type: 'AUTH_ERROR' | 'NOT_FOUND' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN';
  retryAfter?: number;
  documentation?: string;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  resetTime: Date;
  used: number;
}

export interface GitHubApiResponse<T> {
  data: T;
  rateLimit: GitHubRateLimit;
  etag?: string;
}

// GitHub API 클라이언트 인터페이스
export interface IGitHubApiClient {
  // Repository 정보
  getRepository(owner: string, repo: string): Promise<Repository>;

  // Issue/PR 정보
  getIssue(owner: string, repo: string, number: number): Promise<Issue>;
  getPullRequest(owner: string, repo: string, number: number): Promise<PullRequest>;

  // 파일 및 변경사항
  getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent>;
  getPullRequestFiles(owner: string, repo: string, number: number): Promise<FileChange[]>;

  // 댓글 및 리뷰
  getIssueComments(owner: string, repo: string, number: number): Promise<Comment[]>;
  getPullRequestReviews(owner: string, repo: string, number: number): Promise<Review[]>;

  // Rate Limit 정보
  getRateLimit(): Promise<GitHubRateLimit>;
}

// 데이터 매퍼 인터페이스
export interface IGitHubDataMapper {
  mapRepository(apiData: any): Repository;
  mapIssue(apiData: any): Issue;
  mapPullRequest(apiData: any): PullRequest;
  mapFileContent(apiData: any): FileContent;
  mapFileChange(apiData: any): FileChange;
  mapComment(apiData: any): Comment;
  mapReview(apiData: any): Review;
  mapUser(apiData: any): User;
  mapLabel(apiData: any): Label;
}

// Rate Limit 매니저 인터페이스
export interface IGitHubRateLimitManager {
  updateFromHeaders(headers: Record<string, string>): void;
  getCurrentLimit(): GitHubRateLimit;
  shouldWait(): boolean;
  getWaitTime(): number;
  canMakeRequest(): boolean;
  trackRequest(): void;
}

// API 설정
export interface GitHubApiConfig {
  token: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  userAgent?: string;
}

// 에러 클래스
export class GitHubApiErrorImpl extends Error implements GitHubApiError {
  public status: number;
  public type: GitHubApiError['type'];
  public retryAfter?: number;
  public documentation?: string;

  constructor(
    status: number,
    message: string,
    type: GitHubApiError['type'],
    retryAfter?: number,
    documentation?: string
  ) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.type = type;
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
    if (documentation !== undefined) {
      this.documentation = documentation;
    }
  }
}
