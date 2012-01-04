define("Ti/_/UI/FontWidget", ["Ti/_/declare", "Ti/_/style", "Ti/_/dom", "Ti/_/UI/Widget"], function(declare, style, dom, Widget) {
		
	var set = style.set,
		isDef = require.isDef,
		undef;

	return declare("Ti._.UI.FontWidget", Widget, {
		
		constructor: function(args) {
			this._styleableDomNodes = [];
		},
		
		_setFont: function(font,domNode) {
			isDef(font.fontFamily) && set(domNode,"fontFamily",font.fontFamily);
			isDef(font.fontSize) && set(domNode,"fontSize",dom.unitize(font.fontSize));
			isDef(font.fontStyle) && set(domNode,"fontStyle",font.fontStyle);
			isDef(font.fontWeight) && set(domNode,"fontWeight",font.fontWeight);
		},
		
		_addStyleableDomNode: function(styleableDomNode) {
			this._styleableDomNodes.push(styleableDomNode);
		},
		
		_removeStyleableDomNode: function(styleableDomNode) {
			var index = this._styleableDomNodes.indexOf(styleableDomNode);
			index != -1 && this._styleableDomNodes.splice(index,1);
		},
		
		properties: {
			font: {
				set: function(value) {
					for (var domNode in this._styleableDomNodes) {
						this._setFont(value,this._styleableDomNodes[domNode]);
					}
					return value;
				}
			}
		}
	});
	
});