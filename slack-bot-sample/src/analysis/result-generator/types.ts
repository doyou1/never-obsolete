import { ParsedSourceCode } from '../ast-parser/types';
import { FlowGraph } from '../flow-tracker/types';

export interface AnalysisInput {
  astData: ParsedSourceCode[];
  flowGraph: FlowGraph;
  metadata: AnalysisMetadata;
}

export interface AnalysisMetadata {
  githubUrl: string;
  analyzedAt: Date;
  options: AnalysisOptions;
}

export interface AnalysisOptions {
  includeTests: boolean;
  maxDepth: number;
  outputFormat: 'markdown' | 'json' | 'html';
  includeMermaid: boolean;
}

export interface AnalysisResult {
  reportContent: string;
  mermaidDiagram?: string | undefined;
  detectedIssues: DetectedIssue[];
  statistics: AnalysisStatistics;
  filename: string;
}

export interface DetectedIssue {
  id: string;
  type: 'circular-dependency' | 'orphan-node' | 'depth-exceeded' | 'broken-link';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedNodes: string[];
  suggestions?: string[];
}

export interface AnalysisStatistics {
  totalFiles: number;
  totalFunctions: number;
  totalEndpoints: number;
  totalNodes: number;
  totalEdges: number;
  maxDepth: number;
  circularDependencies: number;
  analysisTime: number;
}

export interface TreeNode {
  id: string;
  type: 'file' | 'function' | 'endpoint' | 'database' | 'folder';
  name: string;
  path?: string | undefined;
  githubUrl?: string | undefined;
  children: TreeNode[];
  metadata: Record<string, any>;
  level: number;
}

export interface FormattingOptions {
  useIcons: boolean;
  maxNodeNameLength: number;
  indentSize: number;
  includeMetadata: boolean;
}

export interface IAnalysisResultGenerator {
  generateResult(input: AnalysisInput): Promise<AnalysisResult>;
  setOptions(options: Partial<AnalysisOptions>): void;
}

export interface ITreeFormatter {
  formatAsTree(flowGraph: FlowGraph): TreeNode[];
  formatTreeToString(nodes: TreeNode[], options?: FormattingOptions): string;
}

export interface IMarkdownGenerator {
  generateMarkdown(
    treeContent: string,
    statistics: AnalysisStatistics,
    issues: DetectedIssue[],
    metadata: AnalysisMetadata
  ): string;
}

export interface IMermaidGenerator {
  generateMermaidDiagram(flowGraph: FlowGraph): string;
  limitNodeCount(diagram: string, maxNodes: number): string;
}

export interface IIssueDetector {
  detectIssues(flowGraph: FlowGraph, astData: ParsedSourceCode[]): DetectedIssue[];
}