define(["Ti/_/css", "Ti/_/declare", "Ti/UI/View", "Ti/UI", "Ti/_/lang"],
	function(css, declare, View, UI, lang) {
		
	var isDef = lang.isDef,
		navGroupCss = "TiUINavigationGroup";

	return declare("Ti.UI.MobileWeb.NavigationGroup", View, {

		constructor: function(args) {
			var self = this,
				rootWindow = self.constants.window = args && args.window,
				navBar = self._navBarContainer = UI.createView({
					width: UI.FILL,
					height: 50
				});

			self._windows = [];

			// Create the nav controls
			self.layout = "vertical";

			css.add(navBar.domNode, navGroupCss);

			self._navBarContainer._add(self._backButton = UI.createButton({
				title: "Back",
				left: 5,
				opacity: 0,
				enabled: true
			}));

			self._backButton.addEventListener("singletap", function() {
				self.close();
			});

			self._navBarContainer._add(self._title = UI.createLabel({
				width: UI.FILL,
				textAlign: UI.TEXT_ALIGNMENT_CENTER,
				touchEnabled: false
			}));

			// Create the content container
			self._contentContainer = UI.createView({
				width: UI.FILL,
				height: UI.FILL
			});

			rootWindow && self._contentContainer._add(rootWindow);

			// invoke the navBarAtTop setter
			self.navBarAtTop = true;
		},

		_defaultWidth: UI.FILL,
		
		_defaultHeight: UI.FILL,

		_updateTitle: function() {
			this._title.text = (this.window && this.window._getTitle()) || (this._tab && this._tab._getTitle()) || "";
		},

		open: function(win, options) {
			if (!win._opened) {
				// Show the back button, if need be
				var backButton = this._backButton,
					windows = this._windows,
					winLen = windows.length;

				backButton.opacity || backButton.animate({opacity: 1, duration: 250}, function() {
					backButton.opacity = 1;
					backButton.enabled = true;
				});

				// Set a default background
				!isDef(win.backgroundColor) && !isDef(win.backgroundImage) && (win.backgroundColor = "#fff");

				(winLen ? windows[winLen-1] : this.window).fireEvent("blur");

				// Show the window
				windows.push(win);
				this._contentContainer._add(win);
				this._title.text = win._getTitle();

				win.fireEvent("open");
				win.fireEvent("focus");
				win._opened = 1;
			}
		},

		close: function(win, options) {
			var windows = this._windows,
				topWindowIdx = windows.length - 1,
				win = win || windows[topWindowIdx],
				windowLocation = windows.indexOf(win),
				backButton = this._backButton,
				nextWindow = this.window;

			if (~windowLocation) {
				// If the window is on top, we have to go to the previous window
				if (windows[topWindowIdx] === win) {
					if (topWindowIdx > 0) {
						nextWindow = windows[topWindowIdx - 1];
					} else {
						backButton.animate({opacity: 0, duration: 250}, function() {
							backButton.opacity = 0;
							backButton.enabled = false;
						});
					}
					this._title.text = nextWindow._getTitle();
				}

				// Remove the window
				windows.splice(windowLocation, 1);
				this._contentContainer.remove(win);

				win.fireEvent("blur");
				win.fireEvent("close");
				win._opened = 0;
				(topWindowIdx ? windows[topWindowIdx] : this.window).fireEvent("focus");
			}
		},

		constants: {
			window: void 0
		},

		properties: {
			navBarAtTop: {
				set: function (value, oldValue) {
					if (value !== oldValue) {
						var containers = [this._contentContainer, this._navBarContainer],
							node = this._navBarContainer.domNode;

						containers.forEach(this._remove, this);
						value && containers.reverse();
						containers.forEach(this._add, this);

						css.remove(node, navGroupCss + (value ? "Top" : "Bottom"));
						css.add(node, navGroupCss + (value ? "Bottom" : "Top"));
					}

					return value;
				}
			}
		}

	});

});