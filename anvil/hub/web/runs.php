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
					$header = "Anvil results";
					if (isset($_GET["branch"])) {
						$header = $header . " for branch [" . $_GET["branch"] . "]";
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
		echo "\t\t\t\t<div>Branches</div>\n";
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

<?php loadJsDependencies(); ?>

<?php
	echo "<!-- START GENERATED CHART -->\n";

	# need to know the number of runs before we create the div containers
	$query = "SELECT * FROM runs";
	if (isset($_GET["branch"])) {
		$query = $query . " WHERE branch = \"" . $_GET["branch"] . "\"";
	}

	$result=mysql_query($query);
	$numRuns = mysql_num_rows($result);

	echo "<div>\n";
	$i = 0;
	while ($i < $numRuns) {
		$style = "";
		if ($i > 0) {
			$style = " style=\"margin-top: 60px;\"";
		}

		echo "\t<div" . $style . ">\n" .
			"\t\t<div id=\"chart" . $i . "Date\" style=\"margin-bottom: 20px;\"></div>\n" .
			"\t\t<div id=\"chart" . $i . "Contents\"></div>\n" .
			"\t</div>\n";

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

		echo "\tdrawRunCharts(\"chart" . $i . "\", \"" . $row["git_hash"] . "\", " . 
			$row["timestamp"] . ", \"" . $row["id"] . "\", driverIds, chartRows);\n";

		$i++;
	}

	echo "</script>\n";
	echo "<!-- END GENERATED CHART -->\n";
?>

			</div>
		</div>
	</body>
</html>
