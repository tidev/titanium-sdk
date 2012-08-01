<?php
	$connection;

	function db_open()
	{
		$username="root";
		$database="anvil_hub";

		$connection = mysql_pconnect("localhost", $username);
		if (!$connection) {
			die('Could not connect: ' . mysql_error());
		}

		@mysql_select_db($database) or die( "Unable to select database");
	}

	function print_run_results($branch = "", $limit = 0)
	{
		echo "<!--  START GENERATED -->\n";

		echo "<script type=\"text/javascript\" src=\"http://www.google.com/jsapi\"></script>\n\n" .
			"<script type=\"text/javascript\">\n" .
			"\tgoogle.load('visualization', '1', {packages: ['corechart']});\n" .
			"</script>\n\n";

		echo "<script type=\"text/javascript\">\n" .
			"\tfunction drawRunChart(chartData, timestamp, gitHash, elementId, runId) {\n" .
			"\t\tvar data = google.visualization.arrayToDataTable(\n" .
			"\t\t\tchartData\n" .
			"\t\t);\n\n" .
			"\t\tvar chartDate = new Date(timestamp * 1000).toLocaleString();\n" .
			"\t\tdocument.getElementById(elementId + \"Date\").innerHTML = chartDate;\n\n" .
			"\t\tvar chart = new google.visualization.BarChart(document.getElementById(elementId + \"Contents\"));\n" .
			"\t\tchart.draw(data, {\n" .
			"\t\t\tisStacked: true,\n" .
			"\t\t\ttitle: \"Git hash: \" + gitHash,\n" .
			"\t\t\ttitleTextStyle: {fontSize: 14},\n" .
			"\t\t\tvAxis: {title: \"Driver ID\"},\n" .
			"\t\t\thAxis: {title: \"Success / Fail\"}\n" .
			"\t\t});\n\n" .
			"\t\tgoogle.visualization.events.addListener(chart, \"select\", function(e) {\n" .
			"\t\t\tvar selection = chart.getSelection();\n" .
			"\t\t\twindow.location.href = \"driver_run_details.php?run_id=\" + runId + \"&driver_id=\" + \n" .
			"\t\t\t\tdata.getValue(selection[0].row, 0);\n" .
			"\t\t});\n" .
			"\t}\n" .
			"</script>\n\n";

		$query = "SELECT * FROM runs";
		if ($branch != "") {
			$query = $query . " WHERE branch = \"" . $branch . "\"";
		}
		if ($limit > 0) {
			$query = $query . " LIMIT " . $limit;
		}

		# need to know the number of runs before we create the div containers
		#$query="SELECT * FROM runs";
		$result=mysql_query($query);
		$numRuns = mysql_num_rows($result);

		echo "<div>\n";
		$i = 0;
		while ($i < $numRuns) {
			$style = "";
			if ($i > 0) {
				$style = " style=\"margin-top: 60px;\"";
			}

			echo "\t\t<div" . $style . ">\n" .
				"\t\t\t<div>\n" .
				"\t\t\t\t<div id=\"chart" . $i . "Date\"></div>\n" .
				"\t\t\t</div>\n" .
				"\t\t\t<div id=\"chart" . $i . "Contents\"></div>\n" .
				"\t\t</div>\n";

			$i += 1;
		}
		echo "</div>\n\n";

		echo "<script type=\"text/javascript\">\n" .
			"\tvar chartRows;\n\n";

		$i = 0;
		while($row = mysql_fetch_array($result)) {
			if ($i > 0) {
				echo "\n\n\n";
			}

			echo "\t// build and draw chart " . $i . "\n";
			echo "\tchartRows = [\n" .
				"\t\t[\"Run configuration\", \"Success\", \"Failure\"]\n" .
				"\t];\n";

			$query2="SELECT * FROM driver_runs WHERE run_id = " . $row["id"] . " LIMIT 1";
			$result2=mysql_query($query2);
			while($row2 = mysql_fetch_array($result2)) {
				echo "\tchartRows.push([\"" . $row2["driver_id"] . "\", " . $row2["passed_tests"] . 
					", " . $row2["failed_tests"] . "]);\n";

				echo "\tchartRows.push([\"" . "howdy" . "\", " . $row2["passed_tests"] . 
					", " . $row2["failed_tests"] . "]);\n";
			}

			echo "\n\tdrawRunChart(chartRows, " . $row["timestamp"] . ", \"" . 
				$row["git_hash"] . "\", \"chart" . $i . "\", " . $row["id"] . ");";

			$i += 1;
		}
		echo "\n</script>\n";

		echo "<!--  END GENERATED -->\n";
	}
?>
