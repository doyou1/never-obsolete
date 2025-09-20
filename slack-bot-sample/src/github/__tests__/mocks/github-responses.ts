// Mock GitHub API responses for testing

export const mockUserResponse = {
  data: {
    login: 'testuser',
    id: 123456,
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/123456',
    html_url: 'https://github.com/testuser',
  },
};

export const mockRateLimitResponse = {
  data: {
    rate: {
      limit: 5000,
      remaining: 4999,
      reset: Math.floor(Date.now() / 1000) + 3600,
      used: 1,
    },
  },
};

export const mockIssueResponse = {
  data: {
    id: 123456789,
    number: 123,
    title: 'Test Issue',
    body: 'This is a test issue',
    state: 'open',
    user: {
      login: 'testuser',
      id: 987654321,
      avatar_url: 'https://avatars.githubusercontent.com/u/987654321',
      html_url: 'https://github.com/testuser',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    labels: [
      { name: 'bug' },
      { name: 'high-priority' },
    ],
    assignees: [
      {
        login: 'assignee1',
        id: 111111,
        avatar_url: 'https://avatars.githubusercontent.com/u/111111',
        html_url: 'https://github.com/assignee1',
      },
    ],
  },
};

export const mockPullRequestResponse = {
  data: {
    id: 234567890,
    number: 456,
    title: 'Test Pull Request',
    body: 'This is a test pull request',
    state: 'open',
    user: {
      login: 'testuser',
      id: 987654321,
      avatar_url: 'https://avatars.githubusercontent.com/u/987654321',
      html_url: 'https://github.com/testuser',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    base: {
      ref: 'main',
    },
    head: {
      ref: 'feature-branch',
    },
    mergeable: true,
    merged: false,
    merged_at: null,
    labels: [],
    assignees: [],
  },
};

export const mockCommitsResponse = {
  data: [
    {
      sha: 'abc123def456',
      commit: {
        message: 'Initial commit',
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
      },
      html_url: 'https://github.com/owner/repo/commit/abc123def456',
    },
  ],
};

export const mockFilesResponse = {
  data: [
    {
      filename: 'src/index.ts',
      status: 'modified',
      changes: 10,
      additions: 5,
      deletions: 5,
      patch: '@@ -1,3 +1,3 @@\n-console.log("old");\n+console.log("new");',
    },
    {
      filename: 'README.md',
      status: 'modified',
      changes: 2,
      additions: 1,
      deletions: 1,
      patch: '@@ -1,1 +1,1 @@\n-# Old Title\n+# New Title',
    },
  ],
};

export const mockFileContentResponse = {
  data: {
    type: 'file',
    size: 100,
    content: Buffer.from('console.log("Hello, World!");').toString('base64'),
  },
};

export const mockLargeFileContentResponse = {
  data: {
    type: 'file',
    size: 999999999, // Exceeds limit
    content: Buffer.from('Large file content').toString('base64'),
  },
};