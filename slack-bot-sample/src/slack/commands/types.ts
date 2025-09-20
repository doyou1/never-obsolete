export interface CommandOptions {
  type?: 'issue' | 'pr';
  depth?: number;
  format?: 'markdown' | 'json';
  includeTests?: boolean;
}

export interface ParsedCommand {
  githubUrl: string;
  options: CommandOptions;
  isValid: boolean;
  errors: string[];
}

export interface AnalysisRequest {
  id: string;
  userId: string;
  channelId: string;
  githubUrl: string;
  options: CommandOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date | undefined;
  error?: string | undefined;
}

export interface SlackResponse {
  response_type: 'ephemeral' | 'in_channel';
  text: string;
  blocks?: any[];
  thread_ts?: string | undefined;
}

export interface GitHubUrlInfo {
  owner: string;
  repo: string;
  type: 'issue' | 'pr';
  number: number;
}

export interface ICommandParser {
  parseCommand(text: string): ParsedCommand;
  parseGitHubUrl(url: string): GitHubUrlInfo | null;
  parseOptions(optionsText: string): CommandOptions;
  validateOptions(options: CommandOptions): string[];
}

export interface IAnalysisRequestManager {
  createRequest(
    userId: string,
    channelId: string,
    githubUrl: string,
    options: CommandOptions
  ): AnalysisRequest;
  updateStatus(requestId: string, status: AnalysisRequest['status'], error?: string): void;
  getRequest(requestId: string): AnalysisRequest | null;
  getUserRequests(userId: string): AnalysisRequest[];
  getRequestsByStatus(status: AnalysisRequest['status']): AnalysisRequest[];
}

export interface ISlackCommandHandler {
  handleAnalyzeCommand(text: string, userId: string, channelId: string): Promise<SlackResponse>;
  generateHelpMessage(): SlackResponse;
  generateErrorMessage(errors: string[]): SlackResponse;
  generateSuccessMessage(request: AnalysisRequest): SlackResponse;
}