Ti._5.createClass("Ti.UI.View", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "View");

	// Interfaces
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	domNode.style.overflow = args.height === "100%" || args.height === "auto" ? "" : "hidden";

	Ti._5.prop(obj, "size", {
		get: function(){
			return {
				width: obj.width,
				height: obj.height
			}
		},
		set: function(val){
			val.width && (obj.width = Ti._5.px(val.width));
			val.height && (obj.height = Ti._5.px(val.height));
		}
	});

	require.mix(obj, args);

	domNode._calcHeight = false;
	obj.addEventListener("html5_added", function(){
		domNode._calcHeight = false;
	});

	function getLowestPosition(obj) {
		var oSizes = Ti._5._getElementOffset(domNode);
		var iMaxPos = oSizes.height + (parseInt(obj.top) || 0) + (parseInt(obj.bottom) || 0);
		if (obj._children) {
			for (var iCounter = 0; iCounter < obj._children.length; iCounter++) {
				iPos = getLowestPosition(obj._children[iCounter]);
				iMaxPos = iMaxPos < iPos ? iPos : iMaxPos;
			}
		}
		return iMaxPos;
	}

	function setViewHeight() {
		if (
			("undefined" == typeof obj.height || "auto" == obj.height) &&
			false === domNode._calcHeight &&
			obj._children && "vertical" != obj.layout
		) {
			var iMaxPos = 0;
			for (var iCounter = 0; iCounter < obj._children.length; iCounter++) {
				var iPos = getLowestPosition(obj._children[iCounter]);
				iMaxPos = iMaxPos < iPos ? iPos : iMaxPos;
			}
			domNode._calcHeight = iMaxPos;
			domNode.style.height = domNode._calcHeight + "px";
		}
	}

	obj.addEventListener("html5_child_rendered", setViewHeight);
	obj.addEventListener("html5_shown", function() {
		domNode._calcHeight = false;
		setViewHeight();
	});

	require.on(window, "resize", function() {
		domNode._calcHeight = false;
		setViewHeight();
	});
});

