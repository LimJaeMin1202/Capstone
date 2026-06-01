import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import BirthYearModal from "./BirthYearModal";

interface Props {
  onClose: () => void;
}

// 통합 설정 모달
// 향후 항목 추가: 비밀번호 변경, 알림 설정 등
export default function SettingsModal({ onClose }: Props) {
  const { user, setName } = useAuth();
  const [editingBirthYear, setEditingBirthYear] = useState(false);

  // 이름 인라인 편집
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const birthYearLabel = user?.birthYear
    ? `${Math.floor(user.birthYear / 10) * 10}년대`
    : "미설정";

  function startEditName() {
    setNameInput(user?.name ?? "");
    setNameError(null);
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
    setNameError(null);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("이름을 입력해주세요");
      return;
    }
    if (trimmed.length > 20) {
      setNameError("이름은 20자 이내로 입력해주세요");
      return;
    }
    setNameError(null);
    setNameBusy(true);
    try {
      await setName(trimmed);
      setEditingName(false);
    } catch (err) {
      setNameError((err as Error).message);
    } finally {
      setNameBusy(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-card modal-card-wide"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="modal-title">설정</h2>

          <div className="settings-section">
            <h3 className="settings-section-title">내 정보</h3>

            {/* 이름 — 인라인 편집 */}
            {editingName ? (
              <div className="settings-row settings-row-editing">
                <div className="settings-row-label">이름</div>
                <input
                  type="text"
                  className="settings-row-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="이름 입력"
                  disabled={nameBusy}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    else if (e.key === "Escape") cancelEditName();
                  }}
                />
                <button
                  type="button"
                  className="settings-edit-btn"
                  onClick={saveName}
                  disabled={nameBusy}
                >
                  {nameBusy ? "저장 중" : "저장"}
                </button>
                <button
                  type="button"
                  className="settings-cancel-btn"
                  onClick={cancelEditName}
                  disabled={nameBusy}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="settings-row">
                <div className="settings-row-label">이름</div>
                <div className="settings-row-value">{user?.name ?? "-"}</div>
                <button
                  type="button"
                  className="settings-edit-btn"
                  onClick={startEditName}
                >
                  변경
                </button>
              </div>
            )}
            {nameError && (
              <p className="auth-error" style={{ marginTop: -4 }}>
                {nameError}
              </p>
            )}

            <div className="settings-row">
              <div className="settings-row-label">아이디</div>
              <div className="settings-row-value">{user?.username ?? "-"}</div>
            </div>

            <div className="settings-row">
              <div className="settings-row-label">연령대</div>
              <div className="settings-row-value">{birthYearLabel}</div>
              <button
                type="button"
                className="settings-edit-btn"
                onClick={() => setEditingBirthYear(true)}
              >
                변경
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="auth-submit"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 연령대 변경 모달 (중첩) */}
      {editingBirthYear && (
        <BirthYearModal
          mode="edit"
          onClose={() => setEditingBirthYear(false)}
        />
      )}
    </>
  );
}
