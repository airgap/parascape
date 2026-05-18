// Real Cloudscape <Table> reference render — the pixel-diff baseline.
// Same dataset/columns/props as Parascape's src/App.svelte demo so the
// diff measures port fidelity, not data differences. Pure dependency:
// this is the actual @cloudscape-design/components, unmodified.
import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import TextFilter from "@cloudscape-design/components/text-filter";
import { useState } from "react";

type Instance = {
  id: string;
  name: string;
  type: string;
  state: string;
  az: string;
  vcpus: number;
};

const items: Instance[] = [
  { id: "i-0a1", name: "web-1", type: "t3.medium", state: "Running", az: "us-east-1a", vcpus: 2 },
  { id: "i-0b2", name: "web-2", type: "t3.medium", state: "Running", az: "us-east-1b", vcpus: 2 },
  { id: "i-0c3", name: "worker-1", type: "c6i.xlarge", state: "Stopped", az: "us-east-1a", vcpus: 4 },
  { id: "i-0d4", name: "db-primary", type: "r6g.large", state: "Running", az: "us-east-1c", vcpus: 2 },
  { id: "i-0e5", name: "batch-gpu", type: "g5.xlarge", state: "Pending", az: "us-east-1b", vcpus: 4 },
  { id: "i-0f6", name: "cache-1", type: "r6g.large", state: "Running", az: "us-east-1a", vcpus: 2 },
];

const columnDefinitions = [
  { id: "name", header: "Name", cell: (i: Instance) => i.name, sortingField: "name" },
  { id: "id", header: "Instance ID", cell: (i: Instance) => i.id },
  { id: "type", header: "Type", cell: (i: Instance) => i.type, sortingField: "type" },
  { id: "state", header: "State", cell: (i: Instance) => i.state, sortingField: "state" },
  { id: "az", header: "Availability zone", cell: (i: Instance) => i.az, sortingField: "az" },
  { id: "vcpus", header: "vCPUs", cell: (i: Instance) => String(i.vcpus), sortingField: "vcpus" },
];

function App() {
  const [selected, setSelected] = useState<Instance[]>([]);
  const [filteringText, setFilteringText] = useState("");
  return (
    <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 20px" }}>
      <Table
        items={items}
        columnDefinitions={columnDefinitions}
        selectionType="multi"
        trackBy="id"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        header={<Header>Instances</Header>}
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Find instances"
            onChange={({ detail }) => setFilteringText(detail.filteringText)}
          />
        }
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
