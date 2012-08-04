<?php
	require "common.php";
	db_open();

	function print_suite_performance($branch, $config_set, $config, $suite, $runs)
	{
		echo "<!-- START GENERATED CHART FOR SUITE [" . $suite . "] -->\n";
		echo "<div style=\"margin-left: 50px; margin-bottom: 50px\">\n";
		echo "\t<div>Suite: " . $suite . "</div>\n\n";

		$numRuns = count($runs);

		$query="SELECT DISTINCT name FROM results WHERE branch = \"" . $branch . "\" AND suite_name = \"" . $suite . "\"";
		$result=mysql_query($query);
		while($row = mysql_fetch_array($result)) {
			// need to use "id" for the 3rd element in order to deal with odd suite names
			$testId = $branch . "_" . $config_set . "_" . $config . "_" . $suite . "_" . $row["name"];

			echo "\t<div style=\"margin-left: 50px; margin-bottom: 20px\">\n";
			echo "\t\t<div id=\"" . $testId . "\" style=\"width: 80%\"></div>\n";

			echo "\t\t<script type=\"text/javascript\">\n";
			echo "\t\t\tvar runIds = [];\n";
			echo "\t\t\tvar driverIds = [];\n";
			echo "\t\t\tvar chartData = [];\n\n";

			$query2="SELECT DISTINCT driver_id FROM results WHERE branch = \"" . $branch . "\" AND name = \"" . $row["name"] . "\"";
			$result2=mysql_query($query2);
			while($row2 = mysql_fetch_array($result2)) {
				echo "\t\t\tdriverIds.push(\"" . $row2["driver_id"] . "\");\n\n";
				echo "\t\t\tvar driverPerformanceData = [];\n";

				for ($i = 0; $i < $numRuns; $i++) {
					echo "\t\t\trunIds.push(" . $runs[$i] . ");\n";
					$query3="SELECT * FROM results WHERE driver_id = \"" . $row2["driver_id"] . "\" AND run_id = " . $runs[$i] . " AND name = \"" . $row["name"] . "\"";
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

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Reporting</title>
	</head>
	<body>
		<div>
			<h1 style="text-align: left; margin-bottom: 30px">Anvil performance for branch [<?php echo $_GET["branch"]; ?>]</h1>
		</div>

<?php
	if (!(isset($_GET["suite"])) && !(isset($_GET["all_suites"]))) {
		echo "\t\t<div style=\"margin-left: 50px; margin-bottom: 30px\">\n";
		echo "\t\t\t<a href=\"performance.php?branch=" . $_GET["branch"] . "&all_suites=true\">All Suites</a> (this can take a long time to load)\n";
		echo "\t\t</div>\n";
	}
?>

		<div style="margin-left: 50px">
<?php loadJsDependencies(); ?>

<?php
	$runs = array();
	$result=mysql_query("SELECT id FROM runs WHERE branch = \"" . $_GET["branch"] . "\"");
	while($row = mysql_fetch_array($result)) {
		array_push($runs, $row["id"]);
	}
	$numRuns = count($runs);

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
				echo "\t<div style=\"margin-left: 50px;\">\n";
				echo "\t\t<div>Config: " . $row2["name"] . "</div>\n\n";

				$query3="SELECT DISTINCT name, id FROM suites WHERE branch = \"" . $_GET["branch"] . "\" AND config_name = \"" . $row2["name"] . "\"";
				$result3=mysql_query($query3);
				while($row3 = mysql_fetch_array($result3)) {
					if(isset($_GET["all_suites"])) {
						echo "\t\t<div style=\"margin-left: 50px; margin-bottom: 50px\">\n";
						echo "\t\t\t<div>Suite: " . $row3["name"] . "</div>\n\n";
						print_suite_performance($_GET["branch"], $row["name"], $row2["name"], $row3["name"], $runs);
						echo "\t\t</div>\n";

					} else {
						echo "\t\t<div style=\"margin-left: 50px\">\n" .
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
?>

		</div>
	</body>
</html>