import type { Player } from "../../types/game";
import { getLckPlayerCareerProfile } from "./lckPlayerCareerProfiles";

export type PlayerCareerEntry = {
  period: string;
  teamName: string;
};

export function getPlayerProfileSummary(player: Player) {
  return (
    getLckPlayerCareerProfile(player.name)?.summary ??
    "이 선수의 세부 능력치는 공개되지 않습니다. 현재 화면에서는 평가, 상태, 계약 맥락과 커리어 기록을 중심으로 확인합니다."
  );
}

export function getPlayerCareerEntries(player: Player): PlayerCareerEntry[] {
  const knownEntries = getLckPlayerCareerProfile(player.name)?.careerEntries;

  if (knownEntries) {
    return knownEntries;
  }

  return [
    {
      teamName: player.currentTeam ?? "FA",
      period: "2026.01 ~ 현재",
    },
  ];
}
