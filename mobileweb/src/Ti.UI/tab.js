Ti._5.createClass('Titanium.UI.Tab', function(args){
	var obj = this;

	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'Tab');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	this._header = document.createElement("td");
	this._header.className = 'tabHeader';
	this._header.onclick = function(){
		if(obj._tabGroup == null){
			return;
		}
		
		for(var ii = obj._tabGroup._tabs.length - 1; ii >= 0; ii--){
			if(obj._tabGroup._tabs[ii] === obj){
				obj._tabGroup.setActiveTab(ii);
				break;
			}
		}
	};
	
	// reference to tabGroup object that holds current tab
	this._tabGroup = null;

	var _oldShow = this.show;
	this.show = function(){
		_oldShow();
		if(_window){
			_window.show();
		}
		Ti.UI.currentTab = obj;
	};

	var _oldHide = this.hide;
	this.hide = function(){
		_oldHide();
		if(_window){
			_window.hide();
		}
		if(Ti.UI.currentTab == obj){
			Ti.UI.currentTab = null;
		}
	};

	this.open = function(win, args){
		win.open(args);
	};

	// Properties
	Ti._5.prop(this, 'badge');

	var _icon = null;
	Ti._5.prop(this, 'icon', {
		get: function(){return _icon;},
		set: function(val){
			if(val == null || val == ''){
				// remove icon
				obj._header.style.backgroundImage = '';
			} else {
				obj._header.style.backgroundImage = 'url(' + Ti._5.getAbsolutePath(val) + ')';
			}
			return _icon = val;
		}
	});

	var _title = null;
	Ti._5.prop(this, 'title', {
		get: function(){return _title;},
		set: function(val){
			return obj._header.innerHTML = _title = val;
		}
	});

	var _titleid = null;
	Ti._5.prop(this, 'titleid', {
		get: function(){return _titleid;},
		set: function(val){
			return obj.title = L(_titleid = val);
		}
	});

	var _window = null;
	Ti._5.prop(this, 'window', {
		get: function(){return _window;},
		set: function(val){
			_window = val;
			obj.add(_window);
			return _window;
		}
	});

	Ti._5.prop(this, 'win', {
		get: function(){return obj.window;},
		set: function(val){return obj.window = val;}
	});

	require.mix(this, args);
});
