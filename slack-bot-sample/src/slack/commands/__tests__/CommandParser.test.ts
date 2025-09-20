import { CommandParser } from '../CommandParser';
import { CommandOptions } from '../types';

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  describe('GitHub URL Parsing', () => {
    test('should parse valid issue URL', () => {
      const url = 'https://github.com/owner/repo/issues/123';
      const result = parser.parseGitHubUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        type: 'issue',
        number: 123,
      });
    });

    test('should parse valid PR URL', () => {
      const url = 'https://github.com/owner/repo/pull/456';
      const result = parser.parseGitHubUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        type: 'pr',
        number: 456,
      });
    });

    test('should return null for invalid URL', () => {
      const url = 'https://invalid-url.com/test';
      const result = parser.parseGitHubUrl(url);

      expect(result).toBeNull();
    });

    test('should handle GitHub URLs with www', () => {
      const url = 'https://www.github.com/owner/repo/issues/789';
      const result = parser.parseGitHubUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        type: 'issue',
        number: 789,
      });
    });

    test('should handle URLs with trailing slash', () => {
      const url = 'https://github.com/owner/repo/pull/999/';
      const result = parser.parseGitHubUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        type: 'pr',
        number: 999,
      });
    });
  });

  describe('Options Parsing', () => {
    test('should parse basic options', () => {
      const optionsText = '--type=issue --depth=5';
      const result = parser.parseOptions(optionsText);

      expect(result).toEqual({
        type: 'issue',
        depth: 5,
        format: 'markdown', // default
        includeTests: false, // default
      });
    });

    test('should parse all options', () => {
      const optionsText = '--type=pr --depth=10 --format=json --include-tests';
      const result = parser.parseOptions(optionsText);

      expect(result).toEqual({
        type: 'pr',
        depth: 10,
        format: 'json',
        includeTests: true,
      });
    });

    test('should handle no options', () => {
      const optionsText = '';
      const result = parser.parseOptions(optionsText);

      expect(result).toEqual({
        format: 'markdown',
        includeTests: false,
      });
    });

    test('should handle options with different formats', () => {
      const optionsText = '--type pr --depth 7 --format=markdown';
      const result = parser.parseOptions(optionsText);

      expect(result).toEqual({
        type: 'pr',
        depth: 7,
        format: 'markdown',
        includeTests: false,
      });
    });

    test('should ignore unknown options', () => {
      const optionsText = '--type=issue --unknown=value --depth=3';
      const result = parser.parseOptions(optionsText);

      expect(result).toEqual({
        type: 'issue',
        depth: 3,
        format: 'markdown',
        includeTests: false,
      });
    });
  });

  describe('Options Validation', () => {
    test('should validate correct options', () => {
      const options: CommandOptions = {
        type: 'issue',
        depth: 5,
        format: 'markdown',
        includeTests: true,
      };

      const errors = parser.validateOptions(options);
      expect(errors).toEqual([]);
    });

    test('should detect invalid type', () => {
      const options: CommandOptions = {
        type: 'invalid' as any,
        depth: 5,
      };

      const errors = parser.validateOptions(options);
      expect(errors).toContain('Invalid type. Must be "issue" or "pr"');
    });

    test('should detect invalid depth', () => {
      const options: CommandOptions = {
        depth: 0,
      };

      const errors = parser.validateOptions(options);
      expect(errors).toContain('Depth must be between 1 and 50');
    });

    test('should detect multiple validation errors', () => {
      const options: CommandOptions = {
        type: 'invalid' as any,
        depth: -1,
        format: 'invalid' as any,
      };

      const errors = parser.validateOptions(options);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('Invalid type. Must be "issue" or "pr"');
      expect(errors).toContain('Depth must be between 1 and 50');
      expect(errors).toContain('Invalid format. Must be "markdown" or "json"');
    });
  });

  describe('Complete Command Parsing', () => {
    test('should parse URL with options', () => {
      const text = 'https://github.com/owner/repo/issues/123 --depth=5 --format=json';
      const result = parser.parseCommand(text);

      expect(result).toEqual({
        githubUrl: 'https://github.com/owner/repo/issues/123',
        options: {
          depth: 5,
          format: 'json',
          includeTests: false,
        },
        isValid: true,
        errors: [],
      });
    });

    test('should handle URL and options in different order', () => {
      const text = '--depth=3 https://github.com/test/repo/pull/1 --format=markdown';
      const result = parser.parseCommand(text);

      expect(result.githubUrl).toBe('https://github.com/test/repo/pull/1');
      expect(result.options.depth).toBe(3);
      expect(result.options.format).toBe('markdown');
      expect(result.isValid).toBe(true);
    });

    test('should handle whitespace and extra spaces', () => {
      const text = '  --depth=5   https://github.com/owner/repo/issues/123  --include-tests  ';
      const result = parser.parseCommand(text);

      expect(result.githubUrl).toBe('https://github.com/owner/repo/issues/123');
      expect(result.options.depth).toBe(5);
      expect(result.options.includeTests).toBe(true);
      expect(result.isValid).toBe(true);
    });

    test('should return invalid for missing URL', () => {
      const text = '--depth=5 --format=json';
      const result = parser.parseCommand(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub URL is required');
    });

    test('should return invalid for bad URL', () => {
      const text = 'https://invalid-url.com --depth=5';
      const result = parser.parseCommand(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid GitHub URL format');
    });

    test('should combine URL and options validation errors', () => {
      const text = 'https://invalid-url.com --depth=0 --type=invalid';
      const result = parser.parseCommand(text);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Help and Special Cases', () => {
    test('should recognize help command', () => {
      const text = 'help';
      const result = parser.parseCommand(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('help');
    });

    test('should recognize --help flag', () => {
      const text = '--help';
      const result = parser.parseCommand(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('help');
    });

    test('should handle empty input', () => {
      const text = '';
      const result = parser.parseCommand(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('help');
    });

    test('should handle only whitespace', () => {
      const text = '   ';
      const result = parser.parseCommand(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('help');
    });
  });

  describe('Edge Cases', () => {
    test('should handle URLs with query parameters', () => {
      const url = 'https://github.com/owner/repo/issues/123?tab=comments';
      const result = parser.parseGitHubUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        type: 'issue',
        number: 123,
      });
    });

    test('should handle URLs with fragments', () => {
      const url = 'https://github.com/owner/repo/pull/456#discussion_r123';
      const result = parser.parseGitHubUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        type: 'pr',
        number: 456,
      });
    });

    test('should handle mixed case in options', () => {
      const optionsText = '--TYPE=Issue --FORMAT=JSON';
      const result = parser.parseOptions(optionsText);

      expect(result.type).toBe('issue');
      expect(result.format).toBe('json');
    });

    test('should handle boolean flags without values', () => {
      const optionsText = '--include-tests --depth=5';
      const result = parser.parseOptions(optionsText);

      expect(result.includeTests).toBe(true);
      expect(result.depth).toBe(5);
    });
  });
});