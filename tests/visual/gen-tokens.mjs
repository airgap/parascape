// Regenerate src/lib/tokens/cloudscape-tokens.css by lifting the
// design-token custom-property block VERBATIM from
// @cloudscape-design/components/internal/base-component/styles.scoped
// .css (the `body{}` rule inside @layer cloudscape-base-theme — the
// exact block Cloudscape emits into its own bundle). No mapping, no
// approximation: identical hashed names + values, scoped to :root,body
// so var(--token,fallback) resolves to the real value in the app.
// (Supersedes the old semantic-stand-in mapper — that approach is
// gone; the visual harnesses don't need this at all: Cloudscape bakes
// each token's real value as the var() FALLBACK, so both sides already
// resolve identically — proven by box/popover residuals unchanged
// with vs without this file. This is purely real-app fidelity.)
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const src = path.join(root, "node_modules/@cloudscape-design/components/internal/base-component/styles.scoped.css");
const out = path.join(root, "src/lib/tokens/cloudscape-tokens.css");

const css = fs.readFileSync(src, "utf8");
const anchor = css.indexOf("--color-charts-palette-categorical-1-xu0deg:");
if (anchor < 0) throw new Error("gen-tokens: token anchor not found — Cloudscape layout changed");
const open = css.lastIndexOf("{", anchor);
const close = css.indexOf("}", anchor);
const body = css.slice(open + 1, close).trim();
const decls = body
  .split(";")
  .map(d => d.trim())
  .filter(Boolean);

const header = `/* Vendored VERBATIM from @cloudscape-design/components/internal/
   base-component/styles.scoped.css — the design-token custom-property
   block Cloudscape emits (README fidelity lever #1). Applied to :root,
   body so var(--token,fallback) resolves to the REAL value on the
   Parascape side too. Mechanical lift, no edits. Regenerate with
   \`bun tests/visual/gen-tokens.mjs\`. */\n`;
fs.writeFileSync(out, `${header}:root, body {\n${decls.map(d => `\t${d};`).join("\n")}\n}\n`);
console.log(
  `cloudscape-tokens.css regenerated: ${decls.length} token decls, ${(fs.statSync(out).size / 1024).toFixed(1)}KB`,
);
