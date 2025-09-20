# TASK-309: API Documentation Generator Requirements

## Overview
API 엔드포인트를 자동으로 스캔하고 포괄적인 문서를 생성하는 시스템을 구현합니다. 코드에서 API 정의를 추출하고 OpenAPI/Swagger 스펙을 생성하며 대화형 문서를 제공합니다.

## Core Features

### 1. API Discovery & Extraction
- **Route Detection**: Express, Fastify, Koa 등 프레임워크의 라우트 자동 탐지
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH 등 메서드 식별
- **Path Parameters**: 동적 경로 파라미터 추출 (/users/:id)
- **Query Parameters**: 쿼리 스트링 매개변수 분석
- **Request/Response Bodies**: 요청/응답 스키마 추론

### 2. Schema Analysis
- **TypeScript Types**: TypeScript 인터페이스에서 스키마 생성
- **Validation Libraries**: Joi, Yup, Zod 등 유효성 검사 라이브러리 연동
- **Database Models**: Mongoose, Sequelize, Prisma 모델에서 스키마 추출
- **JSON Schema**: JSON Schema 포맷으로 스키마 변환

### 3. Documentation Generation
- **OpenAPI 3.0**: 표준 OpenAPI 스펙 생성
- **Swagger UI**: 대화형 API 문서 인터페이스
- **Markdown**: 정적 마크다운 문서 생성
- **Postman Collection**: Postman용 컬렉션 파일 생성

### 4. Code Analysis
- **JSDoc Comments**: JSDoc 주석에서 설명 추출
- **Inline Comments**: 인라인 주석 분석
- **Function Signatures**: 함수 시그니처 분석
- **Error Handling**: 에러 코드 및 메시지 추출

## Technical Specifications

### Input
```typescript
interface ApiDocumentationContext {
  files: FileContent[];
  frameworks: FrameworkConfig[];
  analysisOptions: DocumentationOptions;
  outputOptions: OutputOptions;
}

interface DocumentationOptions {
  includeExamples: boolean;
  includeErrorCodes: boolean;
  includeAuthentication: boolean;
  includeRateLimiting: boolean;
  generateTestCases: boolean;
  validateSchemas: boolean;
  extractFromComments: boolean;
  inferFromUsage: boolean;
}
```

### Output
```typescript
interface ApiDocumentationResult {
  id: string;
  timestamp: Date;
  apiSpec: OpenApiSpec;
  endpoints: ApiEndpoint[];
  schemas: SchemaDefinition[];
  authentication: AuthenticationScheme[];
  documentation: GeneratedDocumentation;
  testCases: ApiTestCase[];
  statistics: DocumentationStatistics;
}
```

## API Detection Patterns

### Framework-Specific Route Detection
```typescript
const ROUTE_PATTERNS = {
  // Express.js
  express: {
    app: /app\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    router: /router\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    middleware: /app\.use\s*\(\s*['"`]([^'"`]+)['"`]/g
  },

  // Fastify
  fastify: {
    register: /fastify\.register\s*\(\s*async\s*function\s*\(\s*fastify\s*\)/g,
    route: /fastify\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    opts: /\{\s*method:\s*['"`]([^'"`]+)['"`]\s*,\s*url:\s*['"`]([^'"`]+)['"`]/g
  },

  // Koa
  koa: {
    router: /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    mount: /app\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*router\.routes\(\)/g
  },

  // NestJS
  nestjs: {
    controller: /@Controller\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    methods: /@(Get|Post|Put|Delete|Patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    decorator: /@(Get|Post|Put|Delete|Patch)\s*\(\s*\)/g
  }
};
```

### Parameter Extraction
```typescript
const PARAMETER_PATTERNS = {
  // Path parameters
  pathParams: /:([a-zA-Z_$][a-zA-Z0-9_$]*)/g,

  // Query parameters from code
  queryParams: /req\.query\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,

  // Body parameters
  bodyParams: /req\.body\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,

  // Headers
  headers: /req\.headers\['([^']+)'\]|req\.headers\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,

  // Validation schemas
  joiSchema: /Joi\.(string|number|boolean|array|object)\(\)/g,
  zodSchema: /z\.(string|number|boolean|array|object)\(\)/g
};
```

## Schema Inference

### TypeScript Interface Analysis
```typescript
interface SchemaInferenceRules {
  // Basic types
  primitives: {
    string: /string/g,
    number: /number/g,
    boolean: /boolean/g,
    date: /Date/g,
    array: /\[\]|\bArray<([^>]+)>/g
  };

  // Complex types
  objects: {
    interface: /interface\s+(\w+)\s*\{([^}]+)\}/g,
    type: /type\s+(\w+)\s*=\s*\{([^}]+)\}/g,
    class: /class\s+(\w+)\s*\{([^}]+)\}/g
  };

  // Validation
  optional: /\?\s*:/g,
  required: /!\s*:/g,
  readonly: /readonly\s+/g,

  // Decorators
  decorators: /@(\w+)\s*(\([^)]*\))?\s*/g
}
```

### Database Model Integration
```typescript
interface ModelExtraction {
  mongoose: {
    schema: /new\s+mongoose\.Schema\s*\(\s*\{([^}]+)\}\s*\)/g,
    model: /mongoose\.model\s*\(\s*['"`](\w+)['"`]\s*,\s*(\w+Schema)\s*\)/g,
    types: /type:\s*(String|Number|Boolean|Date|ObjectId|Mixed)/g
  };

  sequelize: {
    define: /sequelize\.define\s*\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+)\}/g,
    model: /class\s+(\w+)\s+extends\s+Model\s*\{([^}]+)\}/g,
    types: /type:\s*(STRING|INTEGER|BOOLEAN|DATE|TEXT)/g
  };

  prisma: {
    model: /model\s+(\w+)\s*\{([^}]+)\}/g,
    field: /(\w+)\s+(String|Int|Boolean|DateTime|Json)/g,
    relation: /@relation\s*\(\s*fields:\s*\[([^\]]+)\]/g
  };
}
```

## OpenAPI Generation

### Spec Structure
```typescript
interface OpenApiSpec {
  openapi: "3.0.3";
  info: ApiInfo;
  servers: ServerConfig[];
  paths: PathsObject;
  components: ComponentsObject;
  security: SecurityRequirement[];
  tags: TagObject[];
  externalDocs?: ExternalDocumentation;
}

interface ApiInfo {
  title: string;
  description: string;
  version: string;
  contact?: ContactInfo;
  license?: LicenseInfo;
  termsOfService?: string;
}

interface PathsObject {
  [path: string]: PathItemObject;
}

interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
  parameters?: ParameterObject[];
}
```

### Operation Documentation
```typescript
interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
  callbacks?: CallbacksObject;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: ServerConfig[];
}

interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema: SchemaObject;
  example?: any;
  examples?: ExamplesObject;
}
```

## Authentication Detection

### Auth Scheme Recognition
```typescript
const AUTH_PATTERNS = {
  // JWT
  jwt: {
    middleware: /jwt\s*\(\s*\{[^}]*\}\s*\)|passport\.authenticate\s*\(\s*['"`]jwt['"`]/g,
    header: /Authorization.*Bearer|req\.headers\.authorization/g,
    decode: /jwt\.(verify|decode)\s*\(/g
  },

  // API Key
  apiKey: {
    header: /req\.headers\['x-api-key'\]|req\.headers\.apikey/gi,
    query: /req\.query\.api_key|req\.query\.apikey/gi,
    custom: /req\.headers\['([^']*key[^']*)'\]/gi
  },

  // Basic Auth
  basic: {
    header: /req\.headers\.authorization.*Basic/gi,
    middleware: /passport\.authenticate\s*\(\s*['"`]basic['"`]/g
  },

  // OAuth
  oauth: {
    oauth2: /passport\.authenticate\s*\(\s*['"`]oauth2['"`]/g,
    google: /passport\.authenticate\s*\(\s*['"`]google['"`]/g,
    github: /passport\.authenticate\s*\(\s*['"`]github['"`]/g
  },

  // Session
  session: {
    middleware: /express-session|session\s*\(\s*\{/g,
    check: /req\.session\.|req\.isAuthenticated\(\)/g
  }
};
```

## Response Analysis

### Status Code Detection
```typescript
const RESPONSE_PATTERNS = {
  // Status codes
  status: /res\.status\s*\(\s*(\d+)\s*\)/g,
  statusMethods: /res\.(sendStatus|json|send|end)\s*\(\s*(\d+)/g,

  // Error handling
  errors: {
    try_catch: /try\s*\{[^}]*\}\s*catch\s*\([^)]*\)\s*\{([^}]*)\}/g,
    throw: /throw\s+new\s+(\w*Error)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    next: /next\s*\(\s*new\s+(\w*Error)|next\s*\(\s*['"`]([^'"`]+)['"`]/g
  },

  // Success responses
  success: {
    json: /res\.json\s*\(\s*\{([^}]*)\}\s*\)/g,
    send: /res\.send\s*\(\s*(['"`][^'"`]*['"`]|\{[^}]*\})/g,
    render: /res\.render\s*\(\s*['"`]([^'"`]+)['"`]/g
  }
};
```

### Schema Generation from Examples
```typescript
interface SchemaGenerationRules {
  // Infer from response examples
  responseInference: {
    json: /res\.json\s*\(\s*(\{[^}]*\})\s*\)/g,
    array: /res\.json\s*\(\s*(\[[^\]]*\])\s*\)/g,
    variable: /res\.json\s*\(\s*(\w+)\s*\)/g
  };

  // Infer from request handling
  requestInference: {
    destructuring: /const\s*\{\s*([^}]+)\s*\}\s*=\s*req\.(body|query|params)/g,
    validation: /const\s+(\w+)\s*=\s*await\s+(\w+)\.validate\s*\(\s*req\.(body|query)/g,
    assignment: /const\s+(\w+)\s*=\s*req\.(body|query|params)\.(\w+)/g
  };

  // Type annotations
  typeAnnotations: {
    request: /\(\s*req:\s*Request<([^,>]+),\s*([^,>]+),\s*([^>]+)>/g,
    response: /res:\s*Response<([^>]+)>/g,
    handler: /\)\s*:\s*Promise<([^>]+)>/g
  };
}
```

## Documentation Templates

### Endpoint Documentation Template
```typescript
interface EndpointTemplate {
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ParameterTemplate[];
  requestBody?: RequestBodyTemplate;
  responses: ResponseTemplate[];
  examples: ExampleTemplate[];
  security: SecurityTemplate[];
}

interface ParameterTemplate {
  name: string;
  location: ParameterLocation;
  type: string;
  required: boolean;
  description: string;
  example?: any;
  constraints?: ValidationConstraints;
}

interface ResponseTemplate {
  statusCode: number;
  description: string;
  schema?: SchemaTemplate;
  headers?: HeaderTemplate[];
  examples?: ResponseExample[];
}
```

### Code Example Generation
```typescript
interface CodeExampleGeneration {
  // Request examples
  curl: {
    get: (endpoint: ApiEndpoint) => string;
    post: (endpoint: ApiEndpoint) => string;
    auth: (auth: AuthenticationScheme) => string;
  };

  // Language-specific examples
  javascript: {
    fetch: (endpoint: ApiEndpoint) => string;
    axios: (endpoint: ApiEndpoint) => string;
    node: (endpoint: ApiEndpoint) => string;
  };

  python: {
    requests: (endpoint: ApiEndpoint) => string;
    urllib: (endpoint: ApiEndpoint) => string;
  };

  // SDK examples
  postman: (endpoint: ApiEndpoint) => PostmanRequest;
  insomnia: (endpoint: ApiEndpoint) => InsomniaRequest;
}
```

## Output Formats

### Multiple Format Support
```typescript
interface OutputGenerators {
  openapi: {
    json: (spec: OpenApiSpec) => string;
    yaml: (spec: OpenApiSpec) => string;
    validate: (spec: OpenApiSpec) => ValidationResult;
  };

  swagger: {
    ui: (spec: OpenApiSpec) => SwaggerUIConfig;
    codegen: (spec: OpenApiSpec, lang: string) => GeneratedCode;
  };

  markdown: {
    single: (docs: ApiDocumentationResult) => string;
    multi: (docs: ApiDocumentationResult) => MarkdownFiles;
    github: (docs: ApiDocumentationResult) => GitHubPages;
  };

  postman: {
    collection: (endpoints: ApiEndpoint[]) => PostmanCollection;
    environment: (config: EnvironmentConfig) => PostmanEnvironment;
  };

  html: {
    static: (docs: ApiDocumentationResult) => StaticSite;
    interactive: (docs: ApiDocumentationResult) => InteractiveDocs;
  };
}
```

### Custom Templates
```typescript
interface TemplateEngine {
  handlebars: {
    register: (name: string, template: string) => void;
    render: (template: string, data: any) => string;
    helpers: HandlebarsHelpers;
  };

  mustache: {
    render: (template: string, data: any) => string;
    partials: MustachePartials;
  };

  custom: {
    engine: TemplateEngineType;
    templates: CustomTemplate[];
    variables: TemplateVariable[];
  };
}
```

## Validation & Testing

### Schema Validation
```typescript
interface ValidationRules {
  openapi: {
    validateSpec: (spec: OpenApiSpec) => ValidationResult;
    validatePaths: (paths: PathsObject) => PathValidationResult[];
    validateSchemas: (schemas: SchemaObject[]) => SchemaValidationResult[];
  };

  endpoint: {
    validateParameters: (params: ParameterObject[]) => ParameterValidationResult[];
    validateResponses: (responses: ResponsesObject) => ResponseValidationResult[];
    validateSecurity: (security: SecurityRequirement[]) => SecurityValidationResult[];
  };

  consistency: {
    checkNaming: (endpoints: ApiEndpoint[]) => NamingIssue[];
    checkVersioning: (endpoints: ApiEndpoint[]) => VersioningIssue[];
    checkPatterns: (endpoints: ApiEndpoint[]) => PatternIssue[];
  };
}
```

### Test Case Generation
```typescript
interface TestCaseGeneration {
  unit: {
    jest: (endpoint: ApiEndpoint) => JestTestCase;
    mocha: (endpoint: ApiEndpoint) => MochaTestCase;
    vitest: (endpoint: ApiEndpoint) => VitestTestCase;
  };

  integration: {
    supertest: (endpoints: ApiEndpoint[]) => SupertestSuite;
    newman: (collection: PostmanCollection) => NewmanTest;
    httpClient: (endpoints: ApiEndpoint[]) => HttpClientTest;
  };

  e2e: {
    cypress: (scenarios: TestScenario[]) => CypressTest;
    playwright: (scenarios: TestScenario[]) => PlaywrightTest;
    puppeteer: (scenarios: TestScenario[]) => PuppeteerTest;
  };
}
```

## Advanced Features

### API Versioning Support
```typescript
interface VersioningSupport {
  detection: {
    urlPath: /\/v(\d+)\//g;
    header: /version|api-version/gi;
    query: /version|v/gi;
    namespace: /v\d+\./g;
  };

  management: {
    multipleVersions: boolean;
    deprecationWarnings: boolean;
    migrationGuides: boolean;
    changelogGeneration: boolean;
  };

  documentation: {
    separateVersions: boolean;
    versionComparison: boolean;
    upgradeInstructions: boolean;
  };
}
```

### Microservices Integration
```typescript
interface MicroservicesSupport {
  discovery: {
    serviceRegistry: ServiceRegistryConfig;
    apiGateway: ApiGatewayConfig;
    containerization: ContainerConfig;
  };

  aggregation: {
    combineSpecs: (specs: OpenApiSpec[]) => AggregatedSpec;
    resolveDependencies: (services: ServiceDefinition[]) => DependencyGraph;
    generateOverview: (services: ServiceDefinition[]) => ServiceOverview;
  };

  deployment: {
    kubernetes: KubernetesConfig;
    docker: DockerConfig;
    cloudNative: CloudNativeConfig;
  };
}
```

## Performance Requirements

### Generation Speed
- **Small APIs** (< 10 endpoints): < 1 second
- **Medium APIs** (10-100 endpoints): < 5 seconds
- **Large APIs** (100+ endpoints): < 30 seconds
- **Incremental Updates**: < 2 seconds

### Memory Usage
- **Maximum Memory**: 256MB
- **Streaming Processing**: 대용량 코드베이스 지원
- **Caching**: 분석 결과 캐싱
- **Optimization**: 메모리 사용량 최적화

## Integration Points

### IDE Integration
- **VSCode Extension**: 실시간 API 문서 미리보기
- **IntelliJ Plugin**: API 문서 생성 및 관리
- **Live Reload**: 코드 변경 시 자동 문서 업데이트
- **Inline Preview**: 에디터 내 문서 미리보기

### CI/CD Pipeline
- **GitHub Actions**: 자동 문서 생성 및 배포
- **GitLab CI**: CI/CD 파이프라인 통합
- **Jenkins**: 빌드 프로세스 통합
- **Netlify/Vercel**: 정적 사이트 자동 배포

### API Management Tools
- **Kong**: API 게이트웨이 통합
- **AWS API Gateway**: 클라우드 서비스 연동
- **Azure API Management**: Microsoft 클라우드 통합
- **Google Cloud Endpoints**: Google 클라우드 연동

## Error Handling

### Analysis Errors
```typescript
interface DocumentationError {
  code: ErrorCode;
  message: string;
  file?: string;
  line?: number;
  suggestion: string;
  category: ErrorCategory;
}

enum ErrorCategory {
  PARSING_ERROR = 'parsing_error',
  SCHEMA_ERROR = 'schema_error',
  VALIDATION_ERROR = 'validation_error',
  GENERATION_ERROR = 'generation_error',
  OUTPUT_ERROR = 'output_error'
}
```

### Fallback Strategies
- **Partial Generation**: 일부 실패 시 나머지 계속 진행
- **Default Values**: 추론 실패 시 기본값 사용
- **Manual Override**: 수동 설정 옵션 제공
- **Incremental Recovery**: 점진적 복구 메커니즘

이 요구사항을 바탕으로 API Documentation Generator를 구현하여 코드에서 자동으로 포괄적인 API 문서를 생성하는 시스템을 만들겠습니다.