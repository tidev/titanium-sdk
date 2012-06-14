define(["Ti/_/declare", "Ti/_/dom", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/_/UI/Widget"],
	function(declare, dom, lang, ready, style, Widget) {

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
			if (font) {
				var fontSize = parseInt(font.fontSize);
				font.fontSize = isNaN(fontSize) ? void 0 : (fontSize + "px");
				style.set(domNode, font);
			} else {
				style.set(domNode,{
					fontFamily: "",
					fontSize: "",
					fontStyle: "",
					fontWeight: ""
				});
			}
		},

		_addStyleableDomNode: function(styleableDomNode) {
			this._styleableDomNodes.push(styleableDomNode);
		},

		_removeStyleableDomNode: function(styleableDomNode) {
			var index = this._styleableDomNodes.indexOf(styleableDomNode);
			index != -1 && this._styleableDomNodes.splice(index,1);
		},

		_measureText: function(text, domNode, width) {
			var computedStyle = window.getComputedStyle(domNode) || {},
				font = this.font || {},
				emptyText = !text || text === "";

			textRuler.innerHTML = emptyText ? "\u00C4y" : text;

			this._setFont({
				fontFamily: font.fontFamily || computedStyle.fontFamily || "",
				fontSize: font.fontSize || computedStyle.fontSize || "",
				fontStyle: font.fontStyle || computedStyle.fontStyle || "",
				fontWeight: font.fontWeight || computedStyle.fontWeight || ""
			}, textRuler);
			style.set(textRuler,{
				whiteSpace: domNode.style.whiteSpace,
				width: dom.unitize(lang.val(width,"auto"))
			});

			// Return the computed style
			return { width: emptyText ? 0 : textRuler.clientWidth + 0.5, height: textRuler.clientHeight };
		},

		properties: {
			color: {
				set: function(value) {
					for (var domNode in this._styleableDomNodes) {
						style.set(this._styleableDomNodes[domNode], "color", value);
					}
					return value;
				}
			},
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