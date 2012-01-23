define("Ti/UI/TabGroup", ["Ti/_/declare", "Ti/_/UI/SuperView"], function(declare, SuperView) {
		
	var undef,
		is = require.is;

	return declare("Ti.UI.TabGroup", SuperView, {
		
		constructor: function(args){
			
			// Create the tab bar
			this._tabBarContainer = Ti.UI.createView({
				width: "100%",
				height: "10%",
				layout: "horizontal",
				top: 0,
				left: 0
			});
			this.add(this._tabBarContainer);
			
			// Create the tab window container
			this._tabContentContainer = Ti.UI.createView({
				width: "100%",
				height: "90%",
				left: 0,
				top: "10%"
			});
			this.add(this._tabContentContainer);
		},

		addTab: function(tab) {
			
			// Initialize the tabs, if necessary
			if(!this.tabs) {
				this.tabs = [];
			}
			
			// Add the tab to the list and tab bar
			var tabs = this.tabs;
			tabs.push(tab);
			tab._tabGroup = this;
			this._tabBarContainer.add(tab);
			this._setTabBarWidths(tabs);
			
			// Set the active tab if there are currently no tabs
			if(tabs.length == 1) {
				this.properties.activeTab = tab;
			}
		},
		
		removeTab: function(tab) {
			
			// Remove the tab from the list
			var tabs = this.tabs,
				idx = this.tabs.indexOf(tab);
			if (idx === -1) {
				return;
			}
			tabs.splice(idx,1);
			
			// Remove the tab from the tab bar and recalculate the tab sizes
			this._tabBarContainer.remove(tab);
			this._setTabBarWidths(tabs);
			
			// Update the active tab, if necessary
			if (tab === this._activeTab) {
				this._activateTab(tabs[0]);
			}
		},
		
		_activateTab: function(tab) {
			if(this._activeTab) {
				this._activeTab.active = false;
				this._activeTab.domNode.className = this._activeTab.domNode.className.replace("TiActiveTab","");
				this._tabContentContainer.remove(this._activeTab["window"]);
			}
			if(tab) {
				this._activeTab = tab;
				tab.domNode.className += " TiActiveTab";
				tab.active = true;
				this._tabContentContainer.add(tab["window"]);
			}
		},
		
		_setTabBarWidths: function(tabs) {
			var tabWidth = (100 / tabs.length) + "%";
			for (var i in tabs) {
				tabs[i]._tabWidth = tabWidth;
			}
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",
		_activeTab: undef,

		properties: {
			activeTab: {
				set: function(value) {
					if (is(value,"Number")) {
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
					if(!is(value,"Array")) {
						return;
					}
					var tabBarContainer = this._tabBarContainer;
					for(var i in oldValue) {
						tabBarContainer.remove(oldValue[i]);
					}
					this._setTabBarWidths(value);
					this._activateTab(value[0]);
					for(var i in value) {
						tabBarContainer.add(value[i]);
					}
					return value;
				}
			}
		}
	});

});
