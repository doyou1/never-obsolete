import { FileContent, QualityMetrics, CodePattern, TestCoverageResult, MaintainabilityIndex } from './types';

interface ComplexityResult {
  averageComplexity: number;
  maxComplexity: number;
  complexFunctions: Array<{
    name: string;
    complexity: number;
    suggestion: string;
  }>;
  distribution: {
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
}

interface MaintainabilityResult {
  overallScore: number;
  rating: 'excellent' | 'good' | 'moderate' | 'poor';
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
  recommendations: string[];
  fileScores: Array<{
    file: string;
    score: number;
    issues: string[];
  }>;
}

export class QualityAnalyzer {
  async calculateComplexity(files: FileContent[]): Promise<ComplexityResult> {
    const complexFunctions: Array<{ name: string; complexity: number; suggestion: string }> = [];
    let totalComplexity = 0;
    let maxComplexity = 0;
    const distribution = { low: 0, medium: 0, high: 0, veryHigh: 0 };

    for (const file of files) {
      const functions = this.extractFunctions(file.content);

      for (const func of functions) {
        const complexity = this.calculateFunctionComplexity(func.content);
        totalComplexity += complexity;
        maxComplexity = Math.max(maxComplexity, complexity);

        if (complexity >= 6) {
          complexFunctions.push({
            name: func.name,
            complexity,
            suggestion: this.generateComplexitySuggestion(complexity)
          });
        }

        if (complexity <= 3) distribution.low++;
        else if (complexity <= 6) distribution.medium++;
        else if (complexity <= 10) distribution.high++;
        else distribution.veryHigh++;
      }
    }

    const totalFunctions = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const averageComplexity = totalFunctions > 0 ? totalComplexity / totalFunctions : 0;

    return {
      averageComplexity: Math.round(averageComplexity * 100) / 100,
      maxComplexity,
      complexFunctions,
      distribution
    };
  }

  private calculateFunctionComplexity(functionContent: string): number {
    let complexity = 1;

    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?.*:/g
    ];

    complexityPatterns.forEach(pattern => {
      const matches = functionContent.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private extractFunctions(content: string): Array<{ name: string; content: string }> {
    const functions: Array<{ name: string; content: string }> = [];

    const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const startIndex = match.index;
      const functionContent = this.extractFunctionBody(content, startIndex);

      functions.push({
        name: functionName,
        content: functionContent
      });
    }

    const arrowFunctionRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>/g;
    while ((match = arrowFunctionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const startIndex = match.index;
      const functionContent = this.extractArrowFunctionBody(content, startIndex);

      functions.push({
        name: functionName,
        content: functionContent
      });
    }

    return functions;
  }

  private extractFunctionBody(content: string, startIndex: number): string {
    let braceCount = 0;
    let i = startIndex;
    let startBodyIndex = -1;

    while (i < content.length) {
      if (content[i] === '{') {
        if (startBodyIndex === -1) startBodyIndex = i;
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          return content.substring(startBodyIndex, i + 1);
        }
      }
      i++;
    }

    return content.substring(startIndex);
  }

  private extractArrowFunctionBody(content: string, startIndex: number): string {
    const arrowIndex = content.indexOf('=>', startIndex);
    if (arrowIndex === -1) return '';

    let i = arrowIndex + 2;
    while (i < content.length && /\s/.test(content[i])) i++;

    if (content[i] === '{') {
      return this.extractFunctionBody(content, i);
    } else {
      let endIndex = i;
      while (endIndex < content.length && content[endIndex] !== ';' && content[endIndex] !== '\n') {
        endIndex++;
      }
      return content.substring(i, endIndex);
    }
  }

  private generateComplexitySuggestion(complexity: number): string {
    if (complexity >= 15) {
      return 'Very high complexity. Consider breaking this function into multiple smaller functions.';
    } else if (complexity >= 10) {
      return 'High complexity. Consider refactoring to reduce conditional logic.';
    } else if (complexity >= 6) {
      return 'Medium complexity. Consider simplifying the logic or extracting some functionality.';
    }
    return 'Low complexity. Function is well-structured.';
  }

  async detectDuplication(files: FileContent[]): Promise<{ duplicateBlocks: Array<{ files: string[]; similarity: number; lines: number }> }> {
    return this.detectCodeDuplication(files);
  }

  detectCodeDuplication(files: FileContent[]): { duplicateBlocks: Array<{ files: string[]; similarity: number; lines: number }> } {
    const duplicateBlocks: Array<{ files: string[]; similarity: number; lines: number }> = [];

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const file1 = files[i];
        const file2 = files[j];

        const lines1 = file1.content.split('\n').filter(line => line.trim().length > 0);
        const lines2 = file2.content.split('\n').filter(line => line.trim().length > 0);

        let matchingLines = 0;
        const minLength = Math.min(lines1.length, lines2.length);

        for (let k = 0; k < minLength; k++) {
          if (lines1[k]?.trim() === lines2[k]?.trim()) {
            matchingLines++;
          }
        }

        if (minLength > 0) {
          const similarity = matchingLines / minLength;

          if (similarity > 0.3) {
            duplicateBlocks.push({
              files: [file1.path, file2.path],
              similarity: Math.round(similarity * 100) / 100,
              lines: matchingLines
            });
          }
        }
      }
    }

    return { duplicateBlocks };
  }

  async analyzeTestCoverage(files: FileContent[]): Promise<TestCoverageResult> {
    const sourceFiles = files.filter(file =>
      !file.path.includes('test') &&
      !file.path.includes('spec') &&
      (file.path.endsWith('.ts') || file.path.endsWith('.js'))
    );

    const testFiles = files.filter(file =>
      (file.path.includes('test') || file.path.includes('spec')) &&
      (file.path.endsWith('.ts') || file.path.endsWith('.js'))
    );

    const totalLines = sourceFiles.reduce((sum, file) => {
      return sum + file.content.split('\n').filter(line => line.trim().length > 0).length;
    }, 0);

    const testLines = testFiles.reduce((sum, file) => {
      return sum + file.content.split('\n').filter(line => line.trim().length > 0).length;
    }, 0);

    const coverage = totalLines > 0 ? Math.min(testLines / totalLines, 1) : 0;

    const uncoveredFiles = sourceFiles
      .filter(file => {
        const hasCorrespondingTest = testFiles.some(testFile =>
          testFile.path.includes(file.path.split('/').pop()?.replace('.ts', '').replace('.js', '') || '')
        );
        return !hasCorrespondingTest;
      })
      .map(file => file.path);

    return {
      percentage: Math.round(coverage * 100),
      coveredLines: Math.round(totalLines * coverage),
      totalLines,
      uncoveredFiles
    };
  }

  calculateMaintainabilityIndex(fileContent: FileContent): MaintainabilityIndex {
    const complexity = this.calculateComplexity(fileContent);
    const lines = fileContent.content.split('\n').filter(line => line.trim().length > 0).length;
    const halsteadVolume = this.calculateHalsteadVolume(fileContent);

    const maintainabilityIndex = Math.max(0,
      171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(lines)
    );

    let rating: 'excellent' | 'good' | 'moderate' | 'poor';
    if (maintainabilityIndex >= 85) rating = 'excellent';
    else if (maintainabilityIndex >= 70) rating = 'good';
    else if (maintainabilityIndex >= 50) rating = 'moderate';
    else rating = 'poor';

    return {
      score: Math.round(maintainabilityIndex),
      rating,
      factors: {
        complexity,
        linesOfCode: lines,
        halsteadVolume: Math.round(halsteadVolume)
      }
    };
  }

  private calculateHalsteadVolume(fileContent: FileContent): number {
    const code = fileContent.content;

    const operators = code.match(/[+\-*\/=<>!&|%^~]/g) || [];
    const operands = code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];

    const uniqueOperators = new Set(operators).size;
    const uniqueOperands = new Set(operands).size;
    const totalOperators = operators.length;
    const totalOperands = operands.length;

    const vocabulary = uniqueOperators + uniqueOperands;
    const length = totalOperators + totalOperands;

    return length * Math.log2(vocabulary || 1);
  }

  detectCodePatterns(fileContent: FileContent): CodePattern[] {
    const patterns: CodePattern[] = [];
    const code = fileContent.content;

    if (code.match(/class\s+\w+\s*{[\s\S]*constructor[\s\S]*}/)) {
      patterns.push({
        type: 'design_pattern',
        name: 'Constructor Pattern',
        description: 'Class with constructor detected',
        confidence: 0.9,
        lineNumbers: this.findPatternLines(code, /class\s+\w+/)
      });
    }

    if (code.match(/function\s*\*|yield/)) {
      patterns.push({
        type: 'async_pattern',
        name: 'Generator Function',
        description: 'Generator function pattern detected',
        confidence: 0.95,
        lineNumbers: this.findPatternLines(code, /function\s*\*/)
      });
    }

    if (code.match(/async\s+function|await\s+/)) {
      patterns.push({
        type: 'async_pattern',
        name: 'Async/Await Pattern',
        description: 'Async/await pattern detected',
        confidence: 0.95,
        lineNumbers: this.findPatternLines(code, /async\s+function|await\s+/)
      });
    }

    if (code.match(/\.then\s*\(|\.catch\s*\(/)) {
      patterns.push({
        type: 'async_pattern',
        name: 'Promise Pattern',
        description: 'Promise chain pattern detected',
        confidence: 0.9,
        lineNumbers: this.findPatternLines(code, /\.then\s*\(|\.catch\s*\(/)
      });
    }

    return patterns;
  }

  private findPatternLines(code: string, pattern: RegExp): number[] {
    const lines = code.split('\n');
    const lineNumbers: number[] = [];

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        lineNumbers.push(index + 1);
      }
    });

    return lineNumbers;
  }

  analyzeQuality(files: FileContent[]): QualityMetrics {
    const totalComplexity = files.reduce((sum, file) => sum + this.calculateComplexity(file), 0);
    const avgComplexity = files.length > 0 ? totalComplexity / files.length : 0;

    const duplicationResult = this.detectCodeDuplication(files);
    const duplicationPercentage = duplicationResult.duplicateBlocks.length > 0
      ? duplicationResult.duplicateBlocks.reduce((sum, block) => sum + block.similarity, 0) / duplicationResult.duplicateBlocks.length
      : 0;

    const coverageResult = this.analyzeTestCoverage(files);

    const maintainabilityScores = files.map(file => this.calculateMaintainabilityIndex(file).score);
    const avgMaintainability = maintainabilityScores.length > 0
      ? maintainabilityScores.reduce((sum, score) => sum + score, 0) / maintainabilityScores.length
      : 0;

    const allPatterns = files.flatMap(file => this.detectCodePatterns(file));

    return {
      complexity: Math.round(avgComplexity * 100) / 100,
      duplication: Math.round(duplicationPercentage * 100),
      testCoverage: coverageResult.percentage,
      maintainability: Math.round(avgMaintainability),
      codePatterns: allPatterns,
      issues: this.identifyQualityIssues(avgComplexity, duplicationPercentage, coverageResult.percentage, avgMaintainability)
    };
  }

  private identifyQualityIssues(complexity: number, duplication: number, coverage: number, maintainability: number): string[] {
    const issues: string[] = [];

    if (complexity > 10) {
      issues.push('High cyclomatic complexity detected');
    }

    if (duplication > 0.2) {
      issues.push('Significant code duplication found');
    }

    if (coverage < 50) {
      issues.push('Low test coverage');
    }

    if (maintainability < 50) {
      issues.push('Poor maintainability index');
    }

    return issues;
  }

  async assessMaintainability(files: FileContent[]): Promise<MaintainabilityResult> {
    const factors = [
      {
        name: 'Complexity',
        score: 0,
        weight: 0.3,
        description: 'Code complexity assessment'
      },
      {
        name: 'Test Coverage',
        score: 0,
        weight: 0.25,
        description: 'Test coverage percentage'
      },
      {
        name: 'Code Duplication',
        score: 0,
        weight: 0.2,
        description: 'Amount of duplicated code'
      },
      {
        name: 'Documentation',
        score: 0,
        weight: 0.15,
        description: 'Code documentation quality'
      },
      {
        name: 'Code Style',
        score: 0,
        weight: 0.1,
        description: 'Code style consistency'
      }
    ];

    const complexityResult = await this.calculateComplexity(files);
    const coverageResult = await this.analyzeTestCoverage(files);
    const duplicationResult = this.detectCodeDuplication(files);

    factors[0].score = this.calculateComplexityScore(complexityResult.averageComplexity);
    factors[1].score = coverageResult.percentage;
    factors[2].score = this.calculateDuplicationScore(duplicationResult.duplicateBlocks);
    factors[3].score = this.assessDocumentationScore(files);
    factors[4].score = this.assessCodeStyleScore(files);

    const overallScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);

    let rating: 'excellent' | 'good' | 'moderate' | 'poor';
    if (overallScore >= 85) rating = 'excellent';
    else if (overallScore >= 70) rating = 'good';
    else if (overallScore >= 50) rating = 'moderate';
    else rating = 'poor';

    const recommendations = this.generateMaintainabilityRecommendations(factors, overallScore);
    const fileScores = this.calculateFileScores(files, complexityResult, coverageResult);

    return {
      overallScore: Math.round(overallScore),
      rating,
      factors,
      recommendations,
      fileScores
    };
  }

  private calculateComplexityScore(avgComplexity: number): number {
    if (avgComplexity <= 3) return 100;
    if (avgComplexity <= 6) return 80;
    if (avgComplexity <= 10) return 60;
    if (avgComplexity <= 15) return 40;
    return 20;
  }

  private calculateDuplicationScore(duplicateBlocks: Array<{ files: string[]; similarity: number; lines: number }>): number {
    if (duplicateBlocks.length === 0) return 100;

    const avgSimilarity = duplicateBlocks.reduce((sum, block) => sum + block.similarity, 0) / duplicateBlocks.length;
    return Math.max(0, 100 - (avgSimilarity * 100));
  }

  private assessDocumentationScore(files: FileContent[]): number {
    let totalLines = 0;
    let commentLines = 0;

    files.forEach(file => {
      const lines = file.content.split('\n');
      totalLines += lines.length;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          commentLines++;
        }
      });
    });

    if (totalLines === 0) return 0;
    const commentRatio = commentLines / totalLines;
    return Math.min(100, commentRatio * 500);
  }

  private assessCodeStyleScore(files: FileContent[]): number {
    let totalViolations = 0;
    let totalLines = 0;

    files.forEach(file => {
      const lines = file.content.split('\n');
      totalLines += lines.length;

      lines.forEach(line => {
        if (line.includes('\t')) totalViolations++;
        if (line.length > 120) totalViolations++;
        if (/^\s*[a-zA-Z]/.test(line) && !line.includes(' ')) totalViolations++;
      });
    });

    if (totalLines === 0) return 100;
    const violationRatio = totalViolations / totalLines;
    return Math.max(0, 100 - (violationRatio * 200));
  }

  private generateMaintainabilityRecommendations(
    factors: Array<{ name: string; score: number; weight: number; description: string }>,
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    factors.forEach(factor => {
      if (factor.score < 60) {
        switch (factor.name) {
          case 'Complexity':
            recommendations.push('Reduce code complexity by breaking down large functions');
            break;
          case 'Test Coverage':
            recommendations.push('Increase test coverage by adding more unit tests');
            break;
          case 'Code Duplication':
            recommendations.push('Eliminate code duplication by extracting common functionality');
            break;
          case 'Documentation':
            recommendations.push('Add more code comments and documentation');
            break;
          case 'Code Style':
            recommendations.push('Improve code style consistency and formatting');
            break;
        }
      }
    });

    if (overallScore < 50) {
      recommendations.push('Consider a major refactoring to improve overall maintainability');
    } else if (overallScore < 70) {
      recommendations.push('Focus on the lowest scoring factors for improvement');
    }

    return recommendations;
  }

  private calculateFileScores(files: FileContent[], complexityResult: any, coverageResult: any): Array<{ file: string; score: number; issues: string[] }> {
    return files.map(file => {
      const functions = this.extractFunctions(file.content);
      let fileComplexity = 0;

      for (const func of functions) {
        fileComplexity += this.calculateFunctionComplexity(func.content);
      }

      const avgComplexity = functions.length > 0 ? fileComplexity / functions.length : 0;
      const complexityScore = this.calculateComplexityScore(avgComplexity);

      const hasTest = coverageResult.uncoveredFiles ? !coverageResult.uncoveredFiles.includes(file.path) : true;
      const testScore = hasTest ? 100 : 0;

      const documentationScore = this.assessDocumentationScore([file]);
      const styleScore = this.assessCodeStyleScore([file]);

      const overallFileScore = (complexityScore * 0.4) + (testScore * 0.3) + (documentationScore * 0.2) + (styleScore * 0.1);

      const issues: string[] = [];
      if (complexityScore < 60) issues.push('High complexity detected');
      if (!hasTest) issues.push('No test coverage');
      if (documentationScore < 30) issues.push('Poor documentation');
      if (styleScore < 60) issues.push('Style violations');

      return {
        file: file.path,
        score: Math.round(overallFileScore),
        issues
      };
    });
  }
}