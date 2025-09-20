import { SlackCommandHandler } from '../SlackCommandHandler';
import { CommandParser } from '../CommandParser';
import { AnalysisRequestManager } from '../AnalysisRequestManager';
import { ICommandParser, IAnalysisRequestManager } from '../types';

describe('SlackCommandHandler', () => {
  let handler: SlackCommandHandler;
  let mockParser: jest.Mocked<ICommandParser>;
  let mockRequestManager: jest.Mocked<IAnalysisRequestManager>;

  beforeEach(() => {
    mockParser = {
      parseCommand: jest.fn(),
      parseGitHubUrl: jest.fn(),
      parseOptions: jest.fn(),
      validateOptions: jest.fn(),
    };

    mockRequestManager = {
      createRequest: jest.fn(),
      updateStatus: jest.fn(),
      getRequest: jest.fn(),
      getUserRequests: jest.fn(),
      getRequestsByStatus: jest.fn(),
    };

    handler = new SlackCommandHandler(mockParser, mockRequestManager);
  });

  describe('Command Handling', () => {
    test('should handle basic analyze-repo command', async () => {
      const githubUrl = 'https://github.com/owner/repo/issues/123';
      const parsedCommand = {
        githubUrl,
        options: { format: 'markdown' as const, includeTests: false },
        isValid: true,
        errors: [],
      };

      const analysisRequest = {
        id: 'req-123',
        userId: 'user1',
        channelId: 'channel1',
        githubUrl,
        options: { format: 'markdown' as const, includeTests: false },
        status: 'pending' as const,
        createdAt: new Date(),
      };

      mockParser.parseCommand.mockReturnValue(parsedCommand);
      mockParser.parseGitHubUrl.mockReturnValue({
        owner: 'owner',
        repo: 'repo',
        type: 'issue',
        number: 123,
      });
      mockRequestManager.createRequest.mockReturnValue(analysisRequest);

      const result = await handler.handleAnalyzeCommand(
        githubUrl,
        'user1',
        'channel1'
      );

      expect(mockParser.parseCommand).toHaveBeenCalledWith(githubUrl);
      expect(mockRequestManager.createRequest).toHaveBeenCalledWith(
        'user1',
        'channel1',
        githubUrl,
        { format: 'markdown', includeTests: false }
      );

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('GitHub 분석을 시작합니다');
      expect(result.text).toContain('owner/repo');
      expect(result.text).toContain('issue #123');
    });

    test('should handle command with options', async () => {
      const text = 'https://github.com/owner/repo/pull/456 --depth=5 --format=json';
      const parsedCommand = {
        githubUrl: 'https://github.com/owner/repo/pull/456',
        options: { depth: 5, format: 'json' as const },
        isValid: true,
        errors: [],
      };

      const analysisRequest = {
        id: 'req-456',
        userId: 'user1',
        channelId: 'channel1',
        githubUrl: 'https://github.com/owner/repo/pull/456',
        options: { depth: 5, format: 'json' as const },
        status: 'pending' as const,
        createdAt: new Date(),
      };

      mockParser.parseCommand.mockReturnValue(parsedCommand);
      mockParser.parseGitHubUrl.mockReturnValue({
        owner: 'owner',
        repo: 'repo',
        type: 'pr',
        number: 456,
      });
      mockRequestManager.createRequest.mockReturnValue(analysisRequest);

      const result = await handler.handleAnalyzeCommand(text, 'user1', 'channel1');

      expect(result.text).toContain('--depth=5');
      expect(result.text).toContain('--format=json');
      expect(result.text).toContain('pr #456');
    });

    test('should handle help command', async () => {
      const parsedCommand = {
        githubUrl: '',
        options: {},
        isValid: false,
        errors: ['help'],
      };

      mockParser.parseCommand.mockReturnValue(parsedCommand);

      const result = await handler.handleAnalyzeCommand('help', 'user1', 'channel1');

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('/analyze-repo 사용법');
      expect(result.text).toContain('--type issue|pr');
      expect(result.text).toContain('--depth');
      expect(result.text).toContain('--format');
      expect(result.text).toContain('--include-tests');
    });

    test('should handle invalid URL error', async () => {
      const parsedCommand = {
        githubUrl: '',
        options: {},
        isValid: false,
        errors: ['GitHub URL is required', 'Invalid GitHub URL format'],
      };

      mockParser.parseCommand.mockReturnValue(parsedCommand);

      const result = await handler.handleAnalyzeCommand(
        'invalid-url',
        'user1',
        'channel1'
      );

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('명령어 오류');
      expect(result.text).toContain('GitHub URL is required');
      expect(result.text).toContain('Invalid GitHub URL format');
      expect(result.text).toContain('/analyze-repo help');
    });

    test('should handle option validation errors', async () => {
      const parsedCommand = {
        githubUrl: 'https://github.com/owner/repo/issues/123',
        options: { depth: 0, type: 'invalid' as any },
        isValid: false,
        errors: ['Depth must be between 1 and 50', 'Invalid type. Must be "issue" or "pr"'],
      };

      mockParser.parseCommand.mockReturnValue(parsedCommand);

      const result = await handler.handleAnalyzeCommand(
        'https://github.com/owner/repo/issues/123 --depth=0 --type=invalid',
        'user1',
        'channel1'
      );

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('Depth must be between 1 and 50');
      expect(result.text).toContain('Invalid type. Must be "issue" or "pr"');
    });
  });

  describe('Message Generation', () => {
    test('should generate help message', () => {
      const result = handler.generateHelpMessage();

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('/analyze-repo 사용법');
      expect(result.text).toContain('기본 사용:');
      expect(result.text).toContain('옵션:');
      expect(result.text).toContain('예시:');
      expect(result.text).toContain('--type issue|pr');
      expect(result.text).toContain('--depth');
      expect(result.text).toContain('--format markdown|json');
      expect(result.text).toContain('--include-tests');
    });

    test('should generate error message', () => {
      const errors = ['GitHub URL is required', 'Invalid format'];
      const result = handler.generateErrorMessage(errors);

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('명령어 오류');
      expect(result.text).toContain('• GitHub URL is required');
      expect(result.text).toContain('• Invalid format');
      expect(result.text).toContain('/analyze-repo help');
    });

    test('should generate success message with all options', () => {
      const request = {
        id: 'req-123',
        userId: 'user1',
        channelId: 'channel1',
        githubUrl: 'https://github.com/owner/repo/pull/456',
        options: {
          type: 'pr' as const,
          depth: 5,
          format: 'json' as const,
          includeTests: true,
        },
        status: 'pending' as const,
        createdAt: new Date(),
      };

      mockParser.parseGitHubUrl.mockReturnValue({
        owner: 'owner',
        repo: 'repo',
        type: 'pr',
        number: 456,
      });

      const result = handler.generateSuccessMessage(request);

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('GitHub 분석을 시작합니다');
      expect(result.text).toContain('owner/repo');
      expect(result.text).toContain('pr #456');
      expect(result.text).toContain('--type=pr');
      expect(result.text).toContain('--depth=5');
      expect(result.text).toContain('--format=json');
      expect(result.text).toContain('--include-tests');
    });

    test('should generate success message with minimal options', () => {
      const request = {
        id: 'req-123',
        userId: 'user1',
        channelId: 'channel1',
        githubUrl: 'https://github.com/owner/repo/issues/123',
        options: {},
        status: 'pending' as const,
        createdAt: new Date(),
      };

      mockParser.parseGitHubUrl.mockReturnValue({
        owner: 'owner',
        repo: 'repo',
        type: 'issue',
        number: 123,
      });

      const result = handler.generateSuccessMessage(request);

      expect(result.text).toContain('owner/repo');
      expect(result.text).toContain('issue #123');
      expect(result.text).not.toContain('Options:');
    });

    test('should handle invalid GitHub URL in success message', () => {
      const request = {
        id: 'req-123',
        userId: 'user1',
        channelId: 'channel1',
        githubUrl: 'https://invalid-url.com/test',
        options: {},
        status: 'pending' as const,
        createdAt: new Date(),
      };

      mockParser.parseGitHubUrl.mockReturnValue(null);

      const result = handler.generateSuccessMessage(request);

      expect(result.text).toContain('https://invalid-url.com/test');
      expect(result.text).toContain('repository');
    });
  });

  describe('Integration with Real Dependencies', () => {
    test('should work with real CommandParser and AnalysisRequestManager', async () => {
      const realParser = new CommandParser();
      const realRequestManager = new AnalysisRequestManager();
      const realHandler = new SlackCommandHandler(realParser, realRequestManager);

      const result = await realHandler.handleAnalyzeCommand(
        'https://github.com/owner/repo/issues/123 --depth=5',
        'user1',
        'channel1'
      );

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toContain('GitHub 분석을 시작합니다');
      expect(result.text).toContain('owner/repo');
      expect(result.text).toContain('issue #123');
      expect(result.text).toContain('--depth=5');

      // Verify request was created
      const requests = realRequestManager.getUserRequests('user1');
      expect(requests).toHaveLength(1);
      expect(requests[0]?.githubUrl).toBe('https://github.com/owner/repo/issues/123');
      expect(requests[0]?.options.depth).toBe(5);
    });

    test('should handle help with real dependencies', async () => {
      const realParser = new CommandParser();
      const realRequestManager = new AnalysisRequestManager();
      const realHandler = new SlackCommandHandler(realParser, realRequestManager);

      const result = await realHandler.handleAnalyzeCommand('help', 'user1', 'channel1');

      expect(result.text).toContain('/analyze-repo 사용법');

      // Verify no request was created for help
      const requests = realRequestManager.getUserRequests('user1');
      expect(requests).toHaveLength(0);
    });

    test('should handle errors with real dependencies', async () => {
      const realParser = new CommandParser();
      const realRequestManager = new AnalysisRequestManager();
      const realHandler = new SlackCommandHandler(realParser, realRequestManager);

      const result = await realHandler.handleAnalyzeCommand(
        'invalid-url --depth=invalid',
        'user1',
        'channel1'
      );

      expect(result.text).toContain('명령어 오류');

      // Verify no request was created for invalid command
      const requests = realRequestManager.getUserRequests('user1');
      expect(requests).toHaveLength(0);
    });
  });
});