import {
  ICodeAnalysisEngine,
  AnalysisContext,
  IssueAnalysisResult,
  PullRequestAnalysisResult,
  RepositoryAnalysisResult,
  Repository,
  AnalysisOptions,
  AnalysisResult,
  AnalysisSummary,
  AnalysisInsight,
  Recommendation,
  AnalysisMetrics
} from './types';
import { QualityAnalyzer } from './QualityAnalyzer';

export class CodeAnalysisEngine implements ICodeAnalysisEngine {
  private qualityAnalyzer: QualityAnalyzer;
  private analysisResults: Map<string, any> = new Map();

  constructor() {
    this.qualityAnalyzer = new QualityAnalyzer();
  }

  async analyzeIssue(context: AnalysisContext): Promise<IssueAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    try {
      const qualityMetrics = this.qualityAnalyzer.analyzeQuality(context.files);

      const summary: AnalysisSummary = {
        title: `Issue Analysis: ${context.target.title}`,
        description: `Analysis of issue #${context.target.number} and related code files`,
        keyFindings: this.extractIssueFindings(context, qualityMetrics),
        complexity: this.determineComplexity(qualityMetrics.complexity),
        impact: this.determineImpact(context, qualityMetrics),
        riskLevel: this.determineRiskLevel(qualityMetrics)
      };

      const insights = this.generateIssueInsights(context, qualityMetrics);
      const recommendations = this.generateIssueRecommendations(context, qualityMetrics);
      const metrics = this.buildAnalysisMetrics(context.files, qualityMetrics);

      const result: IssueAnalysisResult = {
        id: analysisId,
        type: 'issue',
        githubUrl: `${context.repository.url}/issues/${context.target.number}`,
        status: 'completed',
        summary,
        insights,
        recommendations,
        metrics,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime,
        issueType: this.classifyIssueType(context.target),
        relatedFiles: context.files.map(f => f.path),
        estimatedEffort: this.estimateEffort(summary.complexity)
      };

      this.analysisResults.set(analysisId, result);
      return result;
    } catch (error) {
      return this.createFailedIssueResult(analysisId, context, startTime, error);
    }
  }

  async analyzePullRequest(context: AnalysisContext): Promise<PullRequestAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    try {
      const qualityMetrics = this.qualityAnalyzer.analyzeQuality(context.files);

      const summary: AnalysisSummary = {
        title: `Pull Request Analysis: ${context.target.title}`,
        description: `Analysis of PR #${context.target.number} changes and impact`,
        keyFindings: this.extractPRFindings(context, qualityMetrics),
        complexity: this.determineComplexity(qualityMetrics.complexity),
        impact: this.determinePRImpact(context, qualityMetrics),
        riskLevel: this.determineRiskLevel(qualityMetrics)
      };

      const insights = this.generatePRInsights(context, qualityMetrics);
      const recommendations = this.generatePRRecommendations(context, qualityMetrics);
      const metrics = this.buildAnalysisMetrics(context.files, qualityMetrics);

      const result: PullRequestAnalysisResult = {
        id: analysisId,
        type: 'pullrequest',
        githubUrl: `${context.repository.url}/pull/${context.target.number}`,
        status: 'completed',
        summary,
        insights,
        recommendations,
        metrics,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime,
        changeType: this.classifyChangeType(context),
        filesChanged: context.changes?.length || 0,
        linesAdded: context.changes?.reduce((sum, change) => sum + change.additions, 0) || 0,
        linesDeleted: context.changes?.reduce((sum, change) => sum + change.deletions, 0) || 0,
        reviewComments: context.reviews?.length || 0
      };

      this.analysisResults.set(analysisId, result);
      return result;
    } catch (error) {
      return this.createFailedPRResult(analysisId, context, startTime, error);
    }
  }

  async analyzeRepository(repository: Repository, options: AnalysisOptions): Promise<RepositoryAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    try {
      const files = repository.files || [];
      const qualityMetrics = this.qualityAnalyzer.analyzeQuality(files);

      const summary: AnalysisSummary = {
        title: `Repository Analysis: ${repository.name}`,
        description: `Comprehensive analysis of ${repository.name} repository`,
        keyFindings: this.extractRepoFindings(repository, qualityMetrics),
        complexity: this.determineComplexity(qualityMetrics.complexity),
        impact: 'major',
        riskLevel: this.determineRiskLevel(qualityMetrics)
      };

      const insights = this.generateRepoInsights(repository, qualityMetrics);
      const recommendations = this.generateRepoRecommendations(repository, qualityMetrics);
      const metrics = this.buildAnalysisMetrics(files, qualityMetrics);

      const result: RepositoryAnalysisResult = {
        id: analysisId,
        type: 'repository',
        githubUrl: repository.url,
        status: 'completed',
        summary,
        insights,
        recommendations,
        metrics,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime,
        architecture: this.analyzeArchitecture(files),
        technologies: this.detectTechnologies(files),
        healthScore: this.calculateHealthScore(qualityMetrics)
      };

      this.analysisResults.set(analysisId, result);
      return result;
    } catch (error) {
      return this.createFailedRepoResult(analysisId, repository, startTime, error);
    }
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractIssueFindings(context: AnalysisContext, metrics: any): string[] {
    const findings: string[] = [];

    if (metrics.complexity > 8) {
      findings.push('High complexity in related code areas');
    }

    if (metrics.testCoverage < 70) {
      findings.push('Insufficient test coverage in affected files');
    }

    if (metrics.duplication > 15) {
      findings.push('Code duplication detected in related files');
    }

    if (metrics.issues.length > 0) {
      findings.push(`Quality issues identified: ${metrics.issues.join(', ')}`);
    }

    if (findings.length === 0) {
      findings.push('No major quality issues detected in related code');
    }

    return findings;
  }

  private extractPRFindings(context: AnalysisContext, metrics: any): string[] {
    const findings: string[] = [];

    const changedFiles = context.changes?.length || 0;
    const totalLines = context.changes?.reduce((sum, change) => sum + change.additions + change.deletions, 0) || 0;

    findings.push(`${changedFiles} files changed with ${totalLines} total line changes`);

    if (metrics.complexity > 10) {
      findings.push('Changes introduce high complexity code');
    }

    if (metrics.testCoverage < 60) {
      findings.push('Changes may reduce overall test coverage');
    }

    return findings;
  }

  private extractRepoFindings(repository: Repository, metrics: any): string[] {
    const findings: string[] = [];
    const fileCount = repository.files?.length || 0;

    findings.push(`Repository contains ${fileCount} files`);
    findings.push(`Average complexity: ${metrics.complexity.toFixed(1)}`);
    findings.push(`Test coverage: ${metrics.testCoverage}%`);

    if (metrics.duplication > 20) {
      findings.push('Significant code duplication detected');
    }

    return findings;
  }

  private generateIssueInsights(context: AnalysisContext, metrics: any): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    if (metrics.complexity > 8) {
      insights.push({
        category: 'code_quality',
        title: 'High Complexity Detected',
        description: 'The code related to this issue has high cyclomatic complexity',
        evidence: [`Average complexity: ${metrics.complexity}`],
        confidence: 0.9,
        priority: 'high'
      });
    }

    if (metrics.codePatterns.length > 0) {
      insights.push({
        category: 'architecture',
        title: 'Code Patterns Identified',
        description: 'Several coding patterns detected in the codebase',
        evidence: metrics.codePatterns.map((pattern: any) => `${pattern.name}: ${pattern.description}`),
        confidence: 0.8,
        priority: 'medium'
      });
    }

    return insights;
  }

  private generatePRInsights(context: AnalysisContext, metrics: any): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    const linesChanged = context.changes?.reduce((sum, change) => sum + change.additions + change.deletions, 0) || 0;

    if (linesChanged > 500) {
      insights.push({
        category: 'maintainability',
        title: 'Large Change Set',
        description: 'This pull request contains a large number of changes',
        evidence: [`${linesChanged} lines changed`],
        confidence: 1.0,
        priority: 'high'
      });
    }

    return insights;
  }

  private generateRepoInsights(repository: Repository, metrics: any): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    if (metrics.testCoverage < 50) {
      insights.push({
        category: 'code_quality',
        title: 'Low Test Coverage',
        description: 'Repository has insufficient test coverage',
        evidence: [`Test coverage: ${metrics.testCoverage}%`],
        confidence: 0.95,
        priority: 'high'
      });
    }

    return insights;
  }

  private generateIssueRecommendations(context: AnalysisContext, metrics: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (metrics.complexity > 8) {
      recommendations.push({
        id: `rec_${Date.now()}`,
        title: 'Reduce Code Complexity',
        description: 'Break down complex functions into smaller, more manageable pieces',
        actionItems: [
          'Extract complex logic into separate functions',
          'Use early returns to reduce nesting',
          'Consider design patterns for complex logic'
        ],
        benefits: ['Improved readability', 'Easier maintenance', 'Better testability'],
        effort: 'medium',
        impact: 'high',
        category: 'code_quality'
      });
    }

    return recommendations;
  }

  private generatePRRecommendations(context: AnalysisContext, metrics: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (metrics.testCoverage < 70) {
      recommendations.push({
        id: `rec_${Date.now()}`,
        title: 'Improve Test Coverage',
        description: 'Add tests for the changed code to ensure quality',
        actionItems: [
          'Add unit tests for new functions',
          'Include integration tests for new features',
          'Update existing tests for modified code'
        ],
        benefits: ['Better quality assurance', 'Reduced regression risk'],
        effort: 'medium',
        impact: 'high',
        category: 'testing'
      });
    }

    return recommendations;
  }

  private generateRepoRecommendations(repository: Repository, metrics: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (metrics.duplication > 15) {
      recommendations.push({
        id: `rec_${Date.now()}`,
        title: 'Eliminate Code Duplication',
        description: 'Refactor duplicate code into reusable components',
        actionItems: [
          'Identify common code patterns',
          'Extract shared functionality',
          'Create utility functions or components'
        ],
        benefits: ['Reduced maintenance burden', 'Improved consistency'],
        effort: 'high',
        impact: 'medium',
        category: 'refactoring'
      });
    }

    return recommendations;
  }

  private buildAnalysisMetrics(files: any[], qualityMetrics: any): AnalysisMetrics {
    return {
      linesOfCode: files.reduce((sum, file) => sum + file.content.split('\n').length, 0),
      filesAnalyzed: files.length,
      complexity: qualityMetrics.complexity,
      testCoverage: qualityMetrics.testCoverage,
      technicalDebt: this.calculateTechnicalDebt(qualityMetrics),
      duplicateCode: qualityMetrics.duplication,
      dependencies: this.countDependencies(files)
    };
  }

  private determineComplexity(avgComplexity: number): 'low' | 'medium' | 'high' {
    if (avgComplexity <= 5) return 'low';
    if (avgComplexity <= 10) return 'medium';
    return 'high';
  }

  private determineImpact(context: AnalysisContext, metrics: any): 'minor' | 'moderate' | 'major' {
    const fileCount = context.files.length;
    if (fileCount <= 2 && metrics.complexity <= 5) return 'minor';
    if (fileCount <= 5 && metrics.complexity <= 10) return 'moderate';
    return 'major';
  }

  private determinePRImpact(context: AnalysisContext, metrics: any): 'minor' | 'moderate' | 'major' {
    const linesChanged = context.changes?.reduce((sum, change) => sum + change.additions + change.deletions, 0) || 0;
    if (linesChanged <= 50) return 'minor';
    if (linesChanged <= 200) return 'moderate';
    return 'major';
  }

  private determineRiskLevel(metrics: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    if (metrics.complexity > 8) riskScore += 3;
    if (metrics.testCoverage < 50) riskScore += 2;
    if (metrics.duplication > 20) riskScore += 2;
    if (metrics.issues.length > 3) riskScore += 1;

    if (riskScore <= 2) return 'low';
    if (riskScore <= 5) return 'medium';
    return 'high';
  }

  private classifyIssueType(issue: any): 'bug' | 'feature' | 'enhancement' | 'documentation' {
    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    const content = title + ' ' + body;

    if (content.includes('bug') || content.includes('error') || content.includes('fix')) return 'bug';
    if (content.includes('feature') || content.includes('add') || content.includes('new')) return 'feature';
    if (content.includes('improve') || content.includes('enhance') || content.includes('update')) return 'enhancement';
    if (content.includes('doc') || content.includes('readme')) return 'documentation';

    return 'feature';
  }

  private classifyChangeType(context: AnalysisContext): 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test' {
    const title = context.target.title.toLowerCase();

    if (title.includes('fix') || title.includes('bug')) return 'bugfix';
    if (title.includes('refactor') || title.includes('cleanup')) return 'refactor';
    if (title.includes('doc') || title.includes('readme')) return 'docs';
    if (title.includes('test') || title.includes('spec')) return 'test';

    return 'feature';
  }

  private estimateEffort(complexity: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    return complexity;
  }

  private analyzeArchitecture(files: any[]): string[] {
    const patterns = [];

    const hasControllers = files.some(f => f.path.includes('controller'));
    const hasServices = files.some(f => f.path.includes('service'));
    const hasModels = files.some(f => f.path.includes('model'));

    if (hasControllers && hasServices && hasModels) {
      patterns.push('MVC Architecture');
    }

    if (files.some(f => f.path.includes('component'))) {
      patterns.push('Component-based Architecture');
    }

    return patterns.length > 0 ? patterns : ['Monolithic Architecture'];
  }

  private detectTechnologies(files: any[]): string[] {
    const technologies = new Set<string>();

    files.forEach(file => {
      if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) technologies.add('TypeScript');
      if (file.path.endsWith('.js') || file.path.endsWith('.jsx')) technologies.add('JavaScript');
      if (file.path.endsWith('.py')) technologies.add('Python');
      if (file.path.endsWith('.java')) technologies.add('Java');
      if (file.path.endsWith('.go')) technologies.add('Go');
      if (file.content.includes('react')) technologies.add('React');
      if (file.content.includes('express')) technologies.add('Express');
      if (file.content.includes('jest')) technologies.add('Jest');
    });

    return Array.from(technologies);
  }

  private calculateHealthScore(metrics: any): number {
    let score = 100;

    if (metrics.complexity > 8) score -= 20;
    if (metrics.testCoverage < 50) score -= 30;
    if (metrics.duplication > 20) score -= 15;
    if (metrics.maintainability < 50) score -= 20;
    if (metrics.issues.length > 0) score -= metrics.issues.length * 5;

    return Math.max(0, score);
  }

  private calculateTechnicalDebt(metrics: any): number {
    let debt = 0;

    debt += metrics.complexity > 10 ? (metrics.complexity - 10) * 100 : 0;
    debt += metrics.duplication > 15 ? (metrics.duplication - 15) * 50 : 0;
    debt += metrics.testCoverage < 70 ? (70 - metrics.testCoverage) * 10 : 0;

    return debt;
  }

  private countDependencies(files: any[]): number {
    const imports = new Set<string>();

    files.forEach(file => {
      const importMatches = file.content.match(/import.*from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach((match: string) => {
          const dep = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (dep && !dep.startsWith('.')) {
            imports.add(dep);
          }
        });
      }
    });

    return imports.size;
  }

  private createFailedIssueResult(id: string, context: AnalysisContext, startTime: number, error: any): IssueAnalysisResult {
    return {
      id,
      type: 'issue',
      githubUrl: `${context.repository.url}/issues/${context.target.number}`,
      status: 'failed',
      summary: {
        title: 'Analysis Failed',
        description: `Failed to analyze issue: ${error.message}`,
        keyFindings: ['Analysis could not be completed'],
        complexity: 'low',
        impact: 'minor',
        riskLevel: 'low'
      },
      insights: [],
      recommendations: [],
      metrics: { linesOfCode: 0, filesAnalyzed: 0, complexity: 0, dependencies: 0 },
      generatedAt: new Date(),
      processingTime: Date.now() - startTime,
      issueType: 'bug',
      relatedFiles: [],
      estimatedEffort: 'low'
    };
  }

  private createFailedPRResult(id: string, context: AnalysisContext, startTime: number, error: any): PullRequestAnalysisResult {
    return {
      id,
      type: 'pullrequest',
      githubUrl: `${context.repository.url}/pull/${context.target.number}`,
      status: 'failed',
      summary: {
        title: 'Analysis Failed',
        description: `Failed to analyze PR: ${error.message}`,
        keyFindings: ['Analysis could not be completed'],
        complexity: 'low',
        impact: 'minor',
        riskLevel: 'low'
      },
      insights: [],
      recommendations: [],
      metrics: { linesOfCode: 0, filesAnalyzed: 0, complexity: 0, dependencies: 0 },
      generatedAt: new Date(),
      processingTime: Date.now() - startTime,
      changeType: 'bugfix',
      filesChanged: 0,
      linesAdded: 0,
      linesDeleted: 0,
      reviewComments: 0
    };
  }

  private createFailedRepoResult(id: string, repository: Repository, startTime: number, error: any): RepositoryAnalysisResult {
    return {
      id,
      type: 'repository',
      githubUrl: repository.url,
      status: 'failed',
      summary: {
        title: 'Analysis Failed',
        description: `Failed to analyze repository: ${error.message}`,
        keyFindings: ['Analysis could not be completed'],
        complexity: 'low',
        impact: 'minor',
        riskLevel: 'low'
      },
      insights: [],
      recommendations: [],
      metrics: { linesOfCode: 0, filesAnalyzed: 0, complexity: 0, dependencies: 0 },
      generatedAt: new Date(),
      processingTime: Date.now() - startTime,
      architecture: ['Unknown'],
      technologies: [],
      healthScore: 0
    };
  }

  async getAnalysisStatus(analysisId: string): Promise<{ id: string; status: string; progress?: number }> {
    const result = this.analysisResults.get(analysisId);
    if (!result) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    return {
      id: analysisId,
      status: result.status,
      progress: result.status === 'processing' ? Math.random() * 100 : 100
    };
  }

  async cancelAnalysis(analysisId: string): Promise<boolean> {
    const result = this.analysisResults.get(analysisId);
    if (!result) {
      return false;
    }

    if (result.status === 'processing') {
      result.status = 'cancelled';
      this.analysisResults.set(analysisId, result);
      return true;
    }

    return false;
  }
}