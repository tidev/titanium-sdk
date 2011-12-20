(function(oParentNamespace) {

	var lastActive,
		isBack,
		screens = [];

	window.onpopstate = function(evt) {
		if(evt && evt.state && evt.state.screenIndex != null){
			var win = screens[evt.state.screenIndex];
			// for opening HTML windows
			if (win) {
				isBack = true;
				win.screen_open();
			}
		}
	};

	// Create object
	oParentNamespace.Screen = function(obj, args) {
		var idx = screens.length;
		screens.push(obj);

		obj.screen_open = function() {
			// there are active window, this is not the same window and current window is not window inside other window
			lastActive && lastActive !== obj && !obj.parent && lastActive.hide();
			lastActive = obj;

			// this is top level window - it has no parent - need to add it into DOM
			!obj.parent && Ti._5.containerDiv.appendChild(obj.dom);

			obj.show();

			if(isBack){
				isBack = false;
			} else {
				// leave record in History object
				window.history.pushState({ screenIndex: idx }, "", "");
			}
			obj.fireEvent('screen_open');
		};

		obj.screen_close = function() {
			obj.fireEvent('screen_close');
			Ti._5.containerDiv.removeChild(obj.dom);
			// go prev state
			window.history.go(-1);
		};
	};

})(Ti._5);
