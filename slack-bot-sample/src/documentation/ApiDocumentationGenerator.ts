// TASK-309: API Documentation Generator Implementation

import { FileContent } from '../github/types';
import {
  IApiDocumentationGenerator,
  ApiDocumentationContext,
  ApiDocumentationResult,
  ApiDiscoveryResult,
  SchemaExtractionResult,
  OpenApiSpec,
  ApiTestCase,
  ApiEndpoint,
  SchemaDefinition,
  HttpMethod,
  ParameterLocation,
  ParameterType,
  AuthenticationScheme,
  RateLimitingPolicy,
  MiddlewareDefinition,
  DiscoveryStatistics,
  FunctionSignature,
  ApiParameter,
  RequestBodyDefinition,
  ResponseDefinition,
  TypeDefinition,
  ValidationSchema,
  ModelSchema,
  SchemaConflict,
  SchemaType,
  SchemaSource,
  ValidationLibrary,
  ModelFramework,
  JsonSchema,
  DocumentationStatistics,
  DocumentationError,
  DocumentationWarning,
  ErrorType,
  ErrorSeverity,
  WarningType,
  GeneratedDocumentation,
  DocumentationFormat,
  DocumentationMetadata,
  DocumentationCustomization,
  AnalysisStatistics,
  GenerationStatistics,
  ValidationStatistics,
  OutputStatistics,
  ErrorStatistics
} from './types';

export class ApiDocumentationGenerator implements IApiDocumentationGenerator {
  private readonly ROUTE_PATTERNS = {
    express: {
      app: /app\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      router: /router\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      middleware: /app\.use\s*\(\s*['"`]([^'"`]+)['"`]/g
    },
    fastify: {
      register: /fastify\.register\s*\(\s*async\s*function\s*\(\s*fastify\s*\)/g,
      route: /fastify\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      opts: /\{\s*method:\s*['"`]([^'"`]+)['"`]\s*,\s*url:\s*['"`]([^'"`]+)['"`]/g
    },
    nestjs: {
      controller: /@Controller\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      methods: /@(Get|Post|Put|Delete|Patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      methodsNoParams: /@(Get|Post|Put|Delete|Patch)\s*\(\s*\)/g
    }
  };

  private readonly SCHEMA_PATTERNS = {
    typescript: {
      interface: /interface\s+(\w+)\s*\{([^}]+)\}/g,
      type: /type\s+(\w+)\s*=\s*([^;]+)/g,
      enum: /enum\s+(\w+)\s*\{([^}]+)\}/g
    },
    joi: {
      schema: /const\s+(\w+)\s*=\s*Joi\.object\s*\(\s*\{([^}]+)\}/g
    },
    zod: {
      schema: /const\s+(\w+)\s*=\s*z\.object\s*\(\s*\{([^}]+)\}/g
    },
    mongoose: {
      schema: /new\s+mongoose\.Schema\s*\(\s*\{([^}]+)\}/g,
      model: /mongoose\.model\s*\(\s*['"`](\w+)['"`]/g
    }
  };

  async generateDocumentation(context: ApiDocumentationContext): Promise<ApiDocumentationResult> {
    const id = `doc-${Date.now()}`;
    const timestamp = new Date();
    const errors: DocumentationError[] = [];
    const warnings: DocumentationWarning[] = [];

    try {
      // Discover API endpoints
      const discoveryResult = await this.discoverApiEndpoints(context.files);

      // Extract schemas
      const schemaResult = await this.extractSchemas(context.files);

      // Generate OpenAPI specification
      const apiSpec = await this.generateOpenApiSpec(discoveryResult.endpoints, schemaResult.schemas);

      // Generate test cases if requested
      const testCases = context.analysisOptions.generateTestCases
        ? await this.generateTestCases(discoveryResult.endpoints)
        : [];

      // Generate documentation in multiple formats
      const documentation = this.generateMultiFormatDocumentation(
        apiSpec,
        context.outputOptions.formats
      );

      // Calculate statistics
      const statistics = this.calculateStatistics(
        discoveryResult,
        schemaResult,
        documentation,
        errors
      );

      return {
        id,
        timestamp,
        apiSpec,
        endpoints: discoveryResult.endpoints,
        schemas: schemaResult.schemas,
        authentication: discoveryResult.authentication,
        rateLimiting: discoveryResult.rateLimiting,
        documentation,
        testCases,
        statistics,
        errors,
        warnings
      };
    } catch (error) {
      errors.push({
        id: `error-${Date.now()}`,
        type: 'generation' as ErrorType,
        severity: 'critical' as ErrorSeverity,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      // Return partial result even on error
      return this.createEmptyResult(id, timestamp, errors, warnings);
    }
  }

  async discoverApiEndpoints(files: FileContent[]): Promise<ApiDiscoveryResult> {
    const endpoints: ApiEndpoint[] = [];
    const middleware: MiddlewareDefinition[] = [];
    const authentication: AuthenticationScheme[] = [];
    const rateLimiting: RateLimitingPolicy[] = [];
    const frameworksDetected = new Set<string>();

    for (const file of files) {
      try {
        // Detect Express routes
        const expressEndpoints = this.extractExpressRoutes(file);
        endpoints.push(...expressEndpoints);
        if (expressEndpoints.length > 0) {
          frameworksDetected.add('express');
        }

        // Detect Fastify routes
        const fastifyEndpoints = this.extractFastifyRoutes(file);
        endpoints.push(...fastifyEndpoints);
        if (fastifyEndpoints.length > 0) {
          frameworksDetected.add('fastify');
        }

        // Detect NestJS routes
        const nestjsEndpoints = this.extractNestJSRoutes(file);
        endpoints.push(...nestjsEndpoints);
        if (nestjsEndpoints.length > 0) {
          frameworksDetected.add('nestjs');
        }

        // Extract middleware
        const fileMiddleware = this.extractMiddleware(file);
        middleware.push(...fileMiddleware);

      } catch (error) {
        // Continue processing other files even if one fails
        console.warn(`Error processing file ${file.path}:`, error);
      }
    }

    // Post-process to combine router paths
    this.combineRouterPaths(endpoints);

    const statistics: DiscoveryStatistics = {
      totalRoutes: endpoints.length,
      uniqueRoutes: new Set(endpoints.map(ep => `${ep.method}:${ep.path}`)).size,
      duplicateRoutes: endpoints.length - new Set(endpoints.map(ep => `${ep.method}:${ep.path}`)).size,
      frameworkBreakdown: this.calculateFrameworkBreakdown(endpoints),
      methodBreakdown: this.calculateMethodBreakdown(endpoints),
      middlewareCount: middleware.length,
      authenticationSchemes: authentication.length,
      rateLimitingPolicies: rateLimiting.length
    };

    return {
      totalEndpoints: endpoints.length,
      frameworksDetected: Array.from(frameworksDetected),
      endpoints,
      middleware,
      authentication,
      rateLimiting,
      statistics
    };
  }

  async extractSchemas(files: FileContent[]): Promise<SchemaExtractionResult> {
    const schemas: SchemaDefinition[] = [];
    const typeDefinitions: TypeDefinition[] = [];
    const validationSchemas: ValidationSchema[] = [];
    const modelSchemas: ModelSchema[] = [];
    const conflicts: SchemaConflict[] = [];

    for (const file of files) {
      try {
        // Extract TypeScript interfaces
        const tsSchemas = this.extractTypeScriptSchemas(file);
        schemas.push(...tsSchemas);

        // Extract validation schemas
        const valSchemas = this.extractValidationSchemas(file);
        validationSchemas.push(...valSchemas);
        schemas.push(...valSchemas.map(vs => this.convertValidationToSchema(vs)));

        // Extract model schemas
        const modelDefs = this.extractModelSchemas(file);
        modelSchemas.push(...modelDefs);
        schemas.push(...modelDefs.map(ms => this.convertModelToSchema(ms)));

      } catch (error) {
        console.warn(`Error extracting schemas from ${file.path}:`, error);
      }
    }

    return {
      totalSchemas: schemas.length,
      schemas,
      typeDefinitions,
      validationSchemas,
      modelSchemas,
      conflicts
    };
  }

  async generateOpenApiSpec(endpoints: ApiEndpoint[], schemas: SchemaDefinition[]): Promise<OpenApiSpec> {
    const paths: Record<string, any> = {};
    const components: any = {
      schemas: {}
    };

    // Convert endpoints to OpenAPI paths
    for (const endpoint of endpoints) {
      const pathKey = endpoint.path.replace(/:(\w+)/g, '{$1}');

      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }

      const operationId = `${endpoint.method.toLowerCase()}${this.pathToOperationName(endpoint.path)}`;

      paths[pathKey][endpoint.method.toLowerCase()] = {
        operationId,
        summary: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: this.convertParametersToOpenAPI(endpoint.parameters),
        requestBody: endpoint.requestBody ? this.convertRequestBodyToOpenAPI(endpoint.requestBody) : undefined,
        responses: this.convertResponsesToOpenAPI(endpoint.responses),
        deprecated: endpoint.deprecated
      };
    }

    // Convert schemas to OpenAPI components
    for (const schema of schemas) {
      components.schemas[schema.name] = schema.schema;
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'Generated API Documentation',
        version: '1.0.0',
        description: 'Automatically generated API documentation'
      },
      servers: [{
        url: 'http://localhost:3000',
        description: 'Development server'
      }],
      paths,
      components
    };
  }

  async generateTestCases(endpoints: ApiEndpoint[]): Promise<ApiTestCase[]> {
    const testCases: ApiTestCase[] = [];

    for (const endpoint of endpoints) {
      // Generate basic test case for each endpoint
      testCases.push({
        id: `test-${endpoint.id}`,
        endpoint: endpoint.path,
        method: endpoint.method,
        name: `Test ${endpoint.method} ${endpoint.path}`,
        description: `Test case for ${endpoint.method} ${endpoint.path}`,
        request: {
          headers: endpoint.method === 'POST' || endpoint.method === 'PUT'
            ? { 'Content-Type': 'application/json' }
            : undefined,
          pathParameters: this.generateTestPathParameters(endpoint.parameters),
          queryParameters: this.generateTestQueryParameters(endpoint.parameters),
          body: endpoint.requestBody ? this.generateTestRequestBody(endpoint.requestBody) : undefined
        },
        expectedResponse: {
          statusCode: 200,
          body: this.generateTestResponseBody(endpoint.responses)
        },
        tags: endpoint.tags,
        category: 'integration'
      });
    }

    return testCases;
  }

  // Private helper methods

  private extractExpressRoutes(file: FileContent): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const content = file.content;

    // Extract app routes
    let match;
    this.ROUTE_PATTERNS.express.app.lastIndex = 0;
    while ((match = this.ROUTE_PATTERNS.express.app.exec(content)) !== null) {
      const method = match[1]?.toUpperCase() as HttpMethod;
      const path = match[2];

      if (method && path && method !== 'USE') {
        endpoints.push(this.createEndpoint(method, path, file, match.index));
      }
    }

    // Extract router routes
    this.ROUTE_PATTERNS.express.router.lastIndex = 0;
    while ((match = this.ROUTE_PATTERNS.express.router.exec(content)) !== null) {
      const method = match[1]?.toUpperCase() as HttpMethod;
      const path = match[2];

      if (method && path && method !== 'USE') {
        endpoints.push(this.createEndpoint(method, path, file, match.index, 'router'));
      }
    }

    return endpoints;
  }

  private extractFastifyRoutes(file: FileContent): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const content = file.content;

    let match;
    this.ROUTE_PATTERNS.fastify.route.lastIndex = 0;
    while ((match = this.ROUTE_PATTERNS.fastify.route.exec(content)) !== null) {
      const method = match[1]?.toUpperCase() as HttpMethod;
      const path = match[2];

      if (method && path) {
        endpoints.push(this.createEndpoint(method, path, file, match.index));
      }
    }

    return endpoints;
  }

  private extractNestJSRoutes(file: FileContent): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const content = file.content;

    // Extract controller base path
    let controllerMatch;
    this.ROUTE_PATTERNS.nestjs.controller.lastIndex = 0;
    controllerMatch = this.ROUTE_PATTERNS.nestjs.controller.exec(content);
    const basePath = controllerMatch ? `/${controllerMatch[1]}` : '';

    // Extract method routes
    let match;
    this.ROUTE_PATTERNS.nestjs.methods.lastIndex = 0;
    while ((match = this.ROUTE_PATTERNS.nestjs.methods.exec(content)) !== null) {
      const method = match[1]?.toUpperCase() as HttpMethod;
      const methodPath = match[2] || '';
      const fullPath = basePath + (methodPath ? `/${methodPath}` : '');

      if (method) {
        endpoints.push(this.createEndpoint(method, fullPath, file, match.index));
      }
    }

    // Extract methods without parameters
    this.ROUTE_PATTERNS.nestjs.methodsNoParams.lastIndex = 0;
    while ((match = this.ROUTE_PATTERNS.nestjs.methodsNoParams.exec(content)) !== null) {
      const method = match[1]?.toUpperCase() as HttpMethod;

      if (method) {
        endpoints.push(this.createEndpoint(method, basePath, file, match.index));
      }
    }

    return endpoints;
  }

  private createEndpoint(
    method: HttpMethod,
    path: string,
    file: FileContent,
    index: number,
    context?: string
  ): ApiEndpoint {
    const lines = file.content.slice(0, index).split('\n');
    const lineNumber = lines.length;

    return {
      id: `endpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      method,
      path: path.startsWith('/') ? path : `/${path}`,
      summary: `${method} ${path}`,
      description: `${method} endpoint for ${path}`,
      handler: this.extractHandlerSignature(file, lineNumber),
      middleware: this.extractEndpointMiddleware(file, lineNumber),
      parameters: this.extractPathParameters(path).concat(this.extractQueryParameters(file, lineNumber)),
      requestBody: this.extractRequestBody(file, lineNumber),
      responses: this.extractResponses(file, lineNumber),
      authentication: undefined,
      tags: [context || 'api'],
      location: {
        file: file.path,
        startLine: lineNumber,
        startColumn: index - lines[lines.length - 1]!.length,
        context: lines[lines.length - 1]?.trim()
      },
      examples: [],
      deprecated: false
    };
  }

  private extractPathParameters(path: string): ApiParameter[] {
    const params: ApiParameter[] = [];
    const matches = path.match(/:(\w+)/g);

    if (matches) {
      for (const match of matches) {
        const paramName = match.slice(1); // Remove the ':'
        params.push({
          name: paramName,
          in: 'path',
          type: 'string',
          required: true,
          description: `Path parameter: ${paramName}`,
          schema: { type: 'string' }
        });
      }
    }

    return params;
  }

  private extractQueryParameters(file: FileContent, lineNumber: number): ApiParameter[] {
    const params: ApiParameter[] = [];
    const lines = file.content.split('\n');

    // Look for req.query usage in the function
    for (let i = lineNumber; i < Math.min(lineNumber + 20, lines.length); i++) {
      const line = lines[i];
      if (!line) continue;

      // Match patterns like req.query.paramName or req.query['paramName']
      const queryMatches = line.match(/req\.query\.(\w+)|req\.query\[['"](\w+)['"]\]/g);
      if (queryMatches) {
        for (const match of queryMatches) {
          const paramMatch = match.match(/req\.query\.(\w+)|req\.query\[['"](\w+)['"]\]/);
          if (paramMatch) {
            const paramName = paramMatch[1] || paramMatch[2];
            if (paramName && !params.some(p => p.name === paramName)) {
              params.push({
                name: paramName,
                in: 'query',
                type: 'string',
                required: false,
                description: `Query parameter: ${paramName}`,
                schema: { type: 'string' }
              });
            }
          }
        }
      }

      // Match destructuring patterns like const { param1, param2 } = req.query
      const destructureMatch = line.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*req\.query/);
      if (destructureMatch) {
        const paramNames = destructureMatch[1]!.split(',').map(p => p.trim());
        for (const paramName of paramNames) {
          if (paramName && !params.some(p => p.name === paramName)) {
            params.push({
              name: paramName,
              in: 'query',
              type: 'string',
              required: false,
              description: `Query parameter: ${paramName}`,
              schema: { type: 'string' }
            });
          }
        }
      }
    }

    return params;
  }

  private extractRequestBody(file: FileContent, lineNumber: number): RequestBodyDefinition | undefined {
    const lines = file.content.split('\n');

    // Look for req.body usage
    for (let i = lineNumber; i < Math.min(lineNumber + 20, lines.length); i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.includes('req.body')) {
        // Extract properties from req.body destructuring
        const destructureMatch = line.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*req\.body/);
        if (destructureMatch) {
          const properties: Record<string, JsonSchema> = {};
          const propNames = destructureMatch[1]!.split(',').map(p => p.trim());

          for (const propName of propNames) {
            properties[propName] = { type: 'string' };
          }

          return {
            required: true,
            contentType: ['application/json'],
            schema: {
              type: 'object',
              properties,
              required: propNames
            },
            description: 'Request body',
            examples: {}
          };
        }
      }
    }

    return undefined;
  }

  private extractResponses(file: FileContent, lineNumber: number): ResponseDefinition[] {
    const responses: ResponseDefinition[] = [];
    const lines = file.content.split('\n');

    // Look for res.json() calls
    for (let i = lineNumber; i < Math.min(lineNumber + 30, lines.length); i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.includes('res.json')) {
        // Extract response object structure
        const jsonMatch = line.match(/res\.json\s*\(\s*\{([^}]*)\}/);
        if (jsonMatch) {
          const properties: Record<string, JsonSchema> = {};
          const content = jsonMatch[1];

          // Simple property extraction - could be enhanced
          if (content) {
            const props = content.split(',').map(p => p.trim());
            for (const prop of props) {
              const propName = prop.split(':')[0]?.trim() || prop.trim();
              if (propName) {
                properties[propName] = { type: 'string' };
              }
            }
          }

          responses.push({
            statusCode: 200,
            description: 'Success',
            contentType: ['application/json'],
            schema: {
              type: 'object',
              properties
            },
            examples: {}
          });
        }
      }
    }

    // Default response if none found
    if (responses.length === 0) {
      responses.push({
        statusCode: 200,
        description: 'Success',
        contentType: ['application/json'],
        examples: {}
      });
    }

    return responses;
  }

  private extractHandlerSignature(file: FileContent, lineNumber: number): FunctionSignature {
    const lines = file.content.split('\n');
    const line = lines[lineNumber - 1] || '';

    return {
      name: 'handler',
      parameters: [
        { name: 'req', type: 'Request', optional: false },
        { name: 'res', type: 'Response', optional: false }
      ],
      returnType: 'void',
      isAsync: line.includes('async'),
      isArrow: line.includes('=>'),
      location: {
        file: file.path,
        startLine: lineNumber,
        startColumn: 1
      }
    };
  }

  private extractEndpointMiddleware(file: FileContent, lineNumber: number): string[] {
    const middleware: string[] = [];
    const lines = file.content.split('\n');
    const line = lines[lineNumber - 1] || '';

    // Look for middleware in the route definition
    const middlewareMatch = line.match(/,\s*(\w+Middleware|\w+Auth|\w+Validation)/g);
    if (middlewareMatch) {
      middleware.push(...middlewareMatch.map(m => m.replace(',', '').trim()));
    }

    return middleware;
  }

  private extractMiddleware(file: FileContent): MiddlewareDefinition[] {
    const middleware: MiddlewareDefinition[] = [];
    const content = file.content;

    // Look for middleware function definitions
    const middlewareMatches = content.match(/const\s+(\w+Middleware|\w+Auth|\w+Validation)\s*=/g);
    if (middlewareMatches) {
      for (const match of middlewareMatches) {
        const nameMatch = match.match(/const\s+(\w+)/);
        if (nameMatch) {
          middleware.push({
            id: `middleware-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: nameMatch[1]!,
            type: this.inferMiddlewareType(nameMatch[1]!),
            function: {
              name: nameMatch[1]!,
              parameters: [],
              returnType: 'void',
              isAsync: false,
              isArrow: true,
              location: { file: file.path, startLine: 1, startColumn: 1 }
            },
            order: 0,
            global: false,
            routes: []
          });
        }
      }
    }

    return middleware;
  }

  private inferMiddlewareType(name: string): any {
    if (name.toLowerCase().includes('auth')) return 'authentication';
    if (name.toLowerCase().includes('validation')) return 'validation';
    if (name.toLowerCase().includes('cors')) return 'cors';
    if (name.toLowerCase().includes('rate')) return 'rate_limiting';
    return 'custom';
  }

  private combineRouterPaths(endpoints: ApiEndpoint[]): void {
    // Find router mount points and combine paths
    const routerEndpoints = endpoints.filter(ep => ep.tags.includes('router'));

    for (const routerEndpoint of routerEndpoints) {
      // Look for app.use patterns that might mount this router
      // This is a simplified implementation
      if (routerEndpoint.path.startsWith('/')) {
        routerEndpoint.path = '/api' + routerEndpoint.path;
      }
    }
  }

  private calculateFrameworkBreakdown(endpoints: ApiEndpoint[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const endpoint of endpoints) {
      for (const tag of endpoint.tags) {
        breakdown[tag] = (breakdown[tag] || 0) + 1;
      }
    }

    return breakdown;
  }

  private calculateMethodBreakdown(endpoints: ApiEndpoint[]): Record<HttpMethod, number> {
    const breakdown: Record<HttpMethod, number> = {} as Record<HttpMethod, number>;

    for (const endpoint of endpoints) {
      breakdown[endpoint.method] = (breakdown[endpoint.method] || 0) + 1;
    }

    return breakdown;
  }

  private extractTypeScriptSchemas(file: FileContent): SchemaDefinition[] {
    const schemas: SchemaDefinition[] = [];

    if (!file.name.endsWith('.ts')) return schemas;

    const content = file.content;
    let match;

    // Extract interfaces
    this.SCHEMA_PATTERNS.typescript.interface.lastIndex = 0;
    while ((match = this.SCHEMA_PATTERNS.typescript.interface.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];

      if (name && body) {
        const schema = this.parseInterfaceBody(body);
        schemas.push({
          id: `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          type: 'interface',
          source: 'typescript',
          schema,
          examples: [],
          location: {
            file: file.path,
            startLine: this.getLineNumber(content, match.index),
            startColumn: 1
          },
          dependencies: [],
          isGeneric: false
        });
      }
    }

    return schemas;
  }

  private parseInterfaceBody(body: string): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    const lines = body.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      const propMatch = line.match(/(\w+)(\?)?:\s*([^;,]+)/);
      if (propMatch) {
        const propName = propMatch[1]!;
        const isOptional = !!propMatch[2];
        const propType = propMatch[3]!.trim();

        properties[propName] = this.typeScriptTypeToJsonSchema(propType);

        if (!isOptional) {
          required.push(propName);
        }
      }
    }

    return {
      type: 'object',
      properties,
      required
    };
  }

  private typeScriptTypeToJsonSchema(tsType: string): JsonSchema {
    switch (tsType) {
      case 'string': return { type: 'string' };
      case 'number': return { type: 'number' };
      case 'boolean': return { type: 'boolean' };
      case 'string[]': return { type: 'array', items: { type: 'string' } };
      case 'number[]': return { type: 'array', items: { type: 'number' } };
      default: return { type: 'string' };
    }
  }

  private extractValidationSchemas(file: FileContent): ValidationSchema[] {
    const schemas: ValidationSchema[] = [];

    // Extract Joi schemas
    if (file.content.includes('Joi.')) {
      const joiSchemas = this.extractJoiSchemas(file);
      schemas.push(...joiSchemas);
    }

    // Extract Zod schemas
    if (file.content.includes('z.')) {
      const zodSchemas = this.extractZodSchemas(file);
      schemas.push(...zodSchemas);
    }

    return schemas;
  }

  private extractJoiSchemas(file: FileContent): ValidationSchema[] {
    const schemas: ValidationSchema[] = [];
    const content = file.content;
    let match;

    this.SCHEMA_PATTERNS.joi.schema.lastIndex = 0;
    while ((match = this.SCHEMA_PATTERNS.joi.schema.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];

      if (name && body) {
        schemas.push({
          library: 'joi',
          schemaName: name,
          schemaObject: {}, // Would need proper Joi parsing
          jsonSchema: this.parseJoiSchema(body),
          location: {
            file: file.path,
            startLine: this.getLineNumber(content, match.index),
            startColumn: 1
          }
        });
      }
    }

    return schemas;
  }

  private parseJoiSchema(body: string): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    // Simple Joi parsing - would need more sophisticated parsing in real implementation
    const lines = body.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      const propMatch = line.match(/(\w+):\s*Joi\.(\w+)\(\)/);
      if (propMatch) {
        const propName = propMatch[1]!;
        const joiType = propMatch[2]!;

        properties[propName] = this.joiTypeToJsonSchema(joiType);

        if (line.includes('.required()')) {
          required.push(propName);
        }
      }
    }

    return {
      type: 'object',
      properties,
      required
    };
  }

  private joiTypeToJsonSchema(joiType: string): JsonSchema {
    switch (joiType) {
      case 'string': return { type: 'string' };
      case 'number': return { type: 'number' };
      case 'boolean': return { type: 'boolean' };
      case 'array': return { type: 'array' };
      case 'object': return { type: 'object' };
      default: return { type: 'string' };
    }
  }

  private extractZodSchemas(file: FileContent): ValidationSchema[] {
    const schemas: ValidationSchema[] = [];
    const content = file.content;
    let match;

    this.SCHEMA_PATTERNS.zod.schema.lastIndex = 0;
    while ((match = this.SCHEMA_PATTERNS.zod.schema.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];

      if (name && body) {
        schemas.push({
          library: 'zod',
          schemaName: name,
          schemaObject: {},
          jsonSchema: this.parseZodSchema(body),
          location: {
            file: file.path,
            startLine: this.getLineNumber(content, match.index),
            startColumn: 1
          }
        });
      }
    }

    return schemas;
  }

  private parseZodSchema(body: string): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    const lines = body.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      const propMatch = line.match(/(\w+):\s*z\.(\w+)\(\)/);
      if (propMatch) {
        const propName = propMatch[1]!;
        const zodType = propMatch[2]!;

        properties[propName] = this.zodTypeToJsonSchema(zodType, line);
        required.push(propName); // Zod properties are required by default
      }
    }

    return {
      type: 'object',
      properties,
      required
    };
  }

  private zodTypeToJsonSchema(zodType: string, line: string): JsonSchema {
    const schema: JsonSchema = { type: 'string' };

    switch (zodType) {
      case 'string':
        schema.type = 'string';
        if (line.includes('.email()')) {
          schema.format = 'email';
        }
        break;
      case 'number': schema.type = 'number'; break;
      case 'boolean': schema.type = 'boolean'; break;
      case 'array': schema.type = 'array'; break;
      case 'object': schema.type = 'object'; break;
    }

    return schema;
  }

  private extractModelSchemas(file: FileContent): ModelSchema[] {
    const schemas: ModelSchema[] = [];

    if (file.content.includes('mongoose.Schema')) {
      const mongooseSchemas = this.extractMongooseSchemas(file);
      schemas.push(...mongooseSchemas);
    }

    return schemas;
  }

  private extractMongooseSchemas(file: FileContent): ModelSchema[] {
    const schemas: ModelSchema[] = [];
    const content = file.content;

    let schemaMatch;
    this.SCHEMA_PATTERNS.mongoose.schema.lastIndex = 0;
    while ((schemaMatch = this.SCHEMA_PATTERNS.mongoose.schema.exec(content)) !== null) {
      const body = schemaMatch[1];

      let modelMatch;
      this.SCHEMA_PATTERNS.mongoose.model.lastIndex = 0;
      modelMatch = this.SCHEMA_PATTERNS.mongoose.model.exec(content);

      if (body && modelMatch) {
        const modelName = modelMatch[1]!;

        schemas.push({
          framework: 'mongoose',
          modelName,
          schema: {},
          jsonSchema: this.parseMongooseSchema(body),
          relationships: [],
          location: {
            file: file.path,
            startLine: this.getLineNumber(content, schemaMatch.index),
            startColumn: 1
          }
        });
      }
    }

    return schemas;
  }

  private parseMongooseSchema(body: string): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    const lines = body.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      const propMatch = line.match(/(\w+):\s*\{\s*type:\s*(\w+)/);
      if (propMatch) {
        const propName = propMatch[1]!;
        const mongooseType = propMatch[2]!;

        properties[propName] = this.mongooseTypeToJsonSchema(mongooseType);

        if (line.includes('required: true')) {
          required.push(propName);
        }
      }
    }

    return {
      type: 'object',
      properties,
      required
    };
  }

  private mongooseTypeToJsonSchema(mongooseType: string): JsonSchema {
    switch (mongooseType) {
      case 'String': return { type: 'string' };
      case 'Number': return { type: 'number' };
      case 'Boolean': return { type: 'boolean' };
      case 'Date': return { type: 'string', format: 'date-time' };
      case 'Array': return { type: 'array' };
      default: return { type: 'string' };
    }
  }

  private convertValidationToSchema(validationSchema: ValidationSchema): SchemaDefinition {
    return {
      id: `validation-schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: validationSchema.schemaName,
      type: 'validation',
      source: validationSchema.library,
      schema: validationSchema.jsonSchema,
      examples: [],
      location: validationSchema.location,
      dependencies: [],
      isGeneric: false
    };
  }

  private convertModelToSchema(modelSchema: ModelSchema): SchemaDefinition {
    return {
      id: `model-schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: modelSchema.modelName,
      type: 'model',
      source: modelSchema.framework,
      schema: modelSchema.jsonSchema,
      examples: [],
      location: modelSchema.location,
      dependencies: [],
      isGeneric: false
    };
  }

  private getLineNumber(content: string, index: number): number {
    return content.slice(0, index).split('\n').length;
  }

  private pathToOperationName(path: string): string {
    return path
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(word => word)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private convertParametersToOpenAPI(parameters: ApiParameter[]): any[] {
    return parameters.map(param => ({
      name: param.name,
      in: param.in,
      required: param.required,
      description: param.description,
      schema: param.schema
    }));
  }

  private convertRequestBodyToOpenAPI(requestBody: RequestBodyDefinition): any {
    return {
      required: requestBody.required,
      content: {
        'application/json': {
          schema: requestBody.schema
        }
      }
    };
  }

  private convertResponsesToOpenAPI(responses: ResponseDefinition[]): any {
    const openApiResponses: any = {};

    for (const response of responses) {
      openApiResponses[response.statusCode.toString()] = {
        description: response.description,
        content: response.schema ? {
          'application/json': {
            schema: response.schema
          }
        } : undefined
      };
    }

    return openApiResponses;
  }

  private generateTestPathParameters(parameters: ApiParameter[]): Record<string, any> | undefined {
    const pathParams = parameters.filter(p => p.in === 'path');
    if (pathParams.length === 0) return undefined;

    const testParams: Record<string, any> = {};
    for (const param of pathParams) {
      testParams[param.name] = this.generateTestValue(param.type);
    }
    return testParams;
  }

  private generateTestQueryParameters(parameters: ApiParameter[]): Record<string, any> | undefined {
    const queryParams = parameters.filter(p => p.in === 'query');
    if (queryParams.length === 0) return undefined;

    const testParams: Record<string, any> = {};
    for (const param of queryParams) {
      testParams[param.name] = this.generateTestValue(param.type);
    }
    return testParams;
  }

  private generateTestRequestBody(requestBody: RequestBodyDefinition): any {
    if (!requestBody.schema || requestBody.schema.type !== 'object') {
      return {};
    }

    const testBody: any = {};
    const properties = requestBody.schema.properties || {};

    for (const [propName, propSchema] of Object.entries(properties)) {
      testBody[propName] = this.generateTestValueFromSchema(propSchema);
    }

    return testBody;
  }

  private generateTestResponseBody(responses: ResponseDefinition[]): any {
    const response200 = responses.find(r => r.statusCode === 200);
    if (!response200 || !response200.schema) {
      return {};
    }

    return this.generateTestValueFromSchema(response200.schema);
  }

  private generateTestValue(type: ParameterType): any {
    switch (type) {
      case 'string': return 'test-value';
      case 'number':
      case 'integer': return 123;
      case 'boolean': return true;
      case 'array': return ['test-item'];
      case 'object': return { key: 'value' };
      default: return 'test-value';
    }
  }

  private generateTestValueFromSchema(schema: JsonSchema): any {
    if (Array.isArray(schema.type)) {
      return this.generateTestValueFromSchema({ ...schema, type: schema.type[0] });
    }

    switch (schema.type) {
      case 'string': return schema.example || 'test-string';
      case 'number':
      case 'integer': return schema.example || 123;
      case 'boolean': return schema.example || true;
      case 'array':
        return schema.items
          ? [this.generateTestValueFromSchema(Array.isArray(schema.items) ? schema.items[0] || {} : schema.items)]
          : ['test-item'];
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            obj[propName] = this.generateTestValueFromSchema(propSchema);
          }
        }
        return obj;
      default: return 'test-value';
    }
  }

  private generateMultiFormatDocumentation(
    apiSpec: OpenApiSpec,
    formats: string[]
  ): GeneratedDocumentation {
    const documentationFormats: DocumentationFormat[] = [];

    for (const format of formats) {
      let content: string | object;
      let size: number;

      switch (format) {
        case 'openapi':
          content = apiSpec;
          size = JSON.stringify(apiSpec).length;
          break;
        case 'markdown':
          content = this.generateMarkdownDocumentation(apiSpec);
          size = content.length;
          break;
        case 'postman':
          content = this.generatePostmanCollection(apiSpec);
          size = JSON.stringify(content).length;
          break;
        default:
          content = JSON.stringify(apiSpec);
          size = content.length;
      }

      documentationFormats.push({
        type: format as any,
        content,
        size,
        checksum: this.generateChecksum(typeof content === 'string' ? content : JSON.stringify(content))
      });
    }

    return {
      formats: documentationFormats,
      metadata: {
        generatedAt: new Date(),
        generator: 'ApiDocumentationGenerator',
        version: '1.0.0',
        sourceFiles: 0,
        totalEndpoints: Object.keys(apiSpec.paths).length,
        totalSchemas: Object.keys(apiSpec.components?.schemas || {}).length,
        frameworks: []
      },
      customization: {}
    };
  }

  private generateMarkdownDocumentation(apiSpec: OpenApiSpec): string {
    let markdown = `# ${apiSpec.info.title}\n\n`;
    markdown += `${apiSpec.info.description || ''}\n\n`;
    markdown += `Version: ${apiSpec.info.version}\n\n`;

    markdown += '## Endpoints\n\n';

    for (const [path, pathItem] of Object.entries(apiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && operation.summary) {
          markdown += `### ${method.toUpperCase()} ${path}\n\n`;
          markdown += `${operation.summary}\n\n`;
          if (operation.description) {
            markdown += `${operation.description}\n\n`;
          }
        }
      }
    }

    return markdown;
  }

  private generatePostmanCollection(apiSpec: OpenApiSpec): object {
    const collection = {
      info: {
        name: apiSpec.info.title,
        description: apiSpec.info.description,
        version: apiSpec.info.version,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [] as any[]
    };

    for (const [path, pathItem] of Object.entries(apiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && operation.summary) {
          collection.item.push({
            name: operation.summary,
            request: {
              method: method.toUpperCase(),
              header: [],
              url: {
                raw: `{{baseUrl}}${path}`,
                host: ['{{baseUrl}}'],
                path: path.split('/').filter(p => p)
              }
            }
          });
        }
      }
    }

    return collection;
  }

  private generateChecksum(content: string): string {
    // Simple hash function - in real implementation would use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private calculateStatistics(
    discoveryResult: ApiDiscoveryResult,
    schemaResult: SchemaExtractionResult,
    documentation: GeneratedDocumentation,
    errors: DocumentationError[]
  ): DocumentationStatistics {
    const analysis: AnalysisStatistics = {
      totalFiles: 0,
      processedFiles: 0,
      skippedFiles: 0,
      processingTime: 0,
      errors: {
        parseErrors: 0,
        analysisErrors: 0,
        generationErrors: 0,
        validationErrors: 0
      }
    };

    const generation: GenerationStatistics = {
      totalEndpoints: discoveryResult.totalEndpoints,
      successfulEndpoints: discoveryResult.totalEndpoints,
      failedEndpoints: 0,
      totalSchemas: schemaResult.totalSchemas,
      generatedSchemas: schemaResult.totalSchemas,
      generationTime: 0
    };

    const validation: ValidationStatistics = {
      validatedSchemas: 0,
      validationErrors: 0,
      validationWarnings: 0,
      validationTime: 0
    };

    const output: OutputStatistics = {
      generatedFormats: documentation.formats.length,
      totalOutputSize: documentation.formats.reduce((sum, f) => sum + f.size, 0),
      outputTime: 0,
      outputFiles: documentation.formats.length
    };

    return {
      analysis,
      generation,
      validation,
      output
    };
  }

  private createEmptyResult(
    id: string,
    timestamp: Date,
    errors: DocumentationError[],
    warnings: DocumentationWarning[]
  ): ApiDocumentationResult {
    return {
      id,
      timestamp,
      apiSpec: {
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        servers: [],
        paths: {},
        components: {}
      },
      endpoints: [],
      schemas: [],
      authentication: [],
      rateLimiting: [],
      documentation: {
        formats: [],
        metadata: {
          generatedAt: timestamp,
          generator: 'ApiDocumentationGenerator',
          version: '1.0.0',
          sourceFiles: 0,
          totalEndpoints: 0,
          totalSchemas: 0,
          frameworks: []
        },
        customization: {}
      },
      testCases: [],
      statistics: {
        analysis: {
          totalFiles: 0,
          processedFiles: 0,
          skippedFiles: 0,
          processingTime: 0,
          errors: {
            parseErrors: 0,
            analysisErrors: 0,
            generationErrors: 0,
            validationErrors: 0
          }
        },
        generation: {
          totalEndpoints: 0,
          successfulEndpoints: 0,
          failedEndpoints: 0,
          totalSchemas: 0,
          generatedSchemas: 0,
          generationTime: 0
        },
        validation: {
          validatedSchemas: 0,
          validationErrors: 0,
          validationWarnings: 0,
          validationTime: 0
        },
        output: {
          generatedFormats: 0,
          totalOutputSize: 0,
          outputTime: 0,
          outputFiles: 0
        }
      },
      errors,
      warnings
    };
  }
}