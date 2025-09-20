// TASK-310: Code Documentation Generator Types and Interfaces

import { FileContent } from '../github/types';

// ===== Core Interface =====

export interface ICodeDocumentationGenerator {
  generateDocumentation(context: CodeDocumentationContext): Promise<CodeDocumentationResult>;
  analyzeCodeStructure(files: FileContent[]): Promise<CodeStructure>;
  extractDocumentation(files: FileContent[]): Promise<DocumentationContent>;
  generateReadme(structure: CodeStructure, content: DocumentationContent): Promise<string>;
  generateApiReference(structure: CodeStructure): Promise<ApiReference>;
}

// ===== Input Context =====

export interface CodeDocumentationContext {
  files: FileContent[];
  projectMetadata: ProjectMetadata;
  documentationOptions: DocumentationOptions;
  outputOptions: OutputOptions;
  templateOptions: TemplateOptions;
}

export interface ProjectMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: RepositoryInfo;
  keywords: string[];
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface RepositoryInfo {
  type: string;
  url: string;
  directory?: string;
}

export interface DocumentationOptions {
  includePrivateMembers: boolean;
  includeInternalDocs: boolean;
  generateExamples: boolean;
  generateTutorials: boolean;
  includeSourceCode: boolean;
  generateReadme: boolean;
  extractFromTests: boolean;
  analyzeUsagePatterns: boolean;
  generateChangelog: boolean;
  includeDependencyDocs: boolean;
  documentationFormats: DocumentationFormat[];
  languageSupport: string[];
  analysisDepth: AnalysisDepth;
}

export type DocumentationFormat = 'html' | 'markdown' | 'json' | 'pdf' | 'typedoc' | 'jsdoc';
export type AnalysisDepth = 'basic' | 'detailed' | 'comprehensive';

export interface OutputOptions {
  outputDirectory: string;
  baseUrl?: string;
  publicPath?: string;
  assetPath?: string;
  generateSearchIndex: boolean;
  minifyOutput: boolean;
  generateSitemap: boolean;
  enableOfflineSupport: boolean;
  customDomain?: string;
}

export interface TemplateOptions {
  templateEngine: TemplateEngine;
  templatePaths: string[];
  customTemplates: CustomTemplate[];
  theme: ThemeOptions;
  branding: BrandingOptions;
  layoutOptions: LayoutOptions;
}

export type TemplateEngine = 'handlebars' | 'mustache' | 'ejs' | 'pug' | 'custom';

export interface CustomTemplate {
  name: string;
  path: string;
  type: TemplateType;
  variables?: Record<string, any>;
}

export type TemplateType = 'layout' | 'partial' | 'page' | 'component';

export interface ThemeOptions {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: string;
  darkMode: boolean;
  customCss?: string;
  customJs?: string;
}

export interface BrandingOptions {
  logo?: string;
  favicon?: string;
  companyName?: string;
  brandColors: Record<string, string>;
  customHeaders?: string;
  customFooters?: string;
}

export interface LayoutOptions {
  sidebar: SidebarOptions;
  navigation: NavigationOptions;
  search: SearchOptions;
  footer: FooterOptions;
}

export interface SidebarOptions {
  enabled: boolean;
  collapsible: boolean;
  width: string;
  position: 'left' | 'right';
  showLineNumbers: boolean;
}

export interface NavigationOptions {
  breadcrumbs: boolean;
  prevNext: boolean;
  tableOfContents: boolean;
  maxDepth: number;
}

export interface SearchOptions {
  enabled: boolean;
  placeholder: string;
  maxResults: number;
  searchFields: string[];
  fuzzySearch: boolean;
}

export interface FooterOptions {
  enabled: boolean;
  showLastUpdated: boolean;
  showVersion: boolean;
  customText?: string;
  links: FooterLink[];
}

export interface FooterLink {
  text: string;
  url: string;
  external: boolean;
}

// ===== Code Structure =====

export interface CodeStructure {
  modules: ModuleDefinition[];
  classes: ClassDefinition[];
  interfaces: InterfaceDefinition[];
  functions: FunctionDefinition[];
  variables: VariableDefinition[];
  types: TypeDefinition[];
  enums: EnumDefinition[];
  namespaces: NamespaceDefinition[];
  dependencies: DependencyMap;
  exports: ExportDefinition[];
  imports: ImportDefinition[];
}

export interface ModuleDefinition {
  id: string;
  name: string;
  path: string;
  type: ModuleType;
  description?: string;
  exports: string[];
  imports: ImportDefinition[];
  dependencies: string[];
  size: number;
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export type ModuleType = 'es6' | 'commonjs' | 'amd' | 'umd' | 'typescript' | 'declaration';

export interface ClassDefinition {
  id: string;
  name: string;
  module: string;
  type: 'class' | 'abstract';
  visibility: Visibility;
  extends?: string;
  implements: string[];
  generics: GenericParameter[];
  constructor?: ConstructorDefinition;
  methods: MethodDefinition[];
  properties: PropertyDefinition[];
  staticMethods: MethodDefinition[];
  staticProperties: PropertyDefinition[];
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export interface InterfaceDefinition {
  id: string;
  name: string;
  module: string;
  extends: string[];
  generics: GenericParameter[];
  methods: MethodSignature[];
  properties: PropertySignature[];
  indexSignatures: IndexSignature[];
  callSignatures: CallSignature[];
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export interface FunctionDefinition {
  id: string;
  name: string;
  module: string;
  type: FunctionType;
  visibility: Visibility;
  parameters: ParameterDefinition[];
  returnType: TypeReference;
  generics: GenericParameter[];
  isAsync: boolean;
  isGenerator: boolean;
  overloads: FunctionOverload[];
  location: SourceLocation;
  documentation?: DocumentationBlock;
  examples: CodeExample[];
}

export type FunctionType = 'function' | 'arrow' | 'method' | 'constructor' | 'getter' | 'setter';

export interface VariableDefinition {
  id: string;
  name: string;
  module: string;
  type: TypeReference;
  kind: VariableKind;
  visibility: Visibility;
  isReadonly: boolean;
  initialValue?: string;
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export type VariableKind = 'var' | 'let' | 'const';

export interface TypeDefinition {
  id: string;
  name: string;
  module: string;
  kind: TypeKind;
  definition: TypeExpression;
  generics: GenericParameter[];
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export type TypeKind = 'alias' | 'union' | 'intersection' | 'literal' | 'conditional' | 'mapped';

export interface EnumDefinition {
  id: string;
  name: string;
  module: string;
  kind: EnumKind;
  members: EnumMember[];
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export type EnumKind = 'numeric' | 'string' | 'const';

export interface EnumMember {
  name: string;
  value?: string | number;
  documentation?: DocumentationBlock;
}

export interface NamespaceDefinition {
  id: string;
  name: string;
  module: string;
  members: NamespaceMember[];
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export interface NamespaceMember {
  name: string;
  kind: MemberKind;
  reference: string;
}

export type MemberKind = 'class' | 'interface' | 'function' | 'variable' | 'type' | 'enum' | 'namespace';

// ===== Type System =====

export interface GenericParameter {
  name: string;
  constraint?: TypeReference;
  default?: TypeReference;
}

export interface TypeReference {
  name: string;
  typeArguments: TypeReference[];
  nullable: boolean;
  optional: boolean;
  kind: TypeReferenceKind;
}

export type TypeReferenceKind = 'primitive' | 'object' | 'array' | 'function' | 'generic' | 'union' | 'intersection' | 'literal';

export interface TypeExpression {
  raw: string;
  parsed: TypeReference;
  complexity: number;
}

export interface ParameterDefinition {
  name: string;
  type: TypeReference;
  optional: boolean;
  rest: boolean;
  defaultValue?: string;
  documentation?: string;
}

export interface PropertyDefinition {
  name: string;
  type: TypeReference;
  visibility: Visibility;
  isReadonly: boolean;
  isStatic: boolean;
  optional: boolean;
  defaultValue?: string;
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export interface MethodDefinition {
  name: string;
  type: MethodType;
  visibility: Visibility;
  parameters: ParameterDefinition[];
  returnType: TypeReference;
  generics: GenericParameter[];
  isAsync: boolean;
  isAbstract: boolean;
  isStatic: boolean;
  overrides?: string;
  location: SourceLocation;
  documentation?: DocumentationBlock;
  examples: CodeExample[];
}

export type MethodType = 'method' | 'getter' | 'setter' | 'constructor';

export interface MethodSignature {
  name: string;
  parameters: ParameterDefinition[];
  returnType: TypeReference;
  optional: boolean;
  documentation?: string;
}

export interface PropertySignature {
  name: string;
  type: TypeReference;
  optional: boolean;
  readonly: boolean;
  documentation?: string;
}

export interface IndexSignature {
  keyType: TypeReference;
  valueType: TypeReference;
  documentation?: string;
}

export interface CallSignature {
  parameters: ParameterDefinition[];
  returnType: TypeReference;
  documentation?: string;
}

export interface ConstructorDefinition {
  parameters: ParameterDefinition[];
  visibility: Visibility;
  location: SourceLocation;
  documentation?: DocumentationBlock;
}

export interface FunctionOverload {
  parameters: ParameterDefinition[];
  returnType: TypeReference;
  documentation?: DocumentationBlock;
}

export type Visibility = 'public' | 'private' | 'protected' | 'internal';

// ===== Dependencies =====

export interface DependencyMap {
  internal: InternalDependency[];
  external: ExternalDependency[];
  circular: CircularDependency[];
}

export interface InternalDependency {
  from: string;
  to: string;
  type: DependencyType;
  imported: string[];
  location: SourceLocation;
}

export interface ExternalDependency {
  name: string;
  version: string;
  type: PackageType;
  usedBy: string[];
  importedItems: string[];
}

export interface CircularDependency {
  cycle: string[];
  severity: 'warning' | 'error';
}

export type DependencyType = 'import' | 'require' | 'dynamic' | 'type-only';
export type PackageType = 'dependency' | 'devDependency' | 'peerDependency' | 'optionalDependency';

export interface ExportDefinition {
  name: string;
  module: string;
  type: ExportType;
  reference?: string;
  location: SourceLocation;
}

export type ExportType = 'named' | 'default' | 'namespace' | 're-export';

export interface ImportDefinition {
  source: string;
  type: ImportType;
  imported: ImportedItem[];
  location: SourceLocation;
}

export type ImportType = 'named' | 'default' | 'namespace' | 'side-effect' | 'dynamic';

export interface ImportedItem {
  name: string;
  alias?: string;
  type: 'value' | 'type';
}

// ===== Documentation Content =====

export interface DocumentationContent {
  blocks: DocumentationBlock[];
  examples: CodeExample[];
  tutorials: Tutorial[];
  guides: Guide[];
  faqs: FAQ[];
  changelog: ChangelogEntry[];
}

export interface DocumentationBlock {
  id: string;
  type: DocumentationBlockType;
  content: string;
  tags: DocumentationTag[];
  location: SourceLocation;
  language?: string;
  processed: ProcessedContent;
}

export type DocumentationBlockType = 'jsdoc' | 'tsdoc' | 'inline' | 'markdown' | 'plain';

export interface DocumentationTag {
  name: string;
  type?: string;
  description?: string;
  value?: any;
  location?: SourceLocation;
}

export interface ProcessedContent {
  summary: string;
  description: string;
  parameters: ParameterDoc[];
  returns: ReturnDoc;
  examples: CodeExample[];
  seeAlso: Reference[];
  since?: string;
  deprecated?: DeprecationInfo;
  author?: string;
  version?: string;
}

export interface ParameterDoc {
  name: string;
  type?: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ReturnDoc {
  type?: string;
  description: string;
}

export interface Reference {
  type: ReferenceType;
  target: string;
  displayText?: string;
}

export type ReferenceType = 'internal' | 'external' | 'type' | 'member';

export interface DeprecationInfo {
  version?: string;
  reason?: string;
  alternative?: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  runnable: boolean;
  output?: string;
  tags: string[];
  location?: SourceLocation;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedTime: number;
  prerequisites: string[];
  sections: TutorialSection[];
  tags: string[];
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface TutorialSection {
  title: string;
  content: string;
  examples: CodeExample[];
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  startingCode?: string;
  solution?: string;
  hints: string[];
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  category: GuideCategory;
  content: string;
  lastUpdated: Date;
  tags: string[];
}

export type GuideCategory = 'getting-started' | 'api' | 'cookbook' | 'best-practices' | 'troubleshooting' | 'migration';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  votes: number;
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  type: ChangeType;
  title: string;
  description: string;
  breaking: boolean;
  migration?: string;
  author?: string;
}

export type ChangeType = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';

// ===== Generated Documentation =====

export interface ApiReference {
  modules: ModuleReference[];
  classes: ClassReference[];
  interfaces: InterfaceReference[];
  functions: FunctionReference[];
  types: TypeReference[];
  enums: EnumReference[];
  index: ReferenceIndex;
}

export interface ModuleReference {
  definition: ModuleDefinition;
  exports: ExportReference[];
  usage: UsageExample[];
  dependencies: string[];
}

export interface ClassReference {
  definition: ClassDefinition;
  hierarchy: ClassHierarchy;
  members: MemberReference[];
  usage: UsageExample[];
  related: string[];
}

export interface ClassHierarchy {
  parent?: string;
  children: string[];
  interfaces: string[];
  depth: number;
}

export interface MemberReference {
  definition: MethodDefinition | PropertyDefinition;
  inherited: boolean;
  overridden: boolean;
  usage: UsageExample[];
}

export interface InterfaceReference {
  definition: InterfaceDefinition;
  implementations: string[];
  extensions: string[];
  usage: UsageExample[];
}

export interface FunctionReference {
  definition: FunctionDefinition;
  overloads: FunctionOverload[];
  usage: UsageExample[];
  related: string[];
}

export interface EnumReference {
  definition: EnumDefinition;
  usage: UsageExample[];
  related: string[];
}

export interface ExportReference {
  name: string;
  type: string;
  description: string;
  usage: UsageExample[];
}

export interface UsageExample {
  title: string;
  code: string;
  explanation?: string;
  common: boolean;
}

export interface ReferenceIndex {
  byName: Map<string, string>;
  byModule: Map<string, string[]>;
  byType: Map<string, string[]>;
  search: SearchIndex;
}

export interface SearchIndex {
  terms: Map<string, SearchEntry[]>;
  fuzzy: FuzzySearchData;
}

export interface SearchEntry {
  id: string;
  title: string;
  type: string;
  module: string;
  description: string;
  url: string;
  score: number;
}

export interface FuzzySearchData {
  keys: string[];
  threshold: number;
  maxResults: number;
}

// ===== Output Generation =====

export interface GeneratedOutput {
  format: DocumentationFormat;
  content: string | Buffer;
  metadata: OutputMetadata;
  assets: Asset[];
}

export interface OutputMetadata {
  size: number;
  checksum: string;
  generatedAt: Date;
  version: string;
  dependencies: string[];
}

export interface Asset {
  name: string;
  type: AssetType;
  content: Buffer;
  url: string;
}

export type AssetType = 'image' | 'css' | 'js' | 'font' | 'icon' | 'data';

// ===== Statistics =====

export interface DocumentationStatistics {
  codeAnalysis: CodeAnalysisStats;
  documentationCoverage: CoverageStats;
  generation: GenerationStats;
  output: OutputStats;
  quality: QualityStats;
}

export interface CodeAnalysisStats {
  totalFiles: number;
  linesOfCode: number;
  modules: number;
  classes: number;
  interfaces: number;
  functions: number;
  types: number;
  enums: number;
  processingTime: number;
  errors: number;
}

export interface CoverageStats {
  documented: DocumentationCoverage;
  missing: MissingDocumentation[];
  quality: DocumentationQuality;
}

export interface DocumentationCoverage {
  functions: CoverageMetric;
  classes: CoverageMetric;
  interfaces: CoverageMetric;
  modules: CoverageMetric;
  parameters: CoverageMetric;
  returnTypes: CoverageMetric;
  overall: number;
}

export interface CoverageMetric {
  total: number;
  documented: number;
  percentage: number;
}

export interface MissingDocumentation {
  type: string;
  name: string;
  module: string;
  location: SourceLocation;
  severity: 'low' | 'medium' | 'high';
}

export interface DocumentationQuality {
  averageDescriptionLength: number;
  examplesProvided: number;
  tagsUsed: number;
  qualityScore: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: QualityIssueType;
  message: string;
  location: SourceLocation;
  severity: 'info' | 'warning' | 'error';
}

export type QualityIssueType = 'missing-description' | 'short-description' | 'missing-example' | 'missing-param-doc' | 'missing-return-doc' | 'broken-link' | 'outdated-info';

export interface GenerationStats {
  totalPages: number;
  totalWords: number;
  codeExamples: number;
  crossReferences: number;
  generationTime: number;
  templateProcessingTime: number;
  assetProcessingTime: number;
}

export interface OutputStats {
  formats: FormatStats[];
  totalSize: number;
  compressionRatio: number;
  assets: AssetStats[];
}

export interface FormatStats {
  format: DocumentationFormat;
  files: number;
  size: number;
  compressionRatio: number;
}

export interface AssetStats {
  type: AssetType;
  count: number;
  totalSize: number;
}

// ===== Common Types =====

export interface SourceLocation {
  file: string;
  startLine: number;
  startColumn: number;
  endLine?: number;
  endColumn?: number;
  context?: string;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}

// ===== Main Result Interface =====

export interface CodeDocumentationResult {
  id: string;
  timestamp: Date;
  projectInfo: ProjectMetadata;
  structure: CodeStructure;
  content: DocumentationContent;
  apiReference: ApiReference;
  outputs: GeneratedOutput[];
  statistics: DocumentationStatistics;
  errors: DocumentationError[];
  warnings: DocumentationWarning[];
}

export interface DocumentationError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  location?: SourceLocation;
  stack?: string;
  timestamp: Date;
}

export interface DocumentationWarning {
  id: string;
  type: WarningType;
  message: string;
  location?: SourceLocation;
  suggestion?: string;
  timestamp: Date;
}

export type ErrorType = 'parse' | 'analysis' | 'generation' | 'template' | 'output' | 'dependency' | 'configuration';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type WarningType = 'missing-doc' | 'outdated-info' | 'performance' | 'accessibility' | 'best-practice' | 'deprecated-usage';