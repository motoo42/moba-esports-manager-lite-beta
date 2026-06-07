# LCK 2026 Stats-Based Rating Comparison

Generated: 2026-06-07

## Readability Check

- Source table: `C:/Users/hoyai/.codex/attachments/bce3a70a-6b04-40cc-9bbc-61c6e3c8334e/pasted-text.txt`
- Parse result: OK. The pasted table is tab-separated and has 26 columns, 62 player rows.
- Matched to current roster data: 62/62 stat rows matched.
- Missing roster players without stat rows: 46. These are mostly academy or players without a row in the pasted LCK Rounds 1-2 stat table.

## Method

This candidate ignores the earlier chat-based scouting notes and uses only the pasted LCK Rounds 1-2 stat table plus the player's existing role/team mapping.

- Role-normalized stats are used so supports are not punished for low DPM and laners are not rewarded for support-only vision volume.
- Small samples are shrunk toward average using games played. Confidence is high at 24+ games, medium at 10-23 games, low below 10 games.
- Overall calibration follows the requested anchors: Chovy = 90, Siwoo = 80.
- Result average for matched players: current OVR 77.4, stat OVR 80.2.
- Potential and champion pool have no direct one-to-one source column. In this pure stat-only candidate, POT is kept equal to stat OVR and champion pool is a cautious proxy from games, win rate, KDA, KP, and GPM. If this table is chosen for actual game data, POT should be re-layered afterward with age/prospect rules.

Dimension mapping:

- Mechanics: KDA, kills, deaths inverse, DPM, CSM, solo kills, GPM.
- Macro: KP, vision share, VSPM, wards, ward clears, win rate, deaths inverse.
- Laning: GD@15, CSD@15, XPD@15, first blood, first blood victim inverse, solo kills.
- Teamfight: KDA, KP, assists, DPM, damage share, deaths inverse, win rate, GPM.
- Mental: deaths inverse, first blood victim inverse, KDA, GD@15, win rate, games played.
- Champion pool proxy: games played, win rate, KDA, KP, GPM.

## Table 1 - Current User-Guided Ratings For Players With Stat Rows

| Team | Tier | Role | Player | Games | Win% | Cur AB | Cur OVR | Cur POT | Cur Mech | Cur Macro | Cur Lane | Cur TF | Cur Mental | Cur Pool |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gen.G | main | top | Kiin | 41 | 73.2% | 87 | 87 | 88 | 87 | 87 | 87 | 87 | 86 | 87 |
| Gen.G | main | jungle | Canyon | 41 | 73.2% | 85 | 85 | 86 | 88 | 84 | 61 | 84 | 88 | 86 |
| Gen.G | main | mid | Chovy | 41 | 73.2% | 90 | 90 | 91 | 92 | 88 | 95 | 88 | 84 | 89 |
| Gen.G | main | bot | Ruler | 41 | 73.2% | 86 | 86 | 87 | 86 | 88 | 86 | 90 | 83 | 85 |
| Gen.G | main | support | Duro | 41 | 73.2% | 84 | 84 | 88 | 81 | 81 | 80 | 86 | 80 | 84 |
| Hanwha Life Esports | main | top | Zeus | 43 | 74.4% | 88 | 88 | 91 | 90 | 86 | 86 | 90 | 84 | 84 |
| Hanwha Life Esports | main | jungle | Kanavi | 43 | 74.4% | 88 | 88 | 89 | 87 | 91 | 62 | 90 | 84 | 86 |
| Hanwha Life Esports | main | mid | Zeka | 43 | 74.4% | 86 | 86 | 87 | 91 | 83 | 86 | 90 | 84 | 81 |
| Hanwha Life Esports | main | bot | Gumayusi | 43 | 74.4% | 88 | 88 | 90 | 85 | 85 | 91 | 88 | 86 | 89 |
| Hanwha Life Esports | main | support | Bluffing | 3 | 66.7% | 71 | 71 | 87 | 70 | 74 | 71 | 74 | 73 | 73 |
| Hanwha Life Esports | main | support | Delight | 40 | 75% | 84 | 84 | 86 | 80 | 81 | 78 | 89 | 84 | 80 |
| T1 | main | top | Doran | 40 | 75% | 85 | 85 | 86 | 84 | 84 | 80 | 88 | 82 | 83 |
| T1 | main | jungle | Oner | 40 | 75% | 88 | 88 | 91 | 90 | 86 | 61 | 89 | 84 | 85 |
| T1 | main | mid | Faker | 40 | 75% | 86 | 86 | 87 | 83 | 92 | 83 | 84 | 90 | 91 |
| T1 | main | bot | Peyz | 40 | 75% | 87 | 87 | 92 | 87 | 86 | 84 | 90 | 86 | 85 |
| T1 | main | support | Keria | 40 | 75% | 88 | 88 | 89 | 86 | 91 | 89 | 90 | 84 | 91 |
| KT Rolster | main | top | PerfecT | 41 | 63.4% | 83 | 83 | 89 | 83 | 80 | 87 | 82 | 77 | 80 |
| KT Rolster | main | jungle | Cuzz | 41 | 63.4% | 85 | 85 | 86 | 83 | 87 | 60 | 86 | 82 | 84 |
| KT Rolster | main | mid | Bdd | 41 | 63.4% | 86 | 86 | 87 | 85 | 86 | 88 | 88 | 87 | 84 |
| KT Rolster | main | bot | Aiming | 38 | 63.2% | 84 | 84 | 85 | 84 | 86 | 86 | 84 | 79 | 82 |
| KT Rolster | main | support | Effort | 41 | 63.4% | 78 | 78 | 79 | 73 | 80 | 76 | 74 | 80 | 77 |
| KT Rolster | main | support | FenRir | 3 | 66.7% | 74 | 74 | 82 | 72 | 78 | 73 | 76 | 76 | 75 |
| Dplus KIA | main | top | Siwoo | 42 | 57.1% | 80 | 80 | 88 | 82 | 76 | 80 | 79 | 75 | 78 |
| Dplus KIA | main | jungle | Lucid | 39 | 56.4% | 82 | 82 | 87 | 84 | 82 | 58 | 82 | 80 | 79 |
| Dplus KIA | main | jungle | Sharvel | 3 | 66.7% | 73 | 73 | 85 | 74 | 78 | 56 | 75 | 75 | 75 |
| Dplus KIA | main | mid | ShowMaker | 42 | 57.1% | 84 | 84 | 85 | 84 | 86 | 84 | 84 | 85 | 86 |
| Dplus KIA | main | bot | Smash | 42 | 57.1% | 81 | 81 | 88 | 81 | 79 | 81 | 83 | 83 | 83 |
| Dplus KIA | main | support | Career | 42 | 57.1% | 78 | 78 | 85 | 75 | 80 | 76 | 80 | 74 | 78 |
| Hanjin BRION | main | top | Casting | 40 | 40% | 78 | 78 | 84 | 79 | 76 | 80 | 78 | 77 | 76 |
| Hanjin BRION | main | jungle | Gideon | 40 | 40% | 70 | 70 | 72 | 71 | 73 | 56 | 70 | 71 | 71 |
| Hanjin BRION | main | mid | Loki | 16 | 25% | 71 | 71 | 75 | 75 | 70 | 75 | 70 | 70 | 73 |
| Hanjin BRION | main | mid | Roamer | 24 | 50% | 72 | 72 | 80 | 76 | 70 | 76 | 71 | 71 | 74 |
| Hanjin BRION | main | bot | Teddy | 40 | 40% | 83 | 83 | 84 | 80 | 80 | 81 | 85 | 85 | 80 |
| Hanjin BRION | main | support | Namgung | 40 | 40% | 70 | 70 | 78 | 68 | 73 | 70 | 72 | 72 | 70 |
| BNK FEARX | main | top | Clear | 39 | 35.9% | 70 | 70 | 76 | 72 | 69 | 74 | 70 | 70 | 69 |
| BNK FEARX | main | jungle | Raptor | 39 | 35.9% | 70 | 70 | 77 | 71 | 74 | 56 | 70 | 70 | 71 |
| BNK FEARX | main | mid | Daystar | 10 | 40% | 71 | 71 | 78 | 74 | 70 | 74 | 70 | 70 | 72 |
| BNK FEARX | main | mid | VicLa | 29 | 34.5% | 70 | 70 | 74 | 74 | 69 | 74 | 69 | 69 | 72 |
| BNK FEARX | main | bot | Slayer | 2 | 0% | 73 | 73 | 81 | 76 | 68 | 75 | 75 | 73 | 73 |
| BNK FEARX | main | support | Kellin | 39 | 35.9% | 82 | 82 | 83 | 79 | 82 | 84 | 81 | 84 | 80 |
| Nongshim RedForce | main | top | Kingen | 41 | 31.7% | 75 | 75 | 76 | 76 | 73 | 77 | 75 | 76 | 73 |
| Nongshim RedForce | main | jungle | Sponge | 41 | 31.7% | 70 | 70 | 75 | 70 | 74 | 54 | 71 | 70 | 70 |
| Nongshim RedForce | main | mid | Scout | 41 | 31.7% | 80 | 80 | 81 | 79 | 83 | 80 | 80 | 83 | 78 |
| Nongshim RedForce | main | bot | Diable | 38 | 23.7% | 82 | 82 | 90 | 84 | 78 | 82 | 83 | 80 | 80 |
| Nongshim RedForce | main | bot | Taeyoon | 40 | 45% | 76 | 76 | 77 | 76 | 75 | 76 | 78 | 78 | 75 |
| Nongshim RedForce | main | support | Lehends | 34 | 38.2% | 79 | 79 | 80 | 75 | 83 | 76 | 80 | 83 | 79 |
| Nongshim RedForce | main | support | Pleata | 7 | 0% | 70 | 70 | 74 | 68 | 72 | 70 | 70 | 72 | 70 |
| Kiwoom DRX | main | top | Rich | 44 | 36.4% | 68 | 68 | 69 | 68 | 69 | 70 | 69 | 68 | 68 |
| Kiwoom DRX | main | jungle | Willer | 44 | 36.4% | 69 | 69 | 72 | 70 | 72 | 56 | 69 | 70 | 70 |
| Kiwoom DRX | main | mid | Ucal | 44 | 36.4% | 78 | 78 | 79 | 81 | 75 | 79 | 77 | 75 | 76 |
| Kiwoom DRX | main | bot | Jiwoo | 5 | 20% | 70 | 70 | 76 | 71 | 68 | 70 | 74 | 70 | 70 |
| Kiwoom DRX | main | bot | LazyFeel | 39 | 38.5% | 72 | 72 | 82 | 74 | 68 | 72 | 74 | 70 | 72 |
| Kiwoom DRX | main | support | Andil | 44 | 36.4% | 70 | 70 | 76 | 68 | 73 | 70 | 71 | 72 | 70 |
| DN SOOPers | main | top | DuDu | 37 | 8.1% | 76 | 76 | 77 | 76 | 74 | 79 | 76 | 79 | 74 |
| DN SOOPers | main | jungle | DDoiV | 2 | 0% | 67 | 67 | 75 | 68 | 70 | 54 | 67 | 68 | 68 |
| DN SOOPers | main | jungle | Pyosik | 35 | 8.6% | 69 | 69 | 70 | 70 | 70 | 56 | 68 | 69 | 69 |
| DN SOOPers | main | mid | Clozer | 37 | 8.1% | 69 | 69 | 71 | 73 | 67 | 72 | 68 | 67 | 70 |
| DN SOOPers | main | bot | deokdam | 33 | 9.1% | 69 | 69 | 72 | 70 | 68 | 69 | 73 | 69 | 69 |
| DN SOOPers | main | bot | Enosh | 4 | 0% | 68 | 68 | 77 | 71 | 64 | 70 | 70 | 68 | 68 |
| DN SOOPers | main | support | Life | 11 | 0% | 70 | 70 | 71 | 68 | 73 | 70 | 71 | 72 | 70 |
| DN SOOPers | main | support | Peter | 18 | 16.7% | 69 | 69 | 76 | 67 | 72 | 68 | 71 | 71 | 69 |
| DN SOOPers | main | support | Quantum | 8 | 0% | 66 | 66 | 75 | 64 | 69 | 66 | 68 | 68 | 66 |

## Table 2 - Pure Stats-Based Candidate Ratings

| Team | Tier | Role | Player | Games | Conf | Stat AB | Stat OVR | Stat POT | Delta | Stat Mech | Stat Macro | Stat Lane | Stat TF | Stat Mental | Stat Pool |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gen.G | main | top | Kiin | 41 | high | 86 | 86 | 86 | -1 | 85 | 84 | 87 | 87 | 86 | 85 |
| Gen.G | main | jungle | Canyon | 41 | high | 84 | 84 | 84 | -1 | 86 | 80 | 83 | 86 | 86 | 85 |
| Gen.G | main | mid | Chovy | 41 | high | 90 | 90 | 90 | 0 | 92 | 87 | 91 | 91 | 88 | 88 |
| Gen.G | main | bot | Ruler | 41 | high | 85 | 85 | 85 | -1 | 86 | 84 | 83 | 85 | 86 | 85 |
| Gen.G | main | support | Duro | 41 | high | 84 | 84 | 84 | 0 | 84 | 83 | 80 | 85 | 87 | 85 |
| Hanwha Life Esports | main | top | Zeus | 43 | high | 86 | 86 | 86 | -2 | 86 | 82 | 87 | 86 | 88 | 88 |
| Hanwha Life Esports | main | jungle | Kanavi | 43 | high | 82 | 82 | 82 | -6 | 84 | 79 | 83 | 84 | 79 | 84 |
| Hanwha Life Esports | main | mid | Zeka | 43 | high | 86 | 86 | 86 | 0 | 88 | 83 | 83 | 88 | 88 | 87 |
| Hanwha Life Esports | main | bot | Gumayusi | 43 | high | 84 | 84 | 84 | -4 | 84 | 86 | 83 | 84 | 84 | 86 |
| Hanwha Life Esports | main | support | Bluffing | 3 | low | 80 | 80 | 80 | +9 | 80 | 81 | 78 | 81 | 79 | 79 |
| Hanwha Life Esports | main | support | Delight | 40 | high | 84 | 84 | 84 | 0 | 82 | 83 | 86 | 84 | 85 | 85 |
| T1 | main | top | Doran | 40 | high | 78 | 78 | 78 | -7 | 82 | 78 | 73 | 81 | 76 | 80 |
| T1 | main | jungle | Oner | 40 | high | 83 | 83 | 83 | -5 | 86 | 81 | 83 | 84 | 83 | 83 |
| T1 | main | mid | Faker | 40 | high | 80 | 80 | 80 | -6 | 81 | 79 | 81 | 78 | 81 | 82 |
| T1 | main | bot | Peyz | 40 | high | 85 | 85 | 85 | -2 | 85 | 82 | 86 | 85 | 86 | 85 |
| T1 | main | support | Keria | 40 | high | 83 | 83 | 83 | -5 | 82 | 82 | 86 | 82 | 85 | 84 |
| KT Rolster | main | top | PerfecT | 41 | high | 83 | 83 | 83 | 0 | 84 | 80 | 84 | 81 | 86 | 81 |
| KT Rolster | main | jungle | Cuzz | 41 | high | 81 | 81 | 81 | -4 | 80 | 82 | 80 | 81 | 81 | 82 |
| KT Rolster | main | mid | Bdd | 41 | high | 83 | 83 | 83 | -3 | 81 | 84 | 83 | 84 | 84 | 84 |
| KT Rolster | main | bot | Aiming | 38 | high | 85 | 85 | 85 | +1 | 86 | 83 | 83 | 85 | 86 | 84 |
| KT Rolster | main | support | Effort | 41 | high | 82 | 82 | 82 | +4 | 80 | 83 | 80 | 82 | 82 | 83 |
| KT Rolster | main | support | FenRir | 3 | low | 79 | 79 | 79 | +5 | 82 | 77 | 77 | 81 | 79 | 80 |
| Dplus KIA | main | top | Siwoo | 42 | high | 80 | 80 | 80 | 0 | 82 | 79 | 81 | 79 | 77 | 81 |
| Dplus KIA | main | jungle | Lucid | 39 | high | 82 | 82 | 82 | 0 | 81 | 82 | 83 | 82 | 83 | 82 |
| Dplus KIA | main | jungle | Sharvel | 3 | low | 80 | 80 | 80 | +7 | 79 | 81 | 79 | 80 | 81 | 79 |
| Dplus KIA | main | mid | ShowMaker | 42 | high | 81 | 81 | 81 | -3 | 82 | 81 | 81 | 80 | 82 | 82 |
| Dplus KIA | main | bot | Smash | 42 | high | 83 | 83 | 83 | +2 | 84 | 83 | 84 | 81 | 84 | 84 |
| Dplus KIA | main | support | Career | 42 | high | 84 | 84 | 84 | +6 | 84 | 83 | 85 | 83 | 87 | 85 |
| Hanjin BRION | main | top | Casting | 40 | high | 79 | 79 | 79 | +1 | 76 | 84 | 78 | 80 | 80 | 78 |
| Hanjin BRION | main | jungle | Gideon | 40 | high | 80 | 80 | 80 | +10 | 81 | 77 | 82 | 80 | 82 | 81 |
| Hanjin BRION | main | mid | Loki | 16 | medium | 75 | 75 | 75 | +4 | 75 | 79 | 72 | 76 | 75 | 74 |
| Hanjin BRION | main | mid | Roamer | 24 | high | 77 | 77 | 77 | +5 | 75 | 78 | 78 | 77 | 79 | 76 |
| Hanjin BRION | main | bot | Teddy | 40 | high | 83 | 83 | 83 | 0 | 85 | 79 | 83 | 83 | 83 | 83 |
| Hanjin BRION | main | support | Namgung | 40 | high | 79 | 79 | 79 | +9 | 78 | 80 | 81 | 76 | 80 | 80 |
| BNK FEARX | main | top | Clear | 39 | high | 74 | 74 | 74 | +4 | 75 | 74 | 74 | 72 | 74 | 74 |
| BNK FEARX | main | jungle | Raptor | 39 | high | 78 | 78 | 78 | +8 | 77 | 79 | 77 | 79 | 74 | 80 |
| BNK FEARX | main | mid | Daystar | 10 | medium | 78 | 78 | 78 | +7 | 79 | 81 | 76 | 79 | 77 | 77 |
| BNK FEARX | main | mid | VicLa | 29 | high | 75 | 75 | 75 | +5 | 73 | 75 | 78 | 75 | 73 | 76 |
| BNK FEARX | main | bot | Slayer | 2 | low | 78 | 78 | 78 | +5 | 77 | 78 | 80 | 78 | 78 | 77 |
| BNK FEARX | main | support | Kellin | 39 | high | 80 | 80 | 80 | -2 | 80 | 80 | 80 | 80 | 81 | 81 |
| Nongshim RedForce | main | top | Kingen | 41 | high | 77 | 77 | 77 | +2 | 77 | 78 | 76 | 78 | 74 | 78 |
| Nongshim RedForce | main | jungle | Sponge | 41 | high | 79 | 79 | 79 | +9 | 79 | 79 | 80 | 79 | 77 | 80 |
| Nongshim RedForce | main | mid | Scout | 41 | high | 79 | 79 | 79 | -1 | 78 | 75 | 83 | 78 | 77 | 80 |
| Nongshim RedForce | main | bot | Diable | 38 | high | 79 | 79 | 79 | -3 | 79 | 80 | 79 | 79 | 76 | 80 |
| Nongshim RedForce | main | bot | Taeyoon | 40 | high | 82 | 82 | 82 | +6 | 81 | 86 | 82 | 83 | 80 | 82 |
| Nongshim RedForce | main | support | Lehends | 34 | high | 78 | 78 | 78 | -1 | 75 | 78 | 82 | 77 | 77 | 79 |
| Nongshim RedForce | main | support | Pleata | 7 | low | 80 | 80 | 80 | +10 | 80 | 80 | 82 | 79 | 80 | 78 |
| Kiwoom DRX | main | top | Rich | 44 | high | 77 | 77 | 77 | +9 | 76 | 83 | 73 | 78 | 79 | 83 |
| Kiwoom DRX | main | jungle | Willer | 44 | high | 81 | 81 | 81 | +12 | 81 | 83 | 82 | 80 | 79 | 81 |
| Kiwoom DRX | main | mid | Ucal | 44 | high | 82 | 82 | 82 | +4 | 83 | 80 | 82 | 82 | 81 | 83 |
| Kiwoom DRX | main | bot | Jiwoo | 5 | low | 78 | 78 | 78 | +8 | 78 | 77 | 79 | 78 | 78 | 77 |
| Kiwoom DRX | main | bot | LazyFeel | 39 | high | 78 | 78 | 78 | +6 | 79 | 76 | 77 | 78 | 78 | 81 |
| Kiwoom DRX | main | support | Andil | 44 | high | 77 | 77 | 77 | +7 | 76 | 77 | 78 | 76 | 77 | 81 |
| DN SOOPers | main | top | DuDu | 37 | high | 75 | 75 | 75 | -1 | 72 | 74 | 81 | 72 | 75 | 67 |
| DN SOOPers | main | jungle | DDoiV | 2 | low | 76 | 76 | 76 | +9 | 76 | 76 | 76 | 76 | 78 | 75 |
| DN SOOPers | main | jungle | Pyosik | 35 | high | 76 | 76 | 76 | +7 | 73 | 82 | 76 | 73 | 73 | 76 |
| DN SOOPers | main | mid | Clozer | 37 | high | 75 | 75 | 75 | +6 | 74 | 74 | 78 | 73 | 78 | 75 |
| DN SOOPers | main | bot | deokdam | 33 | high | 74 | 74 | 74 | +5 | 73 | 78 | 72 | 75 | 73 | 77 |
| DN SOOPers | main | bot | Enosh | 4 | low | 77 | 77 | 77 | +9 | 77 | 78 | 76 | 77 | 78 | 77 |
| DN SOOPers | main | support | Life | 11 | medium | 76 | 76 | 76 | +6 | 76 | 76 | 77 | 75 | 76 | 76 |
| DN SOOPers | main | support | Peter | 18 | medium | 79 | 79 | 79 | +10 | 77 | 81 | 79 | 79 | 77 | 77 |
| DN SOOPers | main | support | Quantum | 8 | low | 78 | 78 | 78 | +12 | 77 | 79 | 78 | 78 | 77 | 77 |

## Largest Overall Differences

| Player | Team | Role | Current OVR | Stat OVR | Delta | Games | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Willer | Kiwoom DRX | jungle | 69 | 81 | +12 | 44 | high |
| Quantum | DN SOOPers | support | 66 | 78 | +12 | 8 | low |
| Gideon | Hanjin BRION | jungle | 70 | 80 | +10 | 40 | high |
| Pleata | Nongshim RedForce | support | 70 | 80 | +10 | 7 | low |
| Peter | DN SOOPers | support | 69 | 79 | +10 | 18 | medium |
| Bluffing | Hanwha Life Esports | support | 71 | 80 | +9 | 3 | low |
| Namgung | Hanjin BRION | support | 70 | 79 | +9 | 40 | high |
| Sponge | Nongshim RedForce | jungle | 70 | 79 | +9 | 41 | high |
| Enosh | DN SOOPers | bot | 68 | 77 | +9 | 4 | low |
| Rich | Kiwoom DRX | top | 68 | 77 | +9 | 44 | high |
| DDoiV | DN SOOPers | jungle | 67 | 76 | +9 | 2 | low |
| Jiwoo | Kiwoom DRX | bot | 70 | 78 | +8 | 5 | low |
| Raptor | BNK FEARX | jungle | 70 | 78 | +8 | 39 | high |
| Sharvel | Dplus KIA | jungle | 73 | 80 | +7 | 3 | low |
| Daystar | BNK FEARX | mid | 71 | 78 | +7 | 10 | medium |
| Doran | T1 | top | 85 | 78 | -7 | 40 | high |
| Andil | Kiwoom DRX | support | 70 | 77 | +7 | 44 | high |
| Pyosik | DN SOOPers | jungle | 69 | 76 | +7 | 35 | high |
| Career | Dplus KIA | support | 78 | 84 | +6 | 42 | high |
| Kanavi | Hanwha Life Esports | jungle | 88 | 82 | -6 | 43 | high |

## Players Not Rated By This Pure Stat Pass

These players are in the current 2026 roster data but do not have a row in the pasted LCK Rounds 1-2 stat table. I did not generate pure stat ratings for them from this source.

- Gen.G: Ripple(academy/top), Courage(academy/jungle), Kemish(academy/mid), MUDAI(academy/bot), SIRIUSS(academy/bot), Lumos(academy/support)
- Hanwha Life Esports: Panther(academy/top), Jackal(academy/jungle), Cracker(academy/mid), Pyeonsik(academy/bot), Valiant(academy/support)
- T1: Haetae(academy/top), Guardian(academy/jungle), Guti(academy/mid), Painter(academy/mid), Cypher(academy/bot), Jinbeom(academy/bot), Cloud(academy/support)
- KT Rolster: Sero(academy/top), Sylvie(academy/jungle), Hwichan(academy/mid), Ghost(academy/bot), Pollu(academy/support)
- Dplus KIA: Jaehyuk(academy/top), Garden(academy/mid), Wayne(academy/bot), Loopy(academy/support)
- Hanjin BRION: DDahyuk(academy/top), Dinai(academy/jungle), Tempester(academy/mid), OddEye(academy/bot), PlanB(academy/support)
- BNK FEARX: Kangin(academy/top), Zephyr(academy/jungle), FIESTA(academy/mid), Luon(academy/support)
- Nongshim RedForce: Janus(academy/top), Mihawk(academy/jungle), SeTab(academy/mid), Lucy(academy/bot)
- Kiwoom DRX: Frog(academy/top), Winner(academy/jungle), AKaJe(academy/mid), Minous(academy/support)
- DN SOOPers: Lancer(academy/top), Flip(academy/mid)
