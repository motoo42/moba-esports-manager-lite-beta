import type { Player, Role } from "../../types/game";

// Player detail attributes (#72). This is a presentation/derivation layer over the
// existing Player fields — it does NOT change the data model or the match-result
// calculation. The authored `player.overall` is the single anchor: the 12 skill
// attributes (technical + tactical + mental) are re-centered onto `overall` so the
// breakdown and the position overall can never diverge, while each player keeps the
// relative shape of their raw stats (texture) plus a small seeded jitter. Because
// the bars derive from `overall`, growth that raises `overall` pulls them along.
// The 4 temperament attributes stay independent (situational / personality): `ego`
// and `leadership` are wide-spread and skill-independent, `lateGame` / `aggression`
// derive from related stats. `potential` stays off the panel, shown only as 잠재.

export type PlayerAttributeKey =
  | "laning"
  | "mechanics"
  | "positioning"
  | "championPool"
  | "teamfight"
  | "macro"
  | "prediction"
  | "shotcalling"
  | "focus"
  | "mentalStrength"
  | "clutch"
  | "composure"
  | "lateGame"
  | "aggression"
  | "ego"
  | "leadership";

export const playerAttributeLabels: Record<PlayerAttributeKey, string> = {
  laning: "라인전",
  mechanics: "메카닉",
  positioning: "포지셔닝",
  championPool: "챔피언 폭",
  teamfight: "교전",
  macro: "운영",
  prediction: "예측력",
  shotcalling: "오더",
  focus: "집중력",
  mentalStrength: "정신력",
  clutch: "클러치",
  composure: "침착함",
  lateGame: "후반 캐리",
  aggression: "공격성",
  ego: "에고",
  leadership: "리더십",
};

// One-sentence, present-tense descriptions of what each attribute represents —
// shown as a hover tooltip on the attribute name. Kept short so the tooltip box
// stays small.
export const playerAttributeDescriptions: Record<PlayerAttributeKey, string> = {
  laning: "라인 단계에서 주도권을 잡고 초반 킬 압박에 영향을 줍니다.",
  mechanics: "스킬 사용과 교전 컨트롤의 정밀함을 좌우합니다.",
  positioning: "한타에서 안전한 위치 선정과 생존력에 영향을 줍니다.",
  championPool: "다룰 수 있는 챔피언의 폭과 밴픽 유연성을 결정합니다.",
  teamfight: "한타와 소규모 교전에서의 기여도를 좌우합니다.",
  macro: "맵 장악과 오브젝트 판단 등 거시 운영에 영향을 줍니다.",
  prediction: "적의 움직임과 다음 수를 미리 읽는 감각에 영향을 줍니다.",
  shotcalling: "팀의 콜과 교전 시점 결정에 영향을 줍니다.",
  focus: "경기 내내 일관된 수행력을 유지하는 데 영향을 줍니다.",
  mentalStrength: "압박 상황에서 흔들리지 않는 정신적 강함을 나타냅니다.",
  clutch: "박빙의 결정적 순간에 발휘하는 수행력을 좌우합니다.",
  composure: "위기와 손해 상황에서 평정을 유지하는 능력을 나타냅니다.",
  lateGame: "후반 한타에서 경기를 캐리하는 능력을 좌우합니다.",
  aggression: "공격적인 플레이와 적극적인 교전 성향에 영향을 줍니다.",
  ego: "자신의 판단과 플레이 방향을 강하게 밀고 나가려는 성향을 나타냅니다.",
  leadership: "팀을 이끌고 팀 내 영향력을 발휘하는 능력을 나타냅니다.",
};

export type PlayerAttributeGroup = {
  key: "technical" | "tactical" | "mental" | "temperament";
  attributes: PlayerAttributeKey[];
};

// Four FM-style clusters, separated by a divider in the panel (no visible label,
// matching the reference).
export const playerAttributeGroups: PlayerAttributeGroup[] = [
  { key: "technical", attributes: ["laning", "mechanics", "positioning", "championPool"] },
  { key: "tactical", attributes: ["teamfight", "macro", "prediction", "shotcalling"] },
  { key: "mental", attributes: ["focus", "mentalStrength", "clutch", "composure"] },
  { key: "temperament", attributes: ["lateGame", "aggression", "ego", "leadership"] },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Deterministic per-player offset in [-spread, +spread]. Lets a seeded attribute
// diverge from its parent stat without RNG, so the same player always reads the
// same value (and saves never need migrating).
function seededVariation(id: string, salt: string, spread: number) {
  const source = `${id}:${salt}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) | 0;
  }

  const unit = ((hash >>> 0) % 1000) / 1000;

  return (unit * 2 - 1) * spread;
}

// A deterministic, widely-spread rating for "soft" personality traits that do not
// track skill (ego, leadership). Summing two independent seeds gives a roughly
// triangular spread centered mid-range: most players land in the middle, but the
// gray (<50) and gold (90+) tails are reachable — including for top players.
function seededWideRating(id: string, salt: string) {
  return (
    66 + seededVariation(id, `${salt}-a`, 18) + seededVariation(id, `${salt}-b`, 16)
  );
}

// The 12 skill attributes that get re-anchored onto `overall` (technical +
// tactical + mental groups). The 4 temperament attributes are handled separately.
const skillAttributeKeys = [
  "laning",
  "mechanics",
  "positioning",
  "championPool",
  "teamfight",
  "macro",
  "prediction",
  "shotcalling",
  "focus",
  "mentalStrength",
  "clutch",
  "composure",
] as const;

type SkillAttributeKey = (typeof skillAttributeKeys)[number];

// How much of a player's raw stat spread survives re-anchoring. <1 keeps the shape
// (strengths stay strengths, weaknesses stay weaknesses) while pulling the average
// onto `overall`. The seeded jitter then nudges each bar a little.
const skillTextureFactor = 0.7;
const skillJitterSpread = 2.5;

export function getPlayerAttributes(
  player: Player,
): Record<PlayerAttributeKey, number> {
  const score = (value: number) => clamp(Math.round(value), 1, 99);
  const overall = clamp(player.overall, 1, 99);

  // Raw skill values (pre-anchor): existing fields plus a few light derivations.
  const rawSkill: Record<SkillAttributeKey, number> = {
    laning: player.laning,
    mechanics: player.mechanics,
    positioning:
      player.teamfight * 0.55 +
      player.mechanics * 0.25 +
      player.mindset.consistency * 0.2,
    championPool: player.championPool,
    teamfight: player.teamfight,
    macro: player.macro,
    prediction: player.adaptability.metaAdaptability,
    shotcalling: player.mindset.communication,
    focus: player.mindset.consistency,
    mentalStrength: player.mental,
    clutch: player.mindset.clutch,
    composure: player.mindset.tiltControl,
  };

  const skillMean =
    skillAttributeKeys.reduce((sum, key) => sum + rawSkill[key], 0) /
    skillAttributeKeys.length;

  // Re-center each skill on `overall`, keeping its deviation from the player's own
  // skill mean (texture), plus a small seeded jitter whose seed includes `overall`
  // — so as the player grows the breakdown re-distributes organically rather than
  // shifting perfectly flat.
  const anchor = (key: SkillAttributeKey) =>
    score(
      overall +
        (rawSkill[key] - skillMean) * skillTextureFactor +
        seededVariation(
          player.id,
          `anchor-${key}-${Math.round(overall)}`,
          skillJitterSpread,
        ),
    );

  return {
    laning: anchor("laning"),
    mechanics: anchor("mechanics"),
    positioning: anchor("positioning"),
    championPool: anchor("championPool"),
    teamfight: anchor("teamfight"),
    macro: anchor("macro"),
    prediction: anchor("prediction"),
    shotcalling: anchor("shotcalling"),
    focus: anchor("focus"),
    mentalStrength: anchor("mentalStrength"),
    clutch: anchor("clutch"),
    composure: anchor("composure"),
    // Temperament stays independent of `overall`.
    lateGame: score(
      player.teamfight * 0.45 +
        player.mechanics * 0.3 +
        player.mindset.clutch * 0.25 +
        seededVariation(player.id, "lateGame", 7),
    ),
    aggression: score(
      player.mechanics * 0.4 +
        player.teamfight * 0.35 +
        (100 - player.mindset.tiltControl) * 0.25 +
        seededVariation(player.id, "aggression", 10),
    ),
    ego: score(seededWideRating(player.id, "ego")),
    leadership: score(seededWideRating(player.id, "leadership")),
  };
}

// The authored `overall` IS the position overall — the detailed bars are derived to
// match it (see getPlayerAttributes), so the two never diverge and growth flows
// straight through. A player rated in a role other than their own reads below their
// primary number (a touch for a known secondary role, more for a foreign one).
const secondaryRolePenalty = 4;
const offRolePenalty = 9;

export function computeRoleOverall(
  player: Player,
  role: Role = player.role,
): number {
  const overall = clamp(Math.round(player.overall), 1, 99);

  if (role === player.role) {
    return overall;
  }

  const penalty = player.secondaryRoles.includes(role)
    ? secondaryRolePenalty
    : offRolePenalty;

  return clamp(overall - penalty, 1, 99);
}

export type PlayerAttributeTier =
  | "worldclass"
  | "elite"
  | "high"
  | "mid"
  | "low"
  | "weak";

// Six grade bands calibrated to where pro / semi-pro ratings actually sit (most
// values cluster in 50-95), so the dense range gets real color separation rather
// than collapsing into two tiers. Bands follow the #72 grade scale: 90+ 월드클래스,
// 80s 리그 상위권, 70s 좋은 선수, 60s 리그 평균권, 50s 보통 이하, <50 약점.
export function getAttributeTier(value: number): PlayerAttributeTier {
  if (value >= 90) {
    return "worldclass";
  }

  if (value >= 80) {
    return "elite";
  }

  if (value >= 70) {
    return "high";
  }

  if (value >= 60) {
    return "mid";
  }

  if (value >= 50) {
    return "low";
  }

  return "weak";
}
