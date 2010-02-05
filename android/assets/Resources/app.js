/*
 * Testing Script for bootup.
 */

try {
	var logData = "";
	function log(s) { logData += s + "\n"; }

	if (Ti && Titanium && Ti === Titanium) {
		log("Ti === Titanium: Passed");
	} else {
		log("Ti === Titanium: Failed");
	}
	Ti.API.warn("Processing app.js");
	Ti.API.info("Titanium Version: " + Ti.version);
	Ti.API.info("Titanium Version #2: " + Ti.version);

	// Use array so we can easily comment items in and out.
	var files = [];

	files.push('app-ks.js');
	//files.push('log.js');
	//files.push('json.js');
	//files.push('accelerometer.js');
	//files.push('db.js');
	//files.push('fs.js');
	//files.push('geo.js');
	//files.push('map.js');
	//files.push('media.js');
	//files.push('media-camera.js');
	//files.push('ui.js');
	//files.push('ui-imageview.js');
	//files.push('ui-label.js');
	//files.push('test.js');
	//files.push('picker.js');
	//files.push('timer.js');

	Ti.include(files);

	Ti.API.info("Done with included files");
	log("Done");

	logData;
} catch (E) {
	Ti.API.error("Oops: " + E);
}