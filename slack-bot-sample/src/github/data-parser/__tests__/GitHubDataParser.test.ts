import { GitHubDataParser } from '../GitHubDataParser';
import { createMockIssue, createMockPR, createMockFile } from './helpers/mockData';
import type { FileInfo } from '../../types';

describe('GitHubDataParser', () => {
  describe('Creation and Initialization', () => {
    test('should create GitHubDataParser instance', () => {
      const parser = new GitHubDataParser();
      expect(parser).toBeInstanceOf(GitHubDataParser);
    });

    test('should initialize with default configuration', () => {
      const parser = new GitHubDataParser();
      const config = parser.getConfig();

      expect(config).toMatchObject({
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedExtensions: ['.ts', '.js', '.tsx', '.jsx', '.json', '.sql', '.md'],
      });
    });
  });

  describe('Issue Data Parsing', () => {
    test('should parse basic issue data correctly', () => {
      const mockIssueInfo = createMockIssue({
        id: 123456789,
        number: 123,
        title: 'Test Issue',
        body: 'This is a test issue',
        state: 'open',
        labels: ['bug', 'high-priority'],
        assignees: [],
      });

      const parser = new GitHubDataParser();
      const result = parser.parseIssueData(mockIssueInfo);

      expect(result).toMatchObject({
        metadata: {
          id: 123456789,
          number: 123,
          title: 'Test Issue',
          type: 'issue',
          state: 'open',
        },
        content: {
          description: 'This is a test issue',
          labels: ['bug', 'high-priority'],
          assignees: [],
        },
      });
    });

    test('should handle issue with empty body', () => {
      const mockIssueInfo = createMockIssue({ body: '' });
      const parser = new GitHubDataParser();
      const result = parser.parseIssueData(mockIssueInfo);

      expect(result.content.description).toBe('');
    });

    test('should handle issue with null body', () => {
      const mockIssueInfo = createMockIssue({ body: null as any });
      const parser = new GitHubDataParser();
      const result = parser.parseIssueData(mockIssueInfo);

      expect(result.content.description).toBe('');
    });

    test('should throw validation error for invalid data', () => {
      const parser = new GitHubDataParser();

      expect(() => {
        parser.parseIssueData(null as any);
      }).toThrow('Invalid data provided');
    });

    test('should throw validation error for missing required fields', () => {
      const invalidIssue = {
        state: 'open',
      } as any;

      const parser = new GitHubDataParser();

      expect(() => {
        parser.parseIssueData(invalidIssue);
      }).toThrow('Missing required fields');
    });
  });

  describe('Pull Request Data Parsing', () => {
    test('should parse basic PR data correctly', () => {
      const mockPRInfo = createMockPR({
        baseBranch: 'main',
        headBranch: 'feature-branch',
        mergeable: true,
        merged: false,
        mergedAt: null,
      });

      const parser = new GitHubDataParser();
      const result = parser.parsePullRequestData(mockPRInfo);

      expect(result).toMatchObject({
        metadata: {
          type: 'pull',
        },
        changes: {
          baseBranch: 'main',
          headBranch: 'feature-branch',
          commits: expect.any(Array),
        },
        status: {
          mergeable: true,
          merged: false,
        },
      });
    });

    test('should handle PR without changed files', () => {
      const mockPRInfo = createMockPR({ changedFiles: [] });
      const parser = new GitHubDataParser();
      const result = parser.parsePullRequestData(mockPRInfo);

      expect(result.changes.files.included).toHaveLength(0);
      expect(result.changes.files.statistics.totalFiles).toBe(0);
    });
  });

  describe('File Filtering', () => {
    test('should filter files by supported extensions', () => {
      const mockFiles: FileInfo[] = [
        createMockFile('src/index.ts', 'modified', 1024),
        createMockFile('README.md', 'added', 2048),
        createMockFile('image.png', 'added', 1024),
        createMockFile('script.js', 'modified', 512),
        createMockFile('binary.exe', 'added', 2048),
      ];

      const parser = new GitHubDataParser();
      const result = parser.filterFiles(mockFiles);

      expect(result.included).toHaveLength(3); // .ts, .md, .js
      expect(result.excluded.byExtension).toHaveLength(2); // .png, .exe
      expect(result.statistics.includedCount).toBe(3);
      expect(result.statistics.excludedCount).toBe(2);
    });

    test('should filter files by size limit', () => {
      const mockFiles: FileInfo[] = [
        createMockFile('small.ts', 'modified', 1024), // 1KB
        createMockFile('large.ts', 'modified', 11 * 1024 * 1024), // 11MB
        createMockFile('medium.js', 'added', 5 * 1024 * 1024), // 5MB
      ];

      const parser = new GitHubDataParser();
      const result = parser.filterFiles(mockFiles);

      expect(result.included).toHaveLength(2); // small.ts, medium.js
      expect(result.excluded.bySize).toHaveLength(1); // large.ts
      expect(result.excluded.bySize[0]?.filename).toBe('large.ts');
    });

    test('should calculate correct statistics', () => {
      const mockFiles: FileInfo[] = [
        createMockFile('file1.ts', 'modified', 1024),
        createMockFile('file2.js', 'added', 2048),
        createMockFile('file3.png', 'removed', 512),
      ];

      const parser = new GitHubDataParser();
      const result = parser.filterFiles(mockFiles);

      expect(result.statistics).toMatchObject({
        totalFiles: 3,
        includedCount: 2,
        excludedCount: 1,
        totalSizeBytes: 1024 + 2048, // Only included files
      });
    });

    test('should handle empty file list', () => {
      const parser = new GitHubDataParser();
      const result = parser.filterFiles([]);

      expect(result.included).toHaveLength(0);
      expect(result.excluded.bySize).toHaveLength(0);
      expect(result.excluded.byExtension).toHaveLength(0);
      expect(result.statistics.totalFiles).toBe(0);
    });
  });

  describe('Metadata Extraction', () => {
    test('should extract common metadata from issue', () => {
      const mockIssueInfo = createMockIssue();
      const parser = new GitHubDataParser();
      const result = parser.extractMetadata(mockIssueInfo);

      expect(result).toMatchObject({
        id: expect.any(Number),
        number: expect.any(Number),
        title: expect.any(String),
        type: 'issue',
        repository: expect.objectContaining({
          owner: expect.any(String),
          name: expect.any(String),
          fullName: expect.any(String),
        }),
        author: expect.objectContaining({
          login: expect.any(String),
          id: expect.any(Number),
        }),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        state: expect.stringMatching(/^(open|closed)$/),
      });
    });

    test('should extract common metadata from PR', () => {
      const mockPRInfo = createMockPR();
      const parser = new GitHubDataParser();
      const result = parser.extractMetadata(mockPRInfo);

      expect(result.type).toBe('pull');
    });

    test('should handle missing optional fields', () => {
      const mockIssueInfo = createMockIssue({
        repository: {
          owner: 'test',
          name: 'repo',
          fullName: 'test/repo',
          private: false,
          html_url: 'https://github.com/test/repo',
        },
      });

      const parser = new GitHubDataParser();
      const result = parser.extractMetadata(mockIssueInfo);

      expect(result.repository).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should parse issue data within 100ms', () => {
      const mockIssueInfo = createMockIssue();
      const parser = new GitHubDataParser();

      const startTime = Date.now();
      parser.parseIssueData(mockIssueInfo);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should filter 1000 files within 5 seconds', () => {
      const mockFiles = Array.from({ length: 1000 }, (_, i) =>
        createMockFile(`file${i}.ts`, 'modified', 1024)
      );

      const parser = new GitHubDataParser();

      const startTime = Date.now();
      parser.filterFiles(mockFiles);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should handle large PR data efficiently', () => {
      const mockPRInfo = createMockPR({
        changedFiles: Array.from({ length: 500 }, (_, i) =>
          createMockFile(`file${i}.ts`, 'modified', 1024)
        ),
      });

      const parser = new GitHubDataParser();

      const startTime = Date.now();
      parser.parsePullRequestData(mockPRInfo);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1 second
    });
  });
});