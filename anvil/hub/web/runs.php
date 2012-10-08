<?php
	require "common.php";
	db_open();
?>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Anvil reporting</title>

		<style type="text/css">
			#run_description
			{
				text-align: left;
				margin-bottom: 50px;
			}

			#branches_container
			{
				float: left;
				width: 20%;
			}

			#branches_title
			{
				font-size: large;
			}

			#branch_list_container
			{
				margin-left: 20px;
			}

			#reports_container
			{
				float: left;
				width: 50%;
			}

			#hub_state_title
			{
				font-size: large;
				margin-bottom: 40px;
			}

			#hub_state_running
			{
				color: green
			}

			#hub_state_dead
			{
				color: red
			}

			#driver_state_container
			{
				margin-bottom: 80px;
			}

			#driver_state_title
			{
				font-size: large;
				margin-bottom: 3px;
			}

			#run_container
			{
				margin-top: 50px;
			}

			#run_summary_element
			{
				float: left;
				width: 100px;
			}
		</style>
	</head>
	<body>
		<div>
			<h1 id="run_description">
				<?php
					$header = "";
					if (isset($_GET["branch"])) {
						$header = "Anvil results for branch [" . $_GET["branch"] . "]";

					} else {
						$header = "Anvil reporting";
					}

					echo $header . "\n";
				?>
			</h1>
		</div>

		<div>
			<div id="branches_container">
<?php
	if (isset($_GET["branch"])) {
		echo "<a href=\"performance.php?branch=" . $_GET["branch"] . "\">Performance</a>\n";

	} else {
		echo "\t\t\t\t<div id=\"branches_title\"><b>Branches</b></div>\n";
		echo "\t\t\t\t<div id=\"branch_list_container\">\n";
		echo "<!-- START GENERATED BRANCH LIST -->\n";

		$query="SELECT DISTINCT branch FROM runs;";
		$result=mysql_query($query);

		while($row = mysql_fetch_array($result)) {
			echo "<a href=\"runs.php?branch=" . $row["branch"] . "\">" . $row["branch"] . "</a><br>\n";
		}

		echo "<!-- END GENERATED BRANCH LIST -->\n";
		echo "\t\t\t\t</div>\n";
	}
?>

			</div>
			<div id="reports_container">
<?php
	if (isset($_GET["branch"])) {
		echo "<a id=\"next_batch_link\" href=\"\">Next set</a>\n";
	}

	if (!(isset($_GET["branch"]))) {
		echo "<!-- START GENERATED HUB STATE -->\n";
		echo "<div id=\"hub_state_title\">\n";
		echo "<b>";

		exec("ps aux | grep -i hub.js | grep -v grep", $pids);
		if (count($pids) > 0) {
			echo "<div id=\"hub_state_running\">Hub is Running</div>";

		} else {
			echo "<div id=\"hub_state_dead\">Hub is not running</div>";
		}

		echo "</b>\n";
		echo "</div>\n";
		echo "<!-- END GENERATED HUB STATE -->\n";
	}
?>

<?php
	if (!(isset($_GET["branch"]))) {
		echo "<!-- START GENERATED DRIVER STATES -->\n";
		echo "<div id=\"driver_state_container\">\n";
		echo "\t<div id=\"driver_state_title\"><b>Driver states</b></div>\n";

		echo "\t<table border=\"1\" cellpadding=\"3\" style=\"width: 100%\">\n";
		echo "\t\t<tr>\n";
		echo "\t\t\t<th>ID</th><th>Description</th><th>State</th><th>Last updated</th>\n";
		echo "\t\t</tr>\n";

		$query="SELECT * FROM driver_state";
		$result=mysql_query($query);
		while($row = mysql_fetch_array($result)) {
			echo "\t\t<tr>\n";
			echo "\t\t\t<td>" . $row["id"] . "</td><td>" . $row["description"] . "</td><td bgcolor=\"";

			if ($row["state"] === "running") {
				if ($row["timestamp"] < time() - (20 * 60)) {
					echo "red\">Non responsive: " . $row["git_hash"];

				} else {
					echo "yellow\">Running: " . $row["git_hash"];
				}

			} else {
				echo "green\">Idle";
			}
			echo "</td><td>" . date("n-j-Y g:i:s A", $row["timestamp"]) . "</td>\n";

			echo "\t\t<tr>\n";
		}

		echo "\t</table>\n";
		echo "</div>\n";
		echo "<!-- END GENERATED DRIVER STATES -->\n";
	}
?>

<?php loadJsDependencies(); ?>

<?php
	$query = "SELECT * FROM runs";
	if (isset($_GET["branch"])) {
		$query = $query . " WHERE branch = \"" . $_GET["branch"] . "\"";
	}

	if (isset($_GET["last_run_id"])) {
		$query = $query . " AND id < " . $_GET["last_run_id"];
	}

	$query = $query . " ORDER BY timestamp DESC";
	$result=mysql_query($query);

	$displayed_runs = 0;
	$last_run_id = 0;
	while($row = mysql_fetch_array($result)) {
		# you would think that ordering by ASC makes sense here to keep A-Z display but because of 
		# how the chart is rendered (bottom up) we actually want to reverse it and use DESC
		$query2="SELECT * FROM driver_runs WHERE run_id = " . $row["id"] . " ORDER BY driver_id DESC";
		$result2=mysql_query($query2);
		$numDriverRuns = mysql_num_rows($result2);

		if ($numDriverRuns > 0) {
			echo "\n<!-- START GENERATED CHART -->\n";
			echo "<div id=\"run_container\">\n";

			echo "\t<div>\n" .
				"\t\t<div id=\"run_summary_element\"><b>Date: </b></div>\n" .
				"\t\t<div id=\"chart" . $row["id"] . "Date\"></div>\n" .
				"\t</div>\n";

			echo "\t<div>\n" .
				"\t\t<div id=\"run_summary_element\"><b>Branch: </b></div>\n" .
				"\t\t<div id=\"chart" . $row["id"] . "Branch\"></div>\n" .
				"\t</div>\n";

			echo "\t<div>\n" .
				"\t\t<div id=\"run_summary_element\"><b>Git Hash: </b></div>\n" .
				"\t\t<div id=\"chart" . $row["id"] . "Githash\"></div>\n" .
				"\t</div>\n";

			echo "\t<div id=\"chart" . $row["id"] . "Contents\" style=\"margin-top: 5px\"></div>\n";
			echo "</div>\n";

			echo "\n<script>\n";
			echo "\t// build and draw chart " . $row["id"] . "\n";
			echo "\tvar driverIds" . $row["id"] . " = [];\n";
			echo "\tvar chartRows" . $row["id"] . " = [[], []];\n\n";

			$j = 1;
			while($row2 = mysql_fetch_array($result2)) {
				echo "\tdriverIds" . $row["id"] . ".push(\"" . $row2["driver_id"] . "\");\n";
				echo "\tchartRows" . $row["id"] . "[0].push([" . $row2["passed_tests"] . ", " . $j . "]);\n";
				echo "\tchartRows" . $row["id"] . "[1].push([" . $row2["failed_tests"] . ", " . $j . "]);\n";

				$j++;
			}

			echo "\n\tdrawRunCharts(\"chart" . $row["id"] . "\", \"" . $row["branch"] . "\", \"" . 
				$row["git_hash"] . "\", " . $row["timestamp"] . ", \"" . $row["id"] . 
				"\", driverIds" . $row["id"] . ", chartRows" . $row["id"] . ");\n";

			echo "</script>\n";
			echo "<!-- END GENERATED CHART -->\n";

			$displayed_runs++;
		}

		$last_run_id = $row["id"];
		if ($displayed_runs >= 20) {
			break;
		}
	}

	if (isset($_GET["branch"])) {
		echo "<script>\n" .
			"\tvar nextBatchLink = document.getElementById(\"next_batch_link\");\n" .
			"\tnextBatchLink.href = \"runs.php?branch=" . $row["branch"] . "&last_run_id=" . $last_run_id . "\";\n" .
			"</script>\n";
	}
?>

			</div>
		</div>
	</body>
</html>
