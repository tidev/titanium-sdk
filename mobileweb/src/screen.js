(function(oParentNamespace) {
	var _lastActive;
	var _isBack = false;
	var _screens = [];
	
	window.onpopstate = function(event){
		if(event && event.state && event.state.screenIndex != null){
			var win = _screens[event.state.screenIndex];
			// for opening HTML windows
			if (!win) {
				return;
			}
			_isBack = true;
			win.screen_open();
		}
	};

	// Create object
	oParentNamespace.Screen = function(obj, args) {
		var _screenIndex = _screens.length;
		_screens[_screenIndex] = obj;
		obj.screen_open = function(){
			// there are active window, this is not the same window and current window is not window inside other window
			if(_lastActive != null && _lastActive != obj && obj.parent == null){
				_lastActive.hide();
			}

			// this is top level window - it has no parent - need to add it into DOM
			if(obj.parent == null) {
				document.body.appendChild(obj.dom);
			}

			obj.show();
			_lastActive = obj;

			if(_isBack){
				_isBack = false;
			} else {
				// leave record in History object
				window.history.pushState({screenIndex: _screenIndex}, "", "");
			}
			obj.fireEvent('screen_open');
		};

		obj.screen_close = function(){
			obj.fireEvent('screen_close');
			document.body.removeChild(obj.dom);
			// go prev state
			window.history.go(-1);
		};
	};
})(Ti._5);
