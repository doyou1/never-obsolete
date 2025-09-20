import {
  mockUserResponse,
  mockRateLimitResponse,
  mockIssueResponse,
  mockPullRequestResponse,
  mockCommitsResponse,
  mockFilesResponse,
  mockFileContentResponse,
} from '../mocks/github-responses';

export class GitHubClientTestHelper {
  static createMockOctokit() {
    return {
      rest: {
        users: {
          getAuthenticated: jest.fn(),
        },
        rateLimit: {
          get: jest.fn(),
        },
        issues: {
          get: jest.fn(),
        },
        pulls: {
          get: jest.fn(),
          listCommits: jest.fn(),
          listFiles: jest.fn(),
        },
        repos: {
          getContent: jest.fn(),
        },
      },
    };
  }

  static setupSuccessfulMocks(mockOctokit: any) {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue(mockUserResponse);
    mockOctokit.rest.rateLimit.get.mockResolvedValue(mockRateLimitResponse);
    mockOctokit.rest.issues.get.mockResolvedValue(mockIssueResponse);
    mockOctokit.rest.pulls.get.mockResolvedValue(mockPullRequestResponse);
    mockOctokit.rest.pulls.listCommits.mockResolvedValue(mockCommitsResponse);
    mockOctokit.rest.pulls.listFiles.mockResolvedValue(mockFilesResponse);
    mockOctokit.rest.repos.getContent.mockResolvedValue(mockFileContentResponse);
  }

  static setupErrorMocks(mockOctokit: any, errorType: 'auth' | 'notFound' | 'rateLimit' | 'network') {
    const errorResponse = this.getErrorResponse(errorType);

    // Apply error to all methods
    Object.values(mockOctokit.rest).forEach((service: any) => {
      Object.values(service).forEach((method: any) => {
        if (jest.isMockFunction(method)) {
          method.mockRejectedValue(errorResponse);
        }
      });
    });
  }

  private static getErrorResponse(errorType: string) {
    switch (errorType) {
      case 'auth':
        return { status: 401, message: 'Bad credentials' };
      case 'notFound':
        return { status: 404, message: 'Not Found' };
      case 'rateLimit':
        return { status: 403, message: 'API rate limit exceeded' };
      case 'network':
        return { status: 500, message: 'Internal Server Error' };
      default:
        return { status: 500, message: 'Unknown error' };
    }
  }
}