// 코드 분석 엔진 관련 타입 정의

import { Repository, Issue, PullRequest, FileContent, FileChange, Comment, Review } from '../github/types';

// 기본 분석 결과 인터페이스
export interface AnalysisResult {
  id: string;
  type: 'issue' | 'pullrequest' | 'repository';
  githubUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary: AnalysisSummary;
  insights: AnalysisInsight[];
  recommendations: Recommendation[];
  metrics: AnalysisMetrics;
  generatedAt: Date;
  processingTime: number;
  error?: string;
}

// 분석 요약 정보
export interface AnalysisSummary {
  title: string;
  description: string;
  keyFindings: string[];
  complexity: 'low' | 'medium' | 'high';
  impact: 'minor' | 'moderate' | 'major';
  riskLevel: 'low' | 'medium' | 'high';
}

// 분석 인사이트
export interface AnalysisInsight {
  category: 'code_quality' | 'architecture' | 'performance' | 'security' | 'maintainability';
  title: string;
  description: string;
  evidence: string[];
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  sourceFiles?: string[];
  lineNumbers?: number[];
}

// 개선 권장사항
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  actionItems: string[];
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: string;
  estimatedHours?: number;
  prerequisites?: string[];
}

// 분석 메트릭
export interface AnalysisMetrics {
  linesOfCode: number;
  filesAnalyzed: number;
  complexity: number;
  testCoverage?: number;
  technicalDebt?: number;
  duplicateCode?: number;
  dependencies: number;
  codeQualityScore: number; // 0-100
  maintainabilityIndex: number; // 0-100
}

// 특화된 분석 결과 타입들
export interface IssueAnalysisResult extends AnalysisResult {
  type: 'issue';
  issueClassification: IssueClassification;
  relatedFiles: string[];
  estimatedEffort: EffortEstimate;
  similarIssues?: SimilarIssue[];
}

export interface PullRequestAnalysisResult extends AnalysisResult {
  type: 'pullrequest';
  changeAnalysis: ChangeAnalysis;
  reviewSuggestions: ReviewSuggestion[];
  testingRecommendations: TestingRecommendation[];
  deploymentRisks: DeploymentRisk[];
}

export interface RepositoryAnalysisResult extends AnalysisResult {
  type: 'repository';
  architectureOverview: ArchitectureOverview;
  technicalDebtAnalysis: TechnicalDebtAnalysis;
  securityAssessment: SecurityAssessment;
  improvementRoadmap: ImprovementRoadmap;
}

// 분석 컨텍스트
export interface AnalysisContext {
  repository: Repository;
  target: Issue | PullRequest;
  files: FileContent[];
  changes?: FileChange[];
  comments?: Comment[];
  reviews?: Review[];
  options: AnalysisOptions;
}

// 분석 옵션
export interface AnalysisOptions {
  depth: number; // 1-10, 분석 깊이
  includeTests: boolean;
  includeDependencies: boolean;
  includeSecurityCheck: boolean;
  includePerformanceCheck: boolean;
  language?: string;
  framework?: string;
  customRules?: AnalysisRule[];
  excludePatterns?: string[];
  timeoutSeconds?: number;
}

// 사용자 정의 분석 규칙
export interface AnalysisRule {
  id: string;
  name: string;
  description: string;
  pattern: string | RegExp;
  severity: 'info' | 'warning' | 'error';
  category: string;
  enabled: boolean;
}

// Issue 분류
export interface IssueClassification {
  type: 'bug' | 'feature' | 'enhancement' | 'documentation' | 'question';
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string[];
  labels: string[];
  confidence: number;
}

// 노력 추정
export interface EffortEstimate {
  storyPoints: number;
  estimatedHours: number;
  complexity: 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';
  confidence: number;
  assumptions: string[];
}

// 유사한 이슈
export interface SimilarIssue {
  issueNumber: number;
  title: string;
  similarity: number;
  resolution?: string;
  timeToResolve?: number;
}

// 변경사항 분석
export interface ChangeAnalysis {
  changeType: 'bugfix' | 'feature' | 'refactor' | 'performance' | 'security' | 'style';
  impactScope: 'local' | 'module' | 'system' | 'breaking';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedComponents: string[];
  backwardCompatibility: boolean;
  databaseChanges: boolean;
  configurationChanges: boolean;
}

// 리뷰 제안
export interface ReviewSuggestion {
  category: 'logic' | 'performance' | 'security' | 'style' | 'testing';
  title: string;
  description: string;
  file: string;
  lineNumber?: number;
  priority: 'high' | 'medium' | 'low';
  autoFixable: boolean;
  suggestedFix?: string;
}

// 테스트 권장사항
export interface TestingRecommendation {
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  description: string;
  files: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
  testCases: string[];
}

// 배포 위험요소
export interface DeploymentRisk {
  category: 'breaking_change' | 'database' | 'infrastructure' | 'dependency' | 'configuration';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigationSteps: string[];
  rollbackPlan?: string;
}

// 아키텍처 개요
export interface ArchitectureOverview {
  layers: ArchitectureLayer[];
  dependencies: DependencyGraph;
  patterns: ArchitecturePattern[];
  principles: ArchitecturePrinciple[];
  concerns: ArchitectureConcern[];
}

export interface ArchitectureLayer {
  name: string;
  purpose: string;
  components: string[];
  dependencies: string[];
  violations: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: DependencyCycle[];
  metrics: DependencyMetrics;
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'module' | 'class' | 'function' | 'file';
  size: number;
  importance: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  weight: number;
  type: 'import' | 'call' | 'inherit' | 'compose';
}

export interface DependencyCycle {
  nodes: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface DependencyMetrics {
  totalNodes: number;
  totalEdges: number;
  cycleCount: number;
  maxDepth: number;
  averageDegree: number;
}

export interface ArchitecturePattern {
  name: string;
  instances: string[];
  adherence: number; // 0-1
  violations: string[];
  benefits: string[];
}

export interface ArchitecturePrinciple {
  name: string;
  description: string;
  adherence: number; // 0-1
  violations: PrincipleViolation[];
}

export interface PrincipleViolation {
  description: string;
  files: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface ArchitectureConcern {
  category: 'coupling' | 'cohesion' | 'complexity' | 'abstraction';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedAreas: string[];
  recommendations: string[];
}

// 기술 부채 분석
export interface TechnicalDebtAnalysis {
  totalDebt: TechnicalDebtScore;
  categories: TechnicalDebtCategory[];
  hotspots: TechnicalDebtHotspot[];
  trends: TechnicalDebtTrend[];
  paybackPlan: PaybackPlan;
}

export interface TechnicalDebtScore {
  score: number; // 0-100 (100이 최악)
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  estimatedCost: number; // 시간(시간)
  interestRate: number; // 월별 증가율
}

export interface TechnicalDebtCategory {
  name: string;
  description: string;
  score: number;
  items: TechnicalDebtItem[];
}

export interface TechnicalDebtItem {
  type: string;
  description: string;
  file: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  effort: number; // 수정 시간(시간)
  impact: string;
}

export interface TechnicalDebtHotspot {
  file: string;
  score: number;
  issues: string[];
  priority: 'high' | 'medium' | 'low';
  refactoringCost: number;
}

export interface TechnicalDebtTrend {
  date: Date;
  score: number;
  newDebt: number;
  paidDebt: number;
}

export interface PaybackPlan {
  phases: PaybackPhase[];
  totalCost: number;
  expectedBenefits: string[];
  timeline: string;
}

export interface PaybackPhase {
  name: string;
  description: string;
  items: string[];
  effort: number;
  benefits: string[];
  dependencies: string[];
}

// 보안 평가
export interface SecurityAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: SecurityVulnerability[];
  securityPatterns: SecurityPattern[];
  complianceChecks: ComplianceCheck[];
  recommendations: SecurityRecommendation[];
}

export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file: string;
  lineNumber?: number;
  cwe?: string; // Common Weakness Enumeration
  cvss?: number; // Common Vulnerability Scoring System
  remediation: string;
  references: string[];
}

export interface SecurityPattern {
  name: string;
  implemented: boolean;
  coverage: number; // 0-1
  gaps: string[];
  improvements: string[];
}

export interface ComplianceCheck {
  standard: string; // e.g., 'OWASP', 'GDPR', 'SOX'
  status: 'compliant' | 'partial' | 'non_compliant';
  requirements: ComplianceRequirement[];
  score: number; // 0-100
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'met' | 'partial' | 'not_met';
  evidence: string[];
  gaps: string[];
}

export interface SecurityRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  implementation: string[];
  tools: string[];
  timeline: string;
}

// 개선 로드맵
export interface ImprovementRoadmap {
  phases: ImprovementPhase[];
  quickWins: QuickWin[];
  longTermGoals: LongTermGoal[];
  metrics: ImprovementMetrics;
}

export interface ImprovementPhase {
  name: string;
  description: string;
  duration: string;
  objectives: string[];
  deliverables: string[];
  dependencies: string[];
  risks: string[];
  successCriteria: string[];
}

export interface QuickWin {
  title: string;
  description: string;
  effort: 'low' | 'medium';
  impact: 'medium' | 'high';
  category: string;
  implementation: string[];
  timeline: string;
}

export interface LongTermGoal {
  title: string;
  description: string;
  timeline: string;
  milestones: Milestone[];
  benefits: string[];
  challenges: string[];
}

export interface Milestone {
  name: string;
  description: string;
  targetDate: string;
  deliverables: string[];
  successMetrics: string[];
}

export interface ImprovementMetrics {
  currentState: MetricSnapshot;
  targetState: MetricSnapshot;
  kpis: KPI[];
}

export interface MetricSnapshot {
  codeQuality: number;
  testCoverage: number;
  technicalDebt: number;
  performance: number;
  security: number;
  maintainability: number;
}

export interface KPI {
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  timeline: string;
}

// 분석 엔진 인터페이스들
export interface ICodeAnalysisEngine {
  // 메인 분석 메서드들
  analyzeIssue(context: AnalysisContext): Promise<IssueAnalysisResult>;
  analyzePullRequest(context: AnalysisContext): Promise<PullRequestAnalysisResult>;
  analyzeRepository(repository: Repository, options: AnalysisOptions): Promise<RepositoryAnalysisResult>;

  // 유틸리티 메서드들
  analyzeFileDependencies(files: FileContent[]): Promise<DependencyGraph>;
  getAnalysisStatus(analysisId: string): Promise<AnalysisStatus>;
  cancelAnalysis(analysisId: string): Promise<boolean>;
}

export interface ILanguageAnalyzer {
  // 언어별 분석 메서드들
  analyzeJavaScript(files: FileContent[], options: AnalysisOptions): Promise<LanguageAnalysisResult>;
  analyzeTypeScript(files: FileContent[], options: AnalysisOptions): Promise<LanguageAnalysisResult>;
  analyzePython(files: FileContent[], options: AnalysisOptions): Promise<LanguageAnalysisResult>;
  analyzeJava(files: FileContent[], options: AnalysisOptions): Promise<LanguageAnalysisResult>;
  analyzeGo(files: FileContent[], options: AnalysisOptions): Promise<LanguageAnalysisResult>;

  // 공통 메서드들
  detectLanguage(file: FileContent): string | null;
  getSupportedLanguages(): string[];
}

export interface IArchitectureAnalyzer {
  // 아키텍처 분석 메서드들
  analyzeDependencies(files: FileContent[]): Promise<DependencyGraph>;
  detectPatterns(files: FileContent[]): Promise<ArchitecturePattern[]>;
  validatePrinciples(files: FileContent[]): Promise<ArchitecturePrinciple[]>;
  identifyConcerns(files: FileContent[]): Promise<ArchitectureConcern[]>;
}

export interface IQualityAnalyzer {
  // 품질 분석 메서드들
  calculateComplexity(files: FileContent[]): Promise<ComplexityMetrics>;
  detectDuplication(files: FileContent[]): Promise<DuplicationReport>;
  analyzeTestCoverage(files: FileContent[]): Promise<CoverageReport>;
  assessMaintainability(files: FileContent[]): Promise<MaintainabilityReport>;
}

export interface ISecurityAnalyzer {
  // 보안 분석 메서드들
  scanVulnerabilities(files: FileContent[]): Promise<SecurityVulnerability[]>;
  checkCompliance(files: FileContent[], standards: string[]): Promise<ComplianceCheck[]>;
  detectSecrets(files: FileContent[]): Promise<SecretLeak[]>;
  validateSecurityPatterns(files: FileContent[]): Promise<SecurityPattern[]>;
}

export interface IPerformanceAnalyzer {
  // 성능 분석 메서드들
  identifyBottlenecks(files: FileContent[]): Promise<PerformanceIssue[]>;
  analyzeAlgorithmComplexity(files: FileContent[]): Promise<AlgorithmComplexity[]>;
  checkMemoryUsage(files: FileContent[]): Promise<MemoryIssue[]>;
  validateAsyncPatterns(files: FileContent[]): Promise<AsyncPatternIssue[]>;
}

// 추가 타입 정의들
export interface AnalysisStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface LanguageAnalysisResult {
  language: string;
  framework?: string;
  version?: string;
  quality: QualityMetrics;
  patterns: CodePattern[];
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
}

export interface QualityMetrics {
  maintainabilityIndex: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  codeToCommentRatio: number;
  duplicationPercentage: number;
}

export interface CodePattern {
  name: string;
  type: 'design_pattern' | 'anti_pattern' | 'best_practice';
  occurrences: CodeOccurrence[];
  confidence: number;
  description: string;
}

export interface CodeOccurrence {
  file: string;
  startLine: number;
  endLine: number;
  snippet: string;
}

export interface CodeIssue {
  type: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  message: string;
  file: string;
  line?: number;
  column?: number;
  rule?: string;
  suggestion?: string;
}

export interface CodeSuggestion {
  category: string;
  title: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  files: string[];
  examples?: string[];
}

export interface ComplexityMetrics {
  averageComplexity: number;
  maxComplexity: number;
  complexFunctions: ComplexFunction[];
  distribution: ComplexityDistribution;
}

export interface ComplexFunction {
  name: string;
  file: string;
  line: number;
  complexity: number;
  suggestion: string;
}

export interface ComplexityDistribution {
  low: number; // 1-5
  medium: number; // 6-10
  high: number; // 11-20
  veryHigh: number; // 21+
}

export interface DuplicationReport {
  duplicatedLines: number;
  duplicatedBlocks: number;
  duplicationPercentage: number;
  duplicatedBlocks: DuplicatedBlock[];
}

export interface DuplicatedBlock {
  id: string;
  lines: number;
  occurrences: DuplicationOccurrence[];
  similarity: number;
}

export interface DuplicationOccurrence {
  file: string;
  startLine: number;
  endLine: number;
  snippet: string;
}

export interface CoverageReport {
  linesCovered: number;
  linesTotal: number;
  coveragePercentage: number;
  branchesCovered: number;
  branchesTotal: number;
  branchCoveragePercentage: number;
  fileCoverage: FileCoverage[];
}

export interface FileCoverage {
  file: string;
  linesCovered: number;
  linesTotal: number;
  coveragePercentage: number;
  uncoveredLines: number[];
}

export interface MaintainabilityReport {
  overallScore: number; // 0-100
  fileScores: FileMaintainabilityScore[];
  factors: MaintainabilityFactor[];
  trends: MaintainabilityTrend[];
}

export interface FileMaintainabilityScore {
  file: string;
  score: number;
  factors: { [key: string]: number };
  issues: string[];
}

export interface MaintainabilityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface MaintainabilityTrend {
  date: Date;
  score: number;
  change: number;
}

export interface SecretLeak {
  type: 'api_key' | 'password' | 'token' | 'certificate' | 'connection_string';
  file: string;
  line: number;
  snippet: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceIssue {
  type: 'algorithm' | 'database' | 'memory' | 'network' | 'cpu';
  description: string;
  file: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  suggestion: string;
  estimatedImprovement?: string;
}

export interface AlgorithmComplexity {
  function: string;
  file: string;
  line: number;
  timeComplexity: string; // e.g., "O(n²)"
  spaceComplexity: string; // e.g., "O(n)"
  suggestion?: string;
  betterAlgorithm?: string;
}

export interface MemoryIssue {
  type: 'leak' | 'excessive_usage' | 'inefficient_structure';
  description: string;
  file: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

export interface AsyncPatternIssue {
  type: 'callback_hell' | 'promise_anti_pattern' | 'race_condition' | 'deadlock';
  description: string;
  file: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  example?: string;
}