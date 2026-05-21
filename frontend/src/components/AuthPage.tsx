import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password, name);
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
          <span className="logo">🦵</span> 건강한 우리 운동
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
      </div>
    </div>
  );
}
