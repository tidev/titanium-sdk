module.exports = new function() {

	/*
	this can be changed but shouldn't need to be. This is the location where the log output and 
	raw driver results are stored
	*/
	this.tempDir = "/tmp/hub";

	this.maxLogs = 20; // change this to control how many log files are kept
	this.ciListenPort = 9001; // port that the hub will listen to for CI connections
	this.driverListenPort = 9002; // port that the hub will listen to for driver connections

};

