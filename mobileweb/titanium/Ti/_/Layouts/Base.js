define(["Ti/_/css", "Ti/_/declare", "Ti/_/style", "Ti/_/dom", "Ti/API", "Ti/_/lang", "Ti/UI"], function(css, declare, style, dom, API, lang, UI) {
	
	var isDef = lang.isDef;

	return declare("Ti._.Layouts.Base", null, {

		constructor: function(element) {
			this.element = element;
			css.add(element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this.element.domNode, css.clean(this.declaredClass));
		},
		
		verifyChild: function(child, parent) {
			if (!child._alive || !child.domNode) {
				API.debug("WARNING: Attempting to layout element that has been destroyed.\n\t Removing the element from the parent.\n\t The parent has a widget ID of " + parent.widgetId + ".");
				var children = parent.children;
				children.splice(children.indexOf(child),1);
				return;
			}
			return 1;
		},
		
		getValueType: function(value) {
			var match = isDef(value) && (value + "").match(/^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))?(.*)$/);
			return match && (match[8] !== UI.SIZE && match[8] !== UI.FILL && match[8] !== "%" ? "#" : match[8]);
		},
		
		computeValue: function(dimension, valueType) {
			var value = parseFloat(dimension);
			switch (valueType) {
				case "%": 
					return value / 100;
					
				case "#": 
					var units = (dimension + "").match(/^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))?(.*)$/)[8];
					!units && (units = "px");

					switch(units) {
						case "mm":
							value *= 10;
						case "cm":
							return value * 0.0393700787 * _.dpi;
						case "in":
							return value * _.dpi;
						case "dp":
							return value * _.dpi / 96;
						default:
							return value;
					}
			}
		},		
		
		_computedSize: {width: 0, height: 0}

	});

});