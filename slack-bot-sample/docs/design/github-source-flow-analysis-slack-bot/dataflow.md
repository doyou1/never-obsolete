# 데이터 플로우 다이어그램

## 전체 시스템 플로우

```mermaid
flowchart TD
    A[개발자] --> B[Slack Bot]
    A --> C[Claude Code]

    B --> D[GitHub URL 분석 요청]
    C --> E[/analyze-github-url 명령]

    D --> F[GitHub API Client]
    E --> F

    F --> G[GitHub API]
    G --> H[Issue/PR 데이터]
    G --> I[소스코드 데이터]

    H --> J[Code Analysis Engine]
    I --> J

    J --> K[AST Parser]
    K --> L[Flow Tracker]
    L --> M[Dependency Analyzer]

    M --> N[분석 결과]
    N --> O[Report Generator]

    O --> P[마크다운 보고서]
    O --> Q[Slack 메시지]

    P --> R[파일 저장]
    Q --> S[Slack 채널 전송]

    C --> T[/export-to-slack 명령]
    R --> T
    T --> S

    style A fill:#e1f5fe
    style J fill:#f3e5f5
    style O fill:#e8f5e8
```

## GitHub 연동 플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant S as Slack Bot
    participant G as GitHub API
    participant A as Analysis Engine
    participant R as Redis Cache

    U->>S: /analyze-repo [GitHub URL]
    S->>S: URL 검증 및 파싱

    alt 캐시 확인
        S->>R: 캐시된 분석 결과 조회
        R-->>S: 캐시 미스/히트
    end

    opt 캐시 미스인 경우
        S->>G: Issue/PR 메타데이터 요청
        G-->>S: Issue/PR 정보

        S->>G: 소스코드 파일 목록 요청
        G-->>S: 파일 트리

        loop 각 소스파일
            S->>G: 파일 내용 요청
            G-->>S: 파일 내용
        end

        S->>A: 코드 분석 요청
        A-->>S: 분석 결과

        S->>R: 분석 결과 캐싱
    end

    S->>S: 응답 메시지 포맷팅
    S-->>U: 분석 결과 전송
```

## 코드 분석 엔진 플로우

```mermaid
flowchart TD
    A[소스코드 입력] --> B[파일 타입 검증]
    B --> C{지원 타입?}

    C -->|Yes| D[AST 파싱]
    C -->|No| E[스킵]

    D --> F[Import/Export 추출]
    D --> G[함수/클래스 추출]
    D --> H[API 호출 추출]

    F --> I[의존성 그래프 생성]
    G --> I
    H --> I

    I --> J[플로우 추적]
    J --> K{clientv/router.ts 발견?}

    K -->|Yes| L[라우터 분석]
    K -->|No| M[일반 플로우 분석]

    L --> N[API 엔드포인트 매핑]
    M --> N

    N --> O[서버 코드 연결]
    O --> P[DB 쿼리 연결]

    P --> Q[계층적 트리 생성]
    Q --> R[분석 결과 출력]

    style A fill:#e3f2fd
    style I fill:#f3e5f5
    style R fill:#e8f5e8
```

## Slack Bot 인터랙션 플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant S as Slack Bot
    participant W as Slack Workspace
    participant P as 분석 처리기
    participant F as 파일 시스템

    U->>W: /analyze-repo [URL] --type=pr --format=tree
    W->>S: 슬래시 명령 이벤트

    S->>S: 명령어 파싱
    S->>S: 권한 확인

    S->>W: "분석을 시작합니다..." (즉시 응답)

    S->>P: 분석 작업 큐에 추가

    loop 분석 진행
        P->>P: GitHub API 호출
        P->>P: 코드 분석 수행
        P->>W: "진행률: 30% - 소스코드 수집 중"
        P->>W: "진행률: 60% - 플로우 분석 중"
        P->>W: "진행률: 90% - 보고서 생성 중"
    end

    P->>F: 마크다운 보고서 저장
    P->>W: 최종 분석 결과 전송

    opt 에러 발생
        P->>W: 에러 메시지 및 부분 결과
    end
```

## Claude Code 명령어 플로우

```mermaid
flowchart TD
    A[개발자] --> B[Claude Code IDE]
    B --> C[/analyze-github-url 실행]

    C --> D[GitHub URL 입력]
    D --> E[GitHub API 연동]
    E --> F[소스코드 분석]

    F --> G[분석 보고서 생성]
    G --> H[타임스탬프 포함 MD 파일]

    H --> I[로컬 저장]
    I --> J[/export-to-slack 실행]

    J --> K[보고서 파일 선택]
    K --> L[Slack 포맷 변환]
    L --> M[Slack 채널 전송]

    style A fill:#e1f5fe
    style F fill:#f3e5f5
    style M fill:#e8f5e8
```

## 데이터 저장 플로우

```mermaid
erDiagram
    ANALYSIS_REQUEST {
        uuid id PK
        string github_url
        string issue_type
        timestamp created_at
        string status
        json metadata
    }

    ANALYSIS_RESULT {
        uuid id PK
        uuid request_id FK
        json flow_data
        text markdown_report
        timestamp completed_at
        int file_count
        text errors
    }

    CODE_FILE {
        uuid id PK
        uuid result_id FK
        string file_path
        string file_type
        text content_hash
        json ast_data
    }

    DEPENDENCY_EDGE {
        uuid id PK
        uuid result_id FK
        string from_file
        string to_file
        string dependency_type
        json metadata
    }

    CACHE_ENTRY {
        string key PK
        json data
        timestamp expires_at
        timestamp created_at
    }

    ANALYSIS_REQUEST ||--|| ANALYSIS_RESULT : produces
    ANALYSIS_RESULT ||--o{ CODE_FILE : contains
    ANALYSIS_RESULT ||--o{ DEPENDENCY_EDGE : has
```

## 에러 처리 플로우

```mermaid
flowchart TD
    A[요청 시작] --> B[입력 검증]
    B --> C{검증 통과?}

    C -->|No| D[400 Bad Request]
    C -->|Yes| E[GitHub API 호출]

    E --> F{API 성공?}
    F -->|No| G[GitHub 에러 처리]
    F -->|Yes| H[코드 분석 시작]

    G --> I{Rate Limit?}
    I -->|Yes| J[대기 후 재시도]
    I -->|No| K[인증 에러/404 에러]

    J --> E
    K --> L[사용자에게 에러 안내]

    H --> M{분석 성공?}
    M -->|No| N[분석 에러 처리]
    M -->|Yes| O[결과 반환]

    N --> P{타임아웃?}
    P -->|Yes| Q[부분 결과 반환]
    P -->|No| R[전체 실패]

    O --> S[성공 응답]
    Q --> T[경고와 함께 응답]
    R --> U[500 Internal Error]

    style D fill:#ffebee
    style L fill:#ffebee
    style U fill:#ffebee
    style S fill:#e8f5e8
    style T fill:#fff3e0
```

## 캐싱 전략 플로우

```mermaid
flowchart TD
    A[분석 요청] --> B[캐시 키 생성]
    B --> C[Redis 조회]

    C --> D{캐시 히트?}
    D -->|Yes| E[캐시 데이터 반환]
    D -->|No| F[GitHub API 호출]

    F --> G[코드 분석 수행]
    G --> H[결과 생성]

    H --> I[Redis에 캐시 저장]
    I --> J[TTL 설정]

    J --> K[결과 반환]
    E --> K

    subgraph "캐시 키 전략"
        L[github_url + issue_type + timestamp_hour]
        M[파일별 content_hash]
        N[분석 결과 복합키]
    end

    subgraph "TTL 전략"
        O[GitHub API: 30분]
        P[분석 결과: 24시간]
        Q[파일 내용: 1시간]
    end

    style E fill:#e8f5e8
    style I fill:#e3f2fd
```