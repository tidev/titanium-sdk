Ti._5.createClass("Ti.UI.ScrollView", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "ScrollView"),
		domStyle = domNode.style,
		unitize = require("Ti/_/dom").unitize,
		_innerContainer = document.createElement("div"),
		_contentHeight,
		_contentOffset = null,
		_contentWidth,
		_showHorizontalScrollIndicator = null,
		_showVerticalScrollIndicator = null,
		_size;

	// outer container
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	domStyle.position = "absolute";
	domStyle.overflow = "auto";

	// we need to do some DOM manipulations here - ScrollView needs to have 2 containers - outer for setting contentWidth && contentHeight,
	// and inner one - to apply everything else
	// inner container
	_innerContainer.style.overflow = "hidden";
	_innerContainer.style.position = "absolute";
	domNode.appendChild(_innerContainer);
	obj._getAddContainer = function(){
		return _innerContainer;
	};

	// Properties
	Ti._5.prop(obj, {
		canCancelEvents: true,
		contentHeight: {
			get: function(){return _contentHeight;},
			set: function(val){
				_contentHeight = val;
				obj._getAddContainer().style.height = unitize(val);
			}
		},
		contentOffset: {
			get: function(){return _contentOffset;},
			set: function(val){
				_contentOffset = val;
				x in val && (domStyle.paddingLeft = unitize(val.x));
				y in val && (domStyle.paddingTop = unitize(val.y));
			}
		},
		contentWidth: {
			get: function(){return _contentWidth;},
			set: function(val){
				_contentWidth = val;
				obj._getAddContainer().style.width = unitize(val);
			}
		},
		disableBounce: false,
		horizontalBounce: false,
		maxZoomScale: null,
		minZoomScale: null,
		scrollType: null,
		showHorizontalScrollIndicator: {
			get: function(){return _showHorizontalScrollIndicator;},
			set: function(val){
				_showHorizontalScrollIndicator = val;
				domStyle.overflowX = _showHorizontalScrollIndicator ? "scroll" : "hidden";
			}
		},
		showVerticalScrollIndicator: {
			get: function(){return _showVerticalScrollIndicator;},
			set: function(val){
				_showVerticalScrollIndicator = val;
				domStyle.overflowY = _showVerticalScrollIndicator ? "scroll" : "hidden";
			}
		},
		size: {
			get: function(){return _size;},
			set: function(val){
				if (val != null && val.width != null) {
					_innerContainer.style.width = unitize(val.width);
				}
				if (val != null && val.height != null) {
					_innerContainer.style.height = unitize(val.height);
				}
			}
		},
		verticalBounce: null,
		zoomScale: null
	});

	// Methods
	obj.scrollTo = function(x, y){
		if(x != null){
			domNode.scrollLeft = parseInt(x);
		}
		if(y != null){
			domNode.scrollTop = parseInt(y);
		}
	};

	// Events
	require.on(domNode, "scroll", function(evt) {
		obj.fireEvent("scroll", {
			source: evt.target,
			x: evt.pageX,
			y: evt.pageY
		});
	});

	require.mix(obj, args);
});
