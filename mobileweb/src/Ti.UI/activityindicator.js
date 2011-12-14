Ti._5.createClass("Ti.UI.ActivityIndicator", function(args){
	args = require.mix({
		visible: false
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "ActivityIndicator"),
		domStyle = domNode.style,
		_message = "",
		_visible = false;

	// Interfaces
	Ti._5.Positionable(obj, args);
	Ti._5.Styleable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		color: {
			get: function(){return domStyle.color;},
			set: function(val) {
				domStyle.color = val;
			}
		},
		message: {
			get: function(){return _message;},
			set: function(val){domNode.innerHTML = _message = val;}
		},
		messageid: "",
		visible: {
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
		//if (!(obj.parent instanceof Ti.UI.Window) && Ti.UI.currentWindow) {
		//	Ti.UI.currentWindow.dom.appendChild(domNode);
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
