import { useEffect, useState } from "react";
import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import { gameActions } from "../app/state";
import {
  appSettingDefinitions,
  loadDeveloperModeFlag,
  saveDeveloperModeFlag,
  type MessageNewsFrequency,
  type ThemeMode,
} from "../domain/settings/appSettings";
import { GameGuideModal } from "../features/game-guide";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";

const messageNewsFrequencyOptions: Array<{
  description: string;
  id: MessageNewsFrequency;
  label: string;
}> = [
  {
    id: "low",
    label: "낮음",
    description: "큰 업셋이나 강한 이슈만 뉴스 후보로 만듭니다.",
  },
  {
    id: "normal",
    label: "기본",
    description: "실제 플레이 기준의 절제된 메시지 빈도입니다.",
  },
  {
    id: "high",
    label: "높음",
    description: "일반 승패 리뷰도 더 자주 확인합니다.",
  },
  {
    id: "debug",
    label: "디버그",
    description: "테스트를 위해 유저 경기 후 뉴스 후보를 최대한 생성합니다.",
  },
];

const themeModeOptions: Array<{
  id: ThemeMode;
  label: string;
}> = [
  { id: "dark", label: "다크" },
  { id: "light", label: "화이트" },
];

const maxBackgroundMusicVolume = 0.4;
const backgroundMusicVolumeStep = maxBackgroundMusicVolume / 100;

export function SettingsPage() {
  const appSettings = useGameSelector((state) => state.appSettings);
  const dispatch = useGameDispatch();
  const [isGameGuideOpen, setIsGameGuideOpen] = useState(false);
  const [isDeveloperModeEnabled, setIsDeveloperModeEnabled] = useState(
    loadDeveloperModeFlag,
  );
  const plannedSettings = appSettingDefinitions.filter(
    (option) => option.status === "planned",
  );
  const visibleMessageNewsFrequencyOptions = isDeveloperModeEnabled
    ? messageNewsFrequencyOptions
    : messageNewsFrequencyOptions.filter((option) => option.id !== "debug");
  const selectedMessageNewsFrequency =
    visibleMessageNewsFrequencyOptions.some(
      (option) => option.id === appSettings.messageNews.frequency,
    )
      ? appSettings.messageNews.frequency
      : "normal";
  const backgroundMusicVolumePercent = Math.round(
    (appSettings.audio.backgroundMusicVolume / maxBackgroundMusicVolume) * 100,
  );
  const soundEffectsVolumePercent = Math.round(
    appSettings.audio.soundEffectsVolume * 100,
  );
  const selectedThemeMode = appSettings.theme?.mode ?? "dark";

  useEffect(() => {
    if (!isDeveloperModeEnabled && appSettings.messageNews.frequency === "debug") {
      dispatch(gameActions.setMessageNewsFrequency("normal"));
    }
  }, [appSettings.messageNews.frequency, dispatch, isDeveloperModeEnabled]);

  const handleDisableDeveloperMode = () => {
    saveDeveloperModeFlag(false);
    setIsDeveloperModeEnabled(false);

    if (appSettings.messageNews.frequency === "debug") {
      dispatch(gameActions.setMessageNewsFrequency("normal"));
    }
  };

  return (
    <section className="stack settings-page">
      <div className="settings-page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>설정</h1>
        </div>
        <span className="settings-status-chip">Beta</span>
      </div>

      <Card>
        <div className="settings-overview-grid">
          <div className="settings-section">
            <div className="settings-section-header">
              <div>
                <span>Theme</span>
                <strong>화면 테마</strong>
              </div>
            </div>
            <div className="settings-segmented-control" role="group" aria-label="화면 테마">
              {themeModeOptions.map((option) => (
                <button
                  className={
                    selectedThemeMode === option.id
                      ? "settings-segmented-button settings-segmented-button-active"
                      : "settings-segmented-button"
                  }
                  key={option.id}
                  onClick={() => dispatch(gameActions.setThemeMode(option.id))}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <div>
                <span>Guide</span>
                <strong>가이드 안내</strong>
              </div>
            </div>
            <label className="settings-toggle-row">
              <input
                checked={appSettings.guides.showFirstEntryGuides}
                onChange={(event) =>
                  dispatch(
                    gameActions.setFirstEntryGuidesEnabled(event.target.checked),
                  )
                }
                type="checkbox"
              />
              <span>
                <strong>최초 진입 가이드 자동 표시</strong>
              </span>
            </label>
            <div className="settings-guide-actions">
              <Button variant="ghost" onClick={() => setIsGameGuideOpen(true)}>
                게임 기초 가이드 보기
              </Button>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <div>
                <span>Audio</span>
                <strong>오디오</strong>
              </div>
            </div>
            <label className="settings-toggle-row">
              <input
                checked={appSettings.audio.backgroundMusicEnabled}
                onChange={(event) =>
                  dispatch(
                    gameActions.setBackgroundMusicEnabled(event.target.checked),
                  )
                }
                type="checkbox"
              />
              <span>
                <strong>배경음 재생</strong>
              </span>
            </label>
            <div className="settings-field-row">
              <label htmlFor="background-music-volume">
                <strong>배경음 볼륨</strong>
              </label>
              <div className="settings-range-control">
                <input
                  id="background-music-volume"
                  max={maxBackgroundMusicVolume}
                  min="0"
                  onChange={(event) =>
                    dispatch(
                      gameActions.setBackgroundMusicVolume(
                        Number(event.target.value),
                      ),
                    )
                  }
                  step={backgroundMusicVolumeStep}
                  type="range"
                  value={appSettings.audio.backgroundMusicVolume}
                />
                <span>{backgroundMusicVolumePercent}%</span>
              </div>
            </div>
            <label className="settings-toggle-row">
              <input
                checked={appSettings.audio.soundEffectsEnabled}
                onChange={(event) =>
                  dispatch(
                    gameActions.setSoundEffectsEnabled(event.target.checked),
                  )
                }
                type="checkbox"
              />
              <span>
                <strong>효과음 재생</strong>
              </span>
            </label>
            <div className="settings-field-row">
              <label htmlFor="sound-effects-volume">
                <strong>효과음 볼륨</strong>
              </label>
              <div className="settings-range-control">
                <input
                  id="sound-effects-volume"
                  max="1"
                  min="0"
                  onChange={(event) =>
                    dispatch(
                      gameActions.setSoundEffectsVolume(
                        Number(event.target.value),
                      ),
                    )
                  }
                  step="0.01"
                  type="range"
                  value={appSettings.audio.soundEffectsVolume}
                />
                <span>{soundEffectsVolumePercent}%</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <div>
                <span>Message / AI</span>
                <strong>메시지 / AI</strong>
              </div>
            </div>
            <label className="settings-toggle-row">
              <input
                checked={appSettings.messageNews.aiNewsEnabled}
                onChange={(event) =>
                  dispatch(gameActions.setAiNewsEnabled(event.target.checked))
                }
                type="checkbox"
              />
              <span>
                <strong>AI 뉴스 생성</strong>
              </span>
            </label>
            <div className="settings-field-row">
              <label htmlFor="message-news-frequency">
                <strong>메시지/뉴스 빈도</strong>
              </label>
              <select
                id="message-news-frequency"
                onChange={(event) =>
                  dispatch(
                    gameActions.setMessageNewsFrequency(
                      event.target.value as MessageNewsFrequency,
                    ),
                  )
                }
                value={selectedMessageNewsFrequency}
              >
                {visibleMessageNewsFrequencyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isDeveloperModeEnabled && (
            <div className="settings-section settings-advanced-panel">
              <div className="settings-section-header">
                <div>
                  <span>Advanced</span>
                  <strong>고급 설정</strong>
                </div>
              </div>
              <>
                <div className="settings-field-row">
                  <label htmlFor="developer-message-news-frequency">
                    <strong>개발자 뉴스 빈도</strong>
                  </label>
                  <select
                    id="developer-message-news-frequency"
                    onChange={(event) =>
                      dispatch(
                        gameActions.setMessageNewsFrequency(
                          event.target.value as MessageNewsFrequency,
                        ),
                      )
                    }
                    value={appSettings.messageNews.frequency}
                  >
                    {messageNewsFrequencyOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="ghost" onClick={handleDisableDeveloperMode}>
                  개발자 모드 끄기
                </Button>
              </>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="settings-planned-section">
          <div className="settings-section-header">
            <div>
              <span>Roadmap</span>
              <strong>후속 예정 설정</strong>
            </div>
          </div>
          <div className="settings-planned-list">
            {plannedSettings.map((option) => (
              <article key={option.id}>
                <div>
                  <strong>{option.title}</strong>
                  <p>{option.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Card>
      {isGameGuideOpen && (
        <GameGuideModal onClose={() => setIsGameGuideOpen(false)} />
      )}
    </section>
  );
}
