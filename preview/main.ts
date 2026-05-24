// Published-app entry (LYK-934 → LYK-957). Fetches a published project by
// ?slug=… and runs it as a routed single-page app: the in-app route lives in the
// hash (`#/items/123?tab=x`), so it's independent of the preview's own ?slug.
// The router matches the path to a page (static + `/[slug]/` segments), extracts
// path + query params, and mounts that page with `{ params, query }` props — so
// page code can do `params.id` / `query.tab`. Legacy single-page docs (pre-957,
// `{ source }`) still render at any route.
import "@cloudscape-design/global-styles/index.css";
import "../src/lib/tokens/cloudscape-tokens.css";
import "../src/lib/tokens/cloudscape-tokens-dark.css";
import "../src/lib/site.css";
import { compileParascape, mountSvelte, registerUserModule, clearUserModules } from "../demos/live-compile";

type PublishedPage = { name: string; route: string; params?: string; source: string };
type PublishedComponent = { ident: string; source: string };
type PublishedDoc = { name?: string; source?: string; pages?: PublishedPage[]; components?: PublishedComponent[] };

// Register the project's components (LYK-958) so pages/instances that import them
// resolve. Fixed-point: a component may import another; compile what we can each
// pass until no more progress (an erroring one is left unresolved).
function registerComponents(components: PublishedComponent[] | undefined) {
  clearUserModules();
  const pending = [...(components ?? [])];
  let progress = true;
  while (pending.length && progress) {
    progress = false;
    for (let i = pending.length - 1; i >= 0; i--) {
      try {
        registerUserModule(pending[i].ident, {
          default: compileParascape(pending[i].source) as unknown as Record<string, unknown>,
        });
        pending.splice(i, 1);
        progress = true;
      } catch {
        /* dependency not registered yet, or an error → retry / leave unresolved */
      }
    }
  }
}

const app = document.getElementById("app");
const slug = new URLSearchParams(location.search).get("slug") ?? "";

// /items/[id] → { re: /^\/items\/([^/]+)\/?$/, names: ["id"] }
function compileRoute(route: string): { re: RegExp; names: string[]; dynamic: number } {
  const names: string[] = [];
  let dynamic = 0;
  const parts = (route || "/")
    .split("/")
    .filter(Boolean)
    .map(seg => {
      const m = seg.match(/^\[(.+)\]$/);
      if (m) {
        names.push(m[1]);
        dynamic++;
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
  return { re: new RegExp("^/" + parts.join("/") + "/?$"), names, dynamic };
}

function parseHash(): { path: string; query: Record<string, string> } {
  const raw = location.hash.replace(/^#/, "") || "/";
  const qi = raw.indexOf("?");
  const path = (qi === -1 ? raw : raw.slice(0, qi)) || "/";
  const query: Record<string, string> = {};
  if (qi !== -1) for (const [k, v] of new URLSearchParams(raw.slice(qi + 1))) query[k] = v;
  return { path: path.startsWith("/") ? path : "/" + path, query };
}

function matchPage(
  pages: PublishedPage[],
  path: string,
): { page: PublishedPage; params: Record<string, string> } | null {
  // most specific first: fewer dynamic segments win (static beats `/[slug]/`)
  const compiled = pages.map(page => ({ page, ...compileRoute(page.route) })).sort((a, b) => a.dynamic - b.dynamic);
  for (const c of compiled) {
    const m = path.match(c.re);
    if (m) {
      const params: Record<string, string> = {};
      c.names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1] ?? "")));
      return { page: c.page, params };
    }
  }
  return null;
}

let teardown: (() => void) | null = null;
function render(doc: PublishedDoc) {
  if (!app) return;
  if (teardown) {
    try {
      teardown();
    } catch {}
    teardown = null;
  }
  app.textContent = "";

  // legacy single-page doc (pre-957)
  if (!doc.pages?.length) {
    const C = compileParascape(doc.source ?? "");
    teardown = mountSvelte(C as never, app);
    return;
  }

  const { path, query } = parseHash();
  const hit = matchPage(doc.pages, path);
  if (!hit) {
    app.innerHTML = `<div style="font:14px/1.5 system-ui;padding:48px;text-align:center;color:#5f6b7a">
      <h1 style="font-size:20px;margin:0 0 8px">404 — no page at <code>${path.replace(/</g, "&lt;")}</code></h1>
      <p>Known routes: ${doc.pages.map(p => `<code>${p.route.replace(/</g, "&lt;")}</code>`).join(", ")}</p></div>`;
    return;
  }
  document.title = (hit.page.name || doc.name || "Preview") + " — Parascape";
  try {
    const C = compileParascape(hit.page.source);
    teardown = mountSvelte(C as never, app, { params: hit.params, query });
  } catch (e: unknown) {
    app.textContent = "Could not render this page: " + ((e as { message?: string })?.message ?? String(e));
  }
}

async function run() {
  if (!app) return;
  if (!slug) {
    app.textContent = "No site specified (add ?slug=…).";
    return;
  }
  try {
    const res = await fetch("/api/published/" + encodeURIComponent(slug));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const { doc } = (await res.json()) as { doc: PublishedDoc };
    document.title = (doc?.name ?? "Preview") + " — Parascape";
    registerComponents(doc.components);
    render(doc);
    // re-route on in-app navigation (hash links)
    addEventListener("hashchange", () => render(doc));
  } catch (e: unknown) {
    app.textContent = "Preview unavailable: " + ((e as { message?: string })?.message ?? String(e));
  }
}

run();
