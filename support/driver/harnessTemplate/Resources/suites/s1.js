module.exports = new function() {
	var self = this;
	this.suiteUtil = require("suiteUtil");

	this.name = "s1";
	this.tests = [
		{
			name: "test1"
		},
		{
			name: "test2",
			timeout: 3000
		}
	]

	this.test1 = function() {
		self.suiteUtil.sendResult("test1", "success");
	}

	this.test2 = function() {
		setTimeout(function() {
			self.suiteUtil.sendResult("test2", "success");
		}, 4000);
	}
}
