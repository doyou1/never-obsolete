import type {
  IGitHubDataParser,
  ParsedIssueData,
  ParsedPullRequestData,
  FilteredFileResult,
  CommonMetadata,
  GitHubDataParserConfig,
} from './types';
import type { IssueInfo, PullRequestInfo, FileInfo } from '../types';
import { DataValidator } from './utils/DataValidator';
import { FileExtensionValidator } from './utils/FileExtensionValidator';

export class GitHubDataParser implements IGitHubDataParser {
  private config: GitHubDataParserConfig;

  constructor(config?: Partial<GitHubDataParserConfig>) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedExtensions: ['.ts', '.js', '.tsx', '.jsx', '.json', '.sql', '.md'],
      ...config,
    };
  }

  public getConfig(): GitHubDataParserConfig {
    return { ...this.config };
  }

  public parseIssueData(issueInfo: IssueInfo): ParsedIssueData {
    DataValidator.validateRequiredFields(issueInfo, ['id', 'number', 'title']);

    const metadata = this.extractMetadata(issueInfo);

    return {
      metadata,
      content: {
        description: issueInfo.body || '',
        labels: issueInfo.labels || [],
        assignees: issueInfo.assignees || [],
      },
      statistics: {},
    };
  }

  public parsePullRequestData(prInfo: PullRequestInfo): ParsedPullRequestData {
    if (!prInfo) {
      throw new Error('Invalid pull request data provided');
    }

    // Parse as issue first
    const issueData = this.parseIssueData(prInfo);

    // Filter changed files
    const filteredFiles = this.filterFiles(prInfo.changedFiles || []);

    return {
      ...issueData,
      changes: {
        baseBranch: prInfo.baseBranch || '',
        headBranch: prInfo.headBranch || '',
        commits: prInfo.commits || [],
        files: filteredFiles,
      },
      status: {
        mergeable: prInfo.mergeable ?? false,
        merged: prInfo.merged || false,
        ...(prInfo.mergedAt && { mergedAt: prInfo.mergedAt }),
      },
    };
  }

  public filterFiles(files: FileInfo[]): FilteredFileResult {
    if (!Array.isArray(files)) {
      throw new Error('Files must be an array');
    }

    const included: FileInfo[] = [];
    const excludedBySize: FileInfo[] = [];
    const excludedByExtension: FileInfo[] = [];

    for (const file of files) {
      const isValidExtension = FileExtensionValidator.isValidExtension(file.filename, this.config.supportedExtensions);
      const isValidSize = file.size <= this.config.maxFileSize;

      if (!isValidExtension) {
        excludedByExtension.push(file);
      } else if (!isValidSize) {
        excludedBySize.push(file);
      } else {
        included.push(file);
      }
    }

    const totalSizeBytes = included.reduce((sum, file) => sum + file.size, 0);

    return {
      included,
      excluded: {
        bySize: excludedBySize,
        byExtension: excludedByExtension,
      },
      statistics: {
        totalFiles: files.length,
        includedCount: included.length,
        excludedCount: excludedBySize.length + excludedByExtension.length,
        totalSizeBytes,
      },
    };
  }

  public extractMetadata(data: IssueInfo | PullRequestInfo): CommonMetadata {
    DataValidator.validateRequiredFields(data, ['id', 'number', 'title', 'author', 'repository', 'createdAt', 'updatedAt', 'state']);

    const type = DataValidator.isPullRequest(data) ? 'pull' : 'issue';

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      type,
      repository: data.repository,
      author: data.author,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      state: data.state,
    };
  }
}