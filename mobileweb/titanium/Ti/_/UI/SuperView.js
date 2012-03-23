define(["Ti/_/declare", "Ti/UI", "Ti/UI/View"], function(declare, UI, View) {

	return declare("Ti._.UI.SuperView", View, {

		destroy: function() {
			this.close();
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(args) {
			if (!this._opened) {
				this._opened = 1;
				UI._addWindow(this, 1).show();
				this.fireEvent("open");
				this._handleFocusEvent();
			}
		},

		close: function(args) {
			if (this._opened) {
				this._opened = 0;
				UI._removeWindow(this);
				this.fireEvent("close");
				this._handleBlurEvent();
			}
		},
		
		_handleFocusEvent: function(args) {
			this.fireEvent("focus",args);
		},
		
		_handleBlurEvent: function(args) {
			this.fireEvent("blur",args);
		}

	});

});