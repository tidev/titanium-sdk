Ti._5.createClass('Titanium.UI.Label', function(args){
	var obj = this;
	
	// Set some default values to label for prevent inheriting style  
	args = Ti._5.extend({}, args);
	args.backgroundColor = args.backgroundColor || 'none'; 
	args.font = args.font || {}; 	
	args.fontFamily = args.fontFamily || args.font.fontFamily || ''; 
	args.fontSize = args.fontSize || args.font.fontSize ||  ''; 
	args.fontStyle = args.fontStyle || args.font.fontStyle ||  'normal'; 
	args.fontWeight = args.fontWeight || args.font.fontWeight ||  'normal'; 
	args.minimumFontSize = args.minimumFontSize || args.font.minimumFontSize || '';
	args.opacity = args.opacity || 1; 
	args.textAlign = args.textAlign || '-webkit-auto'; 
	args.unselectable = true;

	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'Label');
	Ti._5.Clickable(this);
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	args.backgroundPaddingLeft = args.backgroundPaddingLeft || '0';
	args.backgroundPaddingTop = args.backgroundPaddingTop || '0';
	this.dom.style.overflow = 'hidden';

	// Properties
	this.autoLink = null;

	var _setBGPosition = function(){
	};

	Ti._5.prop(this, 'backgroundPaddingBottom', {});

	Ti._5.prop(this, 'backgroundPaddingLeft', {
		get: function(){return obj.dom.style.backgroundPositionX;},
		set: function(val){return obj.dom.style.backgroundPositionX = val + "px"}
	});

	Ti._5.prop(this, 'backgroundPaddingRight', {});

	Ti._5.prop(this, 'backgroundPaddingTop', {
		get: function(){return obj.dom.style.backgroundPositionY;},
		set: function(val){return obj.dom.style.backgroundPositionY = val + "px";}
	});

	Ti._5.propReadOnly(this, 'ellipsize', false);

	Ti._5.prop(this, 'highlightedColor', null);

	Ti._5.prop(this, 'html', {
		get: function(){return obj.text},
		set: function(val){return obj.text = val;}
	});

	Ti._5.prop(this, 'minimumFontSize', null);

	var _setShadow = function(){
		obj.dom.style["-webkit-box-shadow"] = (_shadowColor || "#000") + " " + 
			(_shadowOffset && _shadowOffset.x || 0) + "px " + 
			(_shadowOffset && _shadowOffset.y || 0) + "px ";
	};

	var _shadowColor = null;
	Ti._5.prop(this, 'shadowColor', {
		get: function(){return _shadowColor;},
		set: function(val){_shadowColor = val; return _setShadow();}
	});

	var _shadowOffset = null;
	Ti._5.prop(this, 'shadowOffset', {
		get: function(){return _shadowOffset;},
		set: function(val){_shadowOffset = val; return _setShadow();}
	});

	var _title = '';
	Ti._5.prop(this, 'text', {
		get: function(){return _title ? _title : obj.dom.innerHTML;},
		set: function(val){
			_title = ''+val; 
			obj.dom.innerHTML = Ti._5._changeTextToHTML(val); 
			// if we have been rendered and add is called - re-render
			if (
				!obj._rendered ||
				!obj.parent || !obj.parent.dom || 
				!obj.dom.offsetHeight && !obj.dom.offsetWidth || 
				!obj.parent.dom.offsetHeight && !obj.parent.dom.offsetWidth
			) {
				return _title;
			}
			obj.render(null);
			return _title;
		}
	});

	Ti._5.prop(this, 'textAlign', {
		get: function(){return obj.dom.style.textAlign;},
		set: function(val){return obj.dom.style.textAlign = val;}
	});

	var _textid = null;
	Ti._5.prop(this, 'textid', {
		get: function(){return _textid;},
		set: function(val){return text = L(_textid = val);}
	});

	Ti._5.prop(this, 'wordWrap', {
		get: function(){return true;}
	});
	
	var _selectedColor = null, _prevTextColor = null, _selectedColorLoaded = false;
	Ti._5.prop(this, 'selectedColor', {
		get: function(){return _selectedColor;},
		set: function(val) {
			_selectedColor = val;
			if (!_selectedColorLoaded) {
				_selectedColorLoaded = true;
				obj.dom.addEventListener('focus', function() {
					_prevTextColor = obj.color;
					obj.color = _selectedColor;
				}, false);
				obj.dom.addEventListener('blur', function() {
					if (_prevTextColor) {
						obj.color = _prevTextColor;
					}
				}, false);
			}
			return _selectedColor;
		}
	});
	
	Ti._5.prop(this, 'size', {
		get: function() {
			return {
				width	: obj.width,
				height	: obj.height
			}
		},
		set: function(val) {
			if (val.width) {
				obj.width = Ti._5.parseLength(val.width);
			}
			if (val.height) {
				obj.height = Ti._5.parseLength(val.height);
			}
			return val;
		}
	});

	require.mix(this, args);
});
