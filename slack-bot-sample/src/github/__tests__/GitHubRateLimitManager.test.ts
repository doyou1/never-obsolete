import { GitHubRateLimitManager } from '../GitHubRateLimitManager';

describe('GitHubRateLimitManager', () => {
  let manager: GitHubRateLimitManager;

  beforeEach(() => {
    manager = new GitHubRateLimitManager();
  });

  describe('초기 상태', () => {
    test('기본 Rate Limit 상태 설정', () => {
      const limit = manager.getCurrentLimit();

      expect(limit.limit).toBe(5000);
      expect(limit.remaining).toBe(5000);
      expect(limit.used).toBe(0);
      expect(limit.resetTime).toBeInstanceOf(Date);
    });

    test('초기에는 요청 가능 상태', () => {
      expect(manager.canMakeRequest()).toBe(true);
      expect(manager.shouldWait()).toBe(false);
      expect(manager.getWaitTime()).toBe(0);
    });
  });

  describe('Headers로부터 업데이트', () => {
    test('유효한 Rate Limit 헤더 처리', () => {
      const headers = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-used': '1',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      };

      manager.updateFromHeaders(headers);
      const limit = manager.getCurrentLimit();

      expect(limit.limit).toBe(5000);
      expect(limit.remaining).toBe(4999);
      expect(limit.used).toBe(1);
      expect(limit.resetTime).toBeInstanceOf(Date);
    });

    test('Rate Limit 소진 상태 처리', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;
      const headers = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-used': '5000',
        'x-ratelimit-reset': String(resetTime),
      };

      manager.updateFromHeaders(headers);

      expect(manager.canMakeRequest()).toBe(false);
      expect(manager.shouldWait()).toBe(true);
      expect(manager.getWaitTime()).toBeGreaterThan(0);
    });

    test('잘못된 헤더 값 무시', () => {
      const originalLimit = manager.getCurrentLimit();

      const badHeaders = {
        'x-ratelimit-limit': 'invalid',
        'x-ratelimit-remaining': 'also-invalid',
        'x-ratelimit-used': '',
        'x-ratelimit-reset': 'not-a-number',
      };

      manager.updateFromHeaders(badHeaders);
      const newLimit = manager.getCurrentLimit();

      expect(newLimit.limit).toBe(originalLimit.limit);
      expect(newLimit.remaining).toBe(originalLimit.remaining);
    });

    test('부분적으로 유효한 헤더 처리', () => {
      const headers = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4500',
        // used와 reset 헤더 누락
      };

      manager.updateFromHeaders(headers);
      const limit = manager.getCurrentLimit();

      expect(limit.limit).toBe(5000);
      expect(limit.remaining).toBe(4500);
    });
  });

  describe('요청 추적', () => {
    test('요청 추적으로 remaining 감소', () => {
      const initialRemaining = manager.getCurrentLimit().remaining;

      manager.trackRequest();

      const newRemaining = manager.getCurrentLimit().remaining;
      expect(newRemaining).toBe(initialRemaining - 1);
    });

    test('여러 요청 추적', () => {
      const initialRemaining = manager.getCurrentLimit().remaining;

      manager.trackRequest();
      manager.trackRequest();
      manager.trackRequest();

      const newRemaining = manager.getCurrentLimit().remaining;
      expect(newRemaining).toBe(initialRemaining - 3);
    });

    test('remaining이 0에 도달하면 요청 불가', () => {
      // remaining을 0으로 만들기
      const headers = {
        'x-ratelimit-remaining': '1',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      };
      manager.updateFromHeaders(headers);

      expect(manager.canMakeRequest()).toBe(true);

      manager.trackRequest();

      expect(manager.canMakeRequest()).toBe(false);
      expect(manager.shouldWait()).toBe(true);
    });
  });

  describe('대기 시간 계산', () => {
    test('Rate Limit 리셋까지 대기 시간', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1시간 후
      const headers = {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(resetTime),
      };

      manager.updateFromHeaders(headers);
      const waitTime = manager.getWaitTime();

      expect(waitTime).toBeGreaterThan(3500); // 약 1시간
      expect(waitTime).toBeLessThanOrEqual(3600);
    });

    test('이미 리셋 시간이 지난 경우', () => {
      const pastResetTime = Math.floor(Date.now() / 1000) - 3600; // 1시간 전
      const headers = {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(pastResetTime),
      };

      manager.updateFromHeaders(headers);
      const waitTime = manager.getWaitTime();

      expect(waitTime).toBe(0);
    });

    test('여유가 있는 경우 대기 시간 0', () => {
      const headers = {
        'x-ratelimit-remaining': '1000',
      };

      manager.updateFromHeaders(headers);

      expect(manager.getWaitTime()).toBe(0);
    });
  });

  describe('임계값 감지', () => {
    test('remaining이 임계값 미만일 때 경고', () => {
      const headers = {
        'x-ratelimit-remaining': '50', // 임계값(100) 미만
      };

      manager.updateFromHeaders(headers);

      expect(manager.shouldWait()).toBe(false); // 아직 요청 가능
      // 실제 구현에서는 경고 이벤트나 로깅이 발생할 수 있음
    });

    test('remaining이 10 미만일 때 매우 주의', () => {
      const headers = {
        'x-ratelimit-remaining': '5',
      };

      manager.updateFromHeaders(headers);

      expect(manager.canMakeRequest()).toBe(true);
      // 실제 구현에서는 강한 경고나 제한이 발생할 수 있음
    });
  });

  describe('리셋 시간 처리', () => {
    test('리셋 시간 후 제한 복구', () => {
      // 현재 시간 이전으로 리셋 시간 설정
      const pastResetTime = Math.floor(Date.now() / 1000) - 10;
      const headers = {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(pastResetTime),
      };

      manager.updateFromHeaders(headers);

      // 리셋 시간이 지났으므로 대기할 필요 없음
      expect(manager.shouldWait()).toBe(false);
      expect(manager.getWaitTime()).toBe(0);
    });

    test('미래 리셋 시간 처리', () => {
      const futureResetTime = Math.floor(Date.now() / 1000) + 1800; // 30분 후
      const headers = {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(futureResetTime),
      };

      manager.updateFromHeaders(headers);

      expect(manager.shouldWait()).toBe(true);
      expect(manager.getWaitTime()).toBeGreaterThan(1700); // 약 30분
    });
  });

  describe('엣지 케이스', () => {
    test('빈 헤더 객체 처리', () => {
      const originalLimit = manager.getCurrentLimit();

      manager.updateFromHeaders({});

      const newLimit = manager.getCurrentLimit();
      expect(newLimit.limit).toBe(originalLimit.limit);
      expect(newLimit.remaining).toBe(originalLimit.remaining);
    });

    test('음수 remaining 값 처리', () => {
      const headers = {
        'x-ratelimit-remaining': '-1',
      };

      manager.updateFromHeaders(headers);

      expect(manager.canMakeRequest()).toBe(false);
      expect(manager.shouldWait()).toBe(true);
    });

    test('매우 큰 limit 값 처리', () => {
      const headers = {
        'x-ratelimit-limit': '999999999',
        'x-ratelimit-remaining': '999999999',
      };

      manager.updateFromHeaders(headers);
      const limit = manager.getCurrentLimit();

      expect(limit.limit).toBe(999999999);
      expect(limit.remaining).toBe(999999999);
      expect(manager.canMakeRequest()).toBe(true);
    });

    test('0 limit 값 처리', () => {
      const headers = {
        'x-ratelimit-limit': '0',
        'x-ratelimit-remaining': '0',
      };

      manager.updateFromHeaders(headers);

      expect(manager.canMakeRequest()).toBe(false);
    });
  });

  describe('동시성 처리', () => {
    test('동시에 여러 요청 추적', () => {
      const initialRemaining = manager.getCurrentLimit().remaining;

      // 동시에 여러 요청 추적 시뮬레이션
      Promise.all([
        Promise.resolve(manager.trackRequest()),
        Promise.resolve(manager.trackRequest()),
        Promise.resolve(manager.trackRequest()),
      ]);

      const newRemaining = manager.getCurrentLimit().remaining;
      expect(newRemaining).toBe(initialRemaining - 3);
    });

    test('헤더 업데이트와 요청 추적 동시 실행', () => {
      const headers = {
        'x-ratelimit-remaining': '100',
      };

      // 동시에 헤더 업데이트와 요청 추적
      manager.updateFromHeaders(headers);
      manager.trackRequest();

      const limit = manager.getCurrentLimit();
      expect(limit.remaining).toBeLessThanOrEqual(100);
    });
  });

  describe('상태 일관성', () => {
    test('used + remaining = limit 일관성', () => {
      const headers = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4000',
        'x-ratelimit-used': '1000',
      };

      manager.updateFromHeaders(headers);
      const limit = manager.getCurrentLimit();

      expect(limit.used + limit.remaining).toBe(limit.limit);
    });

    test('여러 업데이트 후 일관성 유지', () => {
      // 첫 번째 업데이트
      manager.updateFromHeaders({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4500',
        'x-ratelimit-used': '500',
      });

      // 요청 추적
      manager.trackRequest();
      manager.trackRequest();

      // 두 번째 업데이트
      manager.updateFromHeaders({
        'x-ratelimit-remaining': '4400',
        'x-ratelimit-used': '600',
      });

      const limit = manager.getCurrentLimit();
      expect(limit.remaining).toBe(4400);
      expect(limit.used).toBe(600);
    });
  });
});