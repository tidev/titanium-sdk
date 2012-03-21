define(["Ti/_/declare", "Ti/UI/View", "Ti/UI", "Ti/_/style", "Ti/_/lang"],
	function(declare, View, UI, style, lang) {
		
	var isDef = lang.isDef;

	return declare("Ti.UI.MobileWeb.NavigationGroup", View, {

		constructor: function(args) {
			var self = this;
			self._windows = [];
			
			// Process the creation time args
			if (!args.window) {
				throw new Error("A window must be specified at creation time in Ti.UI.MobileWeb.NavigationGroup.");
			}
			var rootWindow = self.constants.window = args && args.window;
			
			// Create the nav controls
			self.layout = "vertical";
			self._navBarContainer = UI.createView({
				width: UI.FILL,
				height: 50,
				backgroundColor: "#888"
			});
			self._navBarContainer.add(self._backButton = UI.createButton({
				title: "Back",
				left: 5,
				opacity: 0,
				enabled: true
			}));
			self._backButton.addEventListener("singletap", function(){
				self.close();
			});
			self._navBarContainer.add(self._title = UI.createLabel({
				text: rootWindow._getTitle(),
				width: UI.FILL,
				textAlign: UI.TEXT_ALIGNMENT_CENTER,
				touchEnabled: false
			}));
			
			// Create the content container
			self._contentContainer = UI.createView({
				width: UI.FILL,
				height: UI.FILL
			});
			self._contentContainer.add(rootWindow);
			
			self.navBarAtTop = true;
		},

		_defaultWidth: UI.FILL,
		
		_defaultHeight: UI.FILL,

		open: function(win, options) {
			// Show the back button, if need be
			var backButton = this._backButton;

			backButton.opacity || backButton.animate({opacity: 1, duration: 250}, function() {
				backButton.opacity = 1;
				backButton.enabled = true;
			});

			// Set a default background
			!isDef(win.backgroundColor) && !isDef(win.backgroundImage) && (win.backgroundColor = "#fff");

			// Show the window
			this._windows.push(win);
			this._contentContainer.add(win);
			this._title.text = win._getTitle();
		},
		
		close: function(win, options) {
			var windows = this._windows,
				topWindowIdx = windows.length - 1,
				win = win || windows[topWindowIdx],
				windowLocation = windows.indexOf(win),
				backButton = this._backButton,
				nextWindow = this.window;

			if (!~windowLocation) {
				return;
			}

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
		},

		constants: {
			window: void 0
		},

		properties: {
			navBarAtTop: {
				set: function (value, oldValue) {
					if (value !== oldValue) {
						
						var navBarContainer = this._navBarContainer,
							contentContainer = this._contentContainer;
						this.remove(navBarContainer);
						this.remove(contentContainer);
						
						var borderLocation;
						if (value) {
							this.add(navBarContainer);
							this.add(contentContainer);
							borderLocation = "borderBottom"
						} else {
							this.add(contentContainer);
							this.add(navBarContainer);
							borderLocation = "borderTop"
						}
						style.set(navBarContainer.domNode,borderLocation,"1px solid #555");
					}
					return value;
				}
			}
		}

	});

});