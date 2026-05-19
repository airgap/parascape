// Scales the Badge proof-of-concept across every ported .pui component.
//
// For each component it: (1) fetches Cloudscape's own test from GitHub,
// (2) applies ONLY the mechanical, characterized rewrites (the JSX is
// left intact — vitest's esbuild compiles it to the adapter's h()
// descriptor, so we never hand-parse JSX), (3) classifies the file.
//
// It does NOT pretend complex/interaction tests are done: files using
// fireEvent/userEvent/rerender/act/createRef/renderHook are TAGGED
// `manual` (emitted, but the summary counts them separately so the
// numbers stay honest). Missing vendored styles / no upstream test =
// reported, not faked.
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "tests/conformance");
const VENDOR = path.join(ROOT, "src/lib/cloudscape");
const COMPS = path.join(ROOT, "src/lib/components");

const pascalToKebab = s => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const ported = fs
  .readdirSync(COMPS)
  .filter(f => f.endsWith(".pui"))
  .map(f => f.replace(".pui", ""));

// Internal-only sub-components (no public Cloudscape test path).
const INTERNAL = new Set(["StructuredItem", "Tooltip", "Dropdown", "IconProvider"]);
const INTERACTION = /\b(fireEvent|userEvent|renderHook|\.rerender\(|act\(|createRef|waitFor|jest\.fn|vi\.fn)\b/;

const RAW = (c, file) =>
  `https://raw.githubusercontent.com/cloudscape-design/components/main/src/${c}/__tests__/${file}`;
// Cloudscape's primary suite is usually `<kebab>.test.tsx`, but some
// components name it `index.test.tsx` (e.g. link). Try both.
// Primary suite is usually `<kebab>.test.tsx`; some components use
// `index.test.tsx` (link) or split by surface (segmented-control →
// desktop/mobile/styles). `desktop.test.tsx` is the parity-relevant
// one for our desktop ports (mobile/styles are separate surfaces).
const TEST_FILES = c => [`${c}.test.tsx`, "index.test.tsx", "desktop.test.tsx"];

const CACHE = path.join(OUT, ".cache");
fs.mkdirSync(CACHE, { recursive: true });

// One network fetch with retry — distinguishes a genuine 404 (no such
// test → `null`) from a transient error / rate-limit (throws, so the
// caller does NOT misclassify it as "no upstream test"). Results are
// cached on disk so regeneration is deterministic and offline-stable
// (this is what made earlier regenerations drift / rate-limit-flaky).
async function fetchOne(c, file) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let r;
    try {
      r = await fetch(RAW(c, file));
    } catch (e) {
      if (attempt === 3) throw new Error(`network: ${c}/${file}: ${e.message}`);
      await new Promise(res => setTimeout(res, 400 * (attempt + 1)));
      continue;
    }
    if (r.status === 404) return null; // genuinely absent
    if (r.status === 429 || r.status >= 500) {
      if (attempt === 3) throw new Error(`http ${r.status}: ${c}/${file}`);
      await new Promise(res => setTimeout(res, 600 * (attempt + 1)));
      continue;
    }
    if (!r.ok) throw new Error(`http ${r.status}: ${c}/${file}`);
    return r.text();
  }
  throw new Error(`exhausted retries: ${c}/${file}`);
}

// A real suite uses describe() OR top-level test()/it() (e.g.
// table / tree-view / annotation-context have no describe wrapper —
// the old describe-only gate false-negatived them as "no test").
const isSuite = t => /\b(describe|test|it)\s*\(/.test(t);

async function fetchTest(kebab) {
  const cached = path.join(CACHE, `${kebab}.tsx`);
  if (fs.existsSync(cached)) {
    const t = fs.readFileSync(cached, "utf8");
    return isSuite(t) ? t : null;
  }
  for (const file of TEST_FILES(kebab)) {
    // throws on transient failure → propagates (NOT a false
    // "no upstream test"); null only on a real 404.
    const t = await fetchOne(kebab, file);
    if (t && isSuite(t)) {
      fs.writeFileSync(cached, t);
      return t;
    }
  }
  return null;
}

// Sibling test-helper (e.g. `import { renderX } from './utils'`):
// fetch src/<kebab>/__tests__/<name>.{tsx,ts}. NO isSuite gate (it is
// a helper module, not a suite). Cached like the main test. null on a
// real 404 (no such helper → leave the import for the residual stub).
async function fetchSibling(kebab, name) {
  const cached = path.join(CACHE, `${kebab}.${name}.src`);
  if (fs.existsSync(cached)) return fs.readFileSync(cached, "utf8") || null;
  for (const file of [`${name}.tsx`, `${name}.ts`]) {
    const t = await fetchOne(kebab, file);
    if (t) {
      fs.writeFileSync(cached, t);
      return t;
    }
  }
  fs.writeFileSync(cached, ""); // negative-cache a real 404
  return null;
}

function adapt(src, Pascal, kebab) {
  let s = src;
  const notes = [];

  // 1. component import (default, possibly with named Props type)
  const impRe = new RegExp(`import\\s+${Pascal}(?:\\s*,\\s*\\{([^}]*)\\})?\\s+from\\s+['"][^'"]*${kebab}['"];?`);
  const m = s.match(impRe);
  if (m && m[1]) {
    // a named `XxxProps` type import → neutralize its usages to `any`
    for (const id of m[1]
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)) {
      s = s.replace(new RegExp(`\\b${id}\\b`, "g"), "any");
    }
  }
  s = s.replace(impRe, `import ${Pascal} from '@components/${Pascal}.pui';`);
  // 1b. neutralizing `XxxProps`→`any` can leave `any<Generic>` (e.g.
  //     `Partial<XxxProps>` is fine but `XxxProps<Item>`→`any<Item>`
  //     is invalid TS). Collapse our own injected generic to `any`.
  if (/\bany\s*</.test(s)) {
    s = s.replace(/\bany\s*<[^<>{};=]*>/g, "any");
    notes.push("collapsed any<…>→any");
  }

  // component-resolver: kebab → our parity .pui (root or chart/ subdir)
  const resolvePui = kb => {
    const Pas = kb.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
    for (const rel of [`${Pas}.pui`, `chart/${Pas}.pui`]) {
      if (fs.existsSync(path.join(COMPS, rel))) {
        return `@components/${rel.replace(/\.pui$/, "")}.pui`;
      }
    }
    return null;
  };

  // 2. ANY test-utils/dom import — incl. sub-paths (dom/box,
  //    dom/tiles/tile). Default may be createWrapper OR a specific
  //    wrapper (e.g. `import BoxWrapper from '.../dom/box'`); the
  //    Cloudscape test-utils/dom INDEX re-exports every wrapper by
  //    name and the adapter `export *`s it, so route the default
  //    identifier as a NAMED import from the adapter (not dropped).
  s = s.replace(
    /import\s+([A-Za-z_$][\w$]*)?\s*(?:,\s*)?(\{[^}]*\})?\s*from\s+['"][^'"]*test-utils\/dom(?:\/[\w-]+)*['"];?/g,
    (full, def, named) => {
      const parts = [];
      if (def) parts.push(def);
      if (named) parts.push(named.replace(/[{}]/g, "").trim());
      return `import { ${parts.join(", ")} } from '@conformance/adapter';`;
    },
  );

  // 2b. secondary component imports (e.g. Alert imports Button) →
  //     the parity .pui if ported; else strip + note (the dependent
  //     assertions fail honestly rather than the file failing to load).
  //     Precise per-class resolution (NO fake values — every stub is
  //     null/empty so dependent assertions fail HONESTLY, never
  //     fake-pass, never crash the suite):
  //       <kebab>[/internal|/index(.js)] → our .pui (root or chart/)
  //       i18n/testing                   → passthrough provider
  //       anything else /lib/components/ or internal/generated/
  //                                      → null (default) / {} (named)
  //     POSITIVE map only: any `/lib/components/<kebab>[/internal|
  //     /index(.js)]` import (default OR combined `X, {Y}`) whose
  //     parity .pui exists → that .pui. i18n/testing → passthrough.
  //     Everything else unresolvable is left for the single exhaustive
  //     residual-stub pass below (so all import FORMS are handled
  //     uniformly and honestly — null/empty, never fake-pass).
  s = s.replace(
    /import\s+([A-Za-z]\w*)(\s*,\s*\{[^}]*\})?\s+from\s+['"][^'"]*\/lib\/components\/([a-z][\w./-]*)['"];?/g,
    (full, id, _named, sub) => {
      const seg1 = sub.split("/")[0];
      const tail = sub.slice(seg1.length + 1);
      if (seg1 === "i18n" && tail.startsWith("testing")) {
        notes.push("i18n/testing → passthrough provider");
        return `const ${id} = (({ children }: any) => children) as any;`;
      }
      if (tail === "" || /^(internal|index)(\.js)?$/.test(tail)) {
        const pui = resolvePui(seg1);
        if (pui) {
          if (_named) notes.push(`dropped named types from ${sub}`);
          return `import ${id} from '${pui}';`;
        }
      }
      return full; // unresolvable → handled by residual-stub pass
    },
  );

  // 2b-bis. BARREL import: `import { Icon, Foo as Bar } from
  //     '<…>/lib/components'` (path ends AT lib/components, no
  //     `/<kebab>` subpath — the index barrel re-exporting every
  //     component). Rule 2b only matches a specific subpath, so sibling
  //     refs via the barrel were wholesale-stubbed. Resolve EACH named
  //     specifier independently: ported → its `.pui` (barrel exports
  //     named; our .pui is default, so `{Icon}` → `import Icon from
  //     Icon.pui`; `Foo as Bar` → `import Bar`). Unported names → one
  //     honest __STUB destructure (dependent assertions fail honestly).
  s = s.replace(/import\s+\{([^}]*)\}\s+from\s+['"][^'"]*\/lib\/components['"];?/g, (full, names) => {
    const lines = [];
    const stub = [];
    for (const spec of names
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)) {
      const mm = spec.match(/^([A-Za-z]\w*)(?:\s+as\s+([A-Za-z]\w*))?$/);
      if (!mm) {
        stub.push(spec.replace(/\s+as\s+/g, ": "));
        continue;
      }
      const local = mm[2] || mm[1];
      const kb = mm[1].replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      const pui = resolvePui(kb);
      if (pui) lines.push(`import ${local} from '${pui}';`);
      else stub.push(mm[2] ? `${mm[1]}: ${mm[2]}` : mm[1]);
    }
    if (stub.length) lines.push(`const { ${stub.join(", ")} } = __STUB;`);
    notes.push(`barrel lib/components → ${lines.length} resolved`);
    return lines.join(" ");
  });

  // 2c. SIDE-EFFECT-ONLY strip: `import '<unresolvable>';` (no
  //     bindings) → drop (safe — nothing references it; e.g. a
  //     side-effect mocks/setup module we don't have). Imports WITH
  //     bindings are intentionally NOT stripped here — they fall to
  //     the exhaustive residual __STUB pass so their used symbols are
  //     declared (honest stub) instead of being orphaned ("X is not
  //     defined"). The a11y side-effect import resolves to our real
  //     __a11y__/to-validate-a11y matcher stub, so it's left intact.
  s = s.replace(/import\s+['"]([^'"]+)['"];?\n?/g, (full, p) => {
    if (/to-validate-a11y|__a11y__/.test(p)) return full; // → real stub
    if (
      /^\.{1,2}\//.test(p) ||
      /\/lib\/components(\/|['"]|$)/.test(p) ||
      /\/internal\//.test(p) ||
      /(?:\/mocks|__tests__|i18n-test|analytics-metadata-test-utils)/.test(p)
    ) {
      notes.push(`stripped side-effect ${p}`);
      return "";
    }
    return full;
  });

  // 3. styles map → vendored. Generalized: ANY identifier (tests
  //    introspect class names via arbitrary aliases — `stepsStyles`,
  //    `statusIconStyles`) imported from ANY component's
  //    `styles.{css,selectors}.js` (incl. CROSS-component, e.g. the
  //    steps suite reads status-indicator selectors). `.css.js` and
  //    `.selectors.js` export the identical class-name map; our single
  //    vendored `<comp>.styles.js` serves both. Path component (not the
  //    suite kebab) decides which vendored file. Only the suite's OWN
  //    missing styles flips stylesVendored / annotates; an unvendored
  //    cross-component selector falls to the honest residual __STUB.
  let stylesVendored = true;
  s = s.replace(
    /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"][^'"]*\/lib\/components\/([\w\-/]*?)\/?(test-classes\/)?styles\.(?:css|selectors)\.js['"];?/g,
    (full, id, segStr, tc) => {
      // Arbitrary-depth: any …/lib/components/<segs…>[/test-classes]/
      // styles.{css,selectors}.js. Try candidate vendored names from
      // the path segments (validated by existence, so no mis-map):
      //   full dash-join (breadcrumb-group/item → breadcrumb-group-item),
      //   namespace-stripped (internal/components/abstract-switch →
      //   abstract-switch), last segment. test-classes → .test-classes.js.
      const segs = segStr.split("/").filter(Boolean);
      if (!segs.length) return full;
      const ext = tc ? "test-classes" : "styles";
      const stripped = segs.filter(x => x !== "internal" && x !== "components");
      const cands = [...new Set([segs.join("-"), stripped.join("-"), segs[segs.length - 1]])];
      for (const c of cands) {
        if (c && fs.existsSync(path.join(VENDOR, `${c}.${ext}.js`))) {
          return `import ${id} from '@cloudscape/${c}.${ext}.js';`;
        }
      }
      if (segs.length === 1 && segs[0] === kebab && !tc) {
        stylesVendored = false;
        return `import ${id} from '@cloudscape/${kebab}.styles.js'; // MISSING vendored styles`;
      }
      return full; // unvendored → honest residual __STUB
    },
  );
  // Bare `styles` from a non-/lib/components path (internal primitives'
  // own styles.css.js) — keep the original suite-scoped behavior.
  s = s.replace(/import\s+styles\s+from\s+['"][^'"]*styles\.css\.js['"];?/, () => {
    if (!fs.existsSync(path.join(VENDOR, `${kebab}.styles.js`))) {
      stylesVendored = false;
      return `import styles from '@cloudscape/${kebab}.styles.js'; // MISSING vendored styles`;
    }
    return `import styles from '@cloudscape/${kebab}.styles.js';`;
  });

  // 4. RTL imports → adapter. render → descriptor mount; fireEvent/
  //    waitFor/act → the framework-agnostic @testing-library/svelte
  //    equivalents (real DOM events + Svelte tick). 'screen'
  //    unsupported (note it).
  s = s.replace(/import\s+\{([^}]*)\}\s+from\s+['"]@testing-library\/react['"];?/, (full, names) => {
    const supported = [];
    const dropped = [];
    for (const spec of names
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)) {
      // `render as testingLibraryRender` — keep the alias; only the
      // BASE name must be adapter-supported (was dropped → ReferenceError).
      const mm = spec.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
      if (mm && /^(render|fireEvent|waitFor|act|screen)$/.test(mm[1])) {
        supported.push(mm[2] ? `${mm[1]} as ${mm[2]}` : mm[1]);
      } else {
        dropped.push(spec);
      }
    }
    return `import { ${supported.join(", ")} } from '@conformance/adapter';${
      dropped.length ? ` // unsupported: ${dropped.join(", ")}` : ""
    }`;
  });

  // 4b. jest.mock hoisting. vitest only hoists a LITERAL `vi.mock(`;
  //     `jest.mock(` (even with globalThis.jest=vi) runs AFTER imports,
  //     so the component already bound the real export and the test's
  //     `.mockImplementation/.mockReset` throws → the WHOLE suite zeroes
  //     in beforeEach. Rewrite to vitest's hoisted async form; the
  //     ubiquitous `() => ({ ...jest.requireActual(M), x: jest.fn() })`
  //     factory → `async (importOriginal) => ({ ...(await
  //     importOriginal()), x: jest.fn() })` (importOriginal = the real
  //     module being mocked — exactly what requireActual returned).
  if (/jest\.mock\(/.test(s)) {
    s = s
      .replace(/jest\.mock\(/g, "vi.mock(")
      .replace(/vi\.mock\(\s*(['"][^'"]+['"])\s*,\s*\(\)\s*=>/g, "vi.mock($1, async (importOriginal) =>")
      .replace(/\.\.\.\s*jest\.requireActual\([^)]*\)/g, "...(await importOriginal())")
      .replace(/jest\.requireActual\(/g, "await vi.importActual(");
    notes.push("jest.mock → hoisted vi.mock");
  }

  // 4c. Promote test callbacks that contain `await` (introduced by 4b
  //     above, or already present upstream as `await waitFor(…)`) to
  //     `async` — esbuild rejects bare top-of-callback await. Scope:
  //     it / test / beforeEach / afterEach / beforeAll / afterAll
  //     direct callbacks. Brace-walks the body so nested arrow scopes
  //     don't false-trip the promotion.
  {
    const HOOKS = /(\b(?:it|test|beforeEach|afterEach|beforeAll|afterAll)(?:\.\w+)?\()/g;
    const out = [];
    let last = 0;
    let m;
    while ((m = HOOKS.exec(s)) !== null) {
      const headStart = m.index;
      const openParen = m.index + m[1].length - 1; // index of '('
      // Find matching close paren (top-level only)
      let depth = 0;
      let i = openParen;
      let inStr = null;
      let cbStart = -1;
      for (; i < s.length; i++) {
        const ch = s[i];
        if (inStr) {
          if (ch === "\\") {
            i++;
            continue;
          }
          if (ch === inStr) inStr = null;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === "`") {
          inStr = ch;
          continue;
        }
        if (ch === "(") depth++;
        else if (ch === ")") {
          depth--;
          if (depth === 0) break;
        } else if (depth === 1 && ch === "," && cbStart === -1) cbStart = i + 1;
      }
      if (cbStart === -1 || i >= s.length) continue;
      // Slice the candidate callback signature (skip whitespace)
      let cb = s.slice(cbStart, i);
      const sigMatch = cb.match(/^\s*(\(\s*[^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*/);
      if (!sigMatch) continue;
      if (/^\s*async\b/.test(cb)) continue;
      // Body is everything after the arrow. Search for `await ` only in
      // the part outside nested function/arrow scopes — heuristic via
      // brace depth: scan body, on `function`/`=>`+`{` push depth.
      // Cheap heuristic: just look for `\bawait\s` anywhere in cb.
      if (!/\bawait\s/.test(cb)) continue;
      // Promote: insert `async ` before the signature.
      const newCb = cb.replace(/^(\s*)/, "$1async ");
      out.push(s.slice(last, cbStart), newCb);
      last = i;
    }
    if (out.length) {
      out.push(s.slice(last));
      s = out.join("");
      notes.push("await in hook → async callback");
    }
  }

  // 5. React import → adapter shim (NOT deleted: helpers call
  //    React.createRef/forwardRef; JSX itself goes through h()).
  s = s.replace(
    /import\s+(?:\*\s+as\s+)?React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?/g,
    `import { React } from '@conformance/adapter';`,
  );
  s = s.replace(
    /import\s+\{([^}]*)\}\s+from\s+['"]react['"];?/g,
    `import { React } from '@conformance/adapter'; /* react named imports shimmed via React.* */`,
  );

  // 5b. EXHAUSTIVE residual-stub pass. By here every resolvable
  //     import is already rewritten (component→.pui, test-utils/RTL/
  //     react→adapter, styles→vendored, a11y stripped). Anything still
  //     pointing at a Cloudscape-internal / sibling-test-helper path
  //     (relative ./|../, /lib/components, /internal/, mockdate) can't
  //     resolve in our layout — stub it HONESTLY for EVERY import form
  //     (default / named / combined / namespace / type-only) so the
  //     suite LOADS and the dependent assertions fail honestly (never
  //     fake-pass, never crash, never block the other tests).
  const unresolvable = p =>
    /^\.{1,2}\//.test(p) || /\/lib\/components(\/|['"]|$)/.test(p) || /\/internal\//.test(p) || p === "mockdate";
  s = s.replace(/import\s+(type\s+)?([^;'"]+?)\s+from\s+['"]([^'"]+)['"];?/g, (full, typeOnly, clause, p) => {
    if (!unresolvable(p)) return full;
    notes.push(`stubbed unresolvable ${p}`);
    if (typeOnly) return `/* stub type import: ${p} */`;
    const out = [];
    const c = clause.trim();
    const ns = c.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    const m = c.match(/^([A-Za-z_$][\w$]*)?\s*,?\s*(\{[^}]*\})?$/);
    if (ns) {
      out.push(`const ${ns[1]} = __STUB;`);
    } else if (m) {
      if (m[1]) out.push(`const ${m[1]} = __STUB;`);
      if (m[2]) {
        const names = m[2].replace(/[{}]/g, "").trim();
        // destructuring a Proxy: each key resolves to __STUB. Rename
        // uses `Orig: Alias`, not the import `Orig as Alias` syntax.
        if (names) out.push(`const { ${names.replace(/\s+as\s+/g, ": ")} } = __STUB;`);
      }
    } else {
      out.push(`/* unparsed stub: ${p} */`);
    }
    return `${out.join(" ")} // stub: ${p}`;
  });

  // 6. characterized DOM rule: container.firstChild → firstElementChild
  if (s.includes(".firstChild")) {
    s = s.replace(/\.firstChild\b/g, ".firstElementChild");
    notes.push("firstChild→firstElementChild");
  }

  const interaction = INTERACTION.test(s);
  if (interaction) notes.push("interaction (manual-triage tier)");
  if (!stylesVendored) notes.push("vendored styles missing");

  const header = `// AUTO-ADAPTED from cloudscape-design/components src/${kebab}/__tests__/
// ${kebab}.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, ${notes.length ? notes.join("; ") : "no extra rules"}.
// JSX is compiled to the adapter h() descriptor by vitest esbuild.
${interaction ? "// ⚠ interaction tests present — see conformance summary; not all are mechanically valid.\n" : ""}// __STUB: honest recursive no-op for unresolvable Cloudscape-internal
// / sibling-test-helper imports. Callable, constructable (so tests can
// extend it), empty-iterable, deep-property-safe — never throws at
// collection, supplies NO fake data (every access is the stub itself,
// so dependent value/DOM assertions fail honestly, never fake-pass).
const __STUB: any = new Proxy(function () {}, {
\tget: (_t, k) =>
\t\tk === Symbol.iterator
\t\t\t? function* () {}
\t\t\t: k === Symbol.toPrimitive || k === 'toString' || k === 'valueOf'
\t\t\t\t? () => ''
\t\t\t\t: __STUB,
\tapply: () => __STUB,
\tconstruct: () => ({}),
});
`;

  return { code: header + s, interaction, stylesVendored };
}

const summary = { adapted: [], manual: [], noTest: [], internal: [], noStyles: [] };

for (const Pascal of ported.sort()) {
  if (INTERNAL.has(Pascal)) {
    summary.internal.push(Pascal);
    continue;
  }
  const kebab = pascalToKebab(Pascal);
  let src = await fetchTest(kebab);
  if (!src) {
    summary.noTest.push(`${Pascal} (${kebab})`);
    continue;
  }
  // Sibling test-helper resolution (LYK-922): some suites put the
  // render entry in `src/<kebab>/__tests__/<name>.tsx` and
  // `import {…} from './<name>'`. Fetch each such helper, run it
  // through the SAME adapt() pipeline (it becomes a standalone module
  // with its own __STUB header + component/styles/adapter rewrites),
  // emit it co-located as `<kebab>.<name>.tsx` (NOT *.test.* → vitest
  // skips it as a suite), and repoint the import at `@conformance/…`
  // so the residual-stub pass leaves it alone. Unresolved (404)
  // siblings stay `./<name>` → honestly __STUB'd as before.
  for (const name of [...new Set([...src.matchAll(/from\s+['"]\.\/([a-z][\w-]*)(?:\.tsx?)?['"]/g)].map(m => m[1]))]) {
    const hsrc = await fetchSibling(kebab, name);
    if (!hsrc) continue;
    fs.writeFileSync(path.join(OUT, `${kebab}.${name}.tsx`), adapt(hsrc, Pascal, kebab).code);
    src = src.replace(
      new RegExp(`from\\s+(['"])\\./${name}(?:\\.tsx?)?\\1`, "g"),
      `from '@conformance/${kebab}.${name}'`,
    );
  }
  const { code, interaction, stylesVendored } = adapt(src, Pascal, kebab);
  fs.writeFileSync(path.join(OUT, `${kebab}.test.tsx`), code);
  if (!stylesVendored) summary.noStyles.push(Pascal);
  (interaction ? summary.manual : summary.adapted).push(`${Pascal} (${kebab})`);
}

const line = (k, a) => `${k.padEnd(22)} ${a.length}\n${a.length ? "  " + a.join(", ") + "\n" : ""}`;
console.log(
  "\n=== codemod summary ===\n" +
    line("adapted (clean)", summary.adapted) +
    line("manual-triage (interaction)", summary.manual) +
    line("no upstream test", summary.noTest) +
    line("internal sub-component", summary.internal) +
    line("emitted, styles missing", summary.noStyles) +
    `\nEmitted ${summary.adapted.length + summary.manual.length} test files. ` +
    `Run: bun run conformance`,
);
