import { createContext } from "react";
import type { AuthUser } from "../api/auth";

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  sessionMessage: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, name: string, birthYear: number) => Promise<void>;
  loginWithKakao: () => void;
  logout: () => void;
  setBirthYear: (birthYear: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
