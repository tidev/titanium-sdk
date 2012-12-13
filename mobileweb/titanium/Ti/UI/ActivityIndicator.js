define(['Ti/_/declare', 'Ti/_/lang', 'Ti/_/UI/Widget', 'Ti/_/dom', 'Ti/_/style', 'Ti/Locale', 'Ti/UI', 'Ti/UI/ActivityIndicatorStyle'],
	function(declare, lang, Widget, dom, style, Locale, UI, ActivityIndicatorStyle) {

	var opacity = 0.3,
		setStyle = style.set;

	return declare('Ti.UI.ActivityIndicator', Widget, {

		constructor: function() {
			var contentContainer = this._contentContainer = UI.createView({
					layout: UI._LAYOUT_CONSTRAINING_HORIZONTAL,
					width: UI.SIZE,
					height: UI.SIZE
				});
			this._add(contentContainer);

			Widget.prototype.hide.call(this);

			contentContainer._add(this._indicatorIndicator = UI.createView());
			contentContainer._add(this._indicatorMessage = UI.createLabel());

			this._createProngs();
		},

		_createProngs: function() {

			var i = 0,
				prongs = this._prongs = [],
				indicator = this._indicatorIndicator,
				indicatorDomNode = indicator.domNode,
				backgroundColor = this.indicatorColor,
				diameter = this.indicatorDiameter,
				scale = diameter / 36,
				prongContainer;

			// Set the container size
			indicator.width = indicator.height = diameter;

			// Remove any old children
			while (indicatorDomNode.firstChild) {
				indicatorDomNode.removeChild(indicatorDomNode.firstChild);
			}

			// Add the prong container
			prongContainer = dom.create('div', {
				className: 'TiUIActivityIndicatorProngContainer',
				style: {
					transformOrigin: '0px 0px',
					transform: 'scale(' + scale + ')'
				}
			}, indicatorDomNode);

			// Add the new prongs
			for (; i < 12; i++) {
				prongs.push(dom.create('div', {
					className: 'TiUIActivityIndicatorProng',
					style: {
						transform: 'translate(16px,0px) rotate(' + i * 30 + 'deg)',
						transformOrigin: '2px 18px',
						opacity: opacity,
						backgroundColor: backgroundColor
					}
				}, prongContainer));
			}
		},

		show: function() {
			Widget.prototype.show.call(this);
			this._timer = setInterval(lang.hitch(this, '_animate'), 100);
		},

		hide: function() {
			clearTimeout(this._timer);
			Widget.prototype.hide.call(this);
		},

		_currentProng: 0,

		_animate: function() {
			var prong = this._prongs[this._currentProng];
			++this._currentProng == 12 && (this._currentProng = 0);
			setStyle(prong, 'transition', '');
			setTimeout(function() {
				setStyle(prong, 'opacity', 1);
				setTimeout(function() {
					setStyle(prong, 'transition', 'opacity 500ms linear 0ms');
					setTimeout(function() {
						setStyle(prong, 'opacity', opacity);
					}, 1);
				}, 1);
			}, 1);
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,

		_messagePadding: 0,

		properties: {
			color: {
				set: function(value) {
					return this._indicatorMessage.color = value;
				}
			},
			font: {
				set: function(value) {
					return this._indicatorMessage.font = value;
				}
			},
			indicatorColor: {
				post: '_createProngs',
				value: '#fff'
			},
			indicatorDiameter: {
				post: '_createProngs',
				value: 36
			},
			message: {
				set: function(value) {
					var indicatorMessage = this._indicatorMessage;
					indicatorMessage.left = value ? 5 : 0;
					return indicatorMessage.text = value;
				}
			},
			messageid: {
				set: function(value) {
					var indicatorMessage = this._indicatorMessage;
					indicatorMessage.left = value ? 5 : 0;
					return indicatorMessage.textid = value;
				}
			},
			style: {
				set: function(value) {
					if (~[ActivityIndicatorStyle.DARK, ActivityIndicatorStyle.BIG_DARK].indexOf(value)) {
						this.indicatorColor = '#444';
					} else {
						this.indicatorColor = '#fff';
					}
					if (~[ActivityIndicatorStyle.BIG, ActivityIndicatorStyle.BIG_DARK].indexOf(value)) {
						this.indicatorDiameter = 72;
					} else {
						this.indicatorDiameter = 36;
					}
				}
			}
		}

	});
});