var NativeModule = require('native_module');
var Script = kroll.binding('evals').Script;
var runInThisContext = Script.runInThisContext;
var runInNewContext = Script.runInNewContext;

function Module(id, parent) {
	this.id = id;
	this.exports = {};
	this.parent = parent;

	this.filename = null;
	this.loaded = false;
	this.exited = false;
	this.children = [];
}
module.exports = Module;
