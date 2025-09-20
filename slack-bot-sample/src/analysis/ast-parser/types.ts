import * as ts from 'typescript';

export interface CodePosition {
  line: number;
  column: number;
  end: {
    line: number;
    column: number;
  };
}

export interface ParameterInfo {
  name: string;
  type: string;
  isOptional: boolean;
  defaultValue?: string | undefined;
}

export interface PropertyInfo {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isReadonly: boolean;
}

export interface ImportInfo {
  moduleName: string;
  importType: 'default' | 'named' | 'namespace' | 'side-effect';
  importedNames: string[];
  isExternal: boolean;
  isDynamic: boolean;
  position: CodePosition;
}

export interface ExportInfo {
  exportType: 'default' | 'named' | 'all';
  exportedNames: string[];
  isReExport: boolean;
  sourceModule?: string | undefined;
  position: CodePosition;
}

export interface FunctionInfo {
  name: string;
  type: 'function' | 'arrow' | 'method';
  isAsync: boolean;
  isExported: boolean;
  isGeneric: boolean;
  parameters: ParameterInfo[];
  returnType: string;
  position: CodePosition;
  jsDoc?: string | undefined;
}

export interface ClassInfo {
  name: string;
  isExported: boolean;
  superClass?: string | undefined;
  interfaces: string[];
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  position: CodePosition;
  jsDoc?: string | undefined;
}

export interface APICallInfo {
  type: 'http' | 'database' | 'external';
  method?: string | undefined;
  url?: string | undefined;
  library: string;
  position: CodePosition;
  errorHandling: boolean;
}

export interface ParsedSourceCode {
  filename: string;
  ast: ts.SourceFile;
  metadata: {
    fileType: 'typescript' | 'javascript' | 'tsx' | 'jsx';
    hasReactComponent: boolean;
    hasAsyncCode: boolean;
    hasParsingErrors: boolean;
    lineCount: number;
    characterCount: number;
  };
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  apiCalls: APICallInfo[];
  dependencies: string[];
  errors: string[];
}

export interface ParsedProject {
  files: ParsedSourceCode[];
  dependencyGraph: Record<string, string[]>;
  circularDependencies: string[][];
  statistics: {
    totalFiles: number;
    totalFunctions: number;
    totalClasses: number;
    totalImports: number;
    totalExports: number;
  };
}

export interface SourceFile {
  filename: string;
  content: string;
}

export interface ASTParserConfig {
  compilerOptions: ts.CompilerOptions;
  maxFileSize: number;
  enablePerformanceLogging: boolean;
}

export interface IASTParser {
  parseSourceCode(code: string, filename: string): ParsedSourceCode;
  parseMultipleFiles(files: SourceFile[]): ParsedProject;
  extractImports(ast: ts.SourceFile): ImportInfo[];
  extractExports(ast: ts.SourceFile): ExportInfo[];
  extractFunctions(ast: ts.SourceFile): FunctionInfo[];
  extractClasses(ast: ts.SourceFile): ClassInfo[];
  extractAPICallPatterns(ast: ts.SourceFile): APICallInfo[];
  getCompilerOptions(): ts.CompilerOptions;
}