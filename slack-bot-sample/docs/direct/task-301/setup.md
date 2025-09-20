# TASK-301: Slack Bot 기본 설정 - 직접 구현

## 1. 구현 요구사항

### 1.1 Slack Bolt Framework 설정
- @slack/bolt 프레임워크 설치 및 설정
- App Token과 Bot Token 환경 변수 설정
- Socket Mode 활성화 (개발용)

### 1.2 Slack App 인증 및 권한 설정
- OAuth 토큰 검증
- 필요한 Bot Scope 권한 설정:
  - `commands` (슬래시 명령어)
  - `chat:write` (메시지 전송)
  - `channels:read` (채널 정보 읽기)
  - `users:read` (사용자 정보 읽기)

### 1.3 워크스페이스 허용 목록 관리
- 허용된 워크스페이스 ID 목록 관리
- 미승인 워크스페이스 접근 차단
- 워크스페이스 검증 미들웨어

### 1.4 기본 이벤트 핸들러 설정
- 앱 시작 로그
- 기본 ping-pong 응답
- 에러 핸들링

## 2. 구현 파일

### 2.1 SlackBot 클래스
- `src/slack/SlackBot.ts`
- Slack App 초기화 및 관리
- 이벤트 핸들러 등록

### 2.2 설정 파일
- `.env` 환경 변수 추가
- `src/slack/config.ts` - Slack 관련 설정

### 2.3 미들웨어
- `src/slack/middleware/WorkspaceAuth.ts`
- 워크스페이스 인증 미들웨어

## 3. 테스트 요구사항

### 3.1 연결 테스트
- Slack API 연결 확인
- Bot Token 유효성 검증
- Socket Mode 연결 확인

### 3.2 권한 테스트
- 필요한 스코프 권한 확인
- 미승인 워크스페이스 차단 확인

### 3.3 기본 응답 테스트
- ping 메시지에 대한 pong 응답
- 앱 멘션에 대한 기본 응답

## 4. 완료 조건

- [ ] Slack Bot이 정상 연결되어 온라인 상태
- [ ] 허용된 워크스페이스에서만 동작
- [ ] 기본 ping-pong 명령어 응답
- [ ] 모든 필요 권한 획득
- [ ] 에러 로깅 정상 동작