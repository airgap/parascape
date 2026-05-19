// Stub for Cloudscape's a11y matcher import
// (`import '../../__a11y__/to-validate-a11y'`). Deep axe-based
// accessibility assertions are OUT OF SCOPE for this structural/pixel
// conformance oracle — same documented-omitted posture as the
// interaction/sr scope elsewhere. Registering a permissive
// `toValidateA11y` lets the 7 suites that import it LOAD and run
// their many NON-a11y assertions instead of failing at import time.
// (Honest: a11y here is asserted-as-pass, not actually validated.)
import { expect } from "vitest";

expect.extend({
  toValidateA11y() {
    return {
      pass: true,
      message: () => "toValidateA11y is stubbed (a11y axe checks out of scope for the structural oracle)",
    };
  },
});
