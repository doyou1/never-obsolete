import type { IssueInfo, PullRequestInfo, FileInfo, UserInfo, RepositoryInfo, CommitInfo } from '../types';

export interface ParsedIssueData {
  metadata: CommonMetadata;
  content: {
    description: string;
    labels: string[];
    assignees: UserInfo[];
  };
  statistics: {
    commentCount?: number;
    reactionCount?: number;
  };
}

export interface ParsedPullRequestData extends ParsedIssueData {
  changes: {
    baseBranch: string;
    headBranch: string;
    commits: CommitInfo[];
    files: FilteredFileResult;
  };
  status: {
    mergeable: boolean;
    merged: boolean;
    mergedAt?: string;
  };
}

export interface FilteredFileResult {
  included: FileInfo[];
  excluded: {
    bySize: FileInfo[];
    byExtension: FileInfo[];
  };
  statistics: {
    totalFiles: number;
    includedCount: number;
    excludedCount: number;
    totalSizeBytes: number;
  };
}

export interface CommonMetadata {
  id: number;
  number: number;
  title: string;
  type: 'issue' | 'pull';
  repository: RepositoryInfo;
  author: UserInfo;
  createdAt: string;
  updatedAt: string;
  state: 'open' | 'closed';
}

export interface GitHubDataParserConfig {
  maxFileSize: number;
  supportedExtensions: string[];
}

export interface IGitHubDataParser {
  parseIssueData(issueInfo: IssueInfo): ParsedIssueData;
  parsePullRequestData(prInfo: PullRequestInfo): ParsedPullRequestData;
  filterFiles(files: FileInfo[]): FilteredFileResult;
  extractMetadata(data: IssueInfo | PullRequestInfo): CommonMetadata;
  getConfig(): GitHubDataParserConfig;
}