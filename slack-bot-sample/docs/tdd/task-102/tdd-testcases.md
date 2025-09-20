# TDD Test Cases - TASK-102 GitHub 데이터 파싱 구현

## 테스트 계획

### 테스트 범위
- GitHubDataParser 클래스의 모든 public 메서드
- 파일 필터링 로직
- 메타데이터 추출 및 정규화
- 에러 처리 및 검증

### 테스트 분류
1. **Unit Tests**: 개별 메서드 기능 검증
2. **Integration Tests**: GitHubClient와의 연동 테스트
3. **Edge Case Tests**: 경계값 및 예외 상황 테스트

## 테스트 케이스 정의

### 1. GitHubDataParser 클래스 생성 및 초기화

#### TC-102-001: GitHubDataParser 인스턴스 생성
```typescript
describe('GitHubDataParser Creation', () => {
  test('should create GitHubDataParser instance', () => {
    const parser = new GitHubDataParser();
    expect(parser).toBeInstanceOf(GitHubDataParser);
  });

  test('should initialize with default configuration', () => {
    const parser = new GitHubDataParser();
    expect(parser.getConfig()).toMatchObject({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedExtensions: ['.ts', '.js', '.tsx', '.jsx', '.json', '.sql', '.md']
    });
  });
});
```

### 2. Issue 데이터 파싱 테스트

#### TC-102-002: parseIssueData 기본 기능
```typescript
describe('Issue Data Parsing', () => {
  test('should parse basic issue data correctly', () => {
    const mockIssueInfo: IssueInfo = {
      id: 123456789,
      number: 123,
      title: 'Test Issue',
      body: 'This is a test issue',
      state: 'open',
      author: {
        login: 'testuser',
        id: 987654321,
        avatar_url: 'https://github.com/testuser.png',
        html_url: 'https://github.com/testuser'
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      repository: {
        owner: 'testowner',
        name: 'testrepo',
        fullName: 'testowner/testrepo',
        description: 'Test repository',
        private: false,
        html_url: 'https://github.com/testowner/testrepo'
      },
      labels: ['bug', 'high-priority'],
      assignees: []
    };

    const parser = new GitHubDataParser();
    const result = parser.parseIssueData(mockIssueInfo);

    expect(result).toMatchObject({
      metadata: {
        id: 123456789,
        number: 123,
        title: 'Test Issue',
        type: 'issue',
        state: 'open'
      },
      content: {
        description: 'This is a test issue',
        labels: ['bug', 'high-priority'],
        assignees: []
      }
    });
  });

  test('should handle issue with empty body', () => {
    const mockIssueInfo = createMockIssue({ body: '' });
    const parser = new GitHubDataParser();
    const result = parser.parseIssueData(mockIssueInfo);

    expect(result.content.description).toBe('');
  });

  test('should handle issue with null body', () => {
    const mockIssueInfo = createMockIssue({ body: null });
    const parser = new GitHubDataParser();
    const result = parser.parseIssueData(mockIssueInfo);

    expect(result.content.description).toBe('');
  });
});
```

### 3. Pull Request 데이터 파싱 테스트

#### TC-102-003: parsePullRequestData 기본 기능
```typescript
describe('Pull Request Data Parsing', () => {
  test('should parse basic PR data correctly', () => {
    const mockPRInfo: PullRequestInfo = {
      ...createBaseMockIssue(),
      baseBranch: 'main',
      headBranch: 'feature-branch',
      commits: [
        {
          sha: 'abc123def456',
          message: 'Initial commit',
          author: {
            name: 'Test User',
            email: 'test@example.com',
            date: '2023-01-01T00:00:00Z'
          },
          committer: {
            name: 'Test User',
            email: 'test@example.com',
            date: '2023-01-01T00:00:00Z'
          },
          url: 'https://github.com/owner/repo/commit/abc123def456'
        }
      ],
      changedFiles: [
        {
          filename: 'src/index.ts',
          status: 'modified',
          changes: 10,
          additions: 5,
          deletions: 5,
          size: 10,
          patch: '@@ -1,3 +1,3 @@\n-console.log("old");\n+console.log("new");'
        }
      ],
      mergeable: true,
      merged: false,
      mergedAt: null
    };

    const parser = new GitHubDataParser();
    const result = parser.parsePullRequestData(mockPRInfo);

    expect(result).toMatchObject({
      metadata: {
        type: 'pull'
      },
      changes: {
        baseBranch: 'main',
        headBranch: 'feature-branch',
        commits: expect.arrayContaining([
          expect.objectContaining({
            sha: 'abc123def456',
            message: 'Initial commit'
          })
        ])
      },
      status: {
        mergeable: true,
        merged: false,
        mergedAt: null
      }
    });
  });

  test('should handle PR without changed files', () => {
    const mockPRInfo = createMockPR({ changedFiles: [] });
    const parser = new GitHubDataParser();
    const result = parser.parsePullRequestData(mockPRInfo);

    expect(result.changes.files.included).toHaveLength(0);
    expect(result.changes.files.statistics.totalFiles).toBe(0);
  });
});
```

### 4. 파일 필터링 테스트

#### TC-102-004: filterFiles 기능
```typescript
describe('File Filtering', () => {
  test('should filter files by supported extensions', () => {
    const mockFiles: FileInfo[] = [
      createMockFile('src/index.ts', 'modified', 1024),
      createMockFile('README.md', 'added', 2048),
      createMockFile('image.png', 'added', 1024),
      createMockFile('script.js', 'modified', 512),
      createMockFile('binary.exe', 'added', 2048)
    ];

    const parser = new GitHubDataParser();
    const result = parser.filterFiles(mockFiles);

    expect(result.included).toHaveLength(3); // .ts, .md, .js
    expect(result.excluded.byExtension).toHaveLength(2); // .png, .exe
    expect(result.statistics.includedCount).toBe(3);
    expect(result.statistics.excludedCount).toBe(2);
  });

  test('should filter files by size limit', () => {
    const mockFiles: FileInfo[] = [
      createMockFile('small.ts', 'modified', 1024), // 1KB
      createMockFile('large.ts', 'modified', 11 * 1024 * 1024), // 11MB
      createMockFile('medium.js', 'added', 5 * 1024 * 1024) // 5MB
    ];

    const parser = new GitHubDataParser();
    const result = parser.filterFiles(mockFiles);

    expect(result.included).toHaveLength(2); // small.ts, medium.js
    expect(result.excluded.bySize).toHaveLength(1); // large.ts
    expect(result.excluded.bySize[0].filename).toBe('large.ts');
  });

  test('should calculate correct statistics', () => {
    const mockFiles: FileInfo[] = [
      createMockFile('file1.ts', 'modified', 1024),
      createMockFile('file2.js', 'added', 2048),
      createMockFile('file3.png', 'deleted', 512)
    ];

    const parser = new GitHubDataParser();
    const result = parser.filterFiles(mockFiles);

    expect(result.statistics).toMatchObject({
      totalFiles: 3,
      includedCount: 2,
      excludedCount: 1,
      totalSizeBytes: 1024 + 2048 // Only included files
    });
  });

  test('should handle empty file list', () => {
    const parser = new GitHubDataParser();
    const result = parser.filterFiles([]);

    expect(result.included).toHaveLength(0);
    expect(result.excluded.bySize).toHaveLength(0);
    expect(result.excluded.byExtension).toHaveLength(0);
    expect(result.statistics.totalFiles).toBe(0);
  });
});
```

### 5. 메타데이터 추출 테스트

#### TC-102-005: extractMetadata 기능
```typescript
describe('Metadata Extraction', () => {
  test('should extract common metadata from issue', () => {
    const mockIssueInfo = createMockIssue();
    const parser = new GitHubDataParser();
    const result = parser.extractMetadata(mockIssueInfo);

    expect(result).toMatchObject({
      id: expect.any(Number),
      number: expect.any(Number),
      title: expect.any(String),
      type: 'issue',
      repository: expect.objectContaining({
        owner: expect.any(String),
        name: expect.any(String),
        fullName: expect.any(String)
      }),
      author: expect.objectContaining({
        login: expect.any(String),
        id: expect.any(Number)
      }),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      state: expect.stringMatching(/^(open|closed)$/)
    });
  });

  test('should extract common metadata from PR', () => {
    const mockPRInfo = createMockPR();
    const parser = new GitHubDataParser();
    const result = parser.extractMetadata(mockPRInfo);

    expect(result.type).toBe('pull');
  });

  test('should handle missing optional fields', () => {
    const mockIssueInfo = createMockIssue({
      repository: {
        ...createMockRepository(),
        description: undefined
      }
    });

    const parser = new GitHubDataParser();
    const result = parser.extractMetadata(mockIssueInfo);

    expect(result.repository.description).toBeUndefined();
  });
});
```

### 6. 에러 처리 테스트

#### TC-102-006: 에러 처리
```typescript
describe('Error Handling', () => {
  test('should throw validation error for invalid data', () => {
    const parser = new GitHubDataParser();

    expect(() => {
      parser.parseIssueData(null as any);
    }).toThrow('Invalid issue data provided');
  });

  test('should throw validation error for missing required fields', () => {
    const invalidIssue = {
      // Missing required fields like id, number, title
      state: 'open'
    };

    const parser = new GitHubDataParser();

    expect(() => {
      parser.parseIssueData(invalidIssue as any);
    }).toThrow('Missing required fields: id, number, title');
  });

  test('should handle partial data gracefully', () => {
    const partialIssue = createMockIssue({
      labels: undefined,
      assignees: undefined
    });

    const parser = new GitHubDataParser();
    const result = parser.parseIssueData(partialIssue);

    expect(result.content.labels).toEqual([]);
    expect(result.content.assignees).toEqual([]);
  });
});
```

### 7. 성능 테스트

#### TC-102-007: 성능 검증
```typescript
describe('Performance Tests', () => {
  test('should parse issue data within 100ms', () => {
    const mockIssueInfo = createMockIssue();
    const parser = new GitHubDataParser();

    const startTime = Date.now();
    parser.parseIssueData(mockIssueInfo);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100);
  });

  test('should filter 1000 files within 5 seconds', () => {
    const mockFiles = Array.from({ length: 1000 }, (_, i) =>
      createMockFile(`file${i}.ts`, 'modified', 1024)
    );

    const parser = new GitHubDataParser();

    const startTime = Date.now();
    parser.filterFiles(mockFiles);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('should handle large PR data efficiently', () => {
    const mockPRInfo = createMockPR({
      commits: Array.from({ length: 100 }, (_, i) => createMockCommit(`commit${i}`)),
      changedFiles: Array.from({ length: 500 }, (_, i) =>
        createMockFile(`file${i}.ts`, 'modified', 1024)
      )
    });

    const parser = new GitHubDataParser();

    const startTime = Date.now();
    parser.parsePullRequestData(mockPRInfo);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // 1 second
  });
});
```

## 테스트 헬퍼 함수

### Mock Data Creators
```typescript
function createMockIssue(overrides?: Partial<IssueInfo>): IssueInfo {
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
    ...overrides
  };
}

function createMockPR(overrides?: Partial<PullRequestInfo>): PullRequestInfo {
  return {
    ...createMockIssue(),
    baseBranch: 'main',
    headBranch: 'feature',
    commits: [createMockCommit()],
    changedFiles: [createMockFile('test.ts', 'modified', 1024)],
    mergeable: true,
    merged: false,
    mergedAt: null,
    ...overrides
  };
}

function createMockFile(
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
    patch: '@@ -1,1 +1,1 @@\n-old\n+new'
  };
}
```

## 테스트 실행 계획

### Phase 1: 기본 기능 테스트
1. GitHubDataParser 생성 및 초기화
2. parseIssueData 기본 기능
3. parsePullRequestData 기본 기능

### Phase 2: 고급 기능 테스트
1. 파일 필터링 로직
2. 메타데이터 추출
3. 에러 처리

### Phase 3: 성능 및 안정성 테스트
1. 성능 벤치마크
2. 대용량 데이터 처리
3. 메모리 사용량 최적화

## 성공 기준
- ✅ 모든 단위 테스트 통과 (목표: 100% 커버리지)
- ✅ 성능 요구사항 만족 (파싱 < 100ms, 필터링 < 5초)
- ✅ 에러 처리 완전성 검증
- ✅ 메모리 누수 없음