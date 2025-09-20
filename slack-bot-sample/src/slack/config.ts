export interface SlackConfig {
  token: string;
  signingSecret: string;
  appToken: string;
  socketMode: boolean;
  allowedWorkspaces: string[];
  port: number;
}

export const slackConfig: SlackConfig = {
  token: process.env.SLACK_BOT_TOKEN || '',
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  appToken: process.env.SLACK_APP_TOKEN || '',
  socketMode: true, // For development
  allowedWorkspaces: (process.env.ALLOWED_WORKSPACES || '').split(',').filter(Boolean),
  port: parseInt(process.env.SLACK_PORT || '3001', 10),
};

export function validateSlackConfig(): void {
  const requiredEnvVars = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  if (slackConfig.allowedWorkspaces.length === 0) {
    console.warn(
      'Warning: No allowed workspaces specified. Bot will accept all workspace connections.',
    );
  }
}
