import { FileContent } from '../github/types';

// Core Performance Analysis Interfaces
export interface IPerformanceAnalyzer {
  analyzePerformance(context: PerformanceAnalysisContext): Promise<PerformanceAnalysisResult>;
  detectBottlenecks(files: FileContent[]): Promise<BottleneckAnalysisResult>;
  analyzeAlgorithmComplexity(files: FileContent[]): Promise<ComplexityAnalysisResult>;
  analyzeMemoryUsage(files: FileContent[]): Promise<MemoryAnalysisResult>;
  analyzeDatabasePerformance(files: FileContent[]): Promise<DatabasePerformanceResult>;
}

// Analysis Context and Options
export interface PerformanceAnalysisContext {
  files: FileContent[];
  language: string;
  framework?: string;
  environment: 'development' | 'production' | 'testing';
  targetPerformance: PerformanceTarget;
  analysisOptions: PerformanceAnalysisOptions;
}

export interface PerformanceAnalysisOptions {
  enableBottleneckDetection: boolean;
  enableComplexityAnalysis: boolean;
  enableMemoryAnalysis: boolean;
  enableDatabaseAnalysis: boolean;
  performanceThreshold: PerformanceThreshold;
  customRules?: PerformanceRule[];
}

export interface PerformanceThreshold {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  maxDatabaseQueryTime: number; // milliseconds
  maxComplexity: string; // O(n²) 등
}

export interface PerformanceTarget {
  targetLatency: number; // milliseconds
  targetThroughput: number; // requests per second
  targetMemoryLimit: number; // MB
  targetCpuUsage: number; // percentage
}

export interface PerformanceRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: PerformanceSeverity;
  category: PerformanceCategory;
  recommendation: string;
}

// Main Performance Analysis Result
export interface PerformanceAnalysisResult {
  id: string;
  overallPerformanceScore: number; // 0-100
  performanceLevel: PerformanceLevel;
  bottlenecks: PerformanceBottleneck[];
  complexityIssues: ComplexityIssue[];
  memoryIssues: MemoryIssue[];
  databaseIssues: DatabasePerformanceIssue[];
  optimizationRecommendations: OptimizationRecommendation[];
  performanceMetrics: PerformanceMetrics;
  generatedAt: Date;
  analysisVersion: string;
}

// Bottleneck Analysis
export interface BottleneckAnalysisResult {
  totalBottlenecks: number;
  criticalBottlenecks: number;
  bottlenecks: PerformanceBottleneck[];
  bottleneckDistribution: BottleneckDistribution;
  estimatedPerformanceImpact: number; // percentage
}

export interface PerformanceBottleneck {
  id: string;
  type: BottleneckType;
  severity: PerformanceSeverity;
  title: string;
  description: string;
  location: SourceLocation;
  impact: PerformanceImpact;
  estimatedSlowdown: number; // percentage
  recommendation: string;
  codeExample: string;
  optimizationDifficulty: OptimizationDifficulty;
}

export interface BottleneckDistribution {
  loopOptimization: number;
  ioOperations: number;
  algorithmEfficiency: number;
  memoryUsage: number;
  databaseQueries: number;
  networkRequests: number;
}

// Complexity Analysis
export interface ComplexityAnalysisResult {
  overallComplexityScore: number;
  issues: ComplexityIssue[];
  complexityDistribution: ComplexityDistribution;
  recommendations: string[];
}

export interface ComplexityIssue {
  id: string;
  complexityType: ComplexityType;
  currentComplexity: string; // O(n), O(n²), etc.
  expectedComplexity: string;
  severity: PerformanceSeverity;
  location: SourceLocation;
  algorithmType: string;
  optimizationSuggestion: string;
  impactAnalysis: ComplexityImpact;
}

export interface ComplexityDistribution {
  constant: number; // O(1)
  logarithmic: number; // O(log n)
  linear: number; // O(n)
  linearithmic: number; // O(n log n)
  quadratic: number; // O(n²)
  cubic: number; // O(n³)
  exponential: number; // O(2^n)
  factorial: number; // O(n!)
}

export interface ComplexityImpact {
  inputSizeThreshold: number;
  estimatedExecutionTime: {
    small: number; // ms
    medium: number; // ms
    large: number; // ms
  };
  scalabilityRating: 'excellent' | 'good' | 'moderate' | 'poor';
}

// Memory Analysis
export interface MemoryAnalysisResult {
  overallMemoryScore: number;
  estimatedMemoryUsage: number; // MB
  issues: MemoryIssue[];
  memoryOptimizationPotential: number; // percentage
  recommendations: string[];
}

export interface MemoryIssue {
  id: string;
  issueType: MemoryIssueType;
  severity: PerformanceSeverity;
  location: SourceLocation;
  description: string;
  memoryImpact: number; // estimated MB
  recommendation: string;
  codePattern: string;
  preventionStrategy: string;
}

// Database Performance Analysis
export interface DatabasePerformanceResult {
  overallDatabaseScore: number;
  issues: DatabasePerformanceIssue[];
  queryAnalysis: QueryAnalysis[];
  optimizationSuggestions: DatabaseOptimizationSuggestion[];
}

export interface DatabasePerformanceIssue {
  id: string;
  issueType: DatabaseIssueType;
  severity: PerformanceSeverity;
  location: SourceLocation;
  queryPattern: string;
  estimatedImpact: string;
  optimizationSuggestion: string;
  indexRecommendations?: string[];
}

export interface QueryAnalysis {
  query: string;
  estimatedExecutionTime: number; // milliseconds
  complexity: QueryComplexity;
  resourceUsage: QueryResourceUsage;
  optimizationPriority: 'low' | 'medium' | 'high' | 'critical';
}

export interface QueryResourceUsage {
  cpuIntensive: boolean;
  memoryIntensive: boolean;
  ioIntensive: boolean;
  networkIntensive: boolean;
}

// Optimization Recommendations
export interface OptimizationRecommendation {
  id: string;
  category: PerformanceCategory;
  title: string;
  description: string;
  priority: OptimizationPriority;
  difficulty: OptimizationDifficulty;
  estimatedGain: EstimatedGain;
  implementation: ImplementationGuide;
  codeExample?: CodeOptimizationExample;
  resources: string[];
}

export interface EstimatedGain {
  performanceImprovement: number; // percentage
  memoryReduction: number; // MB
  executionTimeReduction: number; // milliseconds
  scalabilityImprovement: string;
}

export interface ImplementationGuide {
  steps: string[];
  prerequisites: string[];
  testingStrategy: string[];
  rollbackPlan: string[];
}

export interface CodeOptimizationExample {
  before: string;
  after: string;
  explanation: string;
  measuredImprovement?: string;
}

export interface DatabaseOptimizationSuggestion {
  type: 'query' | 'index' | 'schema' | 'configuration';
  description: string;
  implementation: string;
  expectedBenefit: string;
  complexity: OptimizationDifficulty;
}

// Performance Metrics
export interface PerformanceMetrics {
  executionTimeMetrics: ExecutionTimeMetrics;
  memoryMetrics: MemoryMetrics;
  complexityMetrics: ComplexityMetrics;
  databaseMetrics: DatabaseMetrics;
  overallEfficiency: OverallEfficiency;
}

export interface ExecutionTimeMetrics {
  averageExecutionTime: number; // milliseconds
  maxExecutionTime: number; // milliseconds
  bottleneckCount: number;
  timeComplexityRating: number; // 1-10 scale
}

export interface MemoryMetrics {
  estimatedMemoryUsage: number; // MB
  memoryEfficiencyRating: number; // 1-10 scale
  memoryLeakRisk: number; // 1-10 scale
  garbageCollectionImpact: number; // 1-10 scale
}

export interface ComplexityMetrics {
  averageComplexity: string;
  worstComplexity: string;
  complexityVariance: number;
  algorithmicEfficiency: number; // 1-10 scale
}

export interface DatabaseMetrics {
  queryCount: number;
  averageQueryTime: number; // milliseconds
  nPlusOneQueries: number;
  indexUtilization: number; // percentage
}

export interface OverallEfficiency {
  cpuEfficiency: number; // percentage
  memoryEfficiency: number; // percentage
  ioEfficiency: number; // percentage
  scalabilityRating: number; // 1-10 scale
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
export type PerformanceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PerformanceLevel = 'excellent' | 'good' | 'moderate' | 'poor';
export type OptimizationPriority = 'low' | 'medium' | 'high' | 'critical';
export type OptimizationDifficulty = 'easy' | 'medium' | 'hard';
export type ComplexityType = 'time' | 'space';
export type QueryComplexity = 'simple' | 'moderate' | 'complex' | 'very_complex';

export type BottleneckType =
  | 'nested_loops'
  | 'dom_manipulation_in_loop'
  | 'array_length_recalculation'
  | 'object_creation_in_loop'
  | 'blocking_io'
  | 'memory_leak'
  | 'inefficient_rendering'
  | 'middleware_ordering'
  | 'excessive_reactivity'
  | 'blocking_operation'
  | 'sequential_async'
  | 'excessive_concurrency'
  | 'string_concatenation'
  | 'regex_in_loop'
  | 'file_system_operations'
  | 'network_requests'
  | 'cpu_intensive_calculation';

export type MemoryIssueType =
  | 'unnecessary_memory_allocation'
  | 'closure_memory_leak'
  | 'global_memory_usage'
  | 'event_listener_leak'
  | 'circular_reference'
  | 'large_object_retention'
  | 'inefficient_data_structure'
  | 'memory_fragmentation'
  | 'excessive_caching'
  | 'detached_dom_nodes';

export type DatabaseIssueType =
  | 'n_plus_one_query'
  | 'inefficient_select'
  | 'index_not_used'
  | 'missing_pagination'
  | 'complex_join'
  | 'full_table_scan'
  | 'redundant_queries'
  | 'slow_aggregation'
  | 'missing_foreign_key'
  | 'inefficient_sorting';

export type PerformanceCategory =
  | 'algorithm'
  | 'memory'
  | 'database'
  | 'network'
  | 'rendering'
  | 'computation'
  | 'io_operations'
  | 'concurrency'
  | 'caching'
  | 'optimization';

export type AlgorithmPattern =
  | 'bubble_sort'
  | 'linear_search'
  | 'nested_iteration'
  | 'recursive_fibonacci'
  | 'string_manipulation'
  | 'array_operations'
  | 'object_traversal'
  | 'tree_traversal'
  | 'graph_algorithms'
  | 'dynamic_programming';

// Performance Impact Assessment
export interface PerformanceImpact {
  userExperience: ImpactLevel;
  systemResources: ImpactLevel;
  scalability: ImpactLevel;
  maintainability: ImpactLevel;
  businessMetrics: ImpactLevel;
}

export type ImpactLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'critical';

// Framework-specific Types
export interface FrameworkPerformanceProfile {
  name: string;
  version?: string;
  commonBottlenecks: string[];
  optimizationPatterns: string[];
  performanceTools: string[];
  bestPractices: string[];
}

export interface ReactPerformanceIssue {
  type: 'unnecessary_render' | 'large_bundle' | 'inefficient_state' | 'memory_leak';
  component: string;
  description: string;
  solution: string;
}

export interface NodeJsPerformanceIssue {
  type: 'blocking_operation' | 'memory_leak' | 'inefficient_stream' | 'poor_error_handling';
  module: string;
  description: string;
  solution: string;
}

// Benchmark and Testing
export interface PerformanceBenchmark {
  id: string;
  name: string;
  description: string;
  testCode: string;
  expectedResults: BenchmarkResults;
  environment: BenchmarkEnvironment;
}

export interface BenchmarkResults {
  executionTime: number; // milliseconds
  memoryUsage: number; // MB
  throughput: number; // operations per second
  reliability: number; // percentage
}

export interface BenchmarkEnvironment {
  platform: string;
  nodeVersion?: string;
  cpuModel: string;
  memorySize: number; // GB
  storageType: string;
}

// Performance Monitoring
export interface PerformanceMonitoring {
  realTimeAnalysis: boolean;
  alertThresholds: AlertThresholds;
  reportingFrequency: ReportingFrequency;
  integrations: MonitoringIntegration[];
}

export interface AlertThresholds {
  responseTime: number; // milliseconds
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  errorRate: number; // percentage
}

export interface ReportingFrequency {
  realTime: boolean;
  hourly: boolean;
  daily: boolean;
  weekly: boolean;
}

export interface MonitoringIntegration {
  name: string;
  type: 'apm' | 'logging' | 'metrics' | 'alerting';
  configuration: Record<string, any>;
}

// Performance Analysis Statistics
export interface PerformanceAnalysisStats {
  totalFiles: number;
  analyzedFiles: number;
  totalBottlenecks: number;
  bottlenecksByCategory: Record<PerformanceCategory, number>;
  complexityIssues: number;
  memoryIssues: number;
  databaseIssues: number;
  optimizationOpportunities: number;
  processingTime: number; // milliseconds
  analysisDate: Date;
}

// Error Handling
export interface PerformanceAnalysisError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  severity: 'warning' | 'error' | 'fatal';
  recoverable: boolean;
  suggestion?: string;
}

// Configuration
export interface PerformanceAnalyzerConfig {
  version: string;
  enabledAnalyzers: AnalyzerConfig[];
  performanceTargets: PerformanceTargetConfig;
  optimizationRules: OptimizationRuleConfig[];
  reporting: PerformanceReportingConfig;
}

export interface AnalyzerConfig {
  name: string;
  enabled: boolean;
  weight: number; // for scoring
  options?: Record<string, any>;
}

export interface PerformanceTargetConfig {
  environment: 'development' | 'staging' | 'production';
  targets: PerformanceTarget;
  thresholds: PerformanceThreshold;
}

export interface OptimizationRuleConfig {
  id: string;
  enabled: boolean;
  priority: OptimizationPriority;
  customization?: Record<string, any>;
}

export interface PerformanceReportingConfig {
  format: 'json' | 'html' | 'pdf' | 'dashboard';
  includeCodeExamples: boolean;
  includeBenchmarks: boolean;
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
}

// Advanced Analysis Types
export interface PerformancePattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  language: string[];
  framework?: string[];
  severity: PerformanceSeverity;
  category: PerformanceCategory;
  detection: PatternDetection;
  optimization: PatternOptimization;
}

export interface PatternDetection {
  algorithm: string;
  confidence: number; // 0-1
  falsePositiveRate: number; // 0-1
  context: string[];
}

export interface PatternOptimization {
  strategy: string;
  difficulty: OptimizationDifficulty;
  estimatedImprovement: number; // percentage
  prerequisites: string[];
  risks: string[];
}

// Machine Learning Integration
export interface PerformanceMLModel {
  name: string;
  version: string;
  trainingData: MLTrainingData;
  accuracy: number; // percentage
  lastUpdated: Date;
}

export interface MLTrainingData {
  codePatterns: number;
  performanceMetrics: number;
  optimizationResults: number;
  languages: string[];
  frameworks: string[];
}

// Real-time Analysis
export interface RealTimeAnalysisResult {
  sessionId: string;
  timestamp: Date;
  changes: PerformanceChange[];
  suggestions: InstantSuggestion[];
  overallTrend: 'improving' | 'degrading' | 'stable';
}

export interface PerformanceChange {
  type: 'improvement' | 'regression' | 'new_issue';
  category: PerformanceCategory;
  impact: number; // percentage change
  location: SourceLocation;
  description: string;
}

export interface InstantSuggestion {
  type: 'warning' | 'info' | 'tip';
  message: string;
  action?: string;
  priority: OptimizationPriority;
}