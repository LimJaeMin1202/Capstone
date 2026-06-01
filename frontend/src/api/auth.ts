import { apiFetch, extractError } from "./client";

export interface AuthUser {
  username: string;
  name: string;
  birthYear: number | null;
}

interface LoginResult {
  token: string;
  username: string;
  name: string;
}

export async function signup(
  username: string,
  password: string,
  name: string,
  birthYear: number
): Promise<void> {
  const res = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name, birthYear }),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

export async function updateBirthYear(birthYear: number): Promise<AuthUser> {
  const res = await apiFetch("/api/auth/me/birth-year", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ birthYear }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateName(name: string): Promise<AuthUser> {
  const res = await apiFetch("/api/auth/me/name", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
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
