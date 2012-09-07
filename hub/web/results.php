<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Reporting</title>

		<script src="common.js"></script>
		<script>
			function updateSummary(totalPassed, totalFailed) {
				getElementById("totalPassed").innerHTML = totalPassed;
				getElementById("totalFailed").innerHTML = totalFailed;
			}
		</script>

		<style type="text/css">
			#results_description
			{
				text-align: left;
				margin-bottom: 30px;
			}

			#results_summary
			{
				margin-left: 50px;
			}

			#num_results_item
			{
				margin-left: 20px;
			}

			#raw_results_link
			{
				margin-top: 20px;
			}

			#results_container
			{
				margin-top: 50px;
			}

			#config_set
			{
				margin-left: 50px;
			}

			#config
			{
				margin-left: 50px;
			}

			#suite
			{
				margin-left: 50px;
				margin-bottom: 50px;
			}
		</style>
	</head>
	<body>
		<div>
			<h2 id="results_description">Detailed results for branch [<?php echo $_GET["branch"]; ?>], driver ID [<?php echo $_GET["driver_id"]; ?>] and Git hash [<?php echo substr($_GET["git_hash"], 0, 10); ?>]</h2>
		</div>

		<div id="results_summary">
			Summary

			<div id="num_results_item">Total Pass: <div id="totalPassed" style="display: inline"></div></div>
			<div id="num_results_item">Total Fail: <div id="totalFailed" style="display: inline"></div></div>

			<div id="raw_results_link"><a href="results/<?php echo $_GET["git_hash"] . $_GET["driver_id"]; ?>.tgz">Raw results file</a></div>
		</div>

		<div id="results_container">

<?php
	echo "<!-- START GENERATED RESULTS TABLE -->\n";

	$totalPassed = 0;
	$totalFailed = 0;

	require "common.php";
	db_open();

	$query="SELECT * FROM driver_runs WHERE run_id = " . $_GET["run_id"] . 
		" AND driver_id = \"" . $_GET["driver_id"] . "\"";

	$result=mysql_query($query);
	while($row = mysql_fetch_array($result)) {
		$query2="SELECT * FROM config_sets WHERE driver_run_id = " . $row["id"];
		$result2=mysql_query($query2);
		while($row2 = mysql_fetch_array($result2)) {
			echo "<div id=\"config_set\">\n";
			echo "\t<div>Config Set: " . $row2["name"] . "</div>\n\n";

			$query3="SELECT * FROM configs WHERE config_set_id = " . $row2["id"];
			$result3=mysql_query($query3);
			while($row3 = mysql_fetch_array($result3)) {
				echo "\t<div id=\"config\">\n";
				echo "\t\t<div>Config: " . $row3["name"] . "</div>\n\n";

				$query4="SELECT * FROM suites WHERE config_id = " . $row3["id"];
				$result4=mysql_query($query4);
				while($row4 = mysql_fetch_array($result4)) {
					echo "\t\t<div id=\"suite\">\n";
					echo "\t\t\t<div>Suite: " . $row4["name"] . "</div>\n\n";

					echo "\t\t\t<table border=\"1\">\n";
					echo "\t\t\t\t<tr>\n";
					echo "\t\t\t\t\t<th>Name</th><th>Result</th><th>Duration</th><th>Description</th>\n";
					echo "\t\t\t\t</tr>\n";

					$query5="SELECT * FROM results WHERE suite_id = " . $row4["id"];
					$result5=mysql_query($query5);
					while($row5 = mysql_fetch_array($result5)) {
						echo "\t\t\t\t<tr>\n";

						echo "\t\t\t\t\t<td>" . $row5["name"] . "</td><td bgcolor=\"";

						$description = "";
						$testResult = $row5["result"];
						if ($testResult == "success") {
							echo "green";
							$totalPassed += 1;

						} else if ($testResult == "timeout") {
							echo "yellow";
							$totalFailed += 1;
							$description = $testResult;

						} else {
							echo "red";
							$totalFailed += 1;
							$description = $testResult . ": " . $row5["description"];
						}

						
						echo "\">" . $row5["result"] . "</td><td>" . $row5["duration"] . "</td><td>" . $description . "</td>\n";

						echo "\t\t\t\t</tr>\n";
					}
					echo "\t\t\t</table>\n";
					echo "\t\t</div>\n";
				}

				echo "\t</div>\n";
			}

			echo "</div>\n";
		}
	}

	echo "<!-- END GENERATED RESULTS TABLE -->\n";
?>

		</div>

		<script>
			updateSummary(<?php echo $totalPassed . ", " . $totalFailed; ?>);
		</script>
	</body>
</html>
