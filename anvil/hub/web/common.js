// direct alias doesn't work in chrome so wrapping inside within function
var getElementById = function(id) {
        return document.getElementById(id);
};

var jqplotRef = $.jqplot;

// assumes that the jqPlot dependencies have already been loaded
function drawRunCharts(elementId, branch, gitHash, timestamp, runId, driverIds, chartData) {
	var chartDate = new Date(timestamp * 1000).toLocaleString(),
	series = [
		{label: "Pass"},
		{label: "Fail"}
	];

	getElementById(elementId + "Date").innerHTML = chartDate;
	getElementById(elementId + "Branch").innerHTML = branch;
	getElementById(elementId + "Githash").innerHTML = gitHash;

	jqplotRef(elementId + "Contents", chartData, {
		stackSeries: true,
		seriesDefaults: {
			renderer:jqplotRef.BarRenderer,
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
				renderer: jqplotRef.CategoryAxisRenderer,
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
	var series = [],
	i = 0;

	for (; i < driverIds.length; i++) {
		series.push({label: driverIds[i]});
	}

	jqplotRef(elementId, chartData, {
		title: chartTitle, 
		seriesDefaults: {
			showMarker:false,
			pointLabels: {show:true},
			shadow: false
		},
		series: series,
		axes: {
			xaxis: {
				label: "Run ID",
				renderer: jqplotRef.CategoryAxisRenderer,
				tickRenderer: jqplotRef.CanvasAxisTickRenderer,
				tickOptions: {
					angle: -30
				},
				ticks: runIds
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
