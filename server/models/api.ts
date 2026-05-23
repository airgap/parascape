// Parascape's HTTP API, expressed as @lyku/lockstep-core handler models.
// lockstep generates from this: request/response TS types (api-types), the
// server handler factories (handles), and the typed browser client (client).
//
// Every model carries an explicit `method` + `path` — the client generator only
// emits a method for models that declare `method`, and routes on `path`.
// baseUrl is "/api", so paths here are relative to that.
//
// Endpoints that don't fit a JSON request/response shape stay raw routes in the
// Worker (server/worker.ts): GET /assets/:id (binary image) and
// GET /published/:slug (public page snapshot read by the preview).
import type { TsonHandlerModel } from "@lyku/lockstep-core";

const m = <T extends TsonHandlerModel>(model: T) => model;

// ── shared response shapes ──
const userShape = {
  type: "object",
  properties: { id: { type: "number" }, username: { type: "string" } },
  required: ["id", "username"],
} as const;

const authResult = {
  type: "object",
  properties: { token: { type: "string" }, user: userShape },
  required: ["token", "user"],
} as const;

const ok = {
  type: "object",
  properties: { ok: { type: "boolean" } },
  required: ["ok"],
} as const;

// ── auth ──
export const health = m({
  method: "GET",
  path: "/health",
  authenticated: false,
  response: {
    type: "object",
    properties: { ok: { type: "boolean" }, guest: { type: "boolean" } },
    required: ["ok", "guest"],
  },
  title: "Health check",
  category: "Auth",
});

export const register = m({
  method: "POST",
  path: "/register",
  authenticated: false,
  request: {
    type: "object",
    properties: { username: { type: "string", minLength: 3 }, password: { type: "string", minLength: 6 } },
    required: ["username", "password"],
  },
  response: authResult,
  throws: [400, 409],
  title: "Register",
  category: "Auth",
});

export const login = m({
  method: "POST",
  path: "/login",
  authenticated: false,
  request: {
    type: "object",
    properties: { username: { type: "string" }, password: { type: "string" } },
    required: ["username", "password"],
  },
  response: authResult,
  throws: [401],
  title: "Log in",
  category: "Auth",
});

export const logout = m({
  method: "POST",
  path: "/logout",
  authenticated: true,
  response: ok,
  title: "Log out",
  category: "Auth",
});

export const me = m({
  method: "GET",
  path: "/me",
  authenticated: true,
  response: {
    type: "object",
    properties: { user: userShape, guest: { type: "boolean" } },
    required: ["user", "guest"],
  },
  title: "Current user",
  category: "Auth",
});

// ── projects ──
const projectSummary = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    updated_at: { type: "number" },
  },
  required: ["id", "name", "updated_at"],
} as const;

const projectFull = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    doc: { type: "object" },
    updated_at: { type: "number" },
  },
  required: ["id", "name", "doc", "updated_at"],
} as const;

export const listProjects = m({
  method: "GET",
  path: "/projects",
  authenticated: true,
  response: {
    type: "object",
    properties: { projects: { type: "array", items: projectSummary } },
    required: ["projects"],
  },
  title: "List projects",
  category: "Projects",
});

export const createProject = m({
  method: "POST",
  path: "/projects",
  authenticated: true,
  request: {
    type: "object",
    properties: { name: { type: "string" }, doc: { type: "object" } },
    required: ["name", "doc"],
  },
  response: {
    type: "object",
    properties: { id: { type: "number" }, name: { type: "string" } },
    required: ["id", "name"],
  },
  title: "Create project",
  category: "Projects",
});

export const getProject = m({
  method: "POST",
  path: "/project/get",
  authenticated: true,
  request: {
    type: "object",
    properties: { id: { type: "number" } },
    required: ["id"],
  },
  response: projectFull,
  throws: [404],
  title: "Get project",
  category: "Projects",
});

export const updateProject = m({
  method: "POST",
  path: "/project/update",
  authenticated: true,
  request: {
    type: "object",
    properties: {
      id: { type: "number" },
      name: { type: "string" },
      doc: { type: "object" },
    },
    required: ["id"],
  },
  response: ok,
  throws: [404],
  title: "Update project",
  category: "Projects",
});

export const deleteProject = m({
  method: "POST",
  path: "/project/delete",
  authenticated: true,
  request: {
    type: "object",
    properties: { id: { type: "number" } },
    required: ["id"],
  },
  response: ok,
  throws: [404],
  title: "Delete project",
  category: "Projects",
});

// ── assets ──
const assetSummary = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    mime: { type: "string" },
    size: { type: "number" },
    created_at: { type: "number" },
  },
  required: ["id", "name", "mime", "size", "created_at"],
} as const;

export const listAssets = m({
  method: "GET",
  path: "/assets",
  authenticated: true,
  response: {
    type: "object",
    properties: { assets: { type: "array", items: assetSummary } },
    required: ["assets"],
  },
  title: "List assets",
  category: "Assets",
});

export const uploadAsset = m({
  method: "POST",
  path: "/assets",
  authenticated: true,
  request: {
    type: "object",
    properties: {
      name: { type: "string" },
      mime: { type: "string" },
      data: { type: "string", description: "base64-encoded bytes" },
    },
    required: ["name", "mime", "data"],
  },
  response: {
    type: "object",
    properties: {
      id: { type: "number" },
      name: { type: "string" },
      mime: { type: "string" },
      size: { type: "number" },
    },
    required: ["id", "name", "mime", "size"],
  },
  throws: [400],
  title: "Upload asset",
  category: "Assets",
});

export const deleteAsset = m({
  method: "POST",
  path: "/asset/delete",
  authenticated: true,
  request: {
    type: "object",
    properties: { id: { type: "number" } },
    required: ["id"],
  },
  response: ok,
  throws: [404],
  title: "Delete asset",
  category: "Assets",
});

// ── publish ──
export const publish = m({
  method: "POST",
  path: "/publish",
  authenticated: true,
  request: {
    type: "object",
    properties: { slug: { type: "string" }, doc: { type: "object" } },
    required: ["slug", "doc"],
  },
  response: {
    type: "object",
    properties: { slug: { type: "string" }, url: { type: "string" } },
    required: ["slug", "url"],
  },
  throws: [400, 409],
  title: "Publish page",
  category: "Publish",
});

// ── version history / snapshots (LYK-943) ──
const snapshotMeta = {
  type: "object",
  properties: {
    id: { type: "number" },
    label: { type: "string" },
    created_at: { type: "number" },
  },
  required: ["id", "label", "created_at"],
} as const;

export const listSnapshots = m({
  method: "GET",
  path: "/snapshots",
  authenticated: true,
  response: {
    type: "object",
    properties: { snapshots: { type: "array", items: snapshotMeta } },
    required: ["snapshots"],
  },
  title: "List snapshots",
  category: "History",
});

export const createSnapshot = m({
  method: "POST",
  path: "/snapshots",
  authenticated: true,
  request: {
    type: "object",
    properties: { label: { type: "string" }, doc: { type: "object" } },
    required: ["label", "doc"],
  },
  response: snapshotMeta,
  title: "Create snapshot",
  category: "History",
});

export const getSnapshot = m({
  method: "POST",
  path: "/snapshot/get",
  authenticated: true,
  request: {
    type: "object",
    properties: { id: { type: "number" } },
    required: ["id"],
  },
  response: {
    type: "object",
    properties: {
      id: { type: "number" },
      label: { type: "string" },
      doc: { type: "object" },
      created_at: { type: "number" },
    },
    required: ["id", "label", "doc", "created_at"],
  },
  throws: [404],
  title: "Get snapshot",
  category: "History",
});

export const deleteSnapshot = m({
  method: "POST",
  path: "/snapshot/delete",
  authenticated: true,
  request: {
    type: "object",
    properties: { id: { type: "number" } },
    required: ["id"],
  },
  response: ok,
  throws: [404],
  title: "Delete snapshot",
  category: "History",
});
