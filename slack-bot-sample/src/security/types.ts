import { FileContent } from '../github/types';

// Core Security Analysis Interfaces
export interface ISecurityAnalyzer {
  analyzeSecurityVulnerabilities(context: SecurityAnalysisContext): Promise<SecurityAnalysisResult>;
  detectSensitiveData(files: FileContent[]): Promise<SensitiveDataResult>;
  analyzeAuthenticationPatterns(files: FileContent[]): Promise<AuthenticationAnalysisResult>;
  analyzeInputValidation(files: FileContent[]): Promise<InputValidationResult>;
  validateSecurityConfiguration(configFiles: ConfigFile[]): Promise<SecurityConfigResult>;
}

// Analysis Context and Options
export interface SecurityAnalysisContext {
  files: FileContent[];
  configFiles: ConfigFile[];
  dependencies: Dependency[];
  framework?: string;
  language: string;
  analysisOptions: SecurityAnalysisOptions;
}

export interface SecurityAnalysisOptions {
  enableOWASPChecks: boolean;
  enableSensitiveDataScan: boolean;
  enableAuthenticationAnalysis: boolean;
  enableInputValidationCheck: boolean;
  enableDependencyCheck: boolean;
  customRules?: SecurityRule[];
  excludePatterns?: string[];
  strictMode: boolean;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: SecuritySeverity;
  category: string;
  recommendation: string;
}

// Configuration and Dependencies
export interface ConfigFile {
  name: string;
  path: string;
  content: string;
  type: 'json' | 'yaml' | 'env' | 'dockerfile' | 'nginx' | 'other';
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'optional';
  vulnerabilities?: DependencyVulnerability[];
}

export interface DependencyVulnerability {
  id: string;
  severity: SecuritySeverity;
  title: string;
  description: string;
  cvssScore?: number;
  patchedVersions: string[];
}

// Main Security Analysis Result
export interface SecurityAnalysisResult {
  id: string;
  overallSecurityScore: number; // 0-100
  riskLevel: RiskLevel;
  vulnerabilities: SecurityVulnerability[];
  sensitiveDataExposures: SensitiveDataExposure[];
  authenticationIssues: AuthenticationIssue[];
  inputValidationIssues: InputValidationIssue[];
  securityRecommendations: SecurityRecommendation[];
  complianceStatus: ComplianceStatus[];
  generatedAt: Date;
  analysisVersion: string;
}

// Vulnerability Types
export interface SecurityVulnerability {
  id: string;
  type: VulnerabilityType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  location: SourceLocation;
  cweId?: string;
  cvssScore?: number;
  evidence: string[];
  remediation: RemediationGuidance;
  falsePositive: boolean;
}

export interface RemediationGuidance {
  summary: string;
  steps: string[];
  references: string[];
  codeExample?: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

// Sensitive Data Detection
export interface SensitiveDataResult {
  totalExposures: number;
  criticalExposures: number;
  exposures: SensitiveDataExposure[];
  dataTypeDistribution: DataTypeDistribution;
}

export interface SensitiveDataExposure {
  id: string;
  dataType: SensitiveDataType;
  severity: SecuritySeverity;
  location: SourceLocation;
  exposedValue: string;
  context: string;
  recommendation: string;
  confidence: number; // 0-1
}

export interface DataTypeDistribution {
  apiKeys: number;
  passwords: number;
  tokens: number;
  privateKeys: number;
  connectionStrings: number;
  personalInfo: number;
}

// Authentication Analysis
export interface AuthenticationAnalysisResult {
  overallAuthScore: number;
  issues: AuthenticationIssue[];
  recommendations: string[];
  authMechanisms: AuthMechanism[];
}

export interface AuthenticationIssue {
  id: string;
  issueType: AuthIssueType;
  severity: SecuritySeverity;
  description: string;
  location: SourceLocation;
  recommendation: string;
  impact: string;
}

export interface AuthMechanism {
  type: 'jwt' | 'session' | 'oauth' | 'basic' | 'api_key' | 'custom';
  implementation: string;
  securityLevel: 'weak' | 'moderate' | 'strong';
  issues: string[];
}

// Input Validation Analysis
export interface InputValidationResult {
  overallValidationScore: number;
  issues: InputValidationIssue[];
  validatedEndpoints: number;
  totalEndpoints: number;
  recommendations: string[];
}

export interface InputValidationIssue {
  id: string;
  vulnerabilityType: InputVulnerabilityType;
  severity: SecuritySeverity;
  location: SourceLocation;
  inputVector: string;
  description: string;
  remediation: string;
  attackScenario: string;
}

// Security Configuration
export interface SecurityConfigResult {
  overallConfigScore: number;
  configIssues: SecurityConfigIssue[];
  missingConfigurations: string[];
  recommendations: SecurityConfigRecommendation[];
}

export interface SecurityConfigIssue {
  id: string;
  configType: string;
  issue: string;
  severity: SecuritySeverity;
  location: SourceLocation;
  currentValue: string;
  recommendedValue: string;
  impact: string;
}

export interface SecurityConfigRecommendation {
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  implementation: string[];
}

// Security Recommendations
export interface SecurityRecommendation {
  id: string;
  category: SecurityCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
  benefits: string[];
  resources: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

// Compliance Status
export interface ComplianceStatus {
  standard: ComplianceStandard;
  overallScore: number;
  requirements: ComplianceRequirement[];
  summary: string;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  description: string;
  findings: string[];
  recommendations: string[];
}

// Utility Types
export interface SourceLocation {
  file: string;
  startLine: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
  function?: string;
  context?: string;
}

// Enums and Union Types
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type VulnerabilityType =
  | 'sql_injection'
  | 'xss'
  | 'csrf'
  | 'command_injection'
  | 'path_traversal'
  | 'code_injection'
  | 'nosql_injection'
  | 'ldap_injection'
  | 'xml_injection'
  | 'deserialization'
  | 'insecure_crypto'
  | 'weak_authentication'
  | 'broken_access_control'
  | 'security_misconfiguration'
  | 'information_disclosure'
  | 'business_logic_flaw';

export type SensitiveDataType =
  | 'api_key'
  | 'password'
  | 'token'
  | 'private_key'
  | 'connection_string'
  | 'pii'
  | 'credit_card'
  | 'ssn'
  | 'email'
  | 'phone'
  | 'address';

export type AuthIssueType =
  | 'weak_auth'
  | 'missing_auth'
  | 'insecure_session'
  | 'jwt_issue'
  | 'broken_auth'
  | 'privilege_escalation'
  | 'session_fixation';

export type InputVulnerabilityType =
  | 'sql_injection'
  | 'xss'
  | 'csrf'
  | 'path_traversal'
  | 'command_injection'
  | 'file_inclusion'
  | 'xxe'
  | 'buffer_overflow';

export type SecurityCategory =
  | 'authentication'
  | 'authorization'
  | 'input_validation'
  | 'output_encoding'
  | 'cryptography'
  | 'session_management'
  | 'error_handling'
  | 'logging'
  | 'configuration'
  | 'dependency'
  | 'infrastructure';

export type ComplianceStandard =
  | 'owasp_top_10'
  | 'pci_dss'
  | 'gdpr'
  | 'hipaa'
  | 'sox'
  | 'nist'
  | 'iso_27001'
  | 'cis_controls';

// Security Patterns and Rules
export interface SecurityPattern {
  id: string;
  name: string;
  language: string[];
  pattern: RegExp | string;
  severity: SecuritySeverity;
  category: SecurityCategory;
  description: string;
  remediation: string;
  examples: {
    vulnerable: string;
    secure: string;
  };
  references: string[];
}

// Security Analysis Statistics
export interface SecurityAnalysisStats {
  totalFiles: number;
  analyzedFiles: number;
  totalVulnerabilities: number;
  vulnerabilitiesBySerity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  sensitiveDataExposures: number;
  authenticationIssues: number;
  inputValidationIssues: number;
  configurationIssues: number;
  dependencyVulnerabilities: number;
  processingTime: number;
  analysisDate: Date;
}

// Framework-specific Types
export interface FrameworkSecurityProfile {
  name: string;
  version?: string;
  securityFeatures: string[];
  commonVulnerabilities: string[];
  recommendedPractices: string[];
  securityMiddleware: string[];
}

// Security Test Case for TDD
export interface SecurityTestCase {
  id: string;
  name: string;
  description: string;
  input: {
    code: string;
    language: string;
    framework?: string;
  };
  expectedResult: {
    vulnerabilityType?: VulnerabilityType;
    severity: SecuritySeverity;
    shouldDetect: boolean;
    location?: Partial<SourceLocation>;
  };
  category: SecurityCategory;
}

// Security Analyzer Configuration
export interface SecurityAnalyzerConfig {
  version: string;
  enabledChecks: SecurityCheckConfig[];
  rulesets: SecurityRuleset[];
  thresholds: SecurityThresholds;
  reporting: ReportingConfig;
}

export interface SecurityCheckConfig {
  name: string;
  enabled: boolean;
  severity: SecuritySeverity;
  options?: Record<string, any>;
}

export interface SecurityRuleset {
  name: string;
  version: string;
  rules: SecurityRule[];
  language?: string[];
  framework?: string[];
}

export interface SecurityThresholds {
  minSecurityScore: number;
  maxCriticalVulnerabilities: number;
  maxHighVulnerabilities: number;
  maxSensitiveDataExposures: number;
}

export interface ReportingConfig {
  format: 'json' | 'html' | 'pdf' | 'sarif';
  includeRemediation: boolean;
  includeCompliance: boolean;
  groupBy: 'severity' | 'category' | 'file';
}

// Error Handling
export interface SecurityAnalysisError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  severity: 'warning' | 'error' | 'fatal';
  recoverable: boolean;
}