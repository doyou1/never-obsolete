# .md 파일 번역 지식 (Markdown Translation Knowledge)

## 개요

이 문서는 일본어 원본 .md 파일을 한국어로 번역할 때 얻은 지식과 경험을 정리한 것입니다. 특히 기술 문서, 명령어 가이드, 개발 가이드 등의 번역 시 주의사항과 모범 사례를 포함합니다.

## 번역 원칙

### 1. 구조 보존 (Structure Preservation)
- **원본 파일의 구조를 정확히 유지**
- 모든 섹션, 하위 섹션, 빈 줄의 위치 보존
- 마크다운 문법 구조 유지
- 들여쓰기와 포맷팅 정확히 복제

### 2. 파일명과 명령어명 보존
- 파일명: `kairo-design.md` → `kairo-design.md` (번역 금지)
- 명령어명: `/tdd-red` → `/tdd-red` (번역 금지)
- 변수명: `{{feature_name}}` → `{{feature_name}}` (번역 금지)
- 함수명: `processData()` → `processData()` (번역 금지)

### 3. 코드 블록 내 영어 유지
```javascript
// ❌ 잘못된 번역
function 데이터처리(입력값) {
  const 결과 = 입력값.map(항목 => 항목 * 2);
  return 결과;
}

// ✅ 올바른 번역
function processData(input) {
  const result = input.map(item => item * 2);
  return result;
}
```

## 번역 품질 검증 방법

### 1. 파일 길이 비교
```bash
# 원본과 번역본의 줄 수 비교
wc -l commands/original.md commands-kr/translated.md

# 예상 결과: 동일한 줄 수여야 함
# 321 commands/original.md
# 321 commands-kr/translated.md
```

### 2. 섹션 구조 비교
```bash
# 주요 섹션 수 비교
grep -n "^## " commands/original.md | wc -l
grep -n "^## " commands-kr/translated.md | wc -l

# 하위 섹션 수 비교
grep -n "^### " commands/original.md | wc -l
grep -n "^### " commands-kr/translated.md | wc -l
```

### 3. 빈 줄 위치 확인
```bash
# 빈 줄 위치 확인
grep -n "^$" commands/original.md
grep -n "^$" commands-kr/translated.md
```

## 자주 발생하는 번역 오류

### 1. 명령어명 번역 오류
```markdown
# ❌ 잘못된 번역
# kairo-디자인
# tdd-빨간단계
# rev-요구사항

# ✅ 올바른 번역
# kairo-design
# tdd-red
# rev-requirements
```

### 2. 변수명과 함수명 번역 오류
```javascript
// ❌ 잘못된 번역
function {{함수명}}(매개변수) {
  const 결과 = 처리(입력값);
  return 결과;
}

// ✅ 올바른 번역
function {{function_name}}(paramName) {
  const result = processData(input);
  return result;
}
```

### 3. 자연스럽지 않은 표현
```markdown
# ❌ 부자연스러운 번역
- 신호로 코멘트해주세요
- 입력값이 불정합니다
- 데이터베이스-sql.sql

# ✅ 자연스러운 번역
- 신호로 표시해주세요
- 입력값이 유효하지 않습니다
- database-schema.sql
```

## 번역 작업 프로세스

### 1단계: 파일 분석
1. 원본 파일 전체 읽기
2. 파일 길이와 구조 파악
3. 섹션과 하위 섹션 수 확인
4. 코드 블록과 변수명 식별

### 2단계: 번역 실행
1. 원본 구조를 정확히 복제
2. 텍스트만 한국어로 번역
3. 코드 블록 내 영어 유지
4. 빈 줄과 들여쓰기 보존

### 3단계: 품질 검증
1. 파일 길이 비교
2. 섹션 구조 비교
3. 코드 블록 검증
4. 자연스러운 한국어 확인

### 4단계: 최종 확인
1. 전체 파일 읽기 검토
2. 누락된 섹션 확인
3. 번역 오류 수정
4. 최종 길이 및 구조 확인

## 기술 용어 번역 가이드

### 개발 관련 용어
| 일본어 | 한국어 | 비고 |
|--------|--------|------|
| 実装 | 구현 | |
| 設計 | 설계 | |
| 要件 | 요구사항 | |
| テスト | 테스트 | |
| 開発 | 개발 | |
| 環境 | 환경 | |
| 設定 | 설정 | |
| 確認 | 확인 | |
| 実行 | 실행 | |
| 分析 | 분석 | |

### 아키텍처 관련 용어
| 일본어 | 한국어 | 비고 |
|--------|--------|------|
| アーキテクチャ | 아키텍처 | |
| データフロー | 데이터 흐름 | |
| API仕様 | API 사양 | |
| データベース | 데이터베이스 | |
| スキーマ | 스키마 | |
| インターフェース | 인터페이스 | |
| コンポーネント | 컴포넌트 | |
| レイヤー | 레이어 | |

### TDD 관련 용어
| 일본어 | 한국어 | 비고 |
|--------|--------|------|
| Redフェーズ | Red 단계 | |
| Greenフェーズ | Green 단계 | |
| Refactorフェーズ | Refactor 단계 | |
| テストケース | 테스트 케이스 | |
| 単体テスト | 단위 테스트 | |
| 統合テスト | 통합 테스트 | |
| E2Eテスト | E2E 테스트 | |

## 파일별 특수 고려사항

### 1. 명령어 가이드 파일
- 명령어명 번역 금지
- 사용법 예시의 영어 유지
- 환경 변수명 번역 금지

### 2. 기술 설계 문서
- 아키텍처 용어의 일관성 유지
- 다이어그램 설명의 정확성
- 코드 예시의 완전성 보장

### 3. TDD 관련 문서
- TDD 용어의 일관성
- 테스트 코드 예시의 정확성
- 단계별 설명의 명확성

### 4. API 문서
- 엔드포인트명 번역 금지
- HTTP 메서드 번역 금지
- 상태 코드 번역 금지

## 도구 및 스크립트

### 파일 비교 스크립트
```bash
#!/bin/bash
# 파일 비교 스크립트

ORIGINAL_DIR="commands"
TRANSLATED_DIR="commands-kr"

echo "=== 파일 길이 비교 ==="
for file in $ORIGINAL_DIR/*.md; do
    base=$(basename "$file")
    orig_lines=$(wc -l < "$file")
    trans_lines=$(wc -l < "$TRANSLATED_DIR/$base")
    
    if [ "$orig_lines" != "$trans_lines" ]; then
        echo "❌ $base: $orig_lines → $trans_lines"
    else
        echo "✅ $base: $orig_lines"
    fi
done
```

### 섹션 구조 검증 스크립트
```bash
#!/bin/bash
# 섹션 구조 검증 스크립트

echo "=== 섹션 구조 비교 ==="
for file in commands/*.md; do
    base=$(basename "$file")
    orig_sections=$(grep -c "^## " "$file")
    trans_sections=$(grep -c "^## " "commands-kr/$base")
    
    if [ "$orig_sections" != "$trans_sections" ]; then
        echo "❌ $base: $orig_sections → $trans_sections 섹션"
    fi
done
```

## 품질 체크리스트

### 번역 전
- [ ] 원본 파일 전체 읽기
- [ ] 파일 구조 파악
- [ ] 코드 블록 식별
- [ ] 변수명과 함수명 식별

### 번역 중
- [ ] 구조 정확히 복제
- [ ] 코드 블록 내 영어 유지
- [ ] 명령어명 번역 금지
- [ ] 빈 줄 위치 보존

### 번역 후
- [ ] 파일 길이 비교
- [ ] 섹션 수 비교
- [ ] 코드 블록 검증
- [ ] 자연스러운 한국어 확인
- [ ] 누락된 섹션 확인

## 주의사항

### 1. 부분 번역 금지
- 파일의 일부만 번역하지 말 것
- 모든 섹션을 포함하여 번역할 것
- 누락된 내용이 있는지 반드시 확인할 것

### 2. 일관성 유지
- 동일한 용어는 일관되게 번역할 것
- 기술 용어는 표준 번역어 사용할 것
- 문체와 톤을 일관되게 유지할 것

### 3. 정확성 우선
- 의미 전달의 정확성 우선
- 자연스러운 한국어보다 정확한 번역 우선
- 불확실한 경우 원본 의미 유지

## 결론

.md 파일 번역은 단순한 텍스트 번역이 아닌 구조와 의미를 모두 보존하는 작업입니다. 특히 기술 문서의 경우 정확성과 일관성이 매우 중요하므로, 체계적인 접근과 철저한 검증이 필요합니다.

이 지식을 바탕으로 향후 번역 작업을 수행할 때 더욱 정확하고 효율적인 번역이 가능할 것입니다. 