module.exports = new function() {
	var self = this;
	var harnessGlobal;

	this.init = function(arg) {
		harnessGlobal = arg;
	}

	this.connectToDriver = function() {
		if(Ti.Platform.name == "mobileweb") {
			Ti.API.info("connecting to driver...");
			harnessGlobal.required.util.sendData("connect");

		} else {
			harnessGlobal.required.util.connect();
		}
	}

	this.processDriverData = function(data) {
		var elements = data.split("|");

		if(elements[0] == "connect") {
			harnessGlobal.httpHost = elements[1];
			harnessGlobal.httpPort = elements[2];
			harnessGlobal.required.util.sendData("ready");

		} else if(elements[0] == "getSuites") {
			var suitesWrapper = {type: "suites", suites: harnessGlobal.suites};
			harnessGlobal.required.util.sendData(suitesWrapper);

		} else if(elements[0] == "getTests") {
			harnessGlobal.currentSuite = require("suites/" + elements[1]);
			harnessGlobal.currentSuite.suiteUtil.init(harnessGlobal.currentSuite.name, harnessGlobal);

			var testsWrapper = {type: "tests", tests: harnessGlobal.currentSuite.tests};
			harnessGlobal.required.util.sendData(testsWrapper);

		} else if(elements[0] == "run") {
			if(harnessGlobal.currentSuite.name != elements[1]) {
				harnessGlobal.currentSuite = require("suites/" + elements[1]);
				harnessGlobal.currentSuite.suiteUtil.init(harnessGlobal.currentSuite.name, harnessGlobal);
			}
			
			for(var i in harnessGlobal.currentSuite.tests) {
				if(harnessGlobal.currentSuite.tests[i].name == elements[2]) {
					Ti.API.info("running suite<" + elements[1] + "> test<" + elements[2] + ">...");
					eval("harnessGlobal.currentSuite." + harnessGlobal.currentSuite.tests[i].name + "()");
				}
			}
		}
	}
}

