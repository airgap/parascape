// Open-state parity fixture (Cloudscape side). Content/props
// byte-identical to ../ann-fixture/AnnFixture.svelte. The <Hotspot>
// child registers and (open defaults true) the OpenAnnotation renders
// immediately; ann-shoot screenshots the popover body's own bbox.
import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import AnnotationContext from "@cloudscape-design/components/annotation-context";
import Hotspot from "@cloudscape-design/components/hotspot";

// FIXTURE-ONLY: pin the popover container at a fixed shared origin
// (identical to ann-fixture/AnnFixture.svelte) so BOTH bodies render
// at the same absolute pixel grid — the body-bbox diff then measures
// true fidelity, not glyph AA from the documented-omitted runtime
// positioning. Overrides only the fixture, never the component.
const pin = document.createElement("style");
pin.textContent =
  '[class*="awsui_container"]{position:fixed!important;top:0!important;left:0!important;right:auto!important;bottom:auto!important;transform:none!important}';
document.head.appendChild(pin);

const tutorial = {
  tasks: [
    {
      title: "Getting started",
      steps: [
        {
          hotspotId: "s1",
          content: "This is the first step of the tour. Follow the highlighted areas to learn the workflow.",
        },
        { hotspotId: "s2", content: "Second step content.", warningAlert: "Heads up: this changes data." },
      ],
    },
  ],
};
const i18nStrings = {
  taskTitle: (_i: number, t: string) => t,
  stepCounterText: (l: number, total: number) => `Step ${l + 1} of ${total}`,
  labelHotspot: (_o: boolean, l: number, total: number) => `Annotation ${l + 1} of ${total}`,
  labelDismissAnnotation: "Dismiss",
  nextButtonText: "Next",
  previousButtonText: "Previous",
  finishButtonText: "Finish",
};

function App() {
  return (
    <div
      id="stage"
      style={{
        width: 760,
        background: "#fff",
        padding: 64,
        fontFamily: "'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
      }}
    >
      <AnnotationContext currentTutorial={tutorial} i18nStrings={i18nStrings as any}>
        <Hotspot hotspotId="s1" />
        <Hotspot hotspotId="s2" />
      </AnnotationContext>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
