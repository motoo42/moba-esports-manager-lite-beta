import { useEffect, useMemo, useState } from "react";
import {
  createCareerSave,
  getCareerSave,
  isSaveConflictError,
  listCareerSaves,
  updateCareerSave,
  type CareerSaveDto,
} from "../../services/careerSavesApi";
import type { CareerSave } from "../../types/game";

type SaveManagerVariant = "panel" | "topbar";
export type AutoSaveStatusKind =
  | "idle"
  | "saving"
  | "saved"
  | "failed"
  | "conflict";

export type AutoSaveStatus = {
  kind: AutoSaveStatusKind;
  message: string;
};

type SaveManagerProps = {
  activeSaveId: string | null;
  activeSaveRevision?: number | null;
  autoSaveStatus?: AutoSaveStatus;
  career: CareerSave | null;
  committedSave?: CareerSaveDto | null;
  disabled?: boolean;
  onActiveSaveChange: (saveId: string | null) => void;
  onLoadCareer: (career: CareerSave, saveId: string) => void;
  onSaveCommitted?: (save: CareerSaveDto) => void;
  variant?: SaveManagerVariant;
};

function getDefaultSaveName(career: CareerSave | null) {
  return career ? `${career.userTeam.name} S${career.currentSeason}` : "";
}

function getSaveOptionLabel(save: CareerSaveDto) {
  return `${save.saveName} · ${save.summary.currentDateLabel}`;
}

export function SaveManager({
  activeSaveId,
  activeSaveRevision = null,
  autoSaveStatus,
  career,
  committedSave,
  disabled = false,
  onActiveSaveChange,
  onLoadCareer,
  onSaveCommitted,
  variant = "topbar",
}: SaveManagerProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [saveName, setSaveName] = useState(getDefaultSaveName(career));
  const [saves, setSaves] = useState<CareerSaveDto[]>([]);
  const [selectedSaveId, setSelectedSaveId] = useState(activeSaveId ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const canSave = Boolean(career) && !disabled && !isBusy;
  const canLoad = Boolean(selectedSaveId) && !disabled && !isBusy;
  const isPanel = variant === "panel";
  const selectedSave = useMemo(
    () => saves.find((save) => save.id === selectedSaveId),
    [saves, selectedSaveId],
  );

  useEffect(() => {
    setSaveName((current) => current || getDefaultSaveName(career));
  }, [career]);

  useEffect(() => {
    if (activeSaveId) {
      setSelectedSaveId(activeSaveId);
    }
  }, [activeSaveId]);

  useEffect(() => {
    if (!committedSave) {
      return;
    }

    setSaves((currentSaves) => [
      committedSave,
      ...currentSaves.filter((save) => save.id !== committedSave.id),
    ]);
    setSelectedSaveId(committedSave.id);
    setSaveName(committedSave.saveName);
  }, [committedSave]);

  async function refreshSaves() {
    setIsBusy(true);

    try {
      const nextSaves = await listCareerSaves();

      setSaves(nextSaves);
      setStatusMessage(
        nextSaves.length > 0 ? "저장 목록 동기화됨" : "저장 슬롯 없음",
      );

      if (!selectedSaveId && nextSaves[0]) {
        setSelectedSaveId(nextSaves[0].id);
      }
    } catch {
      setStatusMessage("저장 서버 연결 대기 중");
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void refreshSaves();
    // Save list should refresh only when this control appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!career) {
      return;
    }

    setIsBusy(true);

    try {
      const save = activeSaveId
        ? await updateCareerSave({
            career,
            expectedRevision: activeSaveRevision,
            saveId: activeSaveId,
            saveName: saveName || undefined,
          })
        : await createCareerSave({
            career,
            saveName: saveName || undefined,
          });

      onActiveSaveChange(save.id);
      onSaveCommitted?.(save);
      setSelectedSaveId(save.id);
      setStatusMessage(activeSaveId ? "저장 슬롯 갱신됨" : "새 저장 생성됨");
      await refreshSaves();
    } catch (error) {
      setStatusMessage(
        isSaveConflictError(error) ? "저장 충돌: 새로고침 필요" : "저장 실패",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateSave() {
    if (!career) {
      return;
    }

    setIsBusy(true);

    try {
      const save = await createCareerSave({
        career,
        saveName: saveName || undefined,
      });

      onActiveSaveChange(save.id);
      onSaveCommitted?.(save);
      setSelectedSaveId(save.id);
      setStatusMessage("새 저장 생성됨");
      await refreshSaves();
    } catch {
      setStatusMessage("새 저장 실패");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLoad() {
    if (!selectedSaveId) {
      return;
    }

    setIsBusy(true);

    try {
      const save = await getCareerSave(selectedSaveId);

      if (!save.career) {
        throw new Error("Save payload is missing.");
      }

      onActiveSaveChange(save.id);
      onSaveCommitted?.(save);
      onLoadCareer(save.career, save.id);
      setSaveName(save.saveName);
      setStatusMessage("저장 불러옴");
    } catch {
      setStatusMessage("불러오기 실패");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className={`save-manager save-manager-${variant}`}>
      {isPanel && (
        <div>
          <p className="eyebrow">MongoDB Save</p>
          <h2>저장 불러오기</h2>
        </div>
      )}
      {career && (
        <input
          aria-label="Save name"
          disabled={disabled || isBusy}
          maxLength={60}
          onChange={(event) => setSaveName(event.target.value)}
          placeholder={getDefaultSaveName(career)}
          value={saveName}
        />
      )}
      <select
        aria-label="Save slot"
        disabled={disabled || isBusy || saves.length === 0}
        onChange={(event) => setSelectedSaveId(event.target.value)}
        value={selectedSaveId}
      >
        <option value="">저장 슬롯 선택</option>
        {saves.map((save) => (
          <option key={save.id} value={save.id}>
            {getSaveOptionLabel(save)}
          </option>
        ))}
      </select>
      <div className="save-manager-actions">
        {career && (
          <>
            <button disabled={!canSave} onClick={handleSave} type="button">
              저장
            </button>
            <button disabled={!canSave} onClick={handleCreateSave} type="button">
              새 저장
            </button>
          </>
        )}
        <button disabled={!canLoad} onClick={handleLoad} type="button">
          불러오기
        </button>
        <button disabled={disabled || isBusy} onClick={refreshSaves} type="button">
          새로고침
        </button>
      </div>
      <span className="save-manager-status">
        {isBusy
          ? "처리 중"
          : statusMessage || selectedSave?.saveName || "저장 서버 확인 중"}
      </span>
      {career && autoSaveStatus && (
        <span
          className={`save-manager-autosave save-manager-autosave-${autoSaveStatus.kind}`}
        >
          {autoSaveStatus.message}
        </span>
      )}
    </section>
  );
}
