define(["Ti/_/css", "Ti/_/declare", "Ti/UI/View", "Ti/UI", "Ti/_/lang"],
	function(css, declare, View, UI, lang) {
		
	var isDef = lang.isDef,
		UI_FILL = UI.FILL,
		navGroupCss = "TiUINavigationGroup";

	return declare("Ti.UI.MobileWeb.NavigationGroup", View, {

		constructor: function(args) {
			var self = this,
				win = self.constants.window = args && args.window,
				tab = args && args._tab,
				navBar = self._navBarContainer = UI.createView({
					width: UI_FILL,
					height: 50
				});

			self.layout = UI._LAYOUT_CONSTRAINING_VERTICAL;

			css.add(navBar.domNode, navGroupCss);

			self._navBarContainer._add(self._backButton = UI.createButton({
				title: "Back",
				left: 5,
				opacity: 0,
				enabled: true
			}));

			self._backButton.addEventListener("singletap", function() {
				self.close(self._windows[self._windows.length-1]);
			});

			self._navBarContainer._add(self._title = UI.createLabel({
				width: UI_FILL,
				textAlign: UI.TEXT_ALIGNMENT_CENTER,
				touchEnabled: false
			}));

			// Create the content container
			self._contentContainer = UI.createView({
				width: UI_FILL,
				height: UI_FILL
			});

			// init window stack and add window
			self._windows = [];
			win && this._addWindow(win);

			// invoke the navBarAtTop setter
			self.navBarAtTop = true;
		},

		_defaultWidth: UI_FILL,

		_defaultHeight: UI_FILL,

		_updateTitle: function() {
			var len = this._windows.length;
			this._title.text = (len && this._windows[len - 1]._getTitle()) || (this._tab && this._tab._getTitle()) || "";
		},

		_addWindow: function(win) {
			var tab = this._tab;
			tab && (win.tabGroup = (win.tab = tab)._tabGroup);
			this._windows.push(win);
			this._contentContainer._add(win);
		},

		_getTopWindow: function() {
			var windows = this._windows,
				len = windows.length;
			return len ? windows[windows.length - 1] : null;
		},

		add: function(view) {
			this._navBarContainer._add(view);
			this._publish(view);
		},

		remove: function(view) {
			this._navBarContainer._remove(view);
			this._unpublish(view);
		},

		open: function(win) {
			if (!win._opened) {
				var backButton = this._backButton;

				// Publish the window
				this._publish(win);

				// Show the back button, if need be
				backButton.animate({opacity: 1, duration: 250}, function() {
					backButton.opacity = 1;
					backButton.enabled = true;
				});

				// Set a default background
				!isDef(win.backgroundColor) && !isDef(win.backgroundImage) && (win.backgroundColor = "#fff");

				this._windows[this._windows.length - 1].fireEvent("blur");
				this._title.text = win._getTitle();

				// Show the window
				this._addWindow(win);
				win._opened || win.fireEvent("open");
				win._opened = 1;
				win.fireEvent("focus");
			}
		},

		close: function(win) {
			var windows = this._windows,
				windowIdx = windows.indexOf(win);

				// Unpublish the window
				this._unpublish(win);

			// make sure the window exists and it's not the root
			if (windowIdx > 0) {
				windows.splice(windowIdx, 1);
				win.fireEvent("blur");
				this._contentContainer.remove(win);
				win.fireEvent("close");
				win._opened = 0;

				if (windowIdx > 0) {
					// hide the back button if we're back at the root
					windows.length <= 1 && this._backButton.animate({ opacity: 0, duration: 250 }, function() {
						this.opacity = 0;
						this.enabled = false;
					});

					win = windows[windows.length - 1];
					this._title.text = win._getTitle();
					win.fireEvent("focus");
				}
			}
		},

		_reset: function() {
			var windows = this._windows,
				win,
				i = windows.length - 1,
				l = i;

			this._backButton.animate({opacity: 0, duration: 250}, function() {
				this.opacity = 0;
				this.enabled = false;
			});

			while (1) {
				win = windows[i];
				if (!i) {
					break;
				}
				i-- === l && win.fireEvent("blur");
				this._contentContainer.remove(win);
				win.fireEvent("close");
				win._opened = 0;
			}

			windows.splice(1);
			this._title.text = win._getTitle();
			win.fireEvent("focus");
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