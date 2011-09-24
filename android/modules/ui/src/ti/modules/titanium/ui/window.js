var EventEmitter = require("events").EventEmitter,
	UI = require("titanium").UI,
	assets = require("assets"),
	vm = require("vm"),;

var newActivityRequiredKeys = ["fullscreen", "navBarHidden", "modal", "windowSoftInputMode"];

// Backward compatibility for lightweight windows

function TiWindow(options) {
	EventEmitter.call(this);
	this.options = typeof(options) === "undefined" ? {} : options;

	this.window = null;
	this.isActivity = false;
}

TiWindow.prototype = new EventEmitter();
TiWindow.prototype.__defineSetter__("orientationModes", function(modes) {
	this._orientationModes = modes;
	if (this.window == null) return;

	if (this.isActivity) {
		this.window.setOrientationModes(modes);
	} else {
		UI.currentWindow.setOrientationModes(modes);
	}
});

TiWindow.prototype.open = function(options) {
	Object.keys(options).forEach(function(key) {
		this.options[key] = options[key];
	}, this);

	newActivityRequiredKeys.forEach(function(keys) {
		if (key in options || key in this.options) {
			this.isActivity = true;
		}
	}, this);

	if (!this.isActivity && "tabOpen" in options && options.tabOpen) {
		this.isActivity = true;
	}

	if (this.isActivity) {
		this.window = new UI.ActivityWindow(this.options);
		this.attachListeners();
		this.window.open();
	} else {
		this.window = new UI.View(this.options);
		this.window.zIndex = Math.MAX_INT - 2;
		this.attachListeners();
		UI.currentWindow.add(this.window);
	}
}

TiWindow.prototype.attachListeners = function() {
	// map the right events to open/close
	var self = this;
	var openEvent = this.isActivity ? "open" : "added";
	this.window.on(openEvent, function(e) {
		if ("url" in self.options) {
			self.loadUrl();
		}
		e.source = self;
		self.emit("open", e);
	});

	var closeEvent = this.isActivity ? "close" : "removed";
	this.window.on(closeEvent, function(e) {
		e.source = self;
		self.emit("close", e);
	});

	/*this._events.forEach(function(type) {
		var listeners = this._events[type];
		if (listeners.constructor == Array) {
			listeners.forEach(function(listener, i) {
				this.window.on(type, listener);
				delete this._events[type][i];
			}, this);
		} else {
			this.window.on(type, listeners);
			delete this._events[type];
		}
	}, this);*/
}

TiWindow.prototype.loadUrl = function()
{
	if (this.options.url == null) return;

	vm.runInThisContext(
		assets.readResource(this.options.url),
		this.options.url);
}

TiWindow.prototype.addEventListener = function(event, listener) {
	if (["open", "close"].indexOf(event) > 0 || this.window == null) {
		EventEmitter.prototype.addEventListener.call(this, event, listener);
	} else {
		this.window.addEventListener(event, listener);
	}
}

TiWindow.prototype.removeEventListener = function(event, listener) {
	if (["open", "close"].indexOf(event) > 0 || this.window == null) {
		EventEmitter.prototype.removeEventListener.call(this, event, listener);
	} else {
		this.window.removeEventListener(event, listener);
	}
}

TiWindow.prototype.fireEvent = function(event, data) {
	if (["open", "close"].indexOf(event) > 0 || this.window == null) {
		EventEmitter.prototype.fireEvent.call(this, event, data);
	} else {
		this.window.fireEvent(event, data);
	}
}

TiWindow.prototype.close = function(options) {
	if (this.window == null) {
		return;
	}

	if (this.isActivity) {
		this.window.close();
	} else {
		UI.currentWindow.remove(this.window);
	}
}

exports.TiWindow = TiWindow;
