// Dev preview server entry (LYK-934). Renders a published page read-only: fetch
// the published .pui source by ?slug=… from the account server and live-compile
// it (same path the Designer uses). Image assets resolve via /api/assets URLs,
// so the preview is self-contained against the dev server.
import "@cloudscape-design/global-styles/index.css";
import "../src/lib/tokens/cloudscape-tokens.css";
import "../src/lib/tokens/cloudscape-tokens-dark.css";
import "../src/lib/site.css";
import { compileParascape, mountSvelte } from "../demos/live-compile";

const app = document.getElementById("app");
const slug = new URLSearchParams(location.search).get("slug") ?? "";

async function run() {
  if (!app) return;
  if (!slug) {
    app.textContent = "No page specified (add ?slug=…).";
    return;
  }
  try {
    const res = await fetch("/api/published/" + encodeURIComponent(slug));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const { doc } = (await res.json()) as { doc: { name?: string; source?: string } };
    document.title = (doc?.name ?? "Preview") + " — Parascape";
    const C = compileParascape(doc?.source ?? "");
    mountSvelte(C as never, app);
  } catch (e: unknown) {
    app.textContent = "Preview unavailable: " + ((e as { message?: string })?.message ?? String(e));
  }
}

run();
