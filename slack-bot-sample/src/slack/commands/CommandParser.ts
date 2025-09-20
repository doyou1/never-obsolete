import type {
  ICommandParser,
  CommandOptions,
  ParsedCommand,
  GitHubUrlInfo,
} from './types';

export class CommandParser implements ICommandParser {
  public parseCommand(text: string): ParsedCommand {
    const trimmedText = text.trim();

    // Handle help cases
    if (!trimmedText || trimmedText === 'help' || trimmedText === '--help') {
      return {
        githubUrl: '',
        options: {},
        isValid: false,
        errors: ['help'],
      };
    }

    // Split text into parts
    const parts = trimmedText.split(/\s+/);
    let githubUrl = '';
    const optionsParts: string[] = [];

    // Separate URL from options
    for (const part of parts) {
      if (part.startsWith('--')) {
        optionsParts.push(part);
      } else if (part.includes('github.com')) {
        githubUrl = part;
      } else if (!githubUrl && part.startsWith('https://')) {
        githubUrl = part;
      }
    }

    const errors: string[] = [];

    // Validate GitHub URL
    if (!githubUrl) {
      errors.push('GitHub URL is required');
    } else if (!this.parseGitHubUrl(githubUrl)) {
      errors.push('Invalid GitHub URL format');
    }

    // Parse options
    const options = this.parseOptions(optionsParts.join(' '));
    const optionErrors = this.validateOptions(options);
    errors.push(...optionErrors);

    return {
      githubUrl,
      options,
      isValid: errors.length === 0,
      errors,
    };
  }

  public parseGitHubUrl(url: string): GitHubUrlInfo | null {
    try {
      // Handle query parameters and fragments
      const urlParts = url.split('?');
      if (!urlParts[0]) return null;
      const fragmentParts = urlParts[0].split('#');
      const cleanUrl = fragmentParts[0];

      if (!cleanUrl) return null;

      // Remove trailing slash
      const normalizedUrl = cleanUrl.replace(/\/$/, '');

      const githubUrlRegex = /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)/;
      const match = normalizedUrl.match(githubUrlRegex);

      if (!match || match.length < 5) {
        return null;
      }

      const owner = match[1];
      const repo = match[2];
      const type = match[3];
      const numberStr = match[4];

      if (!owner || !repo || !type || !numberStr) {
        return null;
      }

      const number = parseInt(numberStr, 10);

      if (isNaN(number)) {
        return null;
      }

      return {
        owner,
        repo,
        type: type === 'issues' ? 'issue' : 'pr',
        number,
      };
    } catch {
      return null;
    }
  }

  public parseOptions(optionsText: string): CommandOptions {
    const options: CommandOptions = {
      format: 'markdown',
      includeTests: false,
    };

    if (!optionsText.trim()) {
      return options;
    }

    // Split by -- and process each option
    const optionParts = optionsText.split('--').filter(part => part.trim());

    for (const part of optionParts) {
      const trimmed = part.trim();

      // Handle format --option=value or --option value
      let optionName: string;
      let optionValue: string | undefined;

      if (trimmed.includes('=')) {
        const equalParts = trimmed.split('=', 2);
        optionName = equalParts[0] || '';
        optionValue = equalParts[1];
      } else {
        const spaceParts = trimmed.split(/\s+/);
        optionName = spaceParts[0] || '';
        optionValue = spaceParts[1];
      }

      optionName = optionName.toLowerCase();

      switch (optionName) {
        case 'type':
          if (optionValue) {
            const typeValue = optionValue.toLowerCase();
            if (typeValue === 'issue' || typeValue === 'pr') {
              options.type = typeValue;
            }
          }
          break;

        case 'depth':
          if (optionValue) {
            const depth = parseInt(optionValue, 10);
            if (!isNaN(depth)) {
              options.depth = depth;
            }
          }
          break;

        case 'format':
          if (optionValue) {
            const formatValue = optionValue.toLowerCase();
            if (formatValue === 'markdown' || formatValue === 'json') {
              options.format = formatValue;
            }
          }
          break;

        case 'include-tests':
          options.includeTests = true;
          break;
      }
    }

    return options;
  }

  public validateOptions(options: CommandOptions): string[] {
    const errors: string[] = [];

    // Validate type
    if (options.type && options.type !== 'issue' && options.type !== 'pr') {
      errors.push('Invalid type. Must be "issue" or "pr"');
    }

    // Validate depth
    if (options.depth !== undefined) {
      if (options.depth < 1 || options.depth > 50) {
        errors.push('Depth must be between 1 and 50');
      }
    }

    // Validate format
    if (options.format && options.format !== 'markdown' && options.format !== 'json') {
      errors.push('Invalid format. Must be "markdown" or "json"');
    }

    return errors;
  }
}