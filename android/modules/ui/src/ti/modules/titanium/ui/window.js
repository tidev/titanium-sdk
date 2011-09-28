var EventEmitter = require("events").EventEmitter,
	UI = require("titanium").UI,
	assets = require("assets"),
	vm = require("vm");

var newActivityRequiredKeys = ["fullscreen", "navBarHidden", "modal", "windowSoftInputMode"];

// Backward compatibility for lightweight windows

exports.Window = function Window(options) {
	UI.TiBaseWindow.call(this, options);

	this.window = null;
	this.view = null;
	this.isActivity = false;
}

Window.prototype = new UI.TiBaseWindow();

Window.prototype.getOrientationModes = function getOrientationModes() {
	return this._orientationModes;
}
Window.prototype.__defineGetter__("orientationModes", getOrientationModes);

Window.prototype.setOrientationModes = function setOrientationModes(modes) {
	this._orientationModes = modes;
	if (this.window == null) return;

	this.window.setOrientationModes(modes);
}
Window.prototype.__defineSetter__("orientationModes", setOrientationModes);

Window.prototype.getActivity = function getActivity() {
	return this.window.getActivity();
}
Window.prototype.__defineGetter__("activity", getActivity);

Window.prototype.open = function(options) {
	this.extend(options);

	newActivityRequiredKeys.forEach(function(keys) {
		if (key in options || key in this) {
			this.isActivity = true;
		}
	}, this);

	if (!this.isActivity && "tabOpen" in options && options.tabOpen) {
		this.isActivity = true;
	}

	if (this.isActivity) {
		this.window = new UI.ActivityWindow(this);
		this.attachListeners();
		this.window.open(this);
	} else {
		this.window = UI.currentWindow;
		this.view = new UI.View(this);
		this.view.zIndex = Math.MAX_INT - 2;
		this.attachListeners();
		this.window.add(this.view);
	}
}

Window.prototype.close = function(options) {
	if (this.window == null) {
		return;
	}
	this.extend(options);

	if (this.isActivity) {
		this.window.close(this);
	} else {
		if (this.view.parent != null) {
			this.window.remove(this.view);
			this.window = null;
		}
	}
}

Window.prototype.attachListeners = function() {
	// map the right events to open/close
	var self = this;
	var openEvent = this.isActivity ? "open" : "added";
	var win = this.isActivity ? this.window : this.view;

	win.on(openEvent, function(e) {
		if ("url" in self) {
			self.loadUrl();
		}
		e.source = self;
		self.emit("open", e);
	});

	var closeEvent = this.isActivity ? "close" : "removed";
	win.on(closeEvent, function(e) {
		e.source = self;
		self.emit("close", e);
	});
}

Window.prototype.loadUrl = function()
{
	if (this.url == null) return;

	vm.runInThisContext(assets.readResource(this.url), this.url);
}

Window.prototype.addEventListener = function(event, listener) {
	if (["open", "close"].indexOf(event) > 0 || this.window == null) {
		EventEmitter.prototype.addEventListener.call(this, event, listener);
	} else {
		this.window.addEventListener(event, listener);
	}
}

Window.prototype.removeEventListener = function(event, listener) {
	if (["open", "close"].indexOf(event) > 0 || this.window == null) {
		EventEmitter.prototype.removeEventListener.call(this, event, listener);
	} else {
		this.window.removeEventListener(event, listener);
	}
}

Window.prototype.fireEvent = function(event, data) {
	if (["open", "close"].indexOf(event) > 0 || this.window == null) {
		EventEmitter.prototype.fireEvent.call(this, event, data);
	} else {
		this.window.fireEvent(event, data);
	}
}

UI.createWindow = function(options) {
	return new Window(options);
}