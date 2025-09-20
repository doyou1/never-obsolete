import { FlowTracker } from '../FlowTracker';
import { FlowTrackerConfig, FlowBuildOptions } from '../types';

describe('FlowTracker', () => {
  describe('Creation and Initialization', () => {
    test('should create FlowTracker instance', () => {
      const tracker = new FlowTracker();
      expect(tracker).toBeInstanceOf(FlowTracker);
    });

    test('should initialize with default configuration', () => {
      const tracker = new FlowTracker();
      const config = tracker.getConfig();

      expect(config).toMatchObject({
        maxDepth: 10,
        maxNodes: 1000,
        enableCircularDetection: true,
      });
    });

    test('should apply custom configuration', () => {
      const customConfig: Partial<FlowTrackerConfig> = {
        maxDepth: 5,
        maxNodes: 100,
      };

      const tracker = new FlowTracker(customConfig);
      const config = tracker.getConfig();

      expect(config.maxDepth).toBe(5);
      expect(config.maxNodes).toBe(100);
      expect(config.enableCircularDetection).toBe(true); // default
    });
  });

  describe('Basic Flow Tracking', () => {
    test('should build simple flow graph', async () => {
      const tracker = new FlowTracker();
      const astData = createSimpleASTData();

      const options: FlowBuildOptions = {
        entryPointPattern: 'router.ts',
        includeTests: false,
      };

      const graph = await tracker.buildFlowGraph(astData, options);

      expect(graph).toMatchObject({
        nodes: expect.arrayContaining([
          expect.objectContaining({
            type: 'endpoint',
            name: 'GET /users',
          }),
          expect.objectContaining({
            type: 'function',
            name: 'getUsers',
          }),
        ]),
        edges: expect.arrayContaining([
          expect.objectContaining({
            type: 'call',
            source: expect.any(String),
            target: expect.any(String),
          }),
        ]),
        entryPoints: expect.arrayContaining([expect.any(String)]),
      });

      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(1);
    });

    test('should build multi-layer flow graph', async () => {
      const tracker = new FlowTracker();
      const astData = createMultiLayerASTData();

      const graph = await tracker.buildFlowGraph(astData);

      // API → Controller → Service → Repository → DB (5 nodes, 4 edges)
      expect(graph.nodes.length).toBe(5);
      expect(graph.edges.length).toBe(4);

      // Check that we have all expected node types
      const nodeTypes = graph.nodes.map(n => n.type);
      expect(nodeTypes).toContain('endpoint');
      expect(nodeTypes).toContain('function');
      expect(nodeTypes).toContain('database');
    });

    test('should handle multiple entry points', async () => {
      const tracker = new FlowTracker();
      const astData = createMultiEntryPointASTData();

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.entryPoints.length).toBe(2);

      // Each entry point should have independent flows
      const entryNodes = graph.nodes.filter(n =>
        graph.entryPoints.includes(n.id)
      );
      expect(entryNodes.length).toBe(2);
    });
  });

  describe('Circular Dependency Detection', () => {
    test('should detect simple circular dependency', async () => {
      const tracker = new FlowTracker();
      const astData = createCircularDependencyASTData();

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.circularDependencies.length).toBe(1);
      expect(graph.circularDependencies[0]).toEqual(['nodeA', 'nodeB']);
    });

    test('should detect complex circular dependency', async () => {
      const tracker = new FlowTracker();
      const astData = createComplexCircularASTData();

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.circularDependencies.length).toBe(1);
      expect(graph.circularDependencies[0]).toEqual(['nodeB', 'nodeC', 'nodeD']);
    });

    test('should detect multiple circular dependencies', async () => {
      const tracker = new FlowTracker();
      const astData = createMultipleCircularASTData();

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.circularDependencies.length).toBe(2);
    });

    test('should handle DAG without circular dependencies', async () => {
      const tracker = new FlowTracker();
      const astData = createDAGASTData();

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.circularDependencies.length).toBe(0);
      expect(graph.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Limits', () => {
    test('should respect maximum depth limit', async () => {
      const tracker = new FlowTracker({ maxDepth: 5 });
      const astData = createDeepChainASTData(10); // 10 levels deep

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.statistics.maxDepth).toBeLessThanOrEqual(5);
    });

    test('should respect maximum nodes limit', async () => {
      const tracker = new FlowTracker({ maxNodes: 10 });
      const astData = createLargeASTData(20); // 20 nodes

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.nodes.length).toBeLessThanOrEqual(10);
    });

    test('should handle large graphs efficiently', async () => {
      const tracker = new FlowTracker();
      const astData = createLargeASTData(100);

      const startTime = Date.now();
      const graph = await tracker.buildFlowGraph(astData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // < 1 second
      expect(graph.nodes.length).toBe(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid AST data', async () => {
      const tracker = new FlowTracker();

      await expect(
        tracker.buildFlowGraph(null as any)
      ).rejects.toThrow('Invalid AST data');
    });

    test('should handle missing entry point files', async () => {
      const tracker = new FlowTracker();
      const astData = createEmptyASTData();

      const options: FlowBuildOptions = {
        entryPointPattern: 'nonexistent-router.ts',
        includeTests: false,
      };

      const graph = await tracker.buildFlowGraph(astData, options);

      expect(graph.nodes.length).toBe(0);
      expect(graph.edges.length).toBe(0);
      expect(graph.entryPoints.length).toBe(0);
    });

    test('should handle incomplete metadata gracefully', async () => {
      const tracker = new FlowTracker();
      const astData = createIncompleteASTData();

      const graph = await tracker.buildFlowGraph(astData);

      // Should not throw, but may have fewer nodes
      expect(graph).toBeDefined();
      expect(Array.isArray(graph.nodes)).toBe(true);
    });
  });

  describe('Statistics Validation', () => {
    test('should provide accurate statistics', async () => {
      const tracker = new FlowTracker();
      const astData = createKnownStructureASTData();

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.statistics).toMatchObject({
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
        maxDepth: expect.any(Number),
      });

      expect(graph.statistics.maxDepth).toBeGreaterThanOrEqual(1);
    });

    test('should calculate max depth correctly', async () => {
      const tracker = new FlowTracker();
      const astData = createLinearChainASTData(5); // 5 levels deep

      const graph = await tracker.buildFlowGraph(astData);

      expect(graph.statistics.maxDepth).toBe(5);
    });
  });
});

// Test Helper Functions
function createSimpleASTData() {
  return {
    files: [
      {
        filename: 'router.ts',
        functions: [],
        imports: [],
        exports: [],
        classes: [],
        apiCalls: [],
      },
    ],
  };
}

function createMultiLayerASTData() {
  return {
    files: [
      {
        filename: 'router.ts',
        functions: [
          { name: 'apiHandler', type: 'function', filePath: 'router.ts' },
        ],
      },
      {
        filename: 'controller.ts',
        functions: [
          { name: 'getUsers', type: 'function', filePath: 'controller.ts' },
        ],
      },
    ],
  };
}

function createMultiEntryPointASTData() {
  return {
    files: [
      {
        filename: 'router.ts',
        functions: [
          { name: 'handler1', type: 'function' },
          { name: 'handler2', type: 'function' },
        ],
      },
    ],
  };
}

function createCircularDependencyASTData() {
  return {
    files: [
      {
        filename: 'fileA.ts',
        imports: [{ moduleName: './fileB', importType: 'named' }],
      },
      {
        filename: 'fileB.ts',
        imports: [{ moduleName: './fileA', importType: 'named' }],
      },
    ],
  };
}

function createComplexCircularASTData() {
  return {
    files: [
      { filename: 'fileA.ts', imports: [{ moduleName: './fileB' }] },
      { filename: 'fileB.ts', imports: [{ moduleName: './fileC' }] },
      { filename: 'fileC.ts', imports: [{ moduleName: './fileD' }] },
      { filename: 'fileD.ts', imports: [{ moduleName: './fileB' }] },
    ],
  };
}

function createMultipleCircularASTData() {
  return {
    files: [
      { filename: 'fileA.ts', imports: [{ moduleName: './fileB' }] },
      { filename: 'fileB.ts', imports: [{ moduleName: './fileA' }] },
      { filename: 'fileC.ts', imports: [{ moduleName: './fileD' }] },
      { filename: 'fileD.ts', imports: [{ moduleName: './fileC' }] },
    ],
  };
}

function createDAGASTData() {
  return {
    files: [
      { filename: 'root.ts', imports: [{ moduleName: './child1' }, { moduleName: './child2' }] },
      { filename: 'child1.ts', imports: [{ moduleName: './leaf' }] },
      { filename: 'child2.ts', imports: [{ moduleName: './leaf' }] },
      { filename: 'leaf.ts', imports: [] },
    ],
  };
}

function createDeepChainASTData(depth: number) {
  const files = [];
  for (let i = 0; i < depth; i++) {
    files.push({
      filename: `level${i}.ts`,
      imports: i < depth - 1 ? [{ moduleName: `./level${i + 1}` }] : [],
    });
  }
  return { files };
}

function createLargeASTData(nodeCount: number) {
  const files = [];
  for (let i = 0; i < nodeCount; i++) {
    files.push({
      filename: `file${i}.ts`,
      functions: [{ name: `func${i}`, type: 'function' }],
    });
  }
  return { files };
}

function createEmptyASTData() {
  return { files: [] };
}

function createIncompleteASTData() {
  return {
    files: [
      {
        filename: 'incomplete.ts',
        // Missing some expected properties
      },
    ],
  };
}

function createKnownStructureASTData() {
  return {
    files: [
      {
        filename: 'main.ts',
        functions: [
          { name: 'main', type: 'function' },
          { name: 'helper', type: 'function' },
        ],
        imports: [{ moduleName: './utils' }],
      },
      {
        filename: 'utils.ts',
        functions: [{ name: 'utility', type: 'function' }],
      },
    ],
  };
}

function createLinearChainASTData(levels: number) {
  const files = [];
  for (let i = 0; i < levels; i++) {
    files.push({
      filename: `chain${i}.ts`,
      functions: [{ name: `func${i}`, type: 'function' }],
      imports: i < levels - 1 ? [{ moduleName: `./chain${i + 1}` }] : [],
    });
  }
  return { files };
}