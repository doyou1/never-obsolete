# TDD Requirements - TASK-201 AST 파서 구현

## 개요

TypeScript Compiler API를 활용하여 소스코드를 Abstract Syntax Tree(AST)로 파싱하고, 코드 구조 및 의존성 정보를 추출하는 시스템을 구현합니다.

## 요구사항 정의 (EARS 방법론)

### R1. TypeScript Compiler API 활용
**Ubiquitous Requirements**
- REQ-201-001: 시스템은 TypeScript Compiler API를 사용하여 소스코드를 AST로 파싱해야 한다
- REQ-201-002: 시스템은 .ts, .tsx, .js, .jsx 파일을 지원해야 한다
- REQ-201-003: 시스템은 파싱 과정에서 TypeScript 컴파일 에러를 처리해야 한다

### R2. 소스코드 AST 생성
**Ubiquitous Requirements**
- REQ-201-004: 시스템은 소스코드를 완전한 AST 트리로 변환해야 한다
- REQ-201-005: 시스템은 AST 노드의 위치 정보(라인, 컬럼)를 보존해야 한다
- REQ-201-006: 시스템은 주석과 JSDoc을 포함한 메타데이터를 추출해야 한다

**State-driven Requirements**
- REQ-201-007: 파일이 TypeScript이면, 시스템은 타입 정보를 포함해야 한다
- REQ-201-008: 파일이 React 컴포넌트이면, 시스템은 JSX 구조를 분석해야 한다

### R3. Import/Export 문 추출
**Ubiquitous Requirements**
- REQ-201-009: 시스템은 모든 import 문을 추출하여 의존성 목록을 생성해야 한다
- REQ-201-010: 시스템은 export 문을 추출하여 외부 노출 API를 식별해야 한다
- REQ-201-011: 시스템은 동적 import()와 require() 호출을 감지해야 한다

**Complex Requirements**
- REQ-201-012: 시스템은 re-export 패턴을 추적하여 실제 모듈 소스를 식별해야 한다
- REQ-201-013: 시스템은 barrel exports (index.ts)를 처리해야 한다

### R4. 함수/클래스 정의 추출
**Ubiquitous Requirements**
- REQ-201-014: 시스템은 모든 함수 선언을 추출해야 한다 (function, arrow function, method)
- REQ-201-015: 시스템은 클래스 정의와 메서드를 추출해야 한다
- REQ-201-016: 시스템은 함수/메서드의 파라미터와 반환 타입을 추출해야 한다

**Event-driven Requirements**
- REQ-201-017: 함수가 async이면, 시스템은 비동기 패턴을 표시해야 한다
- REQ-201-018: 함수가 제네릭이면, 시스템은 타입 파라미터를 추출해야 한다

### R5. API 호출 패턴 감지
**Ubiquitous Requirements**
- REQ-201-019: 시스템은 HTTP 클라이언트 호출을 감지해야 한다 (fetch, axios 등)
- REQ-201-020: 시스템은 데이터베이스 쿼리 호출을 감지해야 한다
- REQ-201-021: 시스템은 외부 API 호출의 URL과 메서드를 추출해야 한다

**Complex Requirements**
- REQ-201-022: 시스템은 동적으로 생성된 API 호출을 추적해야 한다
- REQ-201-023: 시스템은 API 호출의 에러 처리 패턴을 분석해야 한다

### R6. 성능 및 안정성
**Performance Requirements**
- REQ-201-024: 시스템은 파일당 1초 이내에 AST 파싱을 완료해야 한다
- REQ-201-025: 시스템은 100개 파일을 10초 이내에 처리해야 한다
- REQ-201-026: 시스템은 메모리 사용량을 파일당 50MB 이하로 유지해야 한다

**Error Handling Requirements**
- REQ-201-027: 파싱 실패 시, 시스템은 부분 결과라도 반환해야 한다
- REQ-201-028: 시스템은 순환 의존성을 감지하고 무한 루프를 방지해야 한다

## 데이터 타입 정의

### ASTParser 클래스
```typescript
interface IASTParser {
  parseSourceCode(code: string, filename: string): ParsedSourceCode;
  parseMultipleFiles(files: SourceFile[]): ParsedProject;
  extractImports(ast: ts.SourceFile): ImportInfo[];
  extractExports(ast: ts.SourceFile): ExportInfo[];
  extractFunctions(ast: ts.SourceFile): FunctionInfo[];
  extractClasses(ast: ts.SourceFile): ClassInfo[];
  extractAPICallPatterns(ast: ts.SourceFile): APICallInfo[];
}
```

### 출력 데이터 타입
```typescript
interface ParsedSourceCode {
  filename: string;
  ast: ts.SourceFile;
  metadata: {
    fileType: 'typescript' | 'javascript' | 'tsx' | 'jsx';
    hasReactComponent: boolean;
    hasAsyncCode: boolean;
    lineCount: number;
    characterCount: number;
  };
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  apiCalls: APICallInfo[];
  dependencies: string[];
  exports: string[];
}

interface ImportInfo {
  moduleName: string;
  importType: 'default' | 'named' | 'namespace' | 'side-effect';
  importedNames: string[];
  isExternal: boolean;
  isDynamic: boolean;
  position: CodePosition;
}

interface ExportInfo {
  exportType: 'default' | 'named' | 'all';
  exportedNames: string[];
  isReExport: boolean;
  sourceModule?: string;
  position: CodePosition;
}

interface FunctionInfo {
  name: string;
  type: 'function' | 'arrow' | 'method';
  isAsync: boolean;
  isExported: boolean;
  parameters: ParameterInfo[];
  returnType?: string;
  position: CodePosition;
  jsDoc?: string;
}

interface ClassInfo {
  name: string;
  isExported: boolean;
  superClass?: string;
  interfaces: string[];
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  position: CodePosition;
  jsDoc?: string;
}

interface APICallInfo {
  type: 'http' | 'database' | 'external';
  method?: string;
  url?: string;
  library: string; // fetch, axios, prisma, etc.
  position: CodePosition;
  errorHandling: boolean;
}

interface CodePosition {
  line: number;
  column: number;
  end: {
    line: number;
    column: number;
  };
}
```

## 테스트 시나리오

### 정상 케이스
1. **기본 TypeScript 파일 파싱**: 모든 구조 요소 추출
2. **React 컴포넌트 파싱**: JSX와 Hook 패턴 감지
3. **API 서버 코드 파싱**: Express 라우터와 미들웨어 추출
4. **유틸리티 모듈 파싱**: 헬퍼 함수와 상수 추출

### 복잡한 케이스
1. **Barrel Exports**: index.ts에서 여러 모듈 재수출
2. **동적 Import**: 조건부 모듈 로딩
3. **제네릭 함수**: 타입 파라미터가 있는 복잡한 함수
4. **데코레이터**: 클래스와 메서드 데코레이터 처리

### 에러 케이스
1. **구문 오류**: 잘못된 TypeScript 구문
2. **순환 의존성**: 모듈 간 순환 참조
3. **타입 오류**: TypeScript 타입 체크 실패
4. **대용량 파일**: 메모리 제한 초과

## 구현 우선순위

### Phase 1: 기본 AST 파싱 (High Priority)
- TypeScript Compiler API 설정
- 기본 파일 파싱 및 AST 생성
- 파싱 에러 처리

### Phase 2: 구조 추출 (Medium Priority)
- Import/Export 문 추출
- 함수 및 클래스 정의 추출
- 코드 위치 정보 수집

### Phase 3: 고급 분석 (Low Priority)
- API 호출 패턴 감지
- 의존성 그래프 생성
- 성능 최적화

## 기술적 고려사항

### TypeScript Compiler API 활용
- `ts.createProgram()`: 프로그램 생성
- `ts.createSourceFile()`: 소스파일 파싱
- `ts.forEachChild()`: AST 순회
- `ts.SyntaxKind`: 노드 타입 식별

### 메모리 관리
- 대용량 파일 스트림 처리
- AST 캐싱 전략
- 가비지 컬렉션 최적화

### 확장성 설계
- 플러그인 아키텍처
- 다양한 프레임워크 지원
- 커스텀 규칙 추가

## 검증 기준

### 기능 검증
- ✅ 모든 TypeScript 구문 올바른 파싱
- ✅ Import/Export 정확한 추출
- ✅ 함수/클래스 완전한 메타데이터 수집
- ✅ API 호출 패턴 정확한 감지

### 성능 검증
- ✅ 파일당 1초 이내 파싱 완료
- ✅ 100개 파일 10초 이내 처리
- ✅ 메모리 사용량 제한 준수

### 안정성 검증
- ✅ 구문 오류 상황에서 graceful handling
- ✅ 부분 파싱 결과 반환
- ✅ 메모리 누수 방지