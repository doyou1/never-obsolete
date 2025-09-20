import { IGitHubRateLimitManager, GitHubRateLimit } from './types';

export class GitHubRateLimitManager implements IGitHubRateLimitManager {
  private rateLimit: GitHubRateLimit;

  constructor() {
    // 기본 GitHub API Rate Limit 설정
    this.rateLimit = {
      limit: 5000,
      remaining: 5000,
      resetTime: new Date(Date.now() + 3600 * 1000), // 1시간 후
      used: 0,
    };
  }

  public updateFromHeaders(headers: Record<string, string>): void {
    // GitHub API 헤더에서 Rate Limit 정보 추출
    const limit = this.parseIntHeader(headers['x-ratelimit-limit']);
    const remaining = this.parseIntHeader(headers['x-ratelimit-remaining']);
    const used = this.parseIntHeader(headers['x-ratelimit-used']);
    const reset = this.parseIntHeader(headers['x-ratelimit-reset']);

    // 유효한 값만 업데이트
    if (limit !== null) {
      this.rateLimit.limit = limit;
    }

    if (remaining !== null) {
      this.rateLimit.remaining = remaining;
    }

    if (used !== null) {
      this.rateLimit.used = used;
    }

    if (reset !== null) {
      this.rateLimit.resetTime = new Date(reset * 1000);
    }
  }

  public getCurrentLimit(): GitHubRateLimit {
    return { ...this.rateLimit };
  }

  public shouldWait(): boolean {
    if (this.rateLimit.remaining <= 0) {
      // 리셋 시간이 이미 지났는지 확인
      const now = Date.now();
      const resetTime = this.rateLimit.resetTime.getTime();

      return now < resetTime;
    }

    return false;
  }

  public getWaitTime(): number {
    if (!this.shouldWait()) {
      return 0;
    }

    const now = Date.now();
    const resetTime = this.rateLimit.resetTime.getTime();
    const waitTime = Math.max(0, Math.ceil((resetTime - now) / 1000));

    return waitTime;
  }

  public canMakeRequest(): boolean {
    if (this.rateLimit.remaining <= 0) {
      // 리셋 시간이 지났는지 확인
      const now = Date.now();
      const resetTime = this.rateLimit.resetTime.getTime();

      if (now >= resetTime) {
        // 리셋 시간이 지났으므로 제한이 풀림
        return true;
      }

      return false;
    }

    return true;
  }

  public trackRequest(): void {
    if (this.rateLimit.remaining > 0) {
      this.rateLimit.remaining--;
      this.rateLimit.used++;
    }
  }

  private parseIntHeader(value: string | undefined): number | null {
    if (!value || value.trim() === '') {
      return null;
    }

    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
}