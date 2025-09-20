import { QualityAnalyzer } from '../QualityAnalyzer';
import { FileContent } from '../../github/types';

describe('QualityAnalyzer', () => {
  let analyzer: QualityAnalyzer;

  beforeEach(() => {
    analyzer = new QualityAnalyzer();
  });

  describe('복잡도 계산', () => {
    test('순환 복잡도 계산 - 간단한 함수', async () => {
      const files: FileContent[] = [{
        name: 'simple.js',
        path: 'src/simple.js',
        content: `
function simpleFunction(x) {
  if (x > 0) {
    return x * 2;
  }
  return 0;
}`,
        encoding: 'utf-8',
        size: 100,
        sha: 'abc123',
        url: 'http://example.com/simple.js'
      }];

      const result = await analyzer.calculateComplexity(files);

      expect(result.averageComplexity).toBeGreaterThan(0);
      expect(result.maxComplexity).toBeGreaterThan(0);
      expect(result.complexFunctions).toBeDefined();
      expect(result.distribution).toBeDefined();
      expect(result.distribution.low).toBeGreaterThanOrEqual(0);
    });

    test('순환 복잡도 계산 - 복잡한 함수', async () => {
      const files: FileContent[] = [{
        name: 'complex.js',
        path: 'src/complex.js',
        content: `
function complexFunction(x, y, z) {
  if (x > 0) {
    if (y > 0) {
      for (let i = 0; i < z; i++) {
        if (i % 2 === 0) {
          if (i > 10) {
            return i;
          }
        } else {
          while (x > 0) {
            x--;
            if (x === 5) break;
          }
        }
      }
    } else {
      switch (y) {
        case 1:
          return 'one';
        case 2:
          return 'two';
        default:
          return 'other';
      }
    }
  }
  return null;
}`,
        encoding: 'utf-8',
        size: 500,
        sha: 'def456',
        url: 'http://example.com/complex.js'
      }];

      const result = await analyzer.calculateComplexity(files);

      expect(result.maxComplexity).toBeGreaterThan(5);
      expect(result.complexFunctions).toHaveLength(1);
      expect(result.complexFunctions[0].name).toBe('complexFunction');
      expect(result.complexFunctions[0].complexity).toBeGreaterThan(5);
      expect(result.complexFunctions[0].suggestion).toBeDefined();
    });

    test('여러 파일 복잡도 계산', async () => {
      const files: FileContent[] = [
        {
          name: 'file1.js',
          path: 'src/file1.js',
          content: 'function simple() { return 1; }',
          encoding: 'utf-8',
          size: 50,
          sha: 'abc1',
          url: 'http://example.com/file1.js'
        },
        {
          name: 'file2.js',
          path: 'src/file2.js',
          content: `
function moderate(x) {
  if (x > 0) {
    for (let i = 0; i < x; i++) {
      if (i % 2 === 0) {
        console.log(i);
      }
    }
  }
  return x;
}`,
          encoding: 'utf-8',
          size: 150,
          sha: 'abc2',
          url: 'http://example.com/file2.js'
        }
      ];

      const result = await analyzer.calculateComplexity(files);

      expect(result.complexFunctions).toHaveLength(2);
      expect(result.averageComplexity).toBeGreaterThan(0);
      expect(result.distribution.low + result.distribution.medium +
             result.distribution.high + result.distribution.veryHigh).toBe(2);
    });

    test('TypeScript 파일 복잡도 계산', async () => {
      const files: FileContent[] = [{
        name: 'typescript.ts',
        path: 'src/typescript.ts',
        content: `
interface User {
  id: number;
  name: string;
}

class UserService {
  private users: User[] = [];

  public getUserById(id: number): User | null {
    const user = this.users.find(u => u.id === id);
    if (user) {
      if (user.name.length > 0) {
        return user;
      } else {
        throw new Error('Invalid user name');
      }
    }
    return null;
  }

  public addUser(user: User): void {
    if (user.id > 0 && user.name.trim().length > 0) {
      this.users.push(user);
    } else {
      throw new Error('Invalid user data');
    }
  }
}`,
        encoding: 'utf-8',
        size: 400,
        sha: 'ts123',
        url: 'http://example.com/typescript.ts'
      }];

      const result = await analyzer.calculateComplexity(files);

      expect(result.complexFunctions.length).toBeGreaterThanOrEqual(1);
      expect(result.averageComplexity).toBeGreaterThan(1);
    });

    test('빈 파일 처리', async () => {
      const files: FileContent[] = [{
        name: 'empty.js',
        path: 'src/empty.js',
        content: '',
        encoding: 'utf-8',
        size: 0,
        sha: 'empty',
        url: 'http://example.com/empty.js'
      }];

      const result = await analyzer.calculateComplexity(files);

      expect(result.complexFunctions).toHaveLength(0);
      expect(result.averageComplexity).toBe(0);
      expect(result.maxComplexity).toBe(0);
    });

    test('문법 오류가 있는 파일 처리', async () => {
      const files: FileContent[] = [{
        name: 'invalid.js',
        path: 'src/invalid.js',
        content: 'function invalid( { return }',
        encoding: 'utf-8',
        size: 30,
        sha: 'invalid',
        url: 'http://example.com/invalid.js'
      }];

      const result = await analyzer.calculateComplexity(files);

      // 파싱 오류가 있어도 빈 결과 반환
      expect(result.complexFunctions).toHaveLength(0);
      expect(result.averageComplexity).toBe(0);
    });
  });

  describe('코드 중복 검사', () => {
    test('중복 코드 블록 감지', async () => {
      const files: FileContent[] = [
        {
          name: 'file1.js',
          path: 'src/file1.js',
          content: `
function processData(data) {
  if (!data) {
    throw new Error('Data is required');
  }
  const result = data.map(item => item * 2);
  return result.filter(item => item > 0);
}`,
          encoding: 'utf-8',
          size: 200,
          sha: 'dup1',
          url: 'http://example.com/file1.js'
        },
        {
          name: 'file2.js',
          path: 'src/file2.js',
          content: `
function transformData(data) {
  if (!data) {
    throw new Error('Data is required');
  }
  const result = data.map(item => item * 2);
  return result.filter(item => item > 0);
}`,
          encoding: 'utf-8',
          size: 200,
          sha: 'dup2',
          url: 'http://example.com/file2.js'
        }
      ];

      const result = await analyzer.detectDuplication(files);

      expect(result.duplicatedBlocks).toBeGreaterThan(0);
      expect(result.duplicationPercentage).toBeGreaterThan(0);
      expect(result.duplicatedBlocks).toHaveLength(1);
      expect(result.duplicatedBlocks[0].occurrences).toHaveLength(2);
      expect(result.duplicatedBlocks[0].similarity).toBeGreaterThan(0.8);
    });

    test('부분 중복 코드 감지', async () => {
      const files: FileContent[] = [
        {
          name: 'partial1.js',
          path: 'src/partial1.js',
          content: `
function validateUser(user) {
  if (!user.name || user.name.length === 0) {
    return false;
  }
  if (!user.email || !user.email.includes('@')) {
    return false;
  }
  return true;
}`,
          encoding: 'utf-8',
          size: 150,
          sha: 'part1',
          url: 'http://example.com/partial1.js'
        },
        {
          name: 'partial2.js',
          path: 'src/partial2.js',
          content: `
function checkUser(user) {
  if (!user.name || user.name.length === 0) {
    return false;
  }
  if (!user.phone || user.phone.length < 10) {
    return false;
  }
  return true;
}`,
          encoding: 'utf-8',
          size: 150,
          sha: 'part2',
          url: 'http://example.com/partial2.js'
        }
      ];

      const result = await analyzer.detectDuplication(files);

      expect(result.duplicatedBlocks).toBeGreaterThanOrEqual(0);
      if (result.duplicatedBlocks > 0) {
        expect(result.duplicatedBlocks[0].similarity).toBeLessThan(1.0);
      }
    });

    test('중복이 없는 파일들', async () => {
      const files: FileContent[] = [
        {
          name: 'unique1.js',
          path: 'src/unique1.js',
          content: 'function add(a, b) { return a + b; }',
          encoding: 'utf-8',
          size: 50,
          sha: 'uniq1',
          url: 'http://example.com/unique1.js'
        },
        {
          name: 'unique2.js',
          path: 'src/unique2.js',
          content: 'function multiply(x, y) { return x * y; }',
          encoding: 'utf-8',
          size: 50,
          sha: 'uniq2',
          url: 'http://example.com/unique2.js'
        }
      ];

      const result = await analyzer.detectDuplication(files);

      expect(result.duplicatedBlocks).toBe(0);
      expect(result.duplicationPercentage).toBe(0);
      expect(result.duplicatedBlocks).toHaveLength(0);
    });

    test('단일 파일 내 중복', async () => {
      const files: FileContent[] = [{
        name: 'self-dup.js',
        path: 'src/self-dup.js',
        content: `
function formatName(name) {
  if (!name) return '';
  return name.trim().toLowerCase();
}

function formatEmail(email) {
  if (!email) return '';
  return email.trim().toLowerCase();
}

function formatPhone(phone) {
  if (!phone) return '';
  return phone.trim().toLowerCase();
}`,
        encoding: 'utf-8',
        size: 300,
        sha: 'selfdup',
        url: 'http://example.com/self-dup.js'
      }];

      const result = await analyzer.detectDuplication(files);

      expect(result.duplicatedBlocks).toBeGreaterThan(0);
      expect(result.duplicatedBlocks[0].occurrences).toHaveLength(3);
    });
  });

  describe('테스트 커버리지 분석', () => {
    test('테스트 파일과 소스 파일 매칭', async () => {
      const files: FileContent[] = [
        {
          name: 'calculator.js',
          path: 'src/calculator.js',
          content: `
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { add, subtract, multiply };`,
          encoding: 'utf-8',
          size: 200,
          sha: 'calc',
          url: 'http://example.com/calculator.js'
        },
        {
          name: 'calculator.test.js',
          path: 'test/calculator.test.js',
          content: `
const { add, subtract } = require('../src/calculator');

describe('Calculator', () => {
  test('add function', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('subtract function', () => {
    expect(subtract(5, 3)).toBe(2);
  });
});`,
          encoding: 'utf-8',
          size: 250,
          sha: 'calctest',
          url: 'http://example.com/calculator.test.js'
        }
      ];

      const result = await analyzer.analyzeTestCoverage(files);

      expect(result.fileCoverage).toHaveLength(1);
      expect(result.fileCoverage[0].file).toBe('src/calculator.js');
      expect(result.fileCoverage[0].coveragePercentage).toBeGreaterThan(0);
      expect(result.fileCoverage[0].coveragePercentage).toBeLessThanOrEqual(100);
    });

    test('커버리지가 낮은 파일 식별', async () => {
      const files: FileContent[] = [
        {
          name: 'service.js',
          path: 'src/service.js',
          content: `
class UserService {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
  }

  removeUser(id) {
    this.users = this.users.filter(u => u.id !== id);
  }

  findUser(id) {
    return this.users.find(u => u.id === id);
  }

  validateUser(user) {
    return user && user.name && user.email;
  }

  generateReport() {
    return this.users.map(u => ({ name: u.name, status: 'active' }));
  }
}`,
          encoding: 'utf-8',
          size: 400,
          sha: 'service',
          url: 'http://example.com/service.js'
        },
        {
          name: 'service.test.js',
          path: 'test/service.test.js',
          content: `
const UserService = require('../src/service');

describe('UserService', () => {
  test('addUser', () => {
    const service = new UserService();
    service.addUser({ id: 1, name: 'John' });
    expect(service.users.length).toBe(1);
  });
});`,
          encoding: 'utf-8',
          size: 200,
          sha: 'servicetest',
          url: 'http://example.com/service.test.js'
        }
      ];

      const result = await analyzer.analyzeTestCoverage(files);

      expect(result.coveragePercentage).toBeLessThan(50);
      expect(result.fileCoverage[0].uncoveredLines.length).toBeGreaterThan(0);
    });

    test('테스트 파일이 없는 경우', async () => {
      const files: FileContent[] = [{
        name: 'untested.js',
        path: 'src/untested.js',
        content: `
function complexFunction() {
  // 복잡한 로직
  return 'result';
}`,
        encoding: 'utf-8',
        size: 100,
        sha: 'untested',
        url: 'http://example.com/untested.js'
      }];

      const result = await analyzer.analyzeTestCoverage(files);

      expect(result.coveragePercentage).toBe(0);
      expect(result.fileCoverage[0].coveragePercentage).toBe(0);
      expect(result.fileCoverage[0].uncoveredLines.length).toBeGreaterThan(0);
    });

    test('100% 커버리지 달성', async () => {
      const files: FileContent[] = [
        {
          name: 'math.js',
          path: 'src/math.js',
          content: `
function square(x) {
  return x * x;
}

module.exports = { square };`,
          encoding: 'utf-8',
          size: 80,
          sha: 'math',
          url: 'http://example.com/math.js'
        },
        {
          name: 'math.test.js',
          path: 'test/math.test.js',
          content: `
const { square } = require('../src/math');

describe('Math', () => {
  test('square function', () => {
    expect(square(2)).toBe(4);
    expect(square(0)).toBe(0);
    expect(square(-3)).toBe(9);
  });
});`,
          encoding: 'utf-8',
          size: 150,
          sha: 'mathtest',
          url: 'http://example.com/math.test.js'
        }
      ];

      const result = await analyzer.analyzeTestCoverage(files);

      expect(result.coveragePercentage).toBe(100);
      expect(result.fileCoverage[0].uncoveredLines).toHaveLength(0);
    });
  });

  describe('유지보수성 평가', () => {
    test('높은 유지보수성 코드', async () => {
      const files: FileContent[] = [{
        name: 'good-code.js',
        path: 'src/good-code.js',
        content: `
/**
 * 사용자 검증 유틸리티
 */
class UserValidator {
  /**
   * 이메일 형식 검증
   * @param {string} email - 검증할 이메일
   * @returns {boolean} 유효성 여부
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 패스워드 강도 검증
   * @param {string} password - 검증할 패스워드
   * @returns {boolean} 유효성 여부
   */
  static validatePassword(password) {
    return password && password.length >= 8;
  }
}

module.exports = UserValidator;`,
        encoding: 'utf-8',
        size: 500,
        sha: 'good',
        url: 'http://example.com/good-code.js'
      }];

      const result = await analyzer.assessMaintainability(files);

      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.fileScores[0].score).toBeGreaterThan(70);
      expect(result.factors.find(f => f.name === 'documentation')?.score).toBeGreaterThan(70);
    });

    test('낮은 유지보수성 코드', async () => {
      const files: FileContent[] = [{
        name: 'bad-code.js',
        path: 'src/bad-code.js',
        content: `
function a(x,y,z,w,q,r,t){
if(x>0){
if(y>0){
for(let i=0;i<z;i++){
if(i%2==0){
if(w>0){
for(let j=0;j<w;j++){
if(q>j){
if(r>0){
while(t>0){
t--;
if(t==5)break;
}
}
}
}
}
}
}
}
}
return null;
}
let b=function(d){return d*d*d*d*d;};
function c(){var e=1;var f=2;var g=3;var h=4;var k=5;return e+f+g+h+k;}`,
        encoding: 'utf-8',
        size: 400,
        sha: 'bad',
        url: 'http://example.com/bad-code.js'
      }];

      const result = await analyzer.assessMaintainability(files);

      expect(result.overallScore).toBeLessThan(50);
      expect(result.fileScores[0].score).toBeLessThan(50);
      expect(result.fileScores[0].issues.length).toBeGreaterThan(0);
    });

    test('혼재된 품질의 코드베이스', async () => {
      const files: FileContent[] = [
        {
          name: 'good.js',
          path: 'src/good.js',
          content: `
/**
 * 잘 작성된 유틸리티 함수
 */
function calculateSum(numbers) {
  if (!Array.isArray(numbers)) {
    throw new Error('Input must be an array');
  }

  return numbers.reduce((sum, num) => sum + num, 0);
}

module.exports = { calculateSum };`,
          encoding: 'utf-8',
          size: 200,
          sha: 'good2',
          url: 'http://example.com/good.js'
        },
        {
          name: 'bad.js',
          path: 'src/bad.js',
          content: `
function x(a){if(a>0){if(a<100){if(a%2==0){return a*2;}else{return a*3;}}else{return 0;}}else{return -1;}}`,
          encoding: 'utf-8',
          size: 100,
          sha: 'bad2',
          url: 'http://example.com/bad.js'
        }
      ];

      const result = await analyzer.assessMaintainability(files);

      expect(result.fileScores).toHaveLength(2);
      expect(result.fileScores[0].score).not.toBe(result.fileScores[1].score);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(100);
    });

    test('유지보수성 팩터 분석', async () => {
      const files: FileContent[] = [{
        name: 'mixed.js',
        path: 'src/mixed.js',
        content: `
// 일부 문서화
function processData(data) {
  // 복잡한 로직
  if (data && data.length > 0) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].type === 'valid') {
        result.push(data[i].value * 2);
      }
    }
    return result;
  }
  return [];
}

function helper() { return 1; }`,
        encoding: 'utf-8',
        size: 300,
        sha: 'mixed',
        url: 'http://example.com/mixed.js'
      }];

      const result = await analyzer.assessMaintainability(files);

      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors.every(f => f.score >= 0 && f.score <= 100)).toBe(true);
      expect(result.factors.every(f => f.weight >= 0 && f.weight <= 1)).toBe(true);
    });

    test('빈 프로젝트 처리', async () => {
      const files: FileContent[] = [];

      const result = await analyzer.assessMaintainability(files);

      expect(result.overallScore).toBe(0);
      expect(result.fileScores).toHaveLength(0);
      expect(result.factors).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    test('지원하지 않는 파일 형식', async () => {
      const files: FileContent[] = [{
        name: 'image.png',
        path: 'assets/image.png',
        content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        encoding: 'base64',
        size: 1000,
        sha: 'image',
        url: 'http://example.com/image.png'
      }];

      const result = await analyzer.calculateComplexity(files);

      expect(result.complexFunctions).toHaveLength(0);
      expect(result.averageComplexity).toBe(0);
    });

    test('매우 큰 파일 처리', async () => {
      const largeContent = 'function test() { return 1; }\n'.repeat(10000);
      const files: FileContent[] = [{
        name: 'large.js',
        path: 'src/large.js',
        content: largeContent,
        encoding: 'utf-8',
        size: largeContent.length,
        sha: 'large',
        url: 'http://example.com/large.js'
      }];

      const result = await analyzer.calculateComplexity(files);

      expect(result.complexFunctions.length).toBeGreaterThan(0);
      expect(result.averageComplexity).toBeGreaterThan(0);
    });

    test('null 또는 undefined 파일 내용', async () => {
      const files: FileContent[] = [{
        name: 'null.js',
        path: 'src/null.js',
        content: null as any,
        encoding: 'utf-8',
        size: 0,
        sha: 'null',
        url: 'http://example.com/null.js'
      }];

      const result = await analyzer.calculateComplexity(files);

      expect(result.complexFunctions).toHaveLength(0);
      expect(result.averageComplexity).toBe(0);
    });
  });
});