import { CodePosition } from '../ast-parser/types';

export interface FlowNode {
  id: string;
  type: 'file' | 'function' | 'endpoint' | 'database';
  name: string;
  filePath: string;
  position?: CodePosition | undefined;
  metadata: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: 'call' | 'import' | 'dependency';
  metadata: Record<string, any>;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  entryPoints: string[]; // entry node ids
  circularDependencies: string[][];
  statistics: {
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
  };
}

export interface FlowTrackerConfig {
  maxDepth: number;
  maxNodes: number;
  enableCircularDetection: boolean;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  handler: string;
  filePath: string;
  position: CodePosition;
}

export interface IFlowTracker {
  buildFlowGraph(astData: any, options?: FlowBuildOptions): Promise<FlowGraph>;
  getConfig(): FlowTrackerConfig;
}

export interface FlowBuildOptions {
  entryPointPattern: string;
  includeTests: boolean;
}

export interface IEntryPointDetector {
  detectEndpoints(routerFilePath: string): Promise<ApiEndpoint[]>;
}

export interface IDependencyMapper {
  mapDependencies(astData: any): Promise<FlowEdge[]>;
}

export interface IFlowGraphGenerator {
  generateGraph(nodes: FlowNode[], edges: FlowEdge[]): FlowGraph;
  detectCircularDependencies(edges: FlowEdge[]): string[][];
}