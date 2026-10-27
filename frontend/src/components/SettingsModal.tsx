import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import BirthYearModal from "./BirthYearModal";
import { fetchMyGoal, updateMyGoal, type UserGoal } from "../api/goals";

interface Props {
  onClose: () => void;
  onLogout: () => void;
}

// 통합 설정 모달
// 향후 항목 추가: 비밀번호 변경, 알림 설정 등
export default function SettingsModal({ onClose, onLogout }: Props) {
  const { user, setName } = useAuth();
  const [editingBirthYear, setEditingBirthYear] = useState(false);

  // 이름 인라인 편집
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // 운동 목표
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [sessionInput, setSessionInput] = useState("");
  const [minuteInput, setMinuteInput] = useState("");
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  function loadGoal() {
    setGoalError(null);
    fetchMyGoal()
      .then(setGoal)
      .catch(() => setGoalError("운동 목표를 불러오지 못했습니다. 재시도해주세요."));
  }

  useEffect(() => {
    fetchMyGoal()
      .then(setGoal)
      .catch(() => setGoalError("운동 목표를 불러오지 못했습니다. 재시도해주세요."));
  }, []);

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

  function startEditGoal() {
    if (!goal) return;
    setSessionInput(String(goal.weeklySessionTarget));
    setMinuteInput(String(goal.weeklyMinuteTarget));
    setGoalError(null);
    setEditingGoal(true);
  }

  function cancelEditGoal() {
    setEditingGoal(false);
    setGoalError(null);
  }

  async function saveGoal() {
    const sessions = Number(sessionInput);
    const minutes = Number(minuteInput);
    if (!Number.isInteger(sessions) || sessions < 1 || sessions > 50) {
      setGoalError("운동 횟수는 1~50회 사이로 입력해주세요");
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1000) {
      setGoalError("운동 시간은 1~1000분 사이로 입력해주세요");
      return;
    }
    setGoalError(null);
    setGoalBusy(true);
    try {
      const updated = await updateMyGoal(sessions, minutes);
      setGoal(updated);
      setEditingGoal(false);
    } catch (err) {
      setGoalError((err as Error).message);
    } finally {
      setGoalBusy(false);
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

          <div className="settings-section">
            <h3 className="settings-section-title">이번 주 운동 목표</h3>

            {editingGoal ? (
              <div className="settings-row settings-row-editing settings-row-stack">
                <div className="settings-goal-inputs">
                  <label className="settings-goal-input-label">
                    주간 운동 횟수
                    <div className="settings-goal-input-wrap">
                      <input
                        type="number"
                        className="settings-row-input"
                        value={sessionInput}
                        onChange={(e) => setSessionInput(e.target.value)}
                        min={1}
                        max={50}
                        disabled={goalBusy}
                        inputMode="numeric"
                      />
                      <span className="settings-goal-input-unit">회</span>
                    </div>
                  </label>
                  <label className="settings-goal-input-label">
                    주간 운동 시간
                    <div className="settings-goal-input-wrap">
                      <input
                        type="number"
                        className="settings-row-input"
                        value={minuteInput}
                        onChange={(e) => setMinuteInput(e.target.value)}
                        min={1}
                        max={1000}
                        disabled={goalBusy}
                        inputMode="numeric"
                      />
                      <span className="settings-goal-input-unit">분</span>
                    </div>
                  </label>
                </div>
                <div className="settings-goal-actions">
                  <button
                    type="button"
                    className="settings-edit-btn"
                    onClick={saveGoal}
                    disabled={goalBusy}
                  >
                    {goalBusy ? "저장 중" : "저장"}
                  </button>
                  <button
                    type="button"
                    className="settings-cancel-btn"
                    onClick={cancelEditGoal}
                    disabled={goalBusy}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="settings-row">
                <div className="settings-row-label">주간 목표</div>
                <div className="settings-row-value">
                  {goal
                    ? `${goal.weeklySessionTarget}회 / ${goal.weeklyMinuteTarget}분`
                    : goalError ? "불러오기 실패" : "불러오는 중..."}
                </div>
                <button
                  type="button"
                  className="settings-edit-btn"
                  onClick={goal ? startEditGoal : loadGoal}
                >
                  {goal ? "변경" : "재시도"}
                </button>
              </div>
            )}
            {goalError && (
              <p className="auth-error" style={{ marginTop: -4 }}>
                {goalError}
              </p>
            )}
          </div>

          <div className="settings-section">
            <button
              type="button"
              className="settings-logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              로그아웃
            </button>
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
