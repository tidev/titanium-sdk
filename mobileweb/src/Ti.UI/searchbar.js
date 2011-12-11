Ti._5.createClass("Titanium.UI.SearchBar", function(args){
	args = require.mix({
		unselectable: true
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "input", args, "SearchBar"),
		_autocapitalization = 0,
		_autocapitalizationLoaded = false,
		_hinttextid = null,
		_promptid = null;

	// Interfaces
	Ti._5.Touchable(obj, args, true);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
	Ti._5.Interactable(obj);
	Ti._5.Clickable(obj);

	domNode.type = "search";

	// Properties
	Ti._5.prop(obj, {
		"autocapitalization": {
			get: function() {return _autocapitalization;},
			set: function(val) {
				_autocapitalization = val;
				if (!_autocapitalizationLoaded) {
					require.on(domNode, "keyup", function() {
						Titanium.UI._updateText(obj);
					});
				}
				obj.value = Titanium.UI._capitalizeValue(_autocapitalization, obj.value);
			}
		},
		"autocorrect": false,
		"barColor": null,
		"hintText": {
			get: function() {return domNode.placeholder;},
			set: function(val) {
				domNode.placeholder = Titanium.UI._capitalizeValue(_autocapitalization, val);
			}
		},
		"hinttextid": {
			get: function(){return _hinttextid;},
			set: function(val){obj.hintText = L(_hinttextid = val);}
		},
		"keyboardType": null,
		"prompt": "",
		"promptid": {
			get: function(){return _promptid;},
			set: function(val){obj.prompt = L(_promptid = val);}
		},
		"showCancel": false,
		"size", {
			get: function() {
				return {
					width	: obj.width,
					height	: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		"value": {
			get: function() {return domNode.value;},
			set: function(val) {domNode.value = val ? Titanium.UI._capitalizeValue(_autocapitalization, val) : "";}
		}
	});

	require.mix(obj, args);

	// Methods
	obj.focus = domNode.focus;
	obj.blur = domNode.blur;
});
