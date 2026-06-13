import type { ProgressOverlayState } from "../shared/layout/AppShell";
import type { CareerSave } from "../types/game";

export function getProgressOverlayState(career: CareerSave): ProgressOverlayState {
  if (career.seasonState.phase === "offseason") {
    return {
      title: "스토브리그 진행중",
      message: "계약 제안, 구단 경쟁, 이적 로그를 정리하며 다음날로 이동하는 중",
      steps: ["제안 확인", "구단 경쟁 처리", "로스터 상태 갱신", "다음날 준비"],
    };
  }

  if (career.seasonState.progressStatus === "match-preview") {
    return {
      title: "경기 진행중",
      message: "밴픽, 선수 상태, 시리즈 결과를 계산하는 중",
      steps: ["밴픽 분석", "선수 컨디션 반영", "세트 결과 계산", "순위표 갱신"],
    };
  }

  if (career.seasonState.progressStatus === "match-review") {
    return {
      title: "경기 후 정리중",
      message: "리뷰를 마무리하고 다음 날짜로 이동하는 중",
      steps: ["경기 기록 저장", "선수 상태 반영", "다음 일정 확인"],
    };
  }

  return {
    title: "하루 진행중",
    message: "오늘의 일정과 AI 경기 결과를 처리하는 중",
    steps: ["일정 확인", "AI 경기 계산", "대회 상태 갱신", "다음 날짜 준비"],
  };
}
