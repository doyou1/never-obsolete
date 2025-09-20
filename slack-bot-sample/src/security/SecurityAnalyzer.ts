import { FileContent } from '../github/types';
import {
  ISecurityAnalyzer,
  SecurityAnalysisContext,
  SecurityAnalysisResult,
  SensitiveDataResult,
  AuthenticationAnalysisResult,
  InputValidationResult,
  SecurityConfigResult,
  ConfigFile,
  SecurityVulnerability,
  SensitiveDataExposure,
  AuthenticationIssue,
  InputValidationIssue,
  SecurityConfigIssue,
  SecurityRecommendation,
  ComplianceStatus,
  SourceLocation,
  SecuritySeverity,
  VulnerabilityType,
  SensitiveDataType,
  AuthIssueType,
  InputVulnerabilityType,
  SecurityCategory,
  ComplianceStandard,
  DataTypeDistribution,
  AuthMechanism,
  SecurityConfigRecommendation,
  RemediationGuidance,
  ComplianceRequirement,
  Dependency
} from './types';

export class SecurityAnalyzer implements ISecurityAnalyzer {
  private readonly SENSITIVE_DATA_PATTERNS = {
    aws_access_key: /AKIA[0-9A-Z]{16}/g,
    google_api_key: /AIza[0-9A-Za-z\-_]{35}/g,
    github_token: /ghp_[0-9a-zA-Z]{36}/g,
    slack_token: /xox[baprs]-[0-9a-zA-Z\-]+/g,
    stripe_key: /sk_live_[0-9a-zA-Z]{24}/g,
    jwt_secret: /(jwt|JWT)[_\s]*[=:]\s*['"]\w{10,}['"]/g,
    database_password: /(password|pwd|pass)[_\s]*[=:]\s*['"]\w{3,}['"]/gi,
    private_key: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  };

  private readonly VULNERABILITY_PATTERNS = {
    sql_injection: [
      /"SELECT.*"\s*\+\s*\w+/g,
      /"INSERT.*"\s*\+\s*\w+/g,
      /"UPDATE.*"\s*\+\s*\w+/g,
      /"DELETE.*"\s*\+\s*\w+/g,
      /query\([^$]*\+/g
    ],
    xss: [
      /\.innerHTML\s*=\s*\w+/g,
      /document\.write\s*\(\s*\w+/g,
      /dangerouslySetInnerHTML/g
    ],
    command_injection: [
      /exec\s*\(\s*['"]['"]?.*\+/g,
      /system\s*\(\s*['"]['"]?.*\+/g,
      /spawn\s*\(\s*['"]['"]?.*\+/g
    ],
    path_traversal: [
      /readFile\s*\(\s*['"]['"]?.*\+/g,
      /writeFile\s*\(\s*['"]['"]?.*\+/g,
      /\.\.\/|\.\.\\/g
    ],
    code_injection: [
      /eval\s*\(/g,
      /Function\s*\(/g,
      /setTimeout\s*\(\s*['"]/g,
      /setInterval\s*\(\s*['"]/g
    ]
  };

  private readonly AUTHENTICATION_PATTERNS = {
    weak_auth: [
      /===\s*['"]admin['"]\s*&&.*===\s*['"]password['"]/g,
      /===\s*['"]password['"]\s*&&.*===\s*['"]admin['"]/g
    ],
    insecure_session: [
      /secure:\s*false/g,
      /httpOnly:\s*false/g,
      /sameSite:\s*false/g
    ],
    missing_auth: [
      /app\.(get|post|put|delete)\s*\(\s*['"][^'"]*protected[^'"]*['"]/g,
      /app\.(get|post|put|delete)\s*\(\s*['"][^'"]*admin[^'"]*['"]/g
    ],
    jwt_issue: [
      /algorithms:\s*\[[^\]]*['"]none['"]/g,
      /verify\([^,]*,\s*null/g
    ]
  };

  async analyzeSecurityVulnerabilities(context: SecurityAnalysisContext): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    try {
      const vulnerabilities: SecurityVulnerability[] = [];
      const sensitiveDataExposures: SensitiveDataExposure[] = [];
      const authenticationIssues: AuthenticationIssue[] = [];
      const inputValidationIssues: InputValidationIssue[] = [];

      // OWASP 취약점 검사
      if (context.analysisOptions.enableOWASPChecks) {
        vulnerabilities.push(...await this.detectOWASPVulnerabilities(context.files));
      }

      // 민감 정보 검출
      if (context.analysisOptions.enableSensitiveDataScan) {
        const sensitiveResult = await this.detectSensitiveData(context.files);
        sensitiveDataExposures.push(...sensitiveResult.exposures);
      }

      // 인증/인가 분석
      if (context.analysisOptions.enableAuthenticationAnalysis) {
        const authResult = await this.analyzeAuthenticationPatterns(context.files);
        authenticationIssues.push(...authResult.issues);
      }

      // 입력 검증 분석
      if (context.analysisOptions.enableInputValidationCheck) {
        const inputResult = await this.analyzeInputValidation(context.files);
        inputValidationIssues.push(...inputResult.issues);
      }

      // 의존성 보안 검사
      if (context.analysisOptions.enableDependencyCheck && context.dependencies) {
        vulnerabilities.push(...this.analyzeDependencyVulnerabilities(context.dependencies));
      }

      // 보안 점수 계산
      const overallSecurityScore = this.calculateSecurityScore(
        vulnerabilities,
        sensitiveDataExposures,
        authenticationIssues,
        inputValidationIssues
      );

      // 위험도 분류
      const riskLevel = this.determineRiskLevel(overallSecurityScore);

      // 보안 권장사항 생성
      const securityRecommendations = this.generateSecurityRecommendations(
        vulnerabilities,
        sensitiveDataExposures,
        authenticationIssues,
        inputValidationIssues
      );

      // 규정 준수 상태
      const complianceStatus = this.checkComplianceStatus(vulnerabilities, context);

      return {
        id: analysisId,
        overallSecurityScore,
        riskLevel,
        vulnerabilities,
        sensitiveDataExposures,
        authenticationIssues,
        inputValidationIssues,
        securityRecommendations,
        complianceStatus,
        generatedAt: new Date(),
        analysisVersion: '1.0.0'
      };

    } catch (error) {
      return this.createFailedAnalysisResult(analysisId, error);
    }
  }

  async detectSensitiveData(files: FileContent[]): Promise<SensitiveDataResult> {
    const exposures: SensitiveDataExposure[] = [];
    const dataTypeDistribution: DataTypeDistribution = {
      apiKeys: 0,
      passwords: 0,
      tokens: 0,
      privateKeys: 0,
      connectionStrings: 0,
      personalInfo: 0
    };

    for (const file of files) {
      const fileExposures = await this.scanFileForSensitiveData(file);
      exposures.push(...fileExposures);

      // 통계 업데이트
      fileExposures.forEach(exposure => {
        switch (exposure.dataType) {
          case 'api_key':
            dataTypeDistribution.apiKeys++;
            break;
          case 'password':
            dataTypeDistribution.passwords++;
            break;
          case 'token':
            dataTypeDistribution.tokens++;
            break;
          case 'private_key':
            dataTypeDistribution.privateKeys++;
            break;
          case 'connection_string':
            dataTypeDistribution.connectionStrings++;
            break;
          case 'email':
          case 'pii':
            dataTypeDistribution.personalInfo++;
            break;
        }
      });
    }

    const criticalExposures = exposures.filter(e => e.severity === 'critical').length;

    return {
      totalExposures: exposures.length,
      criticalExposures,
      exposures,
      dataTypeDistribution
    };
  }

  async analyzeAuthenticationPatterns(files: FileContent[]): Promise<AuthenticationAnalysisResult> {
    const issues: AuthenticationIssue[] = [];
    const authMechanisms: AuthMechanism[] = [];

    for (const file of files) {
      // 인증 이슈 검출
      issues.push(...await this.detectAuthenticationIssues(file));

      // 인증 메커니즘 식별
      authMechanisms.push(...this.identifyAuthMechanisms(file));
    }

    const overallAuthScore = this.calculateAuthScore(issues, authMechanisms);
    const recommendations = this.generateAuthRecommendations(issues);

    return {
      overallAuthScore,
      issues,
      recommendations,
      authMechanisms
    };
  }

  async analyzeInputValidation(files: FileContent[]): Promise<InputValidationResult> {
    const issues: InputValidationIssue[] = [];
    let totalEndpoints = 0;
    let validatedEndpoints = 0;

    for (const file of files) {
      const endpoints = this.extractEndpoints(file);
      totalEndpoints += endpoints.length;

      for (const endpoint of endpoints) {
        const hasValidation = this.checkInputValidation(endpoint, file);
        if (hasValidation) {
          validatedEndpoints++;
        } else {
          issues.push(this.createInputValidationIssue(endpoint, file));
        }
      }
    }

    const overallValidationScore = totalEndpoints > 0
      ? Math.round((validatedEndpoints / totalEndpoints) * 100)
      : 100;

    const recommendations = this.generateInputValidationRecommendations(issues);

    return {
      overallValidationScore,
      issues,
      validatedEndpoints,
      totalEndpoints,
      recommendations
    };
  }

  async validateSecurityConfiguration(configFiles: ConfigFile[]): Promise<SecurityConfigResult> {
    const configIssues: SecurityConfigIssue[] = [];
    const missingConfigurations: string[] = [];
    const recommendations: SecurityConfigRecommendation[] = [];

    for (const file of configFiles) {
      configIssues.push(...this.analyzeConfigFile(file));
    }

    // 누락된 보안 설정 검사
    missingConfigurations.push(...this.checkMissingSecurityConfigs(configFiles));

    // 권장사항 생성
    recommendations.push(...this.generateConfigRecommendations(configIssues, missingConfigurations));

    const overallConfigScore = this.calculateConfigScore(configIssues, missingConfigurations);

    return {
      overallConfigScore,
      configIssues,
      missingConfigurations,
      recommendations
    };
  }

  private async detectOWASPVulnerabilities(files: FileContent[]): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    for (const file of files) {
      for (const [vulnType, patterns] of Object.entries(this.VULNERABILITY_PATTERNS)) {
        for (const pattern of patterns) {
          const matches = this.findPatternMatches(file.content, pattern);

          for (const match of matches) {
            vulnerabilities.push({
              id: this.generateVulnerabilityId(),
              type: vulnType as VulnerabilityType,
              severity: this.getSeverityForVulnerability(vulnType as VulnerabilityType),
              title: this.getVulnerabilityTitle(vulnType as VulnerabilityType),
              description: this.getVulnerabilityDescription(vulnType as VulnerabilityType),
              location: {
                file: file.path,
                startLine: match.line,
                startColumn: match.column,
                context: match.context
              },
              cweId: this.getCWEId(vulnType as VulnerabilityType),
              evidence: [match.matchedText],
              remediation: this.getRemediation(vulnType as VulnerabilityType),
              falsePositive: false
            });
          }
        }
      }
    }

    return vulnerabilities;
  }

  private async scanFileForSensitiveData(file: FileContent): Promise<SensitiveDataExposure[]> {
    const exposures: SensitiveDataExposure[] = [];

    for (const [dataType, pattern] of Object.entries(this.SENSITIVE_DATA_PATTERNS)) {
      const matches = this.findPatternMatches(file.content, pattern);

      for (const match of matches) {
        exposures.push({
          id: this.generateExposureId(),
          dataType: this.mapToSensitiveDataType(dataType),
          severity: this.getSeverityForSensitiveData(dataType),
          location: {
            file: file.path,
            startLine: match.line,
            startColumn: match.column,
            context: match.context
          },
          exposedValue: match.matchedText,
          context: match.context,
          recommendation: this.getSensitiveDataRecommendation(dataType),
          confidence: 0.9
        });
      }
    }

    return exposures;
  }

  private async detectAuthenticationIssues(file: FileContent): Promise<AuthenticationIssue[]> {
    const issues: AuthenticationIssue[] = [];

    for (const [issueType, patterns] of Object.entries(this.AUTHENTICATION_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = this.findPatternMatches(file.content, pattern);

        for (const match of matches) {
          issues.push({
            id: this.generateAuthIssueId(),
            issueType: issueType as AuthIssueType,
            severity: this.getSeverityForAuthIssue(issueType as AuthIssueType),
            description: this.getAuthIssueDescription(issueType as AuthIssueType),
            location: {
              file: file.path,
              startLine: match.line,
              startColumn: match.column,
              context: match.context
            },
            recommendation: this.getAuthRecommendation(issueType as AuthIssueType),
            impact: this.getAuthIssueImpact(issueType as AuthIssueType)
          });
        }
      }
    }

    return issues;
  }

  private identifyAuthMechanisms(file: FileContent): AuthMechanism[] {
    const mechanisms: AuthMechanism[] = [];

    // JWT 검출
    if (file.content.includes('jwt') || file.content.includes('jsonwebtoken')) {
      mechanisms.push({
        type: 'jwt',
        implementation: 'jsonwebtoken',
        securityLevel: 'moderate',
        issues: []
      });
    }

    // Session 검출
    if (file.content.includes('session(')) {
      mechanisms.push({
        type: 'session',
        implementation: 'express-session',
        securityLevel: 'moderate',
        issues: []
      });
    }

    // Passport 검출
    if (file.content.includes('passport')) {
      mechanisms.push({
        type: 'oauth',
        implementation: 'passport',
        securityLevel: 'strong',
        issues: []
      });
    }

    return mechanisms;
  }

  private extractEndpoints(file: FileContent): Array<{method: string; path: string; line: number}> {
    const endpoints = [];
    const endpointPattern = /app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = endpointPattern.exec(file.content)) !== null) {
      const line = file.content.substring(0, match.index).split('\n').length;
      endpoints.push({
        method: match[1],
        path: match[2],
        line
      });
    }

    return endpoints;
  }

  private checkInputValidation(endpoint: {method: string; path: string; line: number}, file: FileContent): boolean {
    const lines = file.content.split('\n');
    const endpointLine = lines[endpoint.line - 1];

    // 간단한 검증 체크 (실제로는 더 복잡한 로직 필요)
    return endpointLine.includes('validate(') ||
           endpointLine.includes('validator') ||
           endpointLine.includes('joi') ||
           endpointLine.includes('express-validator');
  }

  private createInputValidationIssue(endpoint: {method: string; path: string; line: number}, file: FileContent): InputValidationIssue {
    return {
      id: this.generateInputIssueId(),
      vulnerabilityType: 'sql_injection', // 기본값, 실제로는 더 정교한 분류 필요
      severity: 'high',
      location: {
        file: file.path,
        startLine: endpoint.line
      },
      inputVector: `${endpoint.method.toUpperCase()} ${endpoint.path}`,
      description: `Input validation missing for ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      remediation: 'Add input validation middleware before processing user data',
      attackScenario: 'Attacker could inject malicious data through unvalidated inputs'
    };
  }

  private analyzeDependencyVulnerabilities(dependencies: Dependency[]): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    for (const dep of dependencies) {
      if (dep.vulnerabilities) {
        for (const vuln of dep.vulnerabilities) {
          vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'vulnerable_component',
            severity: vuln.severity,
            title: `${dep.name}: ${vuln.title}`,
            description: vuln.description,
            location: {
              file: 'package.json',
              startLine: 1,
              context: `${dep.name}@${dep.version}`
            },
            cweId: 'CWE-1321',
            cvssScore: vuln.cvssScore,
            evidence: [`${dep.name} version ${dep.version}`],
            remediation: {
              summary: `Update ${dep.name} to a patched version`,
              steps: [
                `npm update ${dep.name}`,
                `Verify fix with npm audit`
              ],
              references: [],
              estimatedEffort: 'low'
            },
            falsePositive: false
          });
        }
      }
    }

    return vulnerabilities;
  }

  private analyzeConfigFile(file: ConfigFile): SecurityConfigIssue[] {
    const issues: SecurityConfigIssue[] = [];

    // CORS 설정 검사
    if (file.content.includes("origin: '*'") && file.content.includes('credentials: true')) {
      issues.push({
        id: this.generateConfigIssueId(),
        configType: 'CORS',
        issue: 'Dangerous CORS configuration: wildcard origin with credentials',
        severity: 'medium',
        location: {
          file: file.path,
          startLine: this.findLineNumber(file.content, "origin: '*'")
        },
        currentValue: "origin: '*', credentials: true",
        recommendedValue: "origin: ['https://trusted-domain.com'], credentials: true",
        impact: 'Could allow unauthorized cross-origin requests'
      });
    }

    // HTTPS 설정 검사
    if (file.content.includes('app.listen(80') || file.content.includes('server running on HTTP')) {
      issues.push({
        id: this.generateConfigIssueId(),
        configType: 'HTTPS',
        issue: 'HTTP server detected - HTTPS should be used',
        severity: 'medium',
        location: {
          file: file.path,
          startLine: this.findLineNumber(file.content, 'app.listen(80')
        },
        currentValue: 'HTTP (port 80)',
        recommendedValue: 'HTTPS (port 443)',
        impact: 'Data transmitted in plain text'
      });
    }

    // 환경변수 검사
    if (file.type === 'env') {
      const secretKeyMatch = file.content.match(/SECRET_KEY\s*=\s*[\w-]+/);
      if (secretKeyMatch && !secretKeyMatch[0].includes('$')) {
        issues.push({
          id: this.generateConfigIssueId(),
          configType: 'Environment',
          issue: 'Hardcoded secret key in environment file',
          severity: 'high',
          location: {
            file: file.path,
            startLine: this.findLineNumber(file.content, 'SECRET_KEY')
          },
          currentValue: 'Hardcoded value',
          recommendedValue: 'Generate random secret key',
          impact: 'Secret key compromise could lead to authentication bypass'
        });
      }
    }

    return issues;
  }

  private checkMissingSecurityConfigs(configFiles: ConfigFile[]): string[] {
    const missing: string[] = [];
    const allContent = configFiles.map(f => f.content).join('\n');

    if (!allContent.includes('X-Frame-Options')) {
      missing.push('X-Frame-Options');
    }

    if (!allContent.includes('X-XSS-Protection')) {
      missing.push('X-XSS-Protection');
    }

    if (!allContent.includes('Content-Security-Policy')) {
      missing.push('Content-Security-Policy');
    }

    if (!allContent.includes('helmet')) {
      missing.push('helmet middleware');
    }

    return missing;
  }

  // 계산 및 유틸리티 메서드들
  private calculateSecurityScore(
    vulnerabilities: SecurityVulnerability[],
    sensitiveData: SensitiveDataExposure[],
    authIssues: AuthenticationIssue[],
    inputIssues: InputValidationIssue[]
  ): number {
    let score = 100;

    // 취약점 기반 점수 차감
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumVulns = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowVulns = vulnerabilities.filter(v => v.severity === 'low').length;

    score -= criticalVulns * 25;
    score -= highVulns * 15;
    score -= mediumVulns * 8;
    score -= lowVulns * 3;

    // 민감 정보 노출 점수 차감
    const criticalExposures = sensitiveData.filter(e => e.severity === 'critical').length;
    const highExposures = sensitiveData.filter(e => e.severity === 'high').length;
    const mediumExposures = sensitiveData.filter(e => e.severity === 'medium').length;

    score -= criticalExposures * 20;
    score -= highExposures * 10;
    score -= mediumExposures * 5;

    // 인증 이슈 점수 차감
    score -= authIssues.length * 5;

    // 입력 검증 이슈 점수 차감
    score -= inputIssues.length * 3;

    return Math.max(0, score);
  }

  private determineRiskLevel(securityScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (securityScore >= 80) return 'low';
    if (securityScore >= 60) return 'medium';
    if (securityScore >= 40) return 'high';
    return 'critical';
  }

  private calculateAuthScore(issues: AuthenticationIssue[], mechanisms: AuthMechanism[]): number {
    let score = 100;

    score -= issues.filter(i => i.severity === 'high').length * 20;
    score -= issues.filter(i => i.severity === 'medium').length * 10;
    score -= issues.filter(i => i.severity === 'low').length * 5;

    // 강력한 인증 메커니즘 보너스
    const strongMechanisms = mechanisms.filter(m => m.securityLevel === 'strong').length;
    score += strongMechanisms * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateConfigScore(issues: SecurityConfigIssue[], missing: string[]): number {
    let score = 100;

    score -= issues.filter(i => i.severity === 'critical').length * 25;
    score -= issues.filter(i => i.severity === 'high').length * 15;
    score -= issues.filter(i => i.severity === 'medium').length * 8;
    score -= issues.filter(i => i.severity === 'low').length * 3;

    score -= missing.length * 10;

    return Math.max(0, score);
  }

  private generateSecurityRecommendations(
    vulnerabilities: SecurityVulnerability[],
    sensitiveData: SensitiveDataExposure[],
    authIssues: AuthenticationIssue[],
    inputIssues: InputValidationIssue[]
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    // 입력 검증 권장사항
    if (inputIssues.length > 0) {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: 'input_validation',
        title: 'Implement Input Validation',
        description: 'Add proper input validation to prevent injection attacks',
        priority: 'high',
        actionItems: [
          'Use parameterized queries for database operations',
          'Implement input sanitization for all user inputs',
          'Add validation middleware to API endpoints'
        ],
        benefits: [
          'Prevents SQL injection attacks',
          'Reduces XSS vulnerabilities',
          'Improves data quality'
        ],
        resources: [
          'OWASP Input Validation Cheat Sheet',
          'Express Validator documentation'
        ],
        estimatedEffort: 'medium',
        impact: 'high'
      });
    }

    // 민감 정보 보호 권장사항
    if (sensitiveData.length > 0) {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: 'cryptography',
        title: 'Remove Hardcoded Secrets',
        description: 'Move all sensitive information to secure environment variables',
        priority: 'critical',
        actionItems: [
          'Move API keys to environment variables',
          'Use secure key management services',
          'Implement secrets rotation policy'
        ],
        benefits: [
          'Prevents credential exposure',
          'Improves security posture',
          'Enables secure deployment practices'
        ],
        resources: [
          'OWASP Secrets Management Cheat Sheet',
          'AWS Secrets Manager',
          'HashiCorp Vault'
        ],
        estimatedEffort: 'medium',
        impact: 'high'
      });
    }

    return recommendations;
  }

  private checkComplianceStatus(vulnerabilities: SecurityVulnerability[], context: SecurityAnalysisContext): ComplianceStatus[] {
    const owaspRequirements: ComplianceRequirement[] = [
      {
        id: 'A01',
        title: 'Broken Access Control',
        status: 'compliant',
        description: 'Ensure proper access controls are implemented',
        findings: [],
        recommendations: []
      },
      {
        id: 'A03',
        title: 'Injection',
        status: vulnerabilities.some(v => ['sql_injection', 'xss', 'command_injection'].includes(v.type)) ? 'non_compliant' : 'compliant',
        description: 'Prevent injection flaws',
        findings: vulnerabilities.filter(v => ['sql_injection', 'xss', 'command_injection'].includes(v.type)).map(v => v.title),
        recommendations: ['Use parameterized queries', 'Implement input validation', 'Use output encoding']
      },
      {
        id: 'A07',
        title: 'Identification and Authentication Failures',
        status: vulnerabilities.some(v => v.type === 'weak_authentication') ? 'non_compliant' : 'compliant',
        description: 'Implement strong authentication mechanisms',
        findings: vulnerabilities.filter(v => v.type === 'weak_authentication').map(v => v.title),
        recommendations: ['Implement multi-factor authentication', 'Use strong password policies']
      }
    ];

    const overallScore = owaspRequirements.filter(r => r.status === 'compliant').length / owaspRequirements.length * 100;

    return [{
      standard: 'owasp_top_10',
      overallScore: Math.round(overallScore),
      requirements: owaspRequirements,
      summary: `${Math.round(overallScore)}% compliant with OWASP Top 10`
    }];
  }

  // 권장사항 생성 메서드들
  private generateAuthRecommendations(issues: AuthenticationIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.issueType === 'weak_auth')) {
      recommendations.push('Implement strong authentication mechanisms');
      recommendations.push('Remove hardcoded credentials');
    }

    if (issues.some(i => i.issueType === 'insecure_session')) {
      recommendations.push('Configure secure session settings');
      recommendations.push('Enable HttpOnly and Secure flags');
    }

    if (issues.some(i => i.issueType === 'missing_auth')) {
      recommendations.push('Add authentication to protected endpoints');
      recommendations.push('Implement authorization middleware');
    }

    return recommendations;
  }

  private generateInputValidationRecommendations(issues: InputValidationIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.length > 0) {
      recommendations.push('Implement input validation for all user inputs');
      recommendations.push('Use parameterized queries to prevent SQL injection');
      recommendations.push('Sanitize output to prevent XSS attacks');
      recommendations.push('Add CSRF protection to state-changing operations');
    }

    return recommendations;
  }

  private generateConfigRecommendations(issues: SecurityConfigIssue[], missing: string[]): SecurityConfigRecommendation[] {
    const recommendations: SecurityConfigRecommendation[] = [];

    if (missing.includes('helmet middleware')) {
      recommendations.push({
        category: 'Security Headers',
        title: 'Use Helmet Middleware',
        description: 'Add helmet middleware to set security headers automatically',
        priority: 'high',
        implementation: [
          'npm install helmet',
          'app.use(helmet())',
          'Configure specific security policies'
        ]
      });
    }

    if (issues.some(i => i.configType === 'HTTPS')) {
      recommendations.push({
        category: 'Transport Security',
        title: 'Enable HTTPS',
        description: 'Configure HTTPS to encrypt data in transit',
        priority: 'high',
        implementation: [
          'Obtain SSL certificate',
          'Configure HTTPS server',
          'Redirect HTTP to HTTPS'
        ]
      });
    }

    return recommendations;
  }

  // 패턴 매칭 및 유틸리티 메서드들
  private findPatternMatches(content: string, pattern: RegExp): Array<{
    matchedText: string;
    line: number;
    column: number;
    context: string;
  }> {
    const matches = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      // 글로벌 패턴을 위해 lastIndex 리셋
      pattern.lastIndex = 0;

      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          matchedText: match[0],
          line: i + 1,
          column: match.index + 1,
          context: line.trim()
        });

        // 무한루프 방지
        if (!pattern.global) break;
      }
    }

    return matches;
  }

  private findLineNumber(content: string, searchText: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return 1;
  }

  // 매핑 및 분류 메서드들
  private mapToSensitiveDataType(patternKey: string): SensitiveDataType {
    const mapping: Record<string, SensitiveDataType> = {
      aws_access_key: 'api_key',
      google_api_key: 'api_key',
      github_token: 'token',
      slack_token: 'token',
      stripe_key: 'api_key',
      jwt_secret: 'token',
      database_password: 'password',
      private_key: 'private_key',
      email: 'email'
    };
    return mapping[patternKey] || 'token';
  }

  private getSeverityForVulnerability(vulnType: VulnerabilityType): SecuritySeverity {
    const severityMap: Record<VulnerabilityType, SecuritySeverity> = {
      sql_injection: 'critical',
      xss: 'high',
      command_injection: 'critical',
      path_traversal: 'high',
      code_injection: 'critical',
      nosql_injection: 'high',
      ldap_injection: 'high',
      xml_injection: 'medium',
      csrf: 'medium',
      deserialization: 'high',
      insecure_crypto: 'medium',
      weak_authentication: 'high',
      broken_access_control: 'high',
      security_misconfiguration: 'medium',
      information_disclosure: 'medium',
      business_logic_flaw: 'medium'
    };
    return severityMap[vulnType] || 'medium';
  }

  private getSeverityForSensitiveData(dataType: string): SecuritySeverity {
    const criticalTypes = ['aws_access_key', 'google_api_key', 'github_token', 'private_key'];
    const highTypes = ['database_password', 'jwt_secret'];

    if (criticalTypes.includes(dataType)) return 'critical';
    if (highTypes.includes(dataType)) return 'high';
    return 'medium';
  }

  private getSeverityForAuthIssue(issueType: AuthIssueType): SecuritySeverity {
    const severityMap: Record<AuthIssueType, SecuritySeverity> = {
      weak_auth: 'high',
      missing_auth: 'high',
      insecure_session: 'medium',
      jwt_issue: 'high',
      broken_auth: 'high',
      privilege_escalation: 'critical',
      session_fixation: 'medium'
    };
    return severityMap[issueType] || 'medium';
  }

  // 설명 및 권장사항 생성 메서드들
  private getVulnerabilityTitle(vulnType: VulnerabilityType): string {
    const titles: Record<VulnerabilityType, string> = {
      sql_injection: 'SQL Injection Vulnerability',
      xss: 'Cross-Site Scripting (XSS)',
      command_injection: 'Command Injection',
      path_traversal: 'Path Traversal',
      code_injection: 'Code Injection',
      nosql_injection: 'NoSQL Injection',
      ldap_injection: 'LDAP Injection',
      xml_injection: 'XML Injection',
      csrf: 'Cross-Site Request Forgery',
      deserialization: 'Insecure Deserialization',
      insecure_crypto: 'Insecure Cryptography',
      weak_authentication: 'Weak Authentication',
      broken_access_control: 'Broken Access Control',
      security_misconfiguration: 'Security Misconfiguration',
      information_disclosure: 'Information Disclosure',
      business_logic_flaw: 'Business Logic Flaw'
    };
    return titles[vulnType] || 'Security Vulnerability';
  }

  private getVulnerabilityDescription(vulnType: VulnerabilityType): string {
    const descriptions: Record<VulnerabilityType, string> = {
      sql_injection: 'User input is directly concatenated into SQL queries without proper sanitization',
      xss: 'User input is inserted into DOM without proper encoding, allowing script injection',
      command_injection: 'User input is passed to system commands without validation',
      path_traversal: 'File paths are constructed using user input without proper validation',
      code_injection: 'Dynamic code execution with user-controlled input',
      nosql_injection: 'NoSQL queries constructed with unvalidated user input',
      ldap_injection: 'LDAP queries built with unsanitized user data',
      xml_injection: 'XML data processed without proper validation',
      csrf: 'State-changing operations lack CSRF protection',
      deserialization: 'Untrusted data is deserialized without validation',
      insecure_crypto: 'Weak cryptographic algorithms or implementations',
      weak_authentication: 'Authentication mechanisms are insufficient or flawed',
      broken_access_control: 'Access controls are missing or improperly implemented',
      security_misconfiguration: 'Security settings are misconfigured or missing',
      information_disclosure: 'Sensitive information is exposed to unauthorized users',
      business_logic_flaw: 'Application logic can be bypassed or abused'
    };
    return descriptions[vulnType] || 'Security vulnerability detected';
  }

  private getCWEId(vulnType: VulnerabilityType): string {
    const cweMap: Record<VulnerabilityType, string> = {
      sql_injection: 'CWE-89',
      xss: 'CWE-79',
      command_injection: 'CWE-78',
      path_traversal: 'CWE-22',
      code_injection: 'CWE-94',
      nosql_injection: 'CWE-943',
      ldap_injection: 'CWE-90',
      xml_injection: 'CWE-91',
      csrf: 'CWE-352',
      deserialization: 'CWE-502',
      insecure_crypto: 'CWE-327',
      weak_authentication: 'CWE-287',
      broken_access_control: 'CWE-284',
      security_misconfiguration: 'CWE-16',
      information_disclosure: 'CWE-200',
      business_logic_flaw: 'CWE-840'
    };
    return cweMap[vulnType] || 'CWE-1000';
  }

  private getRemediation(vulnType: VulnerabilityType): RemediationGuidance {
    const remediations: Record<VulnerabilityType, RemediationGuidance> = {
      sql_injection: {
        summary: 'Use parameterized queries and input validation',
        steps: [
          'Replace string concatenation with parameterized queries',
          'Implement input validation and sanitization',
          'Use ORM with built-in protection'
        ],
        references: [
          'https://owasp.org/www-project-cheat-sheets/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'
        ],
        codeExample: 'db.query("SELECT * FROM users WHERE id = $1", [userId])',
        estimatedEffort: 'medium'
      },
      xss: {
        summary: 'Implement output encoding and input validation',
        steps: [
          'Use proper output encoding for all dynamic content',
          'Implement Content Security Policy',
          'Validate and sanitize all user inputs'
        ],
        references: [
          'https://owasp.org/www-project-cheat-sheets/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'
        ],
        codeExample: 'element.textContent = userInput; // instead of innerHTML',
        estimatedEffort: 'medium'
      },
      command_injection: {
        summary: 'Avoid system command execution with user input',
        steps: [
          'Use safer alternatives to system commands',
          'Implement strict input validation',
          'Use command whitelist if system calls are necessary'
        ],
        references: [
          'https://owasp.org/www-project-cheat-sheets/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html'
        ],
        estimatedEffort: 'high'
      },
      path_traversal: {
        summary: 'Validate and sanitize file paths',
        steps: [
          'Use path normalization and validation',
          'Implement file access controls',
          'Use absolute paths with whitelist'
        ],
        references: [],
        estimatedEffort: 'medium'
      },
      code_injection: {
        summary: 'Avoid dynamic code execution',
        steps: [
          'Remove eval() and similar functions',
          'Use safer alternatives for dynamic behavior',
          'Implement strict input validation'
        ],
        references: [],
        estimatedEffort: 'high'
      }
    };

    return remediations[vulnType] || {
      summary: 'Review and fix the security issue',
      steps: ['Analyze the vulnerability', 'Implement appropriate controls'],
      references: [],
      estimatedEffort: 'medium'
    };
  }

  private getSensitiveDataRecommendation(dataType: string): string {
    const recommendations: Record<string, string> = {
      aws_access_key: 'Move AWS credentials to environment variables or IAM roles',
      google_api_key: 'Store Google API keys in secure configuration',
      github_token: 'Use GitHub secrets or environment variables',
      database_password: 'Store database credentials in environment variables',
      jwt_secret: 'Generate random JWT secret and store securely',
      private_key: 'Store private keys in secure key management system',
      email: 'Avoid hardcoding email addresses in source code'
    };
    return recommendations[dataType] || 'Store sensitive data securely';
  }

  private getAuthIssueDescription(issueType: AuthIssueType): string {
    const descriptions: Record<AuthIssueType, string> = {
      weak_auth: 'Weak or hardcoded authentication credentials detected',
      missing_auth: 'Protected resource lacks proper authentication',
      insecure_session: 'Session configuration is not secure',
      jwt_issue: 'JWT implementation has security issues',
      broken_auth: 'Authentication mechanism is broken or bypassable',
      privilege_escalation: 'Possible privilege escalation vulnerability',
      session_fixation: 'Session fixation vulnerability detected'
    };
    return descriptions[issueType] || 'Authentication security issue';
  }

  private getAuthRecommendation(issueType: AuthIssueType): string {
    const recommendations: Record<AuthIssueType, string> = {
      weak_auth: 'Implement strong authentication with proper credential management',
      missing_auth: 'Add authentication middleware to protect sensitive endpoints',
      insecure_session: 'Configure secure session settings (httpOnly, secure, sameSite)',
      jwt_issue: 'Fix JWT implementation to use secure algorithms and validation',
      broken_auth: 'Review and fix authentication logic',
      privilege_escalation: 'Implement proper authorization checks',
      session_fixation: 'Regenerate session IDs after authentication'
    };
    return recommendations[issueType] || 'Fix authentication issue';
  }

  private getAuthIssueImpact(issueType: AuthIssueType): string {
    const impacts: Record<AuthIssueType, string> = {
      weak_auth: 'Unauthorized access to user accounts',
      missing_auth: 'Exposure of sensitive resources',
      insecure_session: 'Session hijacking and impersonation',
      jwt_issue: 'Token forgery and authentication bypass',
      broken_auth: 'Complete authentication bypass',
      privilege_escalation: 'Unauthorized privilege elevation',
      session_fixation: 'Account takeover through session manipulation'
    };
    return impacts[issueType] || 'Security compromise';
  }

  // ID 생성 메서드들
  private generateAnalysisId(): string {
    return `security_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVulnerabilityId(): string {
    return `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExposureId(): string {
    return `exposure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuthIssueId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInputIssueId(): string {
    return `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConfigIssueId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 에러 처리
  private createFailedAnalysisResult(analysisId: string, error: any): SecurityAnalysisResult {
    return {
      id: analysisId,
      overallSecurityScore: 0,
      riskLevel: 'critical',
      vulnerabilities: [],
      sensitiveDataExposures: [],
      authenticationIssues: [],
      inputValidationIssues: [],
      securityRecommendations: [{
        id: this.generateRecommendationId(),
        category: 'error_handling',
        title: 'Security Analysis Failed',
        description: `Security analysis failed: ${error.message}`,
        priority: 'high',
        actionItems: ['Review analysis configuration', 'Check input data'],
        benefits: ['Successful security analysis'],
        resources: [],
        estimatedEffort: 'low',
        impact: 'high'
      }],
      complianceStatus: [],
      generatedAt: new Date(),
      analysisVersion: '1.0.0'
    };
  }
}