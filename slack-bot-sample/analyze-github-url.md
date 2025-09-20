# /analyze-github-url Command

GitHub URL을 분석하여 소스코드 플로우를 파악하는 Claude Code 명령어입니다.

## 사용법

```bash
/analyze-github-url
```

## 기능

- **GitHub Issue/PR URL 분석**: 입력받은 GitHub URL에서 Issue 또는 PR 정보를 추출
- **소스코드 플로우 추적**: Client → API → Server → DB까지 전체 데이터 플로우 분석
- **분석 보고서 생성**: 타임스탬프가 포함된 마크다운 파일로 결과 저장

## 분석 과정

1. **URL 입력 받기**: GitHub Issue 또는 PR URL을 입력받음
2. **브랜치 최신화**:
   - `clientv/` 디렉토리를 main 브랜치 최신 상태로 업데이트 (`git pull origin main`)
   - `server/` 디렉토리를 dev 브랜치 최신 상태로 업데이트 (`git pull origin dev`)
3. **메타데이터 수집**: GitHub MCP를 통해 Issue/PR 정보, diff, 코멘트 수집
4. **현재 프로젝트 구조 분석**: 로컬 clientv/, server/ 디렉토리의 최신 코드 구조 파악
5. **코드 분석**: AST 기반으로 코드 구조 및 의존성 분석
6. **플로우 매핑**:
   - 현재 프로젝트의 `clientv/` Flutter 앱 구조 분석
   - Flutter 위젯 구조 트리 분석 (main.dart부터 시작)
   - 위젯에서 API 호출 지점 추적
   - 현재 프로젝트의 `server/` Spring Boot API 구조 분석
   - 서버 코드 연결 관계 파악 (Controller → Service → Repository)
   - DB 스키마 연결 추적
7. **보고서 생성**: 
   - 분석 결과를 구조화된 마크다운으로 출력
   - 보고서는 반드시 한글로 작성
   - 관련된 플로우 구조 트리 형식으로 표시
   - 파일명은 타임스탬프를 포함하여 중복 및 덮어쓰기를 방지

## 출력 형식

### 파일 저장 위치
```
analysis-reports/github-issue-[번호]-[타임스탬프]-analysis.md
analysis-reports/github-pr-[번호]-[타임스탬프]-analysis.md
```

### 파일명 예시
```****
analysis-reports/github-issue-21-20250920-145912-analysis.md
analysis-reports/github-pr-456-20250920-145912-analysis.md
```

### 보고서 구조
```markdown
# 코드 플로우 분석 보고서

## 분석 대상
- **URL**: [GitHub Issue/PR URL]
- **제목**: [Issue/PR 제목]
- **분석 시간**: YYYY-MM-DD HH:MM:SS

## 플로우 구조
```
clientv/lib/main.dart:15 (MyApp)
├── clientv/lib/screens/home_screen.dart:25 (HomeScreen)
│   ├── Flutter Widget Tree:
│   │   ├── Scaffold
│   │   │   ├── AppBar (title: "사용자 관리")
│   │   │   └── Body
│   │   │       ├── UserListWidget:42
│   │   │       └── FloatingActionButton (onPressed: _createUser)
│   │   └── API Calls:
│   │       ├── GET /api/users (UserListWidget:67)
│   │       │   └── server/routes/user.ts:45
│   │       │       └── server/services/userService.ts:32
│   │       │           └── server/models/User.ts:25
│   │       │               └── DB: users.sql (SELECT query)
│   │       └── POST /api/users/create (_createUser:89)
│   │           └── server/routes/user.ts:23
│   │               └── server/services/userService.ts:15
│   │                   └── server/models/User.ts:8
│   │                       └── DB: users.sql (CREATE TABLE)
│   └── Navigation:
│       └── clientv/router.ts:45 → /user-detail/:id
│           └── clientv/lib/screens/user_detail_screen.dart:15 (UserDetailScreen)
```

## 잠재적 이슈
- 발견된 문제점들
- 개선 제안사항

## 상세 분석
- 파일별 변경사항
- 의존성 분석
- 영향 범위 평가
```

## 분석 범위

### 지원하는 분석
- **Flutter Widget Tree**: 위젯 계층 구조 및 상태 관리
- **UI 컴포넌트**: StatefulWidget, StatelessWidget 분석
- **Router 분석**: Flutter 라우팅 및 네비게이션 로직
- **API 호출**: HTTP 클라이언트 (dio, http) 요청 패턴
- **서버 로직**: 비즈니스 로직 처리 흐름
- **데이터베이스**: ORM/SQL 쿼리 연결

### 특화 분석
- **버그 수정 Issue/PR**: 문제 발생 지점 및 영향 범위 특정
- **기능 추가 Issue/PR**: 구현 필요 지점 및 의존성 파악

## 제약사항

- **파일 크기 제한**: 10MB 이상 파일은 분석에서 제외
- **API 제한율**: GitHub API rate limit 준수 (5000 req/hour)
- **분석 시간**: 최대 5분 제한
- **권한**: Public 레포지토리 또는 접근 권한이 있는 Private 레포지토리만 분석 가능

## 사용 예시

```bash
# GitHub Issue 분석
/analyze-github-url
# 입력 프롬프트: https://github.com/owner/repo/issues/123

# GitHub PR 분석
/analyze-github-url
# 입력 프롬프트: https://github.com/owner/repo/pull/456
```

## 연관 명령어

- `/export-to-slack`: 생성된 분석 보고서를 Slack으로 전송
- `/analyze-repo`: Slack Bot을 통한 레포지토리 분석 (서버 환경)

## 기술적 구현

- **GitHub 데이터 수집**: GitHub MCP 도구를 통한 Issue/PR 정보 수집
- **현재 프로젝트 분석**:
  - **Flutter 앱**: `clientv/` 디렉토리의 Dart 코드 구조 분석
  - **Spring Boot 서버**: `server/` 디렉토리의 Java 코드 구조 분석
- **코드 분석 엔진**:
  - **Flutter**: Dart AST 파싱을 통한 위젯 트리 구조 분석
  - **Java**: Spring Boot annotation 기반 API 엔드포인트 추적
- **의존성 추적**:
  - Flutter: pubspec.yaml, import/export 관계
  - Java: build.gradle, @Autowired, @Service, @Repository 관계
- **플로우 매핑**:
  - 위젯 트리 → HTTP 클라이언트 → REST API → 서비스 로직 → 데이터베이스
- **출력**: 현재 프로젝트 구조를 반영한 분석 보고서