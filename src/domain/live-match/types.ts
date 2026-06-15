import type { Role } from "../../types/game";
import type { Champion } from "../champions";
import type { MatchItem } from "../items";
import type { DragonType, GeneratedMatchTimeline } from "./matchTimeline";

export type LiveMatchSide = "blue" | "red";

export type LiveMatchTimelineEventType =
  | "objective"
  | "fight"
  | "setup"
  | "finish";

export type LiveMatchEventAdvantage = LiveMatchSide | "neutral";

export type LiveMatchImportance = "low" | "medium" | "high" | "critical";

export type LiveMatchObjectiveSnapshot = {
  barons: number;
  dragons: number;
  // Elemental dragons taken in order, for the objective bar.
  dragonTypes: DragonType[];
  heralds: number;
  towers: number;
};

export type LiveMatchChampionSummary = Pick<
  Champion,
  "dataDragonId" | "iconUrl" | "id" | "name"
>;

export type LiveMatchItemSlot = MatchItem | null;

export type LiveMatchPlayerStats = {
  assists: number;
  deaths: number;
  gold: string;
  itemSlots: LiveMatchItemSlot[];
  kills: number;
  level: number;
};

export type LiveMatchPlayerPresentation = {
  champion: LiveMatchChampionSummary;
  name: string;
  portraitUrl?: string;
  role: Role;
  stats: LiveMatchPlayerStats;
};

export type LiveMatchTeamPresentation = {
  gold: string;
  id: string;
  kills: number;
  name: string;
  objectives: LiveMatchObjectiveSnapshot;
  players: LiveMatchPlayerPresentation[];
  shortName: string;
};

export type LiveMatchFearlessRow = {
  champions: LiveMatchChampionSummary[];
  label: string;
};

export type LiveMatchDraftPresentation = {
  blueBans: LiveMatchChampionSummary[];
  fearlessRows: LiveMatchFearlessRow[];
  redBans: LiveMatchChampionSummary[];
};

export type LiveMatchTimelineEvent = {
  advantage: LiveMatchEventAdvantage;
  body: string;
  importance: LiveMatchImportance;
  time: string;
  title: string;
  type: LiveMatchTimelineEventType;
};

export type LiveMatchSetPresentation = {
  blueTeam: LiveMatchTeamPresentation;
  draft: LiveMatchDraftPresentation;
  gameNumber: number;
  gameTime: string;
  redTeam: LiveMatchTeamPresentation;
  stageName: string;
  timeline: GeneratedMatchTimeline;
  timelineEvents: LiveMatchTimelineEvent[];
};

export type LiveMatchPresentation = {
  // currentSet mirrors sets[0]; the prototype swaps in the live current set as it
  // advances through a BO3/BO5. Narration is derived per set from its own teams
  // (champions differ per set), so it is not stored here.
  currentSet: LiveMatchSetPresentation;
  formatLabel: string;
  id: string;
  sets: LiveMatchSetPresentation[];
  stageName: string;
};
