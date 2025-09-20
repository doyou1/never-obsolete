# TDD Requirements - TASK-102 GitHub 데이터 파싱 구현

## 개요

GitHub API에서 받은 데이터를 분석 가능한 형태로 파싱하고 정규화하는 시스템을 구현합니다.

## 요구사항 정의 (EARS 방법론)

### R1. GitHub URL 파싱 및 검증
**Ubiquitous Requirements**
- REQ-102-001: 시스템은 GitHub URL을 파싱하여 owner, repo, type, number를 추출해야 한다
- REQ-102-002: 시스템은 유효하지 않은 GitHub URL에 대해 ValidationError를 발생시켜야 한다
- REQ-102-003: 시스템은 다음 GitHub URL 형식을 지원해야 한다:
  - `https://github.com/owner/repo/issues/123`
  - `https://github.com/owner/repo/pull/456`
  - `https://www.github.com/owner/repo/issues/123`

### R2. Issue/PR 타입 자동 감지
**Ubiquitous Requirements**
- REQ-102-004: 시스템은 URL에서 Issue와 Pull Request를 자동으로 구분해야 한다
- REQ-102-005: 시스템은 감지된 타입에 따라 적절한 파싱 전략을 선택해야 한다

**Event-driven Requirements**
- REQ-102-006: Issue URL이 입력되면, 시스템은 Issue 메타데이터를 추출해야 한다
- REQ-102-007: Pull Request URL이 입력되면, 시스템은 PR 메타데이터와 변경된 파일 목록을 추출해야 한다

### R3. 파일 필터링 (크기, 확장자)
**State-driven Requirements**
- REQ-102-008: 파일 크기가 10MB를 초과하면, 시스템은 해당 파일을 제외해야 한다
- REQ-102-009: 지원하지 않는 확장자의 파일이면, 시스템은 해당 파일을 제외해야 한다

**Ubiquitous Requirements**
- REQ-102-010: 시스템은 다음 파일 확장자를 지원해야 한다: .ts, .js, .tsx, .jsx, .json, .sql, .md
- REQ-102-011: 시스템은 필터링된 파일 수에 대한 통계를 제공해야 한다

### R4. 메타데이터 추출 및 정규화
**Ubiquitous Requirements**
- REQ-102-012: 시스템은 Issue/PR의 기본 정보를 추출해야 한다 (제목, 설명, 상태, 작성자)
- REQ-102-013: 시스템은 Repository 정보를 추출해야 한다 (소유자, 이름, 설명)
- REQ-102-014: 시스템은 변경된 파일의 정보를 추출해야 한다 (파일명, 상태, 변경 통계)

**Unwanted Behavior Requirements**
- REQ-102-015: 시스템은 민감한 정보(토큰, 패스워드)를 로그에 기록하면 안 된다
- REQ-102-016: 시스템은 파싱 실패 시 원본 데이터를 손실하면 안 된다

### R5. 성능 및 안정성
**Performance Requirements**
- REQ-102-017: 시스템은 URL 파싱을 100ms 이내에 완료해야 한다
- REQ-102-018: 시스템은 1000개 파일의 필터링을 5초 이내에 완료해야 한다

**Error Handling Requirements**
- REQ-102-019: 파싱 실패 시, 시스템은 구체적인 에러 메시지를 제공해야 한다
- REQ-102-020: 시스템은 부분적 파싱 실패 시에도 성공한 부분의 결과를 반환해야 한다

## 데이터 타입 정의

### GitHubDataParser 클래스
```typescript
interface GitHubDataParser {
  parseIssueData(issueInfo: IssueInfo): ParsedIssueData;
  parsePullRequestData(prInfo: PullRequestInfo): ParsedPullRequestData;
  filterFiles(files: FileInfo[]): FilteredFileResult;
  extractMetadata(data: IssueInfo | PullRequestInfo): CommonMetadata;
}
```

### 출력 데이터 타입
```typescript
interface ParsedIssueData {
  metadata: CommonMetadata;
  content: {
    description: string;
    labels: string[];
    assignees: UserInfo[];
  };
  statistics: {
    commentCount?: number;
    reactionCount?: number;
  };
}

interface ParsedPullRequestData extends ParsedIssueData {
  changes: {
    baseBranch: string;
    headBranch: string;
    commits: CommitInfo[];
    files: FilteredFileResult;
  };
  status: {
    mergeable: boolean;
    merged: boolean;
    mergedAt?: string;
  };
}

interface FilteredFileResult {
  included: FileInfo[];
  excluded: {
    bySize: FileInfo[];
    byExtension: FileInfo[];
  };
  statistics: {
    totalFiles: number;
    includedCount: number;
    excludedCount: number;
    totalSizeBytes: number;
  };
}

interface CommonMetadata {
  id: number;
  number: number;
  title: string;
  type: 'issue' | 'pull';
  repository: RepositoryInfo;
  author: UserInfo;
  createdAt: string;
  updatedAt: string;
  state: 'open' | 'closed';
}
```

## 테스트 시나리오

### 정상 케이스
1. **유효한 Issue URL 파싱**: 완전한 Issue 데이터 반환
2. **유효한 PR URL 파싱**: PR 데이터 + 파일 변경 정보 반환
3. **파일 필터링**: 지원되는 파일만 포함, 통계 정보 제공
4. **메타데이터 추출**: 모든 필수 필드 포함

### 경계값 케이스
1. **최대 파일 크기**: 정확히 10MB 파일 처리
2. **빈 PR**: 변경된 파일이 없는 PR 처리
3. **대량 파일**: 1000개 파일이 있는 PR 처리

### 예외 케이스
1. **잘못된 URL**: 명확한 에러 메시지
2. **존재하지 않는 Repository**: 적절한 404 에러 처리
3. **권한 없는 Private Repository**: 인증 에러 처리
4. **API 제한 초과**: Rate Limit 에러 처리

## 구현 우선순위

### Phase 1: 핵심 파싱 로직 (High Priority)
- GitHubDataParser 클래스 기본 구조
- parseIssueData() 메서드
- parsePullRequestData() 메서드

### Phase 2: 파일 필터링 (Medium Priority)
- filterFiles() 메서드
- 크기/확장자 기반 필터링
- 통계 정보 생성

### Phase 3: 메타데이터 처리 (Low Priority)
- extractMetadata() 메서드
- 공통 메타데이터 정규화
- 에러 처리 및 복구

## 검증 기준

### 기능 검증
- ✅ 모든 지원 URL 형식에서 올바른 파싱
- ✅ Issue와 PR 타입별 적절한 데이터 추출
- ✅ 파일 필터링 규칙 정확한 적용
- ✅ 메타데이터 완전성 검증

### 성능 검증
- ✅ URL 파싱 100ms 이내 완료
- ✅ 1000개 파일 필터링 5초 이내 완료
- ✅ 메모리 사용량 최적화

### 안정성 검증
- ✅ 모든 예외 상황에서 graceful handling
- ✅ 부분 실패 시 부분 결과 반환
- ✅ 민감 정보 노출 방지