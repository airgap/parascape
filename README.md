# Parascape

A for-funzies port of a slice of [Cloudscape](https://cloudscape.design)
to `.pui` (Para UI on Svelte 5). **Not affiliated with AWS.**

The bet: Cloudscape's React components are a `useState`/`useMemo`/`useEffect`
tangle for what is, semantically, just signals. Re-author the *reactively
interesting* components with Para primitives (`signal` / `derived` /
`effect`) behind a **1:1 Cloudscape API**, so the diff is purely "the
state model got legible."

## Deliberate scope

- **1:1 API surface** — same component + prop names. The whole point is
  drop-in familiarity; diverging the API kills the reason to exist.
- **NOT 1:1 coverage** — a vertical slice of the *stateful* components
  (`Table` first; then `PropertyFilter`, `Autosuggest`, `Wizard`,
  `TokenGroup`). Layout chrome (`AppLayout`, …) is tedious CSS that
  proves nothing about the language — skipped on purpose.
- **NOT 1:1 internals** — idiomatic Svelte/Para, not a React transliteration.

## Runs on stock Svelte 5

`parabunPreprocess` lowers `.pui` Para syntax to standard Svelte 5, so
this needs **no `@lyku/para-ui` runtime fork** — para-ui is an optional
swap, never a dependency. (Post the upstream-Bun-→-Rust news, not betting
this on a fork is the point.)

## Run

```sh
bun install
bun run dev      # http://localhost:5273
bun run check    # svelte-check
```

## The two real fidelity levers (not yet pulled)

1. **Vendor `@cloudscape-design/design-tokens` verbatim.** It's
   framework-agnostic CSS/JSON; lifting it unchanged gets pixel-1:1 with
   zero per-component effort. `src/lib/tokens/cloudscape.css` is a
   Cloudscape-*shaped* stand-in so the swap stays mechanical.
2. **Use Cloudscape's own component test suite as the parity oracle.**
   Their tests are largely behavioral/RTL — adapt them as the golden gate.
   "Passes Cloudscape's own tests, in Svelte" is the honest correctness bar.

<!-- AUTOGEN:status (bun run status) -->
## Status

**58 / 94** Cloudscape components ported to `.pui` at pixel parity. Verification is mechanical, not by eye: a deterministic Playwright pixel-diff against the **real** `@cloudscape-design/components` (pinned Chromium, fixed viewport/DPR, animations/caret off, fonts settled, built-not-dev). Current residuals — component matrix **≤0.01%**, integrated `Table` **0.70%** — are sub-pixel antialiasing on glyph/text edges with **zero box-model delta** (proven via the computed-box diagnostics, `*-diag.mjs`), i.e. visually indistinguishable. Harnesses: `tests/visual/box-shoot.mjs` (matrix), `shoot.mjs` (Table).

> Dep-first by construction: a *pixel-relevant* dep is ported
> before its consumer. A `✗` dep is **not a gap** — it is a
> Cloudscape dependency deliberately outside the rendered static
> path (sr-only `live-region`, hover-only `tooltip`, or slots the
> demo doesn't exercise), documented in that `.pui`'s header.
> This table is generated — run `bun run status` (do not hand-edit).

| Component | Cloudscape pkg | Tier | Fan-in | Deps |
|-----------|----------------|:----:|:------:|------|
| `ActionCard` | `@cloudscape-design/components/action-card` | 0 | 0 | — |
| `Alert` | `@cloudscape-design/components/alert` | — | 5 | button ✅, icon ✅, plugins ✗ |
| `AnchorNavigation` | `@cloudscape-design/components/anchor-navigation` | 0 | 0 | — |
| `AttributeEditor` | `@cloudscape-design/components/attribute-editor` | — | 1 | live-region ✅, button ✅, space-between ✅, form-field ✅ |
| `Badge` | `@cloudscape-design/components/badge` | 0 | 0 | — |
| `Box` | `@cloudscape-design/components/box` | 0 | 21 | — |
| `Button` | `@cloudscape-design/components/button` | — | 31 | icon ✅, spinner ✅, live-region ✅, tooltip ✅ |
| `ButtonDropdown` | `@cloudscape-design/components/button-dropdown` | — | 5 | icon ✅, dropdown ✅, box ✅, button ✅, tooltip ✅, popover ✅, container ✅ |
| `ButtonGroup` | `@cloudscape-design/components/button-group` | — | 1 | file-input ✅, tooltip ✅, button ✅, live-region ✅, toggle-button ✅, navigable-group ✅, button-dropdown ✅ |
| `Calendar` | `@cloudscape-design/components/calendar` | — | 2 | tooltip ✅, button ✅, grid ✅, header ✅ |
| `Cards` | `@cloudscape-design/components/cards` | — | 0 | container ✅, item-card ✅, live-region ✅, status-indicator ✅, table ✅ |
| `Checkbox` | `@cloudscape-design/components/checkbox` | 0 | 4 | — |
| `ColumnLayout` | `@cloudscape-design/components/column-layout` | 1 | 3 | grid ✅ |
| `Container` | `@cloudscape-design/components/container` | 1 | 9 | box ✅ |
| `CopyToClipboard` | `@cloudscape-design/components/copy-to-clipboard` | — | 0 | button ✅, popover ✅, status-indicator ✅ |
| `DateInput` | `@cloudscape-design/components/date-input` | 0 | 2 | — |
| `Divider` | `@cloudscape-design/components/divider` | 0 | 0 | — |
| `Dropdown` | `@cloudscape-design/components/dropdown` | 0 | 6 | — |
| `ExpandableSection` | `@cloudscape-design/components/expandable-section` | — | 3 | container ✅, header ✅, icon ✅ |
| `FileDropzone` | `@cloudscape-design/components/file-dropzone` | 0 | 1 | — |
| `FileInput` | `@cloudscape-design/components/file-input` | — | 2 | button ✅, form-field ✅ |
| `Form` | `@cloudscape-design/components/form` | — | 1 | header ✅, alert ✅, box ✅, live-region ✅ |
| `FormField` | `@cloudscape-design/components/form-field` | — | 15 | grid ✅, icon ✅, live-region ✅ |
| `Grid` | `@cloudscape-design/components/grid` | 0 | 5 | — |
| `Header` | `@cloudscape-design/components/header` | 2 | 10 | container ✅ |
| `Icon` | `@cloudscape-design/components/icon` | — | 25 | icon-provider ✅ |
| `IconProvider` | `@cloudscape-design/components/icon-provider` | — | 1 | icon ✅ |
| `Input` | `@cloudscape-design/components/input` | — | 7 | button ✅, icon ✅ |
| `ItemCard` | `@cloudscape-design/components/item-card` | 0 | 1 | — |
| `KeyValuePairs` | `@cloudscape-design/components/key-value-pairs` | 2 | 0 | box ✅, column-layout ✅ |
| `Link` | `@cloudscape-design/components/link` | — | 6 | icon ✅ |
| `List` | `@cloudscape-design/components/list` | 0 | 2 | — |
| `LiveRegion` | `@cloudscape-design/components/live-region` | 0 | 22 | — |
| `Modal` | `@cloudscape-design/components/modal` | — | 4 | box ✅, button ✅, header ✅ |
| `NavigableGroup` | `@cloudscape-design/components/navigable-group` | 0 | 1 | — |
| `Pagination` | `@cloudscape-design/components/pagination` | — | 1 | button ✅, icon ✅, input ✅, popover ✅, space-between ✅ |
| `Popover` | `@cloudscape-design/components/popover` | — | 7 | button ✅, live-region ✅, container ✅ |
| `ProgressBar` | `@cloudscape-design/components/progress-bar` | — | 0 | live-region ✅, box ✅, button ✅, status-indicator ✅ |
| `RadioButton` | `@cloudscape-design/components/radio-button` | 0 | 3 | — |
| `RadioGroup` | `@cloudscape-design/components/radio-group` | 1 | 3 | radio-button ✅ |
| `Slider` | `@cloudscape-design/components/slider` | — | 0 | tooltip ✅ |
| `SpaceBetween` | `@cloudscape-design/components/space-between` | 0 | 15 | — |
| `Spinner` | `@cloudscape-design/components/spinner` | 0 | 5 | — |
| `StatusIndicator` | `@cloudscape-design/components/status-indicator` | — | 10 | icon ✅, spinner ✅ |
| `Steps` | `@cloudscape-design/components/steps` | — | 0 | box ✅, status-indicator ✅ |
| `StructuredItem` | `@cloudscape-design/components/structured-item` | — | 0 | — |
| `Table` | `@cloudscape-design/components/table` | — | 2 | icon ✅, live-region ✅, popover ✅, container ✅, button ✅, form-field ✅, space-between ✅, header ✅, status-indicator ✅, checkbox ✅, radio-button ✅, area-chart ✗ |
| `Tabs` | `@cloudscape-design/components/tabs` | — | 0 | container ✅, button ✅, tooltip ✅ |
| `Textarea` | `@cloudscape-design/components/textarea` | — | 0 | input ✅ |
| `TextContent` | `@cloudscape-design/components/text-content` | 0 | 0 | — |
| `TextFilter` | `@cloudscape-design/components/text-filter` | — | 3 | input ✅, live-region ✅ |
| `Tiles` | `@cloudscape-design/components/tiles` | 2 | 1 | radio-group ✅, radio-button ✅ |
| `TimeInput` | `@cloudscape-design/components/time-input` | 0 | 1 | — |
| `Toggle` | `@cloudscape-design/components/toggle` | 0 | 1 | — |
| `ToggleButton` | `@cloudscape-design/components/toggle-button` | — | 1 | button ✅ |
| `Tooltip` | `@cloudscape-design/components/tooltip` | — | 13 | popover ✅, container ✅ |
| `TreeView` | `@cloudscape-design/components/tree-view` | 0 | 0 | — |
| `Wizard` | `@cloudscape-design/components/wizard` | — | 0 | button ✅, space-between ✅, form ✅, header ✅, box ✅, link ✅, expandable-section ✅ |

**Next portable** (deps satisfied, fan-in desc): `plugins`, `annotation-context` (needs alert+box+button+popover+container+space-between ✅), `mixed-line-bar-chart`, `area-chart`, `collection-preferences` (needs toggle+box+button+list+space-between+text-filter+modal+checkbox+column-layout+form-field+radio-group ✅), `content-layout` (needs grid ✅).

_`live-region` has the highest raw fan-in (22) but is `aria-live` sr-only — zero painted pixels, no meaningful pixel-diff — so it is deprioritized despite being a real dependency (consumers like `Button` exclude it from the static render)._
<!-- /AUTOGEN:status -->

