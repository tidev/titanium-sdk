Ti._5.createClass("Ti.UI.PickerRow", function(args){
	args = require.mix({
		backgroundColor: "white",
		font: require.mix({
			fontFamily: "Arial",
			fontSize: 13,
			fontStyle: "normal",
			fontVariant: "normal",
			fontWeight: "normal"
		}, args.font),
		unselectable: true
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "option", args, "PickerRow"),
		domStyle = domNode.style,
		_title = null,
		_prevDisplay = "";

	// Interfaces
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		selected: {
			get: function(){return domNode.selected;},
			set: function(val){domNode.selected = !!val;}
		},
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		title: {
			get: function(){return _title;},
			set: function(val){
				_title = val; 
				domNode.innerHTML = Ti._5._changeTextToHTML(_title); 
				obj.render(null);
			}
		}
	});

	obj.show = function() {
		domStyle.display = _prevDisplay ? _prevDisplay : "";
		if (obj.parent) {
			obj.parent.dom.innerHTML = "";
			obj.parent.render(null);
		}
	};
	obj.hide = function() {
		if ("none" != domStyle.display) {
			_prevDisplay = domStyle.display;
			domStyle.display = "none";
			if (obj.parent) {
				if (domNode.selected && 1 < obj.parent._children.length) {
				obj.parent._children.length > obj.parent.dom.selectedIndex ? 
					obj.parent.setSelectedRow(0, obj.parent.dom.selectedIndex+1) :
					obj.parent.setSelectedRow(0, obj.parent.dom.selectedIndex-1);
				}
				obj.parent.dom.innerHTML = "";
				obj.parent.render(null);
			}
		}
	};

	require.mix(obj, args);
});