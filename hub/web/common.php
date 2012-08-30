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

	function loadJsDependencies()
	{
		echo "<!-- START CHART DEPENDENCIES -->\n";
		echo "<script src=\"jqplot/jquery.min.js\"></script>\n";
		echo "<script src=\"jqplot/jquery.jqplot.min.js\"></script>\n";
		echo "<script src=\"jqplot/plugins/jqplot.barRenderer.min.js\"></script>\n";
		echo "<script src=\"jqplot/plugins/jqplot.categoryAxisRenderer.min.js\"></script>\n";
		echo "<script src=\"jqplot/plugins/jqplot.canvasTextRenderer.min.js\"></script>\n";
		echo "<script src=\"jqplot/plugins/jqplot.canvasAxisTickRenderer.min.js\"></script>\n";
		echo "<script src=\"jqplot/plugins/jqplot.pointLabels.min.js\"></script>\n";
		echo "<script src=\"common.js\"></script>\n\n";

		echo "<link rel=\"stylesheet\" type=\"text/css\" href=\"jqplot/jquery.jqplot.css\" />\n";
		echo "<!-- END CHART DEPENDENCIES -->\n\n";
	}
?>
