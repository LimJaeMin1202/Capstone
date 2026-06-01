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
  signup: (
    username: string,
    password: string,
    name: string,
    birthYear: number
  ) => Promise<void>;
  loginWithKakao: () => void;
  logout: () => void;
  setBirthYear: (birthYear: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
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
        .then(async (result) => {
          setToken(result.token);
          // birthYear 까지 받아오려면 me 호출 (카카오 신규 가입자는 null)
          const me = await authApi.getMe();
          setUser(me);
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
    // 로그인 직후엔 token/username/name만 받으니 me로 birthYear까지 채워옴
    const me = await authApi.getMe();
    setUser(me);
  }

  async function signup(
    username: string,
    password: string,
    name: string,
    birthYear: number
  ) {
    await authApi.signup(username, password, name, birthYear);
    await login(username, password);
  }

  async function setBirthYear(birthYear: number) {
    const updated = await authApi.updateBirthYear(birthYear);
    setUser(updated);
  }

  async function setName(name: string) {
    const updated = await authApi.updateName(name);
    setUser(updated);
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
      value={{
        user,
        loading,
        login,
        signup,
        loginWithKakao,
        logout,
        setBirthYear,
        setName,
      }}
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
