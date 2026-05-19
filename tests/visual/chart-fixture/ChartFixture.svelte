<!--
  Chart geometry-parity fixture (Parascape side). Byte-identical
  config to cloudscape-ref/chart-ref.tsx (the real Cloudscape
  BarChart). chart-geom-lib extracts every SVG geom attr from both and
  numeric-diffs (Phase-0-validated harness, 0/0/0% self-check).
-->
<script lang="ts">
	import BarChart from '../../../src/lib/components/BarChart.pui';
</script>

<div
	id="stage"
	style="width:760px;background:#fff;padding:24px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
>
	<BarChart
		height={300}
		hideFilter
		series={[
			{
				title: 'Revenue',
				type: 'bar',
				data: [
					{ x: 'Jan', y: 12 },
					{ x: 'Feb', y: 19 },
					{ x: 'Mar', y: 7 },
					{ x: 'Apr', y: 24 },
					{ x: 'May', y: 15 },
				],
			},
		]}
		xDomain={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
		yDomain={[0, 30]}
		xTitle="Month"
		yTitle="USD (k)"
		ariaLabel="Revenue by month"
		i18nStrings={{ xTickFormatter: (x) => String(x), yTickFormatter: (y) => String(y) }}
	/>
</div>
