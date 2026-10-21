import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { buildDecadeOptions } from "../utils/birthYearOptions";

export default function AuthPage() {
  const { login, signup, loginWithKakao } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYearInput] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const decadeOptions = buildDecadeOptions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    if (mode === "signup" && birthYear === null) {
      setError("연령대를 선택해주세요");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password, name, birthYear!);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src={`${import.meta.env.BASE_URL}icon.png`} alt="CareFit" className="auth-brand-logo" />
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            로그인
          </button>
          <button
            type="button"
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            아이디
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 입력"
              autoComplete="username"
            />
          </label>

          {mode === "signup" && (
            <label className="auth-field">
              이름
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 입력"
              />
            </label>
          )}

          {mode === "signup" && (
            <label className="auth-field">
              연령대
              <select
                className="auth-select"
                value={birthYear ?? ""}
                onChange={(e) =>
                  setBirthYearInput(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              >
                <option value="">선택해주세요</option>
                {decadeOptions.map((opt) => (
                  <option key={opt.birthYear} value={opt.birthYear}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="auth-field">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "signup" && (
            <label className="auth-field">
              비밀번호 확인
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 다시 입력"
                autoComplete="new-password"
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>

        <div className="auth-divider">
          <span>또는</span>
        </div>

        <button
          type="button"
          className="kakao-btn"
          onClick={loginWithKakao}
          disabled={busy}
        >
          <svg
            className="kakao-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.756 1.83 5.182 4.594 6.566l-.964 3.534c-.082.299.249.535.51.36l4.226-2.811c.534.07 1.082.108 1.634.108 5.523 0 10-3.477 10-7.757S17.523 3 12 3z" />
          </svg>
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
}
