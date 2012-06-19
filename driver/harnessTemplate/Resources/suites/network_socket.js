module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "network_socket";
	this.tests = [
		{name: "testAPI"}
	]

	this.testAPI = function(testRun) {
		valueOf(testRun, Ti.Network.Socket).shouldBeObject();
		var functions = ['createTCP'];
		var properties = ['INITIALIZED', 'CONNECTED', 'LISTENING', 'CLOSED', 'ERROR'];

		for (var i=0; i < functions.length; i++) {
			valueOf(testRun, Ti.Network.Socket[functions[i]]).shouldBeFunction();
			valueOf(testRun, Ti.Network.Socket[functions[i]]()).shouldBeObject();
		}

		for (var i=0; i < properties.length; i++) {
			valueOf(testRun, Ti.Network.Socket[properties[i]]).shouldBeNumber();
		}

		finish(testRun);
	}
}
