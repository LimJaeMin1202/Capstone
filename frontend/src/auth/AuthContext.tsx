import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "../api/auth";
import * as authApi from "../api/auth";
import { setToken, clearToken, getToken, AUTH_EXPIRED_EVENT } from "../api/client";
import { AuthContext } from "./context";

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as string;
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI as string;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(
    () => Boolean(new URLSearchParams(window.location.search).get("code") || getToken())
  );
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // StrictMode에서 useEffect 2회 실행 시 인가코드 재사용 방지
  const handledRef = useRef(false);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setSessionMessage("로그인이 만료되었습니다. 다시 로그인해주세요.");
      setLoading(false);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

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
          clearToken();
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
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => {
        if (getToken()) {
          setSessionMessage("로그인 상태를 확인하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const result = await authApi.login(username, password);
    setToken(result.token);
    // 로그인 직후엔 token/username/name만 받으니 me로 birthYear까지 채워옴
    try {
      const me = await authApi.getMe();
      setUser(me);
      setSessionMessage(null);
    } catch (error) {
      clearToken();
      throw error;
    }
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
    setSessionMessage(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionMessage,
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
