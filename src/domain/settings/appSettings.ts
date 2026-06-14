export type AppSettings = {
  schemaVersion: 1;
  theme: {
    mode: ThemeMode;
  };
  audio: {
    backgroundMusicEnabled: boolean;
    backgroundMusicVolume: number;
    soundEffectsEnabled: boolean;
    soundEffectsVolume: number;
  };
  guides: {
    showFirstEntryGuides: boolean;
  };
  messageNews: {
    aiNewsEnabled: boolean;
    frequency: MessageNewsFrequency;
  };
};

export type ThemeMode = "dark" | "light";

export type MessageNewsFrequency = "low" | "normal" | "high" | "debug";

export type AppSettingScope = "global" | "career";

export type AppSettingStatus = "active" | "planned";

export type AppSettingDefinition = {
  id: string;
  title: string;
  description: string;
  scope: AppSettingScope;
  applyTiming: string;
  status: AppSettingStatus;
};

const appSettingsStorageKey = "moba-esports-manager-lite:app-settings:v1";
const developerModeStorageKey = "moba-esports-manager-lite:developer-mode";

export const defaultAppSettings: AppSettings = {
  schemaVersion: 1,
  theme: {
    mode: "dark",
  },
  audio: {
    backgroundMusicEnabled: true,
    backgroundMusicVolume: 0.14,
    soundEffectsEnabled: true,
    soundEffectsVolume: 1,
  },
  guides: {
    showFirstEntryGuides: true,
  },
  messageNews: {
    aiNewsEnabled: true,
    frequency: "normal",
  },
};

export const appSettingDefinitions: AppSettingDefinition[] = [
  {
    id: "guides",
    title: "튜토리얼/가이드 다시 보기",
    description:
      "주요 화면 최초 진입 가이드를 전역 설정으로 제어하고, 읽음 상태는 커리어별로 저장합니다.",
    scope: "global",
    applyTiming: "즉시 적용",
    status: "active",
  },
  {
    id: "autosave",
    title: "자동 저장 여부/주기",
    description:
      "현재 자동 저장은 기본값으로 동작하며, 주기와 비활성화 옵션은 후속 설정으로 분리합니다.",
    scope: "global",
    applyTiming: "다음 저장 체크부터 적용 예정",
    status: "planned",
  },
  {
    id: "screen-density",
    title: "화면 밀도 또는 UI 축약",
    description:
      "정보량이 많은 관리 화면을 넓게/간결하게 바꾸는 표시 옵션입니다.",
    scope: "global",
    applyTiming: "화면 즉시 반영 예정",
    status: "planned",
  },
  {
    id: "match-presentation",
    title: "경기 진행 속도/결과 표시",
    description:
      "경기 진행 연출과 결과 요약 방식을 커리어 플레이 취향에 맞춰 조정합니다.",
    scope: "career",
    applyTiming: "다음 경기부터 적용 예정",
    status: "planned",
  },
  {
    id: "message-frequency",
    title: "메시지/뉴스 노출 빈도",
    description:
      "메시지함과 뉴스 생성 빈도를 커리어별 진행 템포에 맞춰 조정합니다.",
    scope: "career",
    applyTiming: "다음 턴부터 적용",
    status: "active",
  },
  {
    id: "accessibility",
    title: "접근성 관련 표시 옵션",
    description:
      "색 대비, 숫자 보조 표시, 모션 축소 같은 읽기 지원 옵션을 전역으로 관리합니다.",
    scope: "global",
    applyTiming: "화면 즉시 반영 예정",
    status: "planned",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function getBrowserStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function clampBackgroundMusicVolume(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultAppSettings.audio.backgroundMusicVolume;
  }

  return Math.min(0.4, Math.max(0, value));
}

function clampSoundEffectsVolume(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultAppSettings.audio.soundEffectsVolume;
  }

  return Math.min(1, Math.max(0, value));
}

function hasDeveloperModeUrlFlag() {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return (
    searchParams.get("dev") === "1" ||
    searchParams.get("developer") === "1"
  );
}

export function loadDeveloperModeFlag(): boolean {
  const storage = getBrowserStorage();

  if (!storage) {
    return false;
  }

  if (hasDeveloperModeUrlFlag()) {
    storage.setItem(developerModeStorageKey, "1");
    return true;
  }

  return storage.getItem(developerModeStorageKey) === "1";
}

export function saveDeveloperModeFlag(enabled: boolean): void {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  if (enabled) {
    storage.setItem(developerModeStorageKey, "1");
    return;
  }

  storage.removeItem(developerModeStorageKey);
}

export function normalizeAppSettings(value: unknown): AppSettings {
  const source = isRecord(value) ? value : {};
  const theme = isRecord(source.theme) ? source.theme : {};
  const audio = isRecord(source.audio) ? source.audio : {};
  const guides = isRecord(source.guides) ? source.guides : {};
  const messageNews = isRecord(source.messageNews) ? source.messageNews : {};
  const themeMode =
    theme.mode === "dark" || theme.mode === "light"
      ? theme.mode
      : defaultAppSettings.theme.mode;
  const frequency =
    messageNews.frequency === "low" ||
    messageNews.frequency === "normal" ||
    messageNews.frequency === "high" ||
    messageNews.frequency === "debug"
      ? messageNews.frequency
      : defaultAppSettings.messageNews.frequency;

  return {
    schemaVersion: 1,
    theme: {
      mode: themeMode,
    },
    audio: {
      backgroundMusicEnabled:
        typeof audio.backgroundMusicEnabled === "boolean"
          ? audio.backgroundMusicEnabled
          : defaultAppSettings.audio.backgroundMusicEnabled,
      backgroundMusicVolume: clampBackgroundMusicVolume(
        audio.backgroundMusicVolume,
      ),
      soundEffectsEnabled:
        typeof audio.soundEffectsEnabled === "boolean"
          ? audio.soundEffectsEnabled
          : defaultAppSettings.audio.soundEffectsEnabled,
      soundEffectsVolume: clampSoundEffectsVolume(audio.soundEffectsVolume),
    },
    guides: {
      showFirstEntryGuides:
        typeof guides.showFirstEntryGuides === "boolean"
          ? guides.showFirstEntryGuides
          : defaultAppSettings.guides.showFirstEntryGuides,
    },
    messageNews: {
      aiNewsEnabled:
        typeof messageNews.aiNewsEnabled === "boolean"
          ? messageNews.aiNewsEnabled
          : defaultAppSettings.messageNews.aiNewsEnabled,
      frequency,
    },
  };
}

export function loadAppSettings(): AppSettings {
  const storage = getBrowserStorage();

  if (!storage) {
    return defaultAppSettings;
  }

  loadDeveloperModeFlag();

  try {
    return normalizeAppSettings(
      JSON.parse(storage.getItem(appSettingsStorageKey) ?? "null"),
    );
  } catch {
    return defaultAppSettings;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  storage.setItem(
    appSettingsStorageKey,
    JSON.stringify(normalizeAppSettings(settings)),
  );
}

export function setThemeMode(
  settings: AppSettings,
  mode: ThemeMode,
): AppSettings {
  return {
    ...settings,
    theme: {
      ...(settings.theme ?? defaultAppSettings.theme),
      mode,
    },
  };
}

export function setFirstEntryGuidesEnabled(
  settings: AppSettings,
  enabled: boolean,
): AppSettings {
  return {
    ...settings,
    guides: {
      ...settings.guides,
      showFirstEntryGuides: enabled,
    },
  };
}

export function setBackgroundMusicEnabled(
  settings: AppSettings,
  enabled: boolean,
): AppSettings {
  return {
    ...settings,
    audio: {
      ...settings.audio,
      backgroundMusicEnabled: enabled,
    },
  };
}

export function setBackgroundMusicVolume(
  settings: AppSettings,
  volume: number,
): AppSettings {
  return {
    ...settings,
    audio: {
      ...settings.audio,
      backgroundMusicVolume: clampBackgroundMusicVolume(volume),
    },
  };
}

export function setSoundEffectsEnabled(
  settings: AppSettings,
  enabled: boolean,
): AppSettings {
  return {
    ...settings,
    audio: {
      ...settings.audio,
      soundEffectsEnabled: enabled,
    },
  };
}

export function setSoundEffectsVolume(
  settings: AppSettings,
  volume: number,
): AppSettings {
  return {
    ...settings,
    audio: {
      ...settings.audio,
      soundEffectsVolume: clampSoundEffectsVolume(volume),
    },
  };
}

export function setAiNewsEnabled(
  settings: AppSettings,
  enabled: boolean,
): AppSettings {
  return {
    ...settings,
    messageNews: {
      ...settings.messageNews,
      aiNewsEnabled: enabled,
    },
  };
}

export function setMessageNewsFrequency(
  settings: AppSettings,
  frequency: MessageNewsFrequency,
): AppSettings {
  return {
    ...settings,
    messageNews: {
      ...settings.messageNews,
      frequency,
    },
  };
}
