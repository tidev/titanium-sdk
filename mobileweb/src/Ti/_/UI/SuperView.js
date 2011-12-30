define("Ti/_/UI/SuperView", ["Ti/_/declare", "Ti/_/dom", "Ti/UI/View"], function(declare, dom, View) {
	
	var windows = [],
		activeWindow;

	require.on(window, "popstate", function(evt) {
		var win;
		evt && evt.state && evt.state.screenIndex !== null && (win = windows[evt.state.windowIdx]) && win.open({ isBack:1 });
	});

	require.on(window, "resize", function() {
		Ti.UI._doFullLayout();
	});

	return declare("Ti._.UI.SuperView", View, {

		_windowIdx: null,
		_opened: 0,

		constructor: function() {
			this._windowIdx = windows.length;
			windows.push(this);
		},

		destroy: function() {
			windows[this._windowIdx] = null;
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(args) {
			if (!this._opened) {
				// TODO: if args, then do animation on open
				this._opened = 1;
				this.show();
				Ti.UI._addWindow(this);
				(args && args.isBack) || (window.history.pushState && window.history.pushState({ windowIdx: this._windowIdx }, "", ""));
				Ti.UI._doFullLayout();
			}
			activeWindow = this;
		},

		close: function(args) {
			if (this._opened) {
				// TODO: if args, then do animation on close
				this._opened = 0;
				Ti.UI._removeWindow(this);
				window.history.go(-1);
				Ti.UI._doFullLayout();
				this.fireEvent("blur", { source: this.domNode });
			}
		},

		setWindowTitle: function(title) {
			activeWindow === this && (document.title = title || require.config.project.name);
			return title;
		}

	});

});