# AI 토큰 사용량을 37-91% 절약하는 한 줄 프롬프트 전략

## 핵심 결과

이 연구에서는 코드 리팩토링을 통해 AI 토큰 사용량을 대폭 절감할 수 있음을 입증했습니다:
- **Claude-4 Sonnet**: 37.91% 토큰 사용량 감소
- **GPT-5**: 26.03% 토큰 사용량 감소

## 실험 방법론

### 사용된 프롬프트
```
"Refactor the falling objects' behaviors to use the Strategy pattern and their creation to use the Factory pattern"
```

**한글 해석**:
"떨어지는 객체들의 행동은 Strategy 패턴을 사용하고, 객체 생성은 Factory 패턴을 사용하도록 리팩토링해줘"

**구체적 의미**:
- **떨어지는 객체들의 행동**: 게임에서 물체가 떨어지는 방식 (직선으로, 지그재그로, 회전하면서 등)
- **Strategy 패턴 적용**: 각각의 떨어지는 방식을 별도 클래스로 분리
- **객체 생성**: 새로운 떨어지는 물체를 만드는 부분
- **Factory 패턴 적용**: 물체 종류별 생성 로직을 Factory 클래스에서 관리

### 실험 설정
- 동일한 기능 추가 프롬프트를 서로 다른 코드 구조에서 테스트
- 두 가지 AI 모델(Claude-4 Sonnet, GPT-5)로 여러 라운드 실행
- 제로 컨텍스트 테스팅 및 엄격한 실험 제어

## 리팩토링 전략

1. **디자인 패턴 적용**
   - Strategy 패턴으로 객체 행동 구조화
   - Factory 패턴으로 객체 생성 관리

2. **코드 구조 개선**
   - 별도 파일로 구현 분리
   - 전체적인 코드 조직 향상

## 주요 발견사항

### 핵심 통찰
- **잘 구조화된 코드는 AI의 더 효율적인 연산을 가능하게 한다**
- 토큰 사용량 감소는 AI 사용 비용 절감으로 직결
- 동일한 기능 추가 프롬프트가 더 잘 정리된 코드베이스에서 더 적은 토큰을 소비

### 실험 결과 해석
> "소스 코드는 단순한 로직 이상이다; 그것은 작성자의 사고와 방향성을 담고 있다."

이 실험은 좋은 코드 구조가 AI의 더 효율적인 연산을 돕고, 결과적으로 연산 비용을 절감한다는 것을 시사합니다.

## 실용적 의미

1. **비용 절감**: 토큰 사용량 직접적 감소
2. **효율성 향상**: AI 모델의 더 나은 코드 이해
3. **재현 가능성**: 공개 코드를 통한 실험 검증 가능

## 디자인 패턴 설명

### Strategy 패턴 (전략 패턴)

동일한 작업을 수행하는 여러 가지 방법을 각각 클래스로 만들어 교체 가능하게 하는 패턴

**기존 코드**:
```javascript
function calculateShipping(type, weight) {
  if (type === 'standard') return weight * 5;
  else if (type === 'express') return weight * 10;
  else if (type === 'overnight') return weight * 20;
}
```

**Strategy 패턴 적용**:
```javascript
class StandardShipping {
  calculate(weight) { return weight * 5; }
}

class ExpressShipping {
  calculate(weight) { return weight * 10; }
}

class ShippingCalculator {
  constructor(strategy) { this.strategy = strategy; }
  calculate(weight) { return this.strategy.calculate(weight); }
}

// 사용: const calculator = new ShippingCalculator(new ExpressShipping());
```

### Factory 패턴 (공장 패턴)

객체 생성 로직을 별도 클래스에 위임하여 객체 생성을 캡슐화하는 패턴

**기존 코드**:
```javascript
function createAnimal(type) {
  if (type === 'dog') return new Dog();
  else if (type === 'cat') return new Cat();
  else if (type === 'bird') return new Bird();
}
```

**Factory 패턴 적용**:
```javascript
class AnimalFactory {
  static createAnimal(type) {
    switch(type) {
      case 'dog': return new Dog();
      case 'cat': return new Cat();
      case 'bird': return new Bird();
      default: throw new Error('Unknown animal type');
    }
  }
}

// 사용: const dog = AnimalFactory.createAnimal('dog');
```

### AI 효율성이 향상되는 이유

1. **명확한 구조**: AI가 코드의 의도를 쉽게 파악
2. **예측 가능한 패턴**: 표준 디자인 패턴으로 AI가 학습된 구조
3. **분리된 책임**: 각 클래스의 역할이 명확해 AI가 수정할 부분을 정확히 식별

## 프롬프트 작성 팁

1. **리팩토링부터 요청**: 기능 추가 전에 코드 구조를 먼저 정리
2. **명확한 패턴 지정**: "Strategy 패턴으로 리팩토링해줘" 같이 구체적으로 명시
3. **단계별 접근**: 1단계 리팩토링 → 2단계 기능 추가

---

*원문: https://modgo.org/the-one-line-prompt-that-cut-token-usage-by-37-91/*
