import { AnalysisResultGenerator } from '../AnalysisResultGenerator';
import { AnalysisInput, AnalysisOptions } from '../types';

describe('AnalysisResultGenerator', () => {
  describe('Creation and Initialization', () => {
    test('should create AnalysisResultGenerator instance', () => {
      const generator = new AnalysisResultGenerator();
      expect(generator).toBeInstanceOf(AnalysisResultGenerator);
    });

    test('should initialize with default options', () => {
      const generator = new AnalysisResultGenerator();
      expect(generator).toBeDefined();
    });

    test('should apply custom options', () => {
      const generator = new AnalysisResultGenerator();
      const customOptions: Partial<AnalysisOptions> = {
        maxDepth: 15,
        outputFormat: 'json',
        includeMermaid: false,
      };

      generator.setOptions(customOptions);
      expect(generator).toBeDefined();
    });
  });

  describe('Basic Result Generation', () => {
    test('should generate basic analysis result', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createBasicAnalysisInput();

      const result = await generator.generateResult(input);

      expect(result).toMatchObject({
        reportContent: expect.any(String),
        detectedIssues: expect.any(Array),
        statistics: expect.objectContaining({
          totalFiles: expect.any(Number),
          totalFunctions: expect.any(Number),
          totalNodes: expect.any(Number),
          totalEdges: expect.any(Number),
        }),
        filename: expect.stringMatching(/analysis-report-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.md/),
      });

      expect(result.reportContent).toContain('# Analysis Report');
      expect(result.statistics.totalFiles).toBeGreaterThan(0);
    });

    test('should generate result with mermaid diagram', async () => {
      const generator = new AnalysisResultGenerator();
      generator.setOptions({ includeMermaid: true });
      const input = createBasicAnalysisInput();

      const result = await generator.generateResult(input);

      expect(result.mermaidDiagram).toBeDefined();
      expect(result.mermaidDiagram).toContain('graph TD');
    });

    test('should generate result without mermaid diagram', async () => {
      const generator = new AnalysisResultGenerator();
      generator.setOptions({ includeMermaid: false });
      const input = createBasicAnalysisInput();

      const result = await generator.generateResult(input);

      expect(result.mermaidDiagram).toBeUndefined();
    });
  });

  describe('Complex Result Generation', () => {
    test('should handle multi-layer flow graph', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createMultiLayerAnalysisInput();

      const result = await generator.generateResult(input);

      expect(result.statistics.maxDepth).toBeGreaterThan(1);
      expect(result.reportContent).toContain('🔗'); // API endpoint icon
      expect(result.reportContent).toContain('└──'); // Tree structure with connections
    });

    test('should detect and report circular dependencies', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createCircularDependencyInput();

      const result = await generator.generateResult(input);

      const circularIssues = result.detectedIssues.filter(
        (issue: any) => issue.type === 'circular-dependency'
      );
      expect(circularIssues.length).toBeGreaterThan(0);
      expect(result.statistics.circularDependencies).toBeGreaterThan(0);
    });

    test('should handle large graphs efficiently', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createLargeGraphInput(100);

      const startTime = Date.now();
      const result = await generator.generateResult(input);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // < 1 second
      expect(result.statistics.totalNodes).toBe(100);
    });
  });

  describe('Issue Detection', () => {
    test('should detect orphan nodes', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createOrphanNodeInput();

      const result = await generator.generateResult(input);

      const orphanIssues = result.detectedIssues.filter(
        (issue: any) => issue.type === 'orphan-node'
      );
      expect(orphanIssues.length).toBeGreaterThan(0);
    });

    test('should detect depth exceeded issues', async () => {
      const generator = new AnalysisResultGenerator();
      generator.setOptions({ maxDepth: 3 });
      const input = createDeepChainInput(5);

      const result = await generator.generateResult(input);

      const depthIssues = result.detectedIssues.filter(
        (issue: any) => issue.type === 'depth-exceeded'
      );
      expect(depthIssues.length).toBeGreaterThan(0);
    });

    test('should provide issue suggestions', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createCircularDependencyInput();

      const result = await generator.generateResult(input);

      const issuesWithSuggestions = result.detectedIssues.filter(
        (issue: any) => issue.suggestions && issue.suggestions.length > 0
      );
      expect(issuesWithSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('File Generation', () => {
    test('should generate unique filename with timestamp', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createBasicAnalysisInput();

      const result1 = await generator.generateResult(input);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const result2 = await generator.generateResult(input);

      expect(result1.filename).not.toBe(result2.filename);
      expect(result1.filename).toMatch(/analysis-report-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.md/);
      expect(result2.filename).toMatch(/analysis-report-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.md/);
    });

    test('should handle special characters in filenames', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createSpecialCharInput();

      const result = await generator.generateResult(input);

      expect(result.reportContent).toBeDefined();
      expect(result.reportContent).not.toContain('undefined');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty AST data', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createEmptyAnalysisInput();

      const result = await generator.generateResult(input);

      expect(result.statistics.totalFiles).toBe(0);
      expect(result.statistics.totalFiles).toBe(0);
    });

    test('should handle empty flow graph', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createEmptyFlowGraphInput();

      const result = await generator.generateResult(input);

      expect(result.statistics.totalNodes).toBe(0);
      expect(result.reportContent).toContain('No flow detected');
    });

    test('should handle invalid metadata', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createInvalidMetadataInput();

      const result = await generator.generateResult(input);

      expect(result).toBeDefined();
      expect(result.reportContent).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should complete small projects quickly', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createSmallProjectInput();

      const startTime = Date.now();
      const result = await generator.generateResult(input);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // < 100ms
      expect(result).toBeDefined();
    });

    test('should respect memory limits', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createLargeGraphInput(100);

      const initialMemory = process.memoryUsage().heapUsed;
      const result = await generator.generateResult(input);
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryUsed = finalMemory - initialMemory;
      expect(memoryUsed).toBeLessThan(50 * 1024 * 1024); // < 50MB
      expect(result).toBeDefined();
    });
  });

  describe('Output Format Tests', () => {
    test('should generate valid markdown', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createBasicAnalysisInput();

      const result = await generator.generateResult(input);

      expect(result.reportContent).toMatch(/^# /); // Starts with header
      expect(result.reportContent).toContain('## '); // Contains subheaders
      expect(result.reportContent).toMatch(/\[.*\]\(.*\)/); // Contains links
    });

    test('should include all required sections', async () => {
      const generator = new AnalysisResultGenerator();
      const input = createBasicAnalysisInput();

      const result = await generator.generateResult(input);

      expect(result.reportContent).toContain('# Analysis Report');
      expect(result.reportContent).toContain('## Flow Structure');
      expect(result.reportContent).toContain('## Statistics');
      expect(result.reportContent).toContain('## Detected Issues');
    });
  });
});

// Test Helper Functions
function createBasicAnalysisInput(): AnalysisInput {
  return {
    astData: [
      {
        filename: 'test.ts',
        metadata: {
          fileType: 'typescript' as const,
          hasReactComponent: false,
          hasAsyncCode: false,
          hasParsingErrors: false,
          lineCount: 1,
          characterCount: 100,
        },
        ast: null as any,
        dependencies: [],
        imports: [],
        exports: [],
        functions: [
          {
            name: 'test',
            type: 'function',
            isAsync: false,
            isExported: false,
            isGeneric: false,
            position: {
              line: 1,
              column: 0,
              end: { line: 1, column: 30 },
            },
            parameters: [],
            returnType: 'string',
            jsDoc: undefined,
          },
        ],
        classes: [],
        apiCalls: [],
        errors: [],
      },
    ],
    flowGraph: {
      nodes: [
        {
          id: 'test-node',
          type: 'function',
          name: 'test',
          filePath: 'test.ts',
          metadata: {},
        },
      ],
      edges: [],
      entryPoints: ['test-node'],
      circularDependencies: [],
      statistics: {
        totalNodes: 1,
        totalEdges: 0,
        maxDepth: 1,
      },
    },
    metadata: {
      githubUrl: 'https://github.com/test/repo',
      analyzedAt: new Date(),
      options: {
        includeTests: false,
        maxDepth: 10,
        outputFormat: 'markdown',
        includeMermaid: true,
      },
    },
  };
}

function createMultiLayerAnalysisInput(): AnalysisInput {
  const input = createBasicAnalysisInput();
  input.flowGraph.nodes = [
    {
      id: 'api-node',
      type: 'endpoint',
      name: 'GET /users',
      filePath: 'router.ts',
      metadata: { method: 'GET', path: '/users' },
    },
    {
      id: 'controller-node',
      type: 'function',
      name: 'getUsers',
      filePath: 'controller.ts',
      metadata: {},
    },
    {
      id: 'service-node',
      type: 'function',
      name: 'findUsers',
      filePath: 'service.ts',
      metadata: {},
    },
  ];
  input.flowGraph.edges = [
    {
      id: 'edge1',
      source: 'api-node',
      target: 'controller-node',
      type: 'call',
      metadata: {},
    },
    {
      id: 'edge2',
      source: 'controller-node',
      target: 'service-node',
      type: 'call',
      metadata: {},
    },
  ];
  input.flowGraph.statistics.totalNodes = 3;
  input.flowGraph.statistics.totalEdges = 2;
  input.flowGraph.statistics.maxDepth = 3;

  return input;
}

function createCircularDependencyInput(): AnalysisInput {
  const input = createBasicAnalysisInput();
  input.flowGraph.nodes = [
    {
      id: 'nodeA',
      type: 'function',
      name: 'functionA',
      filePath: 'fileA.ts',
      metadata: {},
    },
    {
      id: 'nodeB',
      type: 'function',
      name: 'functionB',
      filePath: 'fileB.ts',
      metadata: {},
    },
  ];
  input.flowGraph.edges = [
    {
      id: 'edge1',
      source: 'nodeA',
      target: 'nodeB',
      type: 'call',
      metadata: {},
    },
    {
      id: 'edge2',
      source: 'nodeB',
      target: 'nodeA',
      type: 'call',
      metadata: {},
    },
  ];
  input.flowGraph.circularDependencies = [['nodeA', 'nodeB']];

  return input;
}

function createLargeGraphInput(nodeCount: number): AnalysisInput {
  const input = createBasicAnalysisInput();
  input.flowGraph.nodes = [];
  input.flowGraph.edges = [];

  for (let i = 0; i < nodeCount; i++) {
    input.flowGraph.nodes.push({
      id: `node${i}`,
      type: 'function',
      name: `function${i}`,
      filePath: `file${i}.ts`,
      metadata: {},
    });

    if (i > 0) {
      input.flowGraph.edges.push({
        id: `edge${i}`,
        source: `node${i - 1}`,
        target: `node${i}`,
        type: 'call',
        metadata: {},
      });
    }
  }

  input.flowGraph.statistics.totalNodes = nodeCount;
  input.flowGraph.statistics.totalEdges = nodeCount - 1;

  return input;
}

function createOrphanNodeInput(): AnalysisInput {
  const input = createMultiLayerAnalysisInput();
  input.flowGraph.nodes.push({
    id: 'orphan-node',
    type: 'function',
    name: 'orphanFunction',
    filePath: 'orphan.ts',
    metadata: {},
  });

  return input;
}

function createDeepChainInput(depth: number): AnalysisInput {
  const input = createBasicAnalysisInput();
  input.flowGraph.nodes = [];
  input.flowGraph.edges = [];

  for (let i = 0; i < depth; i++) {
    input.flowGraph.nodes.push({
      id: `level${i}`,
      type: 'function',
      name: `function${i}`,
      filePath: `level${i}.ts`,
      metadata: {},
    });

    if (i > 0) {
      input.flowGraph.edges.push({
        id: `edge${i}`,
        source: `level${i - 1}`,
        target: `level${i}`,
        type: 'call',
        metadata: {},
      });
    }
  }

  input.flowGraph.statistics.maxDepth = depth;

  return input;
}

function createSpecialCharInput(): AnalysisInput {
  const input = createBasicAnalysisInput();
  if (input.astData[0]) {
    input.astData[0].filename = 'file with spaces & special chars!.ts';
  }
  if (input.flowGraph.nodes[0]) {
    input.flowGraph.nodes[0].name = 'function with spaces & special chars!';
  }

  return input;
}

function createEmptyAnalysisInput(): AnalysisInput {
  const input = createBasicAnalysisInput();
  input.astData = [];

  return input;
}

function createEmptyFlowGraphInput(): AnalysisInput {
  const input = createBasicAnalysisInput();
  input.flowGraph.nodes = [];
  input.flowGraph.edges = [];
  input.flowGraph.entryPoints = [];
  input.flowGraph.statistics.totalNodes = 0;
  input.flowGraph.statistics.totalEdges = 0;

  return input;
}

function createInvalidMetadataInput(): AnalysisInput {
  const input = createBasicAnalysisInput();
  input.metadata = {
    githubUrl: 'invalid-url',
    analyzedAt: new Date('invalid'),
    options: {
      includeTests: false,
      maxDepth: -1,
      outputFormat: 'invalid' as any,
      includeMermaid: true,
    },
  };

  return input;
}

function createSmallProjectInput(): AnalysisInput {
  return createLargeGraphInput(10);
}