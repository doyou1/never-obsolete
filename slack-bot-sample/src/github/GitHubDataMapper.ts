import {
  IGitHubDataMapper,
  Repository,
  Issue,
  PullRequest,
  FileContent,
  FileChange,
  Comment,
  Review,
  User,
  Label
} from './types';

export class GitHubDataMapper implements IGitHubDataMapper {

  public mapRepository(apiData: any): Repository {
    this.validateRequiredFields(apiData, ['id', 'name', 'full_name'], 'Repository');

    return {
      id: apiData.id,
      name: apiData.name,
      fullName: apiData.full_name,
      description: apiData.description || null,
      language: apiData.language || null,
      starCount: apiData.stargazers_count || 0,
      forkCount: apiData.forks_count || 0,
      topics: apiData.topics || [],
      createdAt: this.parseDate(apiData.created_at),
      updatedAt: this.parseDate(apiData.updated_at),
      isPrivate: apiData.private || false,
      defaultBranch: apiData.default_branch || 'main',
      size: apiData.size || 0,
    };
  }

  public mapIssue(apiData: any): Issue {
    this.validateRequiredFields(apiData, ['id', 'number', 'title', 'state', 'user'], 'Issue');
    this.validateState(apiData.state, ['open', 'closed']);

    return {
      id: apiData.id,
      number: apiData.number,
      title: apiData.title,
      body: apiData.body || null,
      state: apiData.state as 'open' | 'closed',
      labels: (apiData.labels || []).map((label: any) => this.mapLabel(label)),
      assignees: (apiData.assignees || []).map((assignee: any) => this.mapUser(assignee)),
      author: this.mapUser(apiData.user),
      createdAt: this.parseDate(apiData.created_at),
      updatedAt: this.parseDate(apiData.updated_at),
      closedAt: apiData.closed_at ? this.parseDate(apiData.closed_at) : null,
      url: apiData.html_url || '',
    };
  }

  public mapPullRequest(apiData: any): PullRequest {
    // Issue 필드들을 먼저 매핑
    const issue = this.mapIssue(apiData);

    // PR 전용 필드들 추가
    this.validateRequiredFields(apiData, ['head', 'base'], 'PullRequest');

    return {
      ...issue,
      headBranch: apiData.head?.ref || '',
      baseBranch: apiData.base?.ref || '',
      commits: apiData.commits || 0,
      additions: apiData.additions || 0,
      deletions: apiData.deletions || 0,
      changedFiles: apiData.changed_files || 0,
      mergeable: apiData.mergeable,
      merged: apiData.merged || false,
      mergedAt: apiData.merged_at ? this.parseDate(apiData.merged_at) : null,
      mergedBy: apiData.merged_by ? this.mapUser(apiData.merged_by) : null,
      draft: apiData.draft || false,
    };
  }

  public mapFileContent(apiData: any): FileContent {
    this.validateRequiredFields(apiData, ['name', 'path', 'content', 'encoding', 'size', 'sha'], 'FileContent');

    return {
      name: apiData.name,
      path: apiData.path,
      content: apiData.content,
      encoding: apiData.encoding as 'base64' | 'utf-8',
      size: apiData.size,
      sha: apiData.sha,
      url: apiData.download_url || '',
    };
  }

  public mapFileChange(apiData: any): FileChange {
    this.validateRequiredFields(apiData, ['filename', 'status', 'additions', 'deletions', 'changes'], 'FileChange');

    const result: FileChange = {
      filename: apiData.filename,
      status: apiData.status as 'added' | 'modified' | 'removed' | 'renamed',
      additions: apiData.additions,
      deletions: apiData.deletions,
      changes: apiData.changes,
      blobUrl: apiData.blob_url || '',
    };

    if (apiData.patch) {
      result.patch = apiData.patch;
    }

    if (apiData.previous_filename) {
      result.previousFilename = apiData.previous_filename;
    }

    return result;
  }

  public mapComment(apiData: any): Comment {
    this.validateRequiredFields(apiData, ['id', 'body', 'user'], 'Comment');

    const result: Comment = {
      id: apiData.id,
      body: apiData.body,
      author: this.mapUser(apiData.user),
      createdAt: this.parseDate(apiData.created_at),
      updatedAt: this.parseDate(apiData.updated_at),
      url: apiData.html_url || '',
    };

    if (apiData.reactions) {
      result.reactions = {
        '+1': apiData.reactions['+1'] || 0,
        '-1': apiData.reactions['-1'] || 0,
        laugh: apiData.reactions.laugh || 0,
        confused: apiData.reactions.confused || 0,
        heart: apiData.reactions.heart || 0,
        hooray: apiData.reactions.hooray || 0,
        eyes: apiData.reactions.eyes || 0,
        rocket: apiData.reactions.rocket || 0,
        totalCount: apiData.reactions.total_count || 0,
      };
    }

    return result;
  }

  public mapReview(apiData: any): Review {
    this.validateRequiredFields(apiData, ['id', 'user', 'state', 'submitted_at', 'commit_id'], 'Review');

    // GitHub API의 대문자 state를 소문자로 변환
    const stateMap: Record<string, string> = {
      'APPROVED': 'approved',
      'CHANGES_REQUESTED': 'changes_requested',
      'COMMENTED': 'commented',
      'DISMISSED': 'dismissed',
    };

    const mappedState = stateMap[apiData.state] || apiData.state.toLowerCase();

    return {
      id: apiData.id,
      body: apiData.body || null,
      author: this.mapUser(apiData.user),
      state: mappedState as 'approved' | 'changes_requested' | 'commented' | 'dismissed',
      submittedAt: this.parseDate(apiData.submitted_at),
      commitSha: apiData.commit_id,
      url: apiData.html_url || '',
    };
  }

  public mapUser(apiData: any): User {
    this.validateRequiredFields(apiData, ['id', 'login', 'avatar_url', 'type'], 'User');

    return {
      id: apiData.id,
      login: apiData.login,
      name: apiData.name || null,
      email: apiData.email || null,
      avatarUrl: apiData.avatar_url,
      type: apiData.type as 'User' | 'Organization',
    };
  }

  public mapLabel(apiData: any): Label {
    this.validateRequiredFields(apiData, ['id', 'name', 'color'], 'Label');

    return {
      id: apiData.id,
      name: apiData.name,
      color: apiData.color,
      description: apiData.description || null,
    };
  }

  private validateRequiredFields(data: any, fields: string[], entityType: string): void {
    if (!data) {
      throw new Error(`${entityType} data is null or undefined`);
    }

    for (const field of fields) {
      if (data[field] === undefined || data[field] === null) {
        // 일부 필드는 null이 허용될 수 있음
        if (this.isNullableField(field)) {
          continue;
        }
        throw new Error(`Required field '${field}' is missing in ${entityType} data`);
      }
    }
  }

  private isNullableField(field: string): boolean {
    const nullableFields = ['name', 'email', 'description', 'body'];
    return nullableFields.includes(field);
  }

  private validateState(state: string, validStates: string[]): void {
    if (!validStates.includes(state)) {
      throw new Error(`Invalid state '${state}'. Valid states are: ${validStates.join(', ')}`);
    }
  }

  private parseDate(dateString: string): Date {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    return date;
  }
}