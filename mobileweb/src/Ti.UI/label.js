Ti._5.createClass("Ti.UI.Label", function(args){
	args = require.mix({
		backgroundColor: "none",
		textAlign: "-webkit-auto",
		unselectable: true
	}, args);

	var undef,
		obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "Label"),
		domStyle = domNode.style,
		px = Ti._5.px,
		_shadowColor = null,
		_shadowOffset = null,
		_title = "",
		_textid = null,
		_selectedColor = null,
		_prevTextColor = null,
		_selectedColorLoaded = false;

	// Interfaces
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
	args.backgroundPaddingLeft = args.backgroundPaddingLeft || "0";
	args.backgroundPaddingTop = args.backgroundPaddingTop || "0";
	domStyle.overflow = "hidden";

	function setShadow() {
		domStyle["-webkit-box-shadow"] = (_shadowColor || "#000") + " " + 
			(_shadowOffset && _shadowOffset.x || 0) + "px " + 
			(_shadowOffset && _shadowOffset.y || 0) + "px ";
	}

	// Properties
	Ti._5.prop(obj, {
		autoLink: undef,
		backgroundPaddingBottom: undef,
		backgroundPaddingLeft: {
			get: function(){return domStyle.backgroundPositionX;},
			set: function(val){domStyle.backgroundPositionX = px(val);}
		},
		backgroundPaddingRight: undef,
		backgroundPaddingTop: {
			get: function(){return domStyle.backgroundPositionY;},
			set: function(val){domStyle.backgroundPositionY = px(val);}
		},
		ellipsize: false,
		highlightedColor: undef,
		html: {
			get: function(){return obj.text},
			set: function(val){obj.text = val;}
		},
		minimumFontSize: undef,
		selectedColor: {
			get: function(){return _selectedColor;},
			set: function(val) {
				_selectedColor = val;
				if (!_selectedColorLoaded) {
					_selectedColorLoaded = true;
					require.on(domNode, "focus", function() {
						_prevTextColor = obj.color;
						obj.color = _selectedColor;
					});
					require.on(domNode, "blur", function() {
						_prevTextColor && (obj.color = _prevTextColor);
					});
				}
			}
		},
		shadowColor: {
			get: function(){return _shadowColor;},
			set: function(val){_shadowColor = val; setShadow();}
		},
		shadowOffset: {
			get: function(){return _shadowOffset;},
			set: function(val){_shadowOffset = val; setShadow();}
		},
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = px(val.width));
				val.height && (obj.height = px(val.height));
			}
		},
		text: {
			get: function(){return _title ? _title : domNode.innerHTML;},
			set: function(val){
				_title = ""+val; 
				domNode.innerHTML = Ti._5._changeTextToHTML(val); 
				// if we have been rendered and add is called - re-render
				if (
					!obj._rendered ||
					!obj.parent || !obj.parent.dom || 
					!domNode.offsetHeight && !domNode.offsetWidth || 
					!obj.parent.dom.offsetHeight && !obj.parent.dom.offsetWidth
				) {
					return _title;
				}
				obj.render(null);
			}
		},
		textAlign: {
			get: function(){return domStyle.textAlign;},
			set: function(val){domStyle.textAlign = val;}
		},
		textid: {
			get: function(){return _textid;},
			set: function(val){text = L(_textid = val);}
		},
		wordWrap: {
			get: function(){return true;}
		}
	});

	require.mix(obj, args);
});
