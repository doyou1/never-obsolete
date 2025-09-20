import * as ts from 'typescript';
import type {
  IASTParser,
  ParsedSourceCode,
  ParsedProject,
  SourceFile,
  ImportInfo,
  ExportInfo,
  FunctionInfo,
  ClassInfo,
  APICallInfo,
  ASTParserConfig,
  CodePosition,
  ParameterInfo,
  PropertyInfo,
} from './types';

export class ASTParser implements IASTParser {
  private config: ASTParserConfig;

  constructor(config?: Partial<ASTParserConfig>) {
    this.config = {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        allowJs: true,
        esModuleInterop: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
        ...config?.compilerOptions,
      },
      maxFileSize: 50 * 1024 * 1024, // 50MB
      enablePerformanceLogging: false,
      ...config,
    };
  }

  public getCompilerOptions(): ts.CompilerOptions {
    return { ...this.config.compilerOptions };
  }

  public parseSourceCode(code: string, filename: string): ParsedSourceCode {
    const sourceFile = this.createSourceFile(code, filename);
    const diagnostics = this.extractDiagnostics(sourceFile);
    const metadata = this.createMetadata(filename, sourceFile, diagnostics);

    // Use single pass parsing for better performance
    const astElements = this.extractAllASTElements(sourceFile);

    const dependencies = astElements.imports.map(imp => imp.moduleName);
    const errors = this.formatDiagnosticMessages(diagnostics);

    return {
      filename,
      ast: sourceFile,
      metadata,
      imports: astElements.imports,
      exports: astElements.exports,
      functions: astElements.functions,
      classes: astElements.classes,
      apiCalls: astElements.apiCalls,
      dependencies,
      errors,
    };
  }

  public parseMultipleFiles(files: SourceFile[]): ParsedProject {
    const parsedFiles: ParsedSourceCode[] = [];
    const dependencyGraph: Record<string, string[]> = {};

    // Parse each file
    for (const file of files) {
      const parsed = this.parseSourceCode(file.content, file.filename);
      parsedFiles.push(parsed);

      // Build dependency graph from both imports and re-exports
      const importDependencies = parsed.imports
        .filter(imp => !imp.isExternal && !imp.isDynamic)
        .map(imp => this.resolveDependencyPath(imp.moduleName, file.filename));

      const reExportDependencies = parsed.exports
        .filter(exp => exp.isReExport && exp.sourceModule)
        .map(exp => this.resolveDependencyPath(exp.sourceModule!, file.filename));

      const allDependencies = [...importDependencies, ...reExportDependencies];
      dependencyGraph[file.filename] = allDependencies;
    }

    // Detect circular dependencies
    const circularDependencies = this.detectCircularDependencies(dependencyGraph);

    // Calculate statistics
    const statistics = {
      totalFiles: parsedFiles.length,
      totalFunctions: parsedFiles.reduce((sum, file) => sum + file.functions.length, 0),
      totalClasses: parsedFiles.reduce((sum, file) => sum + file.classes.length, 0),
      totalImports: parsedFiles.reduce((sum, file) => sum + file.imports.length, 0),
      totalExports: parsedFiles.reduce((sum, file) => sum + file.exports.length, 0),
    };

    return {
      files: parsedFiles,
      dependencyGraph,
      circularDependencies,
      statistics,
    };
  }

  public extractImports(ast: ts.SourceFile): ImportInfo[] {
    return this.extractAllASTElements(ast).imports;
  }

  public extractExports(ast: ts.SourceFile): ExportInfo[] {
    return this.extractAllASTElements(ast).exports;
  }

  public extractFunctions(ast: ts.SourceFile): FunctionInfo[] {
    return this.extractAllASTElements(ast).functions;
  }

  public extractClasses(ast: ts.SourceFile): ClassInfo[] {
    return this.extractAllASTElements(ast).classes;
  }

  public extractAPICallPatterns(ast: ts.SourceFile): APICallInfo[] {
    return this.extractAllASTElements(ast).apiCalls;
  }

  private getScriptKind(filename: string): ts.ScriptKind {
    if (filename.endsWith('.tsx')) return ts.ScriptKind.TSX;
    if (filename.endsWith('.jsx')) return ts.ScriptKind.JSX;
    if (filename.endsWith('.ts')) return ts.ScriptKind.TS;
    if (filename.endsWith('.js')) return ts.ScriptKind.JS;
    return ts.ScriptKind.Unknown;
  }

  private getFileType(filename: string): 'typescript' | 'javascript' | 'tsx' | 'jsx' {
    if (filename.endsWith('.tsx')) return 'tsx';
    if (filename.endsWith('.jsx')) return 'jsx';
    if (filename.endsWith('.ts')) return 'typescript';
    return 'javascript';
  }

  private hasReactComponent(sourceFile: ts.SourceFile): boolean {
    let hasReact = false;
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
        hasReact = true;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return hasReact;
  }

  private hasAsyncCode(sourceFile: ts.SourceFile): boolean {
    let hasAsync = false;
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
        if (node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword)) {
          hasAsync = true;
          return;
        }
      }
      if (ts.isAwaitExpression(node)) {
        hasAsync = true;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return hasAsync;
  }

  private getCodePosition(node: ts.Node, sourceFile: ts.SourceFile): CodePosition {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    return {
      line: start.line + 1,
      column: start.character + 1,
      end: {
        line: end.line + 1,
        column: end.character + 1,
      },
    };
  }

  private hasErrorHandling(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isTryStatement(parent) ||
          (ts.isCallExpression(parent) &&
           ts.isPropertyAccessExpression(parent.expression) &&
           ts.isIdentifier(parent.expression.name) &&
           parent.expression.name.text === 'catch')) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private extractHttpMethod(node: ts.CallExpression): string {
    if (node.arguments.length >= 2) {
      const secondArg = node.arguments[1];
      if (secondArg && ts.isObjectLiteralExpression(secondArg)) {
        for (const prop of secondArg.properties) {
          if (ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              prop.name.text === 'method' &&
              ts.isStringLiteral(prop.initializer)) {
            return prop.initializer.text;
          }
        }
      }
    }
    return 'GET';
  }

  private extractUrlFromCall(node: ts.CallExpression): string | undefined {
    if (node.arguments.length > 0) {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        return firstArg.text;
      }
    }
    return undefined;
  }

  private extractParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>): ParameterInfo[] {
    return parameters.map(param => {
      const name = ts.isIdentifier(param.name) ? param.name.text : 'unknown';
      const type = param.type ? this.typeToString(param.type) : 'any';
      const isOptional = !!param.questionToken || !!param.initializer;

      const paramInfo: ParameterInfo = { name, type, isOptional };

      if (param.initializer) {
        paramInfo.defaultValue = param.initializer.getText();
      }

      return paramInfo;
    });
  }

  private extractReturnType(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): string {
    return node.type ? this.typeToString(node.type) : 'void';
  }

  private extractJSDoc(node: ts.Node): string | undefined {
    const jsDoc = ts.getJSDocCommentsAndTags(node);
    if (jsDoc.length > 0) {
      return jsDoc.map(doc => doc.getText()).join('\n');
    }
    return undefined;
  }

  private extractSuperClass(node: ts.ClassDeclaration): string | undefined {
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword && clause.types.length > 0) {
          const firstType = clause.types[0];
          if (firstType && firstType.expression) {
            return firstType.expression.getText();
          }
        }
      }
    }
    return undefined;
  }

  private extractImplementedInterfaces(node: ts.ClassDeclaration): string[] {
    const interfaces: string[] = [];
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          interfaces.push(...clause.types.map(type => type.expression.getText()));
        }
      }
    }
    return interfaces;
  }

  private extractClassMethods(node: ts.ClassDeclaration, ast: ts.SourceFile): FunctionInfo[] {
    const methods: FunctionInfo[] = [];

    node.members.forEach(member => {
      if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
        const position = this.getCodePosition(member, ast);
        const isAsync = !!member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword);
        const isGeneric = !!member.typeParameters && member.typeParameters.length > 0;

        const methodInfo: FunctionInfo = {
          name: member.name.text,
          type: 'method',
          isAsync,
          isExported: false,
          isGeneric,
          parameters: this.extractParameters(member.parameters),
          returnType: this.extractReturnType(member),
          position,
        };

        const jsDoc = this.extractJSDoc(member);
        if (jsDoc !== undefined) {
          methodInfo.jsDoc = jsDoc;
        }

        methods.push(methodInfo);
      }
    });

    return methods;
  }

  private extractClassProperties(node: ts.ClassDeclaration, _ast: ts.SourceFile): PropertyInfo[] {
    const properties: PropertyInfo[] = [];

    node.members.forEach(member => {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        const visibility = this.getPropertyVisibility(member);
        const isStatic = !!member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword);
        const isReadonly = !!member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword);
        const type = member.type ? this.typeToString(member.type) : 'any';

        properties.push({
          name: member.name.text,
          type,
          visibility,
          isStatic,
          isReadonly,
        });
      }
    });

    return properties;
  }

  private getPropertyVisibility(node: ts.PropertyDeclaration): 'public' | 'private' | 'protected' {
    if (node.modifiers) {
      for (const modifier of node.modifiers) {
        if (modifier.kind === ts.SyntaxKind.PrivateKeyword) return 'private';
        if (modifier.kind === ts.SyntaxKind.ProtectedKeyword) return 'protected';
      }
    }
    return 'public';
  }

  private typeToString(type: ts.TypeNode): string {
    return type.getText();
  }

  private resolveDependencyPath(importPath: string, _currentFile: string): string {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Simple resolution for relative paths
      let resolved = importPath;
      if (importPath.startsWith('./')) {
        resolved = importPath.substring(2);
      }
      // Add .ts extension if not present
      if (!resolved.endsWith('.ts') && !resolved.endsWith('.tsx') &&
          !resolved.endsWith('.js') && !resolved.endsWith('.jsx')) {
        resolved += '.ts';
      }
      return resolved;
    }
    return importPath;
  }

  private isAxiosInstance(variableName: string, ast: ts.SourceFile): boolean {
    // Simple check to see if a variable is created with axios.create()
    let isInstance = false;

    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === variableName &&
          node.initializer &&
          ts.isCallExpression(node.initializer) &&
          ts.isPropertyAccessExpression(node.initializer.expression) &&
          ts.isIdentifier(node.initializer.expression.expression) &&
          node.initializer.expression.expression.text === 'axios' &&
          ts.isIdentifier(node.initializer.expression.name) &&
          node.initializer.expression.name.text === 'create') {
        isInstance = true;
        return;
      }
      ts.forEachChild(node, visit);
    };

    visit(ast);
    return isInstance;
  }

  private createSourceFile(code: string, filename: string): ts.SourceFile {
    return ts.createSourceFile(
      filename,
      code,
      this.config.compilerOptions.target || ts.ScriptTarget.ES2020,
      true,
      this.getScriptKind(filename)
    );
  }

  private extractDiagnostics(sourceFile: ts.SourceFile): ts.Diagnostic[] {
    return (sourceFile as any).parseDiagnostics || [];
  }

  private createMetadata(filename: string, sourceFile: ts.SourceFile, diagnostics: ts.Diagnostic[]): ParsedSourceCode['metadata'] {
    return {
      fileType: this.getFileType(filename),
      hasReactComponent: this.hasReactComponent(sourceFile),
      hasAsyncCode: this.hasAsyncCode(sourceFile),
      hasParsingErrors: diagnostics.length > 0,
      lineCount: sourceFile.getLineAndCharacterOfPosition(sourceFile.getEnd()).line + 1,
      characterCount: sourceFile.getEnd(),
    };
  }

  private formatDiagnosticMessages(diagnostics: ts.Diagnostic[]): string[] {
    return diagnostics.map((d: ts.Diagnostic) => {
      if (typeof d.messageText === 'string') {
        return d.messageText;
      } else {
        return d.messageText.messageText;
      }
    });
  }

  private extractAllASTElements(sourceFile: ts.SourceFile): {
    imports: ImportInfo[];
    exports: ExportInfo[];
    functions: FunctionInfo[];
    classes: ClassInfo[];
    apiCalls: APICallInfo[];
  } {
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];
    const apiCalls: APICallInfo[] = [];

    const visit = (node: ts.Node) => {
      // Extract imports
      this.processImportNode(node, sourceFile, imports);

      // Extract exports
      this.processExportNode(node, sourceFile, exports);

      // Extract functions
      this.processFunctionNode(node, sourceFile, functions);

      // Extract classes
      this.processClassNode(node, sourceFile, classes);

      // Extract API calls
      this.processAPICallNode(node, sourceFile, apiCalls);

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return { imports, exports, functions, classes, apiCalls };
  }

  private processImportNode(node: ts.Node, ast: ts.SourceFile, imports: ImportInfo[]): void {
    // Static imports
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleName = node.moduleSpecifier.text;
      const position = this.getCodePosition(node, ast);
      const isExternal = !moduleName.startsWith('.') && !moduleName.startsWith('/');

      if (!node.importClause) {
        // Side-effect import
        imports.push({
          moduleName,
          importType: 'side-effect',
          importedNames: [],
          isExternal,
          isDynamic: false,
          position,
        });
      } else if (node.importClause.name) {
        // Default import
        imports.push({
          moduleName,
          importType: 'default',
          importedNames: [node.importClause.name.text],
          isExternal,
          isDynamic: false,
          position,
        });
      }

      if (node.importClause?.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // Namespace import
          imports.push({
            moduleName,
            importType: 'namespace',
            importedNames: [node.importClause.namedBindings.name.text],
            isExternal,
            isDynamic: false,
            position,
          });
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          // Named imports
          const importedNames = node.importClause.namedBindings.elements.map(element =>
            element.propertyName ? element.propertyName.text : element.name.text
          );
          imports.push({
            moduleName,
            importType: 'named',
            importedNames,
            isExternal,
            isDynamic: false,
            position,
          });
        }
      }
    }

    // Dynamic imports
    if (ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length > 0) {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        const moduleName = firstArg.text;
        const position = this.getCodePosition(node, ast);
        const isExternal = !moduleName.startsWith('.') && !moduleName.startsWith('/');

        imports.push({
          moduleName,
          importType: 'default',
          importedNames: [],
          isExternal,
          isDynamic: true,
          position,
        });
      }
    }
  }

  private processExportNode(node: ts.Node, ast: ts.SourceFile, exports: ExportInfo[]): void {
    // Export declarations
    if (ts.isExportDeclaration(node)) {
      const position = this.getCodePosition(node, ast);

      if (!node.exportClause) {
        // export * from '...'
        const sourceModule = node.moduleSpecifier ? (node.moduleSpecifier as ts.StringLiteral).text : undefined;
        if (sourceModule !== undefined) {
          exports.push({
            exportType: 'all',
            exportedNames: [],
            isReExport: true,
            sourceModule,
            position,
          });
        }
      } else if (ts.isNamedExports(node.exportClause)) {
        // export { ... } from '...'
        const exportedNames = node.exportClause.elements.map(element =>
          element.propertyName ? element.propertyName.text : element.name.text
        );
        const sourceModule = node.moduleSpecifier ? (node.moduleSpecifier as ts.StringLiteral).text : undefined;

        if (node.moduleSpecifier && sourceModule !== undefined) {
          exports.push({
            exportType: 'named',
            exportedNames,
            isReExport: true,
            sourceModule,
            position,
          });
        } else {
          exports.push({
            exportType: 'named',
            exportedNames,
            isReExport: false,
            position,
          });
        }
      } else if (ts.isNamespaceExport(node.exportClause)) {
        // export * as name from '...'
        const sourceModule = node.moduleSpecifier ? (node.moduleSpecifier as ts.StringLiteral).text : undefined;
        if (sourceModule !== undefined) {
          exports.push({
            exportType: 'named',
            exportedNames: [node.exportClause.name.text],
            isReExport: true,
            sourceModule,
            position,
          });
        }
      }
    }

    // Export assignments and default exports
    if (ts.isExportAssignment(node)) {
      const position = this.getCodePosition(node, ast);
      let exportName = 'default';

      // Try to get the actual name if it's an identifier
      if (ts.isIdentifier(node.expression)) {
        exportName = node.expression.text;
      }

      exports.push({
        exportType: 'default',
        exportedNames: [exportName],
        isReExport: false,
        position,
      });
    }

    // Function/Class/Variable declarations with export modifier
    if ((ts.isFunctionDeclaration(node) ||
         ts.isClassDeclaration(node) ||
         ts.isVariableStatement(node)) &&
        node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
      const position = this.getCodePosition(node, ast);
      const isDefault = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);

      if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
        const name = node.name?.text || 'default';
        exports.push({
          exportType: isDefault ? 'default' : 'named',
          exportedNames: [name],
          isReExport: false,
          position,
        });
      } else if (ts.isVariableStatement(node)) {
        const names: string[] = [];
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name)) {
            names.push(decl.name.text);
          }
        });
        exports.push({
          exportType: 'named',
          exportedNames: names,
          isReExport: false,
          position,
        });
      }
    }
  }

  private processFunctionNode(node: ts.Node, ast: ts.SourceFile, functions: FunctionInfo[]): void {
    // Function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const position = this.getCodePosition(node, ast);
      const isAsync = !!node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword);
      const isExported = !!node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
      const isGeneric = !!node.typeParameters && node.typeParameters.length > 0;

      const functionInfo: FunctionInfo = {
        name: node.name.text,
        type: 'function',
        isAsync,
        isExported,
        isGeneric,
        parameters: this.extractParameters(node.parameters),
        returnType: this.extractReturnType(node),
        position,
      };

      const jsDoc = this.extractJSDoc(node);
      if (jsDoc !== undefined) {
        functionInfo.jsDoc = jsDoc;
      }

      functions.push(functionInfo);
    }

    // Arrow functions
    if (ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isArrowFunction(node.initializer) &&
        ts.isIdentifier(node.name)) {
      const arrowFunc = node.initializer;
      const position = this.getCodePosition(node, ast);
      const isAsync = !!arrowFunc.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword);
      const isGeneric = !!arrowFunc.typeParameters && arrowFunc.typeParameters.length > 0;

      functions.push({
        name: node.name.text,
        type: 'arrow',
        isAsync,
        isExported: false,
        isGeneric,
        parameters: this.extractParameters(arrowFunc.parameters),
        returnType: this.extractReturnType(arrowFunc),
        position,
      });
    }

    // Method declarations (for classes)
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      const position = this.getCodePosition(node, ast);
      const isAsync = !!node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword);
      const isGeneric = !!node.typeParameters && node.typeParameters.length > 0;

      const methodInfo: FunctionInfo = {
        name: node.name.text,
        type: 'method',
        isAsync,
        isExported: false,
        isGeneric,
        parameters: this.extractParameters(node.parameters),
        returnType: this.extractReturnType(node),
        position,
      };

      const jsDoc = this.extractJSDoc(node);
      if (jsDoc !== undefined) {
        methodInfo.jsDoc = jsDoc;
      }

      functions.push(methodInfo);
    }
  }

  private processClassNode(node: ts.Node, ast: ts.SourceFile, classes: ClassInfo[]): void {
    if (ts.isClassDeclaration(node) && node.name) {
      const position = this.getCodePosition(node, ast);
      const isExported = !!node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
      const superClass = this.extractSuperClass(node);
      const interfaces = this.extractImplementedInterfaces(node);
      const methods = this.extractClassMethods(node, ast);
      const properties = this.extractClassProperties(node, ast);

      const classInfo: ClassInfo = {
        name: node.name.text,
        isExported,
        interfaces,
        methods,
        properties,
        position,
      };

      if (superClass !== undefined) {
        classInfo.superClass = superClass;
      }

      const jsDoc = this.extractJSDoc(node);
      if (jsDoc !== undefined) {
        classInfo.jsDoc = jsDoc;
      }

      classes.push(classInfo);
    }
  }

  private processAPICallNode(node: ts.Node, ast: ts.SourceFile, apiCalls: APICallInfo[]): void {
    if (ts.isCallExpression(node)) {
      // Detect fetch calls
      if (ts.isIdentifier(node.expression) && node.expression.text === 'fetch') {
        const position = this.getCodePosition(node, ast);
        const hasErrorHandling = this.hasErrorHandling(node);
        apiCalls.push({
          type: 'http',
          method: this.extractHttpMethod(node),
          library: 'fetch',
          position,
          errorHandling: hasErrorHandling,
        });
      }
      // Detect axios calls
      else if (ts.isPropertyAccessExpression(node.expression)) {
        const obj = node.expression.expression;
        const method = node.expression.name;

        // Direct axios calls (axios.get, axios.post, etc.) or axios instance calls (apiClient.post, etc.)
        if (ts.isIdentifier(obj) && ts.isIdentifier(method) &&
            (obj.text === 'axios' || this.isAxiosInstance(obj.text, ast))) {
          const position = this.getCodePosition(node, ast);
          const apiCall: APICallInfo = {
            type: 'http',
            library: 'axios',
            position,
            errorHandling: this.hasErrorHandling(node),
          };

          apiCall.method = method.text.toUpperCase();

          const url = this.extractUrlFromCall(node);
          if (url !== undefined) {
            apiCall.url = url;
          }

          apiCalls.push(apiCall);
        }
        // Detect Prisma calls
        else if (ts.isPropertyAccessExpression(obj) &&
                 ts.isIdentifier(obj.expression) && obj.expression.text === 'prisma') {
          const position = this.getCodePosition(node, ast);
          apiCalls.push({
            type: 'database',
            library: 'prisma',
            position,
            errorHandling: this.hasErrorHandling(node),
          });
        }
      }
    }
  }

  private detectCircularDependencies(dependencyGraph: Record<string, string[]>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularDeps: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          circularDeps.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);
      const newPath = [...path, node];

      const dependencies = dependencyGraph[node] || [];
      for (const dep of dependencies) {
        if (dependencyGraph[dep]) {
          dfs(dep, newPath);
        }
      }

      recursionStack.delete(node);
    };

    for (const file of Object.keys(dependencyGraph)) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    return circularDeps;
  }
}