<?php
	require "common.php";
	db_open();
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Reporting</title>
	</head>
	<body>
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
