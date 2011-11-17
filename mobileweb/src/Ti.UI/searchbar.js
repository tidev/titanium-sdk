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
	Object.defineProperty(this, 'autocapitalization', {
		get: function() {return _autocapitalization;},
		set: function(val) {
			_autocapitalization = val;
			if (!_autocapitalizationLoaded) {
				obj.dom.addEventListener('keyup', function(event) {
					Titanium.UI._updateText(obj);
				}, false);
			}
			obj.value = Titanium.UI._capitalizeValue(_autocapitalization, obj.value);
		}
	});

	var _autocorrect = null;
	Object.defineProperty(this, 'autocorrect', {
		get: function(){return _autocorrect;},
		set: function(val){return _autocorrect = val;}
	});

	var _barColor = null;
	Object.defineProperty(this, 'barColor', {
		get: function(){return _barColor;},
		set: function(val){return _barColor = val;}
	});

	Object.defineProperty(this, 'hintText', {
		get: function() {return obj.dom.placeholder;},
		set: function(val) {
			obj.dom.placeholder = Titanium.UI._capitalizeValue(_autocapitalization, val);
		}
	});

	var _hinttextid = null;
	Object.defineProperty(this, 'hinttextid', {
		get: function(){return _hinttextid;},
		set: function(val){return _hinttextid = val; obj.hintText = L(val);}
	});

	var _keyboardType = null;
	Object.defineProperty(this, 'keyboardType', {
		get: function(){return _keyboardType;},
		set: function(val){return _keyboardType = val;}
	});

	var _prompt = null;
	Object.defineProperty(this, 'prompt', {
		get: function(){return _prompt;},
		set: function(val){return _prompt = val;}
	});

	var _promptid = null;
	Object.defineProperty(this, 'promptid', {
		get: function(){return _promptid;},
		set: function(val){return _promptid = val; obj.prompt = L(val);}
	});

	var _showCancel = null;
	Object.defineProperty(this, 'showCancel', {
		get: function(){return _showCancel;},
		set: function(val){return _showCancel = val;}
	});

	Object.defineProperty(this, 'value', {
		get: function() {return obj.dom.value;},
		set: function(val) {obj.dom.value = val ? Titanium.UI._capitalizeValue(_autocapitalization, val) : '';}
	});
	
	Object.defineProperty(this, 'size', {
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
		}
	});
	
	Ti._5.preset(this, ["value", "autocapitalization", "hintText", "size"], args);
	Ti._5.presetUserDefinedElements(this, args);

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
