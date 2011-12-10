Ti._5.createClass('Titanium.UI.PickerRow', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'option', args, 'PickerRow');
	Ti._5.Touchable(this, args);
	args = Ti._5.extend({}, args);
	args.backgroundColor = args.backgroundColor || 'white';
	args.fontSize = args.font && args.font.size ? args.font.size : args.fontSize || '13px';
	args.fontWeight = args.font && args.font.weight ? args.font.weight : args.fontWeight || 'normal';
	args.fontStyle = args.font && args.font.style ? args.font.syle : args.fontStyle || 'normal';
	args.fontVariant = args.font && args.font.variant ? args.font.variant : args.fontVariant || 'normal';
	args.fontFamily = args.font && args.font.family ? args.font.family : args.fontFamily || 'Arial';
	args.unselectable = true;
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.prop(this, 'selected', {
		get: function(){return obj.dom.selected;},
		set: function(val){return obj.dom.selected = !!val;}
	});

	var _title = null;
	Ti._5.prop(this, 'title', {
		get: function(){return _title;},
		set: function(val){
			_title = val; 
			obj.dom.innerHTML = Ti._5._changeTextToHTML(_title); 
			obj.render(null);
			return _title;
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
			val.width && (obj.width = Ti._5.px(val.width));
			val.height && (obj.height = Ti._5.px(val.height));
			return val;
		}
	});
	
	var _prevDisplay = '';
	obj.show = function() {
		obj.dom.style.display = _prevDisplay ? _prevDisplay : '';
		if (obj.parent) {
			obj.parent.dom.innerHTML = '';
			obj.parent.render(null);
		}
	};
	obj.hide = function() {
		if ('none' != obj.dom.style.display) {
			_prevDisplay = obj.dom.style.display;
			obj.dom.style.display = 'none';
			if (obj.parent) {
				if (obj.dom.selected && 1 < obj.parent._children.length) {
				obj.parent._children.length > obj.parent.dom.selectedIndex ? 
					obj.parent.setSelectedRow(0, obj.parent.dom.selectedIndex+1) :
					obj.parent.setSelectedRow(0, obj.parent.dom.selectedIndex-1);
				}
				obj.parent.dom.innerHTML = '';
				obj.parent.render(null);
			}
		}
	};
	
	require.mix(this, args);
});