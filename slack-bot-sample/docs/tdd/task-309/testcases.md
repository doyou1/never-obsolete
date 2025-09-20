# TASK-309: API Documentation Generator Test Cases

## Test Categories

### 1. API Discovery & Route Detection (TC-309-001 to TC-309-012)

**TC-309-001: Express.js Route Detection**
- **Input**: Express app with GET/POST routes
- **Expected**: Correctly identifies all routes with methods and paths
- **Test Data**: `app.get('/users', handler)`, `app.post('/users/:id', handler)`

**TC-309-002: Express Router Detection**
- **Input**: Express router with nested routes
- **Expected**: Detects router-based routes and path combinations
- **Test Data**: `router.get('/profile', handler)` with `app.use('/api', router)`

**TC-309-003: Fastify Route Detection**
- **Input**: Fastify application with route registration
- **Expected**: Identifies Fastify-specific route patterns
- **Test Data**: `fastify.get('/health', handler)`, `fastify.register(plugin)`

**TC-309-004: NestJS Controller Detection**
- **Input**: NestJS controller with decorators
- **Expected**: Extracts controller paths and method decorators
- **Test Data**: `@Controller('users')`, `@Get(':id')`, `@Post()`

**TC-309-005: Path Parameter Extraction**
- **Input**: Routes with dynamic parameters
- **Expected**: Correctly identifies and types path parameters
- **Test Data**: `/users/:id`, `/posts/:postId/comments/:commentId`

**TC-309-006: Query Parameter Analysis**
- **Input**: Route handlers with query parameter usage
- **Expected**: Infers query parameters from handler code
- **Test Data**: `req.query.limit`, `req.query.sort`, `req.query.filter`

**TC-309-007: Multiple Framework Detection**
- **Input**: Mixed codebase with Express and Fastify
- **Expected**: Correctly identifies routes from multiple frameworks
- **Test Data**: Both Express and Fastify route definitions

**TC-309-008: Middleware Route Detection**
- **Input**: Middleware-mounted routes
- **Expected**: Detects routes through middleware mounting
- **Test Data**: `app.use('/api/v1', middleware, routes)`

**TC-309-009: HTTP Method Completeness**
- **Input**: All HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- **Expected**: Correctly identifies all standard HTTP methods
- **Test Data**: Full set of HTTP method definitions

**TC-309-010: Route Versioning Detection**
- **Input**: API versioning patterns
- **Expected**: Identifies versioned routes and groups them
- **Test Data**: `/v1/users`, `/v2/users`, `/api/v1/posts`

**TC-309-011: Nested Route Structure**
- **Input**: Complex nested routing structure
- **Expected**: Builds complete route hierarchy
- **Test Data**: Multi-level route nesting with sub-routers

**TC-309-012: Route Conflict Detection**
- **Input**: Conflicting route definitions
- **Expected**: Identifies and reports route conflicts
- **Test Data**: Duplicate route paths with different methods

### 2. Schema Analysis & Type Extraction (TC-309-013 to TC-309-024)

**TC-309-013: TypeScript Interface Extraction**
- **Input**: TypeScript interfaces for request/response
- **Expected**: Converts interfaces to JSON Schema
- **Test Data**: `interface User { id: number; name: string; }`

**TC-309-014: Joi Schema Integration**
- **Input**: Joi validation schemas
- **Expected**: Extracts schema definitions from Joi objects
- **Test Data**: `Joi.object({ name: Joi.string().required() })`

**TC-309-015: Zod Schema Integration**
- **Input**: Zod validation schemas
- **Expected**: Converts Zod schemas to JSON Schema
- **Test Data**: `z.object({ email: z.string().email() })`

**TC-309-016: Mongoose Model Extraction**
- **Input**: Mongoose schema definitions
- **Expected**: Generates API schemas from Mongoose models
- **Test Data**: `new Schema({ name: String, age: Number })`

**TC-309-017: Prisma Model Integration**
- **Input**: Prisma schema file
- **Expected**: Extracts types from Prisma models
- **Test Data**: Prisma schema with models and relations

**TC-309-018: Request Body Schema Inference**
- **Input**: API handlers with request body usage
- **Expected**: Infers request schema from handler code
- **Test Data**: `req.body.name`, `req.body.email` usage patterns

**TC-309-019: Response Schema Inference**
- **Input**: API handlers with response patterns
- **Expected**: Infers response schema from return statements
- **Test Data**: `res.json({ user, token })` patterns

**TC-309-020: Nested Schema Support**
- **Input**: Complex nested object schemas
- **Expected**: Correctly handles nested schema structures
- **Test Data**: Schemas with nested objects and arrays

**TC-309-021: Union Type Support**
- **Input**: Union types in TypeScript interfaces
- **Expected**: Converts union types to proper JSON Schema
- **Test Data**: `type Status = 'active' | 'inactive'`

**TC-309-022: Generic Type Resolution**
- **Input**: Generic TypeScript types
- **Expected**: Resolves generic types to concrete schemas
- **Test Data**: `ApiResponse<T>`, `PaginatedResult<User>`

**TC-309-023: Schema Validation**
- **Input**: Generated schemas
- **Expected**: Validates schema correctness and completeness
- **Test Data**: Various schema formats for validation

**TC-309-024: Schema Conflict Resolution**
- **Input**: Conflicting schema definitions
- **Expected**: Resolves conflicts and merges schemas appropriately
- **Test Data**: Multiple schema sources with conflicts

### 3. Documentation Generation (TC-309-025 to TC-309-030)

**TC-309-025: OpenAPI 3.0 Specification Generation**
- **Input**: Discovered APIs and schemas
- **Expected**: Generates valid OpenAPI 3.0 specification
- **Test Data**: Complete API definition with multiple endpoints

**TC-309-026: Swagger UI Integration**
- **Input**: Generated OpenAPI specification
- **Expected**: Creates interactive Swagger UI documentation
- **Test Data**: OpenAPI spec with examples and descriptions

**TC-309-027: Markdown Documentation Generation**
- **Input**: API endpoints and schemas
- **Expected**: Generates comprehensive markdown documentation
- **Test Data**: API structure for markdown conversion

**TC-309-028: Postman Collection Export**
- **Input**: API endpoints with examples
- **Expected**: Creates valid Postman collection file
- **Test Data**: API definitions with request/response examples

**TC-309-029: Documentation Customization**
- **Input**: Custom documentation options
- **Expected**: Generates documentation with custom formatting
- **Test Data**: Various customization options and templates

**TC-309-030: Multi-format Output**
- **Input**: Single API definition
- **Expected**: Generates multiple documentation formats simultaneously
- **Test Data**: API definition for multi-format generation

### 4. Code Analysis & Comment Extraction (TC-309-031 to TC-309-036)

**TC-309-031: JSDoc Comment Extraction**
- **Input**: Functions with JSDoc comments
- **Expected**: Extracts descriptions, parameters, and return types
- **Test Data**: Complete JSDoc-documented API functions

**TC-309-032: Inline Comment Analysis**
- **Input**: Code with inline comments
- **Expected**: Associates comments with relevant code elements
- **Test Data**: API handlers with descriptive inline comments

**TC-309-033: Function Signature Analysis**
- **Input**: API handler function signatures
- **Expected**: Extracts parameter types and return types
- **Test Data**: Various function signature patterns

**TC-309-034: Error Code Extraction**
- **Input**: Error handling code
- **Expected**: Identifies error codes and messages
- **Test Data**: Error handling patterns with status codes

**TC-309-035: Authentication Analysis**
- **Input**: Authentication middleware and patterns
- **Expected**: Documents authentication requirements
- **Test Data**: JWT, OAuth, API key authentication patterns

**TC-309-036: Rate Limiting Documentation**
- **Input**: Rate limiting middleware
- **Expected**: Documents rate limiting policies
- **Test Data**: Various rate limiting configurations

### 5. Integration & Output Validation (TC-309-037 to TC-309-042)

**TC-309-037: Framework Integration Testing**
- **Input**: Real-world application structure
- **Expected**: Successfully processes complete applications
- **Test Data**: Sample Express/Fastify applications

**TC-309-038: Large Codebase Processing**
- **Input**: Large codebase with many endpoints
- **Expected**: Efficiently processes and generates documentation
- **Test Data**: Codebase with 100+ API endpoints

**TC-309-039: OpenAPI Specification Validation**
- **Input**: Generated OpenAPI specification
- **Expected**: Validates against OpenAPI 3.0 schema
- **Test Data**: Generated specs for validation testing

**TC-309-040: Documentation Accuracy Verification**
- **Input**: Generated documentation
- **Expected**: Verifies accuracy against source code
- **Test Data**: Documentation for accuracy checking

**TC-309-041: Performance Benchmarking**
- **Input**: Various codebase sizes
- **Expected**: Meets performance benchmarks for analysis speed
- **Test Data**: Codebases of different sizes for benchmarking

**TC-309-042: Error Handling and Recovery**
- **Input**: Malformed or problematic code
- **Expected**: Gracefully handles errors and continues processing
- **Test Data**: Code with syntax errors and edge cases

## Test Implementation Strategy

### Test Data Requirements
- Sample Express.js applications
- Fastify application examples
- NestJS controller samples
- TypeScript interface definitions
- Validation schema examples (Joi, Zod)
- Database model samples (Mongoose, Prisma)
- JSDoc-documented functions
- Authentication middleware examples
- Real-world API codebases

### Test Environment Setup
- Node.js test framework (Jest)
- TypeScript compilation
- Mock file system for testing
- OpenAPI validation tools
- Documentation comparison utilities

### Validation Criteria
- API endpoint detection accuracy: 100%
- Schema extraction completeness: 95%+
- OpenAPI specification validity: 100%
- Documentation generation success: 100%
- Performance benchmarks: <5s for medium codebases

### Edge Cases to Test
- Empty codebases
- Codebases without API definitions
- Malformed route definitions
- Complex TypeScript types
- Missing documentation
- Circular schema references
- Invalid OpenAPI specifications
- Large file processing