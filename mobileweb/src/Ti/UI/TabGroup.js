define("Ti/UI/TabGroup", ["Ti/_/declare", "Ti/_/UI/SuperView"], function(declare, SuperView) {

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function() {
			this._tabs = [];
			this._activeTabIndex = -1;
		},

		properties: {
			activeTab: {
				get: function() {
					return this._activeTabIndex !== -1 ? this._tabs[this._activeTabIndex] : null;
				},
				set: function(value) {
					// TODO: this.setActiveTab(value);
				}
			},

			barColor: {
				set: function(value){
					//_tabsHeaders.style.backgroundColor = _barColor = value;
					return value;
				}
			},

			tabs: null
		},

		constants: {
			tabs: function() {
				return [].concat(this._tabs);
			}
		}

	});

});
