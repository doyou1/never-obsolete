import { CodeAnalysisEngine } from '../CodeAnalysisEngine';
import { AnalysisContext, AnalysisOptions } from '../types';
import { Repository, Issue, PullRequest, FileContent } from '../../github/types';

describe('CodeAnalysisEngine', () => {
  let engine: CodeAnalysisEngine;

  beforeEach(() => {
    engine = new CodeAnalysisEngine();
  });

  describe('Issue 분석', () => {
    test('간단한 버그 리포트 분석', async () => {
      const repository: Repository = {
        id: 1,
        name: 'test-repo',
        fullName: 'owner/test-repo',
        description: 'Test repository',
        language: 'JavaScript',
        starCount: 100,
        forkCount: 20,
        topics: ['testing'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 1000
      };

      const issue: Issue = {
        id: 1,
        number: 123,
        title: 'Button click not working',
        body: 'When I click the submit button, nothing happens. Expected: form should submit.',
        state: 'open',
        labels: [{ id: 1, name: 'bug', color: 'red', description: 'Bug report' }],
        assignees: [],
        author: { id: 1, login: 'user1', name: 'User One', email: null, avatarUrl: 'url', type: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        url: 'https://github.com/owner/test-repo/issues/123'
      };

      const files: FileContent[] = [{
        name: 'button.js',
        path: 'src/components/button.js',
        content: `
function submitButton() {
  const button = document.getElementById('submit');
  button.addEventListener('click', function(e) {
    // TODO: Implement form submission
    console.log('Button clicked');
  });
}`,
        encoding: 'utf-8',
        size: 200,
        sha: 'btn123',
        url: 'https://example.com/button.js'
      }];

      const context: AnalysisContext = {
        repository,
        target: issue,
        files,
        options: {
          depth: 5,
          includeTests: true,
          includeDependencies: false,
          includeSecurityCheck: false,
          includePerformanceCheck: false
        }
      };

      const result = await engine.analyzeIssue(context);

      expect(result.type).toBe('issue');
      expect(result.status).toBe('completed');
      expect(result.summary).toBeDefined();
      expect(result.summary.complexity).toMatch(/^(low|medium|high)$/);
      expect(result.summary.impact).toMatch(/^(minor|moderate|major)$/);
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.issueClassification).toBeDefined();
      expect(result.issueClassification.type).toBe('bug');
      expect(result.relatedFiles).toContain('src/components/button.js');
    });

    test('기능 요청 분석', async () => {
      const repository: Repository = {
        id: 2,
        name: 'feature-repo',
        fullName: 'owner/feature-repo',
        description: 'Feature repository',
        language: 'TypeScript',
        starCount: 50,
        forkCount: 10,
        topics: ['feature'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 2000
      };

      const issue: Issue = {
        id: 2,
        number: 456,
        title: 'Add dark mode support',
        body: 'We need to add dark mode support to the application. This should include theme switching and persistent user preference.',
        state: 'open',
        labels: [{ id: 2, name: 'enhancement', color: 'green', description: 'New feature' }],
        assignees: [],
        author: { id: 2, login: 'user2', name: 'User Two', email: null, avatarUrl: 'url', type: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        url: 'https://github.com/owner/feature-repo/issues/456'
      };

      const files: FileContent[] = [
        {
          name: 'theme.css',
          path: 'src/styles/theme.css',
          content: `
.light-theme {
  background-color: white;
  color: black;
}

/* Dark theme styles needed */`,
          encoding: 'utf-8',
          size: 100,
          sha: 'theme123',
          url: 'https://example.com/theme.css'
        },
        {
          name: 'app.js',
          path: 'src/app.js',
          content: `
function initializeApp() {
  // Theme initialization needed
  loadTheme();
}

function loadTheme() {
  // TODO: Implement theme loading
}`,
          encoding: 'utf-8',
          size: 150,
          sha: 'app123',
          url: 'https://example.com/app.js'
        }
      ];

      const context: AnalysisContext = {
        repository,
        target: issue,
        files,
        options: {
          depth: 7,
          includeTests: true,
          includeDependencies: true,
          includeSecurityCheck: false,
          includePerformanceCheck: true
        }
      };

      const result = await engine.analyzeIssue(context);

      expect(result.issueClassification.type).toBe('feature');
      expect(result.summary.complexity).toBeDefined();
      expect(result.estimatedEffort).toBeDefined();
      expect(result.estimatedEffort.storyPoints).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('복잡한 아키텍처 이슈 분석', async () => {
      const repository: Repository = {
        id: 3,
        name: 'complex-repo',
        fullName: 'owner/complex-repo',
        description: 'Complex architecture repository',
        language: 'Java',
        starCount: 500,
        forkCount: 100,
        topics: ['architecture', 'microservices'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 10000
      };

      const issue: Issue = {
        id: 3,
        number: 789,
        title: 'Service dependency circular reference',
        body: 'UserService and OrderService have circular dependency causing initialization issues in the microservice architecture.',
        state: 'open',
        labels: [
          { id: 3, name: 'architecture', color: 'blue', description: 'Architecture issue' },
          { id: 4, name: 'critical', color: 'red', description: 'Critical priority' }
        ],
        assignees: [],
        author: { id: 3, login: 'architect', name: 'Lead Architect', email: null, avatarUrl: 'url', type: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        url: 'https://github.com/owner/complex-repo/issues/789'
      };

      const files: FileContent[] = [
        {
          name: 'UserService.java',
          path: 'src/main/java/services/UserService.java',
          content: `
@Service
public class UserService {
    @Autowired
    private OrderService orderService;

    public User getUserById(Long id) {
        User user = userRepository.findById(id);
        user.setOrders(orderService.getOrdersByUserId(id));
        return user;
    }
}`,
          encoding: 'utf-8',
          size: 300,
          sha: 'user123',
          url: 'https://example.com/UserService.java'
        },
        {
          name: 'OrderService.java',
          path: 'src/main/java/services/OrderService.java',
          content: `
@Service
public class OrderService {
    @Autowired
    private UserService userService;

    public List<Order> getOrdersByUserId(Long userId) {
        User user = userService.getUserById(userId);
        return orderRepository.findByUser(user);
    }
}`,
          encoding: 'utf-8',
          size: 300,
          sha: 'order123',
          url: 'https://example.com/OrderService.java'
        }
      ];

      const context: AnalysisContext = {
        repository,
        target: issue,
        files,
        options: {
          depth: 10,
          includeTests: true,
          includeDependencies: true,
          includeSecurityCheck: true,
          includePerformanceCheck: true
        }
      };

      const result = await engine.analyzeIssue(context);

      expect(result.issueClassification.severity).toBe('critical');
      expect(result.summary.riskLevel).toBe('high');
      expect(result.insights.some(i => i.category === 'architecture')).toBe(true);
      expect(result.recommendations.some(r => r.category.includes('dependency'))).toBe(true);
    });
  });

  describe('Pull Request 분석', () => {
    test('작은 버그 수정 PR 분석', async () => {
      const repository: Repository = {
        id: 4,
        name: 'bugfix-repo',
        fullName: 'owner/bugfix-repo',
        description: 'Bug fix repository',
        language: 'Python',
        starCount: 200,
        forkCount: 50,
        topics: ['python', 'web'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 3000
      };

      const pullRequest: PullRequest = {
        id: 4,
        number: 101,
        title: 'Fix null pointer exception in user validation',
        body: 'Fixed the null pointer exception that occurs when user email is None.',
        state: 'open',
        labels: [{ id: 5, name: 'bugfix', color: 'red', description: 'Bug fix' }],
        assignees: [],
        author: { id: 4, login: 'developer', name: 'Dev User', email: null, avatarUrl: 'url', type: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        url: 'https://github.com/owner/bugfix-repo/pull/101',
        headBranch: 'fix/null-pointer',
        baseBranch: 'main',
        commits: 1,
        additions: 5,
        deletions: 2,
        changedFiles: 1,
        mergeable: true,
        merged: false,
        mergedAt: null,
        mergedBy: null,
        draft: false
      };

      const files: FileContent[] = [{
        name: 'user_validator.py',
        path: 'src/validators/user_validator.py',
        content: `
def validate_user(user):
    if user is None:
        return False

    # Fixed: Check if email is not None before accessing
    if user.email is not None and '@' not in user.email:
        return False

    return True`,
        encoding: 'utf-8',
        size: 200,
        sha: 'validator123',
        url: 'https://example.com/user_validator.py'
      }];

      const context: AnalysisContext = {
        repository,
        target: pullRequest,
        files,
        options: {
          depth: 5,
          includeTests: true,
          includeDependencies: false,
          includeSecurityCheck: true,
          includePerformanceCheck: false
        }
      };

      const result = await engine.analyzePullRequest(context);

      expect(result.type).toBe('pullrequest');
      expect(result.changeAnalysis).toBeDefined();
      expect(result.changeAnalysis.changeType).toBe('bugfix');
      expect(result.changeAnalysis.impactScope).toBe('local');
      expect(result.changeAnalysis.riskLevel).toBe('low');
      expect(result.reviewSuggestions).toBeDefined();
      expect(result.testingRecommendations).toBeDefined();
    });

    test('대규모 리팩토링 PR 분석', async () => {
      const repository: Repository = {
        id: 5,
        name: 'refactor-repo',
        fullName: 'owner/refactor-repo',
        description: 'Refactoring repository',
        language: 'TypeScript',
        starCount: 300,
        forkCount: 75,
        topics: ['typescript', 'refactor'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 5000
      };

      const pullRequest: PullRequest = {
        id: 5,
        number: 202,
        title: 'Refactor authentication system to use dependency injection',
        body: 'Major refactoring of the authentication system to improve testability and maintainability using dependency injection pattern.',
        state: 'open',
        labels: [
          { id: 6, name: 'refactor', color: 'blue', description: 'Code refactoring' },
          { id: 7, name: 'breaking-change', color: 'orange', description: 'Breaking change' }
        ],
        assignees: [],
        author: { id: 5, login: 'senior-dev', name: 'Senior Developer', email: null, avatarUrl: 'url', type: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        url: 'https://github.com/owner/refactor-repo/pull/202',
        headBranch: 'refactor/auth-di',
        baseBranch: 'main',
        commits: 15,
        additions: 500,
        deletions: 300,
        changedFiles: 12,
        mergeable: true,
        merged: false,
        mergedAt: null,
        mergedBy: null,
        draft: false
      };

      const files: FileContent[] = [
        {
          name: 'AuthService.ts',
          path: 'src/services/AuthService.ts',
          content: `
interface IAuthService {
  authenticate(token: string): Promise<User>;
  authorize(user: User, resource: string): boolean;
}

export class AuthService implements IAuthService {
  constructor(
    private tokenValidator: ITokenValidator,
    private userRepository: IUserRepository
  ) {}

  async authenticate(token: string): Promise<User> {
    const isValid = await this.tokenValidator.validate(token);
    if (!isValid) {
      throw new Error('Invalid token');
    }
    return this.userRepository.findByToken(token);
  }

  authorize(user: User, resource: string): boolean {
    return user.permissions.includes(resource);
  }
}`,
          encoding: 'utf-8',
          size: 600,
          sha: 'auth123',
          url: 'https://example.com/AuthService.ts'
        }
      ];

      const context: AnalysisContext = {
        repository,
        target: pullRequest,
        files,
        options: {
          depth: 8,
          includeTests: true,
          includeDependencies: true,
          includeSecurityCheck: true,
          includePerformanceCheck: true
        }
      };

      const result = await engine.analyzePullRequest(context);

      expect(result.changeAnalysis.changeType).toBe('refactor');
      expect(result.changeAnalysis.impactScope).toBe('system');
      expect(result.changeAnalysis.backwardCompatibility).toBe(false);
      expect(result.deploymentRisks.length).toBeGreaterThan(0);
      expect(result.deploymentRisks.some(r => r.category === 'breaking_change')).toBe(true);
    });

    test('보안 패치 PR 분석', async () => {
      const repository: Repository = {
        id: 6,
        name: 'security-repo',
        fullName: 'owner/security-repo',
        description: 'Security patch repository',
        language: 'JavaScript',
        starCount: 150,
        forkCount: 30,
        topics: ['security', 'web'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 2000
      };

      const pullRequest: PullRequest = {
        id: 6,
        number: 303,
        title: 'Fix SQL injection vulnerability in user search',
        body: 'Replaced string concatenation with parameterized queries to prevent SQL injection attacks.',
        state: 'open',
        labels: [
          { id: 8, name: 'security', color: 'red', description: 'Security fix' },
          { id: 9, name: 'urgent', color: 'red', description: 'Urgent priority' }
        ],
        assignees: [],
        author: { id: 6, login: 'security-expert', name: 'Security Expert', email: null, avatarUrl: 'url', type: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        url: 'https://github.com/owner/security-repo/pull/303',
        headBranch: 'security/sql-injection-fix',
        baseBranch: 'main',
        commits: 2,
        additions: 10,
        deletions: 5,
        changedFiles: 2,
        mergeable: true,
        merged: false,
        mergedAt: null,
        mergedBy: null,
        draft: false
      };

      const files: FileContent[] = [{
        name: 'userService.js',
        path: 'src/services/userService.js',
        content: `
const db = require('../database');

class UserService {
  // Fixed: Use parameterized query instead of string concatenation
  async searchUsers(query) {
    const sql = 'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?';
    const params = [\`%\${query}%\`, \`%\${query}%\`];
    return db.query(sql, params);
  }
}

module.exports = UserService;`,
        encoding: 'utf-8',
        size: 300,
        sha: 'usersvc123',
        url: 'https://example.com/userService.js'
      }];

      const context: AnalysisContext = {
        repository,
        target: pullRequest,
        files,
        options: {
          depth: 6,
          includeTests: true,
          includeDependencies: false,
          includeSecurityCheck: true,
          includePerformanceCheck: false
        }
      };

      const result = await engine.analyzePullRequest(context);

      expect(result.changeAnalysis.changeType).toBe('security');
      expect(result.insights.some(i => i.category === 'security')).toBe(true);
      expect(result.reviewSuggestions.some(s => s.category === 'security')).toBe(true);
      expect(result.testingRecommendations.some(t => t.type === 'security')).toBe(true);
    });
  });

  describe('Repository 전체 분석', () => {
    test('소규모 프로젝트 분석', async () => {
      const repository: Repository = {
        id: 7,
        name: 'small-project',
        fullName: 'owner/small-project',
        description: 'Small project for testing',
        language: 'JavaScript',
        starCount: 10,
        forkCount: 5,
        topics: ['small', 'test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 500
      };

      const options: AnalysisOptions = {
        depth: 5,
        includeTests: true,
        includeDependencies: true,
        includeSecurityCheck: true,
        includePerformanceCheck: true
      };

      const result = await engine.analyzeRepository(repository, options);

      expect(result.type).toBe('repository');
      expect(result.architectureOverview).toBeDefined();
      expect(result.technicalDebtAnalysis).toBeDefined();
      expect(result.securityAssessment).toBeDefined();
      expect(result.improvementRoadmap).toBeDefined();
      expect(result.architectureOverview.layers.length).toBeGreaterThanOrEqual(0);
      expect(result.technicalDebtAnalysis.totalDebt.score).toBeGreaterThanOrEqual(0);
      expect(result.improvementRoadmap.quickWins).toBeDefined();
    });

    test('다국어 프로젝트 분석', async () => {
      const repository: Repository = {
        id: 8,
        name: 'multilang-project',
        fullName: 'owner/multilang-project',
        description: 'Multi-language project',
        language: 'TypeScript',
        starCount: 100,
        forkCount: 25,
        topics: ['multilang', 'fullstack'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 5000
      };

      const options: AnalysisOptions = {
        depth: 8,
        includeTests: true,
        includeDependencies: true,
        includeSecurityCheck: true,
        includePerformanceCheck: true
      };

      const result = await engine.analyzeRepository(repository, options);

      expect(result.architectureOverview.dependencies.nodes.length).toBeGreaterThan(0);
      expect(result.securityAssessment.overallRisk).toMatch(/^(low|medium|high|critical)$/);
      expect(result.improvementRoadmap.phases.length).toBeGreaterThan(0);
    });
  });

  describe('에러 처리', () => {
    test('빈 파일 목록 처리', async () => {
      const repository: Repository = {
        id: 9,
        name: 'empty-repo',
        fullName: 'owner/empty-repo',
        description: 'Empty repository',
        language: null,
        starCount: 0,
        forkCount: 0,
        topics: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 0
      };

      const issue: Issue = {
        id: 9,
        number: 1,
        title: 'Test issue',
        body: 'Test issue body',
        state: 'open',
        labels: [],
        assignees: [],
        author: { id: 9, login: 'test', name: 'Test User', email: null, avatarUrl: 'url', type: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        url: 'https://github.com/owner/empty-repo/issues/1'
      };

      const context: AnalysisContext = {
        repository,
        target: issue,
        files: [],
        options: {
          depth: 1,
          includeTests: false,
          includeDependencies: false,
          includeSecurityCheck: false,
          includePerformanceCheck: false
        }
      };

      const result = await engine.analyzeIssue(context);

      expect(result.status).toBe('completed');
      expect(result.summary.keyFindings).toBeDefined();
      expect(result.relatedFiles).toHaveLength(0);
    });

    test('분석 시간 초과 처리', async () => {
      const repository: Repository = {
        id: 10,
        name: 'timeout-repo',
        fullName: 'owner/timeout-repo',
        description: 'Repository for timeout testing',
        language: 'JavaScript',
        starCount: 1000,
        forkCount: 500,
        topics: ['large', 'complex'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 100000
      };

      const options: AnalysisOptions = {
        depth: 10,
        includeTests: true,
        includeDependencies: true,
        includeSecurityCheck: true,
        includePerformanceCheck: true,
        timeoutSeconds: 1 // 매우 짧은 타임아웃
      };

      await expect(engine.analyzeRepository(repository, options))
        .rejects.toThrow('Analysis timeout');
    });

    test('잘못된 분석 옵션 처리', async () => {
      const repository: Repository = {
        id: 11,
        name: 'invalid-options-repo',
        fullName: 'owner/invalid-options-repo',
        description: 'Repository for invalid options testing',
        language: 'JavaScript',
        starCount: 50,
        forkCount: 10,
        topics: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: false,
        defaultBranch: 'main',
        size: 1000
      };

      const invalidOptions: AnalysisOptions = {
        depth: -1, // 잘못된 depth
        includeTests: true,
        includeDependencies: false,
        includeSecurityCheck: false,
        includePerformanceCheck: false
      };

      await expect(engine.analyzeRepository(repository, invalidOptions))
        .rejects.toThrow('Invalid analysis options');
    });
  });

  describe('분석 상태 관리', () => {
    test('분석 상태 조회', async () => {
      const analysisId = 'test-analysis-123';

      const status = await engine.getAnalysisStatus(analysisId);

      expect(status).toBeDefined();
      expect(status.id).toBe(analysisId);
      expect(status.status).toMatch(/^(pending|processing|completed|failed|cancelled)$/);
      expect(status.progress).toBeGreaterThanOrEqual(0);
      expect(status.progress).toBeLessThanOrEqual(100);
    });

    test('분석 취소', async () => {
      const analysisId = 'test-analysis-456';

      const cancelled = await engine.cancelAnalysis(analysisId);

      expect(typeof cancelled).toBe('boolean');
    });

    test('존재하지 않는 분석 ID 처리', async () => {
      const nonExistentId = 'non-existent-analysis';

      await expect(engine.getAnalysisStatus(nonExistentId))
        .rejects.toThrow('Analysis not found');
    });
  });
});