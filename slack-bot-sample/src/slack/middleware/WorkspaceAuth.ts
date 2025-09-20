import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';
import { slackConfig } from '../config';

export function workspaceAuthMiddleware(): Middleware<AnyMiddlewareArgs> {
  return async ({ context, next }) => {
    const teamId = context?.teamId;

    // Skip workspace validation if no allowed workspaces are configured
    if (slackConfig.allowedWorkspaces.length === 0) {
      console.warn(`Workspace auth: No restrictions configured, allowing team ${teamId}`);
      await next();
      return;
    }

    // Check if the workspace is in the allowed list
    if (!teamId || !slackConfig.allowedWorkspaces.includes(teamId)) {
      console.error(`Unauthorized workspace access attempt: ${teamId}`);
      return; // Block the request
    }

    console.log(`Authorized workspace access: ${teamId}`);
    await next();
  };
}

export function isWorkspaceAllowed(teamId: string): boolean {
  // Allow all workspaces if no restrictions are configured
  if (slackConfig.allowedWorkspaces.length === 0) {
    return true;
  }

  return slackConfig.allowedWorkspaces.includes(teamId);
}