export type BackgroundMusicCandidate = {
  id: "diaphanous" | "synapse";
  title: string;
  artist: string;
  sourceUrl: string;
  license: "CC BY 4.0";
  processedPath: string;
  processingNote: string;
};

export const defaultBackgroundMusicCandidateId: BackgroundMusicCandidate["id"] =
  "synapse";

export const backgroundMusicCandidates: BackgroundMusicCandidate[] = [
  {
    id: "diaphanous",
    title: "Diaphanous",
    artist: "Shane Ivers",
    sourceUrl: "https://www.silvermansound.com/free-music/diaphanous",
    license: "CC BY 4.0",
    processedPath: "/audio/bgm/diaphanous-bgm-soft.mp3",
    processingNote:
      "High frequencies softened, peaks normalized, and re-encoded at 96kbps for in-game background use.",
  },
  {
    id: "synapse",
    title: "Synapse",
    artist: "Shane Ivers",
    sourceUrl: "https://www.silvermansound.com/free-music/synapse",
    license: "CC BY 4.0",
    processedPath: "/audio/bgm/synapse-bgm-drum-soft-v2.mp3",
    processingNote:
      "Drum-heavy ranges softened with EQ, transients lightly compressed, peaks normalized, and re-encoded at 96kbps for in-game background use.",
  },
];

export function getBackgroundMusicCandidate(
  id: BackgroundMusicCandidate["id"],
) {
  return backgroundMusicCandidates.find((candidate) => candidate.id === id);
}
