define("Ti/_/UI/SuperView", ["Ti/_/declare", "Ti/_/dom", "Ti/UI", "Ti/UI/View"], function(declare, dom, UI, View) {

	var stack = [],
		sessId = Math.random(),
		hist = window.history || {},
		ps = hist.pushState,
		skip = { skipHistory: 1 };

	ps && require.on(window, "popstate", function(evt) {
		var n = stack.length,
			win = n && stack[n-1],
			widgetId;

		if (evt && evt.state && evt.state.sessId === sessId && (widgetId = evt.state.id) && n > 1) {
			if (stack[n-2].widgetId !== widgetId) {
				// forward
				history.pushState(evt.state, "", "");
			} else {
				// back
				win.close(skip);
				UI._setWindow(win = stack[stack.length-1]);
				win.fireEvent("focus", win._state);
			}
		}
	});

	require.on(window, "resize", function() {
		UI._doFullLayout();
	});

	return declare("Ti._.UI.SuperView", View, {

		destroy: function() {
			this.close(skip);
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(args) {
			var len = stack.length,
				active = len && stack[len-1];

			if (!this._opened) {
				this._opened = 1;
				this.show();
				UI._addWindow(this);

				active && active.fireEvent("blur", active._state);
				ps && history[active ? "pushState" : "replaceState"]({ id: this.widgetId, sessId: sessId }, "", "");
				stack.push(this);
				this._stackIdx = len;

				this.fireEvent("open");
				this.fireEvent("focus", this._state);
			}
		},

		close: function(args) {
			if (this._opened) {
				this._opened = 0;
				UI._removeWindow(this);

				this._stackIdx !== null && this._stackIdx < stack.length && stack.splice(this._stackIdx, 1);
				this._stackIdx = null;
				UI._setWindow(stack[stack.length-1]);

				(!args || !args.skipHistory) && window.history.go(-1);

				UI._doFullLayout();

				this.fireEvent("blur", this._state);
				this.fireEvent("close");
			}
		},

		setWindowTitle: function(title) {
			stack[stack.length-1] === this && (document.title = title || require.config.project.name);
			return title;
		}

	});

});