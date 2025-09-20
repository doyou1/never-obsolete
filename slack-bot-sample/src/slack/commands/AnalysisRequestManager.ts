import { v4 as uuidv4 } from 'uuid';
import type {
  IAnalysisRequestManager,
  AnalysisRequest,
  CommandOptions,
} from './types';

export class AnalysisRequestManager implements IAnalysisRequestManager {
  private requests: Map<string, AnalysisRequest> = new Map();

  public createRequest(
    userId: string,
    channelId: string,
    githubUrl: string,
    options: CommandOptions
  ): AnalysisRequest {
    const request: AnalysisRequest = {
      id: uuidv4(),
      userId,
      channelId,
      githubUrl,
      options,
      status: 'pending',
      createdAt: new Date(),
    };

    this.requests.set(request.id, request);
    return request;
  }

  public updateStatus(
    requestId: string,
    status: AnalysisRequest['status'],
    error?: string
  ): void {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request with ID ${requestId} not found`);
    }

    request.status = status;
    if (status === 'completed' || status === 'failed') {
      request.completedAt = new Date();
    }
    if (error) {
      request.error = error;
    }

    this.requests.set(requestId, request);
  }

  public getRequest(requestId: string): AnalysisRequest | null {
    return this.requests.get(requestId) || null;
  }

  public getUserRequests(userId: string): AnalysisRequest[] {
    return Array.from(this.requests.values()).filter(
      request => request.userId === userId
    );
  }

  public getRequestsByStatus(status: AnalysisRequest['status']): AnalysisRequest[] {
    return Array.from(this.requests.values()).filter(
      request => request.status === status
    );
  }
}