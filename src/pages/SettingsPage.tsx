import { useEffect, useState } from "react";
import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import { gameActions } from "../app/state";
import {
  appSettingDefinitions,
  loadDeveloperModeFlag,
  saveDeveloperModeFlag,
  type AppSettingDefinition,
  type MessageNewsFrequency,
} from "../domain/settings/appSettings";
import { GameGuideModal } from "../features/game-guide";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";

function getScopeLabel(scope: AppSettingDefinition["scope"]) {
  return scope === "global" ? "전역 설정" : "커리어별 설정";
}

function getStatusLabel(status: AppSettingDefinition["status"]) {
  return status === "active" ? "적용 중" : "후속 예정";
}

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

export function SettingsPage() {
  const appSettings = useGameSelector((state) => state.appSettings);
  const career = useGameSelector((state) => state.career);
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
  const selectedMessageNewsFrequencyDescription =
    visibleMessageNewsFrequencyOptions.find(
      (option) => option.id === selectedMessageNewsFrequency,
    )?.description;

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
      <Card>
        <div className="settings-overview-grid">
          <div className="settings-hero">
            <div>
              <p className="eyebrow">Settings</p>
              <h1>설정</h1>
              <p>
                베타 기간에는 바로 동작하는 핵심 옵션부터 전역 설정과 커리어별
                설정을 분리해 정리합니다.
              </p>
            </div>
            <span className="settings-status-chip">Beta</span>
          </div>

          <div className="settings-section settings-guide-panel">
            <div className="settings-section-header">
              <div>
                <span>Guide</span>
                <strong>가이드 안내</strong>
              </div>
              <span className="settings-option-badge">전역 / 즉시 적용</span>
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
                <small>
                  새 커리어나 아직 보지 않은 주요 화면에서 짧은 가이드를
                  자동으로 엽니다.
                </small>
              </span>
            </label>
            <p className="settings-save-note">
              표시 여부는 전역 설정으로, 읽음 상태는 현재 커리어 저장 데이터로
              관리합니다.
            </p>
            <div className="settings-guide-actions">
              <Button variant="ghost" onClick={() => setIsGameGuideOpen(true)}>
                게임 기초 가이드 보기
              </Button>
            </div>
            {career && (
              <p className="settings-save-note">
                {career.userTeam.name} 커리어에는 가이드 읽음 상태와 플레이 흐름
                관련 값이 저장됩니다.
              </p>
            )}
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <div>
                <span>Message / AI</span>
                <strong>메시지 / AI</strong>
              </div>
              <span className="settings-option-badge">전역 / 다음 턴</span>
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
                <small>
                  켜져 있으면 뉴스 후보를 서버 Gemini 파이프라인으로 보강합니다.
                  실패해도 기존 템플릿 뉴스가 유지됩니다.
                </small>
              </span>
            </label>
            <div className="settings-field-row">
              <label htmlFor="message-news-frequency">
                <strong>메시지/뉴스 빈도</strong>
                <small>
                  메시지함과 뉴스 후보 생성 빈도를 플레이 템포에 맞춰 조절합니다.
                </small>
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
            <p className="settings-save-note">
              {selectedMessageNewsFrequencyDescription}
            </p>
          </div>

          <div className="settings-section settings-advanced-panel">
            <div className="settings-section-header">
              <div>
                <span>Advanced</span>
                <strong>고급 설정</strong>
              </div>
              <span className="settings-option-badge">
                {isDeveloperModeEnabled ? "개발자 모드" : "일반 모드"}
              </span>
            </div>
            {isDeveloperModeEnabled ? (
              <>
                <div className="settings-field-row">
                  <label htmlFor="developer-message-news-frequency">
                    <strong>개발자 뉴스 빈도</strong>
                    <small>
                      디버그 빈도는 테스트용으로 뉴스 생성 조건을 크게 완화합니다.
                    </small>
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
            ) : (
              <p className="settings-save-note">
                일반 플레이에서는 내부 테스트 옵션을 숨겨 설정 화면을 간결하게
                유지합니다.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="settings-planned-section">
          <div className="settings-section-header">
            <div>
              <span>Roadmap</span>
              <strong>후속 예정 설정</strong>
            </div>
            <span className="settings-option-badge">압축 목록</span>
          </div>
          <div className="settings-planned-list">
            {plannedSettings.map((option) => (
              <article key={option.id}>
                <div>
                  <strong>{option.title}</strong>
                  <p>{option.description}</p>
                </div>
                <div className="settings-planned-meta">
                  <span>{getStatusLabel(option.status)}</span>
                  <span>{getScopeLabel(option.scope)}</span>
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
