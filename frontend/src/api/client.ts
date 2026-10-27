// dev: localhost:8080 (백엔드 dev 서버)
// 배포: nginx가 같은 도메인에서 /api 를 백엔드로 proxy 하므로 접두사만 필요.
//   - 루트 배포        VITE_API_BASE="/"        → ""            → /api/...
//   - 하위 경로 배포    VITE_API_BASE="/carefit/" → "/carefit"   → /carefit/api/...
// 끝 슬래시를 떼서 apiFetch 의 path("/api/...")와 합칠 때 // 가 생기지 않게 한다.
const RAW_API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";
export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const TOKEN_KEY = "capstone-token";
export const AUTH_EXPIRED_EVENT = "carefit:auth-expired";
const REQUEST_TIMEOUT_MS = 15000;

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
  const publicAuthPath = /^\/api\/auth\/(login|signup|kakao)$/.test(path);
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token && !publicAuthPath) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timeout = window.setTimeout(abort, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (response.status === 401 && token && !publicAuthPath) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return response;
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new Error("요청 시간이 초과되었습니다. 연결 상태를 확인하고 다시 시도해주세요.", { cause: error });
    }
    if (error instanceof TypeError) {
      throw new Error("서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.", { cause: error });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
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
