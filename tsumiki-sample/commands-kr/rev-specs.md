# rev-specs

## 목적

기존 코드베이스로부터 포괄적인 테스트 케이스와 명세서를 역생성합니다. 구현된 비즈니스 로직, API 동작, UI 컴포넌트의 동작을 분석하여 누락된 테스트 케이스를 식별·생성하고, 명세서로 문서화합니다.

## 전제 조건

- 분석 대상 코드베이스가 존재해야 함
- `docs/reverse/` 디렉토리가 존재해야 함 (없는 경우 생성)
- 가능하면 사전에 `rev-requirements.md`, `rev-design.md`를 실행해 둘 것

## 실행 내용

1. **기존 테스트 분석**
   - 단위 테스트(Unit Test) 구현 현황 확인
   - 통합 테스트(Integration Test) 구현 현황 확인
   - E2E 테스트(End-to-End Test) 구현 현황 확인
   - 테스트 커버리지 측정

2. **구현 코드로부터 테스트 케이스 역생성**
   - 함수·메서드의 매개변수·반환값으로부터 테스트 케이스 생성
   - 조건 분기로부터 경계값 테스트 생성
   - 오류 처리로부터 예외 케이스 테스트 생성
   - 데이터베이스 작업으로부터 데이터 테스트 생성

3. **API 명세로부터 테스트 케이스 생성**
   - 각 엔드포인트의 정상 케이스 테스트
   - 인증·인가 테스트
   - 유효성 검사 오류 테스트
   - HTTP 상태 코드 테스트

4. **UI 컴포넌트로부터 테스트 케이스 생성**
   - 컴포넌트 렌더링 테스트
   - 사용자 상호작용 테스트
   - 상태 변경 테스트
   - 속성 변경 테스트

5. **성능·보안 테스트 케이스 생성**
   - 부하 테스트 시나리오
   - 보안 취약점 테스트
   - 응답 시간 테스트

6. **테스트 명세서 생성**
   - 테스트 계획서
   - 테스트 케이스 목록
   - 테스트 환경 명세
   - 테스트 절차서

7. **파일 생성**
   - `docs/reverse/{프로젝트명}-test-specs.md` - 테스트 명세서
   - `docs/reverse/{프로젝트명}-test-cases.md` - 테스트 케이스 목록
   - `docs/reverse/tests/` - 생성된 테스트 코드

## 출력 형식 예시

### test-specs.md

```markdown
# {프로젝트명} 테스트 명세서 (역생성)

## 분석 개요

**분석 일시**: {실행일시}
**대상 코드베이스**: {경로}
**테스트 커버리지**: {현재 커버리지}%
**생성 테스트 케이스 수**: {생성수}개
**구현 권장 테스트 수**: {권장수}개

## 현재 테스트 구현 현황

### 테스트 프레임워크
- **단위 테스트**: {Jest/Vitest/pytest 등}
- **통합 테스트**: {Supertest/TestContainers 등}
- **E2E 테스트**: {Cypress/Playwright 등}
- **코드 커버리지**: {istanbul/c8 등}

### 테스트 커버리지 상세

| 파일/디렉토리 | 라인 커버리지 | 분기 커버리지 | 함수 커버리지 |
|--------------|--------------|--------------|--------------|
| src/auth/ | 85% | 75% | 90% |
| src/users/ | 60% | 45% | 70% |
| src/components/ | 40% | 30% | 50% |
| **전체** | **65%** | **55%** | **75%** |

### 테스트 카테고리별 구현 현황

#### 단위 테스트
- [x] **인증 서비스**: auth.service.spec.ts
- [x] **사용자 서비스**: user.service.spec.ts
- [ ] **데이터 변환 유틸리티**: 미구현
- [ ] **유효성 검사 도우미**: 미구현

#### 통합 테스트
- [x] **인증 API**: auth.controller.spec.ts
- [ ] **사용자 관리 API**: 미구현
- [ ] **데이터베이스 작업**: 미구현

#### E2E 테스트
- [ ] **사용자 로그인 플로우**: 미구현
- [ ] **데이터 조작 플로우**: 미구현
- [ ] **오류 처리**: 미구현

## 생성된 테스트 케이스

### API 테스트 케이스

#### POST /auth/login - 로그인 인증

**정상 케이스 테스트**
```typescript
describe('POST /auth/login', () => {
  it('유효한 인증 정보로 로그인 성공', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  it('JWT 토큰이 올바른 형식으로 반환됨', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send(validCredentials);
    
    const token = response.body.data.token;
    expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
  });
});
```

**예외 케이스 테스트**
```typescript
describe('POST /auth/login - 예외 케이스', () => {
  it('유효하지 않은 이메일 주소로 오류', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'invalid-email',
        password: 'password123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('존재하지 않는 사용자로 오류', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('비밀번호 오류로 오류', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
```

**경계값 테스트**
```typescript
describe('POST /auth/login - 경계값', () => {
  it('최소 문자수 비밀번호로 테스트', async () => {
    // 8자 (최소 요구사항)
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: '12345678'
      });
    
    expect(response.status).toBe(200);
  });

  it('최대 문자수 이메일 주소로 테스트', async () => {
    // 255자 (최대 요구사항)
    const longEmail = 'a'.repeat(243) + '@example.com';
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: longEmail,
        password: 'password123'
      });
    
    expect(response.status).toBe(400);
  });
});
```

### UI 컴포넌트 테스트 케이스

#### LoginForm 컴포넌트

**렌더링 테스트**
```typescript
import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('필요한 요소가 표시됨', () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('초기 상태에서 오류 메시지가 숨겨짐', () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    
    expect(screen.queryByText(/오류/)).not.toBeInTheDocument();
  });
});
```

**사용자 상호작용 테스트**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm - 사용자 상호작용', () => {
  it('폼 제출 시 onSubmit이 호출됨', async () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    
    await userEvent.type(screen.getByLabelText('이메일 주소'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('유효성 검사 오류 시 제출되지 않음', async () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('이메일 주소는 필수입니다')).toBeInTheDocument();
  });
});
```

### 서비스 계층 테스트 케이스

#### AuthService 단위 테스트

```typescript
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';

jest.mock('./user.repository');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService(mockUserRepository);
  });

  describe('login', () => {
    it('유효한 인증 정보로 사용자 정보와 토큰을 반환', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        hashedPassword: 'hashed_password'
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
      jest.spyOn(authService, 'generateToken').mockReturnValue('mock_token');

      const result = await authService.login('test@example.com', 'password');

      expect(result).toEqual({
        user: { id: '1', email: 'test@example.com' },
        token: 'mock_token'
      });
    });

    it('존재하지 않는 사용자로 오류를 던짐', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

## 성능 테스트 케이스

### 부하 테스트

```typescript
describe('성능 테스트', () => {
  it('로그인 API - 100 동시 연결 테스트', async () => {
    const promises = Array.from({ length: 100 }, () =>
      request(app).post('/auth/login').send(validCredentials)
    );

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // 모든 요청이 성공
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // 응답 시간이 5초 이내
    expect(endTime - startTime).toBeLessThan(5000);
  });

  it('데이터베이스 - 대량 데이터 검색 성능', async () => {
    // 1000개의 테스트 데이터 생성
    await createTestData(1000);

    const startTime = Date.now();
    const response = await request(app)
      .get('/users')
      .query({ limit: 100, offset: 0 });
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
  });
});
```

### 보안 테스트

```typescript
describe('보안 테스트', () => {
  it('SQL 인젝션 대책', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: maliciousInput,
        password: 'password'
      });

    // 시스템이 정상적으로 동작하고 데이터베이스가 손상되지 않음
    expect(response.status).toBe(400);
    
    // 사용자 테이블이 여전히 존재하는지 확인
    const usersResponse = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer ' + validToken);
    expect(usersResponse.status).not.toBe(500);
  });

  it('XSS 대책', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/users')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
        name: xssPayload,
        email: 'test@example.com'
      });

    // 응답에서 스크립트가 이스케이프됨
    expect(response.body.data.name).not.toContain('<script>');
    expect(response.body.data.name).toContain('&lt;script&gt;');
  });
});
```

## E2E 테스트 케이스

### Playwright/Cypress 테스트 시나리오

```typescript
// 사용자 로그인 플로우 E2E 테스트
describe('사용자 로그인 플로우', () => {
  it('정상적인 로그인부터 대시보드 표시까지', async () => {
    await page.goto('/login');
    
    // 로그인 폼 입력
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // 대시보드로 리다이렉트
    await page.waitForURL('/dashboard');
    
    // 사용자 정보 표시 확인
    await expect(page.locator('[data-testid="user-name"]')).toContainText('테스트 사용자');
    
    // 로그아웃 기능 확인
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/login');
  });

  it('로그인 실패 시 오류 표시', async () => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // 오류 메시지 표시 확인
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('인증 정보가 올바르지 않습니다');
  });
});
```

## 테스트 환경 설정

### 데이터베이스 테스트 설정

```typescript
// 테스트용 데이터베이스 설정
beforeAll(async () => {
  // 테스트용 데이터베이스 연결
  await setupTestDatabase();
  
  // 마이그레이션 실행
  await runMigrations();
});

beforeEach(async () => {
  // 각 테스트 전에 데이터를 정리
  await cleanupDatabase();
  
  // 기본 테스트 데이터 삽입
  await seedTestData();
});

afterAll(async () => {
  // 테스트용 데이터베이스 연결 해제
  await teardownTestDatabase();
});
```

### 모의 설정

```typescript
// 외부 서비스의 모의
jest.mock('./email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue(true)
  }))
}));

// 환경 변수의 모의
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
```

## 부족한 테스트의 우선순위

### 높은 우선순위 (즉시 구현 권장)
1. **E2E 테스트 스위트** - 사용자 플로우 전체의 동작 보장
2. **API 통합 테스트** - 백엔드 API 전체의 테스트
3. **보안 테스트** - 취약점 대책의 검증

### 중간 우선순위 (다음 스프린트에서 구현)
1. **성능 테스트** - 부하·응답 시간 테스트
2. **UI 컴포넌트 테스트** - 프론트엔드 동작 보장
3. **데이터베이스 테스트** - 데이터 무결성 테스트

### 낮은 우선순위 (지속적 개선으로 구현)
1. **브라우저 호환성 테스트** - 여러 브라우저에서의 동작 확인
2. **접근성 테스트** - a11y 대응 확인
3. **국제화 테스트** - 다국어 대응 확인

```

### test-cases.md

```markdown
# {프로젝트명} 테스트 케이스 목록 (역생성)

## 테스트 케이스 개요

| ID | 테스트명 | 카테고리 | 우선순위 | 구현 현황 | 추정 공수 |
|----|----------|----------|----------|-----------|-----------|
| TC-001 | 로그인 정상 케이스 | API | 높음 | ✅ | 2h |
| TC-002 | 로그인 예외 케이스 | API | 높음 | ✅ | 3h |
| TC-003 | E2E 로그인 플로우 | E2E | 높음 | ❌ | 4h |
| TC-004 | 성능 부하 테스트 | 성능 | 중간 | ❌ | 6h |

## 상세 테스트 케이스

### TC-001: 로그인 API 정상 케이스 테스트

**테스트 목적**: 유효한 인증 정보로의 로그인 기능을 검증

**사전 조건**:
- 테스트 사용자가 데이터베이스에 존재함
- 비밀번호가 올바르게 해시화됨

**테스트 절차**:
1. POST /auth/login에 요청 전송
2. 유효한 email, password를 포함한 JSON 전송
3. 응답 확인

**기대 결과**:
- HTTP 상태: 200
- success: true
- data.token: JWT 형식의 토큰
- data.user: 사용자 정보

**구현 파일**: `auth.controller.spec.ts`

### TC-002: 로그인 API 예외 케이스 테스트

**테스트 목적**: 유효하지 않은 인증 정보로의 적절한 오류 처리를 검증

**테스트 케이스**:
1. 존재하지 않는 이메일 주소
2. 유효하지 않은 비밀번호
3. 잘못된 이메일 형식
4. 빈 문자열·null 값
5. SQL 인젝션 공격

**기대 결과**:
- 적절한 HTTP 상태 코드
- 통일된 오류 응답 형식
- 보안 취약점 없음

**구현 현황**: ✅ 부분적 구현

```

## 테스트 코드 생성 알고리즘

### 1. 정적 분석을 통한 테스트 케이스 추출

```
1. 함수 시그니처 분석 → 매개변수·반환값의 테스트 케이스
2. 조건 분기 분석 → 분기 커버리지 테스트 케이스
3. 예외 처리 분석 → 예외 케이스 테스트 케이스
4. 데이터베이스 접근 분석 → 데이터 테스트 케이스
```

### 2. 동적 분석을 통한 테스트 생성

```
1. API 호출 로그 → 실제 사용 패턴 테스트
2. 사용자 조작 로그 → E2E 테스트 시나리오
3. 성능 로그 → 부하 테스트 시나리오
```

### 3. 테스트 커버리지 갭 분석

```
1. 현재 커버리지 측정
2. 미테스트 행·분기의 특정
3. 크리티컬 패스의 특정
4. 리스크 기반 우선순위 설정
```

## 실행 명령어 예시

```bash
# 전체 분석 (모든 테스트 케이스 생성)
claude code rev-specs

# 특정 테스트 카테고리만 생성
claude code rev-specs --type unit
claude code rev-specs --type integration
claude code rev-specs --type e2e

# 특정 파일/디렉토리를 대상
claude code rev-specs --path ./src/auth

# 테스트 코드의 실제 생성과 출력
claude code rev-specs --generate-code

# 커버리지 리포트와 함께 분석
claude code rev-specs --with-coverage

# 우선순위 필터링
claude code rev-specs --priority high
```

## 실행 후 확인

- 현재 테스트 커버리지와 부족한 부분의 상세 리포트 표시
- 생성된 테스트 케이스 수와 추정 구현 공수를 표시
- 우선순위가 설정된 구현 권장 목록을 제시
- 테스트 환경의 설정 요구사항과 권장 도구를 제안
- CI/CD 파이프라인으로의 통합안을 제시
