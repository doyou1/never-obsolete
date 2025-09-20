import type {
  IAnalysisResultGenerator,
  AnalysisInput,
  AnalysisResult,
  AnalysisOptions,
  DetectedIssue,
  AnalysisStatistics,
  TreeNode,
} from './types';

export class AnalysisResultGenerator implements IAnalysisResultGenerator {
  private options: AnalysisOptions;

  constructor(options?: Partial<AnalysisOptions>) {
    this.options = {
      includeTests: false,
      maxDepth: 10,
      outputFormat: 'markdown',
      includeMermaid: true,
      ...options,
    };
  }

  public setOptions(options: Partial<AnalysisOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public async generateResult(input: AnalysisInput): Promise<AnalysisResult> {
    const { astData, flowGraph, metadata } = input;

    // Generate tree structure
    const treeNodes = this.formatAsTree(flowGraph);
    const treeContent = this.formatTreeToString(treeNodes);

    // Detect issues
    const detectedIssues = this.detectIssues(flowGraph, astData);

    // Generate statistics
    const statistics = this.generateStatistics(astData, flowGraph, detectedIssues);

    // Generate markdown content
    const reportContent = this.generateMarkdown(treeContent, statistics, detectedIssues, metadata);

    // Generate mermaid diagram if requested
    const mermaidDiagram = this.options.includeMermaid
      ? this.generateMermaidDiagram(flowGraph)
      : undefined;

    // Generate filename
    const filename = this.generateFilename(metadata.analyzedAt);

    return {
      reportContent,
      mermaidDiagram,
      detectedIssues,
      statistics,
      filename,
    };
  }

  private formatAsTree(flowGraph: any): TreeNode[] {
    if (!flowGraph.nodes || flowGraph.nodes.length === 0) {
      return [];
    }

    const treeNodes: TreeNode[] = [];
    const processedNodes = new Set<string>();

    // Group nodes by type for better organization
    const nodesByType = this.groupNodesByType(flowGraph.nodes);

    // Create tree structure starting with entry points
    for (const entryPointId of flowGraph.entryPoints || []) {
      const node = flowGraph.nodes.find((n: any) => n.id === entryPointId);
      if (node && !processedNodes.has(node.id)) {
        const treeNode = this.createTreeNode(node, 0, flowGraph);
        treeNodes.push(treeNode);
        processedNodes.add(node.id);
      }
    }

    // Add remaining nodes that weren't processed
    Object.entries(nodesByType).forEach(([_type, nodes]: [string, any[]]) => {
      nodes.forEach(node => {
        if (!processedNodes.has(node.id)) {
          const treeNode = this.createTreeNode(node, 0, flowGraph);
          treeNodes.push(treeNode);
          processedNodes.add(node.id);
        }
      });
    });

    return treeNodes;
  }

  private groupNodesByType(nodes: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      endpoint: [],
      function: [],
      file: [],
      database: [],
    };

    nodes.forEach(node => {
      if (groups[node.type]) {
        groups[node.type]!.push(node);
      } else {
        groups.function!.push(node); // Default to function
      }
    });

    return groups;
  }

  private createTreeNode(node: any, level: number, flowGraph: any): TreeNode {
    const children: TreeNode[] = [];

    // Find connected nodes (outgoing edges)
    const outgoingEdges = flowGraph.edges?.filter((edge: any) => edge.source === node.id) || [];

    for (const edge of outgoingEdges) {
      const childNode = flowGraph.nodes.find((n: any) => n.id === edge.target);
      if (childNode && level < this.options.maxDepth) {
        children.push(this.createTreeNode(childNode, level + 1, flowGraph));
      }
    }

    return {
      id: node.id,
      type: node.type || 'function',
      name: node.name || 'Unknown',
      path: node.filePath,
      githubUrl: this.generateGithubUrl(node.filePath),
      children,
      metadata: node.metadata || {},
      level,
    };
  }

  private generateGithubUrl(filePath?: string): string | undefined {
    if (!filePath) return undefined;
    // Simple GitHub URL generation - would need actual repo info in real implementation
    return `https://github.com/user/repo/blob/main/${filePath}`;
  }

  private formatTreeToString(nodes: TreeNode[]): string {
    if (nodes.length === 0) {
      return 'No flow detected\n';
    }

    let result = '';
    nodes.forEach(node => {
      result += this.formatNodeToString(node, '');
    });
    return result;
  }

  private formatNodeToString(node: TreeNode, prefix: string): string {
    const icon = this.getNodeIcon(node.type);
    const name = node.name.length > 50 ? node.name.substring(0, 47) + '...' : node.name;
    const link = node.githubUrl ? `[${name}](${node.githubUrl})` : name;

    let result = `${prefix}${icon} ${link}\n`;

    node.children.forEach((child, index) => {
      const isLast = index === node.children.length - 1;
      const childPrefix = prefix + (isLast ? '└── ' : '├── ');
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');

      result += `${childPrefix}${this.getNodeIcon(child.type)} ${child.name}\n`;
      result += this.formatNodeToString(child, nextPrefix);
    });

    return result;
  }

  private getNodeIcon(type: string): string {
    const icons: Record<string, string> = {
      file: '📄',
      function: '🔧',
      endpoint: '🔗',
      database: '🗃️',
      folder: '📁',
    };
    return icons[type] || '📄';
  }

  private detectIssues(flowGraph: any, _astData: any[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Detect circular dependencies
    if (flowGraph.circularDependencies && flowGraph.circularDependencies.length > 0) {
      flowGraph.circularDependencies.forEach((cycle: string[], index: number) => {
        issues.push({
          id: `circular-${index}`,
          type: 'circular-dependency',
          severity: 'warning',
          message: `Circular dependency detected: ${cycle.join(' → ')}`,
          affectedNodes: cycle,
          suggestions: [
            'Consider refactoring to break the circular dependency',
            'Extract common functionality into a separate module',
          ],
        });
      });
    }

    // Detect orphan nodes (nodes with no connections)
    const connectedNodeIds = new Set<string>();
    flowGraph.edges?.forEach((edge: any) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const orphanNodes = flowGraph.nodes?.filter((node: any) =>
      !connectedNodeIds.has(node.id) && !flowGraph.entryPoints?.includes(node.id)
    ) || [];

    orphanNodes.forEach((node: any) => {
      issues.push({
        id: `orphan-${node.id}`,
        type: 'orphan-node',
        severity: 'info',
        message: `Orphan node detected: ${node.name}`,
        affectedNodes: [node.id],
        suggestions: [
          'Check if this code is still needed',
          'Add proper connections to the flow',
        ],
      });
    });

    // Detect depth exceeded
    if (flowGraph.statistics?.maxDepth > this.options.maxDepth) {
      issues.push({
        id: 'depth-exceeded',
        type: 'depth-exceeded',
        severity: 'warning',
        message: `Maximum depth exceeded: ${flowGraph.statistics.maxDepth} > ${this.options.maxDepth}`,
        affectedNodes: [],
        suggestions: [
          'Consider increasing maxDepth option',
          'Simplify the call chain',
        ],
      });
    }

    return issues;
  }

  private generateStatistics(astData: any[], flowGraph: any, _detectedIssues: DetectedIssue[]): AnalysisStatistics {
    return {
      totalFiles: astData.length,
      totalFunctions: astData.reduce((count, file) => count + (file.functions?.length || 0), 0),
      totalEndpoints: flowGraph.nodes?.filter((n: any) => n.type === 'endpoint').length || 0,
      totalNodes: flowGraph.nodes?.length || 0,
      totalEdges: flowGraph.edges?.length || 0,
      maxDepth: flowGraph.statistics?.maxDepth || 0,
      circularDependencies: flowGraph.circularDependencies?.length || 0,
      analysisTime: Date.now(), // Simplified - would track actual time in real implementation
    };
  }

  private generateMarkdown(
    treeContent: string,
    statistics: AnalysisStatistics,
    issues: DetectedIssue[],
    metadata: any
  ): string {
    let markdown = '';

    // Header
    markdown += '# Analysis Report\n\n';
    const dateStr = metadata.analyzedAt instanceof Date && !isNaN(metadata.analyzedAt.getTime())
      ? metadata.analyzedAt.toISOString()
      : new Date().toISOString();
    markdown += `Generated at: ${dateStr}\n`;
    markdown += `Repository: ${metadata.githubUrl}\n\n`;

    // Flow Structure
    markdown += '## Flow Structure\n\n';
    markdown += '```\n';
    markdown += treeContent;
    markdown += '```\n\n';

    // Statistics
    markdown += '## Statistics\n\n';
    markdown += '| Metric | Value |\n';
    markdown += '|--------|-------|\n';
    markdown += `| Total Files | ${statistics.totalFiles} |\n`;
    markdown += `| Total Functions | ${statistics.totalFunctions} |\n`;
    markdown += `| Total Endpoints | ${statistics.totalEndpoints} |\n`;
    markdown += `| Total Nodes | ${statistics.totalNodes} |\n`;
    markdown += `| Total Edges | ${statistics.totalEdges} |\n`;
    markdown += `| Max Depth | ${statistics.maxDepth} |\n`;
    markdown += `| Circular Dependencies | ${statistics.circularDependencies} |\n\n`;

    // Detected Issues
    markdown += '## Detected Issues\n\n';
    if (issues.length === 0) {
      markdown += 'No issues detected.\n\n';
    } else {
      issues.forEach(issue => {
        const severity = issue.severity === 'error' ? '❌' :
                        issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        markdown += `${severity} **${issue.type}**: ${issue.message}\n`;
        if (issue.suggestions && issue.suggestions.length > 0) {
          markdown += 'Suggestions:\n';
          issue.suggestions.forEach(suggestion => {
            markdown += `- ${suggestion}\n`;
          });
        }
        markdown += '\n';
      });
    }

    return markdown;
  }

  private generateMermaidDiagram(flowGraph: any): string {
    if (!flowGraph.nodes || flowGraph.nodes.length === 0) {
      return 'graph TD\n  A[No nodes to display]';
    }

    let mermaid = 'graph TD\n';

    // Limit nodes to prevent diagram from being too large
    const maxNodes = 100;
    const nodes = flowGraph.nodes.slice(0, maxNodes);
    const nodeIds = new Set(nodes.map((n: any) => n.id));

    // Add node definitions
    nodes.forEach((node: any) => {
      const label = node.name || 'Unknown';
      const shape = this.getMermaidShape(node.type);
      mermaid += `  ${node.id}${shape[0]}${label}${shape[1]}\n`;
    });

    // Add edges (only between included nodes)
    const edges = flowGraph.edges?.filter((edge: any) =>
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    ) || [];

    edges.forEach((edge: any) => {
      mermaid += `  ${edge.source} --> ${edge.target}\n`;
    });

    return mermaid;
  }

  private getMermaidShape(type: string): [string, string] {
    const shapes: Record<string, [string, string]> = {
      endpoint: ['[', ']'],
      function: ['(', ')'],
      database: ['[(', ')]'],
      file: ['[[', ']]'],
    };
    return shapes[type] || ['[', ']'];
  }

  private generateFilename(_analyzedAt: Date): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .replace(/Z$/, '')
      .replace(/-\d{3}$/, ''); // Remove milliseconds
    return `analysis-report-${timestamp}.md`;
  }
}