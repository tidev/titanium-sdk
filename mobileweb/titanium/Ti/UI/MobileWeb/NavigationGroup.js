define(["Ti/_/declare", "Ti/UI/View", "Ti/UI", "Ti/_/style"],
	function(declare, View, UI, style) {
		
	var undef;

	return declare("Ti.UI.MobileWeb.NavigationGroup", View, {
		
		constructor: function(args) {
			
			var self = this;
			self._windows = [];
			
			// Process the creation time args
			if (!args.window) {
				throw new Error("A window must be specified at creation time in Ti.UI.MobileWeb.NavigationGroup.");
			}
			var rootWindow = self.constants.window = args && args.window,
				navBarAtBottom = self.constants.navBarAtBottom = (args && args.navBarAtBottom) || self.constants.navBarAtBottom;
			
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
				text: rootWindow.title
			}));
			
			// Create the content container
			self._contentContainer = UI.createView({
				width: UI.FILL,
				height: UI.FILL
			});
			self._contentContainer.add(rootWindow);
			
			// Add the contents to the screen
			var borderLocation;
			if (navBarAtBottom) {
				self.add(self._contentContainer);
				self.add(self._navBarContainer);
				borderLocation = "borderTop"
			} else {
				self.add(self._navBarContainer);
				self.add(self._contentContainer);
				borderLocation = "borderBottom"
			}
			style.set(self._navBarContainer.domNode,borderLocation,"1px solid #555");
		},
		
		open: function(win, options) {
			
			// Show the back button, if need be
			var backButton = this._backButton;
			if (!backButton.opacity) {
				backButton.animate({opacity: 1, duration: 250}, function() {
					backButton.opacity = 1;
					backButton.enabled = true;
				});
			}
			
			// Show the window
			this._windows.push(win);
			this._contentContainer.add(win);
			this._title.text = win.title;
		},
		
		close: function(win, options) {
			
			var windows = this._windows,
				numWindows = windows.length,
			win = win || windows[numWindows - 1];
			var windowLocation = windows.indexOf(win)
			if (!~windowLocation) {
				return;
			}
			
			// If the window is on top, we have to go to the previous window
			if (windows[numWindows - 1] === win) {
				if (numWindows > 1) {
					this._title.text = windows[numWindows - 2].title;
				} else {
					this._title.text = this.window.title;
					var backButton = this._backButton;
					backButton.animate({opacity: 0, duration: 250}, function() {
						backButton.opacity = 0;
						backButton.enabled = false;
					});
				}
			}
			
			// Remove the window
			windows.splice(windowLocation,1);
			this._contentContainer.remove(win);
		},
		
		constants: {
			window: undef,
			navBarAtTop: true
		}
		
	});
	
});