import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "../api/auth";
import * as authApi from "../api/auth";
import { setToken, clearToken, getToken } from "../api/client";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, name: string) => Promise<void>;
  loginWithKakao: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as string;
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI as string;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // StrictMode에서 useEffect 2회 실행 시 인가코드 재사용 방지
  const handledRef = useRef(false);

  // 앱 시작 시:
  //  (1) URL에 ?code= 있으면 카카오 콜백 처리 (인가코드 → 백엔드로 보내 JWT 받음)
  //  (2) 아니면 저장된 토큰으로 로그인 복원
  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      // 카카오 콜백 처리
      authApi
        .kakaoLogin(code, KAKAO_REDIRECT_URI)
        .then((result) => {
          setToken(result.token);
          setUser({ username: result.username, name: result.name });
        })
        .catch((err) => {
          console.error("카카오 로그인 실패:", err);
          alert("카카오 로그인 실패: " + (err as Error).message);
        })
        .finally(() => {
          // URL에서 code 제거 (새로고침 시 재요청 방지)
          window.history.replaceState({}, "", window.location.pathname);
          setLoading(false);
        });
      return;
    }

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const result = await authApi.login(username, password);
    setToken(result.token);
    setUser({ username: result.username, name: result.name });
  }

  async function signup(username: string, password: string, name: string) {
    await authApi.signup(username, password, name);
    await login(username, password);
  }

  // 카카오 인증 페이지로 리다이렉트 → 사용자가 동의하면 ?code=...로 돌아옴
  function loginWithKakao() {
    const url =
      `https://kauth.kakao.com/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${KAKAO_REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}`;
    window.location.href = url;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, loginWithKakao, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용");
  return ctx;
}
