# TASK-202: 플로우 추적 엔진 TDD 요구사항

## 1. 핵심 기능 요구사항

### 1.1 플로우 추적 엔진 (FlowTracker)
- **목적**: Client → API → Server → DB까지의 코드 플로우를 추적
- **입력**:
  - clientv/router.ts의 API 엔드포인트 정보
  - AST 파서에서 추출된 파일별 메타데이터
- **출력**:
  - 계층적 플로우 트리 구조
  - 의존성 그래프
  - 순환 의존성 정보

### 1.2 진입점 탐지 (EntryPointDetector)
- **목적**: clientv/router.ts에서 API 엔드포인트를 자동 탐지
- **기능**:
  - 라우터 파일에서 엔드포인트 정의 추출
  - HTTP 메소드 및 경로 패턴 식별
  - 핸들러 함수 매핑

### 1.3 의존성 매핑 (DependencyMapper)
- **목적**: API 엔드포인트와 서버 코드 간의 매핑 관계 구축
- **기능**:
  - Import/Export 관계 분석
  - 함수 호출 체인 추적
  - 데이터베이스 쿼리 감지

### 1.4 플로우 그래프 생성 (FlowGraphGenerator)
- **목적**: 추적된 정보를 그래프 구조로 변환
- **기능**:
  - 노드: 파일, 함수, API 엔드포인트
  - 엣지: 호출 관계, 의존성 관계
  - 메타데이터: 위치 정보, 타입 정보

## 2. 제약 조건

### 2.1 성능 요구사항
- 최대 플로우 깊이: 10단계 (무한 루프 방지)
- 파일 수 제한: 1,000개 이하
- 메모리 사용량: 500MB 이하

### 2.2 안전성 요구사항
- 순환 의존성 감지 및 처리
- 파일 접근 오류 시 graceful 처리
- 잘못된 AST 데이터 처리

### 2.3 확장성 요구사항
- 다양한 프레임워크 지원 가능한 구조
- 플러그인 형태로 확장 가능

## 3. 데이터 구조

### 3.1 FlowNode
```typescript
interface FlowNode {
  id: string;
  type: 'file' | 'function' | 'endpoint' | 'database';
  name: string;
  filePath: string;
  position?: CodePosition;
  metadata: Record<string, any>;
}
```

### 3.2 FlowEdge
```typescript
interface FlowEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: 'call' | 'import' | 'dependency';
  metadata: Record<string, any>;
}
```

### 3.3 FlowGraph
```typescript
interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  entryPoints: string[]; // entry node ids
  circularDependencies: string[][];
  statistics: {
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
  };
}
```

## 4. 주요 알고리즘

### 4.1 플로우 추적 알고리즘
1. 진입점(API 엔드포인트)에서 시작
2. DFS/BFS로 의존성 트리 탐색
3. 방문한 노드 기록으로 순환 감지
4. 최대 깊이 도달 시 탐색 중단

### 4.2 순환 의존성 감지
1. Tarjan's Strongly Connected Components 알고리즘 사용
2. 강하게 연결된 컴포넌트 탐지
3. 크기가 1보다 큰 SCC가 순환 의존성

## 5. 에러 처리

### 5.1 파일 접근 오류
- 파일이 존재하지 않는 경우
- 파싱할 수 없는 파일 형식
- 권한 부족

### 5.2 데이터 무결성 오류
- 잘못된 AST 데이터
- 누락된 메타데이터
- 일치하지 않는 참조

### 5.3 성능 오류
- 메모리 부족
- 시간 초과
- 스택 오버플로우 (깊은 재귀)

## 6. 테스트 시나리오

### 6.1 기본 플로우 추적
- 단일 API → 단일 함수 → 단일 DB 쿼리
- 다중 API → 공통 서비스 함수
- 중첩된 함수 호출 체인

### 6.2 복잡한 시나리오
- 순환 의존성이 있는 파일들
- 동적 import를 사용하는 코드
- 데코레이터가 적용된 클래스들

### 6.3 에러 시나리오
- 존재하지 않는 파일 참조
- 깨진 import 경로
- 무한 재귀 구조

## 7. 성능 지표

### 7.1 처리 속도
- 100개 파일: < 1초
- 500개 파일: < 5초
- 1000개 파일: < 10초

### 7.2 정확도
- API 엔드포인트 탐지율: > 95%
- 의존성 매핑 정확도: > 90%
- 순환 의존성 감지율: 100%

## 8. 사용 예시

```typescript
const flowTracker = new FlowTracker({
  maxDepth: 10,
  maxNodes: 1000,
  enableCircularDetection: true
});

const astData = await astParser.parseMultipleFiles(sourceFiles);
const flowGraph = await flowTracker.buildFlowGraph(astData, {
  entryPointPattern: 'clientv/router.ts',
  includeTests: false
});

console.log(`Found ${flowGraph.statistics.totalNodes} nodes`);
console.log(`Found ${flowGraph.circularDependencies.length} circular dependencies`);
```