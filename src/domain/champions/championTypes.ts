import type { Role } from "../../types/game";

export type Champion = {
  id: string;
  name: string;
  roles: Role[];
  archetypes: ChampionArchetype[];
  difficulty: number;
  metaScore: number;
  lanePower: number;
  teamfightPower: number;
  scalingPower: number;
  engagePower: number;
  pokePower: number;
  synergyTags: string[];
  counterTags: string[];
};

export type ChampionArchetype =
  | "blind-pick"
  | "lane-bully"
  | "scaling"
  | "teamfight"
  | "engage"
  | "poke"
  | "pick"
  | "dive"
  | "frontline"
  | "enchanter"
  | "carry"
  | "utility"
  | "split-push"
  | "global"
  | "skirmish";
