import { FileContent } from '../github/types';

// Core Analysis Types
export interface ICodeQualityAnalyzer {
  analyzeQuality(context: CodeQualityAnalysisContext): Promise<CodeQualityAnalysisResult>;
  analyzeComplexity(files: FileContent[]): Promise<ComplexityAnalysisResult>;
  analyzeMaintainability(files: FileContent[]): Promise<MaintainabilityAnalysisResult>;
  analyzeStyle(files: FileContent[]): Promise<StyleAnalysisResult>;
  analyzeTechnicalDebt(files: FileContent[]): Promise<TechnicalDebtAnalysisResult>;
  analyzeTestQuality(files: FileContent[]): Promise<TestQualityAnalysisResult>;
}

// Input Types
export interface CodeQualityAnalysisContext {
  files: FileContent[];
  analysisOptions: QualityAnalysisOptions;
  projectMetadata: ProjectMetadata;
  testFiles?: FileContent[];
}

export interface QualityAnalysisOptions {
  enableComplexityAnalysis: boolean;
  enableMaintainabilityAnalysis: boolean;
  enableStyleAnalysis: boolean;
  enableTechnicalDebtAnalysis: boolean;
  enableTestQualityAnalysis: boolean;
  languageSpecificRules: LanguageRule[];
  customThresholds: QualityThresholds;
}

export interface ProjectMetadata {
  name: string;
  version: string;
  language: string;
  framework?: string;
  dependencies: string[];
  devDependencies: string[];
  totalFiles: number;
  totalLines: number;
}

// Quality Thresholds
export interface QualityThresholds {
  complexity: ComplexityThresholds;
  maintainability: MaintainabilityThresholds;
  style: StyleThresholds;
  technicalDebt: TechnicalDebtThresholds;
  testQuality: TestQualityThresholds;
}

export interface ComplexityThresholds {
  cyclomaticComplexity: {
    low: number;
    moderate: number;
    high: number;
    extreme: number;
  };
  cognitiveComplexity: {
    low: number;
    moderate: number;
    high: number;
    extreme: number;
  };
  halsteadVolume: {
    acceptable: number;
    warning: number;
    critical: number;
  };
  maxFunctionLength: number;
  maxParameterCount: number;
  maxNestingDepth: number;
}

export interface MaintainabilityThresholds {
  maintainabilityIndex: {
    excellent: number;
    good: number;
    moderate: number;
    poor: number;
    legacy: number;
  };
  duplicatedLines: {
    acceptable: number;
    warning: number;
    critical: number;
  };
  maxClassLength: number;
  maxMethodLength: number;
}

export interface StyleThresholds {
  naming: {
    minLength: number;
    maxLength: number;
    conventionCompliance: number;
  };
  formatting: {
    consistencyScore: number;
    indentationCompliance: number;
  };
  documentation: {
    commentRatio: number;
    documentationCoverage: number;
  };
}

export interface TechnicalDebtThresholds {
  codeSmells: {
    maxPerFile: number;
    severityThreshold: number;
  };
  designPatterns: {
    solidComplianceScore: number;
    patternUsageScore: number;
  };
  dependencies: {
    maxCircularDependencies: number;
    maxDependencyDepth: number;
  };
}

export interface TestQualityThresholds {
  coverage: {
    lineThreshold: number;
    branchThreshold: number;
    functionThreshold: number;
  };
  testSmells: {
    maxPerFile: number;
    complexityThreshold: number;
  };
  assertions: {
    qualityScore: number;
    coverageScore: number;
  };
}

// Language Rules
export interface LanguageRule {
  language: string;
  framework?: string;
  rules: QualityRule[];
}

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  category: QualityCategory;
  severity: QualitySeverity;
  pattern: RegExp;
  message: string;
  suggestion: string;
  examples: RuleExample[];
}

export interface RuleExample {
  bad: string;
  good: string;
  explanation: string;
}

// Result Types
export interface CodeQualityAnalysisResult {
  id: string;
  timestamp: Date;
  overallQualityScore: number; // 0-100
  qualityGrade: QualityGrade;
  complexityMetrics: ComplexityMetrics;
  maintainabilityMetrics: MaintainabilityMetrics;
  styleMetrics: StyleMetrics;
  technicalDebtMetrics: TechnicalDebtMetrics;
  testQualityMetrics?: TestQualityMetrics;
  recommendations: QualityRecommendation[];
  qualityTrends: QualityTrend[];
  fileQualityScores: FileQualityScore[];
  summary: QualitySummary;
}

// Complexity Analysis
export interface ComplexityAnalysisResult {
  totalComplexityScore: number;
  complexityDistribution: ComplexityDistribution;
  complexityIssues: ComplexityIssue[];
  cyclomaticComplexity: CyclomaticComplexityResult;
  cognitiveComplexity: CognitiveComplexityResult;
  halsteadMetrics: HalsteadMetrics;
  functionComplexity: FunctionComplexityResult[];
}

export interface ComplexityMetrics {
  averageComplexity: number;
  maxComplexity: number;
  complexityVariance: number;
  totalFunctions: number;
  complexFunctions: number;
  complexityTrend: ComplexityTrend;
}

export interface ComplexityDistribution {
  low: number;
  moderate: number;
  high: number;
  extreme: number;
}

export interface ComplexityIssue {
  id: string;
  type: ComplexityType;
  severity: QualitySeverity;
  functionName: string;
  className?: string;
  location: SourceLocation;
  complexity: number;
  threshold: number;
  description: string;
  suggestion: string;
  impact: ComplexityImpact;
}

export interface CyclomaticComplexityResult {
  average: number;
  maximum: number;
  functions: FunctionComplexity[];
  distribution: ComplexityDistribution;
}

export interface CognitiveComplexityResult {
  average: number;
  maximum: number;
  functions: FunctionComplexity[];
  cognitiveLoad: CognitiveLoad;
}

export interface HalsteadMetrics {
  volume: number;
  difficulty: number;
  effort: number;
  timeRequired: number;
  bugsDelivered: number;
  vocabulary: number;
  length: number;
}

export interface FunctionComplexity {
  name: string;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  parameters: number;
  nestingDepth: number;
  location: SourceLocation;
}

export interface FunctionComplexityResult {
  functionName: string;
  className?: string;
  complexity: number;
  type: ComplexityType;
  location: SourceLocation;
  metrics: {
    cyclomatic: number;
    cognitive: number;
    halstead: number;
    linesOfCode: number;
  };
}

// Maintainability Analysis
export interface MaintainabilityAnalysisResult {
  maintainabilityIndex: number;
  maintainabilityGrade: MaintenanceGrade;
  duplicationAnalysis: DuplicationAnalysisResult;
  cohesionMetrics: CohesionMetrics;
  couplingMetrics: CouplingMetrics;
  maintainabilityIssues: MaintainabilityIssue[];
}

export interface MaintainabilityMetrics {
  maintainabilityIndex: number;
  codeduplication: number;
  averageMethodLength: number;
  averageClassSize: number;
  cohesion: number;
  coupling: number;
  maintainabilityTrend: MaintainabilityTrend;
}

export interface DuplicationAnalysisResult {
  duplicatedLines: number;
  duplicatedBlocks: number;
  duplicationPercentage: number;
  duplicatedFiles: DuplicatedFile[];
  duplicatedSections: DuplicatedSection[];
}

export interface DuplicatedFile {
  file1: string;
  file2: string;
  duplicatedLines: number;
  similarity: number;
  sections: DuplicatedSection[];
}

export interface DuplicatedSection {
  content: string;
  locations: SourceLocation[];
  lines: number;
  tokens: number;
  similarity: number;
}

export interface CohesionMetrics {
  classicCohesion: number;
  relationalCohesion: number;
  lackOfCohesion: number;
  cohesiveClasses: number;
  totalClasses: number;
}

export interface CouplingMetrics {
  afferentCoupling: number;
  efferentCoupling: number;
  instability: number;
  abstractness: number;
  distance: number;
}

export interface MaintainabilityIssue {
  id: string;
  type: MaintainabilityType;
  severity: QualitySeverity;
  title: string;
  description: string;
  location: SourceLocation;
  impact: MaintainabilityImpact;
  remediation: RemediationSuggestion;
}

// Style Analysis
export interface StyleAnalysisResult {
  overallStyleScore: number;
  styleGrade: StyleGrade;
  namingAnalysis: NamingAnalysisResult;
  formattingAnalysis: FormattingAnalysisResult;
  documentationAnalysis: DocumentationAnalysisResult;
  conventionCompliance: ConventionComplianceResult;
  styleIssues: StyleIssue[];
}

export interface StyleMetrics {
  namingConsistency: number;
  formattingConsistency: number;
  documentationCoverage: number;
  conventionCompliance: number;
  commentQuality: number;
  styleTrend: StyleTrend;
}

export interface NamingAnalysisResult {
  conventionCompliance: number;
  consistencyScore: number;
  namingIssues: NamingIssue[];
  patterns: NamingPattern[];
}

export interface FormattingAnalysisResult {
  indentationConsistency: number;
  spacingConsistency: number;
  lineBreakConsistency: number;
  formattingIssues: FormattingIssue[];
}

export interface DocumentationAnalysisResult {
  commentCoverage: number;
  docStringCoverage: number;
  inlineCommentQuality: number;
  apiDocumentation: number;
  documentationIssues: DocumentationIssue[];
}

export interface ConventionComplianceResult {
  overallCompliance: number;
  languageConventions: LanguageConventionResult[];
  frameworkConventions: FrameworkConventionResult[];
}

export interface NamingIssue {
  id: string;
  type: NamingIssueType;
  severity: QualitySeverity;
  name: string;
  suggestion: string;
  location: SourceLocation;
  convention: string;
}

export interface FormattingIssue {
  id: string;
  type: FormattingIssueType;
  severity: QualitySeverity;
  description: string;
  location: SourceLocation;
  suggestion: string;
}

export interface DocumentationIssue {
  id: string;
  type: DocumentationIssueType;
  severity: QualitySeverity;
  description: string;
  location: SourceLocation;
  suggestion: string;
  missingElements: string[];
}

// Technical Debt Analysis
export interface TechnicalDebtAnalysisResult {
  totalDebtScore: number;
  debtGrade: DebtGrade;
  codeSmells: CodeSmellAnalysisResult;
  designIssues: DesignIssueAnalysisResult;
  dependencyIssues: DependencyIssueAnalysisResult;
  debtEstimation: DebtEstimation;
  prioritizedDebt: PrioritizedDebtItem[];
}

export interface TechnicalDebtMetrics {
  totalDebtHours: number;
  debtRatio: number;
  interestRate: number;
  remediationCost: number;
  businessImpact: number;
  debtTrend: DebtTrend;
}

export interface CodeSmellAnalysisResult {
  totalSmells: number;
  smellDistribution: SmellDistribution;
  codeSmells: CodeSmell[];
  smellDensity: number;
}

export interface DesignIssueAnalysisResult {
  solidViolations: SolidViolation[];
  patternMisuse: PatternMisuse[];
  architecturalDebt: ArchitecturalDebt[];
  designScore: number;
}

export interface DependencyIssueAnalysisResult {
  circularDependencies: CircularDependency[];
  dependencyViolations: DependencyViolation[];
  couplingIssues: CouplingIssue[];
  dependencyComplexity: DependencyComplexity;
}

export interface DebtEstimation {
  principal: number; // 현재 기술부채 비용 (hours)
  interest: number;  // 지속적 유지보수 비용 (hours/month)
  category: DebtCategory;
  severity: QualitySeverity;
  confidence: number; // 0-100
}

export interface CodeSmell {
  id: string;
  type: CodeSmellType;
  severity: QualitySeverity;
  name: string;
  description: string;
  location: SourceLocation;
  examples: string[];
  remediation: SmellRemediation;
  effort: EffortEstimate;
}

// Test Quality Analysis
export interface TestQualityAnalysisResult {
  overallTestScore: number;
  testGrade: TestGrade;
  coverageAnalysis: CoverageAnalysisResult;
  testComplexityAnalysis: TestComplexityAnalysisResult;
  testSmellAnalysis: TestSmellAnalysisResult;
  assertionQualityAnalysis: AssertionQualityAnalysisResult;
}

export interface TestQualityMetrics {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  testComplexity: number;
  testSmells: number;
  assertionQuality: number;
  testTrend: TestTrend;
}

export interface CoverageAnalysisResult {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;
  uncoveredFiles: UncoveredFile[];
  coverageByFile: FileCoverageResult[];
}

export interface TestComplexityAnalysisResult {
  averageComplexity: number;
  complexTests: ComplexTest[];
  testDuplication: TestDuplication[];
}

export interface TestSmellAnalysisResult {
  totalSmells: number;
  testSmells: TestSmell[];
  smellDistribution: TestSmellDistribution;
}

export interface AssertionQualityAnalysisResult {
  assertionCoverage: number;
  assertionQuality: number;
  weakAssertions: WeakAssertion[];
  missingAssertions: MissingAssertion[];
}

// Recommendations
export interface QualityRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  category: QualityCategory;
  title: string;
  description: string;
  location: SourceLocation;
  impact: ImpactAssessment;
  effort: EffortEstimate;
  examples: CodeExample[];
  resources: LearningResource[];
  automationPossible: boolean;
}

export interface ImpactAssessment {
  businessValue: number; // 0-100
  technicalValue: number; // 0-100
  riskReduction: number; // 0-100
  maintainabilityImprovement: number; // 0-100
  performanceImpact: number; // 0-100
}

export interface EffortEstimate {
  timeEstimate: number; // hours
  complexity: EffortComplexity;
  skillLevel: SkillLevel;
  dependencies: string[];
  riskFactors: string[];
}

export interface CodeExample {
  title: string;
  description: string;
  before: string;
  after: string;
  explanation: string;
  benefits: string[];
}

export interface LearningResource {
  title: string;
  type: ResourceType;
  url: string;
  description: string;
  difficulty: ResourceDifficulty;
}

// Quality Trends
export interface QualityTrend {
  metric: string;
  timeline: TimePoint[];
  trend: TrendDirection;
  changeRate: number;
  predictions: QualityPrediction[];
  seasonality: SeasonalityInfo;
}

export interface TimePoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface QualityPrediction {
  timeframe: string; // '1week', '1month', '3months'
  predictedValue: number;
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  influence: number; // -100 to 100
  description: string;
}

// File Quality Scores
export interface FileQualityScore {
  filePath: string;
  overallScore: number;
  complexityScore: number;
  maintainabilityScore: number;
  styleScore: number;
  testCoverageScore?: number;
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  lastModified: Date;
  linesOfCode: number;
}

export interface QualityIssue {
  id: string;
  type: QualityIssueType;
  severity: QualitySeverity;
  category: QualityCategory;
  title: string;
  description: string;
  location: SourceLocation;
  rule?: string;
  suggestion: string;
  autoFixable: boolean;
}

// Summary Types
export interface QualitySummary {
  executiveSummary: string;
  keyFindings: KeyFinding[];
  criticalIssues: CriticalIssue[];
  improvements: ImprovementArea[];
  nextSteps: NextStep[];
  qualityEvolution: QualityEvolution;
}

export interface KeyFinding {
  area: QualityCategory;
  finding: string;
  impact: string;
  recommendation: string;
  priority: RecommendationPriority;
}

export interface CriticalIssue {
  issue: string;
  severity: QualitySeverity;
  affectedFiles: string[];
  businessImpact: string;
  urgency: number; // 0-100
}

export interface ImprovementArea {
  area: QualityCategory;
  currentScore: number;
  targetScore: number;
  effort: EffortEstimate;
  benefits: string[];
}

export interface NextStep {
  step: string;
  description: string;
  priority: RecommendationPriority;
  owner: string;
  timeline: string;
  dependencies: string[];
}

// Utility Types
export interface SourceLocation {
  file: string;
  startLine: number;
  endLine?: number;
  startColumn: number;
  endColumn?: number;
  context?: string;
}

export interface NamingPattern {
  pattern: string;
  count: number;
  consistency: number;
  examples: string[];
}

export interface LanguageConventionResult {
  language: string;
  compliance: number;
  violations: ConventionViolation[];
}

export interface FrameworkConventionResult {
  framework: string;
  compliance: number;
  violations: ConventionViolation[];
}

export interface ConventionViolation {
  rule: string;
  description: string;
  location: SourceLocation;
  suggestion: string;
}

export interface PrioritizedDebtItem {
  item: string;
  debtAmount: number;
  priority: number;
  category: DebtCategory;
  location: SourceLocation;
  remediation: RemediationSuggestion;
}

export interface SolidViolation {
  principle: SolidPrinciple;
  description: string;
  location: SourceLocation;
  severity: QualitySeverity;
  suggestion: string;
}

export interface PatternMisuse {
  pattern: string;
  issue: string;
  location: SourceLocation;
  correctUsage: string;
}

export interface ArchitecturalDebt {
  component: string;
  debtType: string;
  description: string;
  impact: string;
  remediation: string;
}

export interface CircularDependency {
  cycle: string[];
  severity: QualitySeverity;
  suggestion: string;
}

export interface DependencyViolation {
  from: string;
  to: string;
  rule: string;
  severity: QualitySeverity;
}

export interface CouplingIssue {
  source: string;
  target: string;
  couplingType: CouplingType;
  strength: number;
  suggestion: string;
}

export interface DependencyComplexity {
  totalDependencies: number;
  averageDepth: number;
  maxDepth: number;
  circularCount: number;
}

export interface SmellRemediation {
  technique: string;
  description: string;
  effort: EffortEstimate;
  examples: CodeExample[];
}

export interface UncoveredFile {
  filePath: string;
  linesOfCode: number;
  coveragePercentage: number;
  criticalUncoveredSections: UncoveredSection[];
}

export interface UncoveredSection {
  startLine: number;
  endLine: number;
  importance: SectionImportance;
  reason: string;
}

export interface FileCoverageResult {
  filePath: string;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  uncoveredLines: number[];
  uncoveredBranches: UncoveredBranch[];
}

export interface UncoveredBranch {
  line: number;
  condition: string;
  truthiness: boolean;
}

export interface ComplexTest {
  testName: string;
  complexity: number;
  location: SourceLocation;
  issues: string[];
  suggestions: string[];
}

export interface TestDuplication {
  tests: string[];
  similarity: number;
  duplicatedLines: number;
  suggestion: string;
}

export interface TestSmell {
  id: string;
  type: TestSmellType;
  severity: QualitySeverity;
  testName: string;
  description: string;
  location: SourceLocation;
  remediation: string;
}

export interface WeakAssertion {
  testName: string;
  assertion: string;
  location: SourceLocation;
  issue: string;
  betterAssertion: string;
}

export interface MissingAssertion {
  testName: string;
  location: SourceLocation;
  missingCheck: string;
  suggestedAssertion: string;
}

export interface RemediationSuggestion {
  technique: string;
  description: string;
  effort: EffortEstimate;
  benefits: string[];
  risks: string[];
  steps: RemediationStep[];
}

export interface RemediationStep {
  step: number;
  action: string;
  description: string;
  estimatedTime: number; // minutes
  riskLevel: RiskLevel;
}

export interface SeasonalityInfo {
  hasSeasonality: boolean;
  pattern?: string;
  strength?: number;
  cycle?: string;
}

export interface QualityEvolution {
  overallTrend: TrendDirection;
  periodComparison: PeriodComparison;
  milestones: QualityMilestone[];
  regressions: QualityRegression[];
}

export interface PeriodComparison {
  current: QualitySnapshot;
  previous: QualitySnapshot;
  change: QualityChange;
}

export interface QualitySnapshot {
  period: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  keyMetrics: Record<string, number>;
}

export interface QualityChange {
  scoreChange: number;
  percentageChange: number;
  significantChanges: SignificantChange[];
  improvements: string[];
  regressions: string[];
}

export interface SignificantChange {
  metric: string;
  oldValue: number;
  newValue: number;
  change: number;
  significance: ChangeSignificance;
}

export interface QualityMilestone {
  date: Date;
  achievement: string;
  description: string;
  impact: string;
}

export interface QualityRegression {
  date: Date;
  area: QualityCategory;
  description: string;
  impact: string;
  resolution?: string;
}

export interface CategoryScore {
  category: QualityCategory;
  score: number;
  trend: TrendDirection;
}

// Enum Types
export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type MaintenanceGrade = 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Legacy';
export type StyleGrade = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Inconsistent';
export type DebtGrade = 'Low' | 'Moderate' | 'High' | 'Critical' | 'Excessive';
export type TestGrade = 'Excellent' | 'Good' | 'Adequate' | 'Poor' | 'Insufficient';

export type QualitySeverity = 'low' | 'medium' | 'high' | 'critical';
export type QualityCategory = 'complexity' | 'maintainability' | 'style' | 'testing' | 'architecture' | 'security' | 'performance';

export type ComplexityType = 'cyclomatic' | 'cognitive' | 'halstead' | 'nesting' | 'length';
export type MaintainabilityType = 'duplication' | 'cohesion' | 'coupling' | 'size' | 'complexity';
export type CodeSmellType = 'large_class' | 'long_method' | 'god_class' | 'feature_envy' | 'data_class' | 'duplicate_code' | 'dead_code' | 'magic_numbers' | 'long_parameter_list';
export type TestSmellType = 'assertion_roulette' | 'conditional_test_logic' | 'constructor_initialization' | 'default_test' | 'duplicate_assert' | 'eager_test' | 'empty_test' | 'exception_catching_throwing' | 'general_fixture' | 'magic_number_test' | 'mystery_guest' | 'resource_optimism' | 'sensitive_equality' | 'test_code_duplication' | 'verbose_test';

export type RecommendationType = 'refactor' | 'optimize' | 'fix' | 'enhance' | 'document' | 'test';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type NamingIssueType = 'inconsistent_case' | 'unclear_name' | 'abbreviation' | 'too_short' | 'too_long' | 'misleading';
export type FormattingIssueType = 'indentation' | 'spacing' | 'line_breaks' | 'brackets' | 'semicolons';
export type DocumentationIssueType = 'missing_comment' | 'outdated_comment' | 'missing_docstring' | 'poor_comment_quality';

export type QualityIssueType = 'complexity' | 'maintainability' | 'style' | 'smell' | 'test' | 'documentation';

export type TrendDirection = 'improving' | 'stable' | 'degrading';
export type EffortComplexity = 'simple' | 'moderate' | 'complex' | 'very_complex';
export type SkillLevel = 'junior' | 'mid' | 'senior' | 'expert';
export type ResourceType = 'article' | 'documentation' | 'tutorial' | 'video' | 'book' | 'course';
export type ResourceDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type DebtCategory = 'architecture' | 'code_quality' | 'testing' | 'documentation' | 'performance' | 'security';
export type SolidPrinciple = 'SRP' | 'OCP' | 'LSP' | 'ISP' | 'DIP';
export type CouplingType = 'data' | 'stamp' | 'control' | 'external' | 'common' | 'content';

export type SectionImportance = 'critical' | 'important' | 'normal' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ChangeSignificance = 'minor' | 'moderate' | 'major' | 'critical';

// Complex nested types
export interface ComplexityTrend {
  direction: TrendDirection;
  rate: number;
  timeline: TimePoint[];
  factors: string[];
}

export interface MaintainabilityTrend {
  direction: TrendDirection;
  rate: number;
  timeline: TimePoint[];
  factors: string[];
}

export interface StyleTrend {
  direction: TrendDirection;
  rate: number;
  timeline: TimePoint[];
  factors: string[];
}

export interface DebtTrend {
  direction: TrendDirection;
  rate: number;
  timeline: TimePoint[];
  factors: string[];
}

export interface TestTrend {
  direction: TrendDirection;
  rate: number;
  timeline: TimePoint[];
  factors: string[];
}

export interface ComplexityImpact {
  readability: number;
  testability: number;
  maintainability: number;
  performance: number;
  bugsLikelihood: number;
}

export interface MaintainabilityImpact {
  changeEffort: number;
  riskLevel: number;
  teamProductivity: number;
  technicalDebt: number;
  businessAgility: number;
}

export interface CognitiveLoad {
  average: number;
  maximum: number;
  distribution: CognitiveLoadDistribution;
  factors: CognitiveLoadFactor[];
}

export interface CognitiveLoadDistribution {
  low: number;
  moderate: number;
  high: number;
  extreme: number;
}

export interface CognitiveLoadFactor {
  factor: string;
  contribution: number;
  description: string;
  examples: string[];
}

export interface SmellDistribution {
  structural: number;
  behavioral: number;
  architectural: number;
  testSmells: number;
}

export interface TestSmellDistribution {
  assertion: number;
  fixture: number;
  organization: number;
  duplication: number;
  conditional: number;
}