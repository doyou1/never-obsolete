# direct-setup

## 목적

DIRECT 작업의 설정 작업을 실행합니다. 설계 문서를 기반으로 환경 구축, 설정 파일 생성, 의존성 설치 등을 수행합니다.

## 전제 조건

- 작업 ID가 제공되어야 함
- 관련된 설계 문서가 존재해야 함
- 필요한 권한과 환경이 준비되어 있어야 함

## 실행 내용

1. **설계 문서 확인**
   - `docs/design/{요구사항명}/architecture.md` 확인
   - `docs/design/{요구사항명}/database-schema.sql` 확인
   - 기타 관련 설계 문서 확인

2. **설정 작업 실행**
   - 환경 변수 설정
   - 설정 파일 생성/업데이트
   - 의존성 설치
   - 데이터베이스 초기화
   - 서비스 시작 설정
   - 권한 설정

3. **작업 기록 생성**
   - 실행한 명령어 기록
   - 변경한 설정 기록
   - 발생한 문제와 해결 방법 기록

## 출력 위치

작업 기록은 `docs/implements/{TASK-ID}/` 디렉토리에 다음 파일로 생성됩니다:
- `setup-report.md`: 설정 작업 실행 기록

## 출력 형식 예시

````markdown
# {TASK-ID} 설정 작업 실행

## 작업 개요

- **작업 ID**: {TASK-ID}
- **작업 내용**: {설정 작업 개요}
- **실행 일시**: {실행 일시}
- **실행자**: {실행자}

## 설계 문서 참조

- **참조 문서**: {참조한 설계 문서 목록}
- **관련 요구사항**: {REQ-XXX, REQ-YYY}

## 실행한 작업

### 1. 환경 변수 설정

```bash
# 실행한 명령어
export NODE_ENV=development
export DATABASE_URL=postgresql://localhost:5432/mydb
```
````

**설정 내용**:

- NODE_ENV: 개발 환경으로 설정
- DATABASE_URL: PostgreSQL 데이터베이스 URL

### 2. 설정 파일 생성

**생성 파일**: `config/database.json`

```json
{
  "development": {
    "host": "localhost",
    "port": 5432,
    "database": "mydb"
  }
}
```

### 3. 의존성 설치

```bash
# 실행한 명령어
npm install express pg
```

**설치 내용**:

- express: 웹 프레임워크
- pg: PostgreSQL 클라이언트

### 4. 데이터베이스 초기화

```bash
# 실행한 명령어
createdb mydb
psql -d mydb -f database-schema.sql
```

**실행 내용**:

- 데이터베이스 생성
- 스키마 적용

## 작업 결과

- [ ] 환경 변수 설정 완료
- [ ] 설정 파일 생성 완료
- [ ] 의존성 설치 완료
- [ ] 데이터베이스 초기화 완료
- [ ] 서비스 시작 설정 완료

## 발생한 문제와 해결 방법

### 문제1: {문제 개요}

- **발생 상황**: {문제가 발생한 상황}
- **오류 메시지**: {오류 메시지}
- **해결 방법**: {해결 방법}

## 다음 단계

- `direct-verify.md`를 실행하여 설정 확인
- 필요에 따라 설정 조정

## 실행 후 확인
- `docs/implements/{TASK-ID}/setup-report.md` 파일이 생성되었는지 확인
- 설정이 올바르게 적용되었는지 확인
- 다음 단계(direct-verify) 준비가 완료되었는지 확인

## 디렉토리 생성

실행 전 필요한 디렉토리를 생성하세요:
```bash
mkdir -p docs/implements/{TASK-ID}
```
