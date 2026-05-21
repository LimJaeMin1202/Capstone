import {
  createContext,
  useContext,
  useEffect,
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시: 저장된 토큰 있으면 내 정보 불러와서 로그인 복원
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => clearToken()) // 토큰 만료/무효면 제거
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const result = await authApi.login(username, password);
    setToken(result.token);
    setUser({ username: result.username, name: result.name });
  }

  async function signup(username: string, password: string, name: string) {
    await authApi.signup(username, password, name);
    // 가입 후 바로 로그인
    await login(username, password);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 어디서나 useAuth()로 꺼내 씀
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용");
  return ctx;
}
