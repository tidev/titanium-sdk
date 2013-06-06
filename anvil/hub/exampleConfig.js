module.exports = new function() {

	this.maxLogSize = 102400; // max log size in bytes
	this.maxLogs = 20; // change this to control how many log files are kept
	this.ciListenPort = 95; // port that the hub will listen to for CI connections
	this.driverListenPort = 97; // port that the hub will listen to for driver connections
	this.dbHost = "localhost"; // host of the DB instance
	this.dbUser = ""; // username for connecting to the DB instance

	/*
	Update the object for a specific version when a Titanium version has a specific 
	requirement such as needing a specific version of Xcode, Android SDK, etc.  First a change 
	should be made within messageHandler.js to add logic for checking the new desired value and 
	then the actual value to check against (min value, etc) should be added to the version object.
	
	If no specific requirements exist, just specify an empty object for the version.  Versions 
	that are not listed will be ignored.
	*/
	this.sdkVersionReqs = {
		"1.8.2": {},
		"1.8.3": {},
		"2.0.0": {},
		"2.0.1": {},
		"2.0.2": {},
		"2.1.0": {},
		"2.1.1": {},
		"2.2.0": {
			"ios": {
				"xcodeVersion": "4.1.1"
			}
		}
	};
};

