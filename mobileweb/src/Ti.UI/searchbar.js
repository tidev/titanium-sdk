Ti._5.createClass('Titanium.UI.SearchBar', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'input', args, 'SearchBar');
	this.dom.type = 'search';
	Ti._5.Touchable(this, args, true);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	Ti._5.Interactable(this);
	Ti._5.Clickable(this);

	// Properties
	var _autocapitalization = 0;
	var _autocapitalizationLoaded = false;
	Ti._5.prop(this, 'autocapitalization', {
		get: function() {return _autocapitalization;},
		set: function(val) {
			_autocapitalization = val;
			if (!_autocapitalizationLoaded) {
				obj.dom.addEventListener('keyup', function(event) {
					Titanium.UI._updateText(obj);
				}, false);
			}
			obj.value = Titanium.UI._capitalizeValue(_autocapitalization, obj.value);
			return _autocapitalization;
		}
	});

	Ti._5.prop(this, 'autocorrect');

	Ti._5.prop(this, 'barColor');

	Ti._5.prop(this, 'hintText', {
		get: function() {return obj.dom.placeholder;},
		set: function(val) {
			return obj.dom.placeholder = Titanium.UI._capitalizeValue(_autocapitalization, val);
		}
	});

	var _hinttextid = null;
	Ti._5.prop(this, 'hinttextid', {
		get: function(){return _hinttextid;},
		set: function(val){return obj.hintText = L(_hinttextid = val);}
	});

	Ti._5.prop(this, 'keyboardType');

	Ti._5.prop(this, 'prompt');

	var _promptid = null;
	Ti._5.prop(this, 'promptid', {
		get: function(){return _promptid;},
		set: function(val){return obj.prompt = L(_promptid = val);}
	});

	Ti._5.prop(this, 'showCancel');

	Ti._5.prop(this, 'value', {
		get: function() {return obj.dom.value;},
		set: function(val) {return obj.dom.value = val ? Titanium.UI._capitalizeValue(_autocapitalization, val) : '';}
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
	
	require.mix(this, args);

	// Methods
	obj.focus = function(ev) {
		obj.dom.focus(ev);
	};
	
	obj.blur = function(ev) {
		obj.dom.blur(ev);
	};

	// Events
	this.addEventListener('cancel', function(){
		console.debug('Event "cancel" is not implemented yet.');
	});
});
