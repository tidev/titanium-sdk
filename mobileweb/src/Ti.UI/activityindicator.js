Ti._5.createClass('Titanium.UI.ActivityIndicator', function(args){
	var obj = this;
	args = Ti._5.extend({}, args);
	args['visible'] = args['visible'] || false;
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'ActivityIndicator');
	Ti._5.Positionable(this, args);
	Ti._5.Styleable(this, args);
	
	// Properties
	Object.defineProperty(this, 'color', {
		get: function(){return obj.dom.style.color;},
		set: function(val) {
			obj.dom.style.color = val;
		}
	});
	
	var _message = null;
	Object.defineProperty(this, 'message', {
		get: function(){return _message;},
		set: function(val){_message = val; obj.dom.innerHTML = _message;}
	});

	var _messageid = null;
	Object.defineProperty(this, 'messageid', {
		get: function(){return _messageid;},
		set: function(val){return _messageid = val;}
	});

	var _style = null;
	Object.defineProperty(this, 'style', {
		get: function(){return _style;},
		set: function(val){
			_style = val;
			if (Titanium.UI.iPhone) {
				obj.dom.className = obj.dom.className.replace(/\bActivityIndicator_(BIG|DARK)\b/g, '');

				switch (_style) {
					case Titanium.UI.iPhone.ActivityIndicatorStyle.BIG:
						obj.dom.className += ' ActivityIndicator_BIG';
						break;
					case Titanium.UI.iPhone.ActivityIndicatorStyle.DARK:
						obj.dom.className += ' ActivityIndicator_DARK';
						break;
				}
			}
		}
	});
	
	var _visible = false;
	Object.defineProperty(obj, 'visible', {
		get: function() {
			return _visible;
		},
		set: function(val) {
			val ? obj.show() : obj.hide();
		}
	});

	// Methods
	this.hide = function(){
		obj.dom.style.display = 'none';
		_visible = false;
		obj.fireEvent('html5_hidden');
	};
	this.show = function(){
		// Append activity indicator to current window, if it was not
		//if (!(obj.parent instanceof Titanium.UI.Window) && Titanium.UI.currentWindow) {
		//	Titanium.UI.currentWindow.dom.appendChild(obj.dom);
		//}
		_visible = true;
		var oWinSizes = Ti._5.getWindowSizes();
		obj.dom.style.display = 'block';
		obj.dom.style.top = (args['top'] || (oWinSizes.height - parseInt(obj.dom.offsetHeight)) * 0.5) + "px";
		obj.dom.style.left = (args['left'] || (oWinSizes.width - parseInt(obj.dom.offsetWidth)) * 0.5) + "px";
		obj.fireEvent('html5_shown');
	};
	
	Ti._5.preset(this, ["color", "font", "message", "messageid", "style", "visible"], args);

	Ti._5.presetUserDefinedElements(this, args);
});
