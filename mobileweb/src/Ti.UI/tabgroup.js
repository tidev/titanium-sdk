Ti._5.createClass("Titanium.UI.TabGroup", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this;
		domNode = Ti._5.DOMView(obj, "div", args, "TabGroup"),
		_activeTabIndex = null;

	// Interfaces
	Ti._5.Screen(obj, args);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	domNode.position = "absolute";

	// create DOM sctructure for the instance
	// lets store tab headers as table - obj is much more easy to resize and rewrap rather then do it manually
	var _headerTable = document.createElement("table");
	_headerTable.cellSpacing = 0;
	_headerTable.className = "tabsHeaders";
	var _tabsHeaders = document.createElement("tbody");
	_headerTable.appendChild(_tabsHeaders);
	var _tabsContent = document.createElement("div");
	_tabsContent.className = "tabsContent";
	_tabsContent.style.width = "100%";
	_tabsContent.style.height = "90%";
	_tabsContent.style.position = "absolute";
	domNode.appendChild(_headerTable);
	domNode.appendChild(_tabsContent);

	// Properties
	Ti._5.prop(obj, "activeTab", {
		get: function(){return obj._tabs[_activeTabIndex];},
		set: function(val){obj.setActiveTab(val);}
	});

	Ti._5.prop(obj, "allowUserCustomization");

	var _barColor = null;
	Ti._5.prop(obj, "barColor", {
		get: function(){return _barColor;},
		set: function(val){
			_tabsHeaders.style.backgroundColor = _barColor = val;
		}
	});

	// private internal property
	obj._tabs = [];
	Ti._5.prop(obj, "tabs", {
		get: function(){
			var res = [];
			for(var ii = 0; ii < obj._tabs.length; ii++){
				res.push(obj._tabs[ii]);
			}
			return res;
		}
	});

	Ti._5.prop(obj, "editButtonTitle");

	// Methods
	obj.addTab = function(tab){
		_tabsHeaders.appendChild(tab._header);
		_tabsContent.appendChild(tab.dom);

		obj._tabs.push(tab);
		tab._tabGroup = obj;

		if(_activeTabIndex == null){
			obj.setActiveTab(obj._tabs.length - 1);
		} else {
			tab.hide();
		}
		tab.render();
	};

	obj.removeTab = function(tabObj){
		for(var ii = obj._tabs.length - 1; ii >= 0; ii--){
			var tab = obj._tabs[ii];
			if(tab == tabObj){
				obj._tabs.splice(ii, 1);
				_tabsHeaders.removeChild(tab._header);
				_tabsContent.removeChild(tab.dom);
				tab._tabGroup = null;

				if(_activeTabIndex == ii){
					// removing current opened tab
					_activeTabIndex = null;

					// after removing tab array length is decremented
					if(ii == obj._tabs.length){
						// obj was last tab - open previous
						obj.setActiveTab(obj._tabs.length - 1);
					} else {
						// show tab after removed one
						obj.setActiveTab(ii);
					}
				} else if(_activeTabIndex > ii) {
					_activeTabIndex--;
				}
				break;
			}
		}
	};

	var _hideTab = function(tabIndex){
		if(tabIndex == null && tabIndex > obj._tabs.length){
			return;
		}

		var tab = obj._tabs[tabIndex];
		tab._header.className = tab._header.className.replace(/\bactiveTabHeader\b/, "");
		tab.dom.style.display = "none";
		tab.hide();
	};

	var _showTab = function(tabIndex){
		if(tabIndex == null && tabIndex > obj._tabs.length){
			return;
		}

		var tab = obj._tabs[tabIndex];
		tab._header.className += " activeTabHeader";
		tab.dom.style.display = "";
		tab.show();
	};

	obj.setActiveTab = function(indexOrObject){
		if(typeof indexOrObject === "object"){
			for(var ii = obj._tabs.length - 1; ii >= 0; ii--){
				if(obj._tabs[ii] === indexOrObject){
					obj.setActiveTab(ii);
					return;
				}
			}

			// tab not found - add new
			obj.addTab(indexOrObject);
			obj.setActiveTab(obj._tabs.length - 1);
		} else if (indexOrObject !== _activeTabIndex) {
			if(_activeTabIndex != null){
				obj.fireEvent("blur", {
					globalPoint: {x: null, y: null},
					x: null,
					y: null,
					previousIndex: _activeTabIndex,
					previousTab: obj._tabs[_activeTabIndex],
					tab: obj._tabs[indexOrObject]
				});
				_hideTab(_activeTabIndex);
			}

			obj.fireEvent("focus", {
				globalPoint: {x: null, y: null},
				x: null,
				y: null,
				previousIndex: _activeTabIndex,
				previousTab: _activeTabIndex != null && _activeTabIndex < obj._tabs.length ? obj._tabs[_activeTabIndex] : null,
				tab: obj._tabs[indexOrObject]
			});
			_activeTabIndex = indexOrObject;
			_showTab(_activeTabIndex);
		}
	};

	obj.open = function(){
		obj.screen_open();
		if(_activeTabIndex > obj.tabs.length){
			_activeTabIndex = null;
		}

		Ti.UI.currentTabGroup = obj;
		obj.show();
		if(obj._tabs.length > 0){
			obj.setActiveTab(_activeTabIndex || 0);
		}

		obj.fireEvent("open", {
			globalPoint: {x: null, y: null},
			x: null,
			y: null
		});
	};

	obj.close = function(){
		obj.screen_close();
		obj.hide();
		if(Ti.UI.currentTabGroup == obj){
			Ti.UI.currentTabGroup = null;
		}

		obj.fireEvent("close", {
			globalPoint: {x: null, y: null},
			x: null,
			y: null
		});
	};

	require.mix(obj, args);
});
