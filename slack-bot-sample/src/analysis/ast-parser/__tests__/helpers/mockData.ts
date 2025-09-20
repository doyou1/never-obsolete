import type { SourceFile } from '../../types';

export function generateLargeTypeScriptFile(lineCount: number): string {
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

export function generateTypicalTypeScriptFile(): string {
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

export function createBasicTypeScriptFile(): string {
  return `
    interface User {
      name: string;
      age: number;
    }

    function greetUser(user: User): string {
      return \`Hello, \${user.name}!\`;
    }
  `;
}

export function createReactComponentFile(): string {
  return `
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
}

export function createAPICallFile(): string {
  return `
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
}

export function createClassFile(): string {
  return `
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
}

export function createMultipleFiles(): SourceFile[] {
  return [
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
}

export function createCircularDependencyFiles(): SourceFile[] {
  return [
    {
      filename: 'a.ts',
      content: `import { B } from './b'; export class A {}`
    },
    {
      filename: 'b.ts',
      content: `import { A } from './a'; export class B {}`
    }
  ];
}

export function createInvalidTypeScriptFile(): string {
  return `
    function broken() {
      // missing closing brace
  `;
}

export function createPartiallyValidFile(): string {
  return `
    export function validFunction() {
      return 'hello';
    }

    // Invalid syntax below
    class Broken {
      method() {
        if (unclosed
    }
  `;
}

// Mock data validation test
describe('AST Mock Data Helpers', () => {
  test('should create valid TypeScript code', () => {
    const code = createBasicTypeScriptFile();
    expect(code).toContain('interface User');
    expect(code).toContain('function greetUser');
  });
});