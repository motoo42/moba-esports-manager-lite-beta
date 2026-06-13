import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import { gameActions } from "../app/state";
import {
  appSettingDefinitions,
  type AppSettingDefinition,
} from "../domain/settings/appSettings";
import { Card } from "../shared/ui/Card";

function getScopeLabel(scope: AppSettingDefinition["scope"]) {
  return scope === "global" ? "전역 설정" : "커리어별 설정";
}

function getStatusLabel(status: AppSettingDefinition["status"]) {
  return status === "active" ? "적용 중" : "후속 예정";
}

export function SettingsPage() {
  const appSettings = useGameSelector((state) => state.appSettings);
  const career = useGameSelector((state) => state.career);
  const dispatch = useGameDispatch();

  return (
    <section className="stack settings-page">
      <Card>
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
      </Card>

      <Card>
        <div className="settings-section">
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
            표시 여부는 브라우저 전역 설정으로 저장됩니다. 각 가이드를 이미
            봤는지 여부는 현재 커리어 저장 데이터에 기록됩니다.
          </p>
        </div>
      </Card>

      <div className="settings-grid">
        {appSettingDefinitions.map((option) => (
          <Card key={option.id}>
            <div className="settings-card-content">
              <div className="settings-option-meta">
                <span>{getScopeLabel(option.scope)}</span>
                <span>{getStatusLabel(option.status)}</span>
              </div>
              <strong>{option.title}</strong>
              <p>{option.description}</p>
              <small>{option.applyTiming}</small>
            </div>
          </Card>
        ))}
      </div>

      {career && (
        <Card>
          <div className="settings-section settings-career-scope-note">
            <span>Career Scope</span>
            <strong>{career.userTeam.name} 커리어에 저장되는 항목</strong>
            <p>
              가이드 읽음 상태, 경기 표시 취향, 메시지/뉴스 빈도처럼 플레이
              흐름에 영향을 주는 값은 커리어 저장 데이터에 보관하는 방향으로
              확장합니다.
            </p>
          </div>
        </Card>
      )}
    </section>
  );
}
