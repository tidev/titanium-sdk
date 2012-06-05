global.driverGlobal = require("./driverGlobal");
var util = require("./util");

var printHelp = function() {
	console.log("Usage: \"node driver.js --mode=<mode>\"\n"
		+ "Modes:\n"
		+ "\tlocal - run Anvil locally via manual commands\n"
		+ "\tremote - run Anvil remotely (this should never be selected by hand)\n"
	);

	process.exit(1);
}

var mode = util.getArgument("--mode");
if(mode == undefined) {
	printHelp();
}

if(mode == "local") {
	global.driverGlobal.localMode = require("./localMode.js");
	global.driverGlobal.localMode.start();

} else if(mode == "remote") {
	require("./remoteMode.js").start();

} else {
	printHelp();
}
