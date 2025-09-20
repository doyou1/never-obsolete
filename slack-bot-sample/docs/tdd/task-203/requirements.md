# TASK-203: 분석 결과 생성기 - 요구사항

## 1. 기능 요구사항

### 1.1 계층적 트리 구조 포맷팅
- AST 파서와 플로우 트래커의 결과를 받아 계층적 트리 구조로 포맷팅
- Client → API → Server → DB 플로우를 명확히 표현
- 각 노드의 타입에 따른 아이콘 및 레벨 표시

### 1.2 마크다운 보고서 생성
- 분석 결과를 마크다운 형식으로 변환
- 파일 링크, 함수 정보, 의존성 정보 포함
- 읽기 쉬운 구조로 정리

### 1.3 Mermaid 다이어그램 생성 (선택)
- 플로우 그래프를 Mermaid 문법으로 변환
- 노드 간 관계를 시각적으로 표현

### 1.4 잠재적 이슈 감지 및 보고
- 순환 의존성 감지 결과 보고
- 깊이 제한 초과 감지
- 단절된 노드 감지

### 1.5 타임스탬프 포함 파일명 생성
- 분석 시점 타임스탬프 포함
- 고유한 파일명 생성

## 2. 기술 요구사항

### 2.1 입력 인터페이스
```typescript
interface AnalysisInput {
  astData: ParsedSourceCode[];
  flowGraph: FlowGraph;
  metadata: {
    githubUrl: string;
    analyzedAt: Date;
    options: AnalysisOptions;
  };
}
```

### 2.2 출력 인터페이스
```typescript
interface AnalysisResult {
  reportContent: string;
  mermaidDiagram?: string;
  detectedIssues: DetectedIssue[];
  statistics: AnalysisStatistics;
  filename: string;
}
```

### 2.3 클래스 구조
- `AnalysisResultGenerator`: 메인 생성기 클래스
- `TreeFormatter`: 트리 구조 포맷팅 담당
- `MarkdownGenerator`: 마크다운 생성 담당
- `MermaidGenerator`: Mermaid 다이어그램 생성 담당
- `IssueDetector`: 이슈 감지 담당

## 3. 성능 요구사항

### 3.1 처리 시간
- 100개 파일 분석 결과 → 마크다운 변환: 1초 이내
- 메모리 사용량: 50MB 이하

### 3.2 출력 크기
- 마크다운 파일 최대 크기: 5MB
- Mermaid 다이어그램 최대 노드: 100개

## 4. 품질 요구사항

### 4.1 가독성
- 명확한 들여쓰기 구조
- 색상 코딩 (파일 타입별)
- 클릭 가능한 파일 링크

### 4.2 정확성
- 모든 노드와 엣지 정보 보존
- 플로우 순서 정확히 표현
- 메타데이터 정보 누락 없음

## 5. 에러 처리

### 5.1 입력 데이터 검증
- 빈 AST 데이터 처리
- 빈 플로우 그래프 처리
- 잘못된 메타데이터 처리

### 5.2 포맷팅 오류 처리
- 특수 문자 이스케이핑
- 긴 파일명 처리
- 깨진 링크 처리

## 6. 확장성

### 6.1 포맷 확장
- JSON 출력 지원 준비
- HTML 출력 지원 준비
- PDF 출력 지원 준비

### 6.2 플러그인 구조
- 커스텀 포맷터 플러그인 지원
- 커스텀 이슈 감지기 지원