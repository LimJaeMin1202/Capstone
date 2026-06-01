import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

// 카카오로 가입한 사용자가 첫 로그인 후 출생연도를 입력하는 모달
// 입력 전엔 닫을 수 없음 (나이별 운동 기준 적용 위해 필수)
export default function BirthYearModal() {
  const { setBirthYear } = useAuth();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const year = Number(value);
    if (!value || !Number.isInteger(year) || year < 1900 || year > 2025) {
      setError("올바른 출생연도를 입력해주세요 (예: 1965)");
      return;
    }

    setBusy(true);
    try {
      await setBirthYear(year);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 className="modal-title">출생연도를 알려주세요</h2>
        <p className="modal-desc">
          나이대에 맞는 운동 기준을 적용하기 위해 한 번만 입력받습니다.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            출생연도
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="예: 1965"
              min={1900}
              max={2025}
              inputMode="numeric"
              autoFocus
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "저장 중..." : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
