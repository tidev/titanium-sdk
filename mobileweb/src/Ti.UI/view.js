Ti._5.createClass('Titanium.UI.View', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	args.width = args.width || '100%';
	args.height = args.height || '100%';
	
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'View');
	Ti._5.Clickable(this);
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	this.dom.style.overflow = '100%' == args.height || 'auto' == args.height ? "" : "hidden";

	Ti._5.prop(this, 'size', {
		get: function(){
			return {
				width: obj.width,
				height: obj.height
			}
		},
		set: function(val){
			if(val != null && val.width != null){
				obj.width = val.width;
			}

			if(val != null && val.height != null){
				obj.height = val.height;
			}
		}
	});
	
	require.mix(this, args);
	
	obj.dom._calcHeight = false;
	obj.addEventListener('html5_added', function(){
		obj.dom._calcHeight = false;
	});
	
	function _getLowestPosition(obj) {
		var oSizes = Ti._5._getElementOffset(obj.dom);
		var iMaxPos = oSizes.height + (parseInt(obj.top) || 0) + (parseInt(obj.bottom) || 0);
		if (obj._children) {
			for (var iCounter = 0; iCounter < obj._children.length; iCounter++) {
				iPos = _getLowestPosition(obj._children[iCounter]);
				iMaxPos = iMaxPos < iPos ? iPos : iMaxPos;
			}
		}
		return iMaxPos;
	}
	
	function _setViewHeight() {
		if (
			('undefined' == typeof obj.height || 'auto' == obj.height) &&
			false === obj.dom._calcHeight &&
			obj._children && "vertical" != obj.layout
		) {
			var iMaxPos = 0;
			for (var iCounter = 0; iCounter < obj._children.length; iCounter++) {
				var iPos = _getLowestPosition(obj._children[iCounter]);
				iMaxPos = iMaxPos < iPos ? iPos : iMaxPos;
			}
			obj.dom._calcHeight = iMaxPos;
			obj.dom.style.height = obj.dom._calcHeight + 'px';
		}
	}
	
	obj.addEventListener('html5_child_rendered', _setViewHeight, false);
	obj.addEventListener('html5_shown', function () {obj.dom._calcHeight = false; _setViewHeight();}, false);
	window.addEventListener('resize', function () {obj.dom._calcHeight = false; _setViewHeight();}, false);
});

