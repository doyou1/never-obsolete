# TASK-306: 성능 분석기 - 테스트 케이스

## 1. 병목점 검출 테스트

### TC-306-001: 중첩 루프 병목점 검출
**설명**: 중첩된 반복문으로 인한 O(n²) 복잡도 병목점을 검출한다
**입력**:
```javascript
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    if (users[i].id === posts[j].userId) {
      processUserPost(users[i], posts[j]);
    }
  }
}
```
**예상결과**:
- `bottleneckType: 'nested_loops'`
- `severity: 'high'`
- `estimatedSlowdown: 75` (75% 성능 저하)
- 최적화 제안: Map 사용 또는 인덱싱

### TC-306-002: 반복문 내 DOM 조작 병목점
**설명**: 반복문 내에서 DOM을 반복적으로 조작하는 비효율적 패턴을 검출한다
**입력**:
```javascript
for (let i = 0; i < items.length; i++) {
  document.getElementById('list').appendChild(createItem(items[i]));
}
```
**예상결과**:
- `bottleneckType: 'dom_manipulation_in_loop'`
- `severity: 'medium'`
- `estimatedSlowdown: 40`
- 최적화 제안: DocumentFragment 사용

### TC-306-003: 배열 길이 반복 계산 병목점
**설명**: 반복문에서 배열 길이를 매번 계산하는 비효율적 패턴을 검출한다
**입력**:
```javascript
for (let i = 0; i < array.length; i++) {
  processItem(array[i]);
}
```
**예상결과**:
- `bottleneckType: 'array_length_recalculation'`
- `severity: 'low'`
- `estimatedSlowdown: 5`
- 최적화 제안: 길이를 변수에 캐싱

### TC-306-004: 반복문 내 객체 생성 병목점
**설명**: 반복문 내에서 불필요하게 객체를 생성하는 패턴을 검출한다
**입력**:
```javascript
for (let i = 0; i < data.length; i++) {
  const processor = new DataProcessor();
  results.push(processor.process(data[i]));
}
```
**예상결과**:
- `bottleneckType: 'object_creation_in_loop'`
- `severity: 'medium'`
- `estimatedSlowdown: 30`
- 최적화 제안: 객체 재사용 또는 팩토리 패턴

### TC-306-005: 동기 파일 I/O 병목점
**설명**: 동기식 파일 I/O 작업으로 인한 블로킹을 검출한다
**입력**:
```javascript
const data = fs.readFileSync('./large-file.json');
const parsed = JSON.parse(data);
```
**예상결과**:
- `bottleneckType: 'blocking_io'`
- `severity: 'high'`
- `estimatedSlowdown: 90`
- 최적화 제안: 비동기 I/O 사용

### TC-306-006: 메모리 누수 패턴 검출
**설명**: 이벤트 리스너나 타이머가 해제되지 않는 메모리 누수 패턴을 검출한다
**입력**:
```javascript
setInterval(() => {
  updateData();
}, 1000);
// clearInterval이 없음
```
**예상결과**:
- `bottleneckType: 'memory_leak'`
- `severity: 'critical'`
- `estimatedSlowdown: 100`
- 최적화 제안: 적절한 정리 코드 추가

## 2. 알고리즘 복잡도 분석 테스트

### TC-306-007: 버블 정렬 복잡도 분석
**설명**: 비효율적인 O(n²) 버블 정렬 알고리즘을 검출하고 복잡도를 분석한다
**입력**:
```javascript
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
```
**예상결과**:
- `currentComplexity: 'O(n²)'`
- `expectedComplexity: 'O(n log n)'`
- `algorithmType: 'sorting'`
- `severity: 'high'`
- 최적화 제안: Array.sort() 또는 퀵소트 사용

### TC-306-008: 선형 검색 복잡도 분석
**설명**: 비효율적인 선형 검색을 이진 검색으로 개선할 수 있는 경우를 검출한다
**입력**:
```javascript
function findUser(users, id) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === id) {
      return users[i];
    }
  }
  return null;
}
```
**예상결과**:
- `currentComplexity: 'O(n)'`
- `expectedComplexity: 'O(log n)'`
- `algorithmType: 'search'`
- `severity: 'medium'`
- 최적화 제안: 이진 검색 또는 해시맵 사용

### TC-306-009: 재귀 피보나치 복잡도 분석
**설명**: 지수 복잡도를 가진 재귀 피보나치 함수를 검출한다
**입력**:
```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```
**예상결과**:
- `currentComplexity: 'O(2^n)'`
- `expectedComplexity: 'O(n)'`
- `algorithmType: 'recursive'`
- `severity: 'critical'`
- 최적화 제안: 동적 프로그래밍 또는 반복문 사용

### TC-306-010: 중첩 배열 순회 복잡도 분석
**설명**: 다차원 배열을 순회하는 중첩 루프의 복잡도를 분석한다
**입력**:
```javascript
function processMatrix(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      for (let k = 0; k < matrix[i][j].length; k++) {
        processElement(matrix[i][j][k]);
      }
    }
  }
}
```
**예상결과**:
- `currentComplexity: 'O(n³)'`
- `expectedComplexity: 'O(n²)'`
- `algorithmType: 'traversal'`
- `severity: 'high'`
- 최적화 제안: 배열 구조 최적화 또는 flat() 사용

### TC-306-011: 문자열 연결 복잡도 분석
**설명**: 반복문에서 문자열을 비효율적으로 연결하는 패턴을 검출한다
**입력**:
```javascript
let result = '';
for (let i = 0; i < items.length; i++) {
  result += items[i].toString();
}
```
**예상결과**:
- `currentComplexity: 'O(n²)'`
- `expectedComplexity: 'O(n)'`
- `algorithmType: 'string_manipulation'`
- `severity: 'medium'`
- 최적화 제안: Array.join() 사용

## 3. 메모리 사용량 분석 테스트

### TC-306-012: 대용량 배열 복사 분석
**설명**: 불필요한 대용량 배열 복사로 인한 메모리 사용량 증가를 검출한다
**입력**:
```javascript
const originalArray = new Array(1000000).fill(0);
const copiedArray = [...originalArray];
const anotherCopy = originalArray.slice();
```
**예상결과**:
- `issueType: 'unnecessary_memory_allocation'`
- `memoryImpact: 24` (MB)
- `severity: 'high'`
- 최적화 제안: 참조 공유 또는 뷰 사용

### TC-306-013: 클로저 메모리 누수 분석
**설명**: 클로저에 의한 메모리 참조 유지 문제를 검출한다
**입력**:
```javascript
function createHandler(largeData) {
  return function(event) {
    // largeData를 사용하지 않지만 클로저로 참조 유지
    console.log(event.type);
  };
}
```
**예상결과**:
- `issueType: 'closure_memory_leak'`
- `memoryImpact: 50` (MB)
- `severity: 'medium'`
- 최적화 제안: 불필요한 변수 참조 제거

### TC-306-014: 전역 변수 메모리 사용 분석
**설명**: 전역 스코프에서 대용량 데이터를 보관하는 패턴을 검출한다
**입력**:
```javascript
var globalCache = {};
var largeDataSet = new Array(100000).fill({data: 'large object'});
```
**예상결과**:
- `issueType: 'global_memory_usage'`
- `memoryImpact: 100` (MB)
- `severity: 'medium'`
- 최적화 제안: 로컬 스코프 사용 또는 WeakMap 활용

### TC-306-015: 이벤트 리스너 메모리 누수
**설명**: 제거되지 않은 이벤트 리스너로 인한 메모리 누수를 검출한다
**입력**:
```javascript
function addListeners() {
  document.addEventListener('click', handler);
  window.addEventListener('resize', resizeHandler);
  // removeEventListener 호출 없음
}
```
**예상결과**:
- `issueType: 'event_listener_leak'`
- `memoryImpact: 10` (MB)
- `severity: 'medium'`
- 최적화 제안: 적절한 리스너 정리

### TC-306-016: 순환 참조 메모리 누수
**설명**: 객체 간 순환 참조로 인한 가비지 컬렉션 방해를 검출한다
**입력**:
```javascript
function createCircularRef() {
  const obj1 = {};
  const obj2 = {};
  obj1.ref = obj2;
  obj2.ref = obj1;
  return obj1;
}
```
**예상결과**:
- `issueType: 'circular_reference'`
- `memoryImpact: 5` (MB)
- `severity: 'low'`
- 최적화 제안: WeakMap 사용 또는 명시적 참조 해제

## 4. 데이터베이스 성능 분석 테스트

### TC-306-017: N+1 쿼리 패턴 검출
**설명**: 반복문에서 개별 쿼리를 실행하는 N+1 쿼리 문제를 검출한다
**입력**:
```javascript
const users = await User.find();
for (const user of users) {
  const posts = await Post.find({ userId: user.id });
  user.posts = posts;
}
```
**예상결과**:
- `issueType: 'n_plus_one_query'`
- `severity: 'critical'`
- `estimatedImpact: '1000ms+ per 100 users'`
- 최적화 제안: JOIN 쿼리 또는 include 사용

### TC-306-018: SELECT * 비효율성 검출
**설명**: 필요 없는 컬럼까지 조회하는 SELECT * 패턴을 검출한다
**입력**:
```javascript
const query = 'SELECT * FROM users WHERE active = true';
const users = await db.query(query);
```
**예상결과**:
- `issueType: 'inefficient_select'`
- `severity: 'medium'`
- `estimatedImpact: '2x data transfer'`
- 최적화 제안: 필요한 컬럼만 선택

### TC-306-019: 인덱스 미사용 쿼리 검출
**설명**: WHERE 절에서 인덱스를 활용하지 못하는 쿼리 패턴을 검출한다
**입력**:
```javascript
const query = 'SELECT * FROM users WHERE UPPER(email) = ?';
```
**예상결과**:
- `issueType: 'index_not_used'`
- `severity: 'high'`
- `estimatedImpact: 'Full table scan'`
- 최적화 제안: 함수형 인덱스 또는 정규화된 컬럼 사용

### TC-306-020: 대용량 데이터 LIMIT 없는 조회
**설명**: LIMIT 없이 대용량 데이터를 조회하는 위험한 패턴을 검출한다
**입력**:
```javascript
const query = 'SELECT * FROM transactions ORDER BY created_at DESC';
```
**예상결과**:
- `issueType: 'missing_pagination'`
- `severity: 'high'`
- `estimatedImpact: 'Memory overflow risk'`
- 최적화 제안: LIMIT와 OFFSET 사용

### TC-306-021: 비효율적 JOIN 쿼리 검출
**설명**: 다중 JOIN으로 인한 성능 저하를 검출한다
**입력**:
```javascript
const query = `
  SELECT * FROM users u
  JOIN posts p ON u.id = p.user_id
  JOIN comments c ON p.id = c.post_id
  JOIN likes l ON c.id = l.comment_id
`;
```
**예상결과**:
- `issueType: 'complex_join'`
- `severity: 'medium'`
- `estimatedImpact: 'Exponential result growth'`
- 최적화 제안: 쿼리 분할 또는 뷰 활용

## 5. 비동기 처리 성능 테스트

### TC-306-022: 동기 처리로 인한 블로킹 검출
**설명**: 비동기로 처리해야 할 작업을 동기적으로 처리하는 패턴을 검출한다
**입력**:
```javascript
function processFiles(files) {
  const results = [];
  for (const file of files) {
    const data = fs.readFileSync(file); // 동기 처리
    results.push(processData(data));
  }
  return results;
}
```
**예상결과**:
- `bottleneckType: 'blocking_operation'`
- `severity: 'high'`
- `estimatedSlowdown: 80`
- 최적화 제안: Promise.all() 또는 async/await 사용

### TC-306-023: 순차 Promise 체이닝 검출
**설명**: 병렬 처리 가능한 작업을 순차적으로 처리하는 비효율성을 검출한다
**입력**:
```javascript
async function processUsers(userIds) {
  const results = [];
  for (const id of userIds) {
    const user = await fetchUser(id); // 순차 처리
    results.push(user);
  }
  return results;
}
```
**예상결과**:
- `bottleneckType: 'sequential_async'`
- `severity: 'medium'`
- `estimatedSlowdown: 60`
- 최적화 제안: Promise.all() 사용

### TC-306-024: 과도한 동시 처리 검출
**설명**: 너무 많은 동시 요청으로 인한 리소스 소진을 검출한다
**입력**:
```javascript
const promises = items.map(async (item) => {
  return await processLargeItem(item); // 10000개 동시 처리
});
const results = await Promise.all(promises);
```
**예상결과**:
- `bottleneckType: 'excessive_concurrency'`
- `severity: 'high'`
- `estimatedSlowdown: 50`
- 최적화 제안: 배치 처리 또는 동시성 제한

## 6. 프레임워크별 성능 테스트

### TC-306-025: React 불필요한 렌더링 검출
**설명**: React에서 props나 state 변화 없이 발생하는 불필요한 렌더링을 검출한다
**입력**:
```javascript
function UserList({ users }) {
  return (
    <div>
      {users.map((user, index) => (
        <UserCard key={index} user={user} /> // index를 key로 사용
      ))}
    </div>
  );
}
```
**예상결과**:
- `bottleneckType: 'inefficient_rendering'`
- `severity: 'medium'`
- `estimatedSlowdown: 30`
- 최적화 제안: 고유한 key 사용, React.memo() 적용

### TC-306-026: Express 미들웨어 순서 최적화
**설명**: Express에서 미들웨어 순서로 인한 성능 저하를 검출한다
**입력**:
```javascript
app.use(heavyAuthMiddleware);
app.use(express.static('public')); // 정적 파일이 인증 후에 처리됨
app.use('/api', apiRoutes);
```
**예상결과**:
- `bottleneckType: 'middleware_ordering'`
- `severity: 'low'`
- `estimatedSlowdown: 15`
- 최적화 제안: 정적 파일 미들웨어를 앞으로 이동

### TC-306-027: Vue.js 반응성 성능 검출
**설명**: Vue.js에서 과도한 반응성으로 인한 성능 문제를 검출한다
**입력**:
```javascript
export default {
  data() {
    return {
      largeArray: new Array(10000).fill().map(() => ({ reactive: true }))
    };
  }
};
```
**예상결과**:
- `bottleneckType: 'excessive_reactivity'`
- `severity: 'medium'`
- `estimatedSlowdown: 40`
- 최적화 제안: Object.freeze() 또는 shallowRef 사용

## 7. 메트릭 계산 테스트

### TC-306-028: 전체 성능 점수 계산
**설명**: 다양한 성능 이슈를 종합하여 전체 성능 점수를 계산한다
**입력**:
- Critical 병목점 1개
- High 병목점 2개
- Medium 복잡도 이슈 3개
- 메모리 누수 1개
**예상결과**:
- `overallPerformanceScore: 20` (100 - 25 - 30 - 24 - 15)
- `performanceLevel: 'poor'`

### TC-306-029: 복잡도 분포 분석
**설명**: 함수별 복잡도 분포를 분석하고 통계를 제공한다
**입력**: 10개 함수 (O(1): 3개, O(n): 4개, O(n²): 2개, O(n³): 1개)
**예상결과**:
- `complexityDistribution: { 'O(1)': 3, 'O(n)': 4, 'O(n²)': 2, 'O(n³)': 1 }`
- `averageComplexity: 'O(n)'`
- `worstComplexity: 'O(n³)'`

### TC-306-030: 메모리 사용량 추정
**설명**: 코드 패턴을 기반으로 예상 메모리 사용량을 계산한다
**입력**: 대용량 배열 생성, 객체 캐싱, 클로저 사용 코드
**예상결과**:
- `estimatedMemoryUsage: 256` (MB)
- `memoryEfficiencyRating: 'poor'`
- `memoryOptimizationPotential: 60` (%)

## 8. 최적화 제안 테스트

### TC-306-031: 알고리즘 최적화 제안
**설명**: 비효율적인 알고리즘에 대한 구체적인 최적화 방안을 제안한다
**입력**: 선형 검색 코드
**예상결과**:
- `currentPattern: 'Linear Search'`
- `suggestedPattern: 'Binary Search'`
- `improvementRatio: 10` (O(log n) vs O(n))
- `difficulty: 'medium'`
- `example.before`: 원본 코드
- `example.after`: 최적화된 코드

### TC-306-032: 메모리 최적화 제안
**설명**: 메모리 사용량을 줄일 수 있는 구체적인 방안을 제안한다
**입력**: 대용량 배열 복사 코드
**예상결과**:
- `issue: 'Unnecessary array copying'`
- `solution: 'Use array views or references'`
- `memorySaved: 100` (MB)
- `implementation: ['Use typed arrays', 'Implement lazy loading']`

### TC-306-033: 데이터베이스 최적화 제안
**설명**: 데이터베이스 쿼리 최적화 방안을 제안한다
**입력**: N+1 쿼리 패턴
**예상결과**:
- `queryType: 'N+1 Query'`
- `currentQuery: '반복문 내 개별 쿼리'`
- `optimizedQuery: 'JOIN 또는 IN 절 사용'`
- `performanceGain: '10-100x improvement'`
- `indexSuggestions: ['Create index on foreign key']`

## 9. 프로파일링 통합 테스트

### TC-306-034: 벤치마크 코드 생성
**설명**: 성능 측정을 위한 벤치마크 코드를 자동 생성한다
**입력**: 최적화 대상 함수
**예상결과**:
- 실행 시간 측정 코드 생성
- 메모리 사용량 측정 코드 생성
- 반복 실행 및 평균값 계산 로직
- 결과 비교 및 리포팅 코드

### TC-306-035: A/B 테스트 시나리오 생성
**설명**: 성능 개선 전후 비교를 위한 A/B 테스트 코드를 생성한다
**입력**: 원본 코드와 최적화된 코드
**예상결과**:
- 동일한 입력으로 두 버전 테스트
- 통계적 유의성 검증
- 성능 개선 정량화
- 신뢰도 구간 계산

## 10. 에러 처리 테스트

### TC-306-036: 분석 불가능한 코드 처리
**설명**: 파싱할 수 없는 코드나 알 수 없는 패턴에 대한 처리를 테스트한다
**입력**: 문법 오류가 있는 JavaScript 코드
**예상결과**:
- 에러 발생 시 graceful degradation
- 분석 가능한 부분만 처리
- 에러 로그 상세 기록

### TC-306-037: 메모리 부족 상황 처리
**설명**: 대용량 파일 분석 시 메모리 부족 상황에 대한 처리를 테스트한다
**입력**: 매우 큰 JavaScript 파일 (10MB+)
**예상결과**:
- 메모리 사용량 모니터링
- 청크 단위 분석 처리
- 부분 결과 제공

### TC-306-038: 시간 제한 처리
**설명**: 분석 시간이 너무 오래 걸리는 경우의 처리를 테스트한다
**입력**: 복잡한 중첩 구조의 대용량 코드
**예상결과**:
- 타임아웃 발생 시 분석 중단
- 지금까지의 분석 결과 반환
- 시간 제한 초과 알림

## 11. 통합 시나리오 테스트

### TC-306-039: 전체 프로젝트 성능 분석
**설명**: 실제 프로젝트와 유사한 복합적인 성능 이슈가 있는 코드를 종합 분석한다
**입력**:
- 중첩 루프가 있는 컴포넌트
- N+1 쿼리 문제가 있는 API
- 메모리 누수가 있는 이벤트 핸들러
**예상결과**:
- 모든 이슈 유형 검출
- 우선순위별 정렬
- 종합 성능 점수 계산
- 단계별 최적화 로드맵 제시

### TC-306-040: 성능 회귀 검출
**설명**: 코드 변경으로 인한 성능 저하를 검출한다
**입력**:
- 이전 버전: 최적화된 코드
- 현재 버전: 성능 저하가 있는 코드
**예상결과**:
- 성능 저하 정확히 검출
- 저하 원인 분석
- 영향도 정량화
- 롤백 권장사항

### TC-306-041: 다국어 코드 분석
**설명**: JavaScript, Python, Java 등 다양한 언어의 성능 패턴을 분석한다
**입력**: 각 언어별 성능 이슈가 있는 코드 샘플
**예상결과**:
- 언어별 특화된 성능 분석
- 언어별 최적화 제안
- 통합된 성능 점수
- 크로스 플랫폼 최적화 권장사항

## 12. 실시간 성능 분석 테스트

### TC-306-042: 코드 입력 시 실시간 분석
**설명**: 개발자가 코드를 작성하는 동안 실시간으로 성능 이슈를 검출한다
**입력**: IDE에서 코드 작성 시뮬레이션
**예상결과**:
- 실시간 성능 경고
- 인라인 최적화 제안
- 성능 점수 실시간 업데이트
- 컨텍스트 기반 도움말

### TC-306-043: CI/CD 파이프라인 통합
**설명**: 빌드 프로세스에서 성능 분석을 자동 실행한다
**입력**: Git push 이벤트 시뮬레이션
**예상결과**:
- 자동 성능 분석 실행
- 성능 기준 미달 시 빌드 실패
- 성능 리포트 자동 생성
- 개발자에게 알림 발송

총 43개의 테스트 케이스로 성능 분석기의 모든 주요 기능을 검증합니다.