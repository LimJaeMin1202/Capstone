// dev: localhost:8080 (백엔드 dev 서버)
// 배포: VITE_API_BASE를 빈 문자열로 두면 nginx가 같은 도메인에서 /api proxy
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

const TOKEN_KEY = "capstone-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// 토큰이 있으면 Authorization 헤더를 자동으로 붙여 요청
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// 에러 응답에서 메시지 추출
export async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ?? `요청 실패 (${res.status})`;
  } catch {
    return `요청 실패 (${res.status})`;
  }
}
