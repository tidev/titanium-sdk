define(["Ti/_/declare", "Ti/_/UI/SuperView", "Ti/UI/View", "Ti/UI", "Ti/_/lang"], 
	function(declare, SuperView, View, UI, lang) {

	var is = require.is,
		UI_FILL = UI.FILL,
		postUpdateTabsBackground = {
			post: "_updateTabsBackground"
		};

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function(args) {
			var self = this,
				tabsAtBottom = self.__values__.constants.tabsAtBottom = lang.val(args && args.tabsAtBottom, self.__values__.constants.tabsAtBottom),
				TabBarContainer = declare(View, {
					// set a declared class here so that it's not defined globally, yet we still are able
					// to set a widget id and css class on the dom node.
					declaredClass: "Ti.UI.TabBarContainer"
				});

			// Create the tab bar
			self._tabBarContainer = new TabBarContainer({
				width: UI_FILL,
				layout: UI._LAYOUT_CONSTRAINING_HORIZONTAL
			});
			self.tabHeight = 75;

			// Create the tab window container
			self._tabContentContainer = UI.createView({
				width: UI_FILL,
				height: UI_FILL
			});

			// Add the windows ordered such that they respect tabsAtBottom
			self.layout = UI._LAYOUT_CONSTRAINING_VERTICAL;
			self.tabs = [];
			self.tabsAtBottom = lang.val(args && args.tabsAtBottom, true);
		},

		addTab: function(tab) {
			// Initialize the tabs, if necessary
			var tabs = this.tabs;
			tabs.push(tab);
			tab._setTabGroup(this);

			// Set the active tab if there are currently no tabs, otherwise add a divider
			if (tabs.length === 1) {
				this.activeTab = tab;
			} else {
				this._tabBarContainer._add(this._createTabDivider());
			}

			// Add the tab to the UI
			this._tabBarContainer._add(tab);

			// Update the background on the tab
			this._updateTabBackground(tab);

			// Publish the tab
			this._publish(tab);
		},

		_addTabContents: function(contents) {
			this._tabContentContainer._add(contents);
		},

		_removeTabContents: function(contents) {
			this._tabContentContainer._remove(contents);
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

				// Unpublish the tab
				this._unpublish(tab);
			}
		},

		_createTabDivider: function() {
			return UI.createView({
				width: this.tabDividerWidth,
				height: UI_FILL,
				backgroundColor: this.tabDividerColor
			});
		},

		close: function() {
			this._previousTab = null;
			SuperView.prototype.close.call(this);
		},

		_getEventData: function() {
			var tabs = this.tabs,
				previousTab = this._previousTab,
				activeTab = this._activeTab;

			return {
				index: activeTab && tabs.indexOf(activeTab),
				previousIndex: previousTab && tabs.indexOf(previousTab),
				tab: activeTab,
				previousTab: previousTab
			};
		},

		_handleFocusEvent: function() {
			// TabGroup was just opened or a window was closed and the TabGroup regained focus

			var previousTab = this._previousTab,
				activeTab = this._activeTab;

			previousTab && previousTab._blur();

			if (!this._focused && this._opened) {
				this.fireEvent("focus", this._getEventData());
				activeTab && activeTab._focus();
			}
			this._focused = 1;
		},

		_handleBlurEvent: function(blurTabs) {
			// TabGroup is about to be closed or a window was opened

			// blurTabs: 1) blur all tabs, 2) blur active tab only
			if (blurTabs) {
				var i = 0,
					len = this.tabs.length,
					tab;

				while (i < len) {
					tab = this.tabs[i++];
					(blurTabs !== 2 || tab === this._activeTab) && tab._blur();
				}

				this._previousTab = void 0;
			}

			this._focused && this._opened && this.fireEvent("blur", this._getEventData());
			this._focused = 0;
		},

		_activateTab: function(activeTab) {
			var tabs = this.tabs,
				previousTab = this._activeTab;

			if (previousTab !== activeTab) {
				if (this._previousTab = previousTab) {
					previousTab.active = false;
					previousTab._doBackground();
				}

				UI.currentTab = this._activeTab = activeTab;
				activeTab.active = true;

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
				i = 0,
				l = tabs.length;
			while (i < l) {
				this._updateTabBackground(tabs[i++]);
			}
		},

		_updateDividers: function(){
			var tabs = this._tabBarContainer._children,
				i = 1;
			for(; i < tabs.length; i += 2) {
				var tab = tabs[i];
				tab.width = this.tabDividerWidth;
				tab.backgroundColor = this.tabDividerColor;
			}
		},

		_defaultWidth: UI_FILL,

		_defaultHeight: UI_FILL,

		constants: {
			bubbleParent: false
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
					if (is(value, "Array")) {
						var i,
							tabBarContainer = this._tabBarContainer;

						tabBarContainer._removeAllChildren();

						if (value.length) {
							for (i = 0; i < value.length; i++) {
								value[i]._setTabGroup(this);
								i == 0 && this._activateTab(this.activeTab = value[i]);
								this._publish(value[i]);
								i && tabBarContainer._add(this._createTabDivider());
								tabBarContainer._add(value[i]);
							}
						}

						return value;
					}
				},
				post: "_updateTabsBackground"
			},

			tabsAtBottom: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						var tabContentContainer = this._tabContentContainer,
							tabBarContainer = this._tabBarContainer;

						this._activeTab && this._activeTab._setNavBarAtTop(value);

						this._remove(tabContentContainer);
						this._remove(tabBarContainer);

						if (value) {
							this._add(tabContentContainer);
							this._add(tabBarContainer);
						} else {
							this._add(tabBarContainer);
							this._add(tabContentContainer);
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
				post: "_updateDividers",
				value: "#555"
			},
			
			tabDividerWidth: {
				post: "_updateDividers",
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
