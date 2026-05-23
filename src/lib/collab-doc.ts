// Shared CRDT document mapping for real-time collaboration (LYK-944).
//
// Both the browser client (src/lib/collab.ts) and the Cloudflare Durable Object
// room (server/room.ts) (de)serialize a Parascape project to/from a Yjs doc with
// this module — kept independent of designer/Designer.pui (a .pui can't be
// imported server-side) but mirroring its `Project` shape structurally.
//
// Granularity (what merges conflict-free vs last-writer-wins):
//   - project meta (data, components, counters) — one field each, LWW per field
//   - the page LIST — a Y.Array of page maps, so add / remove / per-page edits by
//     different editors merge cleanly (two people on different pages never clash)
//   - a single page's section TREE — one JSON field on that page's map, so two
//     people editing the *same* page resolve last-writer-wins on that page.
// Finer (per-section) merge within one page is a documented follow-up.
import * as Y from "yjs";

export type CollabPage = {
  id: number;
  name: string;
  route: string;
  params: string;
  doc: { sections: unknown[]; codeOverride: string | null };
  meta?: unknown;
};
export type CollabProject = {
  pages: CollabPage[];
  activePageId: number;
  nextKey: number;
  components: unknown[];
  nextCompId: number;
  data?: Record<string, unknown>;
  dataUrl?: string;
};

const META = "meta";
const PAGES = "pages";

// Deterministic JSON: object keys sorted recursively, so the same logical state
// always stringifies identically. This is what makes `projectToYDoc` idempotent —
// re-applying an unchanged project mutates nothing and emits no Yjs update, which
// is what stops a remote-apply → local-autosave → re-broadcast echo loop.
export function stableStringify(value: unknown): string {
  return JSON.stringify(canon(value));
}
function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) out[k] = canon((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

function setIfChanged(m: Y.Map<unknown>, k: string, v: unknown): void {
  if (m.get(k) !== v) m.set(k, v);
}
function findPage(arr: Y.Array<Y.Map<unknown>>, id: number): Y.Map<unknown> | null {
  for (let i = 0; i < arr.length; i++) if (Number(arr.get(i).get("id")) === id) return arr.get(i);
  return null;
}
function writePage(m: Y.Map<unknown>, pg: CollabPage): void {
  setIfChanged(m, "id", pg.id);
  setIfChanged(m, "name", pg.name);
  setIfChanged(m, "route", pg.route);
  setIfChanged(m, "params", pg.params);
  setIfChanged(m, "meta", stableStringify(pg.meta ?? null));
  setIfChanged(m, "sections", stableStringify(pg.doc?.sections ?? []));
  setIfChanged(m, "codeOverride", pg.doc?.codeOverride ?? null);
}

/** Reconcile a project into the Y.Doc, mutating only what differs. Counters
 *  merge by max so two clients minting new keys don't regress each other. The
 *  active page is intentionally NOT synced — each editor keeps its own viewport. */
export function projectToYDoc(doc: Y.Doc, p: CollabProject): void {
  const meta = doc.getMap<unknown>(META);
  setIfChanged(meta, "nextKey", Math.max(Number(meta.get("nextKey") ?? 0), p.nextKey));
  setIfChanged(meta, "nextCompId", Math.max(Number(meta.get("nextCompId") ?? 0), p.nextCompId));
  setIfChanged(meta, "components", stableStringify(p.components ?? []));
  setIfChanged(meta, "data", stableStringify(p.data ?? {}));
  setIfChanged(meta, "dataUrl", p.dataUrl ?? "");

  const arr = doc.getArray<Y.Map<unknown>>(PAGES);
  const wantIds = p.pages.map(pg => pg.id);
  // drop removed pages (high index first so indices stay valid)
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!wantIds.includes(Number(arr.get(i).get("id")))) arr.delete(i, 1);
  }
  // upsert; new pages append (manual reorder is a follow-up)
  p.pages.forEach(pg => {
    const m = findPage(arr, pg.id);
    if (m) {
      writePage(m, pg);
    } else {
      const nm = new Y.Map<unknown>();
      writePage(nm, pg);
      arr.push([nm]);
    }
  });
}

export function ydocToProject(doc: Y.Doc): CollabProject {
  const meta = doc.getMap<unknown>(META);
  const arr = doc.getArray<Y.Map<unknown>>(PAGES);
  const pages: CollabPage[] = [];
  for (let i = 0; i < arr.length; i++) {
    const m = arr.get(i);
    pages.push({
      id: Number(m.get("id")),
      name: String(m.get("name") ?? "Page"),
      route: String(m.get("route") ?? "/"),
      params: String(m.get("params") ?? ""),
      meta: safeParse(m.get("meta"), null) ?? undefined,
      doc: {
        sections: safeParse(m.get("sections"), []) as unknown[],
        codeOverride: (m.get("codeOverride") as string | null) ?? null,
      },
    });
  }
  return {
    pages,
    activePageId: pages[0]?.id ?? 1,
    nextKey: Number(meta.get("nextKey") ?? 1),
    nextCompId: Number(meta.get("nextCompId") ?? 1),
    components: safeParse(meta.get("components"), []) as unknown[],
    data: safeParse(meta.get("data"), {}) as Record<string, unknown>,
    dataUrl: String(meta.get("dataUrl") ?? "") || undefined,
  };
}
function safeParse<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

/** Stable per-identity colour for presence cursors/avatars. */
export function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 55%)`;
}
