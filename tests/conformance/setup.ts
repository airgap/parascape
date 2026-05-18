// jest-dom matchers (toHaveClass / toHaveTextContent / …) — framework-
// agnostic, so Cloudscape's assertions run unchanged against the
// .pui-rendered DOM.
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Cloudscape's tests call jest.fn()/jest.spyOn()/jest.useFakeTimers()
// as a global (they're jest-authored). vitest's `vi` is API-compatible
// for these; expose it as `jest` so the unmodified test bodies run.
// This is a faithful compat shim (vi.fn ≡ jest.fn, etc.), not a
// behavioral change — it just stops 171 tests throwing
// `ReferenceError: jest is not defined` before they can assert.
(globalThis as any).jest = vi;
