<!-- Area geometry-parity fixture (Parascape). Byte-identical config to
     cloudscape-ref/area-ref.tsx. chart-geom-lib leaf-multiset + pixel. -->
<script lang="ts">
	import AreaChart from '../../../src/lib/components/AreaChart.pui';
</script>
<div id="stage" style="width:760px;background:#fff;padding:24px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
	<AreaChart
		height={300}
		hideFilter
		series={[
			{ title: 'Series A', type: 'area', data: [ {x:0,y:10},{x:1,y:30},{x:2,y:22},{x:3,y:41},{x:4,y:18} ] },
			{ title: 'Series B', type: 'area', data: [ {x:0,y:5},{x:1,y:8},{x:2,y:14},{x:3,y:3},{x:4,y:27} ] },
		]}
		xDomain={[0, 4]}
		yDomain={[0, 70]}
		xTitle="Time"
		yTitle="Value"
		ariaLabel="Stacked area"
		i18nStrings={{ xTickFormatter: (x) => String(x), yTickFormatter: (y) => String(y) }}
	/>
</div>
