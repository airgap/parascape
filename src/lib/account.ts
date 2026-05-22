// Client for the Parascape account + persistence API (LYK-930). Talks to the
// account server through the Vite /api proxy (same-origin, no CORS). The session
// token is kept in localStorage and sent as a Bearer header. When signed out,
// the Designer falls back to its localStorage-only persistence.

const TOKEN_KEY = "parascape-token";

export type Account = { id: number; username: string };
export type ProjectMeta = { id: number; name: string; updated_at: number };

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

type Opts = { method?: string; body?: unknown };
async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const token = getToken();
  const res = await fetch("/api" + path, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error((data.error as string) || `HTTP ${res.status}`);
  return data as T;
}

export async function register(username: string, password: string): Promise<Account> {
  const r = await api<{ token: string; user: Account }>("/register", { method: "POST", body: { username, password } });
  setToken(r.token);
  return r.user;
}
// Always-200 probe: tells the client whether the server is in guest mode without
// triggering a 401 (so we only call the authed /me when there's a token or guest).
export async function health(): Promise<{ ok: boolean; guest: boolean }> {
  const r = await api<{ ok?: boolean; guest?: boolean }>("/health");
  return { ok: !!r.ok, guest: !!r.guest };
}
export async function login(username: string, password: string): Promise<Account> {
  const r = await api<{ token: string; user: Account }>("/login", { method: "POST", body: { username, password } });
  setToken(r.token);
  return r.user;
}
export async function logout(): Promise<void> {
  try {
    await api("/logout", { method: "POST" });
  } catch {}
  setToken(null);
}
export async function me(): Promise<{ user: Account; guest: boolean }> {
  const r = await api<{ user: Account; guest?: boolean }>("/me");
  return { user: r.user, guest: !!r.guest };
}
export async function listProjects(): Promise<ProjectMeta[]> {
  const r = await api<{ projects: ProjectMeta[] }>("/projects");
  return r.projects;
}
export async function getProject(id: number): Promise<{ id: number; name: string; doc: unknown; updated_at: number }> {
  return api(`/projects/${id}`);
}
export async function createProject(name: string, doc: unknown): Promise<number> {
  const r = await api<{ id: number }>("/projects", { method: "POST", body: { name, doc } });
  return r.id;
}
export async function saveProject(id: number, doc: unknown): Promise<void> {
  await api(`/projects/${id}`, { method: "PUT", body: { doc } });
}

// --- assets (LYK-935) ---
export type AssetMeta = { id: number; name: string; mime: string; size: number; created_at: number };
// stable URL for an asset's binary (served publicly so <img src> works)
export const assetUrl = (id: number): string => `/api/assets/${id}`;
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read failed"));
    r.onload = () => resolve(String(r.result).split(",")[1] ?? ""); // strip the data: prefix
    r.readAsDataURL(file);
  });
export async function uploadAsset(file: File): Promise<AssetMeta> {
  const data = await fileToBase64(file);
  return api<AssetMeta>("/assets", {
    method: "POST",
    body: { name: file.name, mime: file.type || "application/octet-stream", data },
  });
}
export async function listAssets(): Promise<AssetMeta[]> {
  const r = await api<{ assets: AssetMeta[] }>("/assets");
  return r.assets;
}
export async function deleteAsset(id: number): Promise<void> {
  await api(`/assets/${id}`, { method: "DELETE" });
}

// --- publish / dev preview (LYK-934) ---
export async function publish(slug: string, doc: unknown): Promise<{ slug: string; url: string }> {
  return api("/publish", { method: "POST", body: { slug, doc } });
}
