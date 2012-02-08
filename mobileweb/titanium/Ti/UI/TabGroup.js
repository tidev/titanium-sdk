define(["Ti/_/declare", "Ti/_/css", "Ti/_/UI/SuperView"], function(declare, css, SuperView) {

	var is = require.is;

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function(args){
			// Create the tab bar
			this.add(this._tabBarContainer = Ti.UI.createView({
				width: "100%",
				height: "10%",
				layout: "horizontal",
				top: 0,
				left: 0
			}));

			// Create the tab window container
			this.add(this._tabContentContainer = Ti.UI.createView({
				width: "100%",
				height: "90%",
				left: 0,
				top: "10%"
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
				css.remove(prev.domNode, "TiActiveTab");
				this._tabContentContainer.remove(prev["window"]);
			}

			css.add(tab.domNode, "TiActiveTab");
			tab.active = true;

			this._activeTab = tab;
			this._tabContentContainer.add(tab["window"]);
			this._state = {
				index: tabs.indexOf(tab),
				previousIndex: prev ? tabs.indexOf(prev) : -1,
				previousTab: prev,
				tab: tab
			};
		},

		_setTabBarWidths: function(tabs) {
			var tabWidth = (100 / tabs.length) + "%";
			for (var i in tabs) {
				tabs[i]._tabWidth = tabWidth;
			}
		},

		_defaultWidth: "100%",

		_defaultHeight: "100%",

		properties: {
			activeTab: {
				set: function(value) {
					if (is(value, "Number")) {
						if (!value in this.tabs) {
							return;
						}
						value = this.tabs[value];
					}

					this._activateTab(value);
					return value;
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
				}
			}
		}
	});

});
