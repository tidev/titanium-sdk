Ti._5.createClass('Titanium.UI.Tab', function(args){
	args = require.mix({
		height: "100%",
		width: "100%"
	}, args);

	var obj = this,
		_icon = null,
		_title = null,
		_titleid = null,
		_window = null;

	// Interfaces
	Ti._5.DOMView(obj, 'div', args, 'Tab');
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	obj._header = document.createElement("td");
	obj._header.className = 'tabHeader';
	obj._header.onclick = function(){
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
	obj._tabGroup = null;

	var _oldShow = obj.show; // WARNING: this may cause problems
	obj.show = function(){
		_oldShow();
		if(_window){
			_window.show();
		}
		Ti.UI.currentTab = obj;
	};

	var _oldHide = obj.hide; // WARNING: this may cause problems
	obj.hide = function(){
		_oldHide();
		if(_window){
			_window.hide();
		}
		if(Ti.UI.currentTab == obj){
			Ti.UI.currentTab = null;
		}
	};

	obj.open = function(win, args){
		win.open(args);
	};

	// Properties
	Ti._5.prop(obj, 'badge');

	Ti._5.prop(obj, 'icon', {
		get: function(){return _icon;},
		set: function(val){
			if(val == null || val == ''){
				// remove icon
				obj._header.style.backgroundImage = '';
			} else {
				obj._header.style.backgroundImage = 'url(' + Ti._5.getAbsolutePath(val) + ')';
			}
			_icon = val;
		}
	});

	Ti._5.prop(obj, 'title', {
		get: function(){return _title;},
		set: function(val){
			obj._header.innerHTML = _title = val;
		}
	});

	Ti._5.prop(obj, 'titleid', {
		get: function(){return _titleid;},
		set: function(val){
			obj.title = L(_titleid = val);
		}
	});

	Ti._5.prop(obj, 'window', {
		get: function(){return _window;},
		set: function(val){
			_window = val;
			obj.add(_window);
			_window;
		}
	});

	Ti._5.prop(obj, 'win', {
		get: function(){return obj.window;},
		set: function(val){obj.window = val;}
	});

	require.mix(this, args);
});
