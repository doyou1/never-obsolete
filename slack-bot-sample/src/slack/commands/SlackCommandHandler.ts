import type {
  ISlackCommandHandler,
  SlackResponse,
  AnalysisRequest,
  ICommandParser,
  IAnalysisRequestManager,
} from './types';

export class SlackCommandHandler implements ISlackCommandHandler {
  constructor(
    private commandParser: ICommandParser,
    private requestManager: IAnalysisRequestManager
  ) {}

  public async handleAnalyzeCommand(
    text: string,
    userId: string,
    channelId: string
  ): Promise<SlackResponse> {
    const parsed = this.commandParser.parseCommand(text);

    if (!parsed.isValid) {
      if (parsed.errors.includes('help')) {
        return this.generateHelpMessage();
      }
      return this.generateErrorMessage(parsed.errors);
    }

    // Create analysis request
    const request = this.requestManager.createRequest(
      userId,
      channelId,
      parsed.githubUrl,
      parsed.options
    );

    return this.generateSuccessMessage(request);
  }

  public generateHelpMessage(): SlackResponse {
    const helpText = `📖 **/analyze-repo 사용법**

**기본 사용:**
\`/analyze-repo https://github.com/owner/repo/issues/123\`

**옵션:**
• \`--type issue|pr\` - 분석할 타입 지정
• \`--depth <숫자>\` - 분석 깊이 제한 (기본: 10)
• \`--format markdown|json\` - 출력 형식
• \`--include-tests\` - 테스트 파일 포함

**예시:**
\`/analyze-repo https://github.com/owner/repo/pull/456 --depth=5 --format=json\``;

    return {
      response_type: 'ephemeral',
      text: helpText,
    };
  }

  public generateErrorMessage(errors: string[]): SlackResponse {
    const errorText = `❌ **명령어 오류**

${errors.map(error => `• ${error}`).join('\n')}

올바른 사용법을 확인하려면 \`/analyze-repo help\`를 입력하세요.`;

    return {
      response_type: 'ephemeral',
      text: errorText,
    };
  }

  public generateSuccessMessage(request: AnalysisRequest): SlackResponse {
    const { githubUrl, options } = request;

    // Parse GitHub URL to extract repository info
    const urlInfo = this.commandParser.parseGitHubUrl(githubUrl);
    const repoDisplay = urlInfo
      ? `${urlInfo.owner}/${urlInfo.repo}`
      : githubUrl;

    const typeDisplay = urlInfo
      ? `${urlInfo.type} #${urlInfo.number}`
      : 'repository';

    // Format options display
    const optionsList = [];
    if (options.type) optionsList.push(`--type=${options.type}`);
    if (options.depth) optionsList.push(`--depth=${options.depth}`);
    if (options.format) optionsList.push(`--format=${options.format}`);
    if (options.includeTests) optionsList.push(`--include-tests`);

    const optionsText = optionsList.length > 0
      ? `\n⚙️ **Options:** ${optionsList.join(' ')}`
      : '';

    const successText = `🚀 **GitHub 분석을 시작합니다...**

📋 **Repository:** ${repoDisplay}
🔍 **Type:** ${typeDisplay}${optionsText}

분석이 완료되면 결과를 알려드리겠습니다.`;

    return {
      response_type: 'ephemeral',
      text: successText,
    };
  }
}