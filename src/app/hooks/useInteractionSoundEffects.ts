import { useEffect } from "react";

const clickCooldownMs = 40;
const bubbleClickDuration = 0.12;
const bubbleClickVolume = 0.12;
const bubbleClickStartFrequency = 500;
const bubbleClickEndFrequency = 300;

const interactiveSelector = [
  "button:not(:disabled)",
  "a[href]",
  "[role='button']",
  "select",
  "input[type='checkbox']",
  "input[type='radio']",
].join(",");

function getInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  const element = target.closest(interactiveSelector);
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const button = element.closest("button");
  if (button instanceof HTMLButtonElement && button.disabled) {
    return null;
  }

  if (element.getAttribute("aria-disabled") === "true") {
    return null;
  }

  return element;
}

function createAudioContext() {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

function clampVolume(volume: number) {
  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.min(1, Math.max(0, volume));
}

function playBubbleClick(audioContext: AudioContext, volume: number) {
  try {
    const targetVolume = bubbleClickVolume * clampVolume(volume);

    if (targetVolume <= 0) {
      return;
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(bubbleClickStartFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      bubbleClickEndFrequency,
      now + bubbleClickDuration,
    );

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.setValueAtTime(0.8, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      targetVolume,
      now + 0.012,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + bubbleClickDuration,
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + bubbleClickDuration);
  } catch {
    // Keep UI interactions silent rather than surfacing audio playback errors.
  }
}

type UseInteractionSoundEffectsOptions = {
  enabled: boolean;
  volume: number;
};

export function useInteractionSoundEffects({
  enabled,
  volume,
}: UseInteractionSoundEffectsOptions) {
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let lastClickPlayedAt = 0;

    const handlePointerDown = (event: PointerEvent) => {
      if (!enabled) {
        return;
      }

      if (!getInteractiveElement(event.target)) {
        return;
      }

      const now = window.performance.now();
      if (now - lastClickPlayedAt < clickCooldownMs) {
        return;
      }

      lastClickPlayedAt = now;
      audioContext ??= createAudioContext();

      if (!audioContext) {
        return;
      }

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      playBubbleClick(audioContext, volume);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      void audioContext?.close();
    };
  }, [enabled, volume]);
}
