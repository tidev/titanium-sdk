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
	var _badge = null;
	Object.defineProperty(this, 'badge', {
		get: function(){return _badge;},
		set: function(val){return _badge = val;}
	});

	var _icon = null;
	Object.defineProperty(this, 'icon', {
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
	Object.defineProperty(this, 'title', {
		get: function(){return _title;},
		set: function(val){
			obj._header.innerHTML = val;
			return _title = val;
		}
	});

	var _titleid = null;
	Object.defineProperty(this, 'titleid', {
		get: function(){return _titleid;},
		set: function(val){
			obj.title = L(val);
			return _titleid = val;
		}
	});

	var _window = null;
	Object.defineProperty(this, 'window', {
		get: function(){return _window;},
		set: function(val){
			_window = val;
			obj.add(_window);
		}
	});

	Object.defineProperty(this, 'win', {
		get: function(){return obj.window;},
		set: function(val){return obj.window = val;}
	});

	Ti._5.preset(this, ['window', 'win', 'title', 'titleid', 'icon', 'badge'], args);
	Ti._5.presetUserDefinedElements(this, args);
});
