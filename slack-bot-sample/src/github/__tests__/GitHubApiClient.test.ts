import { GitHubApiClient } from '../GitHubApiClient';
import { GitHubApiConfig, GitHubApiErrorImpl } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();

    const config: GitHubApiConfig = {
      token: 'test-token',
      baseUrl: 'https://api.github.com',
      timeout: 5000,
      maxRetries: 3,
    };

    client = new GitHubApiClient(config);
  });

  describe('Repository 조회', () => {
    test('유효한 Repository 조회 성공', async () => {
      const mockResponseData = {
        id: 12345,
        name: 'vscode',
        full_name: 'microsoft/vscode',
        description: 'Visual Studio Code',
        language: 'TypeScript',
        stargazers_count: 150000,
        forks_count: 25000,
        topics: ['editor', 'typescript'],
        created_at: '2015-09-03T19:15:13Z',
        updated_at: '2023-12-01T10:30:00Z',
        private: false,
        default_branch: 'main',
        size: 500000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-used': '1',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
        }),
        json: async () => mockResponseData,
      } as Response);

      const result = await client.getRepository('microsoft', 'vscode');

      expect(result.name).toBe('vscode');
      expect(result.fullName).toBe('microsoft/vscode');
      expect(result.language).toBe('TypeScript');
      expect(result.starCount).toBe(150000);
      expect(result.isPrivate).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/microsoft/vscode',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'token test-token',
            'Accept': 'application/vnd.github.v3+json',
          }),
        })
      );
    });

    test('존재하지 않는 Repository 404 에러', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({
          message: 'Not Found',
          documentation_url: 'https://docs.github.com/rest/reference/repos#get-a-repository',
        }),
      } as Response);

      await expect(client.getRepository('nonexistent', 'repo')).rejects.toThrow(GitHubApiErrorImpl);
      await expect(client.getRepository('nonexistent', 'repo')).rejects.toMatchObject({
        status: 404,
        type: 'NOT_FOUND',
        message: expect.stringContaining('Not Found'),
      });
    });

    test('Private Repository 접근 권한 없음 403 에러', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers(),
        json: async () => ({
          message: 'Must have admin rights to Repository.',
        }),
      } as Response);

      await expect(client.getRepository('private', 'repo')).rejects.toThrow(GitHubApiErrorImpl);
      await expect(client.getRepository('private', 'repo')).rejects.toMatchObject({
        status: 403,
        type: 'AUTH_ERROR',
      });
    });
  });

  describe('Issue 조회', () => {
    test('유효한 Issue 조회 성공', async () => {
      const mockIssueData = {
        id: 67890,
        number: 123,
        title: 'Test Issue',
        body: 'This is a test issue',
        state: 'open',
        labels: [
          { id: 1, name: 'bug', color: 'ff0000', description: 'Bug report' },
        ],
        assignees: [
          { id: 2, login: 'assignee', name: 'Test Assignee', email: null, avatar_url: 'url', type: 'User' },
        ],
        user: { id: 3, login: 'author', name: 'Issue Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/issues/123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'x-ratelimit-remaining': '4998',
        }),
        json: async () => mockIssueData,
      } as Response);

      const result = await client.getIssue('owner', 'repo', 123);

      expect(result.number).toBe(123);
      expect(result.title).toBe('Test Issue');
      expect(result.state).toBe('open');
      expect(result.labels).toHaveLength(1);
      expect(result.assignees).toHaveLength(1);
      expect(result.author.login).toBe('author');
    });

    test('닫힌 Issue 조회', async () => {
      const mockClosedIssue = {
        id: 67891,
        number: 124,
        title: 'Closed Issue',
        body: 'This issue was closed',
        state: 'closed',
        labels: [],
        assignees: [],
        user: { id: 3, login: 'author', name: 'Issue Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
        closed_at: '2023-01-03T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/124',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockClosedIssue,
      } as Response);

      const result = await client.getIssue('owner', 'repo', 124);

      expect(result.state).toBe('closed');
      expect(result.closedAt).toBeInstanceOf(Date);
    });

    test('존재하지 않는 Issue 404 에러', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({ message: 'Not Found' }),
      } as Response);

      await expect(client.getIssue('owner', 'repo', 999999)).rejects.toThrow(GitHubApiErrorImpl);
    });
  });

  describe('Pull Request 조회', () => {
    test('유효한 Pull Request 조회 성공', async () => {
      const mockPRData = {
        id: 78901,
        number: 456,
        title: 'Test PR',
        body: 'This is a test PR',
        state: 'open',
        labels: [],
        assignees: [],
        user: { id: 4, login: 'pr-author', name: 'PR Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/pull/456',
        head: { ref: 'feature-branch' },
        base: { ref: 'main' },
        commits: 5,
        additions: 100,
        deletions: 20,
        changed_files: 3,
        mergeable: true,
        merged: false,
        merged_at: null,
        merged_by: null,
        draft: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockPRData,
      } as Response);

      const result = await client.getPullRequest('owner', 'repo', 456);

      expect(result.number).toBe(456);
      expect(result.headBranch).toBe('feature-branch');
      expect(result.baseBranch).toBe('main');
      expect(result.commits).toBe(5);
      expect(result.additions).toBe(100);
      expect(result.deletions).toBe(20);
      expect(result.mergeable).toBe(true);
      expect(result.merged).toBe(false);
      expect(result.draft).toBe(false);
    });

    test('병합된 Pull Request 조회', async () => {
      const mockMergedPR = {
        id: 78902,
        number: 457,
        title: 'Merged PR',
        body: 'This PR was merged',
        state: 'closed',
        labels: [],
        assignees: [],
        user: { id: 4, login: 'pr-author', name: 'PR Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
        closed_at: '2023-01-04T00:00:00Z',
        html_url: 'https://github.com/owner/repo/pull/457',
        head: { ref: 'hotfix' },
        base: { ref: 'main' },
        commits: 2,
        additions: 30,
        deletions: 5,
        changed_files: 1,
        mergeable: null,
        merged: true,
        merged_at: '2023-01-04T00:00:00Z',
        merged_by: { id: 5, login: 'merger', name: 'Merger', email: null, avatar_url: 'url', type: 'User' },
        draft: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockMergedPR,
      } as Response);

      const result = await client.getPullRequest('owner', 'repo', 457);

      expect(result.merged).toBe(true);
      expect(result.mergedAt).toBeInstanceOf(Date);
      expect(result.mergedBy?.login).toBe('merger');
    });
  });

  describe('파일 내용 조회', () => {
    test('파일 내용 조회 성공', async () => {
      const mockFileData = {
        name: 'README.md',
        path: 'README.md',
        content: 'IyBUZXN0IFJlcG9zaXRvcnk=', // base64 encoded
        encoding: 'base64',
        size: 1024,
        sha: 'abc123',
        download_url: 'https://raw.githubusercontent.com/owner/repo/main/README.md',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockFileData,
      } as Response);

      const result = await client.getFileContent('owner', 'repo', 'README.md');

      expect(result.name).toBe('README.md');
      expect(result.encoding).toBe('base64');
      expect(result.content).toBe('IyBUZXN0IFJlcG9zaXRvcnk=');
      expect(result.size).toBe(1024);
    });

    test('특정 ref에서 파일 내용 조회', async () => {
      const mockFileData = {
        name: 'package.json',
        path: 'package.json',
        content: '{"name": "test"}',
        encoding: 'utf-8',
        size: 17,
        sha: 'def456',
        download_url: 'https://raw.githubusercontent.com/owner/repo/feature-branch/package.json',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockFileData,
      } as Response);

      const result = await client.getFileContent('owner', 'repo', 'package.json', 'feature-branch');

      expect(result.content).toBe('{"name": "test"}');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/package.json?ref=feature-branch',
        expect.any(Object)
      );
    });

    test('존재하지 않는 파일 404 에러', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({ message: 'Not Found' }),
      } as Response);

      await expect(client.getFileContent('owner', 'repo', 'nonexistent.txt')).rejects.toThrow(GitHubApiErrorImpl);
    });
  });

  describe('Pull Request 파일 변경사항 조회', () => {
    test('PR 파일 변경사항 조회 성공', async () => {
      const mockFilesData = [
        {
          filename: 'src/index.ts',
          status: 'modified',
          additions: 15,
          deletions: 5,
          changes: 20,
          patch: '@@ -1,3 +1,3 @@\n-old\n+new',
          blob_url: 'https://github.com/owner/repo/blob/abc/src/index.ts',
        },
        {
          filename: 'src/new.ts',
          status: 'added',
          additions: 50,
          deletions: 0,
          changes: 50,
          blob_url: 'https://github.com/owner/repo/blob/abc/src/new.ts',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockFilesData,
      } as Response);

      const result = await client.getPullRequestFiles('owner', 'repo', 456);

      expect(result).toHaveLength(2);
      expect(result[0]?.filename).toBe('src/index.ts');
      expect(result[0]?.status).toBe('modified');
      expect(result[0]?.patch).toBeDefined();
      expect(result[1]?.status).toBe('added');
    });
  });

  describe('Issue 댓글 조회', () => {
    test('Issue 댓글 조회 성공', async () => {
      const mockCommentsData = [
        {
          id: 111111,
          body: 'First comment',
          user: { id: 6, login: 'commenter1', name: 'Commenter 1', email: null, avatar_url: 'url', type: 'User' },
          created_at: '2023-01-05T00:00:00Z',
          updated_at: '2023-01-05T00:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/123#issuecomment-111111',
        },
        {
          id: 222222,
          body: 'Second comment',
          user: { id: 7, login: 'commenter2', name: 'Commenter 2', email: null, avatar_url: 'url', type: 'User' },
          created_at: '2023-01-06T00:00:00Z',
          updated_at: '2023-01-06T00:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/123#issuecomment-222222',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockCommentsData,
      } as Response);

      const result = await client.getIssueComments('owner', 'repo', 123);

      expect(result).toHaveLength(2);
      expect(result[0]?.body).toBe('First comment');
      expect(result[0]?.author.login).toBe('commenter1');
      expect(result[1]?.body).toBe('Second comment');
    });

    test('댓글이 없는 Issue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => [],
      } as Response);

      const result = await client.getIssueComments('owner', 'repo', 123);

      expect(result).toEqual([]);
    });
  });

  describe('Pull Request 리뷰 조회', () => {
    test('PR 리뷰 조회 성공', async () => {
      const mockReviewsData = [
        {
          id: 333333,
          body: 'Looks good!',
          user: { id: 8, login: 'reviewer1', name: 'Reviewer 1', email: null, avatar_url: 'url', type: 'User' },
          state: 'APPROVED',
          submitted_at: '2023-01-07T00:00:00Z',
          commit_id: 'abc123',
          html_url: 'https://github.com/owner/repo/pull/456#pullrequestreview-333333',
        },
        {
          id: 444444,
          body: 'Please fix this',
          user: { id: 9, login: 'reviewer2', name: 'Reviewer 2', email: null, avatar_url: 'url', type: 'User' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2023-01-08T00:00:00Z',
          commit_id: 'def456',
          html_url: 'https://github.com/owner/repo/pull/456#pullrequestreview-444444',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockReviewsData,
      } as Response);

      const result = await client.getPullRequestReviews('owner', 'repo', 456);

      expect(result).toHaveLength(2);
      expect(result[0]?.state).toBe('approved');
      expect(result[0]?.author.login).toBe('reviewer1');
      expect(result[1]?.state).toBe('changes_requested');
    });
  });

  describe('Rate Limit 조회', () => {
    test('Rate Limit 정보 조회 성공', async () => {
      const mockRateLimitData = {
        rate: {
          limit: 5000,
          remaining: 4500,
          reset: Math.floor(Date.now() / 1000) + 3600,
          used: 500,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockRateLimitData,
      } as Response);

      const result = await client.getRateLimit();

      expect(result.limit).toBe(5000);
      expect(result.remaining).toBe(4500);
      expect(result.used).toBe(500);
      expect(result.resetTime).toBeInstanceOf(Date);
    });
  });

  describe('에러 처리', () => {
    test('Rate Limit 초과 403 에러', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
        }),
        json: async () => ({
          message: 'API rate limit exceeded',
        }),
      } as Response);

      await expect(client.getRepository('owner', 'repo')).rejects.toMatchObject({
        status: 403,
        type: 'RATE_LIMIT',
        retryAfter: expect.any(Number),
      });
    });

    test('네트워크 연결 실패', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getRepository('owner', 'repo')).rejects.toMatchObject({
        type: 'NETWORK_ERROR',
        message: expect.stringContaining('Network error'),
      });
    });

    test('타임아웃 에러', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({}),
          } as Response), 10000); // 10초 지연
        })
      );

      // 짧은 타임아웃으로 클라이언트 재생성
      const shortTimeoutClient = new GitHubApiClient({
        token: 'test-token',
        timeout: 100, // 100ms
      });

      await expect(shortTimeoutClient.getRepository('owner', 'repo')).rejects.toMatchObject({
        type: 'NETWORK_ERROR',
        message: expect.stringContaining('timeout'),
      });
    });

    test('잘못된 JSON 응답', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      await expect(client.getRepository('owner', 'repo')).rejects.toMatchObject({
        type: 'UNKNOWN',
        message: expect.stringContaining('Invalid JSON'),
      });
    });
  });

  describe('재시도 로직', () => {
    test('일시적 서버 오류 시 자동 재시도', async () => {
      // 첫 번째 요청은 500 에러
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({ message: 'Internal Server Error' }),
      } as Response);

      // 두 번째 요청은 성공
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 1,
          name: 'repo',
          full_name: 'owner/repo',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          private: false,
          default_branch: 'main',
        }),
      } as Response);

      const result = await client.getRepository('owner', 'repo');

      expect(result.name).toBe('repo');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('최대 재시도 횟수 초과 시 에러', async () => {
      // 모든 요청이 500 에러
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({ message: 'Internal Server Error' }),
      } as Response);

      await expect(client.getRepository('owner', 'repo')).rejects.toMatchObject({
        status: 500,
        type: 'UNKNOWN',
      });

      // maxRetries + 1 번 호출되어야 함 (최초 1회 + 재시도 3회)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});