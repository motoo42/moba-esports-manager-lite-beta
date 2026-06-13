import type { Player } from "../types/game";

export type PlayerPortraitMeta = {
  portraitUrl: string;
  portraitSourceUrl: string;
  sourceImageFileName: string;
  sourcePageUrl: string;
  retrievedAt: string;
  verificationStatus: "verified-current" | "temporary-current-candidate";
};

type PlayerPortraitSource = {
  teamName: string;
  playerName: string;
  sourcePageTitle: string;
  sourceImageFileName: string;
};

const portraitSources: PlayerPortraitSource[] = [
  {
    teamName: "Gen.G",
    playerName: "Kiin",
    sourcePageTitle: "Kiin",
    sourceImageFileName: "GEN_Kiin_2026_Split_1.png",
  },
  {
    teamName: "Gen.G",
    playerName: "Canyon",
    sourcePageTitle: "Canyon",
    sourceImageFileName: "GEN_Canyon_2026_Split_1.png",
  },
  {
    teamName: "Gen.G",
    playerName: "Chovy",
    sourcePageTitle: "Chovy",
    sourceImageFileName: "GEN_Chovy_2026_Split_1.png",
  },
  {
    teamName: "Gen.G",
    playerName: "Ruler",
    sourcePageTitle: "Ruler",
    sourceImageFileName: "GEN_Ruler_2026_Split_1.png",
  },
  {
    teamName: "Gen.G",
    playerName: "Duro",
    sourcePageTitle: "Duro",
    sourceImageFileName: "GEN_Duro_2026_Split_1.png",
  },
  {
    teamName: "Hanwha Life Esports",
    playerName: "Zeus",
    sourcePageTitle: "Zeus",
    sourceImageFileName: "HLE_Zeus_2026_Split_1.png",
  },
  {
    teamName: "Hanwha Life Esports",
    playerName: "Kanavi",
    sourcePageTitle: "Kanavi",
    sourceImageFileName: "HLE_Kanavi_2026_Split_1.png",
  },
  {
    teamName: "Hanwha Life Esports",
    playerName: "Zeka",
    sourcePageTitle: "Zeka (Kim Geon-woo)",
    sourceImageFileName: "HLE_Zeka_2026_Split_1.png",
  },
  {
    teamName: "Hanwha Life Esports",
    playerName: "Gumayusi",
    sourcePageTitle: "Gumayusi",
    sourceImageFileName: "HLE_Gumayusi_2026_Split_1.png",
  },
  {
    teamName: "Hanwha Life Esports",
    playerName: "Delight",
    sourcePageTitle: "Delight",
    sourceImageFileName: "HLE_Delight_2026_Split_1.png",
  },
  {
    teamName: "Hanwha Life Esports",
    playerName: "Bluffing",
    sourcePageTitle: "Bluffing",
    sourceImageFileName: "HLE.C_Bluffing_2026_Split_1.png",
  },
  {
    teamName: "T1",
    playerName: "Doran",
    sourcePageTitle: "Doran (Choi Hyeon-joon)",
    sourceImageFileName: "T1_Doran_2026_LCK_Cup.png",
  },
  {
    teamName: "T1",
    playerName: "Oner",
    sourcePageTitle: "Oner",
    sourceImageFileName: "T1_Oner_2026_LCK_Cup.png",
  },
  {
    teamName: "T1",
    playerName: "Faker",
    sourcePageTitle: "Faker",
    sourceImageFileName: "T1_Faker_2026_LCK_Cup.png",
  },
  {
    teamName: "T1",
    playerName: "Peyz",
    sourcePageTitle: "Peyz",
    sourceImageFileName: "T1_Peyz_2026_LCK_Cup.png",
  },
  {
    teamName: "T1",
    playerName: "Keria",
    sourcePageTitle: "Keria",
    sourceImageFileName: "T1_Keria_2026_LCK_Cup.png",
  },
  {
    teamName: "KT Rolster",
    playerName: "PerfecT",
    sourcePageTitle: "PerfecT (Lee Seung-min)",
    sourceImageFileName: "KT_PerfecT_2026_Split_1.png",
  },
  {
    teamName: "KT Rolster",
    playerName: "Cuzz",
    sourcePageTitle: "Cuzz",
    sourceImageFileName: "KT_Cuzz_2026_Split_1.png",
  },
  {
    teamName: "KT Rolster",
    playerName: "Bdd",
    sourcePageTitle: "Bdd",
    sourceImageFileName: "KT_Bdd_2026_Split_1.png",
  },
  {
    teamName: "KT Rolster",
    playerName: "Aiming",
    sourcePageTitle: "Aiming",
    sourceImageFileName: "KT_Aiming_2026_Split_1.png",
  },
  {
    teamName: "KT Rolster",
    playerName: "FenRir",
    sourcePageTitle: "FenRir (Park Kang-jun)",
    sourceImageFileName: "KT.C_FenRir_2026_Split_1.png",
  },
  {
    teamName: "KT Rolster",
    playerName: "Effort",
    sourcePageTitle: "Effort",
    sourceImageFileName: "KT.C_Effort_2026_Split_1.png",
  },
  {
    teamName: "Dplus KIA",
    playerName: "Siwoo",
    sourcePageTitle: "Siwoo",
    sourceImageFileName: "DK_Siwoo_2026_Split_1.png",
  },
  {
    teamName: "Dplus KIA",
    playerName: "Lucid",
    sourcePageTitle: "Lucid (Choi Yong-hyeok)",
    sourceImageFileName: "DK_Lucid_2026_Split_1.png",
  },
  {
    teamName: "Dplus KIA",
    playerName: "ShowMaker",
    sourcePageTitle: "ShowMaker",
    sourceImageFileName: "DK_ShowMaker_2026_Split_1.png",
  },
  {
    teamName: "Dplus KIA",
    playerName: "Smash",
    sourcePageTitle: "Smash (Shin Geum-jae)",
    sourceImageFileName: "DK_Smash_2026_Split_1.png",
  },
  {
    teamName: "Dplus KIA",
    playerName: "Career",
    sourcePageTitle: "Career",
    sourceImageFileName: "DK_Career_2026_Split_1.png",
  },
  {
    teamName: "Hanjin BRION",
    playerName: "Casting",
    sourcePageTitle: "Casting",
    sourceImageFileName: "BRO_Casting_2026_Split_1.png",
  },
  {
    teamName: "Hanjin BRION",
    playerName: "Gideon",
    sourcePageTitle: "GIDEON",
    sourceImageFileName: "BRO_GIDEON_2026_Split_1.png",
  },
  {
    teamName: "Hanjin BRION",
    playerName: "Loki",
    sourcePageTitle: "Loki (Lee Sang-min)",
    sourceImageFileName: "C9_Loki_2025_Split_1.png",
  },
  {
    teamName: "Hanjin BRION",
    playerName: "Roamer",
    sourcePageTitle: "Roamer",
    sourceImageFileName: "BRO_Roamer_2026_Split_1.png",
  },
  {
    teamName: "Hanjin BRION",
    playerName: "Teddy",
    sourcePageTitle: "Teddy",
    sourceImageFileName: "BRO_Teddy_2026_Split_1.png",
  },
  {
    teamName: "Hanjin BRION",
    playerName: "Namgung",
    sourcePageTitle: "Namgung",
    sourceImageFileName: "BRO_Namgung_2026_Split_1.png",
  },
  {
    teamName: "BNK FEARX",
    playerName: "Clear",
    sourcePageTitle: "Clear (Song Hyeon-min)",
    sourceImageFileName: "BFX_Clear_2026_Split_1.png",
  },
  {
    teamName: "BNK FEARX",
    playerName: "Raptor",
    sourcePageTitle: "Raptor (Jeon Eo-jin)",
    sourceImageFileName: "BFX_Raptor_2026_Split_1.png",
  },
  {
    teamName: "BNK FEARX",
    playerName: "VicLa",
    sourcePageTitle: "VicLa",
    sourceImageFileName: "BFX_VicLa_2026_Split_1.png",
  },
  {
    teamName: "BNK FEARX",
    playerName: "Daystar",
    sourcePageTitle: "Daystar",
    sourceImageFileName: "BFX_Daystar_2026_Split_1.png",
  },
  {
    teamName: "BNK FEARX",
    playerName: "Diable",
    sourcePageTitle: "Diable",
    sourceImageFileName: "BFX_Diable_2026_Split_1.png",
  },
  {
    teamName: "BNK FEARX",
    playerName: "Kellin",
    sourcePageTitle: "Kellin",
    sourceImageFileName: "BFX_Kellin_2026_Split_1.png",
  },
  {
    teamName: "Nongshim RedForce",
    playerName: "Kingen",
    sourcePageTitle: "Kingen",
    sourceImageFileName: "NS_Kingen_2026_Split_1.png",
  },
  {
    teamName: "Nongshim RedForce",
    playerName: "Sponge",
    sourcePageTitle: "Sponge",
    sourceImageFileName: "NS_Sponge_2026_Split_1.png",
  },
  {
    teamName: "Nongshim RedForce",
    playerName: "Scout",
    sourcePageTitle: "Scout",
    sourceImageFileName: "NS_Scout_2026_Split_1.png",
  },
  {
    teamName: "Nongshim RedForce",
    playerName: "Taeyoon",
    sourcePageTitle: "Taeyoon (Kim Tae-yoon)",
    sourceImageFileName: "NS_Taeyoon_2026_Split_1.png",
  },
  {
    teamName: "Nongshim RedForce",
    playerName: "Lehends",
    sourcePageTitle: "Lehends",
    sourceImageFileName: "NS_Lehends_2026_Split_1.png",
  },
  {
    teamName: "Nongshim RedForce",
    playerName: "Pleata",
    sourcePageTitle: "Pleata",
    sourceImageFileName: "NS.EA_Pleata_2026_Split_1.png",
  },
  {
    teamName: "Kiwoom DRX",
    playerName: "Rich",
    sourcePageTitle: "Rich (Lee Jae-won)",
    sourceImageFileName: "DRX_Rich_2026_Split_1.png",
  },
  {
    teamName: "Kiwoom DRX",
    playerName: "Willer",
    sourcePageTitle: "Willer",
    sourceImageFileName: "DRX_Willer_2026_Split_1.png",
  },
  {
    teamName: "Kiwoom DRX",
    playerName: "Ucal",
    sourcePageTitle: "Ucal",
    sourceImageFileName: "DRX_Ucal_2026_Split_1.png",
  },
  {
    teamName: "Kiwoom DRX",
    playerName: "Jiwoo",
    sourcePageTitle: "Jiwoo",
    sourceImageFileName: "DRX_Jiwoo_2026_Split_1.png",
  },
  {
    teamName: "Kiwoom DRX",
    playerName: "LazyFeel",
    sourcePageTitle: "LazyFeel",
    sourceImageFileName: "DRX.C_LazyFeel_2026_Split_1.png",
  },
  {
    teamName: "Kiwoom DRX",
    playerName: "Andil",
    sourcePageTitle: "Andil",
    sourceImageFileName: "DRX_Andil_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "DuDu",
    sourcePageTitle: "DuDu (Lee Dong-ju)",
    sourceImageFileName: "DNS_DuDu_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "Pyosik",
    sourcePageTitle: "Pyosik",
    sourceImageFileName: "DNS_Pyosik_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "DDoiV",
    sourcePageTitle: "DDoiV",
    sourceImageFileName: "DNS.C_DDoiV_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "Clozer",
    sourcePageTitle: "Clozer",
    sourceImageFileName: "DNS_Clozer_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "deokdam",
    sourcePageTitle: "Deokdam",
    sourceImageFileName: "DNS_deokdam_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "Enosh",
    sourcePageTitle: "Enosh",
    sourceImageFileName: "DNS.C_Enosh_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "Peter",
    sourcePageTitle: "Peter (Jeong Yoon-su)",
    sourceImageFileName: "DNS_Peter_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "Life",
    sourcePageTitle: "Life",
    sourceImageFileName: "DNS_Life_2026_Split_1.png",
  },
  {
    teamName: "DN SOOPers",
    playerName: "Quantum",
    sourcePageTitle: "Quantum (Son Jeong-hwan)",
    sourceImageFileName: "DNS.C_Quantum_2026_Split_1.png",
  },
];

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPortraitKey(teamName: string | undefined, playerName: string) {
  return `${teamName ?? ""}::${playerName}`.toLowerCase();
}

function getFilePageUrl(sourceImageFileName: string) {
  return `https://lol.fandom.com/wiki/File:${encodeURIComponent(
    sourceImageFileName,
  ).replace(/%20/g, "_")}`;
}

function getPortraitExtension(sourceImageFileName: string) {
  const extension = sourceImageFileName.split(".").pop()?.toLowerCase();

  return extension || "png";
}

function getVerificationStatus(sourceImageFileName: string) {
  return sourceImageFileName.includes("2026")
    ? "verified-current"
    : "temporary-current-candidate";
}

function getSourcePageUrl(sourcePageTitle: string) {
  return `https://lol.fandom.com/wiki/${encodeURIComponent(sourcePageTitle).replace(
    /%20/g,
    "_",
  )}`;
}

function createPortraitMeta(source: PlayerPortraitSource): PlayerPortraitMeta {
  const teamSlug = createSlug(source.teamName);
  const playerSlug = createSlug(source.playerName);

  return {
    portraitUrl: `/assets/players/lck/2026/main/${teamSlug}-${playerSlug}.${getPortraitExtension(
      source.sourceImageFileName,
    )}`,
    portraitSourceUrl: getFilePageUrl(source.sourceImageFileName),
    sourceImageFileName: source.sourceImageFileName,
    sourcePageUrl: getSourcePageUrl(source.sourcePageTitle),
    retrievedAt: "2026-06-13",
    verificationStatus: getVerificationStatus(source.sourceImageFileName),
  };
}

export const lck2026PlayerPortraits: Record<string, PlayerPortraitMeta> =
  Object.fromEntries(
    portraitSources.map((source) => [
      `lck-2026-${createSlug(source.teamName)}-${createSlug(source.playerName)}`,
      createPortraitMeta(source),
    ]),
  );

const portraitByTeamAndName = new Map(
  portraitSources.map((source) => [
    getPortraitKey(source.teamName, source.playerName),
    createPortraitMeta(source),
  ]),
);

export function getLck2026PlayerPortrait(
  player: Pick<Player, "currentTeam" | "id" | "name">,
) {
  return (
    lck2026PlayerPortraits[player.id] ??
    portraitByTeamAndName.get(getPortraitKey(player.currentTeam, player.name))
  );
}

export const lck2026MainPortraitCount = portraitSources.length;
