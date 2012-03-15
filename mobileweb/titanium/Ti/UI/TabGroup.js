define(["Ti/_/declare", "Ti/_/css", "Ti/_/UI/SuperView", "Ti/UI/View", "Ti/UI", "Ti/_/lang", "Ti/_/style"], 
	function(declare, css, SuperView, View, UI, lang, style) {

	var is = require.is,
		setStyle = style.set,
		postUpdateTabsBackground = {
			post: "_updateTabsBackground"
		};

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function(args){
			
			var tabsAtBottom = this.constants.tabsAtBottom = (args && args.tabsAtBottom) || this.constants.tabsAtBottom;
			
			// Create the tabBarContainer class
			var self = this;
			var TabBarContainer = declare("Ti._.UI.TabGroup.TabBarContainer", View, {
				_doLayout: function(params) {
					
					var tabs = self.tabs,
						numTabs = tabs.length,
						totalDividerWidth = (numTabs - 1) * self.tabDividerWidth,
						tabWidth = Math.floor((params.boundingSize.width - totalDividerWidth) / numTabs);
					for (var i = 0; i < numTabs - 1; i++) {
						tabs[i]._defaultWidth = tabWidth;
					}
					 // Make the last tab consume the remaining space. Fractional widths look really bad in tabs.
					tabs[i]._defaultWidth = params.boundingSize.width - totalDividerWidth - tabWidth * (numTabs - 1);
					
					return View.prototype._doLayout.call(this,params);
				}
			});
			
			// create the tab group container
			this.add(this._tabGroupContainer = UI.createView({
				left: 0,
				top: 0,
				right: 0,
				bottom: 0,
				layout: "vertical"
			}));
			
			// Create the tab bar
			this._tabBarContainer = new TabBarContainer({
				width: UI.FILL,
				layout: "horizontal"
			});
			this.tabHeight = 50;

			// Create the tab window container
			this._tabContentContainer = UI.createView({
				width: UI.FILL,
				height: UI.FILL
			});
			
			if (tabsAtBottom) {
				this._tabGroupContainer.add(this._tabContentContainer);
				this._tabGroupContainer.add(this._tabBarContainer);
			} else {
				this._tabGroupContainer.add(this._tabBarContainer);
				this._tabGroupContainer.add(this._tabContentContainer);
			}
			
			// Create the back button
			this.add(this._backButtonContainer = Ti.UI.createView({
				width: UI.FILL,
				height: 0,
				backgroundColor: this.tabsBackgroundColor
			}));
			this._backButtonContainer.add(this._backButton = UI.createButton({
				title: "Back",
				height: 39,
				width: 100
			}));
			
			// Create the window container, but don't add it yet
			this._windowContainer = UI.createView({
				left: 0,
				right: 0,
			});
			
			if (tabsAtBottom) {
				this._backButtonContainer.top = 0;
				this._backButton.bottom = 2;
				this._windowContainer.bottom = this.tabHeight;
				this._windowContainer.top = 45;
			} else {
				this._backButtonContainer.bottom = 0;
				this._backButton.top = 2;
				this._windowContainer.top = this.tabHeight;
				this._windowContainer.bottom = 45;
			}

			this.tabs = [];
		},

		addTab: function(tab) {
			// Initialize the tabs, if necessary
			this.tabs = this.tabs || [];
			
			// Add the tab to the list
			var tabs = this.tabs;
			tabs.push(tab);
			tab._tabGroup = this;

			// Set the active tab if there are currently no tabs, otherwise add a divider
			if (tabs.length === 1) {
				this.properties.activeTab = tab;
			} else {
				this._tabBarContainer.add(this._createTabDivider());
			}
			
			// Add the tab to the UI
			this._tabBarContainer.add(tab);
			
			// Update the background on the tab
			this._updateTabBackground(tab);
		},

		removeTab: function(tab) {
			// Remove the tab from the list
			var tabs = this.tabs,
				idx = this.tabs.indexOf(tab);

			if (idx >= 0) {
				tabs.splice(idx, 1);

				// Remove the tab from the tab bar and recalculate the tab sizes
				this._tabBarContainer.remove(tab);

				// Update the active tab, if necessary
				tab === this._activeTab && this._activateTab(tabs[0]);
			}
		},
		
		_createTabDivider: function() {
			return UI.createView({
				width: this.tabDividerWidth,
				height: UI.FILL,
				backgroundColor: this.tabDividerColor
			});
		},

		_activateTab: function(tab) {
			var tabs = this.tabs,
				prev = this._activeTab;

			if (prev) {
				prev.active = false;
				prev._doBackground();
				prev["window"] && this._tabContentContainer.remove(prev["window"]);
			}

			tab.active = true;
			this._activeTab = tab;
			UI.currentTab = tab;
			tab["window"] && this._tabContentContainer.add(tab["window"]);
			this._state = {
				index: tabs.indexOf(tab),
				previousIndex: prev ? tabs.indexOf(prev) : -1,
				previousTab: prev,
				tab: tab
			};
			this._updateTabsBackground();
		},
		
		_openWindowInTabContainer: function(win, args) {
			
			var self = this;
			function addWindow() {
				
				// Set the opacity to 0 (we are going to fade in)
				var originalOpacity = lang.val(win.opacity, 1);
				win.opacity = 0;
				
				function postWindowAddLayout() {
					win.removeEventListener("postlayout",postWindowAddLayout);
					setTimeout(function() {
						win.animate({opacity: originalOpacity, duration: 200}, function(){
							win.opacity = originalOpacity;
						});
					},1);
				}
				
				// We add the window and wait for it to be drawn
				win.addEventListener("postlayout",postWindowAddLayout);
				self._windowContainer.add(win);
			}
			
			if (!self._windowContainerOpen) {
					
				if (self._tabsAtTop) {
					setStyle(self._backButtonContainer.domNode,"borderTop","1px solid " + self.tabDividerColor);
				} else {
					setStyle(self._backButtonContainer.domNode,"borderBottom","1px solid " + self.tabDividerColor);
				}
				
				self._windowContainerOpen = true;
				
				function postContainerAddLayout() {
					self._windowContainer.removeEventListener("postlayout",postContainerAddLayout);
					
					self._backButtonContainer.animate({height: 45, duration: 250}, function(){
						
						// Finish the back button animation
						self._backButtonContainer.height = 45;
						
						// Apply a background if one is not already set
						lang.isDef(win.backgroundColor) || (win.backgroundColor = "white");
						
						addWindow();
					});
				}
			
				// We add the container and wait for it to be drawn
				self._windowContainer.addEventListener("postlayout",postContainerAddLayout);
				self.add(self._windowContainer);
			} else {
				addWindow();
			}
		},
		
		_closeLastWindow: function() {
			var self = this;
			self.remove(self._windowContainer);
			self._backButtonContainer.animate({height: 0, duration: 250}, function(){
				self._backButtonContainer.height = 0;
			});
		},
		
		_updateTabBackground: function(tab) {
			var prefix = tab.active ? "activeTab" : "tabs";
			tab._defaultBackgroundColor = this[prefix + "BackgroundColor"];
			tab._defaultBackgroundImage = this[prefix + "BackgroundImage"];
			tab._defaultBackgroundFocusedColor = this[prefix + "BackgroundFocusedColor"];
			tab._defaultBackgroundFocusedImage = this[prefix + "BackgroundFocusedImage"];
			tab._defaultBackgroundDisabledColor = this[prefix + "BackgroundDisabledColor"];
			tab._defaultBackgroundDisabledImage = this[prefix + "BackgroundDisabledImage"];
			tab._defaultBackgroundSelectedColor = this[prefix + "BackgroundSelectedColor"];
			tab._defaultBackgroundSelectedImage = this[prefix + "BackgroundSelectedImage"];
			tab._doBackground();
		},
		
		_updateTabsBackground: function() {
			var tabs = this.tabs;
			for (var i = 0; i < tabs.length; i++) {
				this._updateTabBackground(tabs[i]);
			}
		},
		
		_updateDividers: function(){
			var tabs = this._tabBarContainer.children;
			for(var i = 1; i < tabs.length; i += 2) {
				var tab = tabs[i];
				tab.width = this.tabDividerWidth;
				tab.backgroundColor = this.tabDividerColor;
			}
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,
		
		constants: {
			tabsAtBottom: true
		},

		properties: {
			activeTab: {
				set: function(value) {
					if (is(value, "Number")) {
						value = this.tabs[value];
					}
					if (!value in this.tabs) {
						return;
					}
					return value;
				},
				post: function(value) {
					lang.isDef(value) && this._activateTab(value);
				}
			},

			tabs: {
				set: function(value) {
					var i,
						tabBarContainer = this._tabBarContainer;

					if (!is(value, "Array")) {
						return;
					}

					tabBarContainer._removeAllChildren();

					if (value.length) {
						this._activateTab(value[0]);
						for (i = 0; i < value.length - 1; i++) {
							tabBarContainer.add(value[i]);
							tabBarContainer.add(this._createTabDivider());
						}
						tabBarContainer.add(value[value.length - 1]); // No trailing divider
					}

					return value;
				},
				post: "_updateTabsBackground"
			},
			
			activeTabBackgroundColor: {
				post: "_updateTabsBackground",
				value: "#fff"
			},
			
			activeTabBackgroundImage: postUpdateTabsBackground,
			
			activeTabBackgroundDisabledColor: {
				post: "_updateTabsBackground",
				value: "#888"
			},
			
			activeTabBackgroundDisabledImage: postUpdateTabsBackground,
			
			activeTabBackgroundFocusedColor: {
				post: "_updateTabsBackground",
				value: "#ccc"
			},
			
			activeTabBackgroundFocusedImage: postUpdateTabsBackground,
			
			activeTabBackgroundSelectedColor: {
				post: "_updateTabsBackground",
				value: "#ddd"
			},
			
			activeTabBackgroundSelectedImage: postUpdateTabsBackground,
			
			tabsBackgroundColor: {
				post: "_updateTabsBackground",
				value: "#aaa"
			},
			
			tabsBackgroundImage: postUpdateTabsBackground,
			
			tabsBackgroundDisabledColor: {
				post: "_updateTabsBackground",
				value: "#666"
			},
			
			tabsBackgroundDisabledImage: postUpdateTabsBackground,
			
			tabsBackgroundFocusedColor: {
				post: "_updateTabsBackground",
				value: "#ccc"
			},
			
			tabsBackgroundFocusedImage: postUpdateTabsBackground,
			
			tabsBackgroundSelectedColor: {
				post: "_updateTabsBackground",
				value: "#ddd"
			},
			
			tabsBackgroundSelectedImage: postUpdateTabsBackground,
			
			tabDividerColor: {
				post: function() {
					this._updateDividers();
				},
				value: "#555"
			},
			
			tabDividerWidth: {
				post: function() {
					this._updateDividers();
				},
				value: 1
			},
			
			tabHeight: {
				set: function(value) {
					this._tabBarContainer.height = value;
					return value;
				}
			}
		}
	});

});
