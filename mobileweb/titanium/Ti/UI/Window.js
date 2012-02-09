define(["Ti/_/declare", "Ti/Gesture", "Ti/_/UI/SuperView", "Ti/UI"], function(declare, Gesture, SuperView, UI) {

	var undef;

	return declare("Ti.UI.Window", SuperView, {
	
		_defaultWidth: "100%",
		_defaultHeight: "100%",

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
			SuperView.prototype.open.apply(this, args);
		},

		close: function(args) {
			var mw = this._modalWin;
			if (mw) {
				UI._removeWindow(mw).destroy();
				this._modalWin = null;
			}
			SuperView.prototype.close.apply(this, args);
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
				get: function(value) {
					console.debug('Property "Titanium.UI.Window#.titleid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Window#.titleid" is not implemented yet.');
					return value;
				}
			}
		}

	});

});