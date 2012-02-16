define(["Ti/_/declare", "Ti/_/css", "Ti/_/UI/SuperView", "Ti/UI", "Ti/_/lang"], function(declare, css, SuperView, UI, lang) {

	var is = require.is,
		postUpdateTabsBackground = {
			post: "_updateTabsBackground"
		};

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function(args){
			
			this.layout = "vertical";
			
			// Create the tab bar
			this.add(this._tabBarContainer = UI.createView({
				left: 0,
				right: 0,
				layout: "horizontal"
			}));
			this.tabHeight = "10%";

			// Create the tab window container
			this.add(this._tabContentContainer = UI.createView({
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			}));

			this.tabs = [];
		},

		addTab: function(tab) {
			// Initialize the tabs, if necessary
			this.tabs = this.tabs || [];

			// Add the tab to the list and tab bar
			var tabs = this.tabs;
			tabs.push(tab);
			tab._tabGroup = this;
			this._tabBarContainer.add(tab);
			this._setTabBarWidths(tabs);
			
			// Update the background on the tab
			this._updateTabBackground(tab);

			// Set the active tab if there are currently no tabs
			tabs.length == 1 && (this.properties.activeTab = tab);
		},

		removeTab: function(tab) {
			// Remove the tab from the list
			var tabs = this.tabs,
				idx = this.tabs.indexOf(tab);

			if (idx >= 0) {
				tabs.splice(idx, 1);

				// Remove the tab from the tab bar and recalculate the tab sizes
				this._tabBarContainer.remove(tab);
				this._setTabBarWidths(tabs);

				// Update the active tab, if necessary
				tab === this._activeTab && this._activateTab(tabs[0]);
			}
		},

		_activateTab: function(tab) {
			var tabs = this.tabs,
				prev = this._activeTab;

			if (prev) {
				prev.active = false;
				prev._doBackground();
				this._tabContentContainer.remove(prev["window"]);
			}

			tab.active = true;
			this._activeTab = tab;
			this._tabContentContainer.add(tab["window"]);
			this._state = {
				index: tabs.indexOf(tab),
				previousIndex: prev ? tabs.indexOf(prev) : -1,
				previousTab: prev,
				tab: tab
			};
			this._updateTabsBackground();
		},

		_setTabBarWidths: function(tabs) {
			var tabWidth = (100 / tabs.length) + "%";
			for (var i in tabs) {
				tabs[i]._tabWidth = tabWidth;
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

		_defaultWidth: "100%",

		_defaultHeight: "100%",

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
				set: function(value, oldValue) {
					var i,
						tabBarContainer = this._tabBarContainer;

					if (!is(value, "Array")) {
						return;
					}

					for (i in oldValue) {
						tabBarContainer.remove(oldValue[i]);
					}

					if (value.length) {
						this._setTabBarWidths(value);
						this._activateTab(value[0]);
						for (i in value) {
							tabBarContainer.add(value[i]);
						}
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
				get: function(value) {
					console.debug('Property "Titanium.UI.TabGroup#.tabDividerColor" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TabGroup#.tabDividerColor" is not implemented yet.');
					return value;
				}
			},
			
			tabDividerWidth: {
				get: function(value) {
					console.debug('Property "Titanium.UI.TabGroup#.tabDividerWidth" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TabGroup#.tabDividerWidth" is not implemented yet.');
					return value;
				}
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
