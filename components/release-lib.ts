// Build + pack the component library and publish it as a GitHub release on the
// repo — no npm publish needed. E installs the library from the release tarball.
//
//   bun run release:lib            # tag from package.json version
//   bun run release:lib 0.1.0      # explicit version
//
// Requires: the release commit pushed to origin, and `gh` authenticated. The
// tarball is `npm pack` output (files: dist + component-manifest.json).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const version = (process.argv[2] ?? pkg.version).replace(/^v/, "");
const tag = `components-v${version}`;
const componentCount = Object.keys(pkg.exports ?? {}).filter(k => k.startsWith("./") && !k.endsWith(".json")).length;

async function run(cmd: string[], capture = false): Promise<string> {
  const proc = Bun.spawn(cmd, {
    cwd: ROOT,
    stdout: capture ? "pipe" : "inherit",
    stderr: "inherit",
  });
  const out = capture ? await new Response(proc.stdout).text() : "";
  if ((await proc.exited) !== 0) {
    console.error(`\nfailed: ${cmd.join(" ")}`);
    process.exit(1);
  }
  return out;
}

await run(["bun", "run", "build:lib"]);
const tgz = (await run(["npm", "pack", "--silent"], true)).trim().split("\n").pop()!.trim();
console.log("packed:", tgz);

await run([
  "gh",
  "release",
  "create",
  tag,
  tgz,
  "--title",
  `@parascape-design/components ${version}`,
  "--notes",
  `Precompiled Svelte component library — ${componentCount} components + component-manifest.json.\n\nInstall into E from this release's tarball asset (no npm needed).`,
]);
console.log(`\nreleased ${tag} with ${tgz}`);
