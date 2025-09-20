# 코드 플로우 분석 보고서

## 분석 대상
- **URL**: https://github.com/ssu-capstone-bookstar/clientv/issues/21
- **제목**: "읽던 책 읽기"에서 상세페이지 색상 조정
- **분석 시간**: 2025-09-20 15:59:31

## 플로우 구조
```
clientv/lib/main.dart:25 (MyApp)
├── clientv/lib/common/router/router.dart:341 (/reading-challenge)
│   ├── Flutter Widget Tree:
│   │   ├── ReadingChallengeScreen
│   │   │   ├── Scaffold
│   │   │   │   ├── Background: LinearGradient (ColorName.b1 → ColorName.p1)
│   │   │   │   ├── Header Section
│   │   │   │   │   ├── 읽은 책 개수 표시 (ColorName.w1)
│   │   │   │   │   ├── 완독 책 개수 표시 (ColorName.w1)
│   │   │   │   │   └── 새로운 책 읽기 버튼 (Assets.icons.icPlus)
│   │   │   │   └── 읽던 책 리스트 (CustomListView)
│   │   │   │       ├── emptyText: '읽던 책이 없네요!' (ColorName.w1)
│   │   │   │       └── 책 아이템들
│   │   │   │           ├── 책 표지 이미지 (Transform.rotate)
│   │   │   │           ├── 책 제목 (ColorName.w1)
│   │   │   │           ├── 진행률 배지 (RadialGradient: ColorName.p1 → ColorName.b1)
│   │   │   │           └── 저자명 (ColorName.g2, ColorName.w1)
│   │   │   └── Navigation to Detail:
│   │   │       └── onTap → '/reading-challenge/detail/${item.book.id}'
│   │   │           └── ReadingChallengeDetailScreen
│   │   │               ├── AppBar: '리딩 챌린지' (AppTexts.b5)
│   │   │               ├── BookInfoWidget (책 정보 표시)
│   │   │               ├── 포인트 섹션
│   │   │               │   ├── 받은 포인트 (ColorName.p1)
│   │   │               │   └── 읽은 페이지 표시 (ColorName.w1)
│   │   │               ├── 달력 섹션 (ColorName.g7 배경)
│   │   │               ├── 독서 다이어리 섹션
│   │   │               │   ├── SectionHeader: '내가 쓴 독서 다이어리'
│   │   │               │   ├── 정렬 토글 (ColorName.g3)
│   │   │               │   └── AsyncImageGridView (다이어리 썸네일들)
│   │   │               └── BottomNavigationBar
│   │   │                   ├── '챌린지 진행하기' 버튼
│   │   │                   └── '챌린지 중단하기' 버튼 (ColorName.g7 배경)
│   │   └── API Calls:
│   │       ├── ongoingChallengeViewModelProvider.fetchChallenges()
│   │       │   └── GET /api/challenges/ongoing
│   │       ├── bookViewModelProvider(bookId)
│   │       │   └── GET /api/books/{bookId}
│   │       └── myDiariesViewModelProvider(bookId)
│   │           └── GET /api/diaries/my?bookId={bookId}
└── Color Theme System:
    ├── lib/gen/colors.gen.dart
    │   ├── ColorName.b1: #FF191919 (다크 배경)
    │   ├── ColorName.p1: #FF775DFF (메인 보라색)
    │   ├── ColorName.w1: #FFFFFFFF (흰색 텍스트)
    │   ├── ColorName.g2: #FFBCC2C6 (회색 보조 텍스트)
    │   ├── ColorName.g3: #FF6B6B75 (어두운 회색)
    │   └── ColorName.g7: #FF2D2D33 (어두운 배경색)
    └── lib/common/theme/app_theme.dart (테마 정의)
```

## 잠재적 이슈
- **UI 색상 일관성**: Issue #21에서 언급된 "상세페이지 색상 조정"이 필요한 상황
- **다크 테마 적용**: 현재 ColorName.b1 (다크)과 ColorName.p1 (보라) 계열이 주로 사용됨
- **가독성 문제**: 일부 텍스트 색상이 배경과의 대비가 부족할 수 있음
- **색상 체계**: 동일한 UI 컴포넌트에서 일관된 색상 사용 필요

## 상세 분석
### 파일별 색상 사용 현황:
1. **reading_challenge_screen.dart:198** - 빈 상태 텍스트가 흰색(ColorName.w1)으로 표시
2. **reading_challenge_detail_screen.dart:149** - 중단 버튼이 회색(ColorName.g7) 배경 사용
3. **colors.gen.dart** - 색상 팔레트가 다크 테마 기반으로 구성됨

### 영향 범위:
- **Flutter Widget Tree**: ReadingChallengeScreen → ReadingChallengeDetailScreen 네비게이션 플로우
- **UI 컴포넌트**: CustomListView, SectionHeader, CtaButtonL1 등의 공통 컴포넌트
- **색상 시스템**: ColorName 클래스의 전체 색상 체계와 AppTheme 적용

### 개선 제안사항:
1. **색상 대비 개선**: 텍스트와 배경 간의 접근성 지침 준수
2. **일관된 색상 적용**: 유사한 기능의 UI 요소들이 동일한 색상 규칙 적용
3. **다크 모드 최적화**: 현재 다크 테마 기반이므로 라이트 모드 지원 검토
4. **사용자 경험 향상**: 읽던 책 목록과 상세페이지 간의 시각적 연결성 강화