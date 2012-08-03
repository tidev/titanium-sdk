<?php
	require "common.php";
	db_open();
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Reporting</title>
		<script language="javascript" type="text/javascript" src="jqplot/jquery.min.js"></script>
		<script language="javascript" type="text/javascript" src="jqplot/jquery.jqplot.min.js"></script>

		<script type="text/javascript" src="jqplot/plugins/jqplot.barRenderer.min.js"></script>
		<script type="text/javascript" src="jqplot/plugins/jqplot.categoryAxisRenderer.min.js"></script>
		<script type="text/javascript" src="jqplot/plugins/jqplot.pointLabels.min.js"></script>

		<link rel="stylesheet" type="text/css" href="jqplot/jquery.jqplot.css" />
	</head>
	<body>
		<div id="chart3" style="height:500px;width:500px; "></div>
		<script language="javascript" type="text/javascript">
			//$.jqplot('chartdiv',  [[[1, 2],[3,5.12],[5,13.1],[7,33.6],[9,85.9],[11,219.9]]]);

  var s1 = [[14,1], [3,2], [5,3], [7,5]];
  var s2 = [[1,1], [3,2], [5,3], [7,5]];
  var s3 = [[1,1], [3,2], [5,3], [7,5]];
  //plot3 = $.jqplot('chart3', [s1], {

    var plot3 = $.jqplot('chart3', [
        [[2,1], [4,2], [6,3], [3,4]], 
        [[5,1], [1,2], [3,3], [4,4]], 
        [[4,1], [7,2], [1,3], [2,4]]], {
    // Tell the plot to stack the bars.
    stackSeries: true,
    captureRightClick: true,
    seriesDefaults:{
      renderer:$.jqplot.BarRenderer,
      rendererOptions: {
	barDirection: 'horizontal',
          // Put a 30 pixel margin between bars.
          barMargin: 30,
          // Highlight bars when mouse button pressed.
          // Disables default highlighting on mouse over.
          highlightMouseDown: true   
      },
      pointLabels: {show: true}
    },
    axes: {
      yaxis: {
          renderer: $.jqplot.CategoryAxisRenderer
      },
      yaxis: {
        // Don't pad out the bottom of the data range.  By default,
        // axes scaled as if data extended 10% above and below the
        // actual range to prevent data points right on grid boundaries.
        // Don't want to do that here.
        padMin: 0
      }
    },
    legend: {
      show: true,
      location: 'e',
      placement: 'outside'
    }      
  });
  // Bind a listener to the "jqplotDataClick" event.  Here, simply change
  // the text of the info3 element to show what series and ponit were
  // clicked along with the data for that point.
  $('#chart3').bind('jqplotDataClick', 
    function (ev, seriesIndex, pointIndex, data) {
      $('#info3').html('series: '+seriesIndex+', point: '+pointIndex+', data: '+data);
    }
  ); 
		</script>

		<div>
			<h1 style="text-align: left; margin-bottom: 50px">Anvil results</h2>
		</div>

		<div>
			<div style="float: left; width: 20%">
				<div style="margin-bottom: 10px">
					<div>Branches</div>
					<div style="margin-left: 20px;">
						<!-- generate branch list here -->
<?php
	$query="SELECT DISTINCT branch FROM runs;";
	$result=mysql_query($query);

	while($row = mysql_fetch_array($result)) {
		$branch = $row["branch"];
		echo "<div onclick=\"javascript:window.location.href = 'branch_runs.php?branch=" . $branch . "'\">" . $branch . "</div>\n";
	}
?>
					</div>
				</div>
			</div>
			<div style="float: left; width: 50%">
<?php
	print_run_results();
?>
			</div>
		</div>
	</body>
</html>
