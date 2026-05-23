// Parascape API handler implementations. Each wraps a generated lockstep handle
// factory (server/generated/handles) with the actual D1-backed logic. The
// factory gives us the validator + model (used by the router in worker.ts); we
// supply the `execute`. Handlers close over `env` for D1; the authed user id
// arrives as `context.requester`.
import {
  handleHealth,
  handleRegister,
  handleLogin,
  handleLogout,
  handleMe,
  handleListProjects,
  handleCreateProject,
  handleGetProject,
  handleUpdateProject,
  handleDeleteProject,
  handleListAssets,
  handleUploadAsset,
  handleDeleteAsset,
  handlePublish,
  handleListSnapshots,
  handleCreateSnapshot,
  handleGetSnapshot,
  handleDeleteSnapshot,
} from "./generated/handles/index.js";
import {
  type Env,
  type SessionUser,
  HttpError,
  hashPassword,
  verifyPassword,
  newSession,
  bearerToken,
  b64ToBytes,
  now,
} from "./lib";

const uid = (ctx: { requester?: bigint }): number => Number(ctx.requester);

export function makeHandles(env: Env) {
  return {
    health: handleHealth(async () => ({ ok: true, guest: false })),

    register: handleRegister(async req => {
      const username = String(req.username).trim();
      const password = String(req.password);
      if (username.length < 3) throw new HttpError(400, "Username must be at least 3 characters");
      if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");
      const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
      if (exists) throw new HttpError(409, "That username is taken");
      const res = await env.DB.prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)")
        .bind(username, await hashPassword(password), now())
        .run();
      const id = Number(res.meta.last_row_id);
      return { token: await newSession(env, id), user: { id, username } };
    }),

    login: handleLogin(async req => {
      const username = String(req.username).trim();
      const row = await env.DB.prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
        .bind(username)
        .first<{ id: number; username: string; password_hash: string }>();
      if (!row || !(await verifyPassword(String(req.password), row.password_hash)))
        throw new HttpError(401, "Wrong username or password");
      return {
        token: await newSession(env, row.id),
        user: { id: row.id, username: row.username },
      };
    }),

    logout: handleLogout(async (_req, ctx) => {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(bearerToken(ctx.request)).run();
      return { ok: true };
    }),

    me: handleMe(async (_req, ctx) => {
      const user = await env.DB.prepare("SELECT id, username FROM users WHERE id = ?")
        .bind(uid(ctx))
        .first<SessionUser>();
      if (!user) throw new HttpError(401, "Not signed in");
      return { user, guest: false };
    }),

    listProjects: handleListProjects(async (_req, ctx) => {
      const rows = await env.DB.prepare(
        "SELECT id, name, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC",
      )
        .bind(uid(ctx))
        .all<{ id: number; name: string; updated_at: number }>();
      return { projects: rows.results };
    }),

    createProject: handleCreateProject(async (req, ctx) => {
      const name = String(req.name ?? "Untitled");
      const res = await env.DB.prepare("INSERT INTO projects (user_id, name, doc, updated_at) VALUES (?, ?, ?, ?)")
        .bind(uid(ctx), name, JSON.stringify(req.doc ?? {}), now())
        .run();
      return { id: Number(res.meta.last_row_id), name };
    }),

    getProject: handleGetProject(async (req, ctx) => {
      const row = await env.DB.prepare("SELECT id, name, doc, updated_at FROM projects WHERE id = ? AND user_id = ?")
        .bind(req.id, uid(ctx))
        .first<{ id: number; name: string; doc: string; updated_at: number }>();
      if (!row) throw new HttpError(404, "No such project");
      return { id: row.id, name: row.name, doc: JSON.parse(row.doc), updated_at: row.updated_at };
    }),

    updateProject: handleUpdateProject(async (req, ctx) => {
      const owned = await env.DB.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?")
        .bind(req.id, uid(ctx))
        .first();
      if (!owned) throw new HttpError(404, "No such project");
      if (req.name !== undefined)
        await env.DB.prepare("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?")
          .bind(String(req.name), now(), req.id)
          .run();
      if (req.doc !== undefined)
        await env.DB.prepare("UPDATE projects SET doc = ?, updated_at = ? WHERE id = ?")
          .bind(JSON.stringify(req.doc), now(), req.id)
          .run();
      return { ok: true };
    }),

    deleteProject: handleDeleteProject(async (req, ctx) => {
      // Scoped by user_id, so deleting a non-owned/absent row is a harmless no-op.
      await env.DB.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").bind(req.id, uid(ctx)).run();
      return { ok: true };
    }),

    listAssets: handleListAssets(async (_req, ctx) => {
      const rows = await env.DB.prepare(
        "SELECT id, name, mime, size, created_at FROM assets WHERE user_id = ? ORDER BY created_at DESC",
      )
        .bind(uid(ctx))
        .all<{ id: number; name: string; mime: string; size: number; created_at: number }>();
      return { assets: rows.results };
    }),

    uploadAsset: handleUploadAsset(async (req, ctx) => {
      const bytes = b64ToBytes(String(req.data));
      const name = String(req.name);
      const mime = String(req.mime);
      const res = await env.DB.prepare(
        "INSERT INTO assets (user_id, name, mime, size, data, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
        .bind(uid(ctx), name, mime, bytes.length, bytes.buffer, now())
        .run();
      return { id: Number(res.meta.last_row_id), name, mime, size: bytes.length };
    }),

    deleteAsset: handleDeleteAsset(async (req, ctx) => {
      const owned = await env.DB.prepare("SELECT id FROM assets WHERE id = ? AND user_id = ?")
        .bind(req.id, uid(ctx))
        .first();
      if (!owned) throw new HttpError(404, "No such asset");
      await env.DB.prepare("DELETE FROM assets WHERE id = ?").bind(req.id).run();
      return { ok: true };
    }),

    publish: handlePublish(async (req, ctx) => {
      const slug = String(req.slug ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!slug) throw new HttpError(400, "Missing slug");
      const existing = await env.DB.prepare("SELECT user_id FROM published WHERE slug = ?")
        .bind(slug)
        .first<{ user_id: number }>();
      if (existing && existing.user_id !== uid(ctx)) throw new HttpError(409, "That preview name is taken");
      await env.DB.prepare(
        "INSERT INTO published (slug, user_id, doc, updated_at) VALUES (?, ?, ?, ?) " +
          "ON CONFLICT(slug) DO UPDATE SET doc = excluded.doc, updated_at = excluded.updated_at",
      )
        .bind(slug, uid(ctx), JSON.stringify(req.doc ?? {}), now())
        .run();
      return { slug, url: `/preview/${slug}` };
    }),

    // ── version history / snapshots (LYK-943) ──
    listSnapshots: handleListSnapshots(async (_req, ctx) => {
      const rows = await env.DB.prepare(
        "SELECT id, label, created_at FROM snapshots WHERE user_id = ? ORDER BY created_at DESC",
      )
        .bind(uid(ctx))
        .all<{ id: number; label: string; created_at: number }>();
      return { snapshots: rows.results };
    }),

    createSnapshot: handleCreateSnapshot(async (req, ctx) => {
      const label = String(req.label ?? "Snapshot").slice(0, 120);
      const created_at = now();
      const res = await env.DB.prepare("INSERT INTO snapshots (user_id, label, doc, created_at) VALUES (?, ?, ?, ?)")
        .bind(uid(ctx), label, JSON.stringify(req.doc ?? {}), created_at)
        .run();
      return { id: Number(res.meta.last_row_id), label, created_at };
    }),

    getSnapshot: handleGetSnapshot(async (req, ctx) => {
      const row = await env.DB.prepare("SELECT id, label, doc, created_at FROM snapshots WHERE id = ? AND user_id = ?")
        .bind(req.id, uid(ctx))
        .first<{ id: number; label: string; doc: string; created_at: number }>();
      if (!row) throw new HttpError(404, "No such snapshot");
      return { id: row.id, label: row.label, doc: JSON.parse(row.doc), created_at: row.created_at };
    }),

    deleteSnapshot: handleDeleteSnapshot(async (req, ctx) => {
      await env.DB.prepare("DELETE FROM snapshots WHERE id = ? AND user_id = ?").bind(req.id, uid(ctx)).run();
      return { ok: true };
    }),
  };
}

export type HandleEntry = ReturnType<typeof makeHandles>[keyof ReturnType<typeof makeHandles>];
