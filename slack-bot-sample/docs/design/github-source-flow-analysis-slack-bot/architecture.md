# GitHub 소스코드 플로우 분석 Slack Bot 아키텍처 설계

## 시스템 개요

GitHub Issue/PR을 분석하여 소스코드 플로우를 추적하고 Slack Bot을 통해 결과를 제공하는 시스템입니다.

### 주요 구성 요소
- **GitHub API 연동 모듈**: Issue/PR 정보 및 소스코드 수집
- **코드 분석 엔진**: AST 기반 플로우 추적 및 의존성 분석
- **Slack Bot 인터페이스**: 명령어 처리 및 결과 전송
- **Claude Code Commands**: 개발 환경 통합 명령어

## 아키텍처 패턴

- **패턴**: Clean Architecture + Microservices
- **이유**:
  - 독립적인 배포 및 확장성
  - 외부 API 의존성 격리
  - 테스트 용이성
  - 각 모듈의 책임 분리

## 컴포넌트 구성

### 백엔드 (Node.js/TypeScript)
- **프레임워크**: Express.js
- **런타임**: Node.js 18+
- **아키텍처**: Layered Architecture
- **상태 관리**: 상태 비저장 (Stateless)
- **인증 방식**:
  - GitHub Personal Access Token
  - Slack App Token
  - 환경변수 기반 보안 관리

### 코드 분석 엔진
- **파싱**: TypeScript Compiler API
- **의존성 추적**: AST (Abstract Syntax Tree) 기반
- **플로우 매핑**:
  - Import/Export 관계 분석
  - HTTP 요청/응답 추적
  - 데이터베이스 쿼리 연결 분석

### 외부 서비스 연동
- **GitHub API**:
  - REST API v3/v4 (GraphQL)
  - Octokit.js 라이브러리
  - Rate Limiting 대응
- **Slack API**:
  - Slack Bolt Framework
  - Real-time Messaging
  - Interactive Components

### 데이터베이스 & 캐싱
- **주 데이터베이스**: PostgreSQL (분석 결과 저장)
- **캐싱**: Redis (GitHub API 응답, 분석 결과 임시 저장)
- **파일 저장**: 로컬 파일시스템 (마크다운 보고서)

### 배포 환경
- **배포 플랫폼**:
  - AWS Lambda + API Gateway (서버리스)
  - Railway/Vercel (대안)
- **컨테이너**: Docker 지원
- **모니터링**: CloudWatch (AWS) 또는 플랫폼 기본 로깅

## 모듈 설계

### 1. GitHub Integration Layer
```
github/
├── client/           # GitHub API 클라이언트
├── parser/          # 소스코드 파싱
├── analyzer/        # 플로우 분석
└── rate-limiter/    # API 제한율 관리
```

### 2. Code Analysis Engine
```
analysis/
├── ast-parser/      # AST 생성 및 분석
├── flow-tracker/    # 데이터 플로우 추적
├── dependency/      # 의존성 그래프 생성
└── reporter/        # 분석 결과 생성
```

### 3. Slack Bot Interface
```
slack/
├── commands/        # 명령어 처리
├── handlers/        # 이벤트 핸들링
├── formatters/      # 메시지 포맷팅
└── sender/          # 메시지 전송
```

### 4. Claude Code Integration
```
claude-code/
├── commands/        # Command 파일 생성
├── templates/       # 템플릿 관리
└── export/          # Slack 연동 내보내기
```

## 확장성 고려사항

### 수평 확장
- 각 분석 요청을 독립적인 작업으로 처리
- 큐 시스템 도입 가능 (Bull Queue + Redis)
- 분석 엔진의 병렬 처리 지원

### 성능 최적화
- GitHub API 응답 캐싱 (30분 TTL)
- 분석 결과 캐싱 (24시간 TTL)
- 파일 크기 제한 (10MB) 및 스킵 처리
- 분석 시간 제한 (5분) 및 타임아웃 처리

### 보안
- 토큰 암호화 저장
- HTTPS 전용 통신
- 입력 검증 및 SQL 인젝션 방지
- 허용된 워크스페이스만 접근 가능

## 기술 스택 상세

### Core Framework
- **Express.js 4.18+**: 웹 프레임워크
- **TypeScript 5.0+**: 타입 안전성
- **Node.js 18+**: 런타임 환경

### GitHub Integration
- **@octokit/rest**: GitHub REST API 클라이언트
- **@octokit/graphql**: GraphQL API 클라이언트
- **typescript**: TypeScript 컴파일러 API

### Slack Integration
- **@slack/bolt**: Slack Bolt Framework
- **@slack/web-api**: Slack Web API 클라이언트

### 데이터 & 캐싱
- **pg**: PostgreSQL 클라이언트
- **ioredis**: Redis 클라이언트
- **prisma**: ORM (선택사항)

### 개발 & 테스트
- **jest**: 테스트 프레임워크
- **supertest**: API 테스트
- **eslint**: 코드 품질
- **prettier**: 코드 포맷팅

### 배포 & 모니터링
- **serverless**: AWS Lambda 배포
- **winston**: 로깅
- **pino**: 고성능 로깅 (대안)

## 환경 설정

### 환경 변수
```
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_WEBHOOK_SECRET=xxxxxxxxxxxx

# Slack
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxx
SLACK_APP_TOKEN=xapp-xxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# 기타
NODE_ENV=production
LOG_LEVEL=info
MAX_ANALYSIS_TIME=300000
MAX_FILE_SIZE=10485760
```

### 배포 설정
- **AWS Lambda**: 메모리 1GB, 타임아웃 5분
- **API Gateway**: HTTP API, CORS 설정
- **PostgreSQL**: AWS RDS 또는 외부 호스팅
- **Redis**: AWS ElastiCache 또는 외부 호스팅