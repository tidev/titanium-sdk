Ti._5.createClass("Titanium.UI.ActivityIndicator", function(args){
	args = require.mix({
		visible: args.visible || false
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "ActivityIndicator"),
		domStyle = domStyle,
		_message = "",
		_style = null,
		_visible = false;

	// Interfaces
	Ti._5.Positionable(obj, args);
	Ti._5.Styleable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		"color": {
			get: function(){return domStyle.color;},
			set: function(val) {
				domStyle.color = val;
			}
		},
		"message": {
			get: function(){return _message;},
			set: function(val){domNode.innerHTML = _message = val;}
		},
		"messageid": "",
		"style": {
			get: function(){return _style;},
			set: function(val){
				_style = val;
				if (Titanium.UI.iPhone) {
					domNode.className = domNode.className.replace(/\bActivityIndicator_(BIG|DARK)\b/g, "");
					switch (_style) {
						case Titanium.UI.iPhone.ActivityIndicatorStyle.BIG:
							domNode.className += " ActivityIndicator_BIG";
							break;
						case Titanium.UI.iPhone.ActivityIndicatorStyle.DARK:
							domNode.className += " ActivityIndicator_DARK";
							break;
					}
				}
			}
		},
		"visible": {
			get: function() {
				return _visible;
			},
			set: function(val) {
				val ? obj.show() : obj.hide();
			}
		}
	});

	// Methods
	obj.hide = function(){
		domStyle.display = "none";
		_visible = false;
		obj.fireEvent("html5_hidden");
	};
	obj.show = function(){
		// Append activity indicator to current window, if it was not
		//if (!(obj.parent instanceof Titanium.UI.Window) && Titanium.UI.currentWindow) {
		//	Titanium.UI.currentWindow.dom.appendChild(domNode);
		//}
		_visible = true;
		var oWinSizes = Ti._5.getWindowSizes();
		domStyle.display = "block";
		domStyle.top = (args["top"] || (oWinSizes.height - parseInt(domNode.offsetHeight)) * 0.5) + "px";
		domStyle.left = (args["left"] || (oWinSizes.width - parseInt(domNode.offsetWidth)) * 0.5) + "px";
		obj.fireEvent("html5_shown");
	};

	require.mix(obj, args);
});
