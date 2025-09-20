import { AnalysisRequestManager } from '../AnalysisRequestManager';
import { CommandOptions } from '../types';

describe('AnalysisRequestManager', () => {
  let manager: AnalysisRequestManager;

  beforeEach(() => {
    manager = new AnalysisRequestManager();
  });

  describe('Request Creation', () => {
    test('should create basic analysis request', () => {
      const githubUrl = 'https://github.com/owner/repo/issues/123';
      const options: CommandOptions = { format: 'markdown' };

      const request = manager.createRequest('user1', 'channel1', githubUrl, options);

      expect(request).toEqual({
        id: expect.any(String),
        userId: 'user1',
        channelId: 'channel1',
        githubUrl,
        options,
        status: 'pending',
        createdAt: expect.any(Date),
      });
    });

    test('should generate unique IDs for multiple requests', () => {
      const githubUrl = 'https://github.com/owner/repo/issues/123';
      const options: CommandOptions = {};

      const request1 = manager.createRequest('user1', 'channel1', githubUrl, options);
      const request2 = manager.createRequest('user1', 'channel1', githubUrl, options);

      expect(request1.id).not.toBe(request2.id);
    });

    test('should set creation timestamp', () => {
      const before = new Date();
      const request = manager.createRequest('user1', 'channel1', 'url', {});
      const after = new Date();

      expect(request.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(request.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Status Management', () => {
    test('should update request status', () => {
      const request = manager.createRequest('user1', 'channel1', 'url', {});

      manager.updateStatus(request.id, 'processing');

      const updated = manager.getRequest(request.id);
      expect(updated?.status).toBe('processing');
    });

    test('should set completion time for completed status', () => {
      const request = manager.createRequest('user1', 'channel1', 'url', {});

      manager.updateStatus(request.id, 'completed');

      const updated = manager.getRequest(request.id);
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    test('should set completion time for failed status', () => {
      const request = manager.createRequest('user1', 'channel1', 'url', {});

      manager.updateStatus(request.id, 'failed', 'Test error');

      const updated = manager.getRequest(request.id);
      expect(updated?.completedAt).toBeInstanceOf(Date);
      expect(updated?.error).toBe('Test error');
    });

    test('should throw error for non-existent request', () => {
      expect(() => {
        manager.updateStatus('invalid-id', 'processing');
      }).toThrow('Request with ID invalid-id not found');
    });

    test('should set error message when provided', () => {
      const request = manager.createRequest('user1', 'channel1', 'url', {});

      manager.updateStatus(request.id, 'failed', 'Connection timeout');

      const updated = manager.getRequest(request.id);
      expect(updated?.error).toBe('Connection timeout');
    });
  });

  describe('Request Retrieval', () => {
    test('should retrieve request by ID', () => {
      const request = manager.createRequest('user1', 'channel1', 'url', {});

      const retrieved = manager.getRequest(request.id);

      expect(retrieved).toEqual(request);
    });

    test('should return null for non-existent request', () => {
      const retrieved = manager.getRequest('invalid-id');

      expect(retrieved).toBeNull();
    });

    test('should retrieve requests by user ID', () => {
      const request1 = manager.createRequest('user1', 'channel1', 'url1', {});
      const request2 = manager.createRequest('user2', 'channel1', 'url2', {});
      const request3 = manager.createRequest('user1', 'channel2', 'url3', {});

      const user1Requests = manager.getUserRequests('user1');

      expect(user1Requests).toHaveLength(2);
      expect(user1Requests).toContain(request1);
      expect(user1Requests).toContain(request3);
      expect(user1Requests).not.toContain(request2);
    });

    test('should retrieve requests by status', () => {
      const request1 = manager.createRequest('user1', 'channel1', 'url1', {});
      const request2 = manager.createRequest('user2', 'channel1', 'url2', {});
      const request3 = manager.createRequest('user3', 'channel1', 'url3', {});

      manager.updateStatus(request1.id, 'processing');
      manager.updateStatus(request2.id, 'completed');
      // request3 remains 'pending'

      const pendingRequests = manager.getRequestsByStatus('pending');
      const processingRequests = manager.getRequestsByStatus('processing');
      const completedRequests = manager.getRequestsByStatus('completed');

      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0]).toEqual(request3);

      expect(processingRequests).toHaveLength(1);
      expect(processingRequests[0]?.id).toBe(request1.id);
      expect(processingRequests[0]?.status).toBe('processing');

      expect(completedRequests).toHaveLength(1);
      expect(completedRequests[0]?.id).toBe(request2.id);
      expect(completedRequests[0]?.status).toBe('completed');
    });

    test('should return empty array for non-existent user', () => {
      const requests = manager.getUserRequests('non-existent-user');

      expect(requests).toEqual([]);
    });

    test('should return empty array when no requests match status', () => {
      manager.createRequest('user1', 'channel1', 'url', {});

      const completedRequests = manager.getRequestsByStatus('completed');

      expect(completedRequests).toEqual([]);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle multiple status updates', () => {
      const request = manager.createRequest('user1', 'channel1', 'url', {});

      manager.updateStatus(request.id, 'processing');
      manager.updateStatus(request.id, 'completed');

      const updated = manager.getRequest(request.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    test('should handle concurrent requests from multiple users', () => {
      const user1Request1 = manager.createRequest('user1', 'channel1', 'url1', {});
      manager.createRequest('user1', 'channel1', 'url2', {});
      const user2Request1 = manager.createRequest('user2', 'channel1', 'url3', {});

      manager.updateStatus(user1Request1.id, 'processing');
      manager.updateStatus(user2Request1.id, 'completed');

      expect(manager.getUserRequests('user1')).toHaveLength(2);
      expect(manager.getUserRequests('user2')).toHaveLength(1);
      expect(manager.getRequestsByStatus('pending')).toHaveLength(1);
      expect(manager.getRequestsByStatus('processing')).toHaveLength(1);
      expect(manager.getRequestsByStatus('completed')).toHaveLength(1);
    });

    test('should preserve all request data through status updates', () => {
      const originalOptions: CommandOptions = {
        type: 'pr',
        depth: 5,
        format: 'json',
        includeTests: true,
      };

      const request = manager.createRequest('user1', 'channel1', 'url', originalOptions);
      const originalCreatedAt = request.createdAt;

      manager.updateStatus(request.id, 'processing');
      manager.updateStatus(request.id, 'completed');

      const final = manager.getRequest(request.id);
      expect(final?.userId).toBe('user1');
      expect(final?.channelId).toBe('channel1');
      expect(final?.githubUrl).toBe('url');
      expect(final?.options).toEqual(originalOptions);
      expect(final?.createdAt).toEqual(originalCreatedAt);
      expect(final?.status).toBe('completed');
      expect(final?.completedAt).toBeInstanceOf(Date);
    });
  });
});