# API 엔드포인트 사양

## 개요

GitHub 소스코드 플로우 분석 Slack Bot의 RESTful API 엔드포인트 설계입니다.

### 기본 정보

- **Base URL**: `https://api.github-flow-analyzer.com/v1`
- **Content-Type**: `application/json`
- **인증**: Bearer Token (Slack App Token)
- **Rate Limiting**: 1000 requests/hour per workspace

## 인증

### Authentication Header
```
Authorization: Bearer xoxb-your-slack-bot-token
X-Workspace-ID: T1234567890
```

## Core API Endpoints

### 1. 분석 요청 관리

#### POST /analysis/requests
GitHub URL 분석 요청 생성

**요청:**
```json
{
  "github_url": "https://github.com/owner/repo/issues/123",
  "issue_type": "issue",
  "analysis_depth": "shallow",
  "output_format": "tree",
  "channel_id": "C1234567890",
  "user_id": "U1234567890"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "github_url": "https://github.com/owner/repo/issues/123",
    "estimated_duration_ms": 120000,
    "created_at": "2024-03-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_12345",
    "execution_time_ms": 45
  }
}
```

#### GET /analysis/requests/{id}
분석 요청 상태 조회

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "analyzing_code",
    "progress": 65,
    "current_step": "플로우 추적 중",
    "github_url": "https://github.com/owner/repo/issues/123",
    "issue_type": "issue",
    "created_at": "2024-03-15T10:30:00Z",
    "started_at": "2024-03-15T10:30:15Z",
    "estimated_completion": "2024-03-15T10:32:00Z"
  }
}
```

#### GET /analysis/requests
분석 요청 목록 조회

**Query Parameters:**
- `workspace_id` (required): Slack 워크스페이스 ID
- `user_id` (optional): 특정 사용자 요청만 조회
- `status` (optional): 상태별 필터링
- `page` (optional, default: 1): 페이지 번호
- `per_page` (optional, default: 20): 페이지당 항목 수

**응답:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "github_url": "https://github.com/owner/repo/issues/123",
        "status": "completed",
        "user_name": "john.doe",
        "created_at": "2024-03-15T10:30:00Z",
        "completed_at": "2024-03-15T10:32:30Z"
      }
    ],
    "total_count": 156,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

#### DELETE /analysis/requests/{id}
분석 요청 취소

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    "cancelled_at": "2024-03-15T10:31:00Z"
  }
}
```

### 2. 분석 결과 조회

#### GET /analysis/results/{request_id}
분석 결과 조회

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "result_123",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "flow_data": {
      "entry_points": ["clientv/router.ts"],
      "nodes": [
        {
          "id": "node_1",
          "type": "router",
          "file_path": "clientv/router.ts",
          "line_number": 45,
          "name": "POST /api/users/create",
          "description": "사용자 생성 API 엔드포인트"
        }
      ],
      "edges": [
        {
          "id": "edge_1",
          "from": "node_1",
          "to": "node_2",
          "type": "api_request",
          "description": "API 호출"
        }
      ]
    },
    "summary": {
      "total_files": 25,
      "analyzed_files": 23,
      "skipped_files": 2,
      "api_endpoints": 12,
      "database_queries": 8,
      "potential_issues": 3,
      "flow_depth": 5
    },
    "markdown_report": "# 분석 결과...",
    "markdown_file_path": "/reports/analysis_20240315_103000.md",
    "execution_time_ms": 128500,
    "completed_at": "2024-03-15T10:32:30Z"
  }
}
```

#### GET /analysis/results/{request_id}/download
분석 결과 마크다운 파일 다운로드

**응답:**
- Content-Type: `text/markdown`
- Content-Disposition: `attachment; filename="analysis_20240315_103000.md"`

### 3. 에러 및 경고 조회

#### GET /analysis/requests/{id}/errors
분석 에러 목록 조회

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "error_1",
      "type": "github_api",
      "message": "GitHub API rate limit exceeded",
      "file_path": null,
      "details": {
        "rate_limit_reset": "2024-03-15T11:00:00Z",
        "remaining": 0
      },
      "created_at": "2024-03-15T10:31:15Z"
    }
  ]
}
```

#### GET /analysis/requests/{id}/warnings
분석 경고 목록 조회

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "warning_1",
      "type": "missing_validation",
      "severity": "high",
      "message": "입력 검증이 누락되었습니다",
      "file_path": "server/routes/user.ts",
      "line_number": 23,
      "created_at": "2024-03-15T10:31:45Z"
    }
  ]
}
```

## Slack Integration Endpoints

### 4. Slack 명령어 처리

#### POST /slack/commands
Slack 슬래시 명령어 처리

**요청 (Slack에서 전송):**
```json
{
  "token": "verification_token",
  "team_id": "T1234567890",
  "team_domain": "example",
  "channel_id": "C1234567890",
  "channel_name": "general",
  "user_id": "U1234567890",
  "user_name": "john.doe",
  "command": "/analyze-repo",
  "text": "https://github.com/owner/repo/issues/123 --type=issue --format=tree",
  "response_url": "https://hooks.slack.com/commands/...",
  "trigger_id": "trigger_123"
}
```

**즉시 응답:**
```json
{
  "response_type": "in_channel",
  "text": "📊 GitHub 분석을 시작합니다...",
  "attachments": [
    {
      "color": "good",
      "fields": [
        {
          "title": "대상",
          "value": "https://github.com/owner/repo/issues/123",
          "short": true
        },
        {
          "title": "타입",
          "value": "Issue",
          "short": true
        }
      ]
    }
  ]
}
```

#### POST /slack/interactive
Slack 인터랙티브 컴포넌트 처리

**요청:**
```json
{
  "type": "block_actions",
  "user": {
    "id": "U1234567890",
    "name": "john.doe"
  },
  "actions": [
    {
      "action_id": "cancel_analysis",
      "block_id": "analysis_controls",
      "value": "550e8400-e29b-41d4-a716-446655440000",
      "type": "button"
    }
  ],
  "channel": {
    "id": "C1234567890",
    "name": "general"
  },
  "message": {
    "ts": "1647334200.123456"
  }
}
```

#### POST /slack/events
Slack 이벤트 처리

**요청:**
```json
{
  "token": "verification_token",
  "team_id": "T1234567890",
  "api_app_id": "A1234567890",
  "event": {
    "type": "app_mention",
    "user": "U1234567890",
    "text": "<@U0987654321> analyze https://github.com/owner/repo/pull/456",
    "ts": "1647334200.123456",
    "channel": "C1234567890"
  }
}
```

### 5. Slack 메시지 전송

#### POST /slack/messages
Slack 메시지 전송

**요청:**
```json
{
  "channel": "C1234567890",
  "text": "분석이 완료되었습니다!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "📊 *코드 플로우 분석 결과*"
      }
    }
  ],
  "thread_ts": "1647334200.123456"
}
```

#### POST /slack/progress
진행률 업데이트 메시지 전송

**요청:**
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "channel": "C1234567890",
  "thread_ts": "1647334200.123456",
  "progress": 75,
  "status": "generating_report",
  "message": "보고서 생성 중..."
}
```

## Claude Code Integration Endpoints

### 6. Claude Code 명령어

#### POST /claude-code/analyze-github-url
Claude Code `/analyze-github-url` 명령어 처리

**요청:**
```json
{
  "github_url": "https://github.com/owner/repo/issues/123",
  "output_file": "/path/to/output/analysis_report.md",
  "analysis_depth": "shallow"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "output_file": "/path/to/output/analysis_report_20240315_103000.md",
    "analysis_summary": {
      "total_files": 25,
      "analyzed_files": 23,
      "api_endpoints": 12,
      "potential_issues": 3
    },
    "execution_time_ms": 128500
  }
}
```

#### POST /claude-code/export-to-slack
Claude Code `/export-to-slack` 명령어 처리

**요청:**
```json
{
  "report_file_path": "/path/to/analysis_report_20240315_103000.md",
  "slack_channel": "#development",
  "include_attachments": true
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "message_url": "https://example.slack.com/archives/C1234567890/p1647334200123456",
    "channel": "C1234567890",
    "timestamp": "1647334200.123456"
  }
}
```

## Utility Endpoints

### 7. 시스템 정보

#### GET /health
헬스체크

**응답:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime_seconds": 86400,
    "database": "connected",
    "redis": "connected",
    "github_api": "available",
    "slack_api": "available"
  }
}
```

#### GET /stats
시스템 통계

**응답:**
```json
{
  "success": true,
  "data": {
    "total_requests": 15642,
    "successful_requests": 14856,
    "failed_requests": 786,
    "average_execution_time_ms": 125000,
    "active_analyses": 3,
    "cache_hit_rate": 0.78,
    "github_api_calls_today": 8542,
    "rate_limit_remaining": 4458
  }
}
```

### 8. 사용자 관리

#### GET /users/{workspace_id}
워크스페이스 사용자 목록

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "U1234567890",
      "user_name": "john.doe",
      "is_admin": false,
      "is_active": true,
      "total_requests": 45,
      "successful_requests": 42,
      "last_request_at": "2024-03-15T10:30:00Z"
    }
  ]
}
```

#### GET /users/{workspace_id}/{user_id}/usage
사용자 사용량 통계

**응답:**
```json
{
  "success": true,
  "data": {
    "today": {
      "requests_count": 5,
      "successful_requests": 5,
      "failed_requests": 0,
      "remaining_quota": 95
    },
    "this_month": {
      "requests_count": 127,
      "successful_requests": 120,
      "failed_requests": 7,
      "avg_execution_time_ms": 118500
    }
  }
}
```

## Error Responses

### 표준 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "GITHUB_API_ERROR",
    "message": "GitHub API rate limit exceeded",
    "details": {
      "rate_limit_reset": "2024-03-15T11:00:00Z",
      "retry_after": 1800
    },
    "timestamp": "2024-03-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_12345",
    "execution_time_ms": 1250
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|------------|------|
| `INVALID_REQUEST` | 400 | 잘못된 요청 |
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `GITHUB_API_ERROR` | 502 | GitHub API 오류 |
| `SLACK_API_ERROR` | 502 | Slack API 오류 |
| `ANALYSIS_TIMEOUT` | 504 | 분석 시간 초과 |
| `INTERNAL_ERROR` | 500 | 내부 서버 오류 |

## Rate Limiting

### 제한 정책
- **워크스페이스별**: 1000 requests/hour
- **사용자별**: 100 requests/hour
- **IP별**: 500 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1647334200
X-RateLimit-Retry-After: 3600
```

## Webhooks

### GitHub Webhook
분석 대상 저장소의 변경사항 감지

```
POST /webhooks/github
```

### Slack App Events
Slack 이벤트 수신

```
POST /webhooks/slack
```