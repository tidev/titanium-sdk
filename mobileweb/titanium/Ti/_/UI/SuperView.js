define(["Ti/_/declare", "Ti/_/dom", "Ti/_/lang", "Ti/UI", "Ti/UI/View"], function(declare, dom, lang, UI, View) {

	var stack = [],
		sessId = Math.random(),
		hist = window.history || {},
		ps = hist.pushState;

	ps && require.on(window, "popstate", function(evt) {
		var n = stack.length,
			win = n && stack[n-1],
			widgetId;

		if (evt && evt.state && evt.state.sessId === sessId && (widgetId = evt.state.id)) {
			if (n > 1 && stack[n-2].widgetId === widgetId) {
				win.close();
				UI._setWindow(win = stack[stack.length-1]);
				win.fireEvent("focus", win._state);
			}
		}
	});

	return declare("Ti._.UI.SuperView", View, {

		constructor: function() {
			this.addEventListener("focus", lang.hitch(this, function() {
				this.setWindowTitle(this.title);
			}));
		},

		destroy: function() {
			this.close();
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(args) {
			var len = stack.length,
				active = len && stack[len-1];

			if (!this._opened) {
				this._opened = 1;
				UI._addWindow(this, 1).show();

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