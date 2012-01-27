define("Ti/UI/Label", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], function(declare, FontWidget, dom, css, style, lang) {

	var set = style.set,
		undef,
		unitize = dom.unitize;

	return declare("Ti.UI.Label", FontWidget, {
		
		constructor: function() {
			
			this.touchEnabled = false;
			
			// Create the aligner div. This sets up a flexbox to float the text to the middle
			this.textAlignerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextAligner")
			}, this.domNode);

			set(this.textAlignerDiv, "display", "-webkit-box");
			set(this.textAlignerDiv, {
				display: "-moz-box",
				boxOrient: "vertical",
				boxPack: "center",
				width: "100%",
				height: "100%",
				overflow: "hidden"
			});

			// Create the container div. This gets floated by the flexbox
			this.textContainerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextContainer"),
				style: {
					textAlign: "left",
					textOverflow: "ellipsis",
					overflowX: "hidden",
					width: "100%",
					maxHeight: "100%",
					userSelect: "none",
					whiteSpace: "nowrap"
				}
			}, this.textAlignerDiv);

			this._addStyleableDomNode(this.textContainerDiv);
		},

		_defaultWidth: "auto",

		_defaultHeight: "auto",
		
		_getContentWidth: function() {
			return this._measureText(this.text, this.textContainerDiv).width;
		},
		
		_getContentHeight: function() {
			return this._measureText(this.text, this.textContainerDiv).height;
		},
		
		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this,arguments);
			var cssVal = value ? "auto" : "none"
			set(this.textAlignerDiv,"pointerEvents", cssVal);
			set(this.textContainerDiv,"pointerEvents", cssVal);
		},
		
		_setTextShadow: function() {
			var shadowColor = this.shadowColor && this.shadowColor !== "" ? this.shadowColor : undef;
			if (this.shadowOffset || shadowColor) {
				set(this.textContainerDiv,"textShadow",
					(this.shadowOffset ? unitize(this.shadowOffset.x) + " " + unitize(this.shadowOffset.y) : "0px 0px") + " 0.1em " + lang.val(shadowColor,"black"));
			} else {
				set(this.textContainerDiv,"textShadow","");
			}
		},

		properties: {
			color: {
				set: function(value) {
					this.textContainerDiv.style.color = value;
					return value;
				}
			},
			ellipsize: {
				set: function(value) {
					set(this.textContainerDiv,"textOverflow", !!value ? "ellipsis" : "clip");
					return value;
				},
				value: true
			},
			html: {
				set: function(value) {
					this.textContainerDiv.innerHTML = value;
					this._hasAutoDimensions() && Ti.UI._doFullLayout();
					return value;
				}
			},
			shadowColor: {
				post: function(value) {
					this._setTextShadow();
					return value;
				}
			},
			shadowOffset: {
				post: function(value) {
					this._setTextShadow();
					return value;
				}
			},
			text: {
				set: function(value) {
					this.textContainerDiv.innerHTML = value;
					this._hasAutoDimensions() && Ti.UI._doFullLayout();
					return value;
				}
			},
			textAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case Ti.UI.TEXT_ALIGNMENT_LEFT: cssValue = "left"; break;
						case Ti.UI.TEXT_ALIGNMENT_CENTER: cssValue = "center"; break;
						case Ti.UI.TEXT_ALIGNMENT_RIGHT: cssValue = "right"; break;
					}
					this.textContainerDiv.style.textAlign = cssValue;
					return value;
				},
				value: Ti.UI.TEXT_ALIGNMENT_LEFT
			},
			textid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Label#.textid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Label#.textid" is not implemented yet.');
					return value;
				}
			},
			wordWrap: {
				set: function(value) {
					set(this.textContainerDiv,"whiteSpace", !!value ? "normal" : "nowrap");
					return value;
				},
				value: false
			}
		}

	});

});