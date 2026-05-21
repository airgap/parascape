import { useMemo, useState } from "react";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import SpaceBetween from "@cloudscape-design/components/space-between";

type Txn = { id: string; category: string; amount: number };
const txns: Txn[] = [
  { id: "t1", category: "food", amount: 42 },
  { id: "t2", category: "travel", amount: 180 },
  { id: "t3", category: "food", amount: 12 },
  { id: "t4", category: "travel", amount: 95 },
  { id: "t5", category: "office", amount: 64 },
  { id: "t6", category: "food", amount: 8 },
  { id: "t7", category: "office", amount: 220 },
];

export default function PipelineCloudscape() {
  const [minAmount, setMinAmount] = useState(50);

  // Same filter → map → sum. Written as a native method chain and
  // fused into the same single loop the Para side gets — fusion is
  // a source transform, not a language feature, so both panes run
  // identical machine code. The visible difference is readability.
  const total = useMemo(
    () =>
      txns
        .filter(t => t.amount >= minAmount)
        .map(t => t.amount)
        .reduce((a, b) => a + b, 0),
    [minAmount],
  );
  const count = useMemo(() => txns.filter(t => t.amount >= minAmount).length, [minAmount]);
  const avg = useMemo(() => (count > 0 ? Math.round(total / count) : 0), [total, count]);

  return (
    <Container
      header={
        <Header variant="h2" description="Filter → map → sum, fused into one loop.">
          Spend over threshold
        </Header>
      }
    >
      <SpaceBetween size="m">
        <KeyValuePairs
          columns={3}
          items={[
            { label: "Matching", value: `${count} of ${txns.length}` },
            { label: "Total", value: `$${total}` },
            { label: "Average", value: `$${avg}` },
          ]}
        />
        <Box variant="awsui-key-label">Minimum amount: ${minAmount}</Box>
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => setMinAmount(0)}>$0</Button>
          <Button onClick={() => setMinAmount(50)}>$50</Button>
          <Button onClick={() => setMinAmount(100)}>$100</Button>
          <Button onClick={() => setMinAmount(200)}>$200</Button>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  );
}
