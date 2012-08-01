<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Reporting</title>
	</head>
	<body>
		<div>
			<h1 style="text-align: left; margin-bottom: 50px">Anvil branch performance [<?php echo $_GET["branch"]; ?>]</h2>
		</div>

		<div style="margin-left: 50px">
<?php
	require "common.php";
	db_open();

	echo "<!--  START GENERATED -->\n";

	$runs = array();
	$result=mysql_query("SELECT id FROM runs WHERE branch = \"" . $_GET["branch"] . "\"");
	while($row = mysql_fetch_array($result)) {
		array_push($runs, $row["id"]);
	}
	$numRuns = count($runs);

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

			$query3="SELECT DISTINCT name FROM suites WHERE branch = \"" . $_GET["branch"] . "\" AND config_name = \"" . $row2["name"] . "\"";
			$result3=mysql_query($query3);
			while($row3 = mysql_fetch_array($result3)) {

				echo "\t\t<div style=\"margin-left: 50px; margin-bottom: 50px\">\n";
				echo "\t\t\t<div>Suite: " . $row3["name"] . "</div>\n\n";

				$query4="SELECT DISTINCT name FROM results WHERE branch = \"" . $_GET["branch"] . "\" AND suite_name = \"" . $row3["name"] . "\"";
				$result4=mysql_query($query4);
				while($row4 = mysql_fetch_array($result4)) {
					echo "\t\t\t<div style=\"margin-left: 50px; margin-bottom: 20px\">\n";
					echo "\t\t\t\t<div>Test: " . $row4["name"] . "</div>\n\n";

					echo "\t\t\t\t<table border=\"1\">\n";

					# header row
					echo "\t\t\t\t\t<tr>\n";
					echo "\t\t\t\t\t\t<th>Driver</th>";
					for ($i = 0; $i < $numRuns; $i++) {
						echo "<th>" . $runs[$i] . "</th>";
					}
					echo "\n\t\t\t\t\t</tr>\n";

					$query5="SELECT DISTINCT driver_id FROM results WHERE branch = \"" . $_GET["branch"] . "\" AND name = \"" . $row4["name"] . "\"";
					$result5=mysql_query($query5);
					while($row5 = mysql_fetch_array($result5)) {
						echo "\t\t\t\t\t<tr>\n";
						echo "\t\t\t\t\t\t<td>" . $row5["driver_id"] . "</td>";

						for ($i = 0; $i < $numRuns; $i++) {
							$query6="SELECT * FROM results WHERE driver_id = \"" . $row5["driver_id"] . "\" AND run_id = " . $runs[$i] . " AND name = \"" . $row4["name"] . "\"";
							$result6=mysql_query($query6);

							echo "<td>";
							if ($row6 = mysql_fetch_array($result6)) {
								echo $row6["duration"];

							}
							echo "</td>";
						}

						echo "\t\t\t\t\t</tr>\n";
					}

					echo "\t\t\t\t</table>\n";
					echo "\t\t\t</div>\n";
				}

				echo "\t\t</div>\n";
			}

			echo "\t</div>\n";
		}

		echo "</div>\n";
	}

	echo "<!--  END GENERATED -->\n";
?>
		</div>
	</body>
</html>