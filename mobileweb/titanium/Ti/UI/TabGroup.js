define(["Ti/_/declare", "Ti/_/css", "Ti/_/UI/SuperView", "Ti/UI/View", "Ti/UI", "Ti/_/lang", "Ti/_/style"], 
	function(declare, css, SuperView, View, UI, lang, style) {

	var is = require.is,
		setStyle = style.set,
		postUpdateTabsBackground = {
			post: "_updateTabsBackground"
		};

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function(args){
			
			var self = this,
				tabsAtBottom = self.constants.tabsAtBottom = lang.val(args && args.tabsAtBottom, self.constants.tabsAtBottom);
			
			// Create the tabBarContainer class
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
					tabs[i] && (tabs[i]._defaultWidth = params.boundingSize.width - totalDividerWidth - tabWidth * (numTabs - 1));
					
					return View.prototype._doLayout.apply(this,arguments)
				}
			});
			
			// Create the tab bar
			self._tabBarContainer = new TabBarContainer({
				width: UI.FILL,
				layout: "horizontal"
			});
			self.tabHeight = 75;

			// Create the tab window container
			self._tabContentContainer = UI.createView({
				width: UI.FILL,
				height: UI.FILL
			});
			
			// Add the windows ordered such that they respect tabsAtBottom
			self.layout = "vertical";
			self.tabs = [];
			self.tabsAtBottom = args ? lang.val(args.tabsAtBottom, true) : true;
		},

		addTab: function(tab) {
			// Initialize the tabs, if necessary
			var tabs = this.tabs = this.tabs || [];
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
		
		_handleFocusBlurEvent: function(type) {
			var previousTab = this._previousTab,
				activeTab = this._activeTab,
				tabs = this.tabs,
				data = {
					index: tabs.indexOf(activeTab),
					previousIndex: tabs.indexOf(previousTab),
					tab: activeTab,
					previousTab: previousTab
				};
			if (previousTab) {
				previousTab.window && previousTab.window._handleBlurEvent();
				previousTab.fireEvent("blur",data);
			}
			SuperView.prototype["_handle" + type + "Event"].call(this,data);
			activeTab.window && activeTab.window._handleFocusEvent();
			activeTab.fireEvent("focus",data);
		},
		
		_handleFocusEvent: function() {
			this._handleFocusBlurEvent("Focus");
		},
		
		_handleBlurEvent: function() {
			this._handleFocusBlurEvent("Blur");
		},

		_activateTab: function(tab) {
			var tabs = this.tabs,
				prev = this._previousTab = this._activeTab;
			
			if (prev !== tab) {
				if (prev) {
					prev.active = false;
					prev._doBackground();
					prev._tabNavigationGroup && this._tabContentContainer.remove(prev._tabNavigationGroup);
				}
	
				tab.active = true;
				tab._tabNavigationGroup && (tab._tabNavigationGroup.navBarAtTop = this.tabsAtBottom);
				this._activeTab = tab;
				UI.currentTab = tab;
				tab._tabNavigationGroup && this._tabContentContainer.add(tab._tabNavigationGroup);
				this._handleFocusEvent();
				this._updateTabsBackground();
			}
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
			
			tabsAtBottom: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						
						this._activeTab && this._activeTab._tabNavigationGroup && (this._activeTab._tabNavigationGroup.navBarAtTop = value);
						
						var tabContentContainer = this._tabContentContainer,
							tabBarContainer = this._tabBarContainer;
						this.remove(tabContentContainer);
						this.remove(tabBarContainer);
						
						if (value) {
							this.add(tabContentContainer);
							this.add(tabBarContainer);
						} else {
							this.add(tabBarContainer);
							this.add(tabContentContainer);
						}
					}
					return value;
				}
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
