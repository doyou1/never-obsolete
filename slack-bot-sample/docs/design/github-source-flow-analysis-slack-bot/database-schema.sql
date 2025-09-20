-- GitHub 소스코드 플로우 분석 Slack Bot 데이터베이스 스키마
-- PostgreSQL 13+ 호환

-- =====================================
-- Extensions
-- =====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================
-- Enums
-- =====================================
CREATE TYPE analysis_status AS ENUM (
    'pending',
    'fetching_github_data',
    'analyzing_code',
    'generating_report',
    'completed',
    'failed',
    'timeout'
);

CREATE TYPE issue_type AS ENUM (
    'issue',
    'pr',
    'auto'
);

CREATE TYPE analysis_depth AS ENUM (
    'shallow',
    'deep'
);

CREATE TYPE output_format AS ENUM (
    'tree',
    'diagram',
    'json'
);

CREATE TYPE flow_node_type AS ENUM (
    'router',
    'api_endpoint',
    'controller',
    'service',
    'repository',
    'model',
    'database',
    'external_api',
    'middleware',
    'utility'
);

CREATE TYPE flow_edge_type AS ENUM (
    'import',
    'function_call',
    'api_request',
    'database_query',
    'data_flow',
    'dependency'
);

CREATE TYPE file_type AS ENUM (
    'typescript',
    'javascript',
    'tsx',
    'jsx',
    'json',
    'sql',
    'md'
);

CREATE TYPE error_type AS ENUM (
    'github_api',
    'parsing',
    'analysis',
    'timeout',
    'file_too_large'
);

CREATE TYPE warning_type AS ENUM (
    'missing_validation',
    'no_error_handling',
    'circular_dependency',
    'performance'
);

CREATE TYPE warning_severity AS ENUM (
    'low',
    'medium',
    'high'
);

-- =====================================
-- Core Tables
-- =====================================

-- 분석 요청 테이블
CREATE TABLE analysis_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_url TEXT NOT NULL,
    issue_type issue_type NOT NULL DEFAULT 'auto',
    analysis_depth analysis_depth NOT NULL DEFAULT 'shallow',
    output_format output_format NOT NULL DEFAULT 'tree',

    -- 사용자 정보
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    workspace_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255),
    channel_name VARCHAR(255),

    -- 상태 정보
    status analysis_status NOT NULL DEFAULT 'pending',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

    -- GitHub 메타데이터
    github_repo_owner VARCHAR(255),
    github_repo_name VARCHAR(255),
    github_issue_number INTEGER,
    github_pr_number INTEGER,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- JSON 메타데이터
    metadata JSONB DEFAULT '{}',

    -- Slack 관련
    slack_message_ts VARCHAR(255),
    slack_thread_ts VARCHAR(255)
);

-- 분석 결과 테이블
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES analysis_requests(id) ON DELETE CASCADE,

    -- 분석 결과 데이터
    flow_data JSONB NOT NULL,
    markdown_report TEXT,
    markdown_file_path VARCHAR(500),

    -- 통계 정보
    total_files INTEGER DEFAULT 0,
    analyzed_files INTEGER DEFAULT 0,
    skipped_files INTEGER DEFAULT 0,
    api_endpoints_count INTEGER DEFAULT 0,
    database_queries_count INTEGER DEFAULT 0,
    potential_issues_count INTEGER DEFAULT 0,
    flow_depth INTEGER DEFAULT 0,

    -- 성능 정보
    execution_time_ms INTEGER,
    github_api_calls INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,

    -- 엔트리 포인트
    entry_points TEXT[],

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 분석 대상 파일 테이블
CREATE TABLE analyzed_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,

    -- 파일 정보
    file_path VARCHAR(1000) NOT NULL,
    file_type file_type NOT NULL,
    file_size_bytes INTEGER,
    content_hash VARCHAR(64),

    -- 분석 결과
    ast_data JSONB,
    imports_count INTEGER DEFAULT 0,
    exports_count INTEGER DEFAULT 0,
    functions_count INTEGER DEFAULT 0,
    classes_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    database_queries_count INTEGER DEFAULT 0,

    -- 상태
    is_analyzed BOOLEAN DEFAULT FALSE,
    is_skipped BOOLEAN DEFAULT FALSE,
    skip_reason VARCHAR(255),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 플로우 노드 테이블
CREATE TABLE flow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,

    -- 노드 정보
    node_id VARCHAR(255) NOT NULL,
    node_type flow_node_type NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    line_number INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code_snippet TEXT,

    -- 메타데이터
    metadata JSONB DEFAULT '{}',

    -- 인덱스용 복합 키
    UNIQUE(result_id, node_id)
);

-- 플로우 엣지 테이블
CREATE TABLE flow_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,

    -- 엣지 정보
    edge_id VARCHAR(255) NOT NULL,
    from_node_id VARCHAR(255) NOT NULL,
    to_node_id VARCHAR(255) NOT NULL,
    edge_type flow_edge_type NOT NULL,
    description TEXT,

    -- 메타데이터
    metadata JSONB DEFAULT '{}',

    -- 인덱스용 복합 키
    UNIQUE(result_id, edge_id)
);

-- 분석 에러 테이블
CREATE TABLE analysis_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES analysis_requests(id) ON DELETE CASCADE,

    -- 에러 정보
    error_type error_type NOT NULL,
    message TEXT NOT NULL,
    file_path VARCHAR(1000),
    line_number INTEGER,

    -- 상세 정보
    details JSONB DEFAULT '{}',
    stack_trace TEXT,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 분석 경고 테이블
CREATE TABLE analysis_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES analysis_requests(id) ON DELETE CASCADE,

    -- 경고 정보
    warning_type warning_type NOT NULL,
    severity warning_severity NOT NULL DEFAULT 'medium',
    message TEXT NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    line_number INTEGER,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 캐시 테이블
CREATE TABLE cache_entries (
    key VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    hit_count INTEGER DEFAULT 0,
    size_bytes INTEGER
);

-- 사용자 워크스페이스 테이블
CREATE TABLE user_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id VARCHAR(255) NOT NULL,
    workspace_name VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),

    -- 권한 정보
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    max_requests_per_day INTEGER DEFAULT 100,

    -- 사용량 통계
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    last_request_at TIMESTAMP WITH TIME ZONE,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 유니크 제약
    UNIQUE(workspace_id, user_id)
);

-- 일일 사용량 추적 테이블
CREATE TABLE daily_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,

    -- 사용량 카운터
    requests_count INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_execution_time_ms BIGINT DEFAULT 0,
    github_api_calls INTEGER DEFAULT 0,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 유니크 제약
    UNIQUE(workspace_id, user_id, date)
);

-- =====================================
-- Indexes
-- =====================================

-- analysis_requests 인덱스
CREATE INDEX idx_analysis_requests_status ON analysis_requests(status);
CREATE INDEX idx_analysis_requests_created_at ON analysis_requests(created_at);
CREATE INDEX idx_analysis_requests_workspace_user ON analysis_requests(workspace_id, user_id);
CREATE INDEX idx_analysis_requests_github_url ON analysis_requests USING hash(github_url);
CREATE INDEX idx_analysis_requests_metadata ON analysis_requests USING gin(metadata);

-- analysis_results 인덱스
CREATE INDEX idx_analysis_results_request_id ON analysis_results(request_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at);
CREATE INDEX idx_analysis_results_flow_data ON analysis_results USING gin(flow_data);

-- analyzed_files 인덱스
CREATE INDEX idx_analyzed_files_result_id ON analyzed_files(result_id);
CREATE INDEX idx_analyzed_files_file_path ON analyzed_files(file_path);
CREATE INDEX idx_analyzed_files_file_type ON analyzed_files(file_type);
CREATE INDEX idx_analyzed_files_content_hash ON analyzed_files(content_hash);

-- flow_nodes 인덱스
CREATE INDEX idx_flow_nodes_result_id ON flow_nodes(result_id);
CREATE INDEX idx_flow_nodes_node_type ON flow_nodes(node_type);
CREATE INDEX idx_flow_nodes_file_path ON flow_nodes(file_path);
CREATE INDEX idx_flow_nodes_name ON flow_nodes USING gin(name gin_trgm_ops);

-- flow_edges 인덱스
CREATE INDEX idx_flow_edges_result_id ON flow_edges(result_id);
CREATE INDEX idx_flow_edges_from_to ON flow_edges(from_node_id, to_node_id);
CREATE INDEX idx_flow_edges_edge_type ON flow_edges(edge_type);

-- analysis_errors 인덱스
CREATE INDEX idx_analysis_errors_request_id ON analysis_errors(request_id);
CREATE INDEX idx_analysis_errors_error_type ON analysis_errors(error_type);
CREATE INDEX idx_analysis_errors_created_at ON analysis_errors(created_at);

-- analysis_warnings 인덱스
CREATE INDEX idx_analysis_warnings_request_id ON analysis_warnings(request_id);
CREATE INDEX idx_analysis_warnings_warning_type ON analysis_warnings(warning_type);
CREATE INDEX idx_analysis_warnings_severity ON analysis_warnings(severity);

-- cache_entries 인덱스
CREATE INDEX idx_cache_entries_expires_at ON cache_entries(expires_at);
CREATE INDEX idx_cache_entries_created_at ON cache_entries(created_at);

-- user_workspaces 인덱스
CREATE INDEX idx_user_workspaces_workspace_id ON user_workspaces(workspace_id);
CREATE INDEX idx_user_workspaces_user_id ON user_workspaces(user_id);
CREATE INDEX idx_user_workspaces_is_active ON user_workspaces(is_active);

-- daily_usage 인덱스
CREATE INDEX idx_daily_usage_workspace_user ON daily_usage(workspace_id, user_id);
CREATE INDEX idx_daily_usage_date ON daily_usage(date);

-- =====================================
-- Triggers
-- =====================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거들
CREATE TRIGGER update_analysis_requests_updated_at
    BEFORE UPDATE ON analysis_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at
    BEFORE UPDATE ON analysis_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_entries_updated_at
    BEFORE UPDATE ON cache_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workspaces_updated_at
    BEFORE UPDATE ON user_workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_usage_updated_at
    BEFORE UPDATE ON daily_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- Views
-- =====================================

-- 분석 요청 요약 뷰
CREATE VIEW analysis_request_summary AS
SELECT
    ar.id,
    ar.github_url,
    ar.issue_type,
    ar.status,
    ar.user_id,
    ar.user_name,
    ar.workspace_id,
    ar.created_at,
    ar.completed_at,
    ares.total_files,
    ares.analyzed_files,
    ares.execution_time_ms,
    CASE
        WHEN ar.completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (ar.completed_at - ar.created_at)) * 1000
        ELSE NULL
    END as total_duration_ms,
    COUNT(ae.id) as error_count,
    COUNT(aw.id) as warning_count
FROM analysis_requests ar
LEFT JOIN analysis_results ares ON ar.id = ares.request_id
LEFT JOIN analysis_errors ae ON ar.id = ae.request_id
LEFT JOIN analysis_warnings aw ON ar.id = aw.request_id
GROUP BY ar.id, ares.id;

-- 사용자별 통계 뷰
CREATE VIEW user_statistics AS
SELECT
    uw.workspace_id,
    uw.user_id,
    uw.user_name,
    COUNT(ar.id) as total_requests,
    COUNT(CASE WHEN ar.status = 'completed' THEN 1 END) as successful_requests,
    COUNT(CASE WHEN ar.status = 'failed' THEN 1 END) as failed_requests,
    AVG(ares.execution_time_ms) as avg_execution_time_ms,
    MAX(ar.created_at) as last_request_at,
    SUM(ares.total_files) as total_files_analyzed
FROM user_workspaces uw
LEFT JOIN analysis_requests ar ON uw.workspace_id = ar.workspace_id AND uw.user_id = ar.user_id
LEFT JOIN analysis_results ares ON ar.id = ares.request_id
WHERE uw.is_active = true
GROUP BY uw.workspace_id, uw.user_id, uw.user_name;

-- =====================================
-- Functions
-- =====================================

-- 캐시 만료 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_entries WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 일일 사용량 업데이트 함수
CREATE OR REPLACE FUNCTION update_daily_usage(
    p_workspace_id VARCHAR(255),
    p_user_id VARCHAR(255),
    p_execution_time_ms INTEGER DEFAULT 0,
    p_github_api_calls INTEGER DEFAULT 0,
    p_is_successful BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_usage (workspace_id, user_id, date, requests_count, successful_requests, failed_requests, total_execution_time_ms, github_api_calls)
    VALUES (
        p_workspace_id,
        p_user_id,
        CURRENT_DATE,
        1,
        CASE WHEN p_is_successful THEN 1 ELSE 0 END,
        CASE WHEN p_is_successful THEN 0 ELSE 1 END,
        p_execution_time_ms,
        p_github_api_calls
    )
    ON CONFLICT (workspace_id, user_id, date)
    DO UPDATE SET
        requests_count = daily_usage.requests_count + 1,
        successful_requests = daily_usage.successful_requests + CASE WHEN p_is_successful THEN 1 ELSE 0 END,
        failed_requests = daily_usage.failed_requests + CASE WHEN p_is_successful THEN 0 ELSE 1 END,
        total_execution_time_ms = daily_usage.total_execution_time_ms + p_execution_time_ms,
        github_api_calls = daily_usage.github_api_calls + p_github_api_calls,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- Initial Data
-- =====================================

-- 기본 워크스페이스 설정 (예시)
INSERT INTO user_workspaces (workspace_id, workspace_name, user_id, user_name, is_admin, max_requests_per_day)
VALUES
    ('T1234567890', 'Example Workspace', 'U1234567890', 'admin', true, 1000),
    ('T1234567890', 'Example Workspace', 'U0987654321', 'developer', false, 100)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- =====================================
-- Comments
-- =====================================

COMMENT ON TABLE analysis_requests IS '분석 요청 정보를 저장하는 테이블';
COMMENT ON TABLE analysis_results IS '분석 결과를 저장하는 테이블';
COMMENT ON TABLE analyzed_files IS '분석된 파일 정보를 저장하는 테이블';
COMMENT ON TABLE flow_nodes IS '코드 플로우의 노드 정보를 저장하는 테이블';
COMMENT ON TABLE flow_edges IS '코드 플로우의 엣지(연결) 정보를 저장하는 테이블';
COMMENT ON TABLE analysis_errors IS '분석 중 발생한 에러를 저장하는 테이블';
COMMENT ON TABLE analysis_warnings IS '분석 중 발견한 경고를 저장하는 테이블';
COMMENT ON TABLE cache_entries IS 'GitHub API 응답 및 분석 결과 캐시를 저장하는 테이블';
COMMENT ON TABLE user_workspaces IS '사용자 워크스페이스 정보를 저장하는 테이블';
COMMENT ON TABLE daily_usage IS '일일 사용량 통계를 저장하는 테이블';