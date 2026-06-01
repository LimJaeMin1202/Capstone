import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { buildDecadeOptions } from "../utils/birthYearOptions";

// 두 모드 지원:
//  - required: 카카오 가입자 첫 로그인 (닫기 불가, 반드시 입력)
//  - edit: 프로필 수정 (취소 가능)
interface Props {
  mode?: "required" | "edit";
  onClose?: () => void;
}

export default function BirthYearModal({ mode = "required", onClose }: Props) {
  const { user, setBirthYear } = useAuth();
  // edit 모드면 현재 값으로 초기 선택 (가까운 10년대 중간으로 스냅)
  const initial = mode === "edit" && user?.birthYear ? snapToDecade(user.birthYear) : null;
  const [selected, setSelected] = useState<number | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = buildDecadeOptions();
  const isEdit = mode === "edit";

  async function handleSubmit() {
    if (selected === null) {
      setError("연령대를 선택해주세요");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await setBirthYear(selected);
      if (isEdit && onClose) onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // 백드롭 클릭으로 닫기는 edit 모드에서만
  function handleBackdropClick() {
    if (isEdit && onClose && !busy) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal-card modal-card-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">
          {isEdit ? "연령대 변경" : "언제 태어나셨나요?"}
        </h2>
        <p className="modal-desc">
          {isEdit
            ? "연령대를 새로 선택하면 운동 기준이 다시 적용됩니다."
            : "연령대에 맞는 운동 기준을 적용하기 위해 한 번만 알려주세요."}
        </p>

        <div className="decade-grid">
          {options.map((opt) => (
            <button
              key={opt.birthYear}
              type="button"
              className={
                "decade-btn" +
                (selected === opt.birthYear ? " decade-btn-selected" : "")
              }
              onClick={() => setSelected(opt.birthYear)}
              disabled={busy}
            >
              <div className="decade-btn-label">{opt.label}</div>
            </button>
          ))}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="modal-actions">
          {isEdit && (
            <button
              type="button"
              className="modal-btn-secondary"
              onClick={onClose}
              disabled={busy}
            >
              취소
            </button>
          )}
          <button
            type="button"
            className="auth-submit"
            onClick={handleSubmit}
            disabled={busy || selected === null}
          >
            {busy ? "저장 중..." : isEdit ? "변경" : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 임의 출생연도를 가장 가까운 10년대 중간값(...5)으로 변환
// 예) 1962 → 1965, 1953 → 1955
function snapToDecade(year: number): number {
  return Math.floor(year / 10) * 10 + 5;
}
