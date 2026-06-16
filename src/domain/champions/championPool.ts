import { getChampionIconUrl } from "../riot-data-dragon";
import type { Role } from "../../types/game";
import type { Champion, ChampionArchetype } from "./championTypes";

type ChampionPowerProfile = Pick<
  Champion,
  | "engagePower"
  | "lanePower"
  | "pokePower"
  | "scalingPower"
  | "teamfightPower"
>;

type ChampionProfileKey = keyof typeof powerProfiles;

type ChampionSeed = {
  archetypes: ChampionArchetype[];
  counterTags: string[];
  dataDragonId: string;
  difficulty: number;
  id: string;
  metaScore: number;
  name: string;
  profile: ChampionProfileKey;
  roles: Role[];
  synergyTags: string[];
};

const powerProfiles = {
  assassin: { engagePower: 70, lanePower: 76, pokePower: 58, scalingPower: 70, teamfightPower: 68 },
  bruiser: { engagePower: 66, lanePower: 80, pokePower: 28, scalingPower: 72, teamfightPower: 78 },
  controlMage: { engagePower: 55, lanePower: 72, pokePower: 76, scalingPower: 84, teamfightPower: 86 },
  duelist: { engagePower: 54, lanePower: 84, pokePower: 32, scalingPower: 78, teamfightPower: 68 },
  engageSupport: { engagePower: 90, lanePower: 72, pokePower: 14, scalingPower: 68, teamfightPower: 84 },
  enchanter: { engagePower: 18, lanePower: 62, pokePower: 56, scalingPower: 82, teamfightPower: 76 },
  frontline: { engagePower: 84, lanePower: 66, pokePower: 18, scalingPower: 72, teamfightPower: 86 },
  globalUtility: { engagePower: 58, lanePower: 70, pokePower: 70, scalingPower: 76, teamfightPower: 76 },
  jungleCarry: { engagePower: 44, lanePower: 30, pokePower: 82, scalingPower: 72, teamfightPower: 68 },
  laneBullyMarksman: { engagePower: 50, lanePower: 82, pokePower: 76, scalingPower: 70, teamfightPower: 76 },
  marksmanCarry: { engagePower: 22, lanePower: 70, pokePower: 58, scalingPower: 88, teamfightPower: 86 },
  pokeCarry: { engagePower: 35, lanePower: 76, pokePower: 90, scalingPower: 80, teamfightPower: 76 },
  skirmisher: { engagePower: 76, lanePower: 68, pokePower: 24, scalingPower: 64, teamfightPower: 72 },
  utilitySupport: { engagePower: 62, lanePower: 66, pokePower: 62, scalingPower: 74, teamfightPower: 80 },
} satisfies Record<string, ChampionPowerProfile>;

const championSeeds: ChampionSeed[] = [
  { id: "aatrox", name: "Aatrox", dataDragonId: "Aatrox", roles: ["top"], profile: "bruiser", archetypes: ["blind-pick", "frontline", "teamfight", "carry"], difficulty: 74, metaScore: 76, synergyTags: ["front-to-back", "bruiser"], counterTags: ["range-top", "anti-heal"] },
  { id: "ksante", name: "K'Sante", dataDragonId: "KSante", roles: ["top"], profile: "frontline", archetypes: ["blind-pick", "frontline", "utility"], difficulty: 82, metaScore: 80, synergyTags: ["front-to-back", "peel"], counterTags: ["range-top", "side-lane-pressure"] },
  { id: "rumble", name: "Rumble", dataDragonId: "Rumble", roles: ["top", "mid"], profile: "controlMage", archetypes: ["lane-bully", "teamfight", "poke"], difficulty: 70, metaScore: 73, synergyTags: ["wombo-combo", "magic-damage"], counterTags: ["long-range", "disengage"] },
  { id: "gnar", name: "Gnar", dataDragonId: "Gnar", roles: ["top"], profile: "bruiser", archetypes: ["blind-pick", "teamfight", "split-push"], difficulty: 76, metaScore: 70, synergyTags: ["side-lane", "engage-window"], counterTags: ["hard-engage", "burst"] },
  { id: "renekton", name: "Renekton", dataDragonId: "Renekton", roles: ["top"], profile: "bruiser", archetypes: ["lane-bully", "dive", "skirmish"], difficulty: 60, metaScore: 67, synergyTags: ["early-game", "dive"], counterTags: ["scaling-frontline", "range-top"] },
  { id: "jax", name: "Jax", dataDragonId: "Jax", roles: ["top"], profile: "duelist", archetypes: ["split-push", "scaling", "carry"], difficulty: 68, metaScore: 71, synergyTags: ["side-lane", "late-game"], counterTags: ["lane-bully", "hard-cc"] },
  { id: "camille", name: "Camille", dataDragonId: "Camille", roles: ["top"], profile: "duelist", archetypes: ["pick", "dive", "split-push"], difficulty: 80, metaScore: 72, synergyTags: ["lockdown", "side-lane"], counterTags: ["waveclear", "anti-dive"] },
  { id: "ornn", name: "Ornn", dataDragonId: "Ornn", roles: ["top"], profile: "frontline", archetypes: ["frontline", "engage", "teamfight"], difficulty: 58, metaScore: 74, synergyTags: ["front-to-back", "scaling-frontline"], counterTags: ["anti-tank", "side-lane-pressure"] },
  { id: "sion", name: "Sion", dataDragonId: "Sion", roles: ["top"], profile: "frontline", archetypes: ["frontline", "split-push", "engage"], difficulty: 52, metaScore: 66, synergyTags: ["frontline", "side-lane"], counterTags: ["anti-tank", "mobility"] },
  { id: "gwen", name: "Gwen", dataDragonId: "Gwen", roles: ["top"], profile: "duelist", archetypes: ["scaling", "carry", "skirmish"], difficulty: 76, metaScore: 70, synergyTags: ["magic-damage", "side-lane"], counterTags: ["range-top", "early-pressure"] },
  { id: "jayce", name: "Jayce", dataDragonId: "Jayce", roles: ["top", "mid"], profile: "pokeCarry", archetypes: ["poke", "lane-bully", "carry"], difficulty: 78, metaScore: 72, synergyTags: ["poke", "lane-priority"], counterTags: ["hard-engage", "dive"] },
  { id: "kennen", name: "Kennen", dataDragonId: "Kennen", roles: ["top"], profile: "controlMage", archetypes: ["teamfight", "lane-bully", "engage"], difficulty: 72, metaScore: 69, synergyTags: ["flank", "wombo-combo"], counterTags: ["long-range", "disengage"] },
  { id: "gragas", name: "Gragas", dataDragonId: "Gragas", roles: ["top", "jungle"], profile: "frontline", archetypes: ["frontline", "engage", "utility"], difficulty: 74, metaScore: 73, synergyTags: ["disengage", "pick"], counterTags: ["poke", "anti-tank"] },
  { id: "gangplank", name: "Gangplank", dataDragonId: "Gangplank", roles: ["top"], profile: "pokeCarry", archetypes: ["scaling", "poke", "split-push"], difficulty: 86, metaScore: 66, synergyTags: ["global", "late-game"], counterTags: ["hard-engage", "early-gank"] },
  { id: "fiora", name: "Fiora", dataDragonId: "Fiora", roles: ["top"], profile: "duelist", archetypes: ["split-push", "carry", "skirmish"], difficulty: 82, metaScore: 67, synergyTags: ["side-lane", "duel"], counterTags: ["hard-cc", "range-top"] },
  { id: "poppy", name: "Poppy", dataDragonId: "Poppy", roles: ["top", "jungle", "support"], profile: "frontline", archetypes: ["frontline", "utility", "engage"], difficulty: 62, metaScore: 71, synergyTags: ["anti-dash", "peel"], counterTags: ["poke", "anti-tank"] },
  { id: "aurora", name: "Aurora", dataDragonId: "Aurora", roles: ["top", "mid"], profile: "controlMage", archetypes: ["pick", "skirmish", "teamfight"], difficulty: 78, metaScore: 74, synergyTags: ["skirmish", "magic-damage"], counterTags: ["long-range", "hard-engage"] },
  { id: "vi", name: "Vi", dataDragonId: "Vi", roles: ["jungle"], profile: "skirmisher", archetypes: ["engage", "pick", "dive"], difficulty: 58, metaScore: 75, synergyTags: ["lockdown", "dive"], counterTags: ["disengage", "cleanse"] },
  { id: "sejuani", name: "Sejuani", dataDragonId: "Sejuani", roles: ["jungle"], profile: "frontline", archetypes: ["frontline", "engage", "utility"], difficulty: 56, metaScore: 72, synergyTags: ["melee-synergy", "front-to-back"], counterTags: ["anti-tank", "poke"] },
  { id: "lee-sin", name: "Lee Sin", dataDragonId: "LeeSin", roles: ["jungle"], profile: "skirmisher", archetypes: ["skirmish", "dive", "pick"], difficulty: 88, metaScore: 69, synergyTags: ["early-game", "playmaking"], counterTags: ["scaling-jungle", "point-click-cc"] },
  { id: "maokai", name: "Maokai", dataDragonId: "Maokai", roles: ["jungle", "support"], profile: "frontline", archetypes: ["frontline", "engage", "utility"], difficulty: 52, metaScore: 74, synergyTags: ["vision-control", "front-to-back"], counterTags: ["anti-tank", "high-dps"] },
  { id: "nidalee", name: "Nidalee", dataDragonId: "Nidalee", roles: ["jungle"], profile: "jungleCarry", archetypes: ["poke", "skirmish", "carry"], difficulty: 86, metaScore: 65, synergyTags: ["early-game", "poke"], counterTags: ["hard-engage", "frontline"] },
  { id: "taliyah", name: "Taliyah", dataDragonId: "Taliyah", roles: ["mid", "jungle"], profile: "globalUtility", archetypes: ["global", "pick", "utility"], difficulty: 78, metaScore: 72, synergyTags: ["map-control", "pick"], counterTags: ["hard-dive", "burst"] },
  { id: "rell", name: "Rell", dataDragonId: "Rell", roles: ["support", "jungle"], profile: "engageSupport", archetypes: ["engage", "frontline", "teamfight"], difficulty: 66, metaScore: 72, synergyTags: ["wombo-combo", "frontline"], counterTags: ["disengage", "poke"] },
  { id: "xin-zhao", name: "Xin Zhao", dataDragonId: "XinZhao", roles: ["jungle"], profile: "skirmisher", archetypes: ["skirmish", "dive", "engage"], difficulty: 56, metaScore: 68, synergyTags: ["early-game", "dive"], counterTags: ["disengage", "scaling-jungle"] },
  { id: "jarvan-iv", name: "Jarvan IV", dataDragonId: "JarvanIV", roles: ["jungle"], profile: "skirmisher", archetypes: ["engage", "dive", "frontline"], difficulty: 60, metaScore: 72, synergyTags: ["wombo-combo", "dive"], counterTags: ["disengage", "counter-engage"] },
  { id: "viego", name: "Viego", dataDragonId: "Viego", roles: ["jungle"], profile: "skirmisher", archetypes: ["skirmish", "carry", "dive"], difficulty: 74, metaScore: 70, synergyTags: ["reset", "skirmish"], counterTags: ["hard-cc", "burst"] },
  { id: "wukong", name: "Wukong", dataDragonId: "MonkeyKing", roles: ["jungle", "top"], profile: "bruiser", archetypes: ["teamfight", "engage", "skirmish"], difficulty: 64, metaScore: 68, synergyTags: ["wombo-combo", "dive"], counterTags: ["disengage", "range"] },
  { id: "skarner", name: "Skarner", dataDragonId: "Skarner", roles: ["jungle"], profile: "frontline", archetypes: ["frontline", "pick", "utility"], difficulty: 62, metaScore: 70, synergyTags: ["pick", "frontline"], counterTags: ["kite", "poke"] },
  { id: "nocturne", name: "Nocturne", dataDragonId: "Nocturne", roles: ["jungle"], profile: "skirmisher", archetypes: ["dive", "pick", "skirmish"], difficulty: 60, metaScore: 69, synergyTags: ["global", "dive"], counterTags: ["stopwatch", "frontline"] },
  { id: "kindred", name: "Kindred", dataDragonId: "Kindred", roles: ["jungle"], profile: "jungleCarry", archetypes: ["carry", "scaling", "skirmish"], difficulty: 82, metaScore: 67, synergyTags: ["marksman-jungle", "scaling"], counterTags: ["hard-engage", "burst"] },
  { id: "elise", name: "Elise", dataDragonId: "Elise", roles: ["jungle"], profile: "jungleCarry", archetypes: ["lane-bully", "dive", "pick"], difficulty: 78, metaScore: 66, synergyTags: ["early-game", "dive"], counterTags: ["frontline", "scaling"] },
  { id: "diana", name: "Diana", dataDragonId: "Diana", roles: ["jungle", "mid"], profile: "skirmisher", archetypes: ["dive", "teamfight", "carry"], difficulty: 66, metaScore: 68, synergyTags: ["wombo-combo", "magic-damage"], counterTags: ["disengage", "hard-cc"] },
  { id: "graves", name: "Graves", dataDragonId: "Graves", roles: ["jungle"], profile: "jungleCarry", archetypes: ["skirmish", "carry", "lane-bully"], difficulty: 72, metaScore: 67, synergyTags: ["early-game", "marksman-jungle"], counterTags: ["hard-cc", "frontline"] },
  { id: "azir", name: "Azir", dataDragonId: "Azir", roles: ["mid"], profile: "controlMage", archetypes: ["scaling", "teamfight", "carry"], difficulty: 90, metaScore: 79, synergyTags: ["front-to-back", "late-game"], counterTags: ["dive", "long-range-pick"] },
  { id: "orianna", name: "Orianna", dataDragonId: "Orianna", roles: ["mid"], profile: "controlMage", archetypes: ["teamfight", "utility", "scaling"], difficulty: 74, metaScore: 78, synergyTags: ["ball-delivery", "front-to-back"], counterTags: ["assassin", "long-range"] },
  { id: "ahri", name: "Ahri", dataDragonId: "Ahri", roles: ["mid"], profile: "assassin", archetypes: ["pick", "skirmish", "utility"], difficulty: 68, metaScore: 74, synergyTags: ["pick", "roam"], counterTags: ["frontline", "cleanse"] },
  { id: "corki", name: "Corki", dataDragonId: "Corki", roles: ["mid"], profile: "pokeCarry", archetypes: ["poke", "scaling", "carry"], difficulty: 64, metaScore: 71, synergyTags: ["poke", "late-game"], counterTags: ["hard-engage", "dive"] },
  { id: "syndra", name: "Syndra", dataDragonId: "Syndra", roles: ["mid"], profile: "controlMage", archetypes: ["lane-bully", "pick", "scaling"], difficulty: 72, metaScore: 72, synergyTags: ["pick", "burst"], counterTags: ["dive", "long-range"] },
  { id: "leblanc", name: "LeBlanc", dataDragonId: "Leblanc", roles: ["mid"], profile: "assassin", archetypes: ["pick", "skirmish", "dive"], difficulty: 84, metaScore: 70, synergyTags: ["pick", "side-lane"], counterTags: ["point-click-cc", "waveclear"] },
  { id: "sylas", name: "Sylas", dataDragonId: "Sylas", roles: ["mid"], profile: "skirmisher", archetypes: ["skirmish", "dive", "carry"], difficulty: 76, metaScore: 72, synergyTags: ["skirmish", "playmaking"], counterTags: ["anti-heal", "range"] },
  { id: "akali", name: "Akali", dataDragonId: "Akali", roles: ["mid", "top"], profile: "assassin", archetypes: ["dive", "skirmish", "carry"], difficulty: 86, metaScore: 69, synergyTags: ["flank", "side-lane"], counterTags: ["point-click-cc", "frontline"] },
  { id: "yone", name: "Yone", dataDragonId: "Yone", roles: ["mid", "top"], profile: "duelist", archetypes: ["carry", "skirmish", "teamfight"], difficulty: 78, metaScore: 70, synergyTags: ["dive", "late-game"], counterTags: ["hard-cc", "lane-bully"] },
  { id: "tristana", name: "Tristana", dataDragonId: "Tristana", roles: ["bot", "mid"], profile: "laneBullyMarksman", archetypes: ["lane-bully", "carry", "scaling"], difficulty: 64, metaScore: 68, synergyTags: ["lane-priority", "tower-pressure"], counterTags: ["hard-engage", "gank-pressure"] },
  { id: "viktor", name: "Viktor", dataDragonId: "Viktor", roles: ["mid"], profile: "controlMage", archetypes: ["scaling", "teamfight", "poke"], difficulty: 74, metaScore: 71, synergyTags: ["zone-control", "late-game"], counterTags: ["dive", "early-pressure"] },
  { id: "annie", name: "Annie", dataDragonId: "Annie", roles: ["mid"], profile: "controlMage", archetypes: ["pick", "teamfight", "utility"], difficulty: 48, metaScore: 66, synergyTags: ["flash-engage", "pick"], counterTags: ["long-range", "cleanse"] },
  { id: "galio", name: "Galio", dataDragonId: "Galio", roles: ["mid"], profile: "globalUtility", archetypes: ["global", "frontline", "utility"], difficulty: 58, metaScore: 67, synergyTags: ["global", "dive"], counterTags: ["poke", "scaling-control"] },
  { id: "twisted-fate", name: "Twisted Fate", dataDragonId: "TwistedFate", roles: ["mid"], profile: "globalUtility", archetypes: ["global", "pick", "utility"], difficulty: 70, metaScore: 66, synergyTags: ["global", "pick"], counterTags: ["lane-bully", "hard-engage"] },
  { id: "jinx", name: "Jinx", dataDragonId: "Jinx", roles: ["bot"], profile: "marksmanCarry", archetypes: ["scaling", "teamfight", "carry"], difficulty: 62, metaScore: 78, synergyTags: ["front-to-back", "reset"], counterTags: ["dive", "assassin"] },
  { id: "zeri", name: "Zeri", dataDragonId: "Zeri", roles: ["bot"], profile: "marksmanCarry", archetypes: ["scaling", "carry", "skirmish"], difficulty: 84, metaScore: 72, synergyTags: ["enchanter", "late-game"], counterTags: ["point-click-cc", "hard-engage"] },
  { id: "kalista", name: "Kalista", dataDragonId: "Kalista", roles: ["bot"], profile: "laneBullyMarksman", archetypes: ["lane-bully", "skirmish", "engage"], difficulty: 82, metaScore: 70, synergyTags: ["early-game", "support-engage"], counterTags: ["range-scaling", "point-click-cc"] },
  { id: "xayah", name: "Xayah", dataDragonId: "Xayah", roles: ["bot"], profile: "marksmanCarry", archetypes: ["teamfight", "carry", "utility"], difficulty: 70, metaScore: 74, synergyTags: ["self-peel", "rakan"], counterTags: ["long-range", "poke"] },
  { id: "varus", name: "Varus", dataDragonId: "Varus", roles: ["bot"], profile: "laneBullyMarksman", archetypes: ["poke", "lane-bully", "utility"], difficulty: 68, metaScore: 75, synergyTags: ["poke", "pick"], counterTags: ["hard-engage", "dive"] },
  { id: "ezreal", name: "Ezreal", dataDragonId: "Ezreal", roles: ["bot"], profile: "pokeCarry", archetypes: ["poke", "scaling", "carry"], difficulty: 74, metaScore: 73, synergyTags: ["poke", "safe-lane"], counterTags: ["hard-engage", "frontline"] },
  { id: "kaisa", name: "Kai'Sa", dataDragonId: "Kaisa", roles: ["bot"], profile: "marksmanCarry", archetypes: ["scaling", "carry", "dive"], difficulty: 72, metaScore: 74, synergyTags: ["dive", "hybrid-damage"], counterTags: ["lane-bully", "hard-cc"] },
  { id: "aphelios", name: "Aphelios", dataDragonId: "Aphelios", roles: ["bot"], profile: "marksmanCarry", archetypes: ["scaling", "carry", "teamfight"], difficulty: 92, metaScore: 70, synergyTags: ["front-to-back", "late-game"], counterTags: ["dive", "early-pressure"] },
  { id: "caitlyn", name: "Caitlyn", dataDragonId: "Caitlyn", roles: ["bot"], profile: "laneBullyMarksman", archetypes: ["lane-bully", "poke", "carry"], difficulty: 66, metaScore: 71, synergyTags: ["lane-priority", "siege"], counterTags: ["hard-engage", "all-in"] },
  { id: "ashe", name: "Ashe", dataDragonId: "Ashe", roles: ["bot", "support"], profile: "laneBullyMarksman", archetypes: ["utility", "poke", "teamfight"], difficulty: 54, metaScore: 70, synergyTags: ["pick", "vision-control"], counterTags: ["dive", "burst"] },
  { id: "lucian", name: "Lucian", dataDragonId: "Lucian", roles: ["bot"], profile: "laneBullyMarksman", archetypes: ["lane-bully", "skirmish", "carry"], difficulty: 68, metaScore: 69, synergyTags: ["early-game", "dash"], counterTags: ["range-scaling", "hard-cc"] },
  { id: "sivir", name: "Sivir", dataDragonId: "Sivir", roles: ["bot"], profile: "marksmanCarry", archetypes: ["teamfight", "scaling", "utility"], difficulty: 56, metaScore: 66, synergyTags: ["waveclear", "front-to-back"], counterTags: ["dive", "assassin"] },
  { id: "miss-fortune", name: "Miss Fortune", dataDragonId: "MissFortune", roles: ["bot"], profile: "laneBullyMarksman", archetypes: ["lane-bully", "teamfight", "poke"], difficulty: 50, metaScore: 67, synergyTags: ["wombo-combo", "lane-priority"], counterTags: ["dive", "range"] },
  { id: "draven", name: "Draven", dataDragonId: "Draven", roles: ["bot"], profile: "laneBullyMarksman", archetypes: ["lane-bully", "carry", "skirmish"], difficulty: 82, metaScore: 66, synergyTags: ["early-game", "snowball"], counterTags: ["hard-cc", "poke"] },
  { id: "smolder", name: "Smolder", dataDragonId: "Smolder", roles: ["bot"], profile: "marksmanCarry", archetypes: ["scaling", "poke", "carry"], difficulty: 58, metaScore: 68, synergyTags: ["late-game", "poke"], counterTags: ["early-pressure", "hard-engage"] },
  { id: "senna", name: "Senna", dataDragonId: "Senna", roles: ["bot", "support"], profile: "utilitySupport", archetypes: ["utility", "scaling", "poke"], difficulty: 70, metaScore: 67, synergyTags: ["scaling", "utility"], counterTags: ["hard-engage", "dive"] },
  { id: "rakan", name: "Rakan", dataDragonId: "Rakan", roles: ["support"], profile: "engageSupport", archetypes: ["engage", "utility", "skirmish"], difficulty: 74, metaScore: 77, synergyTags: ["xayah", "dive", "teamfight"], counterTags: ["point-click-cc", "disengage"] },
  { id: "nautilus", name: "Nautilus", dataDragonId: "Nautilus", roles: ["support"], profile: "engageSupport", archetypes: ["engage", "frontline", "pick"], difficulty: 50, metaScore: 73, synergyTags: ["pick", "dive"], counterTags: ["disengage", "poke"] },
  { id: "alistar", name: "Alistar", dataDragonId: "Alistar", roles: ["support"], profile: "engageSupport", archetypes: ["engage", "frontline", "utility"], difficulty: 58, metaScore: 68, synergyTags: ["dive", "peel"], counterTags: ["enchanter", "poke"] },
  { id: "lulu", name: "Lulu", dataDragonId: "Lulu", roles: ["support"], profile: "enchanter", archetypes: ["enchanter", "utility", "scaling"], difficulty: 54, metaScore: 69, synergyTags: ["hyper-carry", "peel"], counterTags: ["hard-engage", "pick"] },
  { id: "leona", name: "Leona", dataDragonId: "Leona", roles: ["support"], profile: "engageSupport", archetypes: ["engage", "frontline", "dive"], difficulty: 50, metaScore: 70, synergyTags: ["dive", "pick"], counterTags: ["disengage", "poke"] },
  { id: "braum", name: "Braum", dataDragonId: "Braum", roles: ["support"], profile: "utilitySupport", archetypes: ["frontline", "utility", "teamfight"], difficulty: 56, metaScore: 66, synergyTags: ["peel", "front-to-back"], counterTags: ["poke", "enchanter"] },
  { id: "thresh", name: "Thresh", dataDragonId: "Thresh", roles: ["support"], profile: "utilitySupport", archetypes: ["pick", "utility", "engage"], difficulty: 86, metaScore: 70, synergyTags: ["pick", "lantern"], counterTags: ["poke", "cleanse"] },
  { id: "renata-glasc", name: "Renata Glasc", dataDragonId: "Renata", roles: ["support"], profile: "utilitySupport", archetypes: ["utility", "teamfight", "pick"], difficulty: 72, metaScore: 67, synergyTags: ["counter-engage", "hyper-carry"], counterTags: ["hard-engage", "poke"] },
  { id: "milio", name: "Milio", dataDragonId: "Milio", roles: ["support"], profile: "enchanter", archetypes: ["enchanter", "utility", "scaling"], difficulty: 52, metaScore: 68, synergyTags: ["range-buff", "peel"], counterTags: ["hard-engage", "burst"] },
  { id: "nami", name: "Nami", dataDragonId: "Nami", roles: ["support"], profile: "enchanter", archetypes: ["enchanter", "pick", "utility"], difficulty: 62, metaScore: 67, synergyTags: ["lane-priority", "poke"], counterTags: ["hard-engage", "burst"] },
  { id: "karma", name: "Karma", dataDragonId: "Karma", roles: ["support", "mid"], profile: "utilitySupport", archetypes: ["poke", "utility", "enchanter"], difficulty: 60, metaScore: 69, synergyTags: ["lane-priority", "poke"], counterTags: ["hard-engage", "dive"] },
  { id: "bard", name: "Bard", dataDragonId: "Bard", roles: ["support"], profile: "utilitySupport", archetypes: ["global", "pick", "utility"], difficulty: 84, metaScore: 66, synergyTags: ["roam", "pick"], counterTags: ["hard-engage", "range"] },
  { id: "pyke", name: "Pyke", dataDragonId: "Pyke", roles: ["support"], profile: "assassin", archetypes: ["pick", "dive", "skirmish"], difficulty: 78, metaScore: 65, synergyTags: ["roam", "snowball"], counterTags: ["frontline", "point-click-cc"] },
  { id: "blitzcrank", name: "Blitzcrank", dataDragonId: "Blitzcrank", roles: ["support"], profile: "engageSupport", archetypes: ["pick", "engage", "frontline"], difficulty: 58, metaScore: 66, synergyTags: ["pick", "lane-threat"], counterTags: ["minion-wave", "poke"] },
  { id: "yuumi", name: "Yuumi", dataDragonId: "Yuumi", roles: ["support"], profile: "enchanter", archetypes: ["enchanter", "scaling", "utility"], difficulty: 46, metaScore: 62, synergyTags: ["hyper-carry", "scaling"], counterTags: ["hard-engage", "lane-bully"] },
];

export const championPool: Champion[] = championSeeds.map((seed) => ({
  ...seed,
  ...powerProfiles[seed.profile],
  iconUrl: getChampionIconUrl(seed.dataDragonId),
}));

// A kill-hungry champion lands kills itself (dive / skirmish assassin) rather than
// merely setting them up. Used to exempt aggressive supports like Pyke from the
// live-match support kill down-weight.
export function isKillHungryChampion(championId: string): boolean {
  const champion = championPool.find((entry) => entry.id === championId);

  return Boolean(
    champion?.archetypes.some(
      (archetype) => archetype === "dive" || archetype === "skirmish",
    ),
  );
}
