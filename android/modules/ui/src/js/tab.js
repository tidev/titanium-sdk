
exports.bootstrap = function(Titanium) {
	var Tab = Titanium.UI.Tab;

	var tabOpen = Tab.prototype.open;
	Tab.prototype.open = function(window, options) {
		if (!window) {
			return;
		}

		if (!options) {
			options = {};
		}

		this.setWindow(window);
		options.tabOpen = true;

		window.open(options);
	}

	Tab.prototype.close = function(options) {
		var window = this.getWindow();
		if (window) {
			window.close(options);
			this.setWindow(null);
		}
	}
}