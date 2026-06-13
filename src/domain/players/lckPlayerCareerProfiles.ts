import type { PlayerCareerEntry } from "./playerProfile";

export type LckPlayerCareerProfile = {
  summary: string;
  careerEntries: PlayerCareerEntry[];
  sourceUrls: string[];
};

const leaguepedia = (pageTitle: string) =>
  `https://lol.fandom.com/wiki/${encodeURIComponent(pageTitle).replace(
    /%20/g,
    "_",
  )}`;

const namu = (pageTitle: string) =>
  `https://namu.wiki/w/${encodeURIComponent(pageTitle).replace(/%20/g, "_")}`;

const career = (teamName: string, period: string): PlayerCareerEntry => ({
  period,
  teamName,
});

export const lckPlayerCareerProfiles: Record<string, LckPlayerCareerProfile> = {
  Kiin: {
    summary:
      "Afreeca/Kwangdong의 프랜차이즈 탑으로 긴 시간을 보낸 뒤 KT를 거쳐 Gen.G의 우승권 상단을 책임지는 완성형 탑 라이너입니다.",
    careerEntries: [
      career("Afreeca Freecs", "2017 ~ 2021"),
      career("Kwangdong Freecs", "2022"),
      career("KT Rolster", "2023"),
      career("Gen.G", "2024 ~ 현재"),
    ],
    sourceUrls: [namu("Kiin"), leaguepedia("Kiin")],
  },
  Canyon: {
    summary:
      "DAMWON/DK 왕조의 핵심 정글러로 Worlds 2020 우승을 경험했고, Gen.G 합류 후에도 리그 최상위 정글 영향력을 유지합니다.",
    careerEntries: [
      career("DAMWON Gaming", "2018 ~ 2020"),
      career("DWG KIA", "2021"),
      career("Dplus KIA", "2023"),
      career("Gen.G", "2024 ~ 현재"),
    ],
    sourceUrls: [namu("Canyon"), leaguepedia("Canyon")],
  },
  Chovy: {
    summary:
      "압도적인 라인전과 꾸준한 정규시즌 지배력으로 Griffin, DRX, HLE를 거쳐 Gen.G 시대를 대표하는 미드 라이너입니다.",
    careerEntries: [
      career("Griffin", "2018.03 ~ 2019.11"),
      career("DRX", "2019.12 ~ 2020.11"),
      career("Hanwha Life Esports", "2020.11 ~ 2021.11"),
      career("Gen.G", "2021.11 ~ 현재"),
    ],
    sourceUrls: [namu("Chovy"), namu("정지훈(2001)"), leaguepedia("Chovy")],
  },
  Ruler: {
    summary:
      "Samsung Galaxy/Gen.G와 JDG에서 정상급 커리어를 쌓은 베테랑 원딜로, 다시 Gen.G에 합류한 팀파이트형 캐리입니다.",
    careerEntries: [
      career("Samsung Galaxy", "2016 ~ 2017"),
      career("Gen.G", "2018 ~ 2022"),
      career("JD Gaming", "2023 ~ 2024"),
      career("Gen.G", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Ruler"), leaguepedia("Ruler")],
  },
  Duro: {
    summary:
      "챌린저스와 1군 무대를 거쳐 Gen.G 주전 서포터로 자리잡은 성장형 서포터입니다.",
    careerEntries: [
      career("Liiv SANDBOX Challengers", "2022 ~ 2023"),
      career("BNK FEARX", "2024"),
      career("Gen.G", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Duro"), leaguepedia("Duro")],
  },
  Zeus: {
    summary:
      "T1에서 Worlds 우승 커리어를 쌓은 뒤 HLE로 이적해 우승권 로스터의 상단 캐리 역할을 맡는 탑 라이너입니다.",
    careerEntries: [
      career("T1", "2020.11 ~ 2024.11"),
      career("Hanwha Life Esports", "2024.11 ~ 현재"),
    ],
    sourceUrls: [namu("Zeus"), leaguepedia("Zeus")],
  },
  Kanavi: {
    summary:
      "JDG에서 LPL 최상위 정글러 커리어를 쌓은 뒤 HLE에 합류한 공격적인 운영형 정글러입니다.",
    careerEntries: [
      career("Griffin", "2019"),
      career("JD Gaming", "2019 ~ 2025"),
      career("Hanwha Life Esports", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Kanavi"), leaguepedia("Kanavi")],
  },
  Zeka: {
    summary:
      "2022 Worlds 우승 미드로 큰 경기에서의 폭발력을 증명했고, HLE의 중심 미드로 커리어를 이어갑니다.",
    careerEntries: [
      career("Vici Gaming", "2019 ~ 2020"),
      career("Bilibili Gaming", "2021"),
      career("DRX", "2021.12 ~ 2022.11"),
      career("Hanwha Life Esports", "2022.11 ~ 현재"),
    ],
    sourceUrls: [namu("Zeka"), leaguepedia("Zeka_(Kim_Geon-woo)")],
  },
  Gumayusi: {
    summary:
      "T1에서 Worlds 우승을 경험한 엘리트 원딜로, HLE 합류 후에도 강한 라인전과 캐리력을 기대받습니다.",
    careerEntries: [
      career("T1", "2018 ~ 2025"),
      career("Hanwha Life Esports", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Gumayusi"), leaguepedia("Gumayusi")],
  },
  Delight: {
    summary:
      "BRION에서 성장해 Gen.G와 HLE에서 우승권 서포터로 자리잡은 팀파이트형 서포터입니다.",
    careerEntries: [
      career("Fredit BRION", "2020 ~ 2022"),
      career("Gen.G", "2022.11 ~ 2023.11"),
      career("Hanwha Life Esports", "2023.11 ~ 현재"),
    ],
    sourceUrls: [namu("Delight"), leaguepedia("Delight")],
  },
  Bluffing: {
    summary:
      "HLE 아카데미 계열에서 올라온 신예 서포터로, 2026 개막 기준 1군 로스터에 포함된 성장형 자원입니다.",
    careerEntries: [
      career("Hanwha Life Esports Challengers", "2025"),
      career("Hanwha Life Esports", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Bluffing"), leaguepedia("Bluffing")],
  },
  Doran: {
    summary:
      "Griffin 이후 여러 우승권 팀을 거친 베테랑 탑으로, 2026 개막 기준 T1의 상단을 맡습니다.",
    careerEntries: [
      career("Griffin", "2019"),
      career("DRX", "2020"),
      career("KT Rolster", "2021"),
      career("Gen.G", "2022 ~ 2023"),
      career("Hanwha Life Esports", "2024 ~ 2025"),
      career("T1", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Doran"), leaguepedia("Doran_(Choi_Hyeon-joon)")],
  },
  Oner: {
    summary:
      "T1에서 데뷔해 국제대회 우승 커리어를 쌓은, 교전 개시와 오브젝트 싸움에 강한 정글러입니다.",
    careerEntries: [
      career("T1 Academy", "2020"),
      career("T1", "2021 ~ 현재"),
    ],
    sourceUrls: [namu("Oner"), leaguepedia("Oner")],
  },
  Faker: {
    summary:
      "T1의 상징이자 LoL e스포츠 역사상 가장 긴 지배력을 보여준 미드 라이너입니다.",
    careerEntries: [
      career("SK Telecom T1 2", "2013.02 ~ 2013.11"),
      career("SK Telecom T1 K", "2013.11 ~ 2014.12"),
      career("SK Telecom T1", "2014.12 ~ 2019.12"),
      career("T1", "2019.12 ~ 현재"),
    ],
    sourceUrls: [namu("Faker"), leaguepedia("Faker")],
  },
  Peyz: {
    summary:
      "Gen.G에서 신예 원딜로 정상권 커리어를 시작했고, 2026 개막 기준 T1의 원딜로 등록된 캐리형 자원입니다.",
    careerEntries: [
      career("Gen.G Academy", "2021 ~ 2022"),
      career("Gen.G", "2023 ~ 2024"),
      career("JD Gaming", "2025"),
      career("T1", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Peyz"), leaguepedia("Peyz")],
  },
  Keria: {
    summary:
      "DRX에서 데뷔 후 T1에서 국제대회 우승 커리어를 쌓은, 넓은 챔피언 폭의 플레이메이킹 서포터입니다.",
    careerEntries: [
      career("DRX", "2019.11 ~ 2020.11"),
      career("T1", "2020.11 ~ 현재"),
    ],
    sourceUrls: [namu("Keria"), leaguepedia("Keria")],
  },
  PerfecT: {
    summary:
      "KT 육성 시스템에서 올라와 1군 주전 탑으로 자리잡은 성장형 탑 라이너입니다.",
    careerEntries: [
      career("KT Rolster Challengers", "2022 ~ 2023"),
      career("KT Rolster", "2024 ~ 현재"),
    ],
    sourceUrls: [namu("PerfecT"), leaguepedia("PerfecT_(Lee_Seung-min)")],
  },
  Cuzz: {
    summary:
      "Longzhu/KING-ZONE, T1, KT를 거치며 긴 LCK 커리어를 쌓은 베테랑 정글러입니다.",
    careerEntries: [
      career("Longzhu Gaming", "2017"),
      career("KING-ZONE DragonX", "2018 ~ 2019"),
      career("T1", "2019 ~ 2021"),
      career("KT Rolster", "2021 ~ 현재"),
    ],
    sourceUrls: [namu("Cuzz"), leaguepedia("Cuzz")],
  },
  Bdd: {
    summary:
      "CJ, Longzhu/KING-ZONE, Gen.G, Nongshim, KT를 거친 대표적인 컨트롤 메이지형 미드 라이너입니다.",
    careerEntries: [
      career("CJ Entus", "2015 ~ 2016"),
      career("Longzhu Gaming", "2017"),
      career("KING-ZONE DragonX", "2018"),
      career("KT Rolster", "2019"),
      career("Gen.G", "2020 ~ 2021"),
      career("Nongshim RedForce", "2022"),
      career("KT Rolster", "2022 ~ 현재"),
    ],
    sourceUrls: [namu("Bdd"), leaguepedia("Bdd")],
  },
  Aiming: {
    summary:
      "Afreeca, KT, BLG, Dplus KIA를 거쳐 다시 KT로 돌아온 베테랑 원딜입니다.",
    careerEntries: [
      career("Afreeca Freecs", "2017 ~ 2019"),
      career("KT Rolster", "2020"),
      career("Bilibili Gaming", "2021"),
      career("KT Rolster", "2022 ~ 2023"),
      career("Dplus KIA", "2024 ~ 2025"),
      career("KT Rolster", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Aiming"), leaguepedia("Aiming")],
  },
  FenRir: {
    summary:
      "KT Challengers에서 올라온 서포터로, 2026 개막 기준 KT 1군 서포터진에 포함된 자원입니다.",
    careerEntries: [
      career("KT Rolster Challengers", "2023 ~ 2025"),
      career("KT Rolster", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("FenRir"), leaguepedia("FenRir_(Park_Kang-jun)")],
  },
  Effort: {
    summary:
      "SKT/T1에서 커리어를 시작해 여러 팀을 거친 베테랑 서포터로, KT에서 경험을 더합니다.",
    careerEntries: [
      career("SK Telecom T1", "2017 ~ 2019"),
      career("T1", "2019 ~ 2020"),
      career("Liiv SANDBOX", "2021"),
      career("Nongshim RedForce", "2022"),
      career("BRION", "2023 ~ 2025"),
      career("KT Rolster", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Effort"), leaguepedia("Effort")],
  },
  Siwoo: {
    summary:
      "Dplus KIA 육성 시스템에서 성장해 2026 개막 기준 1군 상단을 맡는 신예 탑 라이너입니다.",
    careerEntries: [
      career("Dplus KIA Challengers", "2024 ~ 2025"),
      career("Dplus KIA", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Siwoo"), leaguepedia("Siwoo")],
  },
  Lucid: {
    summary:
      "DK Challengers에서 성장해 Dplus KIA의 주전 정글로 자리잡은 젊은 정글러입니다.",
    careerEntries: [
      career("DWG KIA Challengers", "2021 ~ 2022"),
      career("Dplus KIA Challengers", "2023"),
      career("Dplus KIA", "2024 ~ 현재"),
    ],
    sourceUrls: [namu("Lucid"), leaguepedia("Lucid_(Choi_Yong-hyeok)")],
  },
  ShowMaker: {
    summary:
      "DAMWON/DK의 프랜차이즈 미드로 Worlds 2020 우승을 경험한 베테랑 미드 라이너입니다.",
    careerEntries: [
      career("DAMWON Gaming", "2017 ~ 2020"),
      career("DWG KIA", "2021"),
      career("Dplus KIA", "2023 ~ 현재"),
    ],
    sourceUrls: [namu("ShowMaker"), leaguepedia("ShowMaker")],
  },
  Smash: {
    summary:
      "T1 아카데미 계열에서 성장해 Dplus KIA 1군 원딜로 합류한 신예 캐리입니다.",
    careerEntries: [
      career("T1 Esports Academy", "2023 ~ 2025"),
      career("Dplus KIA", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Smash"), leaguepedia("Smash_(Shin_Geum-jae)")],
  },
  Career: {
    summary:
      "챌린저스 무대에서 성장해 Dplus KIA의 2026 개막 서포터로 등록된 젊은 서포터입니다.",
    careerEntries: [
      career("DRX Challengers", "2023 ~ 2024"),
      career("BNK FEARX Challengers", "2025"),
      career("Dplus KIA", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Career"), leaguepedia("Career")],
  },
  Casting: {
    summary:
      "아카데미와 챌린저스 무대를 거쳐 Hanjin BRION의 상단을 맡는 성장형 탑 라이너입니다.",
    careerEntries: [
      career("Gen.G Global Academy", "2023"),
      career("KT Rolster Challengers", "2024 ~ 2025"),
      career("Hanjin BRION", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Casting"), leaguepedia("Casting")],
  },
  Gideon: {
    summary:
      "Griffin, KT, LPL, Nongshim을 거쳐 Hanjin BRION에 합류한 경험 많은 정글러입니다.",
    careerEntries: [
      career("Griffin", "2020"),
      career("KT Rolster", "2021 ~ 2022"),
      career("Invictus Gaming", "2023"),
      career("Nongshim RedForce", "2024 ~ 2025"),
      career("Hanjin BRION", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("GIDEON"), leaguepedia("GIDEON")],
  },
  Loki: {
    summary:
      "국내 챌린저스와 해외 경험을 거쳐 Hanjin BRION의 미드 라인에 합류한 선수입니다.",
    careerEntries: [
      career("Hanwha Life Esports Challengers", "2022"),
      career("Cloud9 Challengers", "2025"),
      career("Hanjin BRION", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Loki(프로게이머)"), leaguepedia("Loki_(Lee_Sang-min)")],
  },
  Roamer: {
    summary:
      "BRION 계열과 해외 경험을 거쳐 Hanjin BRION 미드 로스터에 포함된 미드 라이너입니다.",
    careerEntries: [
      career("BRION Challengers", "2021 ~ 2024"),
      career("paiN Gaming", "2025"),
      career("Hanjin BRION", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Roamer"), leaguepedia("Roamer")],
  },
  Teddy: {
    summary:
      "Jin Air, T1, KDF, DRX를 거친 베테랑 원딜로, 후반 캐리와 안정성을 상징하는 선수입니다.",
    careerEntries: [
      career("Jin Air Green Wings", "2016 ~ 2018"),
      career("SK Telecom T1", "2018 ~ 2019"),
      career("T1", "2019 ~ 2021"),
      career("Kwangdong Freecs", "2022"),
      career("DRX", "2023 ~ 2025"),
      career("Hanjin BRION", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Teddy"), leaguepedia("Teddy")],
  },
  Namgung: {
    summary:
      "Gen.G 아카데미 계열에서 성장해 Hanjin BRION 1군 서포터로 등록된 선수입니다.",
    careerEntries: [
      career("Gen.G Global Academy", "2023"),
      career("Gen.G Challengers", "2024 ~ 2025"),
      career("Hanjin BRION", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Namgung"), leaguepedia("Namgung")],
  },
  Clear: {
    summary:
      "DRX 계열에서 성장해 BNK FEARX의 상단을 맡는 탑 라이너입니다.",
    careerEntries: [
      career("DRX Challengers", "2021 ~ 2023"),
      career("DRX", "2024"),
      career("BNK FEARX", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Clear(프로게이머)"), leaguepedia("Clear_(Song_Hyeon-min)")],
  },
  Raptor: {
    summary:
      "BRION Challengers 출신으로 BNK FEARX의 정글을 맡는 성장형 정글러입니다.",
    careerEntries: [
      career("BRION Challengers", "2023"),
      career("BNK FEARX", "2024 ~ 현재"),
    ],
    sourceUrls: [namu("Raptor(프로게이머)"), leaguepedia("Raptor_(Jeon_Eo-jin)")],
  },
  VicLa: {
    summary:
      "KT에서 데뷔해 해외 경험을 거쳐 BNK FEARX에서 다시 LCK 커리어를 이어가는 미드 라이너입니다.",
    careerEntries: [
      career("KT Rolster", "2021 ~ 2022"),
      career("FlyQuest", "2023"),
      career("BNK FEARX", "2024 ~ 현재"),
    ],
    sourceUrls: [namu("VicLa"), leaguepedia("VicLa")],
  },
  Daystar: {
    summary:
      "해외와 2군 경험을 거쳐 BNK FEARX 미드 로스터에 포함된 미드 라이너입니다.",
    careerEntries: [
      career("Team Bliss", "2023"),
      career("BNK FEARX Youth", "2024 ~ 2025"),
      career("BNK FEARX", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Daystar"), leaguepedia("Daystar")],
  },
  Diable: {
    summary:
      "Liiv SANDBOX/BNK FEARX 계열에서 성장한 기계적 잠재력이 높은 원딜로, 2026 개막 기준 BFX 주전으로 둡니다.",
    careerEntries: [
      career("Liiv SANDBOX Youth", "2023"),
      career("BNK FEARX", "2024 ~ 현재"),
    ],
    sourceUrls: [namu("Diable"), leaguepedia("Diable")],
  },
  Kellin: {
    summary:
      "Jin Air, Gen.G, Nongshim, Dplus KIA를 거친 베테랑 서포터로 BNK FEARX의 하단 운영을 맡습니다.",
    careerEntries: [
      career("Jin Air Green Wings", "2019"),
      career("Gen.G", "2020"),
      career("Nongshim RedForce", "2021"),
      career("Dplus KIA", "2021 ~ 2024"),
      career("BNK FEARX", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Kellin"), leaguepedia("Kellin")],
  },
  Kingen: {
    summary:
      "DRX Worlds 2022 우승 탑으로 큰 무대의 고점을 증명했고, Nongshim에서 상단을 맡습니다.",
    careerEntries: [
      career("KT Rolster", "2018 ~ 2019"),
      career("DRX", "2020 ~ 2022"),
      career("Hanwha Life Esports", "2022 ~ 2023"),
      career("Dplus KIA", "2024 ~ 2025"),
      career("Nongshim RedForce", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Kingen"), leaguepedia("Kingen")],
  },
  Sponge: {
    summary:
      "DRX 계열에서 성장해 Nongshim RedForce의 정글 로스터에 합류한 정글러입니다.",
    careerEntries: [
      career("DRX Challengers", "2022 ~ 2023"),
      career("DRX", "2024 ~ 2025"),
      career("Nongshim RedForce", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Sponge"), leaguepedia("Sponge")],
  },
  Scout: {
    summary:
      "SKT 서브에서 EDG 월드 챔피언 미드로 성장했고, LPL 장기 커리어 뒤 LCK로 돌아온 베테랑입니다.",
    careerEntries: [
      career("SK Telecom T1", "2015 ~ 2016"),
      career("Edward Gaming", "2016 ~ 2022"),
      career("LNG Esports", "2023 ~ 2024"),
      career("JD Gaming", "2025"),
      career("Nongshim RedForce", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Scout"), leaguepedia("Scout")],
  },
  Taeyoon: {
    summary:
      "DRX/Kwangdong 계열과 해외 경험을 거쳐 2026 개막 기준 Nongshim 원딜로 등록된 선수입니다.",
    careerEntries: [
      career("DRX Challengers", "2020 ~ 2021"),
      career("DRX", "2022"),
      career("Kwangdong Freecs", "2023 ~ 2024"),
      career("Team WE", "2025"),
      career("Nongshim RedForce", "2026 개막"),
    ],
    sourceUrls: [namu("Taeyoon"), leaguepedia("Taeyoon_(Kim_Tae-yoon)")],
  },
  Lehends: {
    summary:
      "Griffin에서 이름을 알린 뒤 Gen.G, KT, Nongshim을 거친 대표적인 운영형 베테랑 서포터입니다.",
    careerEntries: [
      career("Griffin", "2016 ~ 2019"),
      career("Hanwha Life Esports", "2020"),
      career("Nongshim RedForce", "2021"),
      career("Gen.G", "2022 ~ 2023"),
      career("KT Rolster", "2024 ~ 2025"),
      career("Nongshim RedForce", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Lehends"), leaguepedia("Lehends")],
  },
  Pleata: {
    summary:
      "DRX와 Nongshim 계열을 거친 서포터로, 2026 개막 기준 Nongshim 서포터 로스터에 포함됩니다.",
    careerEntries: [
      career("DRX", "2021"),
      career("Nongshim RedForce Challengers", "2022 ~ 2025"),
      career("Nongshim RedForce", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Pleata"), leaguepedia("Pleata")],
  },
  Rich: {
    summary:
      "히어로즈 오브 더 스톰 스타 출신으로 LoL 전향 후 LCK/LPL을 거쳐 DRX 상단을 맡는 탑 라이너입니다.",
    careerEntries: [
      career("Gen.G", "2019"),
      career("Team Dynamics", "2020"),
      career("Nongshim RedForce", "2021"),
      career("Victory Five", "2022"),
      career("Ninjas in Pyjamas", "2023 ~ 2024"),
      career("Kiwoom DRX", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Rich(프로게이머)"), leaguepedia("Rich_(Lee_Jae-won)")],
  },
  Willer: {
    summary:
      "HLE, Liiv SANDBOX, DRX를 거치며 경험을 쌓은 정글러로 Kiwoom DRX의 정글을 맡습니다.",
    careerEntries: [
      career("Hanwha Life Esports", "2021"),
      career("Liiv SANDBOX", "2022 ~ 2023"),
      career("FearX", "2024"),
      career("Kiwoom DRX", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Willer"), leaguepedia("Willer")],
  },
  Ucal: {
    summary:
      "KT 데뷔 이후 국내외 여러 팀을 거친 메카닉형 미드로, Kiwoom DRX에서 커리어를 이어갑니다.",
    careerEntries: [
      career("KT Rolster", "2017 ~ 2018"),
      career("Afreeca Freecs", "2019 ~ 2020"),
      career("KT Rolster", "2020"),
      career("ThunderTalk Gaming", "2021 ~ 2024"),
      career("Kiwoom DRX", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Ucal"), leaguepedia("Ucal")],
  },
  Jiwoo: {
    summary:
      "Nongshim 계열에서 성장한 원딜로, Kiwoom DRX에서 다시 주전 경쟁을 이어가는 성장형 자원입니다.",
    careerEntries: [
      career("Nongshim RedForce Academy", "2021 ~ 2022"),
      career("Nongshim RedForce", "2023 ~ 2025"),
      career("Kiwoom DRX", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Jiwoo"), leaguepedia("Jiwoo")],
  },
  LazyFeel: {
    summary:
      "DRX Challengers에서 올라온 원딜로, 2026 개막 기준 Kiwoom DRX 1군 로스터에 포함됩니다.",
    careerEntries: [
      career("DRX Challengers", "2025"),
      career("Kiwoom DRX", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("LazyFeel"), leaguepedia("LazyFeel")],
  },
  Andil: {
    summary:
      "Nongshim/DRX 계열에서 경험을 쌓은 서포터로, Kiwoom DRX 하단 운영을 맡습니다.",
    careerEntries: [
      career("Nongshim RedForce Challengers", "2021 ~ 2024"),
      career("Kiwoom DRX", "2025 ~ 현재"),
    ],
    sourceUrls: [namu("Andil"), leaguepedia("Andil")],
  },
  DuDu: {
    summary:
      "HLE와 Kwangdong/DN 계열에서 꾸준히 주전 경험을 쌓은 탑 라이너입니다.",
    careerEntries: [
      career("Hanwha Life Esports", "2020 ~ 2022"),
      career("Kwangdong Freecs", "2022 ~ 2025"),
      career("DN Freecs", "2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("DuDu"), leaguepedia("DuDu_(Lee_Dong-ju)")],
  },
  Pyosik: {
    summary:
      "DRX Worlds 2022 우승 정글로 국제대회 고점을 가진 베테랑 정글러입니다.",
    careerEntries: [
      career("DRX", "2019 ~ 2022"),
      career("Team Liquid", "2023"),
      career("KT Rolster", "2024 ~ 2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Pyosik"), leaguepedia("Pyosik")],
  },
  DDoiV: {
    summary:
      "BRION 계열에서 성장해 DN SOOPers 1군 정글 로스터에 포함된 선수입니다.",
    careerEntries: [
      career("BRION Challengers", "2023 ~ 2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("DDoiV"), leaguepedia("DDoiV")],
  },
  Clozer: {
    summary:
      "T1에서 데뷔해 Liiv SANDBOX/FearX, BRION을 거쳐 DN SOOPers의 미드를 맡는 메카닉형 미드입니다.",
    careerEntries: [
      career("T1", "2020 ~ 2021"),
      career("Liiv SANDBOX", "2021 ~ 2023"),
      career("FearX", "2024"),
      career("BRION", "2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Clozer"), leaguepedia("Clozer")],
  },
  deokdam: {
    summary:
      "Team Dynamics/Nongshim에서 성장해 DK, DRX, KT를 거친 베테랑 원딜입니다.",
    careerEntries: [
      career("Team Dynamics", "2019 ~ 2020"),
      career("Nongshim RedForce", "2021"),
      career("Dplus KIA", "2022"),
      career("DRX", "2023"),
      career("KT Rolster", "2024 ~ 2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("deokdam"), leaguepedia("Deokdam")],
  },
  Enosh: {
    summary:
      "챌린저스와 하위 로스터에서 성장해 DN SOOPers 1군 원딜 로스터에 포함된 선수입니다.",
    careerEntries: [
      career("BRION Challengers", "2023 ~ 2024"),
      career("BNK FEARX Challengers", "2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Enosh"), leaguepedia("Enosh")],
  },
  Peter: {
    summary:
      "Nongshim과 KT 계열을 거친 서포터로, DN SOOPers에서 하단 운영을 맡습니다.",
    careerEntries: [
      career("Nongshim RedForce", "2021 ~ 2023"),
      career("KT Rolster Challengers", "2024 ~ 2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Peter(프로게이머)"), leaguepedia("Peter_(Jeong_Yoon-su)")],
  },
  Life: {
    summary:
      "Gen.G, KT, HLE 등을 거친 베테랑 서포터로, DN SOOPers에서 경험을 보탭니다.",
    careerEntries: [
      career("Gen.G", "2018 ~ 2021"),
      career("KT Rolster", "2022"),
      career("Hanwha Life Esports", "2023 ~ 2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Life(프로게이머)"), leaguepedia("Life")],
  },
  Quantum: {
    summary:
      "Kwangdong/DN 계열 2군에서 성장해 DN SOOPers 1군 서포터 로스터에 포함된 선수입니다.",
    careerEntries: [
      career("Kwangdong Freecs Challengers", "2024"),
      career("DN Freecs Challengers", "2025"),
      career("DN SOOPers", "2026 ~ 현재"),
    ],
    sourceUrls: [namu("Quantum(프로게이머)"), leaguepedia("Quantum_(Son_Jeong-hwan)")],
  },
  BeryL: {
    summary:
      "DAMWON/DK와 DRX에서 Worlds 우승을 경험한 베테랑 서포터로, 넓은 운영 이해도와 독특한 메타 해석이 강점입니다.",
    careerEntries: [
      career("DAMWON Gaming", "2017 ~ 2020"),
      career("DWG KIA", "2021"),
      career("DRX", "2021 ~ 2023"),
      career("KT Rolster", "2024"),
      career("Dplus KIA", "2025"),
      career("FA", "2026 프리시즌"),
    ],
    sourceUrls: [namu("BeryL"), leaguepedia("BeryL")],
  },
};

export function getLckPlayerCareerProfile(playerName: string) {
  return lckPlayerCareerProfiles[playerName];
}
