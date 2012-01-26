define("Ti/_/UI/FontWidget", ["Ti/_/declare", "Ti/_/dom", "Ti/_/ready", "Ti/_/style", "Ti/_/UI/Widget"], function(declare, dom, ready, style, Widget) {

	var textRuler;

	ready(function() {
		textRuler = dom.create("p", {
			style: {
				position: "absolute",
				top: "-1000em",
				left: 0,
				height: "auto",
				width: "auto"
			}
		}, document.body);
	});

	return declare("Ti._.UI.FontWidget", Widget, {

		constructor: function() {
			this._styleableDomNodes = [];
		},

		_setFont: function(font,domNode) {
			require.isDef(font.fontSize) && (font.fontSize = dom.unitize(font.fontSize));
			style.set(domNode, font);
		},

		_addStyleableDomNode: function(styleableDomNode) {
			this._styleableDomNodes.push(styleableDomNode);
		},

		_removeStyleableDomNode: function(styleableDomNode) {
			var index = this._styleableDomNodes.indexOf(styleableDomNode);
			index != -1 && this._styleableDomNodes.splice(index,1);
		},

		_measureText: function(text, domNode) {
			var computedStyle = window.getComputedStyle(domNode),
				font = this.font || {};

			textRuler.innerHTML = text;

			this._setFont({
				fontFamily: font.fontFamily || computedStyle.fontFamily,
				fontSize: font.fontSize || computedStyle.fontSize,
				fontStyle: font.fontStyle || computedStyle.fontStyle,
				fontWeight: font.fontWeight || computedStyle.fontWeight
			}, textRuler);

			// Return the computed style
			return { width: textRuler.clientWidth, height: textRuler.clientHeight };
		},

		properties: {
			font: {
				set: function(value) {
					for (var domNode in this._styleableDomNodes) {
						this._setFont(value, this._styleableDomNodes[domNode]);
					}
					return value;
				}
			}
		}
	});
	
});