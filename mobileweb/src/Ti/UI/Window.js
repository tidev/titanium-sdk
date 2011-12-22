define("Ti/UI/Window", ["Ti/_/declare", "Ti/Gesture", "Ti/_/UI/SuperView", "Ti/UI"], function(declare, Gesture, SuperView, UI) {

	var undef;

	return declare("Ti.UI.Window", SuperView, {

		properties: {
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

			titleid: undef,

			titlePrompt: undef,

			titlepromptid: undef,

			url: {
				set: function(value) {
					/*
					if (isHTMLPage()) {
						window.location.href = require("Ti/_").getAbsolutePath(_url);
					} else {
						// We need this for proper using window.open in code
						setTimeout(function(){
							var prevWindow = Ti.UI.currentWindow;
							Ti.UI.currentWindow = obj;
							require("Ti/_/include!sandbox!" + _url);
							Ti.UI.currentWindow = prevWindow;
						}, 1);
					}
					*/
					return value;
				}
			}
		},

		open: function() {
			SuperView.prototype.open.apply(this);
			this.setWindowTitle(this.title);
			this.fireEvent("open", { source: null });
			this.fireEvent("focus", { source: this.domNode });
		},

		close: function() {
			SuperView.prototype.close.apply(this, arguments);
			this.fireEvent("blur", { source: this.domNode });
			this.fireEvent("close", { source: null });
		}

	});

});