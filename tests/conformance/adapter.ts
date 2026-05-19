// Cloudscape-test → .pui adapter.
//
// The three layers of a Cloudscape `*.test.tsx` (see README lever #2):
//   render   — React `render(<C/>)`  →  here: Svelte mount of the .pui
//   wrapper  — `createWrapper(container).findX()`  →  re-exported VERBATIM
//              (Cloudscape's test-utils traverse the DOM by the hashed
//              styles.css.js classes, which we vendor identically — they
//              are framework-agnostic and do not care that Svelte, not
//              React, produced the nodes)
//   assert   — jest-dom matchers  →  run unchanged (see setup.ts)
//
// So this file is the entire render-layer shim. `nativeAttributes` is
// normalized to a prop spread because that is LITERALLY what Cloudscape
// does internally (getBaseProps spreads it onto the root) — equivalent,
// not a fudge; documented so the oracle stays honest.
import { render as svelteRender, fireEvent } from "@testing-library/svelte";
import { waitFor, screen } from "@testing-library/dom";

// fireEvent: @testing-library/svelte's — dispatches REAL DOM events
// then flushes Svelte's tick. Framework-agnostic; the .pui components
// attach real listeners (onclick/oninput/…), so Cloudscape's
// fireEvent.click(wrapper.findX().getElement()) drives them correctly.
// act: svelte-testing-library has none (no React batching); a microtask
// flush is the faithful equivalent for "let effects settle".
const act = async (cb?: () => unknown) => {
  await cb?.();
  await Promise.resolve();
};
// screen: @testing-library/dom's, bound to document.body — our render
// mounts there, so screen.{get,query,find}By* work against the
// .pui-rendered DOM unchanged.
export { fireEvent, waitFor, act, screen };
import createWrapper from "@cloudscape-design/components/test-utils/dom";
// Re-export every named wrapper (BadgeWrapper, AnchorNavigationWrapper,
// ElementWrapper, …) verbatim so codemod-rewritten named imports
// resolve. These are framework-agnostic DOM queries keyed on the
// vendored hashes — they work against the .pui DOM unchanged.
export * from "@cloudscape-design/components/test-utils/dom";
import Harness from "./Harness.svelte";

export { createWrapper };

export interface RenderResult {
  container: HTMLElement;
}

/**
 * Mirrors React Testing Library `render(<Component {...props}>{text}</Component>)`.
 * @param component  the default export of a `.pui` module
 * @param opts.props component props (Cloudscape `nativeAttributes` is
 *                   flattened into the spread — same as Cloudscape's
 *                   internal getBaseProps behaviour)
 * @param opts.text  default-slot text content, if any
 */
// Custom JSX pragma: Cloudscape tests author `render(<Comp p={v}>text
// </Comp>)`. Configured as the esbuild jsxFactory for the conformance
// dir, this turns that JSX into a descriptor instead of React.
// createElement — so the codemod does NOT have to parse/transform JSX
// by hand (the fragile part). A descriptor is `{ __pui, component,
// props, text }`. Nested element children collapse to their text
// (sufficient for the presentational tier; richer composition is the
// manual-triage tier the codemod flags, not silently mis-handles).
// A descriptor keeps its CHILDREN as a tree (string | descriptor), so
// composite tests like render(<Container><Header>X</Header>body
// </Container>) mount real child components — Descriptor.svelte renders
// it recursively. (Plain `__pui:true` flag — Descriptor.svelte checks
// that, not a Symbol.)
export interface PuiDescriptor {
  __pui: true;
  component: unknown;
  props: Record<string, unknown>;
  children: unknown[];
}
function isDescriptor(x: unknown): x is PuiDescriptor {
  return !!x && typeof x === "object" && (x as any).__pui === true;
}

// Per-descriptor prop normalization, applied at EVERY level so nested
// components get it too: nativeAttributes flattened + React className ≡
// Svelte class (Cloudscape's getBaseProps concatenates className into
// the component class — equivalent to our clsx(class,…) merge).
function normalizeProps(p: Record<string, unknown> | null): Record<string, unknown> {
  const { nativeAttributes, ...rest } = (p ?? {}) as Record<string, unknown>;
  const merged = { ...rest, ...((nativeAttributes as Record<string, unknown>) ?? {}) };
  if ("className" in merged) {
    merged.class = merged.className;
    delete merged.className;
  }
  return merged;
}

export function h(component: unknown, props: Record<string, unknown> | null, ...children: unknown[]): PuiDescriptor {
  return {
    __pui: true,
    component,
    props: normalizeProps(props),
    children: children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false),
  };
}
export const Fragment = "fragment";

// Minimal React compat: Cloudscape test helpers reference React.createRef/
// forwardRef/Fragment (NOT for rendering — JSX goes through h()). Shim
// just the surface they touch so the codemod can alias `React` instead
// of deleting the import (deleting broke helpers that call React.*).
export const React = {
  createRef: <T>() => ({ current: null as T | null }),
  forwardRef: <T>(fn: T) => fn,
  Fragment,
  createElement: h,
};

export function render(
  componentOrDescriptor: unknown,
  opts: { props?: Record<string, unknown>; text?: string } = {},
): RenderResult {
  // Accept render(<JSX/>) (descriptor) OR render(Comp, {props,text}).
  const node = isDescriptor(componentOrDescriptor)
    ? componentOrDescriptor
    : h(
        componentOrDescriptor,
        (opts.props ?? {}) as Record<string, unknown>,
        ...(opts.text !== undefined && opts.text !== null ? [opts.text] : []),
      );
  const { container } = svelteRender(Harness, { props: { node } });
  return { container };
}
