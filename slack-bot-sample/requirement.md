# GitHub 소스코드 플로우 분석 Slack Bot

> Claude Code의 /kairo-requirements 명령어 input용 요구사항 문서

## 프로젝트 개요

GitHub Issue/PR을 분석하여 관련 소스코드의 전체 플로우를 자동으로 파악하고, 분석 결과를 Slack Bot을 통해 제공하는 도구

## 핵심 기능

### 1. 소스코드 플로우 분석
- **분석 시작점**: `clientv/router.ts`
- **분석 범위**: Client → API → Server → DB까지 전체 데이터 플로우
- **출력 형태**: 계층적 트리 구조 (mermaid 다이어그램 또는 ASCII 트리)
- **특화 분석**:
  - 버그 수정 Issue/PR: 문제 발생 지점 및 영향 범위 특정
  - 기능 추가 Issue/PR: 구현 필요 지점 및 의존성 파악

### 2. 기술적 요구사항

#### GitHub 연동
- **API 인증**: GitHub Personal Access Token 또는 GitHub App
- **권한 처리**: Public/Private 레포지토리 접근 권한 관리
- **데이터 수집**: Issue/PR 메타데이터, diff, 코멘트 분석

#### 코드 분석 엔진
- **파싱 전략**: AST(Abstract Syntax Tree) 기반 코드 분석
- **의존성 추적**: Import/Export 관계 매핑
- **API 호출 추적**: HTTP 요청/응답 플로우 매핑
- **DB 쿼리 추적**: ORM/SQL 쿼리 연결 관계 파악

#### 성능 및 제약사항
- **대용량 프로젝트**: 파일 크기 제한 (예: 10MB 이상 파일 스킵)
- **API 제한율**: GitHub API rate limit 대응 (5000 req/hour)
- **분석 시간**: 최대 분석 시간 제한 (예: 5분)

### 3. Slack Bot 인터페이스

#### 명령어 구조
```
/analyze-repo [github-url] [options]

Options:
  --type=issue|pr          # 분석 대상 타입 (기본값: 자동감지)
  --depth=shallow|deep     # 분석 깊이 (기본값: shallow)
  --format=tree|diagram    # 출력 형식 (기본값: tree)
```

#### 응답 형식
```
📊 **코드 플로우 분석 결과**
🔗 **대상**: [Issue/PR 제목]
⏱️ **분석 시간**: 2024-03-15 14:30:25

🌳 **플로우 구조**:
```
clientv/router.ts:45
├── POST /api/users/create
│   └── server/routes/user.ts:23
│       └── server/services/userService.ts:15
│           └── server/models/User.ts:8
│               └── DB: users.sql (CREATE TABLE)
└── GET /api/users/:id
    └── server/routes/user.ts:45
        └── server/services/userService.ts:32
            └── server/models/User.ts:25
                └── DB: users.sql (SELECT query)
```

⚠️ **잠재적 이슈**:
- user.ts:23에서 입력 검증 누락
- userService.ts:15에서 에러 처리 부재

📄 **상세 분석 보고서**: [파일명_20240315_1430.md]
```

### 4. Claude Code Commands

#### /analyze-github-url
```bash
# GitHub URL 분석 및 소스코드 플로우 파악
# Input: GitHub Issue/PR URL
# Output: 분석 보고서 마크다운 파일 (타임스탬프 포함)
```

#### /export-to-slack
```bash
# 분석 보고서를 Slack으로 전송
# Input: 분석 보고서 파일 경로
# Output: Slack 채널로 포맷된 메시지 전송
```

## 구현 우선순위

### Phase 1: 기본 분석 엔진
- [ ] GitHub API 연동
- [ ] 기본 코드 파싱 (router.ts → API endpoints)
- [ ] 간단한 트리 구조 출력

### Phase 2: 플로우 추적 확장
- [ ] API → Server 코드 매핑
- [ ] DB 스키마 연결 추적
- [ ] 의존성 그래프 생성

### Phase 3: Slack Bot 통합
- [ ] Slack Bot 설정 및 배포
- [ ] 명령어 파싱 및 응답
- [ ] 에러 처리 및 사용자 피드백

### Phase 4: 고도화
- [ ] 버그 영향 범위 분석
- [ ] 성능 최적화
- [ ] 다양한 프로젝트 구조 지원

## 기술 스택

### 백엔드
- **언어**: Node.js/TypeScript 또는 Python
- **GitHub API**: Octokit.js 또는 PyGithub
- **코드 분석**: TypeScript Compiler API 또는 tree-sitter

### Slack Bot
- **프레임워크**: Slack Bolt Framework
- **배포**: AWS Lambda + API Gateway 또는 Railway/Vercel

### 저장소
- **캐싱**: Redis (분석 결과 임시 저장)
- **로깅**: 분석 로그 및 에러 추적

## 보안 및 인증

- **GitHub Token**: 환경변수로 관리
- **Slack Token**: Slack App 인증 토큰
- **접근 제어**: 허용된 Slack 워크스페이스만 사용 가능