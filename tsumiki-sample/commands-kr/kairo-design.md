# kairo-design

## 목적
승인된 요건 정의서를 바탕으로 기술 설계 문서를 생성합니다. 데이터 흐름도, TypeScript 인터페이스, 데이터베이스 스키마, API 엔드포인트를 포함한 포괄적인 설계를 수행합니다.

## 전제 조건
- `docs/spec/`에 요건 정의서가 존재해야 함
- 요건이 사용자에 의해 승인되어 있어야 함

## 실행 내용

1. **요건 분석**
   - 요건 정의서 검토
   - 기능 요건과 비기능 요건 정리
   - 시스템 경계 명확화

2. **아키텍처 설계**
   - 시스템 전체 아키텍처 결정
   - 프론트엔드/백엔드 분리
   - 마이크로서비스 필요성 검토

3. **데이터 흐름도 작성**
   - Mermaid 문법으로 데이터 흐름 시각화
   - 사용자 상호작용 흐름
   - 시스템 간 데이터 흐름

4. **TypeScript 인터페이스 정의**
   - 엔티티 타입 정의
   - API 요청/응답 타입 정의
   - 공통 타입 정의

5. **데이터베이스 스키마 설계**
   - 테이블 정의
   - 관계성 정의
   - 인덱스 전략
   - 정규화 수준 결정

6. **API 엔드포인트 설계**
   - RESTful API 설계
   - 엔드포인트 네이밍 규칙
   - 적절한 HTTP 메서드 사용
   - 요청/응답 구조

7. **파일 생성**
   - `docs/design/{요건명}/` 디렉토리에 다음 파일 생성:
     - `architecture.md` - 아키텍처 개요
     - `dataflow.md` - 데이터 흐름도
     - `interfaces.ts` - TypeScript 타입 정의
     - `database-schema.sql` - DB 스키마
     - `api-endpoints.md` - API 사양

## 출력 형식 예시

### architecture.md
```markdown
# {요건명} 아키텍처 설계

## 시스템 개요
{시스템 개요 설명}

## 아키텍처 패턴
- 패턴: {선택한 패턴}
- 이유: {선택 이유}

## 컴포넌트 구성
### 프론트엔드
- 프레임워크: {사용 프레임워크}
- 상태 관리: {상태 관리 방법}

### 백엔드
- 프레임워크: {사용 프레임워크}
- 인증 방식: {인증 방법}

### 데이터베이스
- DBMS: {사용 DBMS}
- 캐시: {캐시 전략}
```

### dataflow.md
```markdown
# 데이터 흐름도

## 사용자 상호작용 흐름
\`\`\`mermaid
flowchart TD
    A[사용자] --> B[프론트엔드]
    B --> C[API 게이트웨이]
    C --> D[백엔드]
    D --> E[데이터베이스]
\`\`\`

## 데이터 처리 흐름
\`\`\`mermaid
sequenceDiagram
    participant U as 사용자
    participant F as 프론트엔드
    participant B as 백엔드
    participant D as 데이터베이스
    
    U->>F: 액션
    F->>B: API 요청
    B->>D: 쿼리 실행
    D-->>B: 결과 반환
    B-->>F: 응답
    F-->>U: 화면 갱신
\`\`\`
```

### interfaces.ts
```typescript
// 엔티티 정의
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// API 요청/응답
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### database-schema.sql
```sql
-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
```

### api-endpoints.md
```markdown
# API 엔드포인트 사양

## 인증
### POST /auth/login
요청:
\`\`\`json
{
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

응답:
\`\`\`json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": { ... }
  }
}
\`\`\`

## 사용자 관리
### GET /users/:id
### POST /users
### PUT /users/:id
### DELETE /users/:id
```

## 실행 후 확인
- 생성된 파일 목록 표시
- 설계의 주요 포인트 요약 표시
- 사용자 확인을 위한 메시지 표시
