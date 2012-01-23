define("Ti/_/UI/SuperView", ["Ti/_/declare", "Ti/_/dom", "Ti/UI/View"], function(declare, dom, View) {
	
	var windows = [],
		stack = [],
		stackIdx = -1,
		activeWindow,
		history = window.history || {},
		ps = history.pushState;

	ps && require.on(window, "popstate", function(evt) {
		var i,
			n = stackIdx + 1,
			win;
		if (evt && evt.state && (i = evt.state.windowIdx) !== null) {
			win = windows[i];
			if (n < stack.length && stack[n]._windowIdx === i) {
				// forward
				history.pushState({ windowIdx:i }, "", "");
			} else {
				// back
				activeWindow.close();
				win.fireEvent("focus");
			}
		}
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
			this.close();
			windows[this._windowIdx] = null;
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(args) {
			var i,
				n = stackIdx + 1,
				len = stack.length - n;

			if (!this._opened) {
				// TODO: if args, then do animation on open
				this._opened = 1;
				this.show();
				Ti.UI._addWindow(this);

				activeWindow && activeWindow.fireEvent("blur");
				ps && history[activeWindow ? "pushState" : "replaceState"]({ windowIdx: this._windowIdx }, "", "");
				if (len > 0) {
					for (i = len - 1; i >= n; i--) {
						stack[i].close({ skipHistory:true });
					}
					stack.splice(n, len);
				}
				stackIdx++;
				stack.push(activeWindow = this);

				this.fireEvent("open");
				this.fireEvent("focus");
			}
		},

		close: function(args) {
			if (this._opened) {
				// TODO: if args, then do animation on close
				this._opened = 0;
				Ti.UI._removeWindow(this);
				(!args || !args.skipHistory) && window.history.go(-1);
				stackIdx--;
				Ti.UI._doFullLayout();
				this.fireEvent("blur");
				this.fireEvent("close");
			}
		},

		setWindowTitle: function(title) {
			activeWindow === this && (document.title = title || require.config.project.name);
			return title;
		}

	});

});