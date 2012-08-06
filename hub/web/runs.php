<?php
	require "common.php";
	db_open();
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Anvil reporting</title>
	</head>
	<body>
		<div>
			<h1 style="text-align: left; margin-bottom: 50px">
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
			<div style="float: left; width: 20%">
<?php
	if (isset($_GET["branch"])) {
		echo "<a href=\"performance.php?branch=" . $_GET["branch"] . "\">Performance</a>\n";

	} else {
		echo "\t\t\t\t<div style=\"font-size: large\"><b>Branches</b></div>\n";
		echo "\t\t\t\t<div style=\"margin-left: 20px;\">\n";
		echo "\t\t\t\t\t<!-- START GENERATED BRANCH LIST -->\n";

		$query="SELECT DISTINCT branch FROM runs;";
		$result=mysql_query($query);

		while($row = mysql_fetch_array($result)) {
			echo "\t\t\t\t\t<a href=\"runs.php?branch=" . $row["branch"] . "\">" . $row["branch"] . "</a><br>\n";
		}

		echo "\t\t\t\t\t<!-- END GENERATED BRANCH LIST -->\n";
		echo "\t\t\t\t</div>\n";
	}
?>

			</div>
			<div style="float: left; width: 50%">
				<div style="font-size: large; margin-bottom: 40px"><b>
<?php
	if (!(isset($_GET["branch"]))) {
		exec("ps aux | grep -i hub.js | grep -v grep", $pids);
		if (count($pids) > 0) {
			echo "<div style=\"color: green\">Hub is Running</div>";

		} else {
			echo "<div style=\"color: red\">Hub is not running</div>";
		}
	}
?>
				</b></div>

<?php
	if (!(isset($_GET["branch"]))) {
		echo "\t<!-- START GENERATED DRIVER STATES -->\n";
		echo "<div style=\"margin-bottom: 80px\">\n";
		echo "\t<div style=\"font-size: large; margin-bottom: 3px\"><b>Driver states</b></div>\n";

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
				echo "yellow\">Running: " . $row["git_hash"];

			} else {
				echo "green\">Idle";
			}
			echo "</td><td>" . date("n-j-Y g:i:s A", $row["timestamp"]) . "</td>\n";

			echo "\t\t<tr>\n";
		}

		echo "\t</table>\n";
		echo "</div>\n";
		echo "\t<!-- END GENERATED DRIVER STATES -->\n";
	}
?>

<?php loadJsDependencies(); ?>

<?php
	echo "<!-- START GENERATED CHART -->\n";

	# need to know the number of runs before we create the div containers
	$query = "SELECT * FROM runs";
	if (isset($_GET["branch"])) {
		$query = $query . " WHERE branch = \"" . $_GET["branch"] . "\"";
	}
	$query = $query . " ORDER BY timestamp DESC";

	$result=mysql_query($query);
	$numRuns = mysql_num_rows($result);

	echo "<div>\n";
	$i = 0;
	while ($i < $numRuns) {
		$style = "";
		if ($i > 0) {
			$style = " style=\"margin-top: 60px;\"";
		}

		echo "\t<div" . $style . ">\n";

		echo "\t\t<div>\n" .
			"\t\t\t<div style=\"float: left; width: 100px\"><b>Date: </b></div>\n" .
			"\t\t\t<div id=\"chart" . $i . "Date\"></div>\n" .
			"\t\t</div>\n";

		echo "\t\t<div>\n" .
			"\t\t\t<div style=\"float: left; width: 100px\"><b>Branch: </b></div>\n" .
			"\t\t\t<div id=\"chart" . $i . "Branch\"></div>\n" .
			"\t\t</div>\n";

		echo "\t\t<div>\n" .
			"\t\t\t<div style=\"float: left; width: 100px\"><b>Git Hash: </b></div>\n" .
			"\t\t\t<div id=\"chart" . $i . "Githash\"></div>\n" .
			"\t\t</div>\n";

		echo "\t\t<div id=\"chart" . $i . "Contents\" style=\"margin-top: 5px\"></div>\n";
		echo "\t</div>\n";

		$i += 1;
	}
	echo "</div>\n\n";

	echo "<script type=\"text/javascript\">\n";

	$i = 0;
	while($row = mysql_fetch_array($result)) {
		if ($i > 0) {
			echo "\n\n";
		}

		echo "\t// build and draw chart " . $i . "\n";
		echo "\tdriverIds = [];\n";
		echo "\tchartRows = [[], []];\n";

		$query2="SELECT * FROM driver_runs WHERE run_id = " . $row["id"];
		$result2=mysql_query($query2);

		$j = 1;
		while($row2 = mysql_fetch_array($result2)) {
			echo "\tdriverIds.push(\"" . $row2["driver_id"] . "\");\n";
			echo "\tchartRows[0].push([" . $row2["passed_tests"] . ", " . $j . "]);\n";
			echo "\tchartRows[1].push([" . $row2["failed_tests"] . ", " . $j . "]);\n";

			$j++;
		}

		echo "\tdrawRunCharts(\"chart" . $i . "\", \"" . $row["branch"] . "\", \"" . 
			$row["git_hash"] . "\", " . $row["timestamp"] . ", \"" . $row["id"] . 
			"\", driverIds, chartRows);\n";

		$i++;
	}

	echo "</script>\n";
	echo "<!-- END GENERATED CHART -->\n";
?>

			</div>
		</div>
	</body>
</html>
