import { Octokit } from '@octokit/rest';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import {
  GitHubAuthenticationError,
  GitHubNetworkError,
  GitHubNotFoundError,
  GitHubValidationError,
} from './errors';
import type {
  IssueInfo,
  PullRequestInfo,
  RateLimitInfo,
  AuthInfo,
  GitHubUrlInfo,
  CommitInfo,
  FileInfo,
} from './types';

export class GitHubClient {
  private static _instance: GitHubClient;
  private octokit: Octokit;
  private readonly supportedExtensions = ['.ts', '.js', '.tsx', '.jsx', '.json', '.sql', '.md'];
  private readonly maxFileSize = config.analysis.maxFileSize;

  private constructor() {
    if (!config.github.token) {
      throw new Error('GitHub token is required');
    }

    this.octokit = new Octokit({
      auth: config.github.token,
      baseUrl: config.github.apiBaseUrl,
      request: {
        timeout: 30000,
      },
    });
  }

  public static getInstance(): GitHubClient {
    if (!GitHubClient._instance) {
      GitHubClient._instance = new GitHubClient();
    }
    return GitHubClient._instance;
  }

  public getApiBaseUrl(): string {
    return config.github.apiBaseUrl;
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.octokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      logger.error('GitHub connection test failed:', error);
      throw new GitHubAuthenticationError('Failed to connect to GitHub API');
    }
  }

  public async validateToken(): Promise<AuthInfo> {
    try {
      const [userResponse, rateLimitResponse] = await Promise.all([
        this.octokit.rest.users.getAuthenticated(),
        this.octokit.rest.rateLimit.get(),
      ]);

      const user = userResponse.data;
      const rateLimit = rateLimitResponse.data.rate;

      return {
        login: user.login,
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        scopes: [], // Will be populated from headers if available
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
          used: rateLimit.used,
          resetDate: new Date(rateLimit.reset * 1000),
        },
      };
    } catch (error: any) {
      logger.error('GitHub token validation failed:', error);
      throw new GitHubAuthenticationError('Invalid GitHub token');
    }
  }

  public static parseGitHubUrl(url: string): GitHubUrlInfo {
    const githubUrlRegex =
      /^https?:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)/;
    const match = url.match(githubUrlRegex);

    if (!match) {
      throw new GitHubValidationError('Invalid GitHub URL format');
    }

    const [, , owner, repo, type, number] = match;

    if (!owner || !repo || !type || !number) {
      throw new GitHubValidationError('Invalid GitHub URL format');
    }

    return {
      owner,
      repo,
      type: type === 'pull' ? 'pull' : 'issue',
      number: parseInt(number, 10),
    };
  }

  public async getIssueInfo(url: string): Promise<IssueInfo> {
    try {
      const { owner, repo, number } = GitHubClient.parseGitHubUrl(url);

      const response = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: number,
      });

      const issue = response.data;

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state as 'open' | 'closed',
        author: {
          login: issue.user?.login || '',
          id: issue.user?.id || 0,
          avatar_url: issue.user?.avatar_url,
          html_url: issue.user?.html_url,
        },
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        repository: {
          owner,
          name: repo,
          fullName: `${owner}/${repo}`,
          description: '',
          private: false,
          html_url: `https://github.com/${owner}/${repo}`,
        },
        labels:
          issue.labels?.map(label => (typeof label === 'string' ? label : label.name || '')) || [],
        assignees:
          issue.assignees?.map(assignee => ({
            login: assignee?.login || '',
            id: assignee?.id || 0,
            avatar_url: assignee?.avatar_url,
            html_url: assignee?.html_url,
          })) || [],
      };
    } catch (error: any) {
      logger.error('Failed to get issue info:', error);
      if (error.status === 404) {
        throw new GitHubNotFoundError('Issue not found');
      }
      throw new GitHubNetworkError('Failed to fetch issue information');
    }
  }

  public async getPullRequestInfo(url: string): Promise<PullRequestInfo> {
    try {
      const { owner, repo, number } = GitHubClient.parseGitHubUrl(url);

      const [prResponse, commitsResponse, filesResponse] = await Promise.all([
        this.octokit.rest.pulls.get({ owner, repo, pull_number: number }),
        this.octokit.rest.pulls.listCommits({ owner, repo, pull_number: number }),
        this.octokit.rest.pulls.listFiles({ owner, repo, pull_number: number }),
      ]);

      const pr = prResponse.data;
      const commits = commitsResponse.data;
      const files = filesResponse.data;

      const issueInfo = await this.getIssueInfo(url);

      return {
        ...issueInfo,
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        mergeable: pr.mergeable,
        merged: pr.merged,
        mergedAt: pr.merged_at,
        commits: commits.map(
          (commit): CommitInfo => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author?.name || '',
              email: commit.commit.author?.email || '',
              date: commit.commit.author?.date || '',
            },
            committer: {
              name: commit.commit.committer?.name || '',
              email: commit.commit.committer?.email || '',
              date: commit.commit.committer?.date || '',
            },
            url: commit.html_url || '',
          }),
        ),
        changedFiles: files.map(
          (file): FileInfo => ({
            filename: file.filename,
            status: file.status as FileInfo['status'],
            changes: file.changes,
            additions: file.additions,
            deletions: file.deletions,
            size: file.changes,
            patch: file.patch,
          }),
        ),
      };
    } catch (error: any) {
      logger.error('Failed to get pull request info:', error);
      if (error.status === 404) {
        throw new GitHubNotFoundError('Pull request not found');
      }
      throw new GitHubNetworkError('Failed to fetch pull request information');
    }
  }

  public async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string,
  ): Promise<string> {
    try {
      const params: any = { owner, repo, path };
      if (ref) {
        params.ref = ref;
      }

      const response = await this.octokit.rest.repos.getContent(params);

      const data = response.data;

      if (Array.isArray(data) || data.type !== 'file') {
        throw new GitHubValidationError('Path is not a file');
      }

      if (data.size > this.maxFileSize) {
        throw new GitHubValidationError(`File size exceeds limit: ${data.size} bytes`);
      }

      if (!data.content) {
        throw new GitHubValidationError('File content not available');
      }

      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error: any) {
      logger.error('Failed to get file content:', error);
      if (error.status === 404) {
        throw new GitHubNotFoundError('File not found');
      }
      if (error instanceof GitHubValidationError) {
        throw error;
      }
      throw new GitHubNetworkError('Failed to fetch file content');
    }
  }

  public validateFileExtension(filename: string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!this.supportedExtensions.includes(ext)) {
      throw new GitHubValidationError(`Unsupported file extension: ${ext}`);
    }
    return true;
  }

  public async getRateLimit(): Promise<RateLimitInfo> {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      const rateLimit = response.data.rate;

      return {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        used: rateLimit.used,
        resetDate: new Date(rateLimit.reset * 1000),
      };
    } catch (error) {
      logger.error('Failed to get rate limit:', error);
      throw new GitHubNetworkError('Failed to fetch rate limit information');
    }
  }
}
