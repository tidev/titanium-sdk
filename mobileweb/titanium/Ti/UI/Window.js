define(["Ti/_/declare", "Ti/Gesture", "Ti/Locale", "Ti/_/UI/SuperView", "Ti/UI"], function(declare, Gesture, Locale, SuperView, UI) {

	var undef;

	return declare("Ti.UI.Window", SuperView, {
	
		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		postscript: function() {
			if (this.url) {
				var prevWindow = UI.currentWindow;
				UI._setWindow(this);
				require("Ti/_/include!sandbox!" + this.url);
				UI._setWindow(prevWindow);
			}
		},

		open: function(args) {
			if (this.modal) {
				UI._addWindow(this._modalWin = UI.createView({
					backgroundColor: UI.backgroundColor,
					backgroundImage: UI.backgroundImage
				})).show();
			}
			SuperView.prototype.open.call(this, args);
		},

		close: function(args) {
			var mw = this._modalWin;
			if (mw) {
				UI._removeWindow(mw).destroy();
				this._modalWin = null;
			}
			SuperView.prototype.close.call(this, args);
		},

		constants: {
			url: undef
		},

		properties: {
			modal: undef,

			orientation: {
				get: function() {
					return Gesture.orientation;
				}
			},

			title: {
				set: function(value) {
					return this.setWindowTitle(value);
				}
			},

			titleid: {
				set: function(value) {
					this.title = Locale.getString(value);
					return value;
				}
			}
		}

	});

});