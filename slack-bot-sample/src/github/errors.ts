// GitHub API 관련 에러 클래스들

export class GitHubError extends Error {
  public statusCode: number | undefined;
  public code: string;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class GitHubAuthenticationError extends GitHubError {
  constructor(message: string = 'GitHub authentication failed') {
    super(message, 'GITHUB_AUTH_ERROR', 401);
  }
}

export class GitHubRateLimitError extends GitHubError {
  public resetDate: Date;
  public retryAfter: number;

  constructor(resetTime: number, message?: string) {
    const resetDate = new Date(resetTime * 1000);
    const retryAfter = Math.ceil((resetDate.getTime() - Date.now()) / 1000);

    super(
      message || `Rate limit exceeded. Try again after ${retryAfter} seconds`,
      'GITHUB_RATE_LIMIT_ERROR',
      403,
    );

    this.resetDate = resetDate;
    this.retryAfter = retryAfter;
  }
}

export class GitHubNetworkError extends GitHubError {
  constructor(message: string = 'Network error occurred while calling GitHub API') {
    super(message, 'GITHUB_NETWORK_ERROR', 0);
  }
}

export class GitHubNotFoundError extends GitHubError {
  constructor(message: string = 'GitHub resource not found') {
    super(message, 'GITHUB_NOT_FOUND_ERROR', 404);
  }
}

export class GitHubValidationError extends GitHubError {
  constructor(message: string) {
    super(message, 'GITHUB_VALIDATION_ERROR', 400);
  }
}

export class GitHubPermissionError extends GitHubError {
  constructor(message: string = 'Insufficient permissions for GitHub resource') {
    super(message, 'GITHUB_PERMISSION_ERROR', 403);
  }
}
