// LYK-952 per-node CRDT merge — a deterministic unit test of the shared mapping
// (src/lib/collab-doc.ts), no browser/server. Two docs share an initial state,
// then concurrently edit DIFFERENT nodes; with per-node storage both edits
// survive (per-page last-writer-wins would drop one). Run with bun:
//   bun tests/visual/collab-merge-verify.mjs
import * as Y from "yjs";
import { projectToYDoc, ydocToProject } from "../../src/lib/collab-doc.ts";

let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};

const baseProject = {
  pages: [
    {
      id: 1,
      name: "Home",
      route: "/",
      params: "",
      doc: {
        sections: [
          { key: 10, type: "component", comp: "box", content: "X-orig", style: {} },
          { key: 11, type: "component", comp: "box", content: "Y-orig", style: {} },
        ],
        codeOverride: null,
      },
    },
  ],
  activePageId: 1,
  nextKey: 20,
  components: [],
  nextCompId: 1,
  data: {},
};

// two docs sharing the same initial state
const d1 = new Y.Doc();
const d2 = new Y.Doc();
projectToYDoc(d1, baseProject);
Y.applyUpdate(d2, Y.encodeStateAsUpdate(d1)); // d2 == d1
const sv1 = Y.encodeStateVector(d1);
const sv2 = Y.encodeStateVector(d2);

// concurrent, divergent edits to DIFFERENT nodes
const p1 = ydocToProject(d1);
p1.pages[0].doc.sections.find(s => s.key === 10).content = "X-EDIT-by-1";
projectToYDoc(d1, p1);

const p2 = ydocToProject(d2);
p2.pages[0].doc.sections.find(s => s.key === 11).content = "Y-EDIT-by-2";
projectToYDoc(d2, p2);

// exchange the divergent updates
Y.applyUpdate(d2, Y.encodeStateAsUpdate(d1, sv2));
Y.applyUpdate(d1, Y.encodeStateAsUpdate(d2, sv1));

for (const [name, d] of [
  ["doc1", d1],
  ["doc2", d2],
]) {
  const secs = ydocToProject(d).pages[0].doc.sections;
  const x = secs.find(s => s.key === 10)?.content;
  const y = secs.find(s => s.key === 11)?.content;
  ok(`${name}: node 10 keeps editor-1's change`, x === "X-EDIT-by-1", { x });
  ok(`${name}: node 11 keeps editor-2's change`, y === "Y-EDIT-by-2", { y });
}
ok("the two docs converge to the same state", JSON.stringify(ydocToProject(d1)) === JSON.stringify(ydocToProject(d2)));

// round-trip fidelity: a nested tree survives flatten → rebuild unchanged
const nested = {
  ...baseProject,
  pages: [
    {
      ...baseProject.pages[0],
      doc: {
        sections: [
          {
            key: 20,
            type: "container",
            comp: "box",
            style: {},
            children: [{ key: 21, type: "component", comp: "button", content: "nested", style: {} }],
          },
        ],
        codeOverride: null,
      },
    },
  ],
};
const d3 = new Y.Doc();
projectToYDoc(d3, nested);
const rt = ydocToProject(d3).pages[0].doc.sections;
ok("nested children round-trip", rt[0]?.children?.[0]?.content === "nested" && rt[0]?.children?.[0]?.key === 21, rt);

console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: per-node CRDT merge — concurrent edits to different nodes both survive + nested round-trip.",
);
process.exit(fail ? 1 : 0);
