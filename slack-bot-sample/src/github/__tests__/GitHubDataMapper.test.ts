import { GitHubDataMapper } from '../GitHubDataMapper';

describe('GitHubDataMapper', () => {
  let mapper: GitHubDataMapper;

  beforeEach(() => {
    mapper = new GitHubDataMapper();
  });

  describe('Repository 매핑', () => {
    test('유효한 Repository 데이터 매핑', () => {
      const apiData = {
        id: 12345,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: 'A test repository',
        language: 'TypeScript',
        stargazers_count: 100,
        forks_count: 25,
        topics: ['typescript', 'testing'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-06-01T00:00:00Z',
        private: false,
        default_branch: 'main',
        size: 1024,
      };

      const result = mapper.mapRepository(apiData);

      expect(result).toEqual({
        id: 12345,
        name: 'test-repo',
        fullName: 'owner/test-repo',
        description: 'A test repository',
        language: 'TypeScript',
        starCount: 100,
        forkCount: 25,
        topics: ['typescript', 'testing'],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-06-01T00:00:00Z'),
        isPrivate: false,
        defaultBranch: 'main',
        size: 1024,
      });
    });

    test('null 값이 포함된 Repository 데이터 매핑', () => {
      const apiData = {
        id: 12345,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: null,
        language: null,
        stargazers_count: 0,
        forks_count: 0,
        topics: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-06-01T00:00:00Z',
        private: true,
        default_branch: 'master',
        size: 0,
      };

      const result = mapper.mapRepository(apiData);

      expect(result.description).toBeNull();
      expect(result.language).toBeNull();
      expect(result.isPrivate).toBe(true);
      expect(result.topics).toEqual([]);
    });

    test('필수 필드 누락 시 에러', () => {
      const invalidApiData = {
        // id 누락
        name: 'test-repo',
        full_name: 'owner/test-repo',
      };

      expect(() => mapper.mapRepository(invalidApiData)).toThrow();
    });
  });

  describe('User 매핑', () => {
    test('유효한 User 데이터 매핑', () => {
      const apiData = {
        id: 67890,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        type: 'User',
      };

      const result = mapper.mapUser(apiData);

      expect(result).toEqual({
        id: 67890,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://github.com/avatar.jpg',
        type: 'User',
      });
    });

    test('Organization 타입 User 매핑', () => {
      const apiData = {
        id: 11111,
        login: 'testorg',
        name: 'Test Organization',
        email: null,
        avatar_url: 'https://github.com/org-avatar.jpg',
        type: 'Organization',
      };

      const result = mapper.mapUser(apiData);

      expect(result.type).toBe('Organization');
      expect(result.email).toBeNull();
    });

    test('부분 정보만 있는 User 매핑', () => {
      const apiData = {
        id: 22222,
        login: 'partialuser',
        name: null,
        email: null,
        avatar_url: 'https://github.com/default.jpg',
        type: 'User',
      };

      const result = mapper.mapUser(apiData);

      expect(result.name).toBeNull();
      expect(result.email).toBeNull();
      expect(result.login).toBe('partialuser');
    });
  });

  describe('Label 매핑', () => {
    test('유효한 Label 데이터 매핑', () => {
      const apiData = {
        id: 33333,
        name: 'bug',
        color: 'ff0000',
        description: 'Something is not working',
      };

      const result = mapper.mapLabel(apiData);

      expect(result).toEqual({
        id: 33333,
        name: 'bug',
        color: 'ff0000',
        description: 'Something is not working',
      });
    });

    test('설명이 없는 Label 매핑', () => {
      const apiData = {
        id: 44444,
        name: 'enhancement',
        color: '00ff00',
        description: null,
      };

      const result = mapper.mapLabel(apiData);

      expect(result.description).toBeNull();
    });
  });

  describe('Issue 매핑', () => {
    test('완전한 Issue 데이터 매핑', () => {
      const apiData = {
        id: 55555,
        number: 123,
        title: 'Test Issue',
        body: 'This is a test issue',
        state: 'open',
        labels: [
          { id: 1, name: 'bug', color: 'ff0000', description: null },
        ],
        assignees: [
          { id: 2, login: 'assignee', name: 'Assignee', email: null, avatar_url: 'url', type: 'User' },
        ],
        user: { id: 3, login: 'author', name: 'Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/issues/123',
      };

      const result = mapper.mapIssue(apiData);

      expect(result.id).toBe(55555);
      expect(result.number).toBe(123);
      expect(result.title).toBe('Test Issue');
      expect(result.state).toBe('open');
      expect(result.labels).toHaveLength(1);
      expect(result.assignees).toHaveLength(1);
      expect(result.author.login).toBe('author');
      expect(result.closedAt).toBeNull();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('닫힌 Issue 매핑', () => {
      const apiData = {
        id: 66666,
        number: 124,
        title: 'Closed Issue',
        body: null,
        state: 'closed',
        labels: [],
        assignees: [],
        user: { id: 3, login: 'author', name: 'Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
        closed_at: '2023-01-03T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/124',
      };

      const result = mapper.mapIssue(apiData);

      expect(result.state).toBe('closed');
      expect(result.closedAt).toBeInstanceOf(Date);
      expect(result.body).toBeNull();
      expect(result.labels).toEqual([]);
      expect(result.assignees).toEqual([]);
    });
  });

  describe('PullRequest 매핑', () => {
    test('완전한 PullRequest 데이터 매핑', () => {
      const apiData = {
        // Issue 기본 필드들
        id: 77777,
        number: 125,
        title: 'Test PR',
        body: 'This is a test PR',
        state: 'open',
        labels: [],
        assignees: [],
        user: { id: 3, login: 'author', name: 'Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/pull/125',
        // PR 전용 필드들
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

      const result = mapper.mapPullRequest(apiData);

      expect(result.headBranch).toBe('feature-branch');
      expect(result.baseBranch).toBe('main');
      expect(result.commits).toBe(5);
      expect(result.additions).toBe(100);
      expect(result.deletions).toBe(20);
      expect(result.changedFiles).toBe(3);
      expect(result.mergeable).toBe(true);
      expect(result.merged).toBe(false);
      expect(result.mergedAt).toBeNull();
      expect(result.mergedBy).toBeNull();
      expect(result.draft).toBe(false);
    });

    test('병합된 PullRequest 매핑', () => {
      const apiData = {
        id: 88888,
        number: 126,
        title: 'Merged PR',
        body: 'This PR was merged',
        state: 'closed',
        labels: [],
        assignees: [],
        user: { id: 3, login: 'author', name: 'Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
        closed_at: '2023-01-04T00:00:00Z',
        html_url: 'https://github.com/owner/repo/pull/126',
        head: { ref: 'hotfix' },
        base: { ref: 'main' },
        commits: 2,
        additions: 50,
        deletions: 10,
        changed_files: 2,
        mergeable: null,
        merged: true,
        merged_at: '2023-01-04T00:00:00Z',
        merged_by: { id: 4, login: 'merger', name: 'Merger', email: null, avatar_url: 'url', type: 'User' },
        draft: false,
      };

      const result = mapper.mapPullRequest(apiData);

      expect(result.merged).toBe(true);
      expect(result.mergedAt).toBeInstanceOf(Date);
      expect(result.mergedBy?.login).toBe('merger');
      expect(result.mergeable).toBeNull();
    });

    test('Draft PullRequest 매핑', () => {
      const apiData = {
        id: 99999,
        number: 127,
        title: 'Draft PR',
        body: 'Work in progress',
        state: 'open',
        labels: [],
        assignees: [],
        user: { id: 3, login: 'author', name: 'Author', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/pull/127',
        head: { ref: 'wip-feature' },
        base: { ref: 'develop' },
        commits: 1,
        additions: 10,
        deletions: 0,
        changed_files: 1,
        mergeable: true,
        merged: false,
        merged_at: null,
        merged_by: null,
        draft: true,
      };

      const result = mapper.mapPullRequest(apiData);

      expect(result.draft).toBe(true);
      expect(result.baseBranch).toBe('develop');
    });
  });

  describe('FileContent 매핑', () => {
    test('텍스트 파일 콘텐츠 매핑', () => {
      const apiData = {
        name: 'README.md',
        path: 'README.md',
        content: 'IyBUZXN0IFJlcG9zaXRvcnk=', // base64 encoded "# Test Repository"
        encoding: 'base64',
        size: 1024,
        sha: 'abc123def456',
        download_url: 'https://raw.githubusercontent.com/owner/repo/main/README.md',
      };

      const result = mapper.mapFileContent(apiData);

      expect(result).toEqual({
        name: 'README.md',
        path: 'README.md',
        content: 'IyBUZXN0IFJlcG9zaXRvcnk=',
        encoding: 'base64',
        size: 1024,
        sha: 'abc123def456',
        url: 'https://raw.githubusercontent.com/owner/repo/main/README.md',
      });
    });

    test('UTF-8 인코딩 파일 매핑', () => {
      const apiData = {
        name: 'package.json',
        path: 'package.json',
        content: '{"name": "test"}',
        encoding: 'utf-8',
        size: 17,
        sha: 'def456ghi789',
        download_url: 'https://raw.githubusercontent.com/owner/repo/main/package.json',
      };

      const result = mapper.mapFileContent(apiData);

      expect(result.encoding).toBe('utf-8');
      expect(result.content).toBe('{"name": "test"}');
    });
  });

  describe('FileChange 매핑', () => {
    test('수정된 파일 변경사항 매핑', () => {
      const apiData = {
        filename: 'src/index.ts',
        status: 'modified',
        additions: 15,
        deletions: 5,
        changes: 20,
        patch: '@@ -1,3 +1,3 @@\n-old line\n+new line',
        blob_url: 'https://github.com/owner/repo/blob/abc123/src/index.ts',
      };

      const result = mapper.mapFileChange(apiData);

      expect(result).toEqual({
        filename: 'src/index.ts',
        status: 'modified',
        additions: 15,
        deletions: 5,
        changes: 20,
        patch: '@@ -1,3 +1,3 @@\n-old line\n+new line',
        blobUrl: 'https://github.com/owner/repo/blob/abc123/src/index.ts',
      });
    });

    test('새로 추가된 파일 매핑', () => {
      const apiData = {
        filename: 'src/new-file.ts',
        status: 'added',
        additions: 50,
        deletions: 0,
        changes: 50,
        blob_url: 'https://github.com/owner/repo/blob/abc123/src/new-file.ts',
      };

      const result = mapper.mapFileChange(apiData);

      expect(result.status).toBe('added');
      expect(result.deletions).toBe(0);
      expect(result.patch).toBeUndefined();
    });

    test('삭제된 파일 매핑', () => {
      const apiData = {
        filename: 'src/old-file.ts',
        status: 'removed',
        additions: 0,
        deletions: 30,
        changes: 30,
        blob_url: 'https://github.com/owner/repo/blob/abc123/src/old-file.ts',
      };

      const result = mapper.mapFileChange(apiData);

      expect(result.status).toBe('removed');
      expect(result.additions).toBe(0);
    });

    test('이름이 변경된 파일 매핑', () => {
      const apiData = {
        filename: 'src/renamed-file.ts',
        previous_filename: 'src/old-name.ts',
        status: 'renamed',
        additions: 2,
        deletions: 1,
        changes: 3,
        blob_url: 'https://github.com/owner/repo/blob/abc123/src/renamed-file.ts',
      };

      const result = mapper.mapFileChange(apiData);

      expect(result.status).toBe('renamed');
      expect(result.previousFilename).toBe('src/old-name.ts');
    });
  });

  describe('Comment 매핑', () => {
    test('기본 Comment 데이터 매핑', () => {
      const apiData = {
        id: 111111,
        body: 'This is a comment',
        user: { id: 5, login: 'commenter', name: 'Commenter', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-05T00:00:00Z',
        updated_at: '2023-01-05T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/123#issuecomment-111111',
      };

      const result = mapper.mapComment(apiData);

      expect(result).toEqual({
        id: 111111,
        body: 'This is a comment',
        author: expect.objectContaining({ login: 'commenter' }),
        createdAt: new Date('2023-01-05T00:00:00Z'),
        updatedAt: new Date('2023-01-05T00:00:00Z'),
        url: 'https://github.com/owner/repo/issues/123#issuecomment-111111',
      });
    });

    test('Reactions이 포함된 Comment 매핑', () => {
      const apiData = {
        id: 222222,
        body: 'Comment with reactions',
        user: { id: 6, login: 'reactor', name: 'Reactor', email: null, avatar_url: 'url', type: 'User' },
        created_at: '2023-01-06T00:00:00Z',
        updated_at: '2023-01-06T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/123#issuecomment-222222',
        reactions: {
          '+1': 3,
          '-1': 0,
          laugh: 1,
          confused: 0,
          heart: 2,
          hooray: 0,
          eyes: 0,
          rocket: 1,
          total_count: 7,
        },
      };

      const result = mapper.mapComment(apiData);

      expect(result.reactions).toEqual({
        '+1': 3,
        '-1': 0,
        laugh: 1,
        confused: 0,
        heart: 2,
        hooray: 0,
        eyes: 0,
        rocket: 1,
        totalCount: 7,
      });
    });
  });

  describe('Review 매핑', () => {
    test('승인 Review 매핑', () => {
      const apiData = {
        id: 333333,
        body: 'Looks good to me!',
        user: { id: 7, login: 'reviewer', name: 'Reviewer', email: null, avatar_url: 'url', type: 'User' },
        state: 'APPROVED',
        submitted_at: '2023-01-07T00:00:00Z',
        commit_id: 'abc123def456',
        html_url: 'https://github.com/owner/repo/pull/125#pullrequestreview-333333',
      };

      const result = mapper.mapReview(apiData);

      expect(result).toEqual({
        id: 333333,
        body: 'Looks good to me!',
        author: expect.objectContaining({ login: 'reviewer' }),
        state: 'approved',
        submittedAt: new Date('2023-01-07T00:00:00Z'),
        commitSha: 'abc123def456',
        url: 'https://github.com/owner/repo/pull/125#pullrequestreview-333333',
      });
    });

    test('변경 요청 Review 매핑', () => {
      const apiData = {
        id: 444444,
        body: 'Please fix the formatting',
        user: { id: 8, login: 'nitpicker', name: 'Nitpicker', email: null, avatar_url: 'url', type: 'User' },
        state: 'CHANGES_REQUESTED',
        submitted_at: '2023-01-08T00:00:00Z',
        commit_id: 'def456ghi789',
        html_url: 'https://github.com/owner/repo/pull/125#pullrequestreview-444444',
      };

      const result = mapper.mapReview(apiData);

      expect(result.state).toBe('changes_requested');
      expect(result.body).toBe('Please fix the formatting');
    });

    test('일반 코멘트 Review 매핑', () => {
      const apiData = {
        id: 555555,
        body: null,
        user: { id: 9, login: 'observer', name: 'Observer', email: null, avatar_url: 'url', type: 'User' },
        state: 'COMMENTED',
        submitted_at: '2023-01-09T00:00:00Z',
        commit_id: 'ghi789jkl012',
        html_url: 'https://github.com/owner/repo/pull/125#pullrequestreview-555555',
      };

      const result = mapper.mapReview(apiData);

      expect(result.state).toBe('commented');
      expect(result.body).toBeNull();
    });
  });

  describe('에러 처리', () => {
    test('필수 필드 누락 시 명확한 에러 메시지', () => {
      const invalidData = {
        // id 필드 누락
        name: 'test',
      };

      expect(() => mapper.mapRepository(invalidData)).toThrow(/required field.*id/i);
    });

    test('잘못된 날짜 형식 처리', () => {
      const invalidDateData = {
        id: 123,
        name: 'test',
        full_name: 'owner/test',
        created_at: 'invalid-date',
        updated_at: '2023-01-01T00:00:00Z',
      };

      expect(() => mapper.mapRepository(invalidDateData)).toThrow(/invalid date/i);
    });

    test('잘못된 enum 값 처리', () => {
      const invalidStateData = {
        id: 123,
        number: 1,
        title: 'test',
        state: 'invalid-state', // 유효하지 않은 상태
        user: { id: 1, login: 'test', avatar_url: 'url', type: 'User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'url',
      };

      expect(() => mapper.mapIssue(invalidStateData)).toThrow(/invalid.*state/i);
    });
  });
});