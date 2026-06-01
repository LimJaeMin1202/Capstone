import { apiFetch, extractError } from "./client";

export interface AuthUser {
  username: string;
  name: string;
}

interface LoginResult {
  token: string;
  username: string;
  name: string;
}

export async function signup(
  username: string,
  password: string,
  name: string
): Promise<void> {
  const res = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name }),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

export async function login(
  username: string,
  password: string
): Promise<LoginResult> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function kakaoLogin(
  code: string,
  redirectUri: string
): Promise<LoginResult> {
  const res = await apiFetch("/api/auth/kakao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getMe(): Promise<AuthUser> {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}
