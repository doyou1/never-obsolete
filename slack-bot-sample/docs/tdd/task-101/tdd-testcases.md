# TASK-101: GitHub API 클라이언트 구현 - 테스트 케이스

## 개요

이 문서는 GitHub API 클라이언트 구현을 위한 상세한 테스트 케이스를 정의합니다.
TDD (Test-Driven Development) 방식에 따라 구현 전에 모든 테스트 케이스를 먼저 작성합니다.

## 테스트 구조

### 파일 구조
```
src/
├── github/
│   ├── GitHubClient.ts          # 메인 구현 파일
│   ├── types.ts                 # 타입 정의
│   ├── errors.ts               # 에러 클래스들
│   └── __tests__/
│       ├── GitHubClient.test.ts # 단위 테스트
│       ├── mocks/              # Mock 데이터
│       └── fixtures/           # 테스트 픽스처
```

## 1. 단위 테스트 케이스

### 1.1 GitHubClient 클래스 생성 및 싱글톤 테스트

#### Test Case 1.1.1: 싱글톤 인스턴스 생성
```typescript
describe('GitHubClient Singleton', () => {
  test('should create singleton instance', () => {
    const instance1 = GitHubClient.getInstance();
    const instance2 = GitHubClient.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should initialize with environment config', () => {
    const client = GitHubClient.getInstance();
    expect(client).toBeDefined();
    // 내부 octokit 인스턴스가 올바르게 설정되었는지 확인
  });
});
```

#### Test Case 1.1.2: 초기화 검증
```typescript
describe('GitHubClient Initialization', () => {
  test('should throw error when GitHub token is missing', () => {
    // 환경 변수에서 GITHUB_TOKEN 제거
    delete process.env.GITHUB_TOKEN;

    expect(() => {
      GitHubClient.getInstance();
    }).toThrow('GitHub token is required');
  });

  test('should use correct API base URL from config', () => {
    const client = GitHubClient.getInstance();
    // baseUrl이 config.github.apiBaseUrl과 일치하는지 확인
  });
});
```

### 1.2 연결 및 인증 테스트

#### Test Case 1.2.1: 연결 테스트
```typescript
describe('GitHubClient Connection', () => {
  test('should test connection successfully with valid token', async () => {
    const client = GitHubClient.getInstance();
    const result = await client.testConnection();
    expect(result).toBe(true);
  });

  test('should fail connection test with invalid token', async () => {
    // Mock invalid token
    const client = GitHubClient.getInstance();
    await expect(client.testConnection()).rejects.toThrow(GitHubAuthenticationError);
  });
});
```

#### Test Case 1.2.2: 토큰 검증
```typescript
describe('GitHubClient Token Validation', () => {
  test('should validate token and return user info', async () => {
    const client = GitHubClient.getInstance();
    const authInfo = await client.validateToken();

    expect(authInfo).toMatchObject({
      login: expect.any(String),
      id: expect.any(Number),
      scopes: expect.any(Array),
      rateLimit: expect.objectContaining({
        limit: expect.any(Number),
        remaining: expect.any(Number),
        reset: expect.any(Number)
      })
    });
  });

  test('should throw error for expired token', async () => {
    // Mock expired token response
    const client = GitHubClient.getInstance();
    await expect(client.validateToken()).rejects.toThrow(GitHubAuthenticationError);
  });
});
```

### 1.3 URL 파싱 테스트

#### Test Case 1.3.1: GitHub Issue URL 파싱
```typescript
describe('GitHub URL Parsing - Issues', () => {
  test('should parse valid GitHub issue URL', () => {
    const url = 'https://github.com/owner/repo/issues/123';
    const result = GitHubClient.parseGitHubUrl(url);

    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      type: 'issue',
      number: 123
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
      'https://gitlab.com/owner/repo/issues/123'
    ];

    invalidUrls.forEach(url => {
      expect(() => GitHubClient.parseGitHubUrl(url))
        .toThrow(GitHubValidationError);
    });
  });
});
```

#### Test Case 1.3.2: GitHub PR URL 파싱
```typescript
describe('GitHub URL Parsing - Pull Requests', () => {
  test('should parse valid GitHub pull request URL', () => {
    const url = 'https://github.com/owner/repo/pull/456';
    const result = GitHubClient.parseGitHubUrl(url);

    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      type: 'pull',
      number: 456
    });
  });

  test('should parse PR URL with different formats', () => {
    const urls = [
      'https://github.com/owner/repo/pull/456',
      'https://github.com/owner/repo/pulls/456',
      'https://www.github.com/owner/repo/pull/456'
    ];

    urls.forEach(url => {
      const result = GitHubClient.parseGitHubUrl(url);
      expect(result.type).toBe('pull');
      expect(result.number).toBe(456);
    });
  });
});
```

### 1.4 Issue 정보 수집 테스트

#### Test Case 1.4.1: Issue 기본 정보 수집
```typescript
describe('GitHub Issue Information', () => {
  test('should fetch issue basic information', async () => {
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
        id: expect.any(Number)
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      repository: {
        owner: 'owner',
        name: 'repo',
        fullName: 'owner/repo'
      }
    });
  });

  test('should handle issue with empty body', async () => {
    const client = GitHubClient.getInstance();
    // Mock issue with null/empty body
    const issueInfo = await client.getIssueInfo('https://github.com/owner/repo/issues/124');

    expect(issueInfo.body).toBe('');
  });

  test('should throw error for non-existent issue', async () => {
    const client = GitHubClient.getInstance();
    const url = 'https://github.com/owner/repo/issues/999999';

    await expect(client.getIssueInfo(url)).rejects.toThrow(GitHubNotFoundError);
  });
});
```

### 1.5 Pull Request 정보 수집 테스트

#### Test Case 1.5.1: PR 기본 정보 수집
```typescript
describe('GitHub Pull Request Information', () => {
  test('should fetch PR basic information', async () => {
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
      changedFiles: expect.any(Array)
    });
  });

  test('should fetch PR commits information', async () => {
    const client = GitHubClient.getInstance();
    const url = 'https://github.com/owner/repo/pull/456';

    const prInfo = await client.getPullRequestInfo(url);

    expect(prInfo.commits.length).toBeGreaterThan(0);
    expect(prInfo.commits[0]).toMatchObject({
      sha: expect.any(String),
      message: expect.any(String),
      author: {
        name: expect.any(String),
        email: expect.any(String)
      },
      date: expect.any(String)
    });
  });

  test('should fetch PR changed files', async () => {
    const client = GitHubClient.getInstance();
    const url = 'https://github.com/owner/repo/pull/456';

    const prInfo = await client.getPullRequestInfo(url);

    expect(prInfo.changedFiles.length).toBeGreaterThan(0);
    expect(prInfo.changedFiles[0]).toMatchObject({
      filename: expect.any(String),
      status: expect.stringMatching(/^(added|modified|removed)$/),
      changes: expect.any(Number),
      additions: expect.any(Number),
      deletions: expect.any(Number)
    });
  });
});
```

### 1.6 파일 내용 수집 테스트

#### Test Case 1.6.1: 파일 내용 조회
```typescript
describe('GitHub File Content', () => {
  test('should fetch file content successfully', async () => {
    const client = GitHubClient.getInstance();

    const content = await client.getFileContent('owner', 'repo', 'src/index.ts');

    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  test('should handle binary files', async () => {
    const client = GitHubClient.getInstance();

    await expect(
      client.getFileContent('owner', 'repo', 'image.png')
    ).rejects.toThrow(GitHubValidationError);
  });

  test('should throw error for non-existent file', async () => {
    const client = GitHubClient.getInstance();

    await expect(
      client.getFileContent('owner', 'repo', 'nonexistent.ts')
    ).rejects.toThrow(GitHubNotFoundError);
  });

  test('should respect file size limits', async () => {
    const client = GitHubClient.getInstance();
    // Mock large file response

    await expect(
      client.getFileContent('owner', 'repo', 'large-file.json')
    ).rejects.toThrow(GitHubValidationError);
  });
});
```

#### Test Case 1.6.2: 파일 확장자 필터링
```typescript
describe('File Extension Filtering', () => {
  test('should process supported file extensions', async () => {
    const client = GitHubClient.getInstance();
    const supportedFiles = [
      'index.ts', 'component.tsx', 'script.js', 'app.jsx',
      'config.json', 'schema.sql', 'readme.md'
    ];

    for (const filename of supportedFiles) {
      expect(() =>
        client.validateFileExtension(filename)
      ).not.toThrow();
    }
  });

  test('should reject unsupported file extensions', async () => {
    const client = GitHubClient.getInstance();
    const unsupportedFiles = [
      'image.png', 'video.mp4', 'archive.zip', 'binary.exe'
    ];

    for (const filename of unsupportedFiles) {
      expect(() =>
        client.validateFileExtension(filename)
      ).toThrow(GitHubValidationError);
    }
  });
});
```

### 1.7 Rate Limiting 테스트

#### Test Case 1.7.1: Rate Limit 정보 조회
```typescript
describe('GitHub Rate Limiting', () => {
  test('should fetch current rate limit status', async () => {
    const client = GitHubClient.getInstance();

    const rateLimit = await client.getRateLimit();

    expect(rateLimit).toMatchObject({
      limit: expect.any(Number),
      remaining: expect.any(Number),
      reset: expect.any(Number),
      used: expect.any(Number)
    });
  });

  test('should handle rate limit exceeded scenario', async () => {
    const client = GitHubClient.getInstance();
    // Mock rate limit exceeded response

    await expect(
      client.getIssueInfo('https://github.com/owner/repo/issues/123')
    ).rejects.toThrow(GitHubRateLimitError);
  });

  test('should wait and retry when rate limited', async () => {
    const client = GitHubClient.getInstance();
    // Mock rate limit with short reset time

    const startTime = Date.now();
    const result = await client.getIssueInfo('https://github.com/owner/repo/issues/123');
    const endTime = Date.now();

    expect(result).toBeDefined();
    expect(endTime - startTime).toBeGreaterThan(1000); // Should have waited
  });
});
```

## 2. 통합 테스트 케이스

### 2.1 실제 GitHub API 호출 테스트 (Mock 사용)

#### Test Case 2.1.1: 전체 플로우 테스트
```typescript
describe('GitHub Client Integration', () => {
  test('should complete full issue analysis flow', async () => {
    const client = GitHubClient.getInstance();
    const url = 'https://github.com/microsoft/vscode/issues/1';

    // 1. Issue 정보 수집
    const issueInfo = await client.getIssueInfo(url);
    expect(issueInfo).toBeDefined();

    // 2. 관련 파일들이 있다면 내용 수집
    if (issueInfo.changedFiles && issueInfo.changedFiles.length > 0) {
      for (const file of issueInfo.changedFiles.slice(0, 3)) { // 최대 3개만
        const content = await client.getFileContent(
          issueInfo.repository.owner,
          issueInfo.repository.name,
          file.filename
        );
        expect(content).toBeDefined();
      }
    }
  });

  test('should complete full PR analysis flow', async () => {
    const client = GitHubClient.getInstance();
    const url = 'https://github.com/microsoft/vscode/pull/1';

    // 1. PR 정보 수집
    const prInfo = await client.getPullRequestInfo(url);
    expect(prInfo).toBeDefined();
    expect(prInfo.changedFiles.length).toBeGreaterThan(0);

    // 2. 변경된 파일들의 내용 수집
    for (const file of prInfo.changedFiles.slice(0, 5)) { // 최대 5개만
      if (client.validateFileExtension(file.filename)) {
        const content = await client.getFileContent(
          prInfo.repository.owner,
          prInfo.repository.name,
          file.filename
        );
        expect(content).toBeDefined();
      }
    }
  });
});
```

## 3. 에러 처리 테스트

### 3.1 네트워크 에러 테스트
```typescript
describe('Network Error Handling', () => {
  test('should handle network timeout', async () => {
    const client = GitHubClient.getInstance();
    // Mock network timeout

    await expect(
      client.getIssueInfo('https://github.com/owner/repo/issues/123')
    ).rejects.toThrow(GitHubNetworkError);
  });

  test('should retry on temporary network failures', async () => {
    const client = GitHubClient.getInstance();
    // Mock temporary failure followed by success

    const result = await client.getIssueInfo('https://github.com/owner/repo/issues/123');
    expect(result).toBeDefined();
  });
});
```

### 3.2 권한 에러 테스트
```typescript
describe('Permission Error Handling', () => {
  test('should handle private repository access', async () => {
    const client = GitHubClient.getInstance();

    await expect(
      client.getIssueInfo('https://github.com/private/repo/issues/123')
    ).rejects.toThrow(GitHubNotFoundError);
  });

  test('should handle insufficient permissions', async () => {
    const client = GitHubClient.getInstance();
    // Mock 403 Forbidden response

    await expect(
      client.getIssueInfo('https://github.com/owner/repo/issues/123')
    ).rejects.toThrow(GitHubAuthenticationError);
  });
});
```

## 4. 성능 테스트

### 4.1 응답 시간 테스트
```typescript
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
      'https://github.com/owner/repo/issues/5'
    ];

    const promises = urls.map(url => client.getIssueInfo(url));
    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach(result => expect(result).toBeDefined());
  });
});
```

## 5. Mock 데이터 및 픽스처

### 5.1 Mock GitHub API 응답
```typescript
// mocks/github-responses.ts
export const mockIssueResponse = {
  id: 123456789,
  number: 123,
  title: "Test Issue",
  body: "This is a test issue",
  state: "open",
  user: {
    login: "testuser",
    id: 987654321
  },
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-02T00:00:00Z"
};

export const mockPullRequestResponse = {
  ...mockIssueResponse,
  base: {
    ref: "main"
  },
  head: {
    ref: "feature-branch"
  }
};

export const mockRateLimitResponse = {
  limit: 5000,
  remaining: 4999,
  reset: 1609459200,
  used: 1
};
```

## 테스트 실행 계획

### Phase 1: 기본 구조 테스트
1. 싱글톤 패턴 테스트
2. 초기화 및 설정 테스트
3. URL 파싱 테스트

### Phase 2: API 호출 테스트
1. 인증 및 연결 테스트
2. Issue 정보 수집 테스트
3. PR 정보 수집 테스트
4. 파일 내용 수집 테스트

### Phase 3: 에러 처리 테스트
1. 모든 에러 시나리오 테스트
2. Rate Limiting 테스트
3. 네트워크 에러 테스트

### Phase 4: 성능 및 통합 테스트
1. 성능 요구사항 검증
2. 전체 플로우 통합 테스트
3. 동시성 테스트

## 성공 기준

1. **모든 테스트 통과**: 작성된 모든 테스트 케이스가 통과해야 함
2. **커버리지 90% 이상**: 코드 커버리지가 90% 이상이어야 함
3. **성능 요구사항 만족**: 모든 성능 테스트가 통과해야 함
4. **에러 처리 완성**: 모든 에러 시나리오가 적절히 처리되어야 함