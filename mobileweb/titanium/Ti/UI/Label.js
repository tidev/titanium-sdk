define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, UI) {

	var set = style.set,
		undef,
		unitize = dom.unitize,
		tabStop = 2;

	return declare("Ti.UI.Label", FontWidget, {
		
		constructor: function() {
			
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
					overflow: "hidden",
					width: "100%",
					maxHeight: "100%",
					userSelect: "none",
					whiteSpace: "nowrap"
				}
			}, this.textAlignerDiv);

			this._addStyleableDomNode(this.textContainerDiv);
			
			this.touchEnabled = false;
			this.wordWrap = true;
		},

		_defaultWidth: Ti.UI.SIZE,

		_defaultHeight: Ti.UI.SIZE,
		
		_getContentSize: function(width, height) {
			return {
				width: this._measureText(this.text, this.textContainerDiv, width).width,
				height: this._measureText(this.text, this.textContainerDiv, width).height
			};
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
					this._hasSizeDimensions() && this._triggerParentLayout();
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
					
					// Convert \t and \n to &nbsp;'s and <br/>'s
					var lineStartIndex = 0,
						currentIndex = 0,
						currentTabIndex,
						value = value || "";
					while(currentIndex < value.length) {
						if (value[currentIndex] === '\t') {
							var tabSpaces = "",
								numSpacesToInsert = tabStop - (currentTabIndex) % tabStop;
							for(var i = 0; i < numSpacesToInsert; i++) {
								tabSpaces += "&nbsp;";
							}
							value = value.substring(0,currentIndex) + tabSpaces + value.substring(currentIndex + 1);
							currentIndex += tabSpaces.length;
							currentTabIndex += numSpacesToInsert;
						} else if (value[currentIndex] === '\n') {
							value = value.substring(0,currentIndex) + "<br/>" + value.substring(currentIndex + 1);
							currentIndex += 5;
							lineStartIndex = currentIndex;
							currentTabIndex = 0;
						} else {
							currentIndex++;
							currentTabIndex++;
						}
					}
					value.match("<br/>$") && (value += "&nbsp;");
					
					this.textContainerDiv.innerHTML = value;
					this._hasSizeDimensions() && this._triggerParentLayout();
					return value;
				}
			},
			textAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case UI.TEXT_ALIGNMENT_LEFT: cssValue = "left"; break;
						case UI.TEXT_ALIGNMENT_CENTER: cssValue = "center"; break;
						case UI.TEXT_ALIGNMENT_RIGHT: cssValue = "right"; break;
					}
					this.textContainerDiv.style.textAlign = cssValue;
					return value;
				},
				value: UI.TEXT_ALIGNMENT_LEFT
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
				}
			}
		}

	});

});