// assumes that the jqPlot dependencies have already been loaded
function drawRunCharts(elementId, branch, gitHash, timestamp, runId, driverIds, chartData) {
	var chartDate = new Date(timestamp * 1000).toLocaleString();
	document.getElementById(elementId + "Date").innerHTML = chartDate;

	document.getElementById(elementId + "Branch").innerHTML = branch;
	document.getElementById(elementId + "Githash").innerHTML = gitHash;

	var series = [
		{label: "Pass"},
		{label: "Fail"}
	];

	$.jqplot(elementId + "Contents", chartData, {
		stackSeries: true,
		seriesDefaults: {
			renderer:$.jqplot.BarRenderer,
			rendererOptions: {
				barDirection: 'horizontal',
				barMargin: 20,
				highlightMouseDown: true   
			},
			pointLabels: {show: true}
		},
		series: series,
		axes: {
			xaxis: {
				label: "Pass / Fail"
			},
			yaxis: {
				label: "Driver ID",
				renderer: $.jqplot.CategoryAxisRenderer,
				ticks: driverIds,
				padMin: 0
			}
		},
		legend: {
			show: true,
			location: 'e',
			placement: 'outside'
		}      
	});

	$("#" + elementId + "Contents").bind('jqplotDataClick', function (event, seriesIndex, pointIndex, data) {
		window.location.href = "results.php?branch=" + branch + "&git_hash=" + gitHash + 
			"&run_id=" + runId + "&driver_id=" + driverIds[pointIndex];
	});
}

// assumes that the jqPlot dependencies have already been loaded
function drawPerformanceCharts(elementId, chartTitle, runIds, driverIds, chartData) {
	var series = [];
	for (var i = 0; i < driverIds.length; i++) {
		series.push({label: driverIds[i]});
	}

	$.jqplot(elementId, chartData, {
		title: chartTitle, 
		seriesDefaults: {
			showMarker:false,
			pointLabels: {show:true}
		},
		series: series,
		axes: {
			xaxis: {
				label: "Run ID",
				renderer: $.jqplot.CategoryAxisRenderer,
				ticks: runIds,
			},
			yaxis: {
				label: "Milliseconds"
			}
		},
		legend: {
			show: true,
			location: 'e',
			placement: 'outside'
		}
	});
}
