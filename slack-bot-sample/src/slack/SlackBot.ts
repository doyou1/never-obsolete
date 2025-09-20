import { App } from '@slack/bolt';
import { slackConfig, validateSlackConfig } from './config';
import { workspaceAuthMiddleware } from './middleware/WorkspaceAuth';

export class SlackBot {
  private app: App;
  private isStarted: boolean = false;

  constructor() {
    validateSlackConfig();

    this.app = new App({
      token: slackConfig.token,
      signingSecret: slackConfig.signingSecret,
      appToken: slackConfig.appToken,
      socketMode: slackConfig.socketMode,
      port: slackConfig.port,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Apply workspace authentication middleware
    this.app.use(workspaceAuthMiddleware());
  }

  private setupEventHandlers(): void {
    // Basic ping-pong command
    this.app.message(/^ping$/i, async ({ message, say }) => {
      const user = 'user' in message ? message.user : 'unknown';
      console.log(`Ping received from user ${user}`);
      await say({
        text: 'pong',
        thread_ts: message.ts,
      });
    });

    // App mention handler
    this.app.event('app_mention', async ({ event, say }) => {
      console.log(`App mentioned by user ${event.user}`);
      await say({
        text: `Hello <@${event.user}>! I'm the GitHub Source Flow Analysis Bot. Use \`/analyze-repo\` to get started.`,
        channel: event.channel,
        thread_ts: event.ts,
      });
    });

    // Health check message
    this.app.message(/^health$/i, async ({ message, say }) => {
      await say({
        text: '✅ Bot is running and healthy!',
        thread_ts: message.ts,
      });
    });

    // Global error handler
    this.app.error(async error => {
      console.error('Slack Bot Error:', error);
    });
  }

  public async start(): Promise<void> {
    if (this.isStarted) {
      console.log('Slack Bot is already running');
      return;
    }

    try {
      await this.app.start();
      this.isStarted = true;
      console.log('🤖 Slack Bot is running!');
      console.log(`📡 Socket mode: ${slackConfig.socketMode}`);
      console.log(`🔐 Allowed workspaces: ${slackConfig.allowedWorkspaces.join(', ') || 'All'}`);
    } catch (error) {
      console.error('Failed to start Slack Bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isStarted) {
      console.log('Slack Bot is not running');
      return;
    }

    try {
      await this.app.stop();
      this.isStarted = false;
      console.log('🛑 Slack Bot stopped');
    } catch (error) {
      console.error('Failed to stop Slack Bot:', error);
      throw error;
    }
  }

  public getApp(): App {
    return this.app;
  }

  public isRunning(): boolean {
    return this.isStarted;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const authResult = await this.app.client.auth.test();
      console.log('✅ Slack connection test successful');
      console.log(`Bot User ID: ${authResult.user_id}`);
      console.log(`Team ID: ${authResult.team_id}`);
      console.log(`Team Name: ${authResult.team}`);
      return true;
    } catch (error) {
      console.error('❌ Slack connection test failed:', error);
      return false;
    }
  }

  public async validatePermissions(): Promise<boolean> {
    try {
      const authResult = await this.app.client.auth.test();

      // Check if bot has required scopes
      const requiredScopes = ['commands', 'chat:write', 'channels:read', 'users:read'];
      const botScopes = authResult.response_metadata?.scopes || [];

      const missingScopes = requiredScopes.filter(scope => !botScopes.includes(scope));

      if (missingScopes.length > 0) {
        console.error('❌ Missing required bot scopes:', missingScopes);
        return false;
      }

      console.log('✅ All required permissions validated');
      return true;
    } catch (error) {
      console.error('❌ Permission validation failed:', error);
      return false;
    }
  }
}
