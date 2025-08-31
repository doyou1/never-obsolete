#!/bin/bash

# TDD 전체 사이클 실행 스크립트
# 사용법: ./tdd-cycle-full.sh <테스트_케이스_이름>

# 시작 시간 기록
START_TIME=$(date +%s)

if [ $# -ne 1 ]; then
    echo "사용법: $0 <테스트_케이스_이름>"
    exit 1
fi

TEST_CASE_NAME=$1

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Claude 명령어 공통 설정
ALLOWED_TOOLS="Write,Edit,Bash(npm:*),Bash(node:*)"
DISALLOWED_TOOLS="Bash(git *)"
VERIFY_ALLOWED_TOOLS="Write,Edit,Bash(npm:*),Bash(node:*),Bash(git status),Bash(git diff)"
VERIFY_DISALLOWED_TOOLS="Bash(git add),Bash(git commit),Bash(git push)"

# TDD 사이클 실행 함수
run_tdd_cycle() {
    local test_case=$1
    
    echo "🔴 RED 단계 시작..."
    if ! claude -p "/tdd-red $test_case 부족한 테스트 추가 구현" --allowedTools "$ALLOWED_TOOLS" --disallowedTools "$DISALLOWED_TOOLS"; then
        echo -e "${RED}❌ RED 단계 실패${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ RED 단계 완료${NC}"
    
    echo "🟢 GREEN 단계 시작..."
    if ! claude -p "/tdd-green $test_case" --allowedTools "$ALLOWED_TOOLS" --disallowedTools "$DISALLOWED_TOOLS"; then
        echo -e "${RED}❌ GREEN 단계 실패${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ GREEN 단계 완료${NC}"
    
    echo "🔵 REFACTOR 단계 시작..."
    if ! claude -p "/tdd-refactor $test_case" --allowedTools "$ALLOWED_TOOLS" --disallowedTools "$DISALLOWED_TOOLS"; then
        echo -e "${RED}❌ REFACTOR 단계 실패${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ REFACTOR 단계 완료${NC}"
    
    echo "🔍 VERIFY COMPLETE 단계 시작..."
    local verify_result
    verify_result=$(claude -p "/tdd-verify-complete $test_case" --allowedTools "$VERIFY_ALLOWED_TOOLS" --disallowedTools "$VERIFY_DISALLOWED_TOOLS" 2>&1)
    local verify_exit_code=$?
    
    if [ $verify_exit_code -ne 0 ]; then
        echo -e "${RED}❌ VERIFY COMPLETE 단계 실패${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ VERIFY COMPLETE 단계 완료${NC}"
    
    # 결과 판정
    if echo "$verify_result" | grep -E "(품질 기준을 만족합니다|구현 완료|검증 완료)" > /dev/null; then
        echo -e "${GREEN}🎉 TDD 사이클 완료${NC}: $test_case 의 TDD 사이클이 정상적으로 완료되었습니다"
        return 0
    elif echo "$verify_result" | grep -E "(미구현|품질 기준에 미달|추가 구현 필요)" > /dev/null; then
        echo -e "${YELLOW}🔄 TDD 사이클 계속${NC}: 품질 기준에 미달하는 항목이 발견되었습니다. RED 단계로 돌아갑니다..."
        return 1
    else
        echo -e "${YELLOW}⚠️  판정 결과가 불명확합니다${NC}"
        echo "--- VERIFY COMPLETE 단계의 출력 ---"
        echo "$verify_result"
        echo "--- 출력 종료 ---"
        echo ""
        echo -e "${BLUE}다음 중 선택해주세요:${NC}"
        echo "1) 완료로 처리 (TDD 사이클 종료)"
        echo "2) RED 단계에서 계속 진행"
        echo "3) 스크립트 종료"
        echo ""
        
        while true; do
            read -p "선택 (1/2/3): " choice
            case $choice in
                1)
                    echo -e "${GREEN}🎉 TDD 사이클 완료${NC}: 사용자 판단에 따라 완료로 처리합니다"
                    return 0
                    ;;
                2)
                    echo -e "${YELLOW}🔄 TDD 사이클 계속${NC}: 사용자 판단에 따라 RED 단계로 돌아갑니다"
                    return 1
                    ;;
                3)
                    echo -e "${BLUE}👋 스크립트를 종료합니다${NC}"
                    exit 0
                    ;;
                *)
                    echo "잘못된 선택입니다. 1, 2, 3 중에서 선택해주세요."
                    ;;
            esac
        done
    fi
}

# 완료 시간 표시 함수
show_completion_time() {
    local exit_code=$1
    local end_time
    local duration
    
    end_time=$(date +%s)
    duration=$((end_time - START_TIME))
    
    echo ""
    echo "========================================"
    echo "TDD 사이클 실행 완료"
    echo "시작 시간: $(date -r $START_TIME '+%Y-%m-%d %H:%M:%S')"
    echo "종료 시간: $(date -r $end_time '+%Y-%m-%d %H:%M:%S')"
    
    # 실행 시간을 시:분:초 형식으로 변환
    local hours=$((duration / 3600))
    local minutes=$(( (duration % 3600) / 60 ))
    local seconds=$((duration % 60))
    
    printf "총 실행 시간: %02d:%02d:%02d\n" $hours $minutes $seconds
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 작업이 성공적으로 완료되었습니다${NC}"
    else
        echo -e "${RED}❌ 오류로 인해 작업이 중단되었습니다 (종료 코드: $exit_code)${NC}"
    fi
    echo "========================================"
}

# 트랩 설정 (에러 종료 시에도 시간 표시)
trap 'show_completion_time $?' EXIT

# 메인 루프
cycle_count=0
max_cycles=10  # 무한 루프 방지를 위한 최대 실행 횟수

while [ $cycle_count -lt $max_cycles ]; do
    ((cycle_count++))
    echo -e "\n${BLUE}=== TDD 사이클 #$cycle_count 시작 ===${NC}"
    
    if run_tdd_cycle "$TEST_CASE_NAME"; then
        # TDD 사이클이 성공적으로 완료된 경우
        break
    fi
    
    if [ $cycle_count -ge $max_cycles ]; then
        echo -e "${RED}❌ 최대 실행 횟수($max_cycles회)에 도달하여 종료합니다${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔄 다음 TDD 사이클을 시작합니다...${NC}"
done

# 모든 사이클이 완료되면 종료 코드 0으로 종료
exit 0
