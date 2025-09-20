# GitHub 소스코드 플로우 분석 Slack Bot

GitHub Issue/PR을 분석하여 관련 소스코드의 전체 플로우를 자동으로 파악하고, 분석 결과를 Slack Bot을 통해 제공하는 도구입니다.

## 🌟 주요 기능

- **GitHub 연동**: Issue/PR 자동 분석
- **코드 플로우 추적**: Client → API → Server → DB 전체 흐름 매핑
- **Slack Bot**: 실시간 분석 결과 제공
- **Claude Code 통합**: 개발 환경에서 직접 사용 가능
- **AST 기반 분석**: TypeScript Compiler API 활용

## 🚀 빠른 시작

### 필요 조건

- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값들을 설정
```

### 2. 개발 서버 실행

```bash
# 개발 모드 실행
npm run dev

# 빌드 후 실행
npm run build
npm start
```

### 3. Docker로 실행

```bash
# 전체 스택 실행 (PostgreSQL + Redis 포함)
docker-compose up -d

# 개발 환경 (pgAdmin, Redis Commander 포함)
docker-compose --profile dev up -d
```

## 📋 주요 환경 변수

```bash
# GitHub
GITHUB_TOKEN=your_github_token
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret

# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost:5432/github_flow_analyzer
REDIS_URL=redis://localhost:6379

# 보안
JWT_SECRET=your_jwt_secret_32_characters_min
ENCRYPTION_KEY=your_32_character_encryption_key
```

## 🧪 테스트 및 품질 관리

```bash
# 테스트
npm test
npm run test:coverage

# 코드 품질
npm run lint
npm run format
```

## 📚 사용법

### Slack Bot 명령어

```bash
/analyze-repo https://github.com/owner/repo/issues/123
/analyze-repo https://github.com/owner/repo/pull/456 --type=pr --depth=deep
```

### Claude Code 명령어

```bash
/analyze-github-url
/export-to-slack
```