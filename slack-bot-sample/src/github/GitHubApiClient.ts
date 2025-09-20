import {
  IGitHubApiClient,
  GitHubApiConfig,
  Repository,
  Issue,
  PullRequest,
  FileContent,
  FileChange,
  Comment,
  Review,
  GitHubRateLimit,
  GitHubApiErrorImpl,
  GitHubApiError,
  IGitHubDataMapper,
  IGitHubRateLimitManager
} from './types';
import { GitHubDataMapper } from './GitHubDataMapper';
import { GitHubRateLimitManager } from './GitHubRateLimitManager';

export class GitHubApiClient implements IGitHubApiClient {
  private config: GitHubApiConfig;
  private dataMapper: IGitHubDataMapper;
  private rateLimitManager: IGitHubRateLimitManager;

  constructor(config: GitHubApiConfig) {
    this.config = {
      baseUrl: 'https://api.github.com',
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000,
      userAgent: 'GitHub-Analysis-Bot/1.0',
      ...config,
    };

    this.dataMapper = new GitHubDataMapper();
    this.rateLimitManager = new GitHubRateLimitManager();
  }

  public async getRepository(owner: string, repo: string): Promise<Repository> {
    const url = `${this.config.baseUrl}/repos/${owner}/${repo}`;
    const response = await this.makeRequest(url);
    return this.dataMapper.mapRepository(response);
  }

  public async getIssue(owner: string, repo: string, number: number): Promise<Issue> {
    const url = `${this.config.baseUrl}/repos/${owner}/${repo}/issues/${number}`;
    const response = await this.makeRequest(url);
    return this.dataMapper.mapIssue(response);
  }

  public async getPullRequest(owner: string, repo: string, number: number): Promise<PullRequest> {
    const url = `${this.config.baseUrl}/repos/${owner}/${repo}/pulls/${number}`;
    const response = await this.makeRequest(url);
    return this.dataMapper.mapPullRequest(response);
  }

  public async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent> {
    let url = `${this.config.baseUrl}/repos/${owner}/${repo}/contents/${path}`;
    if (ref) {
      url += `?ref=${encodeURIComponent(ref)}`;
    }
    const response = await this.makeRequest(url);
    return this.dataMapper.mapFileContent(response);
  }

  public async getPullRequestFiles(owner: string, repo: string, number: number): Promise<FileChange[]> {
    const url = `${this.config.baseUrl}/repos/${owner}/${repo}/pulls/${number}/files`;
    const response = await this.makeRequest(url);

    if (!Array.isArray(response)) {
      throw new GitHubApiErrorImpl(500, 'Invalid response format', 'UNKNOWN');
    }

    return response.map(fileData => this.dataMapper.mapFileChange(fileData));
  }

  public async getIssueComments(owner: string, repo: string, number: number): Promise<Comment[]> {
    const url = `${this.config.baseUrl}/repos/${owner}/${repo}/issues/${number}/comments`;
    const response = await this.makeRequest(url);

    if (!Array.isArray(response)) {
      throw new GitHubApiErrorImpl(500, 'Invalid response format', 'UNKNOWN');
    }

    return response.map(commentData => this.dataMapper.mapComment(commentData));
  }

  public async getPullRequestReviews(owner: string, repo: string, number: number): Promise<Review[]> {
    const url = `${this.config.baseUrl}/repos/${owner}/${repo}/pulls/${number}/reviews`;
    const response = await this.makeRequest(url);

    if (!Array.isArray(response)) {
      throw new GitHubApiErrorImpl(500, 'Invalid response format', 'UNKNOWN');
    }

    return response.map(reviewData => this.dataMapper.mapReview(reviewData));
  }

  public async getRateLimit(): Promise<GitHubRateLimit> {
    const url = `${this.config.baseUrl}/rate_limit`;
    const response = await this.makeRequest(url);

    const rateData = response.rate || response;
    return {
      limit: rateData.limit,
      remaining: rateData.remaining,
      resetTime: new Date(rateData.reset * 1000),
      used: rateData.used || (rateData.limit - rateData.remaining),
    };
  }

  private async makeRequest(url: string): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        // Rate Limit 체크
        if (this.rateLimitManager.shouldWait()) {
          const waitTime = this.rateLimitManager.getWaitTime();
          throw new GitHubApiErrorImpl(
            429,
            'Rate limit exceeded',
            'RATE_LIMIT',
            waitTime
          );
        }

        const response = await this.fetchWithTimeout(url);

        // Rate Limit 헤더 업데이트
        this.updateRateLimitFromHeaders(response.headers);

        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw this.createErrorFromResponse(response.status, errorData, response.headers);
        }

        const data = await response.json();
        this.rateLimitManager.trackRequest();
        return data;

      } catch (error) {
        lastError = error as Error;

        // 재시도 불가능한 에러들
        if (error instanceof GitHubApiErrorImpl) {
          if (error.type === 'NOT_FOUND' || error.type === 'AUTH_ERROR' || error.type === 'VALIDATION_ERROR') {
            throw error;
          }

          if (error.type === 'RATE_LIMIT') {
            throw error;
          }
        }

        // 마지막 시도인 경우 에러 발생
        if (attempt === (this.config.maxRetries || 3)) {
          break;
        }

        // 재시도 대기
        const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    // 재시도 실패 시 마지막 에러 또는 네트워크 에러 발생
    if (lastError instanceof GitHubApiErrorImpl) {
      throw lastError;
    }

    throw new GitHubApiErrorImpl(
      500,
      `Network request failed after ${this.config.maxRetries} retries: ${lastError?.message}`,
      'NETWORK_ERROR'
    );
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': this.config.userAgent || 'GitHub-Analysis-Bot/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new GitHubApiErrorImpl(408, 'Request timeout', 'NETWORK_ERROR');
        }
        throw new GitHubApiErrorImpl(500, `Network error: ${error.message}`, 'NETWORK_ERROR');
      }

      throw new GitHubApiErrorImpl(500, 'Unknown network error', 'NETWORK_ERROR');
    }
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText || 'Unknown error' };
    }
  }

  private createErrorFromResponse(status: number, errorData: any, headers: Headers): GitHubApiErrorImpl {
    const message = errorData.message || `HTTP ${status} error`;
    const documentation = errorData.documentation_url;

    let type: GitHubApiError['type'];
    let retryAfter: number | undefined;

    switch (status) {
      case 401:
      case 403:
        if (message.toLowerCase().includes('rate limit')) {
          type = 'RATE_LIMIT';
          const resetHeader = headers.get('x-ratelimit-reset');
          if (resetHeader) {
            const resetTime = parseInt(resetHeader, 10) * 1000;
            retryAfter = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
          }
        } else {
          type = 'AUTH_ERROR';
        }
        break;
      case 404:
        type = 'NOT_FOUND';
        break;
      case 422:
        type = 'VALIDATION_ERROR';
        break;
      default:
        type = 'UNKNOWN';
    }

    return new GitHubApiErrorImpl(status, message, type, retryAfter, documentation);
  }

  private updateRateLimitFromHeaders(headers: Headers): void {
    const headerRecord: Record<string, string> = {};

    headers.forEach((value, key) => {
      headerRecord[key.toLowerCase()] = value;
    });

    this.rateLimitManager.updateFromHeaders(headerRecord);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}