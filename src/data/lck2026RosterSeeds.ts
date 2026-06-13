import type { Player, Role } from "../types/game";

export type Lck2026RosterSource = NonNullable<Player["source"]>;
export type Lck2026RosterTier = NonNullable<Player["rosterTier"]>;

export type Lck2026RosterSeed = {
  name: string;
  realName?: string;
  role: Role;
  teamName: string;
  rosterTier: Lck2026RosterTier;
  source: Lck2026RosterSource;
  age: number;
};

const lckSource = "lck-2026-rounds-1-2";
const lckClSource = "lck-cl-2026-rounds-1-2";

function seed(
  teamName: string,
  name: string,
  role: Role,
  rosterTier: Lck2026RosterTier,
  age: number,
  realName?: string,
): Lck2026RosterSeed {
  return {
    name,
    realName,
    role,
    teamName,
    rosterTier,
    source: rosterTier === "main" ? lckSource : lckClSource,
    age,
  };
}

export const lck2026RosterSeeds: Lck2026RosterSeed[] = [
  seed("Gen.G", "Kiin", "top", "main", 26, "Kim Gi-in"),
  seed("Gen.G", "Canyon", "jungle", "main", 25, "Kim Geon-bu"),
  seed("Gen.G", "Chovy", "mid", "main", 25, "Jeong Ji-hoon"),
  seed("Gen.G", "Ruler", "bot", "main", 27, "Park Jae-hyuk"),
  seed("Gen.G", "Duro", "support", "main", 22, "Joo Min-kyu"),
  seed("Gen.G", "Ripple", "top", "academy", 19),
  seed("Gen.G", "Courage", "jungle", "academy", 19),
  seed("Gen.G", "Kemish", "mid", "academy", 19),
  seed("Gen.G", "MUDAI", "bot", "academy", 19),
  seed("Gen.G", "SIRIUSS", "bot", "academy", 18),
  seed("Gen.G", "Lumos", "support", "academy", 19),

  seed("Hanwha Life Esports", "Zeus", "top", "main", 22, "Choi Woo-je"),
  seed("Hanwha Life Esports", "Kanavi", "jungle", "main", 25, "Seo Jin-hyeok"),
  seed("Hanwha Life Esports", "Zeka", "mid", "main", 24, "Kim Geon-woo"),
  seed("Hanwha Life Esports", "Gumayusi", "bot", "main", 23, "Lee Min-hyeong"),
  seed("Hanwha Life Esports", "Delight", "support", "main", 23, "Yoo Hwan-joong"),
  seed("Hanwha Life Esports", "Bluffing", "support", "main", 20),
  seed("Hanwha Life Esports", "Panther", "top", "academy", 19),
  seed("Hanwha Life Esports", "Jackal", "jungle", "academy", 19),
  seed("Hanwha Life Esports", "Cracker", "mid", "academy", 19),
  seed("Hanwha Life Esports", "Pyeonsik", "bot", "academy", 18),
  seed("Hanwha Life Esports", "Valiant", "support", "academy", 19),

  seed("T1", "Doran", "top", "main", 25, "Choi Hyeon-joon"),
  seed("T1", "Oner", "jungle", "main", 23, "Mun Hyeon-jun"),
  seed("T1", "Faker", "mid", "main", 30, "Lee Sang-hyeok"),
  seed("T1", "Peyz", "bot", "main", 20, "Kim Su-hwan"),
  seed("T1", "Keria", "support", "main", 24, "Ryu Min-seok"),
  seed("T1", "Haetae", "top", "academy", 19),
  seed("T1", "Guardian", "jungle", "academy", 19),
  seed("T1", "Painter", "mid", "academy", 19),
  seed("T1", "Guti", "mid", "academy", 18),
  seed("T1", "Cypher", "bot", "academy", 20),
  seed("T1", "Jinbeom", "bot", "academy", 18),
  seed("T1", "Cloud", "support", "academy", 19),

  seed("KT Rolster", "PerfecT", "top", "main", 21, "Lee Seung-min"),
  seed("KT Rolster", "Cuzz", "jungle", "main", 27, "Moon Woo-chan"),
  seed("KT Rolster", "Bdd", "mid", "main", 27, "Gwak Bo-seong"),
  seed("KT Rolster", "Aiming", "bot", "main", 26, "Kim Ha-ram"),
  seed("KT Rolster", "FenRir", "support", "main", 21),
  seed("KT Rolster", "Effort", "support", "main", 26, "Lee Sang-ho"),
  seed("KT Rolster", "Sero", "top", "academy", 19),
  seed("KT Rolster", "Sylvie", "jungle", "academy", 22, "Lee Seung-bok"),
  seed("KT Rolster", "Hwichan", "mid", "academy", 19),
  seed("KT Rolster", "Ghost", "support", "academy", 27, "Jang Yong-jun"),
  seed("KT Rolster", "Pollu", "support", "academy", 19),

  seed("Dplus KIA", "Siwoo", "top", "main", 19),
  seed("Dplus KIA", "Lucid", "jungle", "main", 21, "Choi Yong-hyeok"),
  seed("Dplus KIA", "ShowMaker", "mid", "main", 26, "Heo Su"),
  seed("Dplus KIA", "Smash", "bot", "main", 19),
  seed("Dplus KIA", "Career", "support", "main", 19),
  seed("Dplus KIA", "Sharvel", "jungle", "academy", 20),
  seed("Dplus KIA", "Jaehyuk", "top", "academy", 19),
  seed("Dplus KIA", "Garden", "mid", "academy", 20),
  seed("Dplus KIA", "Wayne", "bot", "academy", 19),
  seed("Dplus KIA", "Loopy", "support", "academy", 19),

  seed("Hanjin BRION", "Casting", "top", "main", 20),
  seed("Hanjin BRION", "Gideon", "jungle", "main", 25, "Kim Min-seong"),
  seed("Hanjin BRION", "Loki", "mid", "main", 23),
  seed("Hanjin BRION", "Roamer", "mid", "main", 20),
  seed("Hanjin BRION", "Teddy", "bot", "main", 28, "Park Jin-seong"),
  seed("Hanjin BRION", "Namgung", "support", "main", 22),
  seed("Hanjin BRION", "DDahyuk", "top", "academy", 19),
  seed("Hanjin BRION", "Dinai", "jungle", "academy", 20),
  seed("Hanjin BRION", "Tempester", "mid", "academy", 19),
  seed("Hanjin BRION", "OddEye", "bot", "academy", 19),
  seed("Hanjin BRION", "PlanB", "support", "academy", 19),

  seed("BNK FEARX", "Clear", "top", "main", 22, "Song Hyeon-min"),
  seed("BNK FEARX", "Raptor", "jungle", "main", 22),
  seed("BNK FEARX", "VicLa", "mid", "main", 23, "Lee Dae-kwang"),
  seed("BNK FEARX", "Daystar", "mid", "main", 22),
  seed("BNK FEARX", "Diable", "bot", "main", 19, "Nam Dae-geun"),
  seed("BNK FEARX", "Kellin", "support", "main", 25, "Kim Hyeong-gyu"),
  seed("BNK FEARX", "Kangin", "top", "academy", 19),
  seed("BNK FEARX", "Zephyr", "jungle", "academy", 19),
  seed("BNK FEARX", "FIESTA", "mid", "academy", 23, "An Hyeon-seo"),
  seed("BNK FEARX", "Slayer", "bot", "academy", 20, "Kim Jin-young"),
  seed("BNK FEARX", "Luon", "support", "academy", 20),

  seed("Nongshim RedForce", "Kingen", "top", "main", 26, "Hwang Seong-hoon"),
  seed("Nongshim RedForce", "Sponge", "jungle", "main", 22, "Bae Young-jun"),
  seed("Nongshim RedForce", "Scout", "mid", "main", 28, "Lee Ye-chan"),
  seed("Nongshim RedForce", "Taeyoon", "bot", "main", 23, "Kim Tae-yoon"),
  seed("Nongshim RedForce", "Lehends", "support", "main", 27, "Son Si-woo"),
  seed("Nongshim RedForce", "Pleata", "support", "main", 24),
  seed("Nongshim RedForce", "Janus", "top", "academy", 19),
  seed("Nongshim RedForce", "Mihawk", "jungle", "academy", 19),
  seed("Nongshim RedForce", "SeTab", "mid", "academy", 23, "Song Gyeong-jin"),
  seed("Nongshim RedForce", "Lucy", "bot", "academy", 19),

  seed("Kiwoom DRX", "Rich", "top", "main", 28, "Lee Jae-won"),
  seed("Kiwoom DRX", "Willer", "jungle", "main", 23, "Kim Jeong-hyeon"),
  seed("Kiwoom DRX", "Ucal", "mid", "main", 25, "Son Woo-hyeon"),
  seed("Kiwoom DRX", "Jiwoo", "bot", "main", 22, "Jeong Ji-woo"),
  seed("Kiwoom DRX", "LazyFeel", "bot", "main", 20),
  seed("Kiwoom DRX", "Andil", "support", "main", 22, "Moon Gwan-bin"),
  seed("Kiwoom DRX", "Frog", "top", "academy", 19),
  seed("Kiwoom DRX", "Winner", "jungle", "academy", 19),
  seed("Kiwoom DRX", "AKaJe", "mid", "academy", 19),
  seed("Kiwoom DRX", "Minous", "support", "academy", 19),

  seed("DN SOOPers", "DuDu", "top", "main", 25, "Lee Dong-ju"),
  seed("DN SOOPers", "Pyosik", "jungle", "main", 26, "Hong Chang-hyeon"),
  seed("DN SOOPers", "DDoiV", "jungle", "main", 20),
  seed("DN SOOPers", "Clozer", "mid", "main", 23, "Lee Ju-hyeon"),
  seed("DN SOOPers", "deokdam", "bot", "main", 25, "Seo Dae-gil"),
  seed("DN SOOPers", "Enosh", "bot", "main", 20),
  seed("DN SOOPers", "Peter", "support", "main", 22, "Jeong Yoon-su"),
  seed("DN SOOPers", "Life", "support", "main", 25, "Kim Jeong-min"),
  seed("DN SOOPers", "Quantum", "support", "main", 20),
  seed("DN SOOPers", "Lancer", "top", "academy", 19),
  seed("DN SOOPers", "Flip", "mid", "academy", 19),
];
