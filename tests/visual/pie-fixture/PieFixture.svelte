<!-- Pie geometry-parity fixture (Parascape). Byte-identical config to
     cloudscape-ref/pie-ref.tsx. chart-geom-lib leaf-multiset + pixel. -->
<script lang="ts">
	import PieChart from '../../../src/lib/components/PieChart.pui';
</script>
<div id="stage" style="width:760px;background:#fff;padding:24px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
	<PieChart
		size="medium"
		variant="pie"
		hideFilter
		ariaLabel="Resource breakdown"
		data={[
			{ title: 'Running', value: 40 },
			{ title: 'Stopped', value: 25 },
			{ title: 'Pending', value: 20 },
			{ title: 'Terminated', value: 15 },
		]}
		i18nStrings={{ detailsValue: 'Value', detailsPercentage: 'Percentage' }}
	/>
</div>
