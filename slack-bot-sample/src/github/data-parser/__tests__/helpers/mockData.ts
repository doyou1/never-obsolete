import type { IssueInfo, PullRequestInfo, FileInfo, UserInfo, RepositoryInfo, CommitInfo } from '../../../types';

export function createMockUser(overrides?: Partial<UserInfo>): UserInfo {
  return {
    login: 'testuser',
    id: 987654321,
    avatar_url: 'https://github.com/testuser.png',
    html_url: 'https://github.com/testuser',
    ...overrides,
  };
}

export function createMockRepository(overrides?: Partial<RepositoryInfo>): RepositoryInfo {
  return {
    owner: 'testowner',
    name: 'testrepo',
    fullName: 'testowner/testrepo',
    description: 'Test repository',
    private: false,
    html_url: 'https://github.com/testowner/testrepo',
    ...overrides,
  };
}

export function createMockCommit(messagePrefix = 'Test'): CommitInfo {
  return {
    sha: 'abc123def456',
    message: `${messagePrefix} commit`,
    author: {
      name: 'Test User',
      email: 'test@example.com',
      date: '2023-01-01T00:00:00Z',
    },
    committer: {
      name: 'Test User',
      email: 'test@example.com',
      date: '2023-01-01T00:00:00Z',
    },
    url: 'https://github.com/owner/repo/commit/abc123def456',
  };
}

export function createMockFile(
  filename: string,
  status: FileInfo['status'],
  size: number
): FileInfo {
  return {
    filename,
    status,
    changes: size,
    additions: Math.floor(size / 2),
    deletions: Math.floor(size / 2),
    size,
    patch: '@@ -1,1 +1,1 @@\n-old\n+new',
  };
}

export function createMockIssue(overrides?: Partial<IssueInfo>): IssueInfo {
  return {
    id: 123456789,
    number: 123,
    title: 'Test Issue',
    body: 'Test issue description',
    state: 'open',
    author: createMockUser(),
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    repository: createMockRepository(),
    labels: ['bug'],
    assignees: [],
    ...overrides,
  };
}

export function createMockPR(overrides?: Partial<PullRequestInfo>): PullRequestInfo {
  return {
    ...createMockIssue(),
    baseBranch: 'main',
    headBranch: 'feature',
    commits: [createMockCommit()],
    changedFiles: [createMockFile('test.ts', 'modified', 1024)],
    mergeable: true,
    merged: false,
    mergedAt: null,
    ...overrides,
  };
}

// Mock data validation test
describe('Mock Data Helpers', () => {
  test('should create valid mock user', () => {
    const user = createMockUser();
    expect(user.login).toBe('testuser');
    expect(user.id).toBe(987654321);
  });
});