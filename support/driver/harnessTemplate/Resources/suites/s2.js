module.exports = new function() {
	var self = this;
	this.suiteUtil = require("suiteUtil");

	this.name = "s2";
	this.tests = [
		{
			name: "test1",
			timeout: 20000
		},
		{
			name: "test2",
			timeout: 50000
		}
	]

	this.test1 = function() {
		self.suiteUtil.sendResult("test1", "success");
	}

	this.test2 = function() {
		self.suiteUtil.sendResult("test2", "success");
	}
}
