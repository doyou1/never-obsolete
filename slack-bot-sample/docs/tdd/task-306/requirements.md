# TASK-306: 성능 분석기 - 요구사항

## 1. 기능 요구사항

### 1.1 성능 병목점 검사
- 코드 실행 성능 분석
- 메모리 사용량 최적화 지점 탐지
- CPU 집약적 코드 패턴 식별
- I/O 병목점 분석

### 1.2 알고리즘 복잡도 분석
- 시간 복잡도 자동 계산
- 공간 복잡도 분석
- 비효율적 알고리즘 패턴 검출
- 최적화 가능한 루프 구조 식별

### 1.3 리소스 사용량 분석
- 메모리 누수 패턴 검출
- 불필요한 객체 생성 분석
- 파일 핸들링 효율성 검사
- 네트워크 요청 최적화 분석

### 1.4 데이터베이스 성능 분석
- 비효율적 쿼리 패턴 검출
- N+1 쿼리 문제 식별
- 인덱스 사용 최적화 분석
- 대용량 데이터 처리 패턴 검사

## 2. 기술 요구사항

### 2.1 성능 분석기 인터페이스
```typescript
interface IPerformanceAnalyzer {
  // 종합 성능 분석
  analyzePerformance(context: PerformanceAnalysisContext): Promise<PerformanceAnalysisResult>;

  // 병목점 검출
  detectBottlenecks(files: FileContent[]): Promise<BottleneckAnalysisResult>;

  // 알고리즘 복잡도 분석
  analyzeAlgorithmComplexity(files: FileContent[]): Promise<ComplexityAnalysisResult>;

  // 메모리 사용량 분석
  analyzeMemoryUsage(files: FileContent[]): Promise<MemoryAnalysisResult>;

  // 데이터베이스 성능 분석
  analyzeDatabasePerformance(files: FileContent[]): Promise<DatabasePerformanceResult>;
}
```

### 2.2 성능 분석 결과 모델
```typescript
interface PerformanceAnalysisResult {
  id: string;
  overallPerformanceScore: number; // 0-100
  performanceLevel: 'excellent' | 'good' | 'moderate' | 'poor';
  bottlenecks: PerformanceBottleneck[];
  complexityIssues: ComplexityIssue[];
  memoryIssues: MemoryIssue[];
  databaseIssues: DatabasePerformanceIssue[];
  optimizationRecommendations: OptimizationRecommendation[];
  performanceMetrics: PerformanceMetrics;
  generatedAt: Date;
  analysisVersion: string;
}

interface PerformanceBottleneck {
  id: string;
  type: BottleneckType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: SourceLocation;
  impact: PerformanceImpact;
  estimatedSlowdown: number; // percentage
  recommendation: string;
  codeExample: string;
}

interface ComplexityIssue {
  id: string;
  complexityType: 'time' | 'space';
  currentComplexity: string; // O(n), O(n²), etc.
  expectedComplexity: string;
  severity: 'medium' | 'high' | 'critical';
  location: SourceLocation;
  algorithmType: string;
  optimizationSuggestion: string;
}

interface MemoryIssue {
  id: string;
  issueType: MemoryIssueType;
  severity: 'low' | 'medium' | 'high';
  location: SourceLocation;
  description: string;
  memoryImpact: number; // estimated MB
  recommendation: string;
  codePattern: string;
}

interface DatabasePerformanceIssue {
  id: string;
  issueType: DatabaseIssueType;
  severity: 'medium' | 'high' | 'critical';
  location: SourceLocation;
  queryPattern: string;
  estimatedImpact: string;
  optimizationSuggestion: string;
}
```

### 2.3 성능 분석 컨텍스트
```typescript
interface PerformanceAnalysisContext {
  files: FileContent[];
  language: string;
  framework?: string;
  environment: 'development' | 'production' | 'testing';
  targetPerformance: PerformanceTarget;
  analysisOptions: PerformanceAnalysisOptions;
}

interface PerformanceAnalysisOptions {
  enableBottleneckDetection: boolean;
  enableComplexityAnalysis: boolean;
  enableMemoryAnalysis: boolean;
  enableDatabaseAnalysis: boolean;
  performanceThreshold: PerformanceThreshold;
  customRules?: PerformanceRule[];
}

interface PerformanceThreshold {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  maxDatabaseQueryTime: number; // milliseconds
  maxComplexity: string; // O(n²) 등
}

interface PerformanceTarget {
  targetLatency: number; // milliseconds
  targetThroughput: number; // requests per second
  targetMemoryLimit: number; // MB
  targetCpuUsage: number; // percentage
}
```

## 3. 클래스 구조

### 3.1 PerformanceAnalyzer
- 메인 성능 분석 엔진
- 각 성능 분석 모듈 조율
- 결과 통합 및 우선순위 정렬

### 3.2 BottleneckDetector
- 성능 병목점 자동 탐지
- 코드 패턴 기반 병목점 식별
- 실행 시간 예측 모델링

### 3.3 ComplexityAnalyzer
- 알고리즘 시간/공간 복잡도 계산
- 중첩 루프 분석
- 재귀 함수 복잡도 계산

### 3.4 MemoryAnalyzer
- 메모리 사용 패턴 분석
- 메모리 누수 위험 검출
- 가비지 컬렉션 영향 분석

### 3.5 DatabaseAnalyzer
- SQL 쿼리 성능 분석
- N+1 쿼리 패턴 검출
- 인덱스 최적화 제안

### 3.6 OptimizationEngine
- 최적화 방안 생성
- 성능 개선 우선순위 계산
- 코드 개선 예시 제공

## 4. 성능 패턴 분석

### 4.1 JavaScript/TypeScript 성능 패턴
- 비동기 처리 최적화
- DOM 조작 성능 패턴
- 메모리 관리 패턴
- 번들링 최적화 분석

### 4.2 Python 성능 패턴
- 리스트 컴프리헨션 vs 반복문
- 딕셔너리 vs 리스트 사용 패턴
- NumPy 벡터화 최적화
- 메모리 효율적 데이터 구조

### 4.3 Java 성능 패턴
- 컬렉션 성능 최적화
- 스트림 API 효율성
- JVM 메모리 관리
- 동시성 성능 패턴

### 4.4 Go 성능 패턴
- 고루틴 성능 최적화
- 채널 사용 패턴
- 메모리 할당 최적화
- 동시성 패턴 분석

## 5. 병목점 검출 패턴

### 5.1 반복문 최적화
```typescript
const INEFFICIENT_LOOP_PATTERNS = {
  nested_loops: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)/g,
  array_length_in_loop: /for\s*\([^;]*;\s*\w+\s*<\s*\w+\.length/g,
  object_creation_in_loop: /for\s*\([^)]*\)\s*\{[^}]*new\s+\w+/g,
  dom_query_in_loop: /for\s*\([^)]*\)\s*\{[^}]*document\./g
};
```

### 5.2 메모리 비효율 패턴
```typescript
const MEMORY_INEFFICIENT_PATTERNS = {
  memory_leak: /setInterval\s*\([^}]*\}[^}]*\)/g,
  large_array_copy: /\[\.\.\..*\]/g,
  unnecessary_closure: /function\s*\([^)]*\)\s*\{[^}]*function/g,
  global_variables: /var\s+\w+\s*=|let\s+\w+\s*=.*global/g
};
```

### 5.3 데이터베이스 성능 패턴
```typescript
const DATABASE_PERFORMANCE_PATTERNS = {
  n_plus_one: /\.forEach\s*\([^}]*\{[^}]*\.(find|findOne|query)/g,
  missing_index: /SELECT.*WHERE.*=.*(?!.*INDEX)/g,
  large_dataset: /SELECT\s*\*\s*FROM.*(?!.*LIMIT)/g,
  inefficient_join: /JOIN.*JOIN.*JOIN/g
};
```

## 6. 복잡도 분석 알고리즘

### 6.1 시간 복잡도 계산
- 단일 루프: O(n)
- 중첩 루프: O(n²), O(n³) 등
- 재귀 함수: 마스터 정리 적용
- 정렬 알고리즘: O(n log n)

### 6.2 공간 복잡도 계산
- 변수 할당 분석
- 배열/객체 크기 계산
- 재귀 호출 스택 분석
- 메모리 사용 패턴 추적

### 6.3 알고리즘 패턴 인식
```typescript
const ALGORITHM_PATTERNS = {
  bubble_sort: /for.*for.*if.*>.*swap/,
  linear_search: /for.*if.*===.*return/,
  binary_search: /while.*mid.*Math\.floor/,
  recursive_fibonacci: /function.*fib.*return.*fib.*\+.*fib/
};
```

## 7. 성능 메트릭

### 7.1 실행 시간 메트릭
- 평균 실행 시간
- 최대 실행 시간
- 시간 복잡도 등급
- 병목점 개수

### 7.2 메모리 사용 메트릭
- 메모리 사용량 추정
- 메모리 누수 위험도
- 가비지 컬렉션 빈도
- 객체 생성 패턴

### 7.3 데이터베이스 메트릭
- 쿼리 실행 시간 추정
- 인덱스 활용도
- N+1 쿼리 발생 횟수
- 데이터 전송량

## 8. 최적화 권장사항

### 8.1 알고리즘 최적화
```typescript
interface AlgorithmOptimization {
  currentPattern: string;
  suggestedPattern: string;
  improvementRatio: number;
  difficulty: 'easy' | 'medium' | 'hard';
  example: {
    before: string;
    after: string;
    explanation: string;
  };
}
```

### 8.2 메모리 최적화
```typescript
interface MemoryOptimization {
  issue: string;
  solution: string;
  memorySaved: number; // MB
  implementation: string[];
  tradeoffs: string[];
}
```

### 8.3 데이터베이스 최적화
```typescript
interface DatabaseOptimization {
  queryType: string;
  currentQuery: string;
  optimizedQuery: string;
  performanceGain: string;
  indexSuggestions: string[];
}
```

## 9. 성능 점수 계산

### 9.1 점수 산정 공식
```typescript
PerformanceScore = 100 - (
  BottleneckPenalty +
  ComplexityPenalty +
  MemoryPenalty +
  DatabasePenalty
);

BottleneckPenalty = CriticalBottlenecks * 25 + HighBottlenecks * 15 + MediumBottlenecks * 8;
ComplexityPenalty = HighComplexityFunctions * 10 + ExcessiveComplexity * 20;
MemoryPenalty = MemoryLeaks * 15 + InefficiientMemoryUsage * 5;
DatabasePenalty = N_Plus_One_Queries * 20 + SlowQueries * 10;
```

### 9.2 성능 등급 분류
- **Excellent** (90-100): 최적화된 성능
- **Good** (75-89): 양호한 성능
- **Moderate** (60-74): 개선 여지 있음
- **Poor** (0-59): 성능 문제 심각

## 10. 프레임워크별 성능 분석

### 10.1 React 성능 분석
- 불필요한 렌더링 검출
- 메모이제이션 최적화
- 컴포넌트 분할 제안
- 상태 관리 최적화

### 10.2 Express.js 성능 분석
- 미들웨어 순서 최적화
- 응답 시간 분석
- 메모리 누수 검출
- 비동기 처리 최적화

### 10.3 Django 성능 분석
- ORM 쿼리 최적화
- 템플릿 렌더링 성능
- 캐싱 전략 분석
- 미들웨어 성능 검사

### 10.4 Spring Boot 성능 분석
- 빈 초기화 최적화
- JPA 쿼리 성능
- 메모리 풀 설정
- 스레드 풀 최적화

## 11. 성능 테스트 통합

### 11.1 벤치마크 생성
- 자동 성능 테스트 코드 생성
- 부하 테스트 시나리오 제안
- 성능 기준점 설정
- 회귀 테스트 계획

### 11.2 프로파일링 도구 연동
- Chrome DevTools 연동
- Node.js Profiler 활용
- Python cProfile 통합
- Java JProfiler 연동

### 11.3 모니터링 설정
- APM 도구 설정 제안
- 성능 알림 기준 설정
- 대시보드 구성 가이드
- 로깅 최적화 방안

## 12. 사용 예시

### 12.1 기본 성능 분석
```typescript
const analyzer = new PerformanceAnalyzer();

const context: PerformanceAnalysisContext = {
  files: codeFiles,
  language: 'typescript',
  framework: 'react',
  environment: 'production',
  targetPerformance: {
    targetLatency: 100,
    targetThroughput: 1000,
    targetMemoryLimit: 512,
    targetCpuUsage: 70
  },
  analysisOptions: {
    enableBottleneckDetection: true,
    enableComplexityAnalysis: true,
    enableMemoryAnalysis: true,
    enableDatabaseAnalysis: false,
    performanceThreshold: {
      maxExecutionTime: 1000,
      maxMemoryUsage: 256,
      maxDatabaseQueryTime: 100,
      maxComplexity: 'O(n²)'
    }
  }
};

const result = await analyzer.analyzePerformance(context);
console.log(`Performance Score: ${result.overallPerformanceScore}`);
```

### 12.2 병목점 검출
```typescript
const bottlenecks = await analyzer.detectBottlenecks(files);
bottlenecks.bottlenecks.forEach(bottleneck => {
  console.log(`${bottleneck.type}: ${bottleneck.description}`);
  console.log(`Impact: ${bottleneck.estimatedSlowdown}% slowdown`);
});
```

### 12.3 복잡도 분석
```typescript
const complexity = await analyzer.analyzeAlgorithmComplexity(files);
complexity.issues.forEach(issue => {
  console.log(`${issue.algorithmType}: ${issue.currentComplexity} → ${issue.expectedComplexity}`);
});
```

## 13. 최적화 제안 엔진

### 13.1 자동 최적화 제안
- 코드 패턴 기반 자동 제안
- 성능 개선 우선순위 계산
- 구현 난이도 평가
- 예상 성능 향상 계산

### 13.2 코드 변환 예시
```typescript
interface CodeOptimizationSuggestion {
  issueType: string;
  originalCode: string;
  optimizedCode: string;
  explanation: string;
  performanceImprovement: string;
  complexity: 'easy' | 'medium' | 'hard';
}
```

### 13.3 A/B 테스트 제안
- 성능 개선 전후 비교
- 측정 방법 제안
- 성공 기준 설정
- 롤백 계획 수립

## 14. 에러 처리 및 복구

### 14.1 분석 실패 처리
- 부분 분석 결과 제공
- 오류 상세 로깅
- 분석 재시도 전략

### 14.2 성능 데이터 검증
- 분석 결과 신뢰도 평가
- 통계적 유의성 검증
- 이상치 데이터 필터링

### 14.3 점진적 분석
- 대용량 코드베이스 분할 처리
- 메모리 제한 상황 대응
- 시간 제한 내 최적 분석

## 15. 성능 보고서 생성

### 15.1 개발자용 보고서
- 상세한 기술적 분석
- 코드 예시 및 해결책
- 구현 가이드라인
- 성능 측정 방법

### 15.2 관리자용 요약 보고서
- 전체 성능 점수
- 주요 병목점 요약
- 개선 우선순위
- 리소스 투자 제안

### 15.3 자동화 도구 연동
- CI/CD 파이프라인 통합
- 성능 회귀 검출
- 자동 알림 시스템
- 성능 트렌드 분석

## 16. 성능 기준점 설정

### 16.1 업계 표준 벤치마크
- 언어별 성능 기준
- 프레임워크별 최적 성능
- 하드웨어 사양별 기준
- 사용자 경험 기준

### 16.2 커스텀 성능 목표
- 프로젝트별 성능 요구사항
- 비즈니스 목표 연동
- SLA 기준 설정
- 성능 예산 관리

### 16.3 성능 회귀 방지
- 성능 기준점 자동 업데이트
- 변경사항 영향도 분석
- 성능 저하 조기 경보
- 자동 롤백 트리거