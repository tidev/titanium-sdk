define(['Ti/_/declare', 'Ti/_/UI/FontWidget', 'Ti/_/dom', 'Ti/_/css', 'Ti/_/style', 'Ti/_/lang', 'Ti/Locale', 'Ti/UI'],
	function(declare, FontWidget, dom, css, style, lang, Locale, UI) {

	var setStyle = style.set,
		unitize = dom.unitize,
		tabStop = 2,
		textPost = {
			post: '_setText'
		};

	return declare('Ti.UI.Label', FontWidget, {

		constructor: function() {
			this._add(this._textContainer = UI.createView({
				width: UI.INHERIT,
				height: UI.SIZE,
				center: {y: '50%'}
			}));

			var self = this,
				textContainerDomNode = this._textContainerDomNode = this._textContainer.domNode;
			self._textContainer._getContentSize = function(width) {
				var text = self._textContainerDomNode.innerHTML,
					measuredSize = self._measureText(text, textContainerDomNode, self._hasSizeWidth() ? void 0 : width);
				return {
					width: measuredSize.width,
					height: measuredSize.height
				};
			};

			this._addStyleableDomNode(textContainerDomNode);
			setStyle(textContainerDomNode, 'overflow', 'visible');
			this.wordWrap = true;
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,

		_getText: function() {
			var i,
				lineStartIndex = 0,
				currentIndex = 0,
				currentTabIndex,
				text = Locale._getString(this.textid, this.text);

			// Handle null, undefined, etc edge case
			if (text === void 0) {
				return '';
			}
			text += '';

			// Convert \t and \n to &nbsp;'s and <br/>'s
			while (currentIndex < text.length) {
				if (text[currentIndex] === '\t') {
					var tabSpaces = '',
						numSpacesToInsert = tabStop - (currentTabIndex) % tabStop;
					for (i = 0; i < numSpacesToInsert; i++) {
						tabSpaces += '&nbsp;';
					}
					text = text.substring(0, currentIndex) + tabSpaces + text.substring(currentIndex + 1);
					currentIndex += tabSpaces.length;
					currentTabIndex += numSpacesToInsert;
				} else if (text[currentIndex] === '\n') {
					text = text.substring(0, currentIndex) + '<br/>' + text.substring(currentIndex + 1);
					currentIndex += 5;
					lineStartIndex = currentIndex;
					currentTabIndex = 0;
				} else {
					currentIndex++;
					currentTabIndex++;
				}
			}

			text.match(/<br\/>$/) && (text += '&nbsp;');
			return text;
		},

		_setText: function() {
			this._textContainerDomNode.innerHTML = this._getText();
			this._triggerLayout();
		},

		_setTextShadow: function() {
			var shadowColor = this.shadowColor && this.shadowColor !== '' ? this.shadowColor : void 0;
			setStyle(
				this._textContainerDomNode,
				'textShadow',
				this.shadowOffset || shadowColor
					? (this.shadowOffset ? unitize(this.shadowOffset.x) + ' ' + unitize(this.shadowOffset.y) : '0px 0px') +
						' ' + (this.shadowRadius ? unitize(this.shadowRadius) : '0.1em') + ' ' + lang.val(shadowColor,'black')
					: ''
			);
		},

		properties: {
			ellipsize: {
				set: function(value) {
					setStyle(this._textContainerDomNode, 'textOverflow', !!value ? 'ellipsis' : 'clip');
					setStyle(this._textContainerDomNode, 'overflow', !!value ? 'hidden' : 'visible');
					return value;
				},
				value: true
			},
			html: {
				set: function(value) {
					this._textContainerDomNode.innerHTML = value;
					this._hasSizeDimensions() && this._triggerLayout();
					return value;
				}
			},
			shadowColor: {
				post: '_setTextShadow'
			},
			shadowOffset: {
				post: '_setTextShadow'
			},
			shadowRadius: {
				post: '_setTextShadow'
			},
			text: textPost,
			textAlign: {
				set: function(value) {
					setStyle(this._textContainerDomNode, 'textAlign', /(center|right)/.test(value) ? value : 'left');
					return value;
				}
			},
			textid: textPost,
			wordWrap: {
				set: function(value) {
					setStyle(this._textContainerDomNode, 'whiteSpace', !!value ? 'normal' : 'nowrap');
					return value;
				}
			},
			verticalAlign: {
				set: function(value) {
					var top,
						bottom,
						center = this.center || {},
						textContainer = this._textContainer;
					switch(value) {
						case UI.TEXT_VERTICAL_ALIGNMENT_TOP: top = 0; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_CENTER: center.y = '50%'; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: bottom = 0; break;
					}
					textContainer.top = top;
					textContainer.center = center;
					textContainer.bottom = bottom;
					return value;
				},
				value: UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			}
		}

	});

});