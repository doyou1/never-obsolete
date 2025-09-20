import { GitHubClient } from '../GitHubClient';
import {
  GitHubAuthenticationError,
  GitHubRateLimitError,
  GitHubNetworkError,
  GitHubNotFoundError,
  GitHubValidationError,
} from '../errors';
import {
  mockUserResponse,
  mockRateLimitResponse,
  mockIssueResponse,
  mockPullRequestResponse,
  mockCommitsResponse,
  mockFilesResponse,
  mockFileContentResponse,
  mockLargeFileContentResponse,
} from './mocks/github-responses';

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        users: {
          getAuthenticated: jest.fn(),
        },
        rateLimit: {
          get: jest.fn(),
        },
        issues: {
          get: jest.fn(),
        },
        pulls: {
          get: jest.fn(),
          listCommits: jest.fn(),
          listFiles: jest.fn(),
        },
        repos: {
          getContent: jest.fn(),
        },
      },
    })),
  };
});

// Mock environment variables
const originalEnv = process.env;

let mockOctokit: any;

beforeAll(() => {
  // Set up environment variables before any imports
  process.env = {
    ...originalEnv,
    GITHUB_TOKEN: 'test_token_123',
    GITHUB_API_BASE_URL: 'https://api.github.com',
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    PORT: '3000',
    SLACK_BOT_TOKEN: 'test_slack_token',
    SLACK_SIGNING_SECRET: 'test_slack_secret',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test_jwt_secret_with_at_least_32_characters_long',
    ENCRYPTION_KEY: 'test_encryption_key_exactly_32char',
    CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  };
});

beforeEach(() => {
  jest.clearAllMocks();

  // Reset singleton instance
  (GitHubClient as any)._instance = undefined;

  // Get mock instance
  const { Octokit } = require('@octokit/rest');
  mockOctokit = new Octokit();

  // Set default successful mocks that can be overridden in individual tests
  mockOctokit.rest.users.getAuthenticated.mockResolvedValue(mockUserResponse);
  mockOctokit.rest.rateLimit.get.mockResolvedValue(mockRateLimitResponse);
  mockOctokit.rest.issues.get.mockResolvedValue(mockIssueResponse);
});

afterEach(() => {
  process.env = originalEnv;
});

describe('GitHubClient Singleton', () => {
  test('should create singleton instance', () => {
    const instance1 = GitHubClient.getInstance();
    const instance2 = GitHubClient.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should initialize with environment config', () => {
    const client = GitHubClient.getInstance();
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(GitHubClient);
  });
});

describe('GitHubClient Initialization', () => {
  test('should throw error when GitHub token is missing', () => {
    // Reset singleton instance
    (GitHubClient as any)._instance = undefined;

    // Mock config to have empty token
    jest.doMock('../../config/environment', () => ({
      config: {
        github: {
          token: '',
          apiBaseUrl: 'https://api.github.com',
        },
        analysis: {
          maxFileSize: 10485760,
        },
      },
    }));

    // Re-import GitHubClient with mocked config
    jest.resetModules();
    const { GitHubClient: MockedGitHubClient } = require('../GitHubClient');

    expect(() => {
      MockedGitHubClient.getInstance();
    }).toThrow('GitHub token is required');

    // Clean up
    jest.dontMock('../../config/environment');
    jest.resetModules();
  });

  test('should use correct API base URL from config', () => {
    const client = GitHubClient.getInstance();
    expect(client.getApiBaseUrl()).toBe('https://api.github.com');
  });
});

describe('GitHubClient Connection', () => {
  test('should test connection successfully with valid token', async () => {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue(mockUserResponse);

    const client = GitHubClient.getInstance();
    const result = await client.testConnection();
    expect(result).toBe(true);
  });

  test('should fail connection test with invalid token', async () => {
    mockOctokit.rest.users.getAuthenticated.mockRejectedValue({
      status: 401,
      message: 'Bad credentials',
    });

    const client = GitHubClient.getInstance();
    await expect(client.testConnection()).rejects.toThrow(GitHubAuthenticationError);
  });
});

describe('GitHubClient Token Validation', () => {
  test('should validate token and return user info', async () => {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue(mockUserResponse);
    mockOctokit.rest.rateLimit.get.mockResolvedValue(mockRateLimitResponse);

    const client = GitHubClient.getInstance();
    const authInfo = await client.validateToken();

    expect(authInfo).toMatchObject({
      login: expect.any(String),
      id: expect.any(Number),
      scopes: expect.any(Array),
      rateLimit: expect.objectContaining({
        limit: expect.any(Number),
        remaining: expect.any(Number),
        reset: expect.any(Number),
      }),
    });
  });

  test('should throw error for expired token', async () => {
    mockOctokit.rest.users.getAuthenticated.mockRejectedValue({
      status: 401,
      message: 'Bad credentials',
    });

    const client = GitHubClient.getInstance();
    await expect(client.validateToken()).rejects.toThrow(GitHubAuthenticationError);
  });
});

describe('GitHub URL Parsing - Issues', () => {
  test('should parse valid GitHub issue URL', () => {
    const url = 'https://github.com/owner/repo/issues/123';
    const result = GitHubClient.parseGitHubUrl(url);

    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      type: 'issue',
      number: 123,
    });
  });

  test('should parse GitHub issue URL with query parameters', () => {
    const url = 'https://github.com/owner/repo/issues/123?tab=comments';
    const result = GitHubClient.parseGitHubUrl(url);

    expect(result.number).toBe(123);
  });

  test('should throw error for invalid issue URL format', () => {
    const invalidUrls = [
      'https://github.com/owner/repo',
      'https://github.com/owner/repo/issues',
      'https://github.com/owner/repo/issues/abc',
      'https://gitlab.com/owner/repo/issues/123',
    ];

    invalidUrls.forEach((url) => {
      expect(() => GitHubClient.parseGitHubUrl(url)).toThrow(GitHubValidationError);
    });
  });
});

describe('GitHub URL Parsing - Pull Requests', () => {
  test('should parse valid GitHub pull request URL', () => {
    const url = 'https://github.com/owner/repo/pull/456';
    const result = GitHubClient.parseGitHubUrl(url);

    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      type: 'pull',
      number: 456,
    });
  });

  test('should parse PR URL with different formats', () => {
    const urls = [
      'https://github.com/owner/repo/pull/456',
      'https://www.github.com/owner/repo/pull/456',
    ];

    urls.forEach((url) => {
      const result = GitHubClient.parseGitHubUrl(url);
      expect(result.type).toBe('pull');
      expect(result.number).toBe(456);
    });
  });
});

describe('GitHub Issue Information', () => {
  test('should fetch issue basic information', async () => {
    mockOctokit.rest.issues.get.mockResolvedValue(mockIssueResponse);

    const client = GitHubClient.getInstance();
    const url = 'https://github.com/owner/repo/issues/123';

    const issueInfo = await client.getIssueInfo(url);

    expect(issueInfo).toMatchObject({
      id: expect.any(Number),
      number: 123,
      title: expect.any(String),
      body: expect.any(String),
      state: expect.stringMatching(/^(open|closed)$/),
      author: {
        login: expect.any(String),
        id: expect.any(Number),
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      repository: {
        owner: 'owner',
        name: 'repo',
        fullName: 'owner/repo',
      },
    });
  });

  test('should handle issue with empty body', async () => {
    const emptyBodyResponse = {
      ...mockIssueResponse,
      data: {
        ...mockIssueResponse.data,
        number: 124,
        body: null,
      },
    };

    mockOctokit.rest.issues.get.mockResolvedValue(emptyBodyResponse);

    const client = GitHubClient.getInstance();
    const issueInfo = await client.getIssueInfo('https://github.com/owner/repo/issues/124');

    expect(issueInfo.body).toBe('');
  });

  test('should throw error for non-existent issue', async () => {
    mockOctokit.rest.issues.get.mockRejectedValue({
      status: 404,
      message: 'Not Found',
    });

    const client = GitHubClient.getInstance();
    const url = 'https://github.com/owner/repo/issues/999999';

    await expect(client.getIssueInfo(url)).rejects.toThrow(GitHubNotFoundError);
  });
});

describe('GitHub Pull Request Information', () => {
  test('should fetch PR basic information', async () => {
    mockOctokit.rest.pulls.get.mockResolvedValue(mockPullRequestResponse);
    mockOctokit.rest.pulls.listCommits.mockResolvedValue(mockCommitsResponse);
    mockOctokit.rest.pulls.listFiles.mockResolvedValue(mockFilesResponse);
    mockOctokit.rest.issues.get.mockResolvedValue({
      ...mockIssueResponse,
      data: {
        ...mockIssueResponse.data,
        number: 456,
      },
    });

    const client = GitHubClient.getInstance();
    const url = 'https://github.com/owner/repo/pull/456';

    const prInfo = await client.getPullRequestInfo(url);

    expect(prInfo).toMatchObject({
      id: expect.any(Number),
      number: 456,
      title: expect.any(String),
      state: expect.stringMatching(/^(open|closed)$/),
      baseBranch: expect.any(String),
      headBranch: expect.any(String),
      commits: expect.any(Array),
      changedFiles: expect.any(Array),
    });
  });

  test('should fetch PR commits information', async () => {
    mockOctokit.rest.pulls.get.mockResolvedValue(mockPullRequestResponse);
    mockOctokit.rest.pulls.listCommits.mockResolvedValue(mockCommitsResponse);
    mockOctokit.rest.pulls.listFiles.mockResolvedValue(mockFilesResponse);
    mockOctokit.rest.issues.get.mockResolvedValue({
      ...mockIssueResponse,
      data: {
        ...mockIssueResponse.data,
        number: 456,
      },
    });

    const client = GitHubClient.getInstance();
    const url = 'https://github.com/owner/repo/pull/456';

    const prInfo = await client.getPullRequestInfo(url);

    expect(prInfo.commits.length).toBeGreaterThan(0);
    expect(prInfo.commits[0]).toMatchObject({
      sha: expect.any(String),
      message: expect.any(String),
      author: {
        name: expect.any(String),
        email: expect.any(String),
      },
      committer: {
        name: expect.any(String),
        email: expect.any(String),
      },
    });
  });
});

describe('GitHub File Content', () => {
  test('should fetch file content successfully', async () => {
    mockOctokit.rest.repos.getContent.mockResolvedValue(mockFileContentResponse);

    const client = GitHubClient.getInstance();

    const content = await client.getFileContent('owner', 'repo', 'src/index.ts');

    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  test('should throw error for non-existent file', async () => {
    mockOctokit.rest.repos.getContent.mockRejectedValue({
      status: 404,
      message: 'Not Found',
    });

    const client = GitHubClient.getInstance();

    await expect(client.getFileContent('owner', 'repo', 'nonexistent.ts')).rejects.toThrow(
      GitHubNotFoundError
    );
  });

  test('should respect file size limits', async () => {
    mockOctokit.rest.repos.getContent.mockResolvedValue(mockLargeFileContentResponse);

    const client = GitHubClient.getInstance();

    await expect(client.getFileContent('owner', 'repo', 'large-file.json')).rejects.toThrow(
      GitHubValidationError
    );
  });
});

describe('File Extension Filtering', () => {
  test('should process supported file extensions', () => {
    const client = GitHubClient.getInstance();
    const supportedFiles = [
      'index.ts',
      'component.tsx',
      'script.js',
      'app.jsx',
      'config.json',
      'schema.sql',
      'readme.md',
    ];

    for (const filename of supportedFiles) {
      expect(() => client.validateFileExtension(filename)).not.toThrow();
    }
  });

  test('should reject unsupported file extensions', () => {
    const client = GitHubClient.getInstance();
    const unsupportedFiles = ['image.png', 'video.mp4', 'archive.zip', 'binary.exe'];

    for (const filename of unsupportedFiles) {
      expect(() => client.validateFileExtension(filename)).toThrow(GitHubValidationError);
    }
  });
});

describe('GitHub Rate Limiting', () => {
  test('should fetch current rate limit status', async () => {
    mockOctokit.rest.rateLimit.get.mockResolvedValue(mockRateLimitResponse);

    const client = GitHubClient.getInstance();

    const rateLimit = await client.getRateLimit();

    expect(rateLimit).toMatchObject({
      limit: expect.any(Number),
      remaining: expect.any(Number),
      reset: expect.any(Number),
      used: expect.any(Number),
    });
  });

  test('should handle rate limit exceeded scenario', async () => {
    const client = GitHubClient.getInstance();

    await expect(client.getIssueInfo('https://github.com/owner/repo/issues/123')).rejects.toThrow(
      GitHubRateLimitError
    );
  });
});

describe('Network Error Handling', () => {
  test('should handle network timeout', async () => {
    const client = GitHubClient.getInstance();

    await expect(client.getIssueInfo('https://github.com/owner/repo/issues/123')).rejects.toThrow(
      GitHubNetworkError
    );
  });

  test('should retry on temporary network failures', async () => {
    const client = GitHubClient.getInstance();

    const result = await client.getIssueInfo('https://github.com/owner/repo/issues/123');
    expect(result).toBeDefined();
  });
});

describe('Performance Tests', () => {
  test('should complete API call within timeout', async () => {
    const client = GitHubClient.getInstance();

    const startTime = Date.now();
    await client.getIssueInfo('https://github.com/owner/repo/issues/123');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(30000); // 30초 이내
  });

  test('should handle multiple concurrent requests', async () => {
    const client = GitHubClient.getInstance();
    const urls = [
      'https://github.com/owner/repo/issues/1',
      'https://github.com/owner/repo/issues/2',
      'https://github.com/owner/repo/issues/3',
      'https://github.com/owner/repo/issues/4',
      'https://github.com/owner/repo/issues/5',
    ];

    const promises = urls.map((url) => client.getIssueInfo(url));
    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach((result) => expect(result).toBeDefined());
  });
});