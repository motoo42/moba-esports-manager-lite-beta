import { Card } from "../shared/ui/Card";

export function SettingsPage() {
  return (
    <section className="stack settings-page">
      <Card>
        <div className="settings-hero">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>설정</h1>
            <p>
              베타 기간에는 플레이 흐름을 방해하지 않는 기본 안내와 향후
              설정 확장 위치를 먼저 정리합니다.
            </p>
          </div>
          <span className="settings-status-chip">Beta</span>
        </div>
      </Card>

      <div className="settings-grid">
        <Card>
          <div className="settings-card-content">
            <span>게임 설정</span>
            <strong>기본 진행 옵션</strong>
            <p>
              자동 저장, 진행 버튼, 경기 표시 방식 같은 플레이 옵션을 이후
              이 화면에서 관리합니다.
            </p>
          </div>
        </Card>
        <Card>
          <div className="settings-card-content">
            <span>저장 / 베타 안내</span>
            <strong>저장 데이터는 데이터 저장 메뉴에서 관리</strong>
            <p>
              저장 슬롯 생성, 불러오기, 삭제는 별도 데이터 저장 화면에서
              처리합니다.
            </p>
          </div>
        </Card>
        <Card>
          <div className="settings-card-content">
            <span>화면 지원 정책</span>
            <strong>PC / 큰 가로 화면 권장</strong>
            <p>
              MOBA Esports Manager Lite는 PC, 노트북, 태블릿 가로 화면에
              최적화되어 있습니다.
            </p>
          </div>
        </Card>
        <Card>
          <div className="settings-card-content">
            <span>후속 설정</span>
            <strong>화면, 알림, 사운드</strong>
            <p>
              메시지 알림, 화면 밀도, 경기 연출 설정은 후속 작업에서 이곳에
              추가합니다.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
