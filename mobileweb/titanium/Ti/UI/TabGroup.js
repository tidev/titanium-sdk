define(["Ti/_/declare", "Ti/_/UI/SuperView", "Ti/UI/View", "Ti/UI", "Ti/_/lang"], 
	function(declare, SuperView, View, UI, lang) {

	var is = require.is,
		UI_FILL = UI.FILL,
		postUpdateTabsBackground = {
			post: "_updateTabsBackground"
		};

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function(args){
			var self = this,
				tabsAtBottom = self.constants.tabsAtBottom = lang.val(args && args.tabsAtBottom, self.constants.tabsAtBottom);
				TabBarContainer = declare(View, {
					// set a declared class here so that it's not defined globally, yet we still are able
					// to set a widget id and css class on the dom node.
					declaredClass: "Ti.UI.TabBarContainer",

					_doLayout: function(params) {
						var tabs = self.tabs,
							i = 0,
							numTabs = tabs.length - 1,
							totalDividerWidth = numTabs * self.tabDividerWidth,
							tabWidth = Math.floor((params.boundingSize.width - totalDividerWidth) / (numTabs + 1));

						while (i < numTabs) {
							tabs[i++]._defaultWidth = tabWidth;
						}

						// Make the last tab consume the remaining space. Fractional widths look really bad in tabs.
						tabs[i] && (tabs[i]._defaultWidth = params.boundingSize.width - totalDividerWidth - tabWidth * numTabs);

						return View.prototype._doLayout.apply(this, arguments)
					}
				});

			// Create the tab bar
			self._tabBarContainer = new TabBarContainer({
				width: UI_FILL,
				layout: "horizontal"
			});
			self.tabHeight = 75;

			// Create the tab window container
			self._tabContentContainer = UI.createView({
				width: UI_FILL,
				height: UI_FILL
			});

			// Add the windows ordered such that they respect tabsAtBottom
			self.layout = "vertical";
			self.tabs = [];
			self.tabsAtBottom = lang.val(args && args.tabsAtBottom, true);
		},

		addTab: function(tab) {
			// Initialize the tabs, if necessary
			var tabs = this.tabs = this.tabs || [];
			tabs.push(tab);
			tab._setTabGroup(this);

			// Set the active tab if there are currently no tabs, otherwise add a divider
			if (tabs.length === 1) {
				this.activeTab = tab;
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
				height: UI_FILL,
				backgroundColor: this.tabDividerColor
			});
		},

		_handleFocusBlurEvent: function(type) {
			var previousTab = this._previousTab,
				activeTab = this._activeTab,
				win = activeTab && activeTab.window,
				tabs = this.tabs,
				data = {
					index: tabs.indexOf(activeTab),
					previousIndex: tabs.indexOf(previousTab),
					tab: activeTab,
					previousTab: previousTab
				};

			if (previousTab) {
				previousTab.window && previousTab.window._handleBlurEvent();
				previousTab.fireEvent("blur", data);
			}

			SuperView.prototype["_handle" + type + "Event"].call(this, data);

			if (win) {
				win._opened || win.fireEvent("open");
				win._opened = 1;
				win._handleFocusEvent();
			}

			activeTab && activeTab.fireEvent("focus", data);
		},

		_handleFocusEvent: function() {
			this._opened && this._handleFocusBlurEvent("Focus");
		},

		_handleBlurEvent: function() {
			this._handleFocusBlurEvent("Blur");
		},

		_activateTab: function(tab) {
			var tabs = this.tabs,
				prev = this._activeTab;

			if (prev !== tab) {
				if (this._previousTab = prev) {
					prev.active = false;
					prev._doBackground();
					prev._tabNavigationGroup && this._tabContentContainer.remove(prev._tabNavigationGroup);
				}

				UI.currentTab = this._activeTab = tab;
				tab.active = true;

				if (tab._tabNavigationGroup) {
					tab._tabNavigationGroup.navBarAtTop = this.tabsAtBottom;
					tab._tabNavigationGroup._updateTitle();
					this._tabContentContainer.add(tab._tabNavigationGroup);
				}

				this._handleFocusEvent();
				this._updateTabsBackground();
			}
		},

		_updateTabBackground: function(tab) {
			var prefix = tab.active ? "activeTab" : "tabs";

			["", "Focused", "Disabled", "Selected"].forEach(function(s) {
				s = "Background" + s;
				tab["_default" + s + "Color"] = this[prefix + s + "Color"];
				tab["_default" + s + "Image"] = this[prefix + s + "Image"];
			}, this);

			tab._doBackground();
		},

		_updateTabsBackground: function() {
			var tabs = this.tabs,
				i = 0;
			for (; i < tabs.length; i++) {
				this._updateTabBackground(tabs[i]);
			}
		},

		_updateDividers: function(){
			var tabs = this._tabBarContainer.children,
				i = 1;
			for(; i < tabs.length; i += 2) {
				var tab = tabs[i];
				tab.width = this.tabDividerWidth;
				tab.backgroundColor = this.tabDividerColor;
			}
		},

		_defaultWidth: UI_FILL,

		_defaultHeight: UI_FILL,

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
					if (is(value, "Array")) {
						var i,
							tabBarContainer = this._tabBarContainer;

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
					}
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
