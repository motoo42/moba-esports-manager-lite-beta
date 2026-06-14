import { useEffect, useRef } from "react";
import {
  defaultBackgroundMusicCandidateId,
  getBackgroundMusicCandidate,
} from "../audio/backgroundMusicCandidates";

const defaultFadeDurationMs = 1800;

function clampVolume(volume: number) {
  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.min(1, Math.max(0, volume));
}

function fadeAudioVolume(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs = defaultFadeDurationMs,
) {
  const startVolume = audio.volume;
  const startedAt = window.performance.now();

  const timerId = window.setInterval(() => {
    const elapsed = window.performance.now() - startedAt;
    const progress = Math.min(1, elapsed / durationMs);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    audio.volume =
      startVolume + (targetVolume - startVolume) * easedProgress;

    if (progress >= 1) {
      audio.volume = targetVolume;
      window.clearInterval(timerId);
    }
  }, 50);

  return timerId;
}

type UseBackgroundMusicOptions = {
  enabled: boolean;
  volume: number;
};

export function useBackgroundMusic({
  enabled,
  volume,
}: UseBackgroundMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasUserGestureRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  const targetVolume = clampVolume(volume);
  const enabledRef = useRef(enabled);
  const targetVolumeRef = useRef(targetVolume);

  useEffect(() => {
    enabledRef.current = enabled;
    targetVolumeRef.current = targetVolume;
  }, [enabled, targetVolume]);

  useEffect(() => {
    const candidate = getBackgroundMusicCandidate(
      defaultBackgroundMusicCandidateId,
    );

    if (!candidate) {
      return;
    }

    const audio = new Audio(candidate.processedPath);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearInterval(fadeTimerRef.current);
      }

      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (!enabled) {
      audio.pause();
      audio.volume = 0;
      return;
    }

    const startPlayback = () => {
      hasUserGestureRef.current = true;

      void audio
        .play()
        .then(() => {
          if (!enabledRef.current) {
            audio.pause();
            audio.volume = 0;
            return;
          }

          if (fadeTimerRef.current !== null) {
            window.clearInterval(fadeTimerRef.current);
          }

          fadeTimerRef.current = fadeAudioVolume(
            audio,
            targetVolumeRef.current,
          );
        })
        .catch(() => {
          audio.volume = 0;
        });
    };

    if (hasUserGestureRef.current) {
      startPlayback();
      return;
    }

    const handleFirstGesture = () => {
      startPlayback();
    };

    window.addEventListener("pointerdown", handleFirstGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, [enabled, targetVolume]);
}
