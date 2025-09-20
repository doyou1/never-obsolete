import { PerformanceAnalyzer } from '../PerformanceAnalyzer';
import { FileContent } from '../../github/types';
import { PerformanceAnalysisContext } from '../types';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  describe('병목점 검출', () => {
    test('중첩 루프 병목점 검출', async () => {
      const files: FileContent[] = [{
        name: 'nested-loop.js',
        path: 'src/nested-loop.js',
        content: `
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    if (users[i].id === posts[j].userId) {
      processUserPost(users[i], posts[j]);
    }
  }
}`,
        encoding: 'utf-8',
        size: 200,
        sha: 'abc123',
        url: 'http://example.com/nested-loop.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks).toHaveLength(1);
      expect(result.bottlenecks[0]?.type).toBe('nested_loops');
      expect(result.bottlenecks[0]?.severity).toBe('high');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(75);
      expect(result.bottlenecks[0]?.location.file).toBe('src/nested-loop.js');
    });

    test('반복문 내 DOM 조작 병목점', async () => {
      const files: FileContent[] = [{
        name: 'dom-loop.js',
        path: 'src/dom-loop.js',
        content: `
for (let i = 0; i < items.length; i++) {
  document.getElementById('list').appendChild(createItem(items[i]));
}`,
        encoding: 'utf-8',
        size: 150,
        sha: 'def456',
        url: 'http://example.com/dom-loop.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('dom_manipulation_in_loop');
      expect(result.bottlenecks[0]?.severity).toBe('medium');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(40);
    });

    test('배열 길이 반복 계산 병목점', async () => {
      const files: FileContent[] = [{
        name: 'array-length.js',
        path: 'src/array-length.js',
        content: `
for (let i = 0; i < array.length; i++) {
  processItem(array[i]);
}`,
        encoding: 'utf-8',
        size: 100,
        sha: 'ghi789',
        url: 'http://example.com/array-length.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('array_length_recalculation');
      expect(result.bottlenecks[0]?.severity).toBe('low');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(5);
    });

    test('반복문 내 객체 생성 병목점', async () => {
      const files: FileContent[] = [{
        name: 'object-creation.js',
        path: 'src/object-creation.js',
        content: `
for (let i = 0; i < data.length; i++) {
  const processor = new DataProcessor();
  results.push(processor.process(data[i]));
}`,
        encoding: 'utf-8',
        size: 180,
        sha: 'jkl012',
        url: 'http://example.com/object-creation.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('object_creation_in_loop');
      expect(result.bottlenecks[0]?.severity).toBe('medium');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(30);
    });

    test('동기 파일 I/O 병목점', async () => {
      const files: FileContent[] = [{
        name: 'sync-io.js',
        path: 'src/sync-io.js',
        content: `
const data = fs.readFileSync('./large-file.json');
const parsed = JSON.parse(data);`,
        encoding: 'utf-8',
        size: 100,
        sha: 'mno345',
        url: 'http://example.com/sync-io.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('blocking_io');
      expect(result.bottlenecks[0]?.severity).toBe('high');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(90);
    });

    test('메모리 누수 패턴 검출', async () => {
      const files: FileContent[] = [{
        name: 'memory-leak.js',
        path: 'src/memory-leak.js',
        content: `
setInterval(() => {
  updateData();
}, 1000);
// clearInterval이 없음`,
        encoding: 'utf-8',
        size: 120,
        sha: 'pqr678',
        url: 'http://example.com/memory-leak.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('memory_leak');
      expect(result.bottlenecks[0]?.severity).toBe('critical');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(100);
    });

    test('병목점 통계 계산', async () => {
      const files: FileContent[] = [{
        name: 'multiple-issues.js',
        path: 'src/multiple-issues.js',
        content: `
// 중첩 루프
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    // DOM 조작
    document.body.appendChild(createElement());
  }
}
// 메모리 누수
setInterval(() => {}, 1000);`,
        encoding: 'utf-8',
        size: 300,
        sha: 'stu901',
        url: 'http://example.com/multiple-issues.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.totalBottlenecks).toBe(3);
      expect(result.criticalBottlenecks).toBe(1);
      expect(result.estimatedPerformanceImpact).toBeGreaterThan(50);
    });
  });

  describe('알고리즘 복잡도 분석', () => {
    test('버블 정렬 복잡도 분석', async () => {
      const files: FileContent[] = [{
        name: 'bubble-sort.js',
        path: 'src/bubble-sort.js',
        content: `
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
        encoding: 'utf-8',
        size: 250,
        sha: 'bubble123',
        url: 'http://example.com/bubble-sort.js'
      }];

      const result = await analyzer.analyzeAlgorithmComplexity(files);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.currentComplexity).toBe('O(n²)');
      expect(result.issues[0]?.expectedComplexity).toBe('O(n log n)');
      expect(result.issues[0]?.algorithmType).toBe('sorting');
      expect(result.issues[0]?.severity).toBe('high');
    });

    test('선형 검색 복잡도 분석', async () => {
      const files: FileContent[] = [{
        name: 'linear-search.js',
        path: 'src/linear-search.js',
        content: `
function findUser(users, id) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === id) {
      return users[i];
    }
  }
  return null;
}`,
        encoding: 'utf-8',
        size: 200,
        sha: 'linear123',
        url: 'http://example.com/linear-search.js'
      }];

      const result = await analyzer.analyzeAlgorithmComplexity(files);

      expect(result.issues[0]?.currentComplexity).toBe('O(n)');
      expect(result.issues[0]?.expectedComplexity).toBe('O(log n)');
      expect(result.issues[0]?.algorithmType).toBe('search');
      expect(result.issues[0]?.severity).toBe('medium');
    });

    test('재귀 피보나치 복잡도 분석', async () => {
      const files: FileContent[] = [{
        name: 'fibonacci.js',
        path: 'src/fibonacci.js',
        content: `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
        encoding: 'utf-8',
        size: 150,
        sha: 'fib123',
        url: 'http://example.com/fibonacci.js'
      }];

      const result = await analyzer.analyzeAlgorithmComplexity(files);

      expect(result.issues[0]?.currentComplexity).toBe('O(2^n)');
      expect(result.issues[0]?.expectedComplexity).toBe('O(n)');
      expect(result.issues[0]?.algorithmType).toBe('recursive');
      expect(result.issues[0]?.severity).toBe('critical');
    });

    test('중첩 배열 순회 복잡도 분석', async () => {
      const files: FileContent[] = [{
        name: 'matrix-traversal.js',
        path: 'src/matrix-traversal.js',
        content: `
function processMatrix(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      for (let k = 0; k < matrix[i][j].length; k++) {
        processElement(matrix[i][j][k]);
      }
    }
  }
}`,
        encoding: 'utf-8',
        size: 250,
        sha: 'matrix123',
        url: 'http://example.com/matrix-traversal.js'
      }];

      const result = await analyzer.analyzeAlgorithmComplexity(files);

      expect(result.issues[0]?.currentComplexity).toBe('O(n³)');
      expect(result.issues[0]?.expectedComplexity).toBe('O(n²)');
      expect(result.issues[0]?.algorithmType).toBe('traversal');
      expect(result.issues[0]?.severity).toBe('high');
    });

    test('문자열 연결 복잡도 분석', async () => {
      const files: FileContent[] = [{
        name: 'string-concat.js',
        path: 'src/string-concat.js',
        content: `
let result = '';
for (let i = 0; i < items.length; i++) {
  result += items[i].toString();
}`,
        encoding: 'utf-8',
        size: 150,
        sha: 'string123',
        url: 'http://example.com/string-concat.js'
      }];

      const result = await analyzer.analyzeAlgorithmComplexity(files);

      expect(result.issues[0]?.currentComplexity).toBe('O(n²)');
      expect(result.issues[0]?.expectedComplexity).toBe('O(n)');
      expect(result.issues[0]?.algorithmType).toBe('string_manipulation');
      expect(result.issues[0]?.severity).toBe('medium');
    });

    test('복잡도 분포 계산', async () => {
      const files: FileContent[] = [{
        name: 'mixed-complexity.js',
        path: 'src/mixed-complexity.js',
        content: `
// O(1)
function getFirst(arr) { return arr[0]; }

// O(n)
function findMax(arr) {
  let max = arr[0];
  for(let i = 1; i < arr.length; i++) {
    if(arr[i] > max) max = arr[i];
  }
  return max;
}

// O(n²)
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
}`,
        encoding: 'utf-8',
        size: 500,
        sha: 'mixed123',
        url: 'http://example.com/mixed-complexity.js'
      }];

      const result = await analyzer.analyzeAlgorithmComplexity(files);

      expect(result.complexityDistribution.constant).toBe(1); // O(1)
      expect(result.complexityDistribution.linear).toBe(1); // O(n)
      expect(result.complexityDistribution.quadratic).toBe(1); // O(n²)
    });
  });

  describe('메모리 사용량 분석', () => {
    test('대용량 배열 복사 분석', async () => {
      const files: FileContent[] = [{
        name: 'array-copy.js',
        path: 'src/array-copy.js',
        content: `
const originalArray = new Array(1000000).fill(0);
const copiedArray = [...originalArray];
const anotherCopy = originalArray.slice();`,
        encoding: 'utf-8',
        size: 200,
        sha: 'arraycopy123',
        url: 'http://example.com/array-copy.js'
      }];

      const result = await analyzer.analyzeMemoryUsage(files);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.issueType).toBe('unnecessary_memory_allocation');
      expect(result.issues[0]?.memoryImpact).toBe(24);
      expect(result.issues[0]?.severity).toBe('high');
    });

    test('클로저 메모리 누수 분석', async () => {
      const files: FileContent[] = [{
        name: 'closure-leak.js',
        path: 'src/closure-leak.js',
        content: `
function createHandler(largeData) {
  return function(event) {
    // largeData를 사용하지 않지만 클로저로 참조 유지
    console.log(event.type);
  };
}`,
        encoding: 'utf-8',
        size: 200,
        sha: 'closure123',
        url: 'http://example.com/closure-leak.js'
      }];

      const result = await analyzer.analyzeMemoryUsage(files);

      expect(result.issues[0]?.issueType).toBe('closure_memory_leak');
      expect(result.issues[0]?.memoryImpact).toBe(50);
      expect(result.issues[0]?.severity).toBe('medium');
    });

    test('전역 변수 메모리 사용 분석', async () => {
      const files: FileContent[] = [{
        name: 'global-vars.js',
        path: 'src/global-vars.js',
        content: `
var globalCache = {};
var largeDataSet = new Array(100000).fill({data: 'large object'});`,
        encoding: 'utf-8',
        size: 150,
        sha: 'global123',
        url: 'http://example.com/global-vars.js'
      }];

      const result = await analyzer.analyzeMemoryUsage(files);

      expect(result.issues[0]?.issueType).toBe('global_memory_usage');
      expect(result.issues[0]?.memoryImpact).toBe(100);
      expect(result.issues[0]?.severity).toBe('medium');
    });

    test('이벤트 리스너 메모리 누수', async () => {
      const files: FileContent[] = [{
        name: 'event-leak.js',
        path: 'src/event-leak.js',
        content: `
function addListeners() {
  document.addEventListener('click', handler);
  window.addEventListener('resize', resizeHandler);
  // removeEventListener 호출 없음
}`,
        encoding: 'utf-8',
        size: 180,
        sha: 'event123',
        url: 'http://example.com/event-leak.js'
      }];

      const result = await analyzer.analyzeMemoryUsage(files);

      expect(result.issues[0]?.issueType).toBe('event_listener_leak');
      expect(result.issues[0]?.memoryImpact).toBe(10);
      expect(result.issues[0]?.severity).toBe('medium');
    });

    test('순환 참조 메모리 누수', async () => {
      const files: FileContent[] = [{
        name: 'circular-ref.js',
        path: 'src/circular-ref.js',
        content: `
function createCircularRef() {
  const obj1 = {};
  const obj2 = {};
  obj1.ref = obj2;
  obj2.ref = obj1;
  return obj1;
}`,
        encoding: 'utf-8',
        size: 180,
        sha: 'circular123',
        url: 'http://example.com/circular-ref.js'
      }];

      const result = await analyzer.analyzeMemoryUsage(files);

      expect(result.issues[0]?.issueType).toBe('circular_reference');
      expect(result.issues[0]?.memoryImpact).toBe(5);
      expect(result.issues[0]?.severity).toBe('low');
    });

    test('메모리 최적화 잠재력 계산', async () => {
      const files: FileContent[] = [{
        name: 'memory-optimizable.js',
        path: 'src/memory-optimizable.js',
        content: `
const largeArray = new Array(1000000).fill(0);
const copy1 = [...largeArray];
const copy2 = largeArray.slice();
const copy3 = Array.from(largeArray);`,
        encoding: 'utf-8',
        size: 200,
        sha: 'optimizable123',
        url: 'http://example.com/memory-optimizable.js'
      }];

      const result = await analyzer.analyzeMemoryUsage(files);

      expect(result.memoryOptimizationPotential).toBeGreaterThan(50);
      expect(result.estimatedMemoryUsage).toBeGreaterThan(50);
    });
  });

  describe('데이터베이스 성능 분석', () => {
    test('N+1 쿼리 패턴 검출', async () => {
      const files: FileContent[] = [{
        name: 'n-plus-one.js',
        path: 'src/n-plus-one.js',
        content: `
const users = await User.find();
for (const user of users) {
  const posts = await Post.find({ userId: user.id });
  user.posts = posts;
}`,
        encoding: 'utf-8',
        size: 200,
        sha: 'nplus123',
        url: 'http://example.com/n-plus-one.js'
      }];

      const result = await analyzer.analyzeDatabasePerformance(files);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.issueType).toBe('n_plus_one_query');
      expect(result.issues[0]?.severity).toBe('critical');
      expect(result.issues[0]?.estimatedImpact).toBe('1000ms+ per 100 users');
    });

    test('SELECT * 비효율성 검출', async () => {
      const files: FileContent[] = [{
        name: 'select-star.js',
        path: 'src/select-star.js',
        content: `
const query = 'SELECT * FROM users WHERE active = true';
const users = await db.query(query);`,
        encoding: 'utf-8',
        size: 150,
        sha: 'select123',
        url: 'http://example.com/select-star.js'
      }];

      const result = await analyzer.analyzeDatabasePerformance(files);

      expect(result.issues[0]?.issueType).toBe('inefficient_select');
      expect(result.issues[0]?.severity).toBe('medium');
      expect(result.issues[0]?.estimatedImpact).toBe('2x data transfer');
    });

    test('인덱스 미사용 쿼리 검출', async () => {
      const files: FileContent[] = [{
        name: 'no-index.js',
        path: 'src/no-index.js',
        content: `
const query = 'SELECT * FROM users WHERE UPPER(email) = ?';`,
        encoding: 'utf-8',
        size: 100,
        sha: 'noindex123',
        url: 'http://example.com/no-index.js'
      }];

      const result = await analyzer.analyzeDatabasePerformance(files);

      expect(result.issues[0]?.issueType).toBe('index_not_used');
      expect(result.issues[0]?.severity).toBe('high');
      expect(result.issues[0]?.estimatedImpact).toBe('Full table scan');
    });

    test('대용량 데이터 LIMIT 없는 조회', async () => {
      const files: FileContent[] = [{
        name: 'no-limit.js',
        path: 'src/no-limit.js',
        content: `
const query = 'SELECT * FROM transactions ORDER BY created_at DESC';`,
        encoding: 'utf-8',
        size: 120,
        sha: 'nolimit123',
        url: 'http://example.com/no-limit.js'
      }];

      const result = await analyzer.analyzeDatabasePerformance(files);

      expect(result.issues[0]?.issueType).toBe('missing_pagination');
      expect(result.issues[0]?.severity).toBe('high');
      expect(result.issues[0]?.estimatedImpact).toBe('Memory overflow risk');
    });

    test('비효율적 JOIN 쿼리 검출', async () => {
      const files: FileContent[] = [{
        name: 'complex-join.js',
        path: 'src/complex-join.js',
        content: `
const query = \`
  SELECT * FROM users u
  JOIN posts p ON u.id = p.user_id
  JOIN comments c ON p.id = c.post_id
  JOIN likes l ON c.id = l.comment_id
\`;`,
        encoding: 'utf-8',
        size: 250,
        sha: 'join123',
        url: 'http://example.com/complex-join.js'
      }];

      const result = await analyzer.analyzeDatabasePerformance(files);

      expect(result.issues[0]?.issueType).toBe('complex_join');
      expect(result.issues[0]?.severity).toBe('medium');
      expect(result.issues[0]?.estimatedImpact).toBe('Exponential result growth');
    });

    test('데이터베이스 최적화 제안 생성', async () => {
      const files: FileContent[] = [{
        name: 'db-issues.js',
        path: 'src/db-issues.js',
        content: `
const users = await User.find();
for (const user of users) {
  const posts = await Post.find({ userId: user.id });
}
const query = 'SELECT * FROM large_table ORDER BY created_at';`,
        encoding: 'utf-8',
        size: 200,
        sha: 'dbissues123',
        url: 'http://example.com/db-issues.js'
      }];

      const result = await analyzer.analyzeDatabasePerformance(files);

      expect(result.optimizationSuggestions.length).toBeGreaterThan(0);
      expect(result.optimizationSuggestions[0]?.type).toBe('query');
      expect(result.optimizationSuggestions[0]?.expectedBenefit).toBeDefined();
    });
  });

  describe('비동기 처리 성능', () => {
    test('동기 처리로 인한 블로킹 검출', async () => {
      const files: FileContent[] = [{
        name: 'sync-blocking.js',
        path: 'src/sync-blocking.js',
        content: `
function processFiles(files) {
  const results = [];
  for (const file of files) {
    const data = fs.readFileSync(file); // 동기 처리
    results.push(processData(data));
  }
  return results;
}`,
        encoding: 'utf-8',
        size: 250,
        sha: 'sync123',
        url: 'http://example.com/sync-blocking.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('blocking_operation');
      expect(result.bottlenecks[0]?.severity).toBe('high');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(80);
    });

    test('순차 Promise 체이닝 검출', async () => {
      const files: FileContent[] = [{
        name: 'sequential-async.js',
        path: 'src/sequential-async.js',
        content: `
async function processUsers(userIds) {
  const results = [];
  for (const id of userIds) {
    const user = await fetchUser(id); // 순차 처리
    results.push(user);
  }
  return results;
}`,
        encoding: 'utf-8',
        size: 250,
        sha: 'sequential123',
        url: 'http://example.com/sequential-async.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('sequential_async');
      expect(result.bottlenecks[0]?.severity).toBe('medium');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(60);
    });

    test('과도한 동시 처리 검출', async () => {
      const files: FileContent[] = [{
        name: 'excessive-concurrent.js',
        path: 'src/excessive-concurrent.js',
        content: `
const promises = items.map(async (item) => {
  return await processLargeItem(item); // 10000개 동시 처리
});
const results = await Promise.all(promises);`,
        encoding: 'utf-8',
        size: 200,
        sha: 'excessive123',
        url: 'http://example.com/excessive-concurrent.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('excessive_concurrency');
      expect(result.bottlenecks[0]?.severity).toBe('high');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(50);
    });
  });

  describe('프레임워크별 성능', () => {
    test('React 불필요한 렌더링 검출', async () => {
      const files: FileContent[] = [{
        name: 'react-rendering.jsx',
        path: 'src/react-rendering.jsx',
        content: `
function UserList({ users }) {
  return (
    <div>
      {users.map((user, index) => (
        <UserCard key={index} user={user} /> // index를 key로 사용
      ))}
    </div>
  );
}`,
        encoding: 'utf-8',
        size: 250,
        sha: 'react123',
        url: 'http://example.com/react-rendering.jsx'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('inefficient_rendering');
      expect(result.bottlenecks[0]?.severity).toBe('medium');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(30);
    });

    test('Express 미들웨어 순서 최적화', async () => {
      const files: FileContent[] = [{
        name: 'express-middleware.js',
        path: 'src/express-middleware.js',
        content: `
app.use(heavyAuthMiddleware);
app.use(express.static('public')); // 정적 파일이 인증 후에 처리됨
app.use('/api', apiRoutes);`,
        encoding: 'utf-8',
        size: 200,
        sha: 'express123',
        url: 'http://example.com/express-middleware.js'
      }];

      const result = await analyzer.detectBottlenecks(files);

      expect(result.bottlenecks[0]?.type).toBe('middleware_ordering');
      expect(result.bottlenecks[0]?.severity).toBe('low');
      expect(result.bottlenecks[0]?.estimatedSlowdown).toBe(15);
    });
  });

  describe('종합 성능 분석', () => {
    test('전체 성능 점수 계산', async () => {
      const files: FileContent[] = [{
        name: 'performance-issues.js',
        path: 'src/performance-issues.js',
        content: `
// 중첩 루프
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    processUserPost(users[i], posts[j]);
  }
}

// 메모리 누수
setInterval(() => {
  updateData();
}, 1000);

// 동기 I/O
const data = fs.readFileSync('./large-file.json');`,
        encoding: 'utf-8',
        size: 400,
        sha: 'perf123',
        url: 'http://example.com/performance-issues.js'
      }];

      const context: PerformanceAnalysisContext = {
        files,
        language: 'javascript',
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

      expect(result.overallPerformanceScore).toBeLessThan(50);
      expect(result.performanceLevel).toBe('poor');
      expect(result.bottlenecks.length).toBeGreaterThan(0);
      expect(result.optimizationRecommendations.length).toBeGreaterThan(0);
    });

    test('성능 등급 분류', async () => {
      const files: FileContent[] = [{
        name: 'optimized-code.js',
        path: 'src/optimized-code.js',
        content: `
// 효율적인 코드
const users = await User.findAll({ include: [Post] });
const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));`,
        encoding: 'utf-8',
        size: 200,
        sha: 'optimized123',
        url: 'http://example.com/optimized-code.js'
      }];

      const context: PerformanceAnalysisContext = {
        files,
        language: 'javascript',
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
          enableDatabaseAnalysis: true,
          performanceThreshold: {
            maxExecutionTime: 1000,
            maxMemoryUsage: 256,
            maxDatabaseQueryTime: 100,
            maxComplexity: 'O(n log n)'
          }
        }
      };

      const result = await analyzer.analyzePerformance(context);

      expect(result.overallPerformanceScore).toBeGreaterThan(80);
      expect(result.performanceLevel).toBe('excellent');
    });

    test('최적화 권장사항 생성', async () => {
      const files: FileContent[] = [{
        name: 'needs-optimization.js',
        path: 'src/needs-optimization.js',
        content: `
// 비효율적 버블 정렬
function sort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
}

// 메모리 누수
const timers = [];
function startTimer() {
  timers.push(setInterval(() => {}, 1000));
}`,
        encoding: 'utf-8',
        size: 350,
        sha: 'optimize123',
        url: 'http://example.com/needs-optimization.js'
      }];

      const context: PerformanceAnalysisContext = {
        files,
        language: 'javascript',
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
            maxComplexity: 'O(n log n)'
          }
        }
      };

      const result = await analyzer.analyzePerformance(context);

      expect(result.optimizationRecommendations.length).toBeGreaterThan(0);
      expect(result.optimizationRecommendations.some(r =>
        r.category === 'algorithm'
      )).toBe(true);
      expect(result.optimizationRecommendations.some(r =>
        r.category === 'memory'
      )).toBe(true);
    });

    test('성능 메트릭 계산', async () => {
      const files: FileContent[] = [{
        name: 'metrics-test.js',
        path: 'src/metrics-test.js',
        content: `
function complexAlgorithm() {
  for (let i = 0; i < 1000; i++) {
    for (let j = 0; j < 1000; j++) {
      doSomething(i, j);
    }
  }
}

const largeArray = new Array(100000);`,
        encoding: 'utf-8',
        size: 200,
        sha: 'metrics123',
        url: 'http://example.com/metrics-test.js'
      }];

      const context: PerformanceAnalysisContext = {
        files,
        language: 'javascript',
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
            maxComplexity: 'O(n)'
          }
        }
      };

      const result = await analyzer.analyzePerformance(context);

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.executionTimeMetrics).toBeDefined();
      expect(result.performanceMetrics.memoryMetrics).toBeDefined();
      expect(result.performanceMetrics.complexityMetrics).toBeDefined();
      expect(result.performanceMetrics.overallEfficiency).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    test('손상된 파일 처리', async () => {
      const files: FileContent[] = [{
        name: 'broken.js',
        path: 'src/broken.js',
        content: `
function incomplete() {
  if (condition {
    // 문법 오류가 있는 파일`,
        encoding: 'utf-8',
        size: 100,
        sha: 'broken123',
        url: 'http://example.com/broken.js'
      }];

      const context: PerformanceAnalysisContext = {
        files,
        language: 'javascript',
        environment: 'development',
        targetPerformance: {
          targetLatency: 100,
          targetThroughput: 1000,
          targetMemoryLimit: 512,
          targetCpuUsage: 70
        },
        analysisOptions: {
          enableBottleneckDetection: true,
          enableComplexityAnalysis: false,
          enableMemoryAnalysis: false,
          enableDatabaseAnalysis: false,
          performanceThreshold: {
            maxExecutionTime: 1000,
            maxMemoryUsage: 256,
            maxDatabaseQueryTime: 100,
            maxComplexity: 'O(n)'
          }
        }
      };

      const result = await analyzer.analyzePerformance(context);

      expect(result).toBeDefined();
      expect(result.overallPerformanceScore).toBeGreaterThanOrEqual(0);
    });

    test('빈 파일 배열 처리', async () => {
      const context: PerformanceAnalysisContext = {
        files: [],
        language: 'javascript',
        environment: 'development',
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
          enableDatabaseAnalysis: true,
          performanceThreshold: {
            maxExecutionTime: 1000,
            maxMemoryUsage: 256,
            maxDatabaseQueryTime: 100,
            maxComplexity: 'O(n)'
          }
        }
      };

      const result = await analyzer.analyzePerformance(context);

      expect(result.bottlenecks).toHaveLength(0);
      expect(result.complexityIssues).toHaveLength(0);
      expect(result.memoryIssues).toHaveLength(0);
      expect(result.overallPerformanceScore).toBe(100);
      expect(result.performanceLevel).toBe('excellent');
    });
  });
});