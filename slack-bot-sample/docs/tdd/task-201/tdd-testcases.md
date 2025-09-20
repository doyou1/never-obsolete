# TDD Test Cases - TASK-201 AST 파서 구현

## 테스트 계획

### 테스트 범위
- ASTParser 클래스의 모든 public 메서드
- TypeScript/JavaScript 파일 파싱
- Import/Export 추출
- 함수/클래스 정의 추출
- API 호출 패턴 감지

### 테스트 분류
1. **Unit Tests**: 개별 메서드 기능 검증
2. **Integration Tests**: 실제 코드 파싱 테스트
3. **Performance Tests**: 대용량 파일 처리 성능
4. **Error Handling Tests**: 구문 오류 및 예외 상황

## 테스트 케이스 정의

### 1. ASTParser 클래스 생성 및 초기화

#### TC-201-001: ASTParser 인스턴스 생성
```typescript
describe('ASTParser Creation', () => {
  test('should create ASTParser instance', () => {
    const parser = new ASTParser();
    expect(parser).toBeInstanceOf(ASTParser);
  });

  test('should initialize with default TypeScript compiler options', () => {
    const parser = new ASTParser();
    const options = parser.getCompilerOptions();
    expect(options).toMatchObject({
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      allowJs: true,
      esModuleInterop: true
    });
  });
});
```

### 2. 기본 소스코드 파싱 테스트

#### TC-201-002: parseSourceCode 기본 기능
```typescript
describe('Source Code Parsing', () => {
  test('should parse basic TypeScript file', () => {
    const code = `
      interface User {
        name: string;
        age: number;
      }

      function greetUser(user: User): string {
        return \`Hello, \${user.name}!\`;
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result).toMatchObject({
      filename: 'test.ts',
      ast: expect.any(Object),
      metadata: {
        fileType: 'typescript',
        hasReactComponent: false,
        hasAsyncCode: false,
        lineCount: expect.any(Number),
        characterCount: expect.any(Number)
      },
      functions: expect.arrayContaining([
        expect.objectContaining({
          name: 'greetUser',
          type: 'function',
          isAsync: false,
          parameters: expect.arrayContaining([
            expect.objectContaining({
              name: 'user',
              type: 'User'
            })
          ]),
          returnType: 'string'
        })
      ])
    });
  });

  test('should parse React TSX component', () => {
    const code = `
      import React, { useState } from 'react';

      interface Props {
        title: string;
      }

      const MyComponent: React.FC<Props> = ({ title }) => {
        const [count, setCount] = useState(0);

        return (
          <div>
            <h1>{title}</h1>
            <button onClick={() => setCount(count + 1)}>
              Count: {count}
            </button>
          </div>
        );
      };

      export default MyComponent;
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'Component.tsx');

    expect(result.metadata).toMatchObject({
      fileType: 'tsx',
      hasReactComponent: true
    });

    expect(result.imports).toContainEqual(
      expect.objectContaining({
        moduleName: 'react',
        importType: 'named',
        importedNames: ['useState']
      })
    );

    expect(result.exports).toContainEqual(
      expect.objectContaining({
        exportType: 'default',
        exportedNames: ['MyComponent']
      })
    );
  });

  test('should handle parsing errors gracefully', () => {
    const invalidCode = `
      function broken() {
        // missing closing brace
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(invalidCode, 'broken.ts');

    expect(result.ast).toBeDefined();
    expect(result.metadata.hasParsingErrors).toBe(true);
    expect(result.errors).toHaveLength(1);
  });
});
```

### 3. Import/Export 추출 테스트

#### TC-201-003: extractImports 기능
```typescript
describe('Import Extraction', () => {
  test('should extract default imports', () => {
    const code = `
      import React from 'react';
      import lodash from 'lodash';
      import MyComponent from './MyComponent';
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.imports).toEqual([
      expect.objectContaining({
        moduleName: 'react',
        importType: 'default',
        importedNames: ['React'],
        isExternal: true,
        isDynamic: false
      }),
      expect.objectContaining({
        moduleName: 'lodash',
        importType: 'default',
        importedNames: ['lodash'],
        isExternal: true
      }),
      expect.objectContaining({
        moduleName: './MyComponent',
        importType: 'default',
        importedNames: ['MyComponent'],
        isExternal: false
      })
    ]);
  });

  test('should extract named imports', () => {
    const code = `
      import { useState, useEffect } from 'react';
      import { debounce, throttle } from 'lodash';
      import { helper1, helper2 as renamed } from './utils';
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.imports).toContainEqual(
      expect.objectContaining({
        moduleName: 'react',
        importType: 'named',
        importedNames: ['useState', 'useEffect']
      })
    );

    expect(result.imports).toContainEqual(
      expect.objectContaining({
        moduleName: './utils',
        importType: 'named',
        importedNames: ['helper1', 'helper2']
      })
    );
  });

  test('should extract dynamic imports', () => {
    const code = `
      async function loadModule() {
        const { default: dynamicModule } = await import('./dynamic');
        const utils = await import('lodash');
        return { dynamicModule, utils };
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.imports).toContainEqual(
      expect.objectContaining({
        moduleName: './dynamic',
        isDynamic: true
      })
    );

    expect(result.imports).toContainEqual(
      expect.objectContaining({
        moduleName: 'lodash',
        isDynamic: true
      })
    );
  });
});

describe('Export Extraction', () => {
  test('should extract named exports', () => {
    const code = `
      export const API_URL = 'https://api.example.com';
      export function fetchData() {}
      export class DataService {}
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.exports).toEqual([
      expect.objectContaining({
        exportType: 'named',
        exportedNames: ['API_URL']
      }),
      expect.objectContaining({
        exportType: 'named',
        exportedNames: ['fetchData']
      }),
      expect.objectContaining({
        exportType: 'named',
        exportedNames: ['DataService']
      })
    ]);
  });

  test('should extract re-exports', () => {
    const code = `
      export { default as Component } from './Component';
      export * from './utils';
      export * as api from './api';
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.exports).toContainEqual(
      expect.objectContaining({
        exportType: 'named',
        isReExport: true,
        sourceModule: './Component'
      })
    );

    expect(result.exports).toContainEqual(
      expect.objectContaining({
        exportType: 'all',
        isReExport: true,
        sourceModule: './utils'
      })
    );
  });
});
```

### 4. 함수/클래스 추출 테스트

#### TC-201-004: extractFunctions 기능
```typescript
describe('Function Extraction', () => {
  test('should extract function declarations', () => {
    const code = `
      function regularFunction(a: number, b: string): boolean {
        return a > 0 && b.length > 0;
      }

      async function asyncFunction(data: any): Promise<void> {
        await processData(data);
      }

      export function exportedFunction<T>(item: T): T {
        return item;
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.functions).toEqual([
      expect.objectContaining({
        name: 'regularFunction',
        type: 'function',
        isAsync: false,
        isExported: false,
        parameters: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'string' }
        ],
        returnType: 'boolean'
      }),
      expect.objectContaining({
        name: 'asyncFunction',
        type: 'function',
        isAsync: true,
        returnType: 'Promise<void>'
      }),
      expect.objectContaining({
        name: 'exportedFunction',
        type: 'function',
        isExported: true,
        isGeneric: true
      })
    ]);
  });

  test('should extract arrow functions', () => {
    const code = `
      const arrowFunc = (x: number) => x * 2;
      const asyncArrow = async (data: string): Promise<number> => {
        const result = await parseData(data);
        return result.length;
      };
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.functions).toContainEqual(
      expect.objectContaining({
        name: 'arrowFunc',
        type: 'arrow',
        isAsync: false
      })
    );

    expect(result.functions).toContainEqual(
      expect.objectContaining({
        name: 'asyncArrow',
        type: 'arrow',
        isAsync: true
      })
    );
  });
});

describe('Class Extraction', () => {
  test('should extract class definitions', () => {
    const code = `
      /**
       * User service class
       */
      export class UserService extends BaseService implements IUserService {
        private users: User[] = [];

        constructor(private config: Config) {
          super(config);
        }

        async getUser(id: string): Promise<User | null> {
          return this.users.find(u => u.id === id) || null;
        }

        public addUser(user: User): void {
          this.users.push(user);
        }
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.classes).toEqual([
      expect.objectContaining({
        name: 'UserService',
        isExported: true,
        superClass: 'BaseService',
        interfaces: ['IUserService'],
        jsDoc: expect.stringContaining('User service class'),
        methods: expect.arrayContaining([
          expect.objectContaining({
            name: 'getUser',
            isAsync: true,
            parameters: [{ name: 'id', type: 'string' }],
            returnType: 'Promise<User | null>'
          }),
          expect.objectContaining({
            name: 'addUser',
            parameters: [{ name: 'user', type: 'User' }],
            returnType: 'void'
          })
        ]),
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: 'users',
            type: 'User[]',
            visibility: 'private'
          })
        ])
      })
    ]);
  });
});
```

### 5. API 호출 패턴 감지 테스트

#### TC-201-005: extractAPICallPatterns 기능
```typescript
describe('API Call Pattern Detection', () => {
  test('should detect fetch API calls', () => {
    const code = `
      async function fetchUser(id: string) {
        try {
          const response = await fetch(\`/api/users/\${id}\`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          return await response.json();
        } catch (error) {
          console.error('Fetch failed:', error);
          throw error;
        }
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.apiCalls).toContainEqual(
      expect.objectContaining({
        type: 'http',
        method: 'GET',
        library: 'fetch',
        errorHandling: true
      })
    );
  });

  test('should detect axios calls', () => {
    const code = `
      import axios from 'axios';

      const apiClient = axios.create({
        baseURL: 'https://api.example.com'
      });

      export async function createUser(userData: User) {
        const response = await apiClient.post('/users', userData);
        return response.data;
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.apiCalls).toContainEqual(
      expect.objectContaining({
        type: 'http',
        method: 'POST',
        url: '/users',
        library: 'axios'
      })
    );
  });

  test('should detect database queries', () => {
    const code = `
      import { prisma } from './prisma';

      export async function findUsers() {
        return await prisma.user.findMany({
          where: { active: true },
          include: { posts: true }
        });
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(code, 'test.ts');

    expect(result.apiCalls).toContainEqual(
      expect.objectContaining({
        type: 'database',
        library: 'prisma'
      })
    );
  });
});
```

### 6. 다중 파일 처리 테스트

#### TC-201-006: parseMultipleFiles 기능
```typescript
describe('Multiple File Parsing', () => {
  test('should parse multiple files and track dependencies', () => {
    const files = [
      {
        filename: 'types.ts',
        content: `
          export interface User {
            id: string;
            name: string;
          }
        `
      },
      {
        filename: 'api.ts',
        content: `
          import { User } from './types';

          export async function getUser(id: string): Promise<User> {
            const response = await fetch(\`/api/users/\${id}\`);
            return response.json();
          }
        `
      },
      {
        filename: 'index.ts',
        content: `
          export { User } from './types';
          export { getUser } from './api';
        `
      }
    ];

    const parser = new ASTParser();
    const result = parser.parseMultipleFiles(files);

    expect(result).toMatchObject({
      files: expect.arrayContaining([
        expect.objectContaining({ filename: 'types.ts' }),
        expect.objectContaining({ filename: 'api.ts' }),
        expect.objectContaining({ filename: 'index.ts' })
      ]),
      dependencyGraph: expect.objectContaining({
        'api.ts': ['types.ts'],
        'index.ts': ['types.ts', 'api.ts']
      }),
      circularDependencies: []
    });
  });

  test('should detect circular dependencies', () => {
    const files = [
      {
        filename: 'a.ts',
        content: `import { B } from './b'; export class A {}`
      },
      {
        filename: 'b.ts',
        content: `import { A } from './a'; export class B {}`
      }
    ];

    const parser = new ASTParser();
    const result = parser.parseMultipleFiles(files);

    expect(result.circularDependencies).toContainEqual(['a.ts', 'b.ts']);
  });
});
```

### 7. 성능 및 에러 처리 테스트

#### TC-201-007: 성능 테스트
```typescript
describe('Performance Tests', () => {
  test('should parse single file within 1 second', () => {
    const largeCode = generateLargeTypeScriptFile(1000); // 1000 lines
    const parser = new ASTParser();

    const startTime = Date.now();
    const result = parser.parseSourceCode(largeCode, 'large.ts');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000);
    expect(result.functions).toBeDefined();
  });

  test('should parse 100 files within 10 seconds', () => {
    const files = Array.from({ length: 100 }, (_, i) => ({
      filename: `file${i}.ts`,
      content: generateTypicalTypeScriptFile()
    }));

    const parser = new ASTParser();

    const startTime = Date.now();
    const result = parser.parseMultipleFiles(files);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(10000);
    expect(result.files).toHaveLength(100);
  });

  test('should handle memory efficiently for large files', () => {
    const veryLargeCode = generateLargeTypeScriptFile(10000); // 10k lines
    const parser = new ASTParser();

    const initialMemory = process.memoryUsage().heapUsed;
    const result = parser.parseSourceCode(veryLargeCode, 'huge.ts');
    const finalMemory = process.memoryUsage().heapUsed;

    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});

describe('Error Handling', () => {
  test('should handle invalid TypeScript syntax', () => {
    const invalidCode = `
      class Broken {
        method() {
          // unclosed parenthesis
          if (condition
        }
      }
    `;

    const parser = new ASTParser();

    expect(() => {
      parser.parseSourceCode(invalidCode, 'broken.ts');
    }).not.toThrow();

    const result = parser.parseSourceCode(invalidCode, 'broken.ts');
    expect(result.metadata.hasParsingErrors).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should provide partial results on parsing failure', () => {
    const partiallyValidCode = `
      export function validFunction() {
        return 'hello';
      }

      // Invalid syntax below
      class Broken {
        method() {
          if (unclosed
      }
    `;

    const parser = new ASTParser();
    const result = parser.parseSourceCode(partiallyValidCode, 'partial.ts');

    expect(result.functions).toContainEqual(
      expect.objectContaining({
        name: 'validFunction'
      })
    );
    expect(result.metadata.hasParsingErrors).toBe(true);
  });
});
```

## 테스트 헬퍼 함수

### Mock Data Generators
```typescript
function generateLargeTypeScriptFile(lineCount: number): string {
  const functions = Array.from({ length: Math.floor(lineCount / 10) }, (_, i) => `
    export function func${i}(param: string): number {
      return param.length + ${i};
    }
  `).join('\n');

  return `
    // Generated file with ${lineCount} lines
    interface Config {
      apiUrl: string;
      timeout: number;
    }

    ${functions}
  `;
}

function generateTypicalTypeScriptFile(): string {
  return `
    import { Component } from 'react';
    import { ApiService } from './api';

    interface Props {
      title: string;
    }

    export class MyComponent extends Component<Props> {
      private apiService = new ApiService();

      async componentDidMount() {
        const data = await this.apiService.fetchData();
        this.setState({ data });
      }

      render() {
        return <div>{this.props.title}</div>;
      }
    }
  `;
}
```

## 테스트 실행 계획

### Phase 1: 기본 기능 테스트 (1-5)
1. ASTParser 생성 및 초기화
2. 기본 TypeScript 파일 파싱
3. Import/Export 추출

### Phase 2: 고급 기능 테스트 (4-6)
1. 함수/클래스 정의 추출
2. API 호출 패턴 감지
3. 다중 파일 처리

### Phase 3: 성능 및 안정성 테스트 (7)
1. 성능 벤치마크
2. 에러 처리 검증
3. 메모리 사용량 테스트

## 성공 기준
- ✅ 모든 단위 테스트 통과 (목표: 100% 커버리지)
- ✅ 성능 요구사항 만족 (파싱 < 1초, 100개 파일 < 10초)
- ✅ 에러 처리 완전성 검증
- ✅ 메모리 사용량 제한 준수