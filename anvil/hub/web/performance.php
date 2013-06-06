<?php
	require "common.php";
	db_open();

	function print_suite_performance($branch, $config_set, $config, $suite, $runs)
	{
		echo "<!-- START GENERATED CHART FOR SUITE [" . $suite . "] -->\n";
		echo "<div id=\"suite_chart_container\">\n";
		echo "\t<div>Suite: " . $suite . "</div>\n\n";

		$numRuns = count($runs);

		$query="SELECT DISTINCT name FROM results WHERE branch = \"" . $branch . "\" AND suite_name = \"" . $suite . "\"";
		$result=mysql_query($query);
		while($row = mysql_fetch_array($result)) {
			// need to use "id" for the 3rd element in order to deal with odd suite names
			$testId = $config_set . "_" . $config . "_" . str_replace('/', '_', $suite) . "_" . $row["name"];

			echo "\t<div id=\"suite_chart_contents\">\n";
			echo "\t\t<div id=\"" . $testId . "\" style=\"width: " . ($numRuns * 100) . "px\"></div>\n";

			echo "\t\t<script type=\"text/javascript\">\n";
			echo "\t\t\tvar runIds = [];\n";
			echo "\t\t\tvar driverIds = [];\n";
			echo "\t\t\tvar chartData = [];\n\n";

			$query2="SELECT DISTINCT driver_id FROM results WHERE branch = \"" . $branch . "\" AND name = \"" . $row["name"] . "\" AND suite_name = \"" . $suite . "\" ORDER BY driver_id ASC";
			$result2=mysql_query($query2);
			while($row2 = mysql_fetch_array($result2)) {
				echo "\t\t\tdriverIds.push(\"" . $row2["driver_id"] . "\");\n\n";
				echo "\t\t\tvar driverPerformanceData = [];\n";

				for ($i = 0; $i < $numRuns; $i++) {
					echo "\t\t\tif (runIds.length < " . ($i + 1) . ") {\n";
					echo "\t\t\t\trunIds.push(\"" . date("n-j-Y g:i:s A", $runs[$i]["timestamp"]) . "  /  " .
						substr($runs[$i]["git_hash"], 0, 10) . "\");\n";

					echo "\t\t\t}\n";

					$query3="SELECT * FROM results WHERE driver_id = \"" . $row2["driver_id"] . "\" AND run_id = " . $runs[$i]["id"] . " AND name = \"" . $row["name"] . "\" LIMIT 1";
					$result3=mysql_query($query3);

					if ($row3 = mysql_fetch_array($result3)) {
						echo "\t\t\tdriverPerformanceData.push(" . $row3["duration"] . ");\n";

					} else {
						echo "\t\t\tdriverPerformanceData.push(-1);\n";
					}
				}

				echo "\t\t\tchartData.push(driverPerformanceData);\n";
			}

			echo "\n\t\t\tdrawPerformanceCharts(\"" . $testId . "\", \"" . $row["name"] . "\", runIds, driverIds, chartData);\n";
			echo "\t\t</script>\n";
			echo "\t</div>\n";
		}

		echo "</div>\n";
		echo "<!-- END GENERATED CHART FOR SUITE [" . $suite . "] -->\n\n";
	}
?>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Reporting</title>
		<style type="text/css">
			#performance_title
			{
				text-align: left;
				margin-bottom: 30px;
			}

			#all_suites_container
			{
				margin-left: 50px;
				margin-bottom: 30px;
			}

			#branch_performance_container
			{
				margin-left: 50px;
			}

			#config_container
			{
				margin-left: 50px;
			}

			#suite_contents
			{
				margin-left: 50px;
				margin-bottom: 50px;
			}

			#suite_link
			{
				margin-left: 50px;
			}

			#suite_chart_container
			{
				margin-left: 50px;
				margin-bottom: 50px;
			}

			#suite_chart_contents
			{
				margin-left: 50px;
				margin-bottom: 40px;
			}
		</style>
	</head>
	<body>
		<div>
			<h1 id="performance_title">Anvil performance for branch [<?php echo $_GET["branch"]; ?>]</h1>
		</div>

<?php
	if (isset($_GET["suite"]) && isset($_GET["all_suites"])) {
		echo "\t\t<div id=\"all_suite_container\">\n";
		echo "\t\t\t<a href=\"performance.php?branch=" . $_GET["branch"] . "&all_suites=true\">All Suites</a> (this can take a long time to load)\n";
		echo "\t\t</div>\n";
	}
?>

		<div id="branch_performance_container">
<?php loadJsDependencies(); ?>

<?php
	if (isset($_GET["all_suites"]) || isset($_GET["suite"])) {
		echo "<a id=\"next_batch_link\" href=\"\">Next set</a>\n";
	}
?>

<?php
	// set time reporting for run history to PST since that is the main user base
	date_default_timezone_set("America/Los_Angeles");

	$numRuns = "10";
	if (isset($_GET["suite"])) {
		$numRuns = "20";
	}

	$runs = array();
	$query = "SELECT * FROM runs WHERE branch = \"" . $_GET["branch"] . "\"";

	if (isset($_GET["last_run_id"])) {
		$query = $query . " AND id < " . $_GET["last_run_id"];
	}

	$query = $query . " ORDER BY timestamp DESC LIMIT " . $numRuns;
	$result=mysql_query($query);

	$last_run_id = 0;
	while($row = mysql_fetch_array($result)) {
		array_push($runs, $row);
		$last_run_id = $row["id"];
	}

	if (isset($_GET["suite"])) {
		print_suite_performance($_GET["branch"], $_GET["config_set"], $_GET["config"], $_GET["suite"], $runs);

	} else {
		echo "<!-- START GENERATED CHARTS -->\n";

		$query="SELECT DISTINCT name FROM config_sets WHERE branch = \"" . $_GET["branch"] . "\"";
		$result=mysql_query($query);
		while($row = mysql_fetch_array($result)) {
			echo "<div>\n";
			echo "\t<div>Config Set: " . $row["name"] . "</div>\n\n";

			$query2="SELECT DISTINCT name FROM configs WHERE branch = \"" . $_GET["branch"] . "\" AND config_set_name = \"" . $row["name"] . "\"";
			$result2=mysql_query($query2);
			while($row2 = mysql_fetch_array($result2)) {
				echo "\t<div id=\"config_container\">\n";
				echo "\t\t<div>Config: " . $row2["name"] . "</div>\n\n";

				$query3="SELECT DISTINCT name FROM suites WHERE branch = \"" . $_GET["branch"] . "\" AND config_name = \"" . $row2["name"] . "\"";
				$result3=mysql_query($query3);
				while($row3 = mysql_fetch_array($result3)) {
					if(isset($_GET["all_suites"])) {
						#echo "\t\t<div id=\"suite_contents\">\n";
						#echo "\t\t\t<div>Suite: " . $row3["name"] . "</div>\n\n";
						print_suite_performance($_GET["branch"], $row["name"], $row2["name"], $row3["name"], $runs);
						#echo "\t\t</div>\n";

					} else {
						echo "\t\t<div id=\"suite_link\">\n" .
							"\t\t\t<a href=\"performance.php?branch=" . $_GET["branch"] . 
							"&config_set=" . $row["name"] . "&config=" . $row2["name"] .
							"&suite=" . $row3["name"] . "\">Suite: " . $row3["name"] . "</a>\n" .
							"\t\t</div>\n";
					}
				}

				echo "\t</div>\n";
			}

			echo "</div>\n";
		}

		echo "<!--  END GENERATED CHARTS -->\n";
	}

	if (isset($_GET["all_suites"]) || isset($_GET["suite"])) {
		echo "<script>\n" .
			"\tvar nextBatchLink = document.getElementById(\"next_batch_link\");\n" .
			"\tnextBatchLink.href = \"performance.php?branch=" . $_GET["branch"] . "&config_set=" . $_GET["config_set"] . "&config=" . $_GET["config"] . "&suite=" . $_GET["suite"] . "&last_run_id=" . $last_run_id . "\";\n" .
			"</script>\n";
	}
?>

		</div>
	</body>
</html>