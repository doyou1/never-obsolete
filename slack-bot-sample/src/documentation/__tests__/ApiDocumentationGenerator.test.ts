// TASK-309: API Documentation Generator Test Suite
import { ApiDocumentationGenerator } from '../ApiDocumentationGenerator';
import { FileContent } from '../../github/types';
import {
  ApiDocumentationContext,
  HttpMethod
} from '../types';

describe('ApiDocumentationGenerator', () => {
  let generator: ApiDocumentationGenerator;

  beforeEach(() => {
    generator = new ApiDocumentationGenerator();
  });

  describe('API Discovery & Route Detection', () => {
    test('TC-309-001: Express.js Route Detection', async () => {
      const files: FileContent[] = [{
        name: 'app.js',
        path: 'src/app.js',
        content: `
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users/:id', (req, res) => {
  res.json({ user: req.body });
});
        `,
        encoding: 'utf-8',
        size: 200,
        sha: 'abc123',
        url: 'http://example.com/app.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(2);
      expect(result.endpoints[0]?.method).toBe('GET');
      expect(result.endpoints[0]?.path).toBe('/users');
      expect(result.endpoints[1]?.method).toBe('POST');
      expect(result.endpoints[1]?.path).toBe('/users/:id');
      expect(result.frameworksDetected).toContain('express');
    });

    test('TC-309-002: Express Router Detection', async () => {
      const files: FileContent[] = [{
        name: 'routes.js',
        path: 'src/routes.js',
        content: `
const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
  res.json({ profile: {} });
});

app.use('/api', router);
        `,
        encoding: 'utf-8',
        size: 150,
        sha: 'def456',
        url: 'http://example.com/routes.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(1);
      expect(result.endpoints[0]?.path).toBe('/api/profile');
      expect(result.endpoints[0]?.method).toBe('GET');
    });

    test('TC-309-003: Fastify Route Detection', async () => {
      const files: FileContent[] = [{
        name: 'fastify-app.js',
        path: 'src/fastify-app.js',
        content: `
const fastify = require('fastify')();

fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

fastify.register(async function (fastify) {
  fastify.get('/api/users', async (request, reply) => {
    return { users: [] };
  });
});
        `,
        encoding: 'utf-8',
        size: 180,
        sha: 'ghi789',
        url: 'http://example.com/fastify-app.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(2);
      expect(result.frameworksDetected).toContain('fastify');
      expect(result.endpoints.some(ep => ep.path === '/health')).toBe(true);
      expect(result.endpoints.some(ep => ep.path === '/api/users')).toBe(true);
    });

    test('TC-309-004: NestJS Controller Detection', async () => {
      const files: FileContent[] = [{
        name: 'users.controller.ts',
        path: 'src/controllers/users.controller.ts',
        content: `
import { Controller, Get, Post, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return createUserDto;
  }
}
        `,
        encoding: 'utf-8',
        size: 250,
        sha: 'jkl012',
        url: 'http://example.com/users.controller.ts'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(3);
      expect(result.frameworksDetected).toContain('nestjs');
      expect(result.endpoints[0]?.path).toBe('/users');
      expect(result.endpoints[1]?.path).toBe('/users/:id');
      expect(result.endpoints[2]?.path).toBe('/users');
      expect(result.endpoints[2]?.method).toBe('POST');
    });

    test('TC-309-005: Path Parameter Extraction', async () => {
      const files: FileContent[] = [{
        name: 'params.js',
        path: 'src/params.js',
        content: `
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ userId });
});

app.get('/posts/:postId/comments/:commentId', (req, res) => {
  const { postId, commentId } = req.params;
  res.json({ postId, commentId });
});
        `,
        encoding: 'utf-8',
        size: 200,
        sha: 'mno345',
        url: 'http://example.com/params.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(2);

      const firstEndpoint = result.endpoints[0];
      expect(firstEndpoint?.parameters).toHaveLength(1);
      expect(firstEndpoint?.parameters[0]?.name).toBe('id');
      expect(firstEndpoint?.parameters[0]?.in).toBe('path');
      expect(firstEndpoint?.parameters[0]?.required).toBe(true);

      const secondEndpoint = result.endpoints[1];
      expect(secondEndpoint?.parameters).toHaveLength(2);
      expect(secondEndpoint?.parameters.map(p => p.name)).toEqual(['postId', 'commentId']);
    });

    test('TC-309-006: Query Parameter Analysis', async () => {
      const files: FileContent[] = [{
        name: 'query.js',
        path: 'src/query.js',
        content: `
app.get('/search', (req, res) => {
  const { limit, sort, filter } = req.query;
  const page = req.query.page || 1;
  res.json({ results: [], limit, sort, filter, page });
});
        `,
        encoding: 'utf-8',
        size: 150,
        sha: 'pqr678',
        url: 'http://example.com/query.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(1);
      const endpoint = result.endpoints[0];
      const queryParams = endpoint?.parameters.filter(p => p.in === 'query');

      expect(queryParams).toHaveLength(4);
      expect(queryParams?.map(p => p.name)).toEqual(['limit', 'sort', 'filter', 'page']);
      expect(queryParams?.find(p => p.name === 'page')?.required).toBe(false);
    });

    test('TC-309-007: Multiple Framework Detection', async () => {
      const files: FileContent[] = [
        {
          name: 'express.js',
          path: 'src/express.js',
          content: 'app.get("/express-route", handler);',
          encoding: 'utf-8',
          size: 50,
          sha: 'abc1',
          url: 'http://example.com/express.js'
        },
        {
          name: 'fastify.js',
          path: 'src/fastify.js',
          content: 'fastify.get("/fastify-route", handler);',
          encoding: 'utf-8',
          size: 50,
          sha: 'abc2',
          url: 'http://example.com/fastify.js'
        }
      ];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(2);
      expect(result.frameworksDetected).toContain('express');
      expect(result.frameworksDetected).toContain('fastify');
    });

    test('TC-309-008: Middleware Route Detection', async () => {
      const files: FileContent[] = [{
        name: 'middleware.js',
        path: 'src/middleware.js',
        content: `
const authMiddleware = (req, res, next) => next();
const validationMiddleware = (req, res, next) => next();

app.use('/api/v1', authMiddleware, routes);
app.get('/protected', authMiddleware, validationMiddleware, handler);
        `,
        encoding: 'utf-8',
        size: 200,
        sha: 'stu901',
        url: 'http://example.com/middleware.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(1);
      expect(result.endpoints[0]?.middleware).toContain('authMiddleware');
      expect(result.endpoints[0]?.middleware).toContain('validationMiddleware');
      expect(result.middleware).toHaveLength(2);
    });

    test('TC-309-009: HTTP Method Completeness', async () => {
      const files: FileContent[] = [{
        name: 'methods.js',
        path: 'src/methods.js',
        content: `
app.get('/resource', handler);
app.post('/resource', handler);
app.put('/resource/:id', handler);
app.delete('/resource/:id', handler);
app.patch('/resource/:id', handler);
app.options('/resource', handler);
        `,
        encoding: 'utf-8',
        size: 200,
        sha: 'vwx234',
        url: 'http://example.com/methods.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      const methods = result.endpoints.map(ep => ep.method);
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('PUT');
      expect(methods).toContain('DELETE');
      expect(methods).toContain('PATCH');
      expect(methods).toContain('OPTIONS');
    });

    test('TC-309-010: Route Versioning Detection', async () => {
      const files: FileContent[] = [{
        name: 'versioning.js',
        path: 'src/versioning.js',
        content: `
app.get('/v1/users', handlerV1);
app.get('/v2/users', handlerV2);
app.get('/api/v1/posts', handlerV1);
        `,
        encoding: 'utf-8',
        size: 120,
        sha: 'yz567',
        url: 'http://example.com/versioning.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(3);
      const versionedEndpoints = result.endpoints.filter(ep =>
        ep.path.includes('/v1/') || ep.path.includes('/v2/')
      );
      expect(versionedEndpoints).toHaveLength(3);
    });
  });

  describe('Schema Analysis & Type Extraction', () => {
    test('TC-309-013: TypeScript Interface Extraction', async () => {
      const files: FileContent[] = [{
        name: 'types.ts',
        path: 'src/types.ts',
        content: `
interface User {
  id: number;
  name: string;
  email?: string;
  active: boolean;
  roles: string[];
}

interface CreateUserDto {
  name: string;
  email: string;
}
        `,
        encoding: 'utf-8',
        size: 200,
        sha: 'abc890',
        url: 'http://example.com/types.ts'
      }];

      const result = await generator.extractSchemas(files);

      expect(result.schemas).toHaveLength(2);
      const userSchema = result.schemas.find(s => s.name === 'User');
      expect(userSchema?.schema.properties).toHaveProperty('id');
      expect(userSchema?.schema.properties).toHaveProperty('name');
      expect(userSchema?.schema.required).toContain('id');
      expect(userSchema?.schema.required).toContain('name');
      expect(userSchema?.schema.required).not.toContain('email');
    });

    test('TC-309-014: Joi Schema Integration', async () => {
      const files: FileContent[] = [{
        name: 'validation.js',
        path: 'src/validation.js',
        content: `
const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email(),
  age: Joi.number().min(18).max(100)
});
        `,
        encoding: 'utf-8',
        size: 150,
        sha: 'def123',
        url: 'http://example.com/validation.js'
      }];

      const result = await generator.extractSchemas(files);

      expect(result.validationSchemas).toHaveLength(1);
      const joiSchema = result.validationSchemas[0];
      expect(joiSchema?.library).toBe('joi');
      expect(joiSchema?.jsonSchema.properties).toHaveProperty('name');
      expect(joiSchema?.jsonSchema.properties).toHaveProperty('email');
      expect(joiSchema?.jsonSchema.properties).toHaveProperty('age');
    });

    test('TC-309-015: Zod Schema Integration', async () => {
      const files: FileContent[] = [{
        name: 'zod-schema.ts',
        path: 'src/zod-schema.ts',
        content: `
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword);
        `,
        encoding: 'utf-8',
        size: 180,
        sha: 'ghi456',
        url: 'http://example.com/zod-schema.ts'
      }];

      const result = await generator.extractSchemas(files);

      expect(result.validationSchemas).toHaveLength(1);
      const zodSchema = result.validationSchemas[0];
      expect(zodSchema?.library).toBe('zod');
      expect(zodSchema?.jsonSchema.properties).toHaveProperty('email');
      expect(zodSchema?.jsonSchema.properties?.email?.format).toBe('email');
    });

    test('TC-309-016: Mongoose Model Extraction', async () => {
      const files: FileContent[] = [{
        name: 'user-model.js',
        path: 'src/models/user-model.js',
        content: `
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  age: { type: Number, min: 0, max: 120 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
        `,
        encoding: 'utf-8',
        size: 250,
        sha: 'jkl789',
        url: 'http://example.com/user-model.js'
      }];

      const result = await generator.extractSchemas(files);

      expect(result.modelSchemas).toHaveLength(1);
      const mongooseSchema = result.modelSchemas[0];
      expect(mongooseSchema?.framework).toBe('mongoose');
      expect(mongooseSchema?.modelName).toBe('User');
      expect(mongooseSchema?.jsonSchema.properties).toHaveProperty('name');
      expect(mongooseSchema?.jsonSchema.properties).toHaveProperty('email');
    });

    test('TC-309-018: Request Body Schema Inference', async () => {
      const files: FileContent[] = [{
        name: 'api.js',
        path: 'src/api.js',
        content: `
app.post('/users', (req, res) => {
  const { name, email, age } = req.body;
  const user = { id: Date.now(), name, email, age };
  res.json(user);
});
        `,
        encoding: 'utf-8',
        size: 150,
        sha: 'mno012',
        url: 'http://example.com/api.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(1);
      const endpoint = result.endpoints[0];
      expect(endpoint?.requestBody?.schema.properties).toHaveProperty('name');
      expect(endpoint?.requestBody?.schema.properties).toHaveProperty('email');
      expect(endpoint?.requestBody?.schema.properties).toHaveProperty('age');
    });

    test('TC-309-019: Response Schema Inference', async () => {
      const files: FileContent[] = [{
        name: 'response.js',
        path: 'src/response.js',
        content: `
app.get('/user/:id', (req, res) => {
  const user = { id: req.params.id, name: 'John', email: 'john@example.com' };
  res.json({ user, timestamp: Date.now() });
});
        `,
        encoding: 'utf-8',
        size: 180,
        sha: 'pqr345',
        url: 'http://example.com/response.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.endpoints).toHaveLength(1);
      const endpoint = result.endpoints[0];
      const response200 = endpoint?.responses.find(r => r.statusCode === 200);
      expect(response200?.schema?.properties).toHaveProperty('user');
      expect(response200?.schema?.properties).toHaveProperty('timestamp');
    });
  });

  describe('Documentation Generation', () => {
    test('TC-309-025: OpenAPI 3.0 Specification Generation', async () => {
      const endpoints = [
        {
          id: 'endpoint-1',
          method: 'GET' as HttpMethod,
          path: '/users',
          summary: 'Get all users',
          description: 'Retrieve a list of all users',
          handler: {
            name: 'getUsers',
            parameters: [],
            returnType: 'User[]',
            isAsync: true,
            isArrow: false,
            location: { file: 'test.js', startLine: 1, startColumn: 1 }
          },
          middleware: [],
          parameters: [],
          responses: [{
            statusCode: 200,
            description: 'Success',
            contentType: ['application/json'],
            schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            examples: {}
          }],
          authentication: undefined,
          tags: ['users'],
          location: { file: 'test.js', startLine: 1, startColumn: 1 },
          examples: [],
          deprecated: false
        }
      ];

      const schemas = [
        {
          id: 'schema-1',
          name: 'User',
          type: 'interface' as const,
          source: 'typescript' as const,
          schema: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' }
            },
            required: ['id', 'name']
          },
          examples: [],
          location: { file: 'types.ts', startLine: 1, startColumn: 1 },
          dependencies: [],
          isGeneric: false
        }
      ];

      const spec = await generator.generateOpenApiSpec(endpoints, schemas);

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.paths).toHaveProperty('/users');
      expect(spec.paths['/users']?.get).toBeDefined();
      expect(spec.components?.schemas).toHaveProperty('User');
    });

    test('TC-309-030: Multi-format Output', async () => {
      const context: ApiDocumentationContext = {
        files: [{
          name: 'simple.js',
          path: 'src/simple.js',
          content: 'app.get("/test", (req, res) => res.json({message: "test"}));',
          encoding: 'utf-8',
          size: 100,
          sha: 'test123',
          url: 'http://example.com/simple.js'
        }],
        projectMetadata: {
          name: 'Test API',
          version: '1.0.0',
          title: 'Test API Documentation',
          description: 'Test API for documentation generation',
          baseUrl: 'http://localhost:3000',
          contact: {
            name: 'Test Team',
            email: 'test@example.com',
            url: 'http://example.com'
          },
          license: {
            name: 'MIT',
            url: 'http://opensource.org/licenses/MIT'
          },
          termsOfService: 'http://example.com/terms',
          servers: [],
          tags: []
        },
        frameworks: [{
          name: 'express',
          version: '4.x',
          patterns: [{
            name: 'express-routes',
            pattern: /app\.(get|post|put|delete)/,
            extractionRules: [],
            context: []
          }],
          middleware: [],
          conventions: [],
          authentication: []
        }],
        analysisOptions: {
          includeExamples: true,
          includeErrorCodes: true,
          includeAuthentication: true,
          includeRateLimiting: true,
          generateTestCases: true,
          validateSchemas: true,
          extractFromComments: true,
          inferFromUsage: true,
          supportedFrameworks: ['express'],
          customPatterns: []
        },
        outputOptions: {
          formats: ['swagger'],
          destination: './docs',
          templateEngine: 'handlebars',
          customTemplates: [],
          styling: {
            theme: 'default',
            customCss: '',
            logo: ''
          },
          deployment: {
            platform: 'static',
            url: '',
            authentication: {
              type: 'none'
            }
          }
        }
      };

      const result = await generator.generateDocumentation(context);

      expect(result.documentation.formats).toHaveLength(1);
      expect(result.documentation.formats.map((f: any) => f.type)).toEqual(['swagger']);
      expect(result.apiSpec).toBeDefined();
      expect(result.endpoints).toHaveLength(1);
    });
  });

  describe('Integration & Output Validation', () => {
    test('TC-309-037: Framework Integration Testing', async () => {
      const files: FileContent[] = [{
        name: 'app.js',
        path: 'src/app.js',
        content: `
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use('/api', require('./routes'));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
        `,
        encoding: 'utf-8',
        size: 300,
        sha: 'integration123',
        url: 'http://example.com/app.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result.totalEndpoints).toBeGreaterThan(0);
      expect(result.frameworksDetected).toContain('express');
      expect(result.middleware.length).toBeGreaterThan(0);
      expect(result.statistics).toBeDefined();
    });

    test('TC-309-039: OpenAPI Specification Validation', async () => {
      const endpoints = [{
        id: 'test-endpoint',
        method: 'GET' as HttpMethod,
        path: '/test',
        summary: 'Test endpoint',
        description: 'Test endpoint description',
        handler: {
          name: 'test',
          parameters: [],
          returnType: 'any',
          isAsync: false,
          isArrow: false,
          location: { file: 'test.js', startLine: 1, startColumn: 1 }
        },
        middleware: [],
        parameters: [],
        responses: [],
        authentication: undefined,
        tags: [],
        location: { file: 'test.js', startLine: 1, startColumn: 1 },
        examples: [],
        deprecated: false
      }];

      const spec = await generator.generateOpenApiSpec(endpoints, []);

      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('info');
      expect(spec).toHaveProperty('paths');
      expect(spec.openapi).toMatch(/^3\\.0\\./);
    });

    test('TC-309-042: Error Handling and Recovery', async () => {
      const files: FileContent[] = [{
        name: 'malformed.js',
        path: 'src/malformed.js',
        content: `
// Malformed JavaScript
app.get('/test', (req, res => {
  res.json({ incomplete
});

// Valid route that should still be detected
app.post('/valid', (req, res) => {
  res.json({ status: 'ok' });
});
        `,
        encoding: 'utf-8',
        size: 200,
        sha: 'malformed123',
        url: 'http://example.com/malformed.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      // Should gracefully handle errors and continue processing
      expect(result).toBeDefined();
      expect(result.endpoints.length).toBeGreaterThanOrEqual(1);
      // Should find the valid route despite the malformed code
      expect(result.endpoints.some(ep => ep.path === '/valid')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('빈 파일 배열 처리', async () => {
      const result = await generator.discoverApiEndpoints([]);

      expect(result.totalEndpoints).toBe(0);
      expect(result.endpoints).toHaveLength(0);
      expect(result.frameworksDetected).toHaveLength(0);
    });

    test('손상된 파일 처리', async () => {
      const files: FileContent[] = [{
        name: 'corrupted.js',
        path: 'src/corrupted.js',
        content: 'invalid javascript syntax {{{',
        encoding: 'utf-8',
        size: 30,
        sha: 'corrupted123',
        url: 'http://example.com/corrupted.js'
      }];

      const result = await generator.discoverApiEndpoints(files);

      expect(result).toBeDefined();
      expect(result.endpoints).toBeDefined();
    });
  });
});