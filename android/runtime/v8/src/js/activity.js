var Ti = require("titanium");

var doStartActivityForResult = Ti.Activity.prototype.startActivityForResult;
Ti.Activity.prototype.startActivityForResult = function(intent, callback) {
	this.on("result", callback);
	this.on("error", callback);
	doStartActivityForResult.call(this, intent);
}