(function(kroll) {
	global = this;

	function startup() {
		startup.globalVariables();
		startup.runMain();
	}

	startup.globalVariables = function() {
		global.kroll = kroll;
		global.Ti = global.Titanium = NativeModule.require('titanium');
		//var Module = NativeModule.require('module');
	};
	
	startup.runMain = function() {
	};

	var runInThisContext = kroll.binding('evals').Script.runInThisContext;

	function NativeModule(id) {
		this.filename = id + '.js';
		this.id = id;
		this.exports = {};
		this.loaded = false;
	}

	NativeModule._source = kroll.binding('natives');
	NativeModule._cache = {};

	NativeModule.require = function(id) {
		if (id == 'native_module') {
			return NativeModule;
		}

		var cached = NativeModule.getCached(id);
		if (cached) {
			return cached.exports;
		}

		if (!NativeModule.exists(id)) {
			throw new Error('No such native module ' + id);
		}

		var nativeModule = new NativeModule(id);

		nativeModule.compile();
		nativeModule.cache();

		return nativeModule.exports;
	};

	NativeModule.getCached = function(id) {
		return NativeModule._cache[id];
	}

	NativeModule.exists = function(id) {
		return (id in NativeModule._source);
	}

	NativeModule.getSource = function(id) {
		return NativeModule._source[id];
	}

	NativeModule.wrap = function(script) {
		return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
	};

	NativeModule.wrapper = [
		'(function (exports, require, module, __filename, __dirname) { ',
		'\n});' ];

	NativeModule.prototype.compile = function() {
		var source = NativeModule.getSource(this.id);
		source = NativeModule.wrap(source);

		var fn = runInThisContext(source, this.filename, true);
		fn(this.exports, NativeModule.require, this, this.filename);
		this.loaded = true;
	};

	NativeModule.prototype.cache = function() {
		NativeModule._cache[this.id] = this;
	};

	startup();
});
