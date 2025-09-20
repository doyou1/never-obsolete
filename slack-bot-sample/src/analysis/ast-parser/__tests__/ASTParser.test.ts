import * as ts from 'typescript';
import { ASTParser } from '../ASTParser';
import {
  createBasicTypeScriptFile,
  createReactComponentFile,
  createAPICallFile,
  createClassFile,
  createMultipleFiles,
  createCircularDependencyFiles,
  createInvalidTypeScriptFile,
  createPartiallyValidFile,
  generateLargeTypeScriptFile,
  generateTypicalTypeScriptFile
} from './helpers/mockData';

describe('ASTParser', () => {
  describe('Creation and Initialization', () => {
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
        esModuleInterop: true,
      });
    });
  });

  describe('Source Code Parsing', () => {
    test('should parse basic TypeScript file', () => {
      const code = createBasicTypeScriptFile();
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
          characterCount: expect.any(Number),
        },
        functions: expect.arrayContaining([
          expect.objectContaining({
            name: 'greetUser',
            type: 'function',
            isAsync: false,
            parameters: expect.arrayContaining([
              expect.objectContaining({
                name: 'user',
                type: 'User',
              }),
            ]),
            returnType: 'string',
          }),
        ]),
      });
    });

    test('should parse React TSX component', () => {
      const code = createReactComponentFile();
      const parser = new ASTParser();
      const result = parser.parseSourceCode(code, 'Component.tsx');

      expect(result.metadata).toMatchObject({
        fileType: 'tsx',
        hasReactComponent: true,
      });

      expect(result.imports).toContainEqual(
        expect.objectContaining({
          moduleName: 'react',
          importType: 'named',
          importedNames: ['useState'],
        })
      );

      expect(result.exports).toContainEqual(
        expect.objectContaining({
          exportType: 'default',
          exportedNames: ['MyComponent'],
        })
      );
    });

    test('should handle parsing errors gracefully', () => {
      const invalidCode = createInvalidTypeScriptFile();
      const parser = new ASTParser();
      const result = parser.parseSourceCode(invalidCode, 'broken.ts');

      expect(result.ast).toBeDefined();
      expect(result.metadata.hasParsingErrors).toBe(true);
      expect(result.errors).toHaveLength(1);
    });
  });

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
          isDynamic: false,
        }),
        expect.objectContaining({
          moduleName: 'lodash',
          importType: 'default',
          importedNames: ['lodash'],
          isExternal: true,
        }),
        expect.objectContaining({
          moduleName: './MyComponent',
          importType: 'default',
          importedNames: ['MyComponent'],
          isExternal: false,
        }),
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
          importedNames: ['useState', 'useEffect'],
        })
      );

      expect(result.imports).toContainEqual(
        expect.objectContaining({
          moduleName: './utils',
          importType: 'named',
          importedNames: ['helper1', 'helper2'],
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
          isDynamic: true,
        })
      );

      expect(result.imports).toContainEqual(
        expect.objectContaining({
          moduleName: 'lodash',
          isDynamic: true,
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
          exportedNames: ['API_URL'],
        }),
        expect.objectContaining({
          exportType: 'named',
          exportedNames: ['fetchData'],
        }),
        expect.objectContaining({
          exportType: 'named',
          exportedNames: ['DataService'],
        }),
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
          sourceModule: './Component',
        })
      );

      expect(result.exports).toContainEqual(
        expect.objectContaining({
          exportType: 'all',
          isReExport: true,
          sourceModule: './utils',
        })
      );
    });
  });

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
            { name: 'a', type: 'number', isOptional: false },
            { name: 'b', type: 'string', isOptional: false },
          ],
          returnType: 'boolean',
        }),
        expect.objectContaining({
          name: 'asyncFunction',
          type: 'function',
          isAsync: true,
          returnType: 'Promise<void>',
        }),
        expect.objectContaining({
          name: 'exportedFunction',
          type: 'function',
          isExported: true,
          isGeneric: true,
        }),
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
          isAsync: false,
        })
      );

      expect(result.functions).toContainEqual(
        expect.objectContaining({
          name: 'asyncArrow',
          type: 'arrow',
          isAsync: true,
        })
      );
    });
  });

  describe('Class Extraction', () => {
    test('should extract class definitions', () => {
      const code = createClassFile();
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
              parameters: [{ name: 'id', type: 'string', isOptional: false }],
              returnType: 'Promise<User | null>',
            }),
            expect.objectContaining({
              name: 'addUser',
              parameters: [{ name: 'user', type: 'User', isOptional: false }],
              returnType: 'void',
            }),
          ]),
          properties: expect.arrayContaining([
            expect.objectContaining({
              name: 'users',
              type: 'User[]',
              visibility: 'private',
            }),
          ]),
        }),
      ]);
    });
  });

  describe('API Call Pattern Detection', () => {
    test('should detect fetch API calls', () => {
      const code = createAPICallFile();
      const parser = new ASTParser();
      const result = parser.parseSourceCode(code, 'test.ts');

      expect(result.apiCalls).toContainEqual(
        expect.objectContaining({
          type: 'http',
          method: 'GET',
          library: 'fetch',
          errorHandling: true,
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
          library: 'axios',
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
          library: 'prisma',
        })
      );
    });
  });

  describe('Multiple File Parsing', () => {
    test('should parse multiple files and track dependencies', () => {
      const files = createMultipleFiles();
      const parser = new ASTParser();
      const result = parser.parseMultipleFiles(files);

      expect(result).toMatchObject({
        files: expect.arrayContaining([
          expect.objectContaining({ filename: 'types.ts' }),
          expect.objectContaining({ filename: 'api.ts' }),
          expect.objectContaining({ filename: 'index.ts' }),
        ]),
        dependencyGraph: expect.objectContaining({
          'api.ts': ['types.ts'],
          'index.ts': ['types.ts', 'api.ts'],
        }),
        circularDependencies: [],
      });
    });

    test('should detect circular dependencies', () => {
      const files = createCircularDependencyFiles();
      const parser = new ASTParser();
      const result = parser.parseMultipleFiles(files);

      expect(result.circularDependencies).toContainEqual(['a.ts', 'b.ts']);
    });
  });

  describe('Performance Tests', () => {
    test('should parse single file within 1 second', () => {
      const largeCode = generateLargeTypeScriptFile(1000);
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
        content: generateTypicalTypeScriptFile(),
      }));

      const parser = new ASTParser();

      const startTime = Date.now();
      const result = parser.parseMultipleFiles(files);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000);
      expect(result.files).toHaveLength(100);
    });

    test('should handle memory efficiently for large files', () => {
      const veryLargeCode = generateLargeTypeScriptFile(10000);
      const parser = new ASTParser();

      const initialMemory = process.memoryUsage().heapUsed;
      parser.parseSourceCode(veryLargeCode, 'huge.ts');
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid TypeScript syntax', () => {
      const invalidCode = createInvalidTypeScriptFile();
      const parser = new ASTParser();

      expect(() => {
        parser.parseSourceCode(invalidCode, 'broken.ts');
      }).not.toThrow();

      const result = parser.parseSourceCode(invalidCode, 'broken.ts');
      expect(result.metadata.hasParsingErrors).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should provide partial results on parsing failure', () => {
      const partiallyValidCode = createPartiallyValidFile();
      const parser = new ASTParser();
      const result = parser.parseSourceCode(partiallyValidCode, 'partial.ts');

      expect(result.functions).toContainEqual(
        expect.objectContaining({
          name: 'validFunction',
        })
      );
      expect(result.metadata.hasParsingErrors).toBe(true);
    });
  });
});