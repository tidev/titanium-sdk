module.exports = new function() {

	this.maxLogSize = 102400; // max log size in bytes
	this.maxLogs = 20; // change this to control how many log files are kept
	this.ciListenPort = 95; // port that the hub will listen to for CI connections
	this.driverListenPort = 97; // port that the hub will listen to for driver connections
	this.dbHost = "localhost"; // host of the DB instance
	this.dbUser = ""; // username for connecting to the DB instance

};

