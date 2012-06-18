module.exports = new function() {
	// environment properties
	this.devDir = "/Users/ocyrus/dev";
	this.driverDir = this.devDir + "/appcelerator/driver";
	this.androidSdkDir = this.devDir + "/installed/android-sdk-mac_x86";
	this.tiSdkDir = this.devDir + "/appcelerator/git/titanium_mobile/dist/mobilesdk/osx/2.1.0";

	// harness properties
	this.harnessDir = this.driverDir + "/harness";
	this.harnessName = "harness";
	this.harnessId = "com.appcelerator.harness";

	this.prompt = "CLI> ";
	this.readlineInterface;
	this.socketPort = 40404;
	this.httpHost = "http://" + require("os").networkInterfaces().en1[1].address;
	this.httpPort = 8125;

	this.suites;
	this.tests = new Array();
	this.defaultTestTimeout = 10000;
}
