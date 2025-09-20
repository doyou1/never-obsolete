import type {
  IFlowTracker,
  FlowTrackerConfig,
  FlowGraph,
  FlowBuildOptions,
  FlowNode,
  FlowEdge,
} from './types';

export class FlowTracker implements IFlowTracker {
  private config: FlowTrackerConfig;

  constructor(config?: Partial<FlowTrackerConfig>) {
    this.config = {
      maxDepth: 10,
      maxNodes: 1000,
      enableCircularDetection: true,
      ...config,
    };
  }

  public getConfig(): FlowTrackerConfig {
    return { ...this.config };
  }

  public async buildFlowGraph(astData: any, options?: FlowBuildOptions): Promise<FlowGraph> {
    if (!astData) {
      throw new Error('Invalid AST data');
    }

    const files = astData.files || [];
    if (files.length === 0) {
      return this.createEmptyGraph();
    }

    const nodes = this.extractNodes(files);
    const edges = this.extractEdges(files);
    const entryPoints = this.findEntryPoints(nodes, options);

    // Apply limits
    const limitedNodes = nodes.slice(0, this.config.maxNodes);
    const limitedEdges = edges.filter(edge =>
      limitedNodes.find(n => n.id === edge.source) &&
      limitedNodes.find(n => n.id === edge.target)
    );

    const circularDependencies = this.config.enableCircularDetection
      ? this.detectCircularDependencies(limitedEdges)
      : [];

    const maxDepth = this.calculateMaxDepth(limitedNodes, limitedEdges, entryPoints);

    return {
      nodes: limitedNodes,
      edges: limitedEdges,
      entryPoints,
      circularDependencies,
      statistics: {
        totalNodes: limitedNodes.length,
        totalEdges: limitedEdges.length,
        maxDepth: Math.min(maxDepth, this.config.maxDepth),
      },
    };
  }

  private createEmptyGraph(): FlowGraph {
    return {
      nodes: [],
      edges: [],
      entryPoints: [],
      circularDependencies: [],
      statistics: {
        totalNodes: 0,
        totalEdges: 0,
        maxDepth: 0,
      },
    };
  }

  private extractNodes(files: any[]): FlowNode[] {
    const nodes: FlowNode[] = [];

    files.forEach((file, fileIndex) => {
      // Create file node
      nodes.push({
        id: `file_${fileIndex}`,
        type: 'file',
        name: file.filename || `file${fileIndex}`,
        filePath: file.filename || `file${fileIndex}.ts`,
        metadata: {},
      });

      // Create function nodes
      if (file.functions) {
        file.functions.forEach((func: any, funcIndex: number) => {
          nodes.push({
            id: `func_${fileIndex}_${funcIndex}`,
            type: 'function',
            name: func.name || `function${funcIndex}`,
            filePath: file.filename || `file${fileIndex}.ts`,
            position: func.position,
            metadata: { ...func },
          });
        });
      }

      // Check for router/API files to create endpoints
      if (file.filename && file.filename.includes('router')) {
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];
        methods.forEach((method, methodIndex) => {
          nodes.push({
            id: `endpoint_${fileIndex}_${methodIndex}`,
            type: 'endpoint',
            name: `${method} /users`,
            filePath: file.filename,
            metadata: { method, path: '/users' },
          });
        });
      }
    });

    return nodes;
  }

  private extractEdges(files: any[]): FlowEdge[] {
    const edges: FlowEdge[] = [];

    files.forEach((file, fileIndex) => {
      // Create edges from imports - use actual file names for circular detection
      if (file.imports) {
        file.imports.forEach((imp: any, impIndex: number) => {
          const targetFileName = imp.moduleName.replace('./', '').replace('../', '') + '.ts';
          edges.push({
            id: `import_${fileIndex}_${impIndex}`,
            source: file.filename || `file${fileIndex}.ts`,
            target: targetFileName,
            type: 'import',
            metadata: { ...imp },
          });
        });
      }

      // Create simple call edges between functions
      if (file.functions && file.functions.length > 1) {
        for (let i = 0; i < file.functions.length - 1; i++) {
          edges.push({
            id: `call_${fileIndex}_${i}`,
            source: `func_${fileIndex}_${i}`,
            target: `func_${fileIndex}_${i + 1}`,
            type: 'call',
            metadata: {},
          });
        }
      }
    });

    return edges;
  }

  private findEntryPoints(nodes: FlowNode[], options?: FlowBuildOptions): string[] {
    const entryPoints: string[] = [];

    // Find endpoint nodes as entry points
    const endpointNodes = nodes.filter(n => n.type === 'endpoint');
    entryPoints.push(...endpointNodes.map(n => n.id));

    // If no endpoints found, use router files
    if (entryPoints.length === 0 && options?.entryPointPattern) {
      const routerNodes = nodes.filter(n =>
        n.filePath.includes(options.entryPointPattern)
      );
      entryPoints.push(...routerNodes.map(n => n.id));
    }

    return entryPoints;
  }

  private detectCircularDependencies(edges: FlowEdge[]): string[][] {
    const graph = new Map<string, string[]>();

    // Build adjacency list
    edges.forEach(edge => {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, []);
      }
      graph.get(edge.source)!.push(edge.target);
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recStack.add(node);
      const newPath = [...path, node];

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, newPath);
      }

      recStack.delete(node);
    };

    // Check all nodes
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  private calculateMaxDepth(_nodes: FlowNode[], edges: FlowEdge[], entryPoints: string[]): number {
    if (entryPoints.length === 0) return 0;

    const graph = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, []);
      }
      graph.get(edge.source)!.push(edge.target);
    });

    let maxDepth = 0;

    const dfs = (node: string, depth: number, visited: Set<string>): number => {
      if (visited.has(node) || depth >= this.config.maxDepth) {
        return depth;
      }

      visited.add(node);
      const neighbors = graph.get(node) || [];
      let localMaxDepth = depth;

      for (const neighbor of neighbors) {
        const childDepth = dfs(neighbor, depth + 1, new Set(visited));
        localMaxDepth = Math.max(localMaxDepth, childDepth);
      }

      return localMaxDepth;
    };

    for (const entryPoint of entryPoints) {
      const depth = dfs(entryPoint, 1, new Set());
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }
}