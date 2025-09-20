import {
  GitHubError,
  GitHubAuthenticationError,
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubNetworkError,
  GitHubValidationError,
} from '../errors';

export class GitHubErrorMapper {
  static mapOctokitError(error: any): GitHubError {
    if (error.status === 401) {
      return new GitHubAuthenticationError('GitHub authentication failed');
    }

    if (error.status === 404) {
      return new GitHubNotFoundError('GitHub resource not found');
    }

    if (error.status === 403) {
      const resetTime = error.response?.headers?.['x-ratelimit-reset'] ||
                       Math.floor(Date.now() / 1000) + 3600; // Default to 1 hour from now
      return new GitHubRateLimitError(parseInt(resetTime.toString()), 'GitHub API rate limit exceeded');
    }

    if (error.status === 422) {
      return new GitHubValidationError('GitHub API validation error');
    }

    if (error.status >= 500) {
      return new GitHubNetworkError('GitHub API server error');
    }

    return new GitHubNetworkError('GitHub API network error');
  }

  static isTemporaryError(error: any): boolean {
    return error.status >= 500 || error.status === 429;
  }

  static getRetryDelay(error: any): number {
    // Return delay in milliseconds
    if (error.status === 429) {
      return 60000; // 1 minute for rate limit
    }
    if (error.status >= 500) {
      return 5000; // 5 seconds for server errors
    }
    return 0; // No retry for other errors
  }
}