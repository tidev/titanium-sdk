Ti._5.createClass('Titanium.UI.TabGroup', function(args){
	var obj = this;
	var _activeTabIndex = null;
	
	// Set defaults
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	args.width = args.width || '100%';
	args.height = args.height || '100%';

	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'TabGroup');
	Ti._5.Screen(this, args);
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// create DOM sctructure for the instance
	// lets store tab headers as table - this is much more easy to resize and rewrap rather then do it manually
	var _headerTable = document.createElement("table");
	_headerTable.cellSpacing = 0;
	_headerTable.className = "tabsHeaders";
	var _tabsHeaders = document.createElement("tbody");
	_headerTable.appendChild(_tabsHeaders);
	var _tabsContent = document.createElement("div");
	_tabsContent.className = "tabsContent";
	_tabsContent.style.width = "100%";
	_tabsContent.style.height = "100%";
	this.dom.appendChild(_headerTable);
	this.dom.appendChild(_tabsContent);

	// Properties
	Object.defineProperty(this, 'activeTab', {
		get: function(){return obj._tabs[_activeTabIndex];},
		set: function(val){obj.setActiveTab(val);}
	});

	var _allowUserCustomization = null;
	Object.defineProperty(this, 'allowUserCustomization', {
		get: function(){return _allowUserCustomization;},
		set: function(val){return _allowUserCustomization = val;}
	});

	var _barColor = null;
	Object.defineProperty(this, 'barColor', {
		get: function(){return _barColor;},
		set: function(val){
			_barColor = val;
			_tabsHeaders.style.backgroundColor = _barColor;
		}
	});

	// private internal property
	this._tabs = [];
	Object.defineProperty(this, 'tabs', {
		get: function(){
			var res = [];
			for(var ii = 0; ii < obj._tabs.length; ii++){
				res.push(obj._tabs[ii]);
			}
			return res;
		}
	});

	var _editButtonTitle = null;
	Object.defineProperty(this, 'editButtonTitle', {
		get: function(){return _editButtonTitle;},
		set: function(val){return _editButtonTitle = val;}
	});

	// Methods
	this.addTab = function(tab){
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

	this.removeTab = function(tabObj){
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
						// this was last tab - open previous
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
		tab._header.className = tab._header.className.replace(/\bactiveTabHeader\b/, '');
		tab.dom.style.display = 'none';
		tab.hide();
	};

	var _showTab = function(tabIndex){
		if(tabIndex == null && tabIndex > obj._tabs.length){
			return;
		}

		var tab = obj._tabs[tabIndex];
		tab._header.className += ' activeTabHeader';
		tab.dom.style.display = '';
		tab.show();
	};

	this.setActiveTab = function(indexOrObject){
		if(typeof indexOrObject === 'object'){
			for(var ii = obj._tabs.length - 1; ii >= 0; ii--){
				if(obj._tabs[ii] === indexOrObject){
					obj.setActiveTab(ii);
					return;
				}
			}

			// tab not found - add new
			obj.addTab(indexOrObject);
			obj.setActiveTab(obj._tabs.length - 1);
			return;
		}
		if(_activeTabIndex != null){
			obj.fireEvent('blur', {
				globalPoint: {x: null, y: null},
				source: obj,
				type: 'blur',
				x: null,
				y: null,
				previousIndex: _activeTabIndex,
				previousTab: obj._tabs[_activeTabIndex],
				tab: obj._tabs[indexOrObject]
			});
			_hideTab(_activeTabIndex);
		}

		obj.fireEvent('focus', {
			globalPoint: {x: null, y: null},
			source: obj,
			type: 'blur',
			x: null,
			y: null,
			previousIndex: _activeTabIndex,
			previousTab: _activeTabIndex != null && _activeTabIndex < obj._tabs.length ? obj._tabs[_activeTabIndex] : null,
			tab: obj._tabs[indexOrObject]
		});
		_activeTabIndex = indexOrObject;
		_showTab(_activeTabIndex);
	};

	this.open = function(){
		obj.screen_open();
		if(_activeTabIndex > obj.tabs.length){
			_activeTabIndex = null;
		}

		Ti.UI.currentTabGroup = obj;
		obj.show();
		if(obj._tabs.length > 0){
			this.setActiveTab(_activeTabIndex || 0);
		}

		obj.fireEvent('open', {
			globalPoint: {x: null, y: null},
			source: obj,
			type: 'open',
			x: null,
			y: null
		});
	};

	this.close = function(){
		obj.screen_close();
		this.hide();
		if(Ti.UI.currentTabGroup == obj){
			Ti.UI.currentTabGroup = null;
		}

		obj.fireEvent('close', {
			globalPoint: {x: null, y: null},
			source: obj,
			type: 'close',
			x: null,
			y: null
		});
	};

	Ti._5.presetUserDefinedElements(this, args);
});
