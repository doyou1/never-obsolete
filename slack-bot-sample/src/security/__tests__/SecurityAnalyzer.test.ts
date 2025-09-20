import { SecurityAnalyzer } from '../SecurityAnalyzer';
import { FileContent } from '../../github/types';
import {
  SecurityAnalysisContext,
  SecurityAnalysisOptions,
  ConfigFile,
  Dependency
} from '../types';

describe('SecurityAnalyzer', () => {
  let analyzer: SecurityAnalyzer;

  beforeEach(() => {
    analyzer = new SecurityAnalyzer();
  });

  describe('보안 취약점 검사', () => {
    test('SQL Injection 취약점 검출', async () => {
      const files: FileContent[] = [{
        name: 'vulnerable.js',
        path: 'src/vulnerable.js',
        content: `
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);`,
        encoding: 'utf-8',
        size: 100,
        sha: 'abc123',
        url: 'http://example.com/vulnerable.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('sql_injection');
      expect(result.vulnerabilities[0].severity).toBe('critical');
      expect(result.vulnerabilities[0].location.file).toBe('src/vulnerable.js');
      expect(result.vulnerabilities[0].location.startLine).toBe(2);
    });

    test('XSS 취약점 검출', async () => {
      const files: FileContent[] = [{
        name: 'xss.js',
        path: 'src/xss.js',
        content: `
document.getElementById('content').innerHTML = userInput;`,
        encoding: 'utf-8',
        size: 80,
        sha: 'def456',
        url: 'http://example.com/xss.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('xss');
      expect(result.vulnerabilities[0].severity).toBe('high');
    });

    test('Command Injection 취약점 검출', async () => {
      const files: FileContent[] = [{
        name: 'command.js',
        path: 'src/command.js',
        content: `
const { exec } = require('child_process');
exec('ping ' + userInput);`,
        encoding: 'utf-8',
        size: 120,
        sha: 'ghi789',
        url: 'http://example.com/command.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities[0].type).toBe('command_injection');
      expect(result.vulnerabilities[0].severity).toBe('critical');
    });

    test('Path Traversal 취약점 검출', async () => {
      const files: FileContent[] = [{
        name: 'path.js',
        path: 'src/path.js',
        content: `
const fs = require('fs');
fs.readFile('./uploads/' + filename, callback);`,
        encoding: 'utf-8',
        size: 100,
        sha: 'jkl012',
        url: 'http://example.com/path.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities[0].type).toBe('path_traversal');
      expect(result.vulnerabilities[0].severity).toBe('high');
    });

    test('Eval 사용 검출', async () => {
      const files: FileContent[] = [{
        name: 'eval.js',
        path: 'src/eval.js',
        content: `eval(userCode);`,
        encoding: 'utf-8',
        size: 50,
        sha: 'mno345',
        url: 'http://example.com/eval.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities[0].type).toBe('code_injection');
      expect(result.vulnerabilities[0].severity).toBe('critical');
    });

    test('복합 취약점 검출', async () => {
      const files: FileContent[] = [{
        name: 'multiple.js',
        path: 'src/multiple.js',
        content: `
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);
document.getElementById('result').innerHTML = data;
eval(userScript);`,
        encoding: 'utf-8',
        size: 200,
        sha: 'pqr678',
        url: 'http://example.com/multiple.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities).toHaveLength(3);
      expect(result.vulnerabilities.map(v => v.type)).toContain('sql_injection');
      expect(result.vulnerabilities.map(v => v.type)).toContain('xss');
      expect(result.vulnerabilities.map(v => v.type)).toContain('code_injection');
    });
  });

  describe('민감 정보 검출', () => {
    test('AWS API 키 검출', async () => {
      const files: FileContent[] = [{
        name: 'aws.js',
        path: 'src/aws.js',
        content: `const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';`,
        encoding: 'utf-8',
        size: 100,
        sha: 'aws123',
        url: 'http://example.com/aws.js'
      }];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.exposures).toHaveLength(1);
      expect(result.exposures[0].dataType).toBe('api_key');
      expect(result.exposures[0].severity).toBe('critical');
      expect(result.exposures[0].exposedValue).toBe('AKIAIOSFODNN7EXAMPLE');
    });

    test('Google API 키 검출', async () => {
      const files: FileContent[] = [{
        name: 'google.js',
        path: 'src/google.js',
        content: `const API_KEY = 'AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe';`,
        encoding: 'utf-8',
        size: 100,
        sha: 'google123',
        url: 'http://example.com/google.js'
      }];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.exposures[0].dataType).toBe('api_key');
      expect(result.exposures[0].severity).toBe('critical');
    });

    test('GitHub Personal Access Token 검출', async () => {
      const files: FileContent[] = [{
        name: 'github.js',
        path: 'src/github.js',
        content: `const token = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';`,
        encoding: 'utf-8',
        size: 100,
        sha: 'github123',
        url: 'http://example.com/github.js'
      }];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.exposures[0].dataType).toBe('token');
      expect(result.exposures[0].severity).toBe('critical');
    });

    test('데이터베이스 패스워드 검출', async () => {
      const files: FileContent[] = [{
        name: 'db.js',
        path: 'src/db.js',
        content: `
const dbConfig = {
  host: 'localhost',
  user: 'admin',
  password: 'secret123',
  database: 'myapp'
};`,
        encoding: 'utf-8',
        size: 150,
        sha: 'db123',
        url: 'http://example.com/db.js'
      }];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.exposures[0].dataType).toBe('password');
      expect(result.exposures[0].severity).toBe('high');
    });

    test('RSA 개인키 검출', async () => {
      const files: FileContent[] = [{
        name: 'key.js',
        path: 'src/key.js',
        content: `
const privateKey = \`-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4f5wg5l2hKsTeNem/V41fGnJm6gOdrj8ym3rFkEjWT2btYft
-----END RSA PRIVATE KEY-----\`;`,
        encoding: 'utf-8',
        size: 200,
        sha: 'key123',
        url: 'http://example.com/key.js'
      }];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.exposures[0].dataType).toBe('private_key');
      expect(result.exposures[0].severity).toBe('critical');
    });

    test('JWT 시크릿 검출', async () => {
      const files: FileContent[] = [{
        name: 'jwt.js',
        path: 'src/jwt.js',
        content: `const JWT_SECRET = 'my-super-secret-jwt-key-123';`,
        encoding: 'utf-8',
        size: 100,
        sha: 'jwt123',
        url: 'http://example.com/jwt.js'
      }];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.exposures[0].dataType).toBe('token');
      expect(result.exposures[0].severity).toBe('high');
    });

    test('이메일 주소 검출', async () => {
      const files: FileContent[] = [{
        name: 'email.js',
        path: 'src/email.js',
        content: `const adminEmail = 'admin@company.com';`,
        encoding: 'utf-8',
        size: 100,
        sha: 'email123',
        url: 'http://example.com/email.js'
      }];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.exposures[0].dataType).toBe('email');
      expect(result.exposures[0].severity).toBe('medium');
    });

    test('민감 정보 통계 계산', async () => {
      const files: FileContent[] = [
        {
          name: 'multiple-secrets.js',
          path: 'src/multiple-secrets.js',
          content: `
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const DB_PASSWORD = 'secret123';
const ADMIN_EMAIL = 'admin@test.com';`,
          encoding: 'utf-8',
          size: 150,
          sha: 'multi123',
          url: 'http://example.com/multi.js'
        }
      ];

      const result = await analyzer.detectSensitiveData(files);

      expect(result.totalExposures).toBe(3);
      expect(result.criticalExposures).toBe(1); // AWS_KEY
      expect(result.dataTypeDistribution.apiKeys).toBe(1);
      expect(result.dataTypeDistribution.passwords).toBe(1);
      expect(result.dataTypeDistribution.personalInfo).toBe(1);
    });
  });

  describe('인증/인가 분석', () => {
    test('약한 인증 검출', async () => {
      const files: FileContent[] = [{
        name: 'auth.js',
        path: 'src/auth.js',
        content: `
if (username === 'admin' && password === 'password') {
  return true;
}`,
        encoding: 'utf-8',
        size: 100,
        sha: 'auth123',
        url: 'http://example.com/auth.js'
      }];

      const result = await analyzer.analyzeAuthenticationPatterns(files);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issueType).toBe('weak_auth');
      expect(result.issues[0].severity).toBe('high');
    });

    test('세션 설정 검증', async () => {
      const files: FileContent[] = [{
        name: 'session.js',
        path: 'src/session.js',
        content: `
app.use(session({
  secret: 'keyboard cat',
  secure: false,
  httpOnly: false
}));`,
        encoding: 'utf-8',
        size: 150,
        sha: 'session123',
        url: 'http://example.com/session.js'
      }];

      const result = await analyzer.analyzeAuthenticationPatterns(files);

      expect(result.issues[0].issueType).toBe('insecure_session');
      expect(result.issues[0].severity).toBe('medium');
    });

    test('JWT 검증 누락 검출', async () => {
      const files: FileContent[] = [{
        name: 'protected.js',
        path: 'src/protected.js',
        content: `
app.get('/protected', (req, res) => {
  res.json(sensitiveData);
});`,
        encoding: 'utf-8',
        size: 100,
        sha: 'protected123',
        url: 'http://example.com/protected.js'
      }];

      const result = await analyzer.analyzeAuthenticationPatterns(files);

      expect(result.issues[0].issueType).toBe('missing_auth');
      expect(result.issues[0].severity).toBe('high');
    });

    test('JWT 알고리즘 취약점 검출', async () => {
      const files: FileContent[] = [{
        name: 'jwt-vuln.js',
        path: 'src/jwt-vuln.js',
        content: `jwt.verify(token, secret, { algorithms: ['none', 'HS256'] });`,
        encoding: 'utf-8',
        size: 100,
        sha: 'jwtv123',
        url: 'http://example.com/jwt-vuln.js'
      }];

      const result = await analyzer.analyzeAuthenticationPatterns(files);

      expect(result.issues[0].issueType).toBe('jwt_issue');
      expect(result.issues[0].severity).toBe('high');
    });

    test('인증 메커니즘 식별', async () => {
      const files: FileContent[] = [{
        name: 'auth-mechanisms.js',
        path: 'src/auth-mechanisms.js',
        content: `
app.use(passport.initialize());
app.use(jwt({secret: process.env.JWT_SECRET}));
app.use(session({...}));`,
        encoding: 'utf-8',
        size: 200,
        sha: 'mech123',
        url: 'http://example.com/mech.js'
      }];

      const result = await analyzer.analyzeAuthenticationPatterns(files);

      expect(result.authMechanisms).toHaveLength(3);
      expect(result.authMechanisms.map(m => m.type)).toContain('jwt');
      expect(result.authMechanisms.map(m => m.type)).toContain('session');
      expect(result.authMechanisms.map(m => m.type)).toContain('oauth');
    });
  });

  describe('입력 검증 분석', () => {
    test('입력 검증 누락 검출', async () => {
      const files: FileContent[] = [{
        name: 'input.js',
        path: 'src/input.js',
        content: `
app.post('/user', (req, res) => {
  const user = new User(req.body);
  user.save();
});`,
        encoding: 'utf-8',
        size: 150,
        sha: 'input123',
        url: 'http://example.com/input.js'
      }];

      const result = await analyzer.analyzeInputValidation(files);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].vulnerabilityType).toBe('sql_injection');
      expect(result.issues[0].severity).toBe('high');
    });

    test('CSRF 보호 누락 검출', async () => {
      const files: FileContent[] = [{
        name: 'csrf.js',
        path: 'src/csrf.js',
        content: `
app.post('/transfer', (req, res) => {
  transferMoney(req.body.amount, req.body.to);
});`,
        encoding: 'utf-8',
        size: 150,
        sha: 'csrf123',
        url: 'http://example.com/csrf.js'
      }];

      const result = await analyzer.analyzeInputValidation(files);

      expect(result.issues[0].vulnerabilityType).toBe('csrf');
      expect(result.issues[0].severity).toBe('medium');
    });

    test('입력 검증 점수 계산', async () => {
      const files: FileContent[] = [
        {
          name: 'validated.js',
          path: 'src/validated.js',
          content: `
app.post('/user', validate(userSchema), (req, res) => {
  const user = new User(req.body);
  user.save();
});`,
          encoding: 'utf-8',
          size: 200,
          sha: 'valid123',
          url: 'http://example.com/valid.js'
        },
        {
          name: 'unvalidated.js',
          path: 'src/unvalidated.js',
          content: `
app.post('/comment', (req, res) => {
  saveComment(req.body);
});`,
          encoding: 'utf-8',
          size: 100,
          sha: 'unvalid123',
          url: 'http://example.com/unvalid.js'
        }
      ];

      const result = await analyzer.analyzeInputValidation(files);

      expect(result.validatedEndpoints).toBe(1);
      expect(result.totalEndpoints).toBe(2);
      expect(result.overallValidationScore).toBe(50);
    });
  });

  describe('보안 설정 검증', () => {
    test('CORS 설정 검증', async () => {
      const configFiles: ConfigFile[] = [{
        name: 'server.js',
        path: 'src/server.js',
        content: `
app.use(cors({
  origin: '*',
  credentials: true
}));`,
        type: 'other'
      }];

      const result = await analyzer.validateSecurityConfiguration(configFiles);

      expect(result.configIssues).toHaveLength(1);
      expect(result.configIssues[0].issue).toContain('CORS');
      expect(result.configIssues[0].severity).toBe('medium');
    });

    test('보안 헤더 누락 검출', async () => {
      const configFiles: ConfigFile[] = [{
        name: 'app.js',
        path: 'src/app.js',
        content: `
app.get('/', (req, res) => {
  res.send('Hello World');
});`,
        type: 'other'
      }];

      const result = await analyzer.validateSecurityConfiguration(configFiles);

      expect(result.missingConfigurations).toContain('X-Frame-Options');
      expect(result.missingConfigurations).toContain('X-XSS-Protection');
      expect(result.missingConfigurations).toContain('Content-Security-Policy');
    });

    test('HTTPS 강제 검증', async () => {
      const configFiles: ConfigFile[] = [{
        name: 'server.js',
        path: 'src/server.js',
        content: `
app.listen(80, () => {
  console.log('Server running on HTTP');
});`,
        type: 'other'
      }];

      const result = await analyzer.validateSecurityConfiguration(configFiles);

      expect(result.configIssues[0].issue).toContain('HTTPS');
      expect(result.configIssues[0].severity).toBe('medium');
    });

    test('환경변수 설정 검증', async () => {
      const configFiles: ConfigFile[] = [{
        name: '.env',
        path: '.env',
        content: `
NODE_ENV=production
SECRET_KEY=hardcoded-secret
DATABASE_URL=postgres://user:pass@localhost/db`,
        type: 'env'
      }];

      const result = await analyzer.validateSecurityConfiguration(configFiles);

      expect(result.configIssues.length).toBeGreaterThan(0);
      expect(result.configIssues.some(issue => issue.issue.includes('SECRET_KEY'))).toBe(true);
    });
  });

  describe('종합 보안 분석', () => {
    test('전체 보안 점수 계산', async () => {
      const files: FileContent[] = [{
        name: 'app.js',
        path: 'src/app.js',
        content: `
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);
document.getElementById('content').innerHTML = userInput;
const API_KEY = 'AKIAIOSFODNN7EXAMPLE';`,
        encoding: 'utf-8',
        size: 300,
        sha: 'app123',
        url: 'http://example.com/app.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: true,
          enableAuthenticationAnalysis: true,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.overallSecurityScore).toBeLessThan(50);
      expect(result.riskLevel).toBe('critical');
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.sensitiveDataExposures.length).toBeGreaterThan(0);
    });

    test('위험도 분류', async () => {
      const files: FileContent[] = [{
        name: 'safe.js',
        path: 'src/safe.js',
        content: `
const query = "SELECT * FROM users WHERE id = $1";
db.query(query, [sanitizedId]);`,
        encoding: 'utf-8',
        size: 100,
        sha: 'safe123',
        url: 'http://example.com/safe.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: true,
          enableAuthenticationAnalysis: true,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: false
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.overallSecurityScore).toBeGreaterThan(70);
      expect(result.riskLevel).toBe('low');
    });

    test('보안 권장사항 생성', async () => {
      const files: FileContent[] = [{
        name: 'issues.js',
        path: 'src/issues.js',
        content: `
const query = "SELECT * FROM users WHERE id = " + userId;
const password = 'admin123';
eval(userCode);`,
        encoding: 'utf-8',
        size: 200,
        sha: 'issues123',
        url: 'http://example.com/issues.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: true,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.securityRecommendations.length).toBeGreaterThan(0);
      expect(result.securityRecommendations.some(r =>
        r.category === 'input_validation'
      )).toBe(true);
      expect(result.securityRecommendations.some(r =>
        r.category === 'cryptography'
      )).toBe(true);
    });

    test('규정 준수 상태 확인', async () => {
      const files: FileContent[] = [{
        name: 'compliance.js',
        path: 'src/compliance.js',
        content: `
// OWASP Top 10 관련 취약점들
const query = "SELECT * FROM users WHERE id = " + userId; // A03: Injection
document.getElementById('div').innerHTML = userInput; // A03: Injection (XSS)
if (username === 'admin' && password === 'password') {} // A07: Identification and Authentication Failures`,
        encoding: 'utf-8',
        size: 300,
        sha: 'compliance123',
        url: 'http://example.com/compliance.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: true,
          enableAuthenticationAnalysis: true,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.complianceStatus).toHaveLength(1);
      expect(result.complianceStatus[0].standard).toBe('owasp_top_10');
      expect(result.complianceStatus[0].overallScore).toBeLessThan(50);
      expect(result.complianceStatus[0].requirements.some(r =>
        r.status === 'non_compliant'
      )).toBe(true);
    });
  });

  describe('의존성 보안 검사', () => {
    test('취약한 의존성 검출', async () => {
      const dependencies: Dependency[] = [{
        name: 'lodash',
        version: '4.17.4',
        type: 'production',
        vulnerabilities: [{
          id: 'CVE-2019-10744',
          severity: 'high',
          title: 'Prototype Pollution',
          description: 'lodash versions prior to 4.17.12 are vulnerable to Prototype Pollution',
          cvssScore: 7.5,
          patchedVersions: ['>=4.17.12']
        }]
      }];

      const context: SecurityAnalysisContext = {
        files: [],
        configFiles: [],
        dependencies,
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: false,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: false,
          enableDependencyCheck: true,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('vulnerable_component');
      expect(result.vulnerabilities[0].severity).toBe('high');
      expect(result.vulnerabilities[0].cweId).toBe('CWE-1321');
    });
  });

  describe('에러 처리', () => {
    test('손상된 파일 처리', async () => {
      const files: FileContent[] = [{
        name: 'broken.js',
        path: 'src/broken.js',
        content: `
function incomplete() {
  if (condition {
    // 문법 오류가 있는 파일`,
        encoding: 'utf-8',
        size: 100,
        sha: 'broken123',
        url: 'http://example.com/broken.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: true,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: false,
          enableDependencyCheck: false,
          strictMode: false
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      // 에러가 있어도 분석이 계속되어야 함
      expect(result).toBeDefined();
      expect(result.overallSecurityScore).toBeGreaterThanOrEqual(0);
    });

    test('빈 파일 배열 처리', async () => {
      const context: SecurityAnalysisContext = {
        files: [],
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: true,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: false,
          enableDependencyCheck: false,
          strictMode: false
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities).toHaveLength(0);
      expect(result.sensitiveDataExposures).toHaveLength(0);
      expect(result.overallSecurityScore).toBe(100);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('프레임워크별 보안 검사', () => {
    test('Express.js 보안 검사', async () => {
      const files: FileContent[] = [{
        name: 'express-app.js',
        path: 'src/express-app.js',
        content: `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);`,
        encoding: 'utf-8',
        size: 200,
        sha: 'express123',
        url: 'http://example.com/express.js'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        framework: 'express',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: false,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.securityRecommendations.some(r =>
        r.title.includes('helmet')
      )).toBe(true);
    });

    test('React 보안 검사', async () => {
      const files: FileContent[] = [{
        name: 'component.jsx',
        path: 'src/component.jsx',
        content: `
function Component({ userContent }) {
  return <div dangerouslySetInnerHTML={{__html: userContent}} />;
}`,
        encoding: 'utf-8',
        size: 150,
        sha: 'react123',
        url: 'http://example.com/component.jsx'
      }];

      const context: SecurityAnalysisContext = {
        files,
        configFiles: [],
        dependencies: [],
        language: 'javascript',
        framework: 'react',
        analysisOptions: {
          enableOWASPChecks: true,
          enableSensitiveDataScan: false,
          enableAuthenticationAnalysis: false,
          enableInputValidationCheck: true,
          enableDependencyCheck: false,
          strictMode: true
        }
      };

      const result = await analyzer.analyzeSecurityVulnerabilities(context);

      expect(result.vulnerabilities[0].type).toBe('xss');
      expect(result.vulnerabilities[0].severity).toBe('high');
    });
  });
});