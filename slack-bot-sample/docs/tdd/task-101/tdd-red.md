# TASK-101: GitHub API 클라이언트 구현 - TDD Red 단계

## 개요

TDD의 Red 단계로, 실패하는 테스트를 먼저 작성하고 실행하여 모든 테스트가 실패하는 것을 확인합니다.

## 구현된 파일들

### 1. 타입 정의 파일
- `src/github/types.ts` - 모든 인터페이스와 타입 정의 완료
- GitHubUrlInfo, UserInfo, RepositoryInfo, IssueInfo, PullRequestInfo 등

### 2. 에러 클래스들
- `src/github/errors.ts` - GitHub API 관련 에러 클래스들
- GitHubAuthenticationError, GitHubRateLimitError, GitHubNetworkError 등

### 3. 테스트 파일
- `src/github/__tests__/GitHubClient.test.ts` - 포괄적인 테스트 케이스 작성
- 60개 이상의 테스트 케이스 포함

### 4. 빈 구현 클래스
- `src/github/GitHubClient.ts` - 모든 메서드가 "Not implemented" 에러를 발생시키는 빈 클래스

## 테스트 실행 결과

현재 모든 테스트는 예상대로 실패해야 합니다:

```bash
npm test -- src/github/__tests__/GitHubClient.test.ts
```

### 예상 실패 사항

1. **싱글톤 테스트**: `getInstance()` 메서드에서 "Not implemented" 에러
2. **URL 파싱 테스트**: `parseGitHubUrl()` 메서드에서 "Not implemented" 에러
3. **API 호출 테스트**: 모든 API 관련 메서드에서 "Not implemented" 에러
4. **파일 처리 테스트**: 파일 관련 메서드에서 "Not implemented" 에러

## Red 단계 검증

### 테스트 실행 명령
```bash
npm test src/github/__tests__/GitHubClient.test.ts
```

### 기대 결과
- ✗ 모든 테스트 케이스가 실패해야 함
- ✗ "Not implemented" 에러 메시지가 출력되어야 함
- ✗ 테스트 커버리지는 0%에 가까워야 함

## 다음 단계 (Green)

Red 단계가 확인되면 다음 단계인 Green 단계로 진행:
1. 최소한의 구현으로 테스트를 통과시키기
2. 실제 Octokit.js 클라이언트 연동
3. GitHub API 호출 구현
4. 에러 핸들링 구현

## 검증 완료

Red 단계의 모든 테스트가 예상대로 실패하는 것을 확인했습니다.
이제 Green 단계로 진행할 준비가 되었습니다.