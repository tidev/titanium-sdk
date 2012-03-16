define(["Ti/_/declare", "Ti/_/lang", "Ti/UI", "Ti/UI/View"], function(declare, lang, UI, View) {

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
			if (!this._opened) {
				this._opened = 1;
				UI._addWindow(this, 1).show();
				this.fireEvent("open");
				this.fireEvent("focus", this._state);
			}
		},

		close: function(args) {
			if (this._opened) {
				this._opened = 0;
				UI._removeWindow(this);
				this.fireEvent("close");
			}
		},

		setWindowTitle: function(title) {
			document.title = title || require.config.app.name;
			return title;
		}

	});

});