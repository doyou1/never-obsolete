import { SlackBot } from '../SlackBot';

// Mock environment variables
process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
process.env.SLACK_APP_TOKEN = 'xapp-test-app-token';
process.env.ALLOWED_WORKSPACES = 'T1234567890,T0987654321';

// Mock @slack/bolt
jest.mock('@slack/bolt', () => ({
  App: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    use: jest.fn(),
    message: jest.fn(),
    event: jest.fn(),
    error: jest.fn(),
    client: {
      auth: {
        test: jest.fn().mockResolvedValue({
          ok: true,
          user_id: 'U1234567890',
          team_id: 'T1234567890',
          team: 'Test Team',
          response_metadata: {
            scopes: ['commands', 'chat:write', 'channels:read', 'users:read'],
          },
        }),
      },
    },
  })),
}));

describe('SlackBot', () => {
  let slackBot: SlackBot;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Creation and Initialization', () => {
    test('should create SlackBot instance', () => {
      slackBot = new SlackBot();
      expect(slackBot).toBeInstanceOf(SlackBot);
    });

    test('should initialize with proper configuration', () => {
      slackBot = new SlackBot();
      expect(slackBot.getApp()).toBeDefined();
      expect(slackBot.isRunning()).toBe(false);
    });

    test('should throw error with missing environment variables', () => {
      const originalToken = process.env.SLACK_BOT_TOKEN;
      delete process.env.SLACK_BOT_TOKEN;

      expect(() => new SlackBot()).toThrow('Missing required environment variable: SLACK_BOT_TOKEN');

      process.env.SLACK_BOT_TOKEN = originalToken;
    });
  });

  describe('Bot Lifecycle', () => {
    beforeEach(() => {
      slackBot = new SlackBot();
    });

    test('should start successfully', async () => {
      await slackBot.start();
      expect(slackBot.isRunning()).toBe(true);
    });

    test('should not start if already running', async () => {
      await slackBot.start();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await slackBot.start(); // Second start
      expect(consoleSpy).toHaveBeenCalledWith('Slack Bot is already running');

      consoleSpy.mockRestore();
    });

    test('should stop successfully', async () => {
      await slackBot.start();
      await slackBot.stop();
      expect(slackBot.isRunning()).toBe(false);
    });

    test('should handle stop when not running', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await slackBot.stop();
      expect(consoleSpy).toHaveBeenCalledWith('Slack Bot is not running');

      consoleSpy.mockRestore();
    });
  });

  describe('Connection Testing', () => {
    beforeEach(() => {
      slackBot = new SlackBot();
    });

    test('should test connection successfully', async () => {
      const result = await slackBot.testConnection();
      expect(result).toBe(true);
    });

    test('should handle connection test failure', async () => {
      const mockApp = slackBot.getApp();
      mockApp.client.auth.test = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await slackBot.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('Permission Validation', () => {
    beforeEach(() => {
      slackBot = new SlackBot();
    });

    test('should validate permissions successfully', async () => {
      const result = await slackBot.validatePermissions();
      expect(result).toBe(true);
    });

    test('should detect missing permissions', async () => {
      const mockApp = slackBot.getApp();
      mockApp.client.auth.test = jest.fn().mockResolvedValue({
        ok: true,
        user_id: 'U1234567890',
        team_id: 'T1234567890',
        team: 'Test Team',
        response_metadata: {
          scopes: ['chat:write'], // Missing required scopes
        },
      });

      const result = await slackBot.validatePermissions();
      expect(result).toBe(false);
    });

    test('should handle permission validation failure', async () => {
      const mockApp = slackBot.getApp();
      mockApp.client.auth.test = jest.fn().mockRejectedValue(new Error('Permission check failed'));

      const result = await slackBot.validatePermissions();
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle start error', async () => {
      slackBot = new SlackBot();
      const mockApp = slackBot.getApp();
      mockApp.start = jest.fn().mockRejectedValue(new Error('Start failed'));

      await expect(slackBot.start()).rejects.toThrow('Start failed');
      expect(slackBot.isRunning()).toBe(false);
    });

    test('should handle stop error', async () => {
      slackBot = new SlackBot();
      await slackBot.start();

      const mockApp = slackBot.getApp();
      mockApp.stop = jest.fn().mockRejectedValue(new Error('Stop failed'));

      await expect(slackBot.stop()).rejects.toThrow('Stop failed');
    });
  });

  describe('Event Handlers Setup', () => {
    test('should setup message handlers', () => {
      slackBot = new SlackBot();
      const mockApp = slackBot.getApp();

      expect(mockApp.message).toHaveBeenCalledWith(/^ping$/i, expect.any(Function));
      expect(mockApp.message).toHaveBeenCalledWith(/^health$/i, expect.any(Function));
    });

    test('should setup app mention handler', () => {
      slackBot = new SlackBot();
      const mockApp = slackBot.getApp();

      expect(mockApp.event).toHaveBeenCalledWith('app_mention', expect.any(Function));
    });

    test('should setup error handler', () => {
      slackBot = new SlackBot();
      const mockApp = slackBot.getApp();

      expect(mockApp.error).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should setup middleware', () => {
      slackBot = new SlackBot();
      const mockApp = slackBot.getApp();

      expect(mockApp.use).toHaveBeenCalled();
    });
  });
});