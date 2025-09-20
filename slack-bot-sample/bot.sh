#!/bin/bash

# GitHub URL 분석 및 보고서 생성 스크립트
# 사용법: ./bot.sh [GitHub-URL]

GITHUB_URL=${1:-"https://github.com/ssu-capstone-bookstar/clientv/issues/21"}
REPORTS_DIR="analysis-reports"

echo "🔍 GitHub URL 분석을 시작합니다..."
echo "📍 대상 URL: $GITHUB_URL"

# analysis-reports 디렉토리가 없으면 생성
mkdir -p "$REPORTS_DIR"

# Claude를 사용하여 GitHub URL 분석
echo "📊 Claude를 통한 분석 실행 중..."
REPORT_FILE=$(claude --dangerously-skip-permissions --print "analyze-github-url.md를 기준으로 GitHub URL을 분석하고 리포트를 생성한 후, 생성된 파일의 전체 경로를 마지막 줄에 반드시 출력해주세요: $GITHUB_URL" | tail -1)

echo "✅ 분석이 완료되었습니다!"

if [ -n "$REPORT_FILE" ] && [ -f "$REPORT_FILE" ]; then
    echo "📄 생성된 보고서: $REPORT_FILE"
    echo "📂 보고서 경로: $(realpath "$REPORT_FILE")"
else
    echo "📂 보고서는 $REPORTS_DIR 디렉토리에서 확인할 수 있습니다."
    echo "📋 생성된 보고서 목록:"
    ls -la "$REPORTS_DIR"/*.md 2>/dev/null || echo "   아직 마크다운 보고서가 생성되지 않았습니다."
fi