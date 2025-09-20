# TASK-305: 보안 분석기 - 테스트 케이스

## 1. 보안 취약점 검사 테스트

### TC-305-001: SQL Injection 취약점 검출
**설명**: SQL 쿼리에서 사용자 입력을 직접 사용하는 SQL Injection 취약점을 검출한다
**입력**:
```javascript
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);
```
**예상결과**:
- `vulnerabilityType: 'sql_injection'`
- `severity: 'critical'`
- SQL Injection 취약점으로 분류

### TC-305-002: XSS 취약점 검출
**설명**: DOM에 사용자 입력을 직접 삽입하는 XSS 취약점을 검출한다
**입력**:
```javascript
document.getElementById('content').innerHTML = userInput;
```
**예상결과**:
- `vulnerabilityType: 'xss'`
- `severity: 'high'`
- Cross-Site Scripting 취약점으로 분류

### TC-305-003: Command Injection 취약점 검출
**설명**: 시스템 명령어 실행 시 사용자 입력을 검증 없이 사용하는 취약점을 검출한다
**입력**:
```javascript
exec(`ping ${userInput}`);
```
**예상결과**:
- `vulnerabilityType: 'command_injection'`
- `severity: 'critical'`
- Command Injection 취약점으로 분류

### TC-305-004: Path Traversal 취약점 검출
**설명**: 파일 경로에 사용자 입력을 직접 사용하는 Path Traversal 취약점을 검출한다
**입력**:
```javascript
fs.readFile('./uploads/' + filename, callback);
```
**예상결과**:
- `vulnerabilityType: 'path_traversal'`
- `severity: 'high'`
- Directory Traversal 취약점으로 분류

### TC-305-005: Eval 사용 검출
**설명**: 위험한 `eval()` 함수 사용을 검출한다
**입력**:
```javascript
eval(userCode);
```
**예상결과**:
- `vulnerabilityType: 'code_injection'`
- `severity: 'critical'`
- Code Injection 취약점으로 분류

## 2. 민감 정보 검출 테스트

### TC-305-006: AWS API 키 검출
**설명**: 하드코딩된 AWS Access Key를 검출한다
**입력**:
```javascript
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
```
**예상결과**:
- `dataType: 'api_key'`
- `severity: 'critical'`
- AWS API 키로 분류

### TC-305-007: Google API 키 검출
**설명**: Google API 키 패턴을 검출한다
**입력**:
```javascript
const API_KEY = 'AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe';
```
**예상결과**:
- `dataType: 'api_key'`
- `severity: 'critical'`
- Google API 키로 분류

### TC-305-008: GitHub Personal Access Token 검출
**설명**: GitHub PAT를 검출한다
**입력**:
```javascript
const token = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```
**예상결과**:
- `dataType: 'token'`
- `severity: 'critical'`
- GitHub token으로 분류

### TC-305-009: 데이터베이스 패스워드 검출
**설명**: 하드코딩된 데이터베이스 패스워드를 검출한다
**입력**:
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'admin',
  password: 'secret123',
  database: 'myapp'
};
```
**예상결과**:
- `dataType: 'password'`
- `severity: 'high'`
- 데이터베이스 패스워드로 분류

### TC-305-010: RSA 개인키 검출
**설명**: 하드코딩된 RSA 개인키를 검출한다
**입력**:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4f5wg5l2hKsTeNem/V41fGnJm6gOdrj8ym3rFkEjWT2btYft
...
-----END RSA PRIVATE KEY-----
```
**예상결과**:
- `dataType: 'private_key'`
- `severity: 'critical'`
- RSA 개인키로 분류

### TC-305-011: JWT 시크릿 검출
**설명**: JWT 서명에 사용되는 하드코딩된 시크릿을 검출한다
**입력**:
```javascript
const JWT_SECRET = 'my-super-secret-jwt-key-123';
```
**예상결과**:
- `dataType: 'token'`
- `severity: 'high'`
- JWT 시크릿으로 분류

### TC-305-012: 이메일 주소 검출
**설명**: 코드 내 하드코딩된 이메일 주소를 검출한다
**입력**:
```javascript
const adminEmail = 'admin@company.com';
```
**예상결과**:
- `dataType: 'pii'`
- `severity: 'medium'`
- 개인정보로 분류

## 3. 인증/인가 분석 테스트

### TC-305-013: 약한 인증 검출
**설명**: 약한 인증 메커니즘을 검출한다
**입력**:
```javascript
if (username === 'admin' && password === 'password') {
  return true;
}
```
**예상결과**:
- `issueType: 'weak_auth'`
- `severity: 'high'`
- 하드코딩된 인증 정보 검출

### TC-305-014: 세션 설정 검증
**설명**: 안전하지 않은 세션 설정을 검출한다
**입력**:
```javascript
app.use(session({
  secret: 'keyboard cat',
  secure: false,
  httpOnly: false
}));
```
**예상결과**:
- `issueType: 'insecure_session'`
- `severity: 'medium'`
- 안전하지 않은 세션 설정 검출

### TC-305-015: JWT 검증 누락 검출
**설명**: JWT 토큰 검증이 누락된 엔드포인트를 검출한다
**입력**:
```javascript
app.get('/protected', (req, res) => {
  // JWT 검증 없이 보호된 리소스 접근
  res.json(sensitiveData);
});
```
**예상결과**:
- `issueType: 'missing_auth'`
- `severity: 'high'`
- 인증 누락 검출

### TC-305-016: 권한 검사 누락 검출
**설명**: 관리자 권한이 필요한 기능에서 권한 검사가 누락된 것을 검출한다
**입력**:
```javascript
app.delete('/admin/users/:id', (req, res) => {
  // 관리자 권한 검사 없이 사용자 삭제
  deleteUser(req.params.id);
});
```
**예상결과**:
- `issueType: 'missing_auth'`
- `severity: 'high'`
- 권한 검사 누락 검출

### TC-305-017: JWT 알고리즘 취약점 검출
**설명**: 'none' 알고리즘을 허용하는 JWT 설정을 검출한다
**입력**:
```javascript
jwt.verify(token, secret, { algorithms: ['none', 'HS256'] });
```
**예상결과**:
- `issueType: 'jwt_issue'`
- `severity: 'high'`
- JWT 알고리즘 취약점 검출

## 4. 보안 설정 검증 테스트

### TC-305-018: CORS 설정 검증
**설명**: 안전하지 않은 CORS 설정을 검출한다
**입력**:
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}));
```
**예상결과**:
- 보안 설정 취약점 검출
- `severity: 'medium'`
- 와일드카드 CORS 설정 경고

### TC-305-019: 보안 헤더 누락 검출
**설명**: 중요한 보안 헤더가 누락된 것을 검출한다
**입력**:
```javascript
app.get('/', (req, res) => {
  res.send('Hello World');
  // X-Frame-Options, X-XSS-Protection 등 보안 헤더 누락
});
```
**예상결과**:
- 보안 설정 취약점 검출
- `severity: 'medium'`
- 보안 헤더 누락 경고

### TC-305-020: HTTPS 강제 누락 검출
**설명**: HTTPS 리디렉션이 누락된 것을 검출한다
**입력**:
```javascript
app.listen(80, () => {
  console.log('Server running on HTTP');
});
```
**예상결과**:
- 보안 설정 취약점 검출
- `severity: 'medium'`
- HTTPS 사용 권장

## 5. 암호화 관련 테스트

### TC-305-021: 약한 암호화 알고리즘 검출
**설명**: MD5, SHA1 같은 약한 해시 함수 사용을 검출한다
**입력**:
```javascript
const hash = crypto.createHash('md5').update(password).digest('hex');
```
**예상결과**:
- 암호화 취약점 검출
- `severity: 'medium'`
- 약한 해시 알고리즘 사용 경고

### TC-305-022: 하드코딩된 암호화 키 검출
**설명**: 하드코딩된 암호화 키를 검출한다
**입력**:
```javascript
const encryptionKey = '1234567890abcdef';
const cipher = crypto.createCipher('aes192', encryptionKey);
```
**예상결과**:
- `dataType: 'token'`
- `severity: 'critical'`
- 하드코딩된 암호화 키 검출

### TC-305-023: 안전하지 않은 난수 생성 검출
**설명**: 보안에 적합하지 않은 난수 생성기 사용을 검출한다
**입력**:
```javascript
const token = Math.random().toString(36);
```
**예상결과**:
- 암호화 취약점 검출
- `severity: 'medium'`
- 안전하지 않은 난수 생성 경고

## 6. 파일 업로드 보안 테스트

### TC-305-024: 파일 확장자 검증 누락
**설명**: 파일 업로드 시 확장자 검증이 누락된 것을 검출한다
**입력**:
```javascript
app.post('/upload', (req, res) => {
  const file = req.files.upload;
  file.mv('./uploads/' + file.name); // 확장자 검증 없음
});
```
**예상결과**:
- 파일 업로드 취약점 검출
- `severity: 'high'`
- 파일 확장자 검증 누락

### TC-305-025: 파일 크기 제한 누락
**설명**: 파일 크기 제한이 없는 업로드를 검출한다
**입력**:
```javascript
app.use(fileUpload()); // 파일 크기 제한 없음
```
**예상결과**:
- 파일 업로드 취약점 검출
- `severity: 'medium'`
- 파일 크기 제한 누락

## 7. 데이터베이스 보안 테스트

### TC-305-026: NoSQL Injection 검출
**설명**: MongoDB에서 사용자 입력을 직접 사용하는 NoSQL Injection을 검출한다
**입력**:
```javascript
db.collection.find({ user: req.body.user });
```
**예상결과**:
- `vulnerabilityType: 'nosql_injection'`
- `severity: 'high'`
- NoSQL Injection 취약점 검출

### TC-305-027: 데이터베이스 연결 정보 노출
**설명**: 환경변수가 아닌 하드코딩된 DB 연결 정보를 검출한다
**입력**:
```javascript
mongoose.connect('mongodb://admin:password123@localhost:27017/mydb');
```
**예상결과**:
- `dataType: 'connection_string'`
- `severity: 'high'`
- 데이터베이스 연결 정보 노출

## 8. API 보안 테스트

### TC-305-028: API 키 노출 검출
**설명**: API 응답에 민감한 정보가 포함된 것을 검출한다
**입력**:
```javascript
res.json({
  user: userData,
  apiKey: user.apiKey, // API 키 노출
  internalId: user.internalId
});
```
**예상결과**:
- API 보안 취약점 검출
- `severity: 'high'`
- API 키 노출 경고

### TC-305-029: Rate Limiting 누락 검출
**설명**: API 엔드포인트에 Rate Limiting이 없는 것을 검출한다
**입력**:
```javascript
app.post('/login', (req, res) => {
  // Rate limiting 없는 로그인 엔드포인트
  authenticateUser(req.body);
});
```
**예상결과**:
- API 보안 취약점 검출
- `severity: 'medium'`
- Rate Limiting 누락

## 9. 로깅 보안 테스트

### TC-305-030: 민감 정보 로깅 검출
**설명**: 로그에 민감한 정보가 기록되는 것을 검출한다
**입력**:
```javascript
console.log('User login:', { username, password });
```
**예상결과**:
- 로깅 보안 취약점 검출
- `severity: 'medium'`
- 민감 정보 로깅 경고

### TC-305-031: SQL 쿼리 로깅 검출
**설명**: 로그에 SQL 쿼리가 노출되는 것을 검출한다
**입력**:
```javascript
console.log('Executing query:', query);
db.query(query);
```
**예상결과**:
- 로깅 보안 취약점 검출
- `severity: 'low'`
- SQL 쿼리 로깅 경고

## 10. 의존성 보안 테스트

### TC-305-032: 취약한 의존성 검출
**설명**: 알려진 취약점이 있는 라이브러리 사용을 검출한다
**입력**:
```json
{
  "dependencies": {
    "lodash": "4.17.4"
  }
}
```
**예상결과**:
- 의존성 취약점 검출
- `severity: 'high'`
- 취약한 버전 사용 경고

### TC-305-033: 개발용 의존성 운영 환경 포함 검출
**설명**: 개발용 의존성이 운영 환경에 포함된 것을 검출한다
**입력**:
```json
{
  "dependencies": {
    "nodemon": "^2.0.0",
    "debug": "^4.0.0"
  }
}
```
**예상결과**:
- 의존성 설정 문제 검출
- `severity: 'low'`
- 개발 의존성 분리 권장

## 11. 프레임워크별 보안 테스트

### TC-305-034: Express.js 보안 미들웨어 누락
**설명**: Express.js에서 helmet 같은 보안 미들웨어 사용이 누락된 것을 검출한다
**입력**:
```javascript
const express = require('express');
const app = express();
// helmet 미사용
```
**예상결과**:
- Express 보안 설정 문제 검출
- `severity: 'medium'`
- 보안 미들웨어 사용 권장

### TC-305-035: React XSS 취약점 검출
**설명**: React에서 `dangerouslySetInnerHTML` 사용을 검출한다
**입력**:
```javascript
<div dangerouslySetInnerHTML={{__html: userContent}} />
```
**예상결과**:
- React XSS 취약점 검출
- `severity: 'high'`
- 안전하지 않은 HTML 렌더링 경고

## 12. 모바일 보안 테스트 (React Native)

### TC-305-036: 루트 탐지 우회 검출
**설명**: 루팅/탈옥 탐지 로직이 없는 것을 검출한다
**입력**:
```javascript
// 루트 탐지 로직 없이 민감한 작업 수행
performSensitiveOperation();
```
**예상결과**:
- 모바일 보안 취약점 검출
- `severity: 'medium'`
- 루트 탐지 권장

### TC-305-037: 안전하지 않은 저장소 사용 검출
**설명**: AsyncStorage에 민감한 정보를 평문으로 저장하는 것을 검출한다
**입력**:
```javascript
AsyncStorage.setItem('token', userToken);
```
**예상결과**:
- 모바일 보안 취약점 검출
- `severity: 'medium'`
- 암호화된 저장소 사용 권장

## 13. 클라우드 보안 테스트

### TC-305-038: AWS 설정 취약점 검출
**설명**: 안전하지 않은 S3 버킷 설정을 검출한다
**입력**:
```javascript
const s3 = new AWS.S3({
  params: {
    Bucket: 'mybucket',
    ACL: 'public-read'
  }
});
```
**예상결과**:
- 클라우드 보안 설정 문제 검출
- `severity: 'high'`
- 공개 읽기 권한 경고

### TC-305-039: 환경변수 노출 검출
**설명**: 환경변수가 클라이언트에 노출되는 것을 검출한다
**입력**:
```javascript
const config = {
  apiKey: process.env.SECRET_API_KEY,
  publicKey: process.env.PUBLIC_KEY
};
// 클라이언트로 전송
res.json(config);
```
**예상결과**:
- 환경변수 노출 취약점 검출
- `severity: 'critical'`
- 민감한 환경변수 노출 경고

## 14. 컨테이너 보안 테스트

### TC-305-040: Dockerfile 보안 검사
**설명**: 안전하지 않은 Dockerfile 설정을 검출한다
**입력**:
```dockerfile
FROM ubuntu
USER root
COPY . /app
RUN chmod 777 /app
```
**예상결과**:
- 컨테이너 보안 문제 검출
- `severity: 'medium'`
- 루트 사용자 및 권한 설정 경고

### TC-305-041: 컨테이너 비밀 정보 노출
**설명**: Docker 이미지에 민감한 정보가 포함된 것을 검출한다
**입력**:
```dockerfile
ENV DATABASE_PASSWORD=secret123
```
**예상결과**:
- 컨테이너 보안 문제 검출
- `severity: 'high'`
- 환경변수로 민감 정보 노출 경고

## 15. 보안 분석 통합 테스트

### TC-305-042: 종합 보안 점수 계산
**설명**: 여러 취약점을 종합하여 보안 점수를 계산한다
**입력**:
- Critical 취약점 2개
- High 취약점 3개
- Medium 취약점 5개
**예상결과**:
- `overallSecurityScore: 5` (100 - 2*25 - 3*15 - 5*8)
- `riskLevel: 'critical'`

### TC-305-043: 위험도 분류 테스트
**설명**: 보안 점수에 따른 위험도 분류를 테스트한다
**입력**: 보안 점수 65
**예상결과**:
- `riskLevel: 'medium'`
- 중간 위험도로 분류

### TC-305-044: 오탐 필터링 테스트
**설명**: 주석이나 테스트 코드의 의도적 취약점을 필터링한다
**입력**:
```javascript
// 테스트용 - 실제 운영 코드 아님
const testPassword = 'test123';
```
**예상결과**:
- 오탐으로 분류되어 제외
- 또는 `falsePositive: true`로 표시

### TC-305-045: 규칙 기반 검사 테스트
**설명**: 커스텀 보안 규칙 적용을 테스트한다
**입력**:
```javascript
// 커스텀 규칙: console.log 사용 금지
console.log('Debug info:', userData);
```
**예상결과**:
- 커스텀 규칙 위반 검출
- `severity: 'low'`
- 조직 정책 위반

## 16. 성능 테스트

### TC-305-046: 대용량 파일 처리 성능
**설명**: 큰 파일에 대한 보안 분석 성능을 테스트한다
**입력**: 10,000줄 이상의 JavaScript 파일
**예상결과**:
- 10초 이내 분석 완료
- 메모리 사용량 500MB 이하

### TC-305-047: 동시 분석 성능
**설명**: 여러 파일의 동시 분석 성능을 테스트한다
**입력**: 100개 파일 동시 분석
**예상결과**:
- 30초 이내 모든 분석 완료
- CPU 사용률 90% 이하

## 17. 에러 처리 테스트

### TC-305-048: 손상된 파일 처리
**설명**: 파싱할 수 없는 파일에 대한 에러 처리를 테스트한다
**입력**: 문법 오류가 있는 JavaScript 파일
**예상결과**:
- 분석 실패 시 graceful degradation
- 다른 파일 분석은 계속 진행

### TC-305-049: 네트워크 오류 처리
**설명**: 취약점 데이터베이스 접근 실패 시 처리를 테스트한다
**입력**: 네트워크 연결 없는 환경
**예상결과**:
- 로컬 규칙으로 분석 계속
- 네트워크 오류 로깅

## 18. 보안 보고서 테스트

### TC-305-050: 상세 보고서 생성
**설명**: 개발자를 위한 상세 보안 보고서 생성을 테스트한다
**입력**: 다양한 보안 문제가 있는 프로젝트
**예상결과**:
- 파일별/라인별 이슈 위치 정보
- 수정 가이드라인 포함
- 우선순위 정렬

### TC-305-051: 요약 보고서 생성
**설명**: 관리자를 위한 요약 보안 보고서 생성을 테스트한다
**입력**: 보안 분석 결과
**예상결과**:
- 전체 보안 점수
- 위험도별 분포 차트
- 주요 권장사항

### TC-305-052: 규정 준수 보고서
**설명**: 보안 규정 준수 상태 보고서 생성을 테스트한다
**입력**: OWASP, PCI DSS 규정 기준 분석
**예상결과**:
- 규정별 준수율
- 미준수 항목 상세 정보
- 개선 방안

## 19. 통합 테스트

### TC-305-053: CI/CD 파이프라인 통합
**설명**: GitHub Actions와의 통합을 테스트한다
**입력**: 보안 문제가 있는 Pull Request
**예상결과**:
- PR 체크 실패
- 보안 문제 코멘트 자동 생성
- 빌드 차단

### TC-305-054: IDE 통합 테스트
**설명**: VS Code 확장과의 통합을 테스트한다
**입력**: 실시간 코드 편집
**예상결과**:
- 실시간 보안 문제 하이라이트
- 인라인 수정 제안
- 문제 설명 툴팁

### TC-305-055: SAST 도구 연동
**설명**: 기존 SAST 도구와의 연동을 테스트한다
**입력**: SonarQube 결과와 비교
**예상결과**:
- 결과 통합 및 중복 제거
- 추가 발견 사항 보고
- 통합 대시보드 표시

총 55개의 테스트 케이스로 보안 분석기의 모든 주요 기능을 검증합니다.