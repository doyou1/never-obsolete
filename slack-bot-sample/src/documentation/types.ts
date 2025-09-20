import { FileContent } from '../github/types';

// Core API Documentation Interface
export interface IApiDocumentationGenerator {
  generateDocumentation(context: ApiDocumentationContext): Promise<ApiDocumentationResult>;
  analyzeApi(files: FileContent[]): Promise<ApiAnalysisResult>;
  generateOpenApiSpec(endpoints: ApiEndpoint[]): Promise<OpenApiSpec>;
  generateTestCases(endpoints: ApiEndpoint[]): Promise<ApiTestCase[]>;
  validateDocumentation(spec: OpenApiSpec): Promise<ValidationResult>;
}

// Input Types
export interface ApiDocumentationContext {
  files: FileContent[];
  frameworks: FrameworkConfig[];
  analysisOptions: DocumentationOptions;
  outputOptions: OutputOptions;
  projectMetadata: ProjectApiMetadata;
}

export interface DocumentationOptions {
  includeExamples: boolean;
  includeErrorCodes: boolean;
  includeAuthentication: boolean;
  includeRateLimiting: boolean;
  generateTestCases: boolean;
  validateSchemas: boolean;
  extractFromComments: boolean;
  inferFromUsage: boolean;
  supportedFrameworks: string[];
  customPatterns: CustomPattern[];
}

export interface OutputOptions {
  formats: OutputFormat[];
  destination: string;
  templateEngine: TemplateEngine;
  customTemplates: CustomTemplate[];
  styling: StylingOptions;
  deployment: DeploymentConfig;
}

export interface ProjectApiMetadata {
  name: string;
  version: string;
  title: string;
  description: string;
  baseUrl: string;
  contact?: ContactInfo;
  license?: LicenseInfo;
  termsOfService?: string;
  servers: ServerConfig[];
  tags: TagObject[];
}

// Framework Configuration
export interface FrameworkConfig {
  name: string;
  version?: string;
  patterns: FrameworkPattern[];
  middleware: MiddlewarePattern[];
  conventions: NamingConvention[];
  authentication: AuthPattern[];
}

export interface FrameworkPattern {
  name: string;
  pattern: RegExp;
  extractionRules: ExtractionRule[];
  context: PatternContext[];
}

export interface ExtractionRule {
  type: ExtractionType;
  pattern: RegExp;
  groupIndex: number;
  transformer?: TransformFunction;
  validation?: ValidationRule;
}

// Main Result Types
export interface ApiDocumentationResult {
  id: string;
  timestamp: Date;
  projectInfo: ProjectApiMetadata;
  apiSpec: OpenApiSpec;
  endpoints: ApiEndpoint[];
  schemas: SchemaDefinition[];
  authentication: AuthenticationScheme[];
  documentation: GeneratedDocumentation;
  testCases: ApiTestCase[];
  statistics: DocumentationStatistics;
  validationResults: ValidationResult[];
  deploymentInfo?: DeploymentInfo;
}

export interface ApiAnalysisResult {
  totalEndpoints: number;
  endpointsByMethod: MethodDistribution;
  endpointsByTag: TagDistribution;
  schemaComplexity: SchemaComplexityMetrics;
  authenticationMethods: AuthenticationScheme[];
  apiMaturityScore: number;
  issues: AnalysisIssue[];
  recommendations: DocumentationRecommendation[];
}

// API Endpoint Types
export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  operationId?: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ParameterDefinition[];
  requestBody?: RequestBodyDefinition;
  responses: ResponseDefinition[];
  authentication: SecurityRequirement[];
  middleware: MiddlewareInfo[];
  location: SourceLocation;
  examples: EndpointExample[];
  deprecated: boolean;
  rateLimit?: RateLimitInfo;
}

export interface ParameterDefinition {
  name: string;
  in: ParameterLocation;
  description: string;
  required: boolean;
  deprecated: boolean;
  allowEmptyValue: boolean;
  schema: SchemaObject;
  style?: ParameterStyle;
  explode?: boolean;
  allowReserved?: boolean;
  examples: ParameterExample[];
  location: SourceLocation;
}

export interface RequestBodyDefinition {
  description: string;
  required: boolean;
  contentTypes: ContentTypeDefinition[];
  examples: RequestExample[];
  location: SourceLocation;
}

export interface ResponseDefinition {
  statusCode: number;
  description: string;
  headers: HeaderDefinition[];
  contentTypes: ContentTypeDefinition[];
  examples: ResponseExample[];
  location: SourceLocation;
}

export interface ContentTypeDefinition {
  mediaType: string;
  schema: SchemaObject;
  encoding?: EncodingObject;
  examples: ContentExample[];
}

// Schema Types
export interface SchemaDefinition {
  name: string;
  type: SchemaType;
  description: string;
  properties: PropertyDefinition[];
  required: string[];
  additionalProperties: boolean | SchemaObject;
  discriminator?: DiscriminatorObject;
  externalDocs?: ExternalDocumentation;
  example?: any;
  location: SourceLocation;
  usage: SchemaUsage[];
}

export interface PropertyDefinition {
  name: string;
  type: SchemaType;
  description: string;
  required: boolean;
  nullable: boolean;
  readOnly: boolean;
  writeOnly: boolean;
  deprecated: boolean;
  schema: SchemaObject;
  constraints: PropertyConstraints;
  examples: PropertyExample[];
}

export interface SchemaObject {
  type?: SchemaType;
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  example?: any;
  examples?: any[];
  enum?: any[];
  const?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  properties?: Record<string, SchemaObject>;
  additionalProperties?: boolean | SchemaObject;
  items?: SchemaObject;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  not?: SchemaObject;
  discriminator?: DiscriminatorObject;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XmlObject;
  externalDocs?: ExternalDocumentation;
  deprecated?: boolean;
  $ref?: string;
}

// Authentication Types
export interface AuthenticationScheme {
  type: AuthenticationType;
  name: string;
  description: string;
  location: AuthLocation;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
  configuration: AuthConfiguration;
  examples: AuthExample[];
  middleware: MiddlewareInfo[];
}

export interface SecurityRequirement {
  name: string;
  scopes: string[];
  optional: boolean;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

// OpenAPI Specification Types
export interface OpenApiSpec {
  openapi: string;
  info: ApiInfo;
  servers: ServerConfig[];
  paths: PathsObject;
  components: ComponentsObject;
  security: SecurityRequirement[];
  tags: TagObject[];
  externalDocs?: ExternalDocumentation;
}

export interface ApiInfo {
  title: string;
  description: string;
  version: string;
  contact?: ContactInfo;
  license?: LicenseInfo;
  termsOfService?: string;
}

export interface ContactInfo {
  name?: string;
  url?: string;
  email?: string;
}

export interface LicenseInfo {
  name: string;
  url?: string;
}

export interface ServerConfig {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface PathsObject {
  [path: string]: PathItemObject;
}

export interface PathItemObject {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  servers?: ServerConfig[];
  parameters?: ParameterObject[];
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
  callbacks?: Record<string, CallbackObject>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: ServerConfig[];
}

export interface ParameterObject {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: ParameterStyle;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: SchemaObject;
  example?: any;
  examples?: Record<string, ExampleObject>;
  content?: Record<string, MediaTypeObject>;
}

export interface RequestBodyObject {
  description?: string;
  content: Record<string, MediaTypeObject>;
  required?: boolean;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
  example?: any;
  examples?: Record<string, ExampleObject>;
  encoding?: Record<string, EncodingObject>;
}

export interface EncodingObject {
  contentType?: string;
  headers?: Record<string, HeaderObject>;
  style?: ParameterStyle;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject;
}

export interface ResponseObject {
  description: string;
  headers?: Record<string, HeaderObject>;
  content?: Record<string, MediaTypeObject>;
  links?: Record<string, LinkObject>;
}

export interface HeaderObject {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: ParameterStyle;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: SchemaObject;
  example?: any;
  examples?: Record<string, ExampleObject>;
  content?: Record<string, MediaTypeObject>;
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject>;
  responses?: Record<string, ResponseObject>;
  parameters?: Record<string, ParameterObject>;
  examples?: Record<string, ExampleObject>;
  requestBodies?: Record<string, RequestBodyObject>;
  headers?: Record<string, HeaderObject>;
  securitySchemes?: Record<string, SecuritySchemeObject>;
  links?: Record<string, LinkObject>;
  callbacks?: Record<string, CallbackObject>;
}

export interface SecuritySchemeObject {
  type: AuthenticationType;
  description?: string;
  name?: string;
  in?: AuthLocation;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}

export interface ExternalDocumentation {
  description?: string;
  url: string;
}

export interface ExampleObject {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: ServerConfig;
}

export interface CallbackObject {
  [expression: string]: PathItemObject;
}

// Test Case Generation
export interface ApiTestCase {
  id: string;
  name: string;
  description: string;
  endpoint: ApiEndpoint;
  testType: TestCaseType;
  scenarios: TestScenario[];
  assertions: TestAssertion[];
  setup: TestSetup;
  teardown: TestTeardown;
  dependencies: TestDependency[];
  tags: string[];
}

export interface TestScenario {
  name: string;
  description: string;
  request: TestRequest;
  expectedResponse: TestResponse;
  preconditions: TestCondition[];
  postconditions: TestCondition[];
  dataSetup: TestDataSetup;
}

export interface TestRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  parameters: Record<string, any>;
  body?: any;
  authentication?: TestAuthentication;
}

export interface TestResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body?: any;
  schema?: SchemaObject;
  responseTime?: number;
}

export interface TestAssertion {
  type: AssertionType;
  property: string;
  operator: ComparisonOperator;
  expected: any;
  description: string;
  critical: boolean;
}

// Documentation Generation
export interface GeneratedDocumentation {
  formats: GeneratedFormat[];
  files: GeneratedFile[];
  assets: AssetFile[];
  metadata: DocumentationMetadata;
  navigation: NavigationStructure;
  search: SearchIndex;
}

export interface GeneratedFormat {
  type: OutputFormat;
  files: string[];
  size: number;
  generationTime: number;
  errors: GenerationError[];
}

export interface GeneratedFile {
  path: string;
  type: FileType;
  size: number;
  content?: string;
  metadata: FileMetadata;
}

export interface AssetFile {
  path: string;
  type: AssetType;
  size: number;
  url?: string;
  description: string;
}

export interface DocumentationMetadata {
  generatedAt: Date;
  generatorVersion: string;
  totalPages: number;
  totalEndpoints: number;
  totalSchemas: number;
  languages: string[];
  themes: string[];
}

export interface NavigationStructure {
  sections: NavigationSection[];
  breadcrumbs: BreadcrumbItem[];
  toc: TableOfContents;
}

export interface NavigationSection {
  id: string;
  title: string;
  path: string;
  children: NavigationSection[];
  icon?: string;
  badge?: BadgeInfo;
}

export interface SearchIndex {
  entries: SearchEntry[];
  tags: SearchTag[];
  categories: SearchCategory[];
}

export interface SearchEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  type: SearchEntryType;
  keywords: string[];
  content: string;
  relevance: number;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  statistics: ValidationStatistics;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: ValidationSeverity;
  rule: ValidationRule;
  suggestion?: string;
  location?: SourceLocation;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  rule: ValidationRule;
  suggestion: string;
  location?: SourceLocation;
}

export interface ValidationSuggestion {
  type: SuggestionType;
  message: string;
  path: string;
  implementation: string;
  priority: SuggestionPriority;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: ValidationSeverity;
  enabled: boolean;
  configuration: RuleConfiguration;
}

// Statistics and Metrics
export interface DocumentationStatistics {
  generation: GenerationStatistics;
  coverage: CoverageStatistics;
  quality: QualityStatistics;
  complexity: ComplexityStatistics;
  usage: UsageStatistics;
}

export interface GenerationStatistics {
  totalTime: number;
  analysisTime: number;
  generationTime: number;
  validationTime: number;
  filesProcessed: number;
  endpointsFound: number;
  schemasGenerated: number;
  errorsEncountered: number;
}

export interface CoverageStatistics {
  endpointCoverage: number; // 0-100
  schemaCoverage: number; // 0-100
  exampleCoverage: number; // 0-100
  testCoverage: number; // 0-100
  documentationCoverage: number; // 0-100
  authenticationCoverage: number; // 0-100
}

export interface QualityStatistics {
  descriptionCompleteness: number; // 0-100
  exampleQuality: number; // 0-100
  schemaAccuracy: number; // 0-100
  consistencyScore: number; // 0-100
  readabilityScore: number; // 0-100
  maintainabilityScore: number; // 0-100
}

export interface ComplexityStatistics {
  averageEndpointComplexity: number;
  schemaComplexity: SchemaComplexityMetrics;
  apiSurfaceArea: number;
  dependencyComplexity: number;
  authenticationComplexity: number;
}

export interface SchemaComplexityMetrics {
  averageDepth: number;
  maxDepth: number;
  totalProperties: number;
  circularReferences: number;
  polymorphicSchemas: number;
  complexTypes: number;
}

// Source Location and Context
export interface SourceLocation {
  file: string;
  startLine: number;
  endLine?: number;
  startColumn: number;
  endColumn?: number;
  function?: string;
  class?: string;
  method?: string;
  context: string;
}

export interface MiddlewareInfo {
  name: string;
  type: MiddlewareType;
  order: number;
  configuration: MiddlewareConfiguration;
  location: SourceLocation;
}

// Example Types
export interface EndpointExample {
  name: string;
  description: string;
  request: ExampleRequest;
  response: ExampleResponse;
  language?: string;
  framework?: string;
}

export interface ExampleRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  parameters: Record<string, any>;
  body?: any;
}

export interface ExampleResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  description: string;
}

export interface ParameterExample {
  name: string;
  value: any;
  description: string;
}

export interface RequestExample {
  name: string;
  contentType: string;
  value: any;
  description: string;
}

export interface ResponseExample {
  name: string;
  statusCode: number;
  contentType: string;
  value: any;
  description: string;
}

export interface ContentExample {
  name: string;
  value: any;
  description: string;
}

export interface PropertyExample {
  value: any;
  description: string;
}

export interface AuthExample {
  name: string;
  description: string;
  request: AuthExampleRequest;
  response: AuthExampleResponse;
}

export interface AuthExampleRequest {
  headers?: Record<string, string>;
  parameters?: Record<string, any>;
  body?: any;
}

export interface AuthExampleResponse {
  token?: string;
  expiresIn?: number;
  scope?: string[];
  error?: string;
}

// Configuration Types
export interface AuthConfiguration {
  headerName?: string;
  queryName?: string;
  cookieName?: string;
  scheme?: string;
  realm?: string;
  charset?: string;
}

export interface RateLimitInfo {
  requests: number;
  period: string;
  headers: string[];
  resetStrategy: ResetStrategy;
}

export interface PropertyConstraints {
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
}

export interface SchemaUsage {
  endpoint: string;
  context: UsageContext;
  frequency: number;
}

export interface DiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface XmlObject {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface HeaderDefinition {
  name: string;
  description: string;
  required: boolean;
  deprecated: boolean;
  schema: SchemaObject;
  examples: ParameterExample[];
}

// Template and Styling
export interface StylingOptions {
  theme: string;
  colors: ColorScheme;
  typography: TypographySettings;
  layout: LayoutSettings;
  branding: BrandingOptions;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  success: string;
  warning: string;
  error: string;
}

export interface TypographySettings {
  fontFamily: string;
  headingFont?: string;
  codeFont: string;
  baseFontSize: string;
  lineHeight: number;
  scale: TypographyScale;
}

export interface LayoutSettings {
  maxWidth: string;
  sidebar: SidebarSettings;
  navigation: NavigationSettings;
  spacing: SpacingSettings;
}

export interface BrandingOptions {
  logo?: string;
  favicon?: string;
  companyName?: string;
  footer?: string;
  customCss?: string;
}

export interface CustomTemplate {
  name: string;
  engine: TemplateEngine;
  content: string;
  variables: TemplateVariable[];
  partials: TemplatePartial[];
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  description: string;
  defaultValue?: any;
  required: boolean;
}

export interface TemplatePartial {
  name: string;
  content: string;
  description: string;
}

export interface CustomPattern {
  name: string;
  pattern: RegExp;
  description: string;
  framework?: string;
  extractionRules: ExtractionRule[];
}

// Deployment and Output
export interface DeploymentConfig {
  target: DeploymentTarget;
  settings: DeploymentSettings;
  authentication?: DeploymentAuthentication;
  customDomain?: string;
  ssl?: SslConfig;
}

export interface DeploymentSettings {
  baseUrl?: string;
  subdirectory?: string;
  customHeaders?: Record<string, string>;
  redirects?: RedirectRule[];
  caching?: CachingConfig;
}

export interface DeploymentAuthentication {
  type: AuthenticationType;
  credentials: AuthCredentials;
  allowedDomains?: string[];
}

// Analysis and Recommendations
export interface AnalysisIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  location: SourceLocation;
  suggestion: string;
  autoFixable: boolean;
  impact: IssueImpact;
}

export interface DocumentationRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  implementation: string;
  effort: EffortEstimate;
  impact: RecommendationImpact;
}

export interface EffortEstimate {
  timeEstimate: number; // hours
  complexity: EffortComplexity;
  skillRequired: SkillLevel;
  resources: string[];
}

export interface RecommendationImpact {
  documentation: number; // 0-100
  developer: number; // 0-100
  maintenance: number; // 0-100
  adoption: number; // 0-100
}

// Enum Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE';
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';
export type ParameterStyle = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
export type AuthenticationType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
export type AuthLocation = 'query' | 'header' | 'cookie';
export type OutputFormat = 'openapi-json' | 'openapi-yaml' | 'swagger-ui' | 'redoc' | 'markdown' | 'html' | 'postman' | 'insomnia';
export type TemplateEngine = 'handlebars' | 'mustache' | 'ejs' | 'pug' | 'nunjucks' | 'custom';
export type ExtractionType = 'route' | 'parameter' | 'schema' | 'authentication' | 'middleware' | 'response';
export type PatternContext = 'file' | 'function' | 'class' | 'route' | 'middleware';
export type TestCaseType = 'unit' | 'integration' | 'e2e' | 'contract' | 'performance' | 'security';
export type AssertionType = 'equals' | 'contains' | 'matches' | 'exists' | 'type' | 'schema' | 'range';
export type ComparisonOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
export type FileType = 'html' | 'markdown' | 'json' | 'yaml' | 'css' | 'js' | 'image';
export type AssetType = 'css' | 'js' | 'image' | 'font' | 'icon' | 'theme';
export type SearchEntryType = 'endpoint' | 'schema' | 'example' | 'guide' | 'reference';
export type ValidationSeverity = 'error' | 'warning' | 'info' | 'hint';
export type SuggestionType = 'improvement' | 'optimization' | 'best-practice' | 'fix';
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';
export type RuleCategory = 'structure' | 'naming' | 'documentation' | 'examples' | 'security' | 'performance';
export type MiddlewareType = 'authentication' | 'authorization' | 'validation' | 'rate-limiting' | 'logging' | 'cors' | 'compression' | 'custom';
export type UsageContext = 'request' | 'response' | 'parameter' | 'header';
export type ResetStrategy = 'fixed-window' | 'sliding-window' | 'token-bucket';
export type TypographyScale = 'minor-second' | 'major-second' | 'minor-third' | 'major-third' | 'perfect-fourth' | 'golden-ratio';
export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';
export type DeploymentTarget = 'netlify' | 'vercel' | 'github-pages' | 'aws-s3' | 'azure-static' | 'self-hosted' | 'custom';
export type IssueType = 'missing-description' | 'invalid-schema' | 'broken-example' | 'security-concern' | 'performance-issue' | 'consistency-violation';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IssueImpact = 'blocking' | 'major' | 'minor' | 'cosmetic';
export type RecommendationType = 'documentation' | 'schema' | 'example' | 'testing' | 'security' | 'performance';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type EffortComplexity = 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Utility interfaces for complex nested types
export interface MethodDistribution {
  GET: number;
  POST: number;
  PUT: number;
  DELETE: number;
  PATCH: number;
  HEAD: number;
  OPTIONS: number;
}

export interface TagDistribution {
  [tagName: string]: number;
}

export interface UsageStatistics {
  popularEndpoints: PopularEndpoint[];
  frequentSchemas: FrequentSchema[];
  commonPatterns: CommonPattern[];
  errorPatterns: ErrorPattern[];
}

export interface PopularEndpoint {
  endpoint: string;
  method: HttpMethod;
  usage: number;
  trend: TrendDirection;
}

export interface FrequentSchema {
  name: string;
  usage: number;
  complexity: number;
}

export interface CommonPattern {
  pattern: string;
  frequency: number;
  category: string;
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  impact: string;
}

export interface FileMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  lastModified: Date;
  checksum: string;
}

export interface BreadcrumbItem {
  title: string;
  path: string;
  active: boolean;
}

export interface TableOfContents {
  sections: TocSection[];
  maxDepth: number;
  numbered: boolean;
}

export interface TocSection {
  id: string;
  title: string;
  level: number;
  anchor: string;
  children: TocSection[];
}

export interface BadgeInfo {
  text: string;
  color: string;
  icon?: string;
}

export interface SearchTag {
  name: string;
  count: number;
  color?: string;
}

export interface SearchCategory {
  name: string;
  entries: number;
  icon?: string;
}

export interface ValidationStatistics {
  totalRules: number;
  rulesExecuted: number;
  errorsFound: number;
  warningsFound: number;
  suggestionsGenerated: number;
  validationTime: number;
}

export interface RuleConfiguration {
  enabled: boolean;
  severity: ValidationSeverity;
  parameters: Record<string, any>;
  exclusions: string[];
}

export interface GenerationError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  type: ErrorType;
  recoverable: boolean;
}

export interface MiddlewareConfiguration {
  options: Record<string, any>;
  dependencies: string[];
  version?: string;
}

export interface TestSetup {
  environment: TestEnvironment;
  data: TestData[];
  services: TestService[];
  authentication: TestAuthentication;
}

export interface TestTeardown {
  cleanup: CleanupAction[];
  dataRemoval: DataRemovalAction[];
  serviceShutdown: ServiceShutdownAction[];
}

export interface TestDependency {
  name: string;
  type: DependencyType;
  required: boolean;
  version?: string;
}

export interface TestCondition {
  type: ConditionType;
  expression: string;
  description: string;
  required: boolean;
}

export interface TestDataSetup {
  fixtures: TestFixture[];
  mocks: TestMock[];
  stubs: TestStub[];
}

export interface TestAuthentication {
  type: AuthenticationType;
  credentials: TestCredentials;
  setup: AuthSetupStep[];
}

export interface NamingConvention {
  type: ConventionType;
  pattern: RegExp;
  description: string;
  examples: string[];
}

export interface MiddlewarePattern {
  name: string;
  pattern: RegExp;
  order: number;
  configuration: MiddlewareConfiguration;
}

export interface AuthPattern {
  type: AuthenticationType;
  pattern: RegExp;
  location: AuthLocation;
  extractionRules: ExtractionRule[];
}

export interface SidebarSettings {
  width: string;
  collapsible: boolean;
  position: SidebarPosition;
  sticky: boolean;
}

export interface NavigationSettings {
  style: NavigationStyle;
  position: NavigationPosition;
  breadcrumbs: boolean;
  search: boolean;
}

export interface SpacingSettings {
  unit: string;
  scale: number;
  compact: boolean;
}

export interface SslConfig {
  enabled: boolean;
  certificate?: string;
  key?: string;
  provider?: SslProvider;
}

export interface RedirectRule {
  from: string;
  to: string;
  statusCode: number;
  permanent: boolean;
}

export interface CachingConfig {
  enabled: boolean;
  duration: number;
  strategy: CachingStrategy;
  exclude: string[];
}

export interface AuthCredentials {
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  certificate?: string;
}

export interface TransformFunction {
  name: string;
  implementation: string;
  description: string;
}

export interface DeploymentInfo {
  target: DeploymentTarget;
  url?: string;
  status: DeploymentStatus;
  deployedAt: Date;
  version: string;
  environment: string;
}

// Additional enum types for comprehensive coverage
export type TrendDirection = 'up' | 'down' | 'stable';
export type ErrorType = 'parsing' | 'validation' | 'generation' | 'template' | 'output';
export type TestEnvironment = 'local' | 'development' | 'staging' | 'production';
export type DependencyType = 'service' | 'database' | 'external-api' | 'file-system';
export type ConditionType = 'precondition' | 'postcondition' | 'invariant';
export type ConventionType = 'route' | 'parameter' | 'schema' | 'operation';
export type SidebarPosition = 'left' | 'right';
export type NavigationStyle = 'tabs' | 'pills' | 'breadcrumbs' | 'tree';
export type NavigationPosition = 'top' | 'bottom' | 'side';
export type SslProvider = 'letsencrypt' | 'cloudflare' | 'custom';
export type CachingStrategy = 'static' | 'dynamic' | 'hybrid';
export type DeploymentStatus = 'pending' | 'building' | 'deployed' | 'failed';

// Final utility interfaces
export interface TestFixture {
  name: string;
  data: any;
  description: string;
}

export interface TestMock {
  service: string;
  endpoints: MockEndpoint[];
  configuration: MockConfiguration;
}

export interface TestStub {
  name: string;
  implementation: string;
  returnValue: any;
}

export interface TestCredentials {
  [key: string]: string;
}

export interface AuthSetupStep {
  step: number;
  action: string;
  parameters: Record<string, any>;
}

export interface TestData {
  name: string;
  value: any;
  type: DataType;
}

export interface TestService {
  name: string;
  url: string;
  type: ServiceType;
  required: boolean;
}

export interface CleanupAction {
  type: CleanupType;
  target: string;
  parameters: Record<string, any>;
}

export interface DataRemovalAction {
  table: string;
  condition: string;
  cascade: boolean;
}

export interface ServiceShutdownAction {
  service: string;
  graceful: boolean;
  timeout: number;
}

export interface MockEndpoint {
  method: HttpMethod;
  path: string;
  response: MockResponse;
}

export interface MockConfiguration {
  delay?: number;
  errorRate?: number;
  persistence?: boolean;
}

export interface MockResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: any;
}

export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
export type ServiceType = 'http' | 'database' | 'message-queue' | 'cache' | 'file-system';
export type CleanupType = 'file' | 'database' | 'cache' | 'service' | 'environment';