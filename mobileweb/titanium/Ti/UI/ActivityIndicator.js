define(["Ti/_/declare", "Ti/_/lang", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/style", "Ti/Locale", "Ti/UI"],
	function(declare, lang, Widget, dom, style, Locale, UI) {

	var opacity = 0.3,
		setStyle = style.set;

	return declare("Ti.UI.ActivityIndicator", Widget, {

		constructor: function() {
			var prongs = this._prongs = [],
				i = 0,
				contentContainer = this._contentContainer = UI.createView({
					layout: UI._LAYOUT_CONSTRAINING_HORIZONTAL,
					width: UI.SIZE,
					height: UI.SIZE
				});
			this._add(contentContainer);
			contentContainer.hide();
				
			contentContainer._add(this._indicatorIndicator = UI.createView({
				width: 36,
				height: 36
			}));
				
			contentContainer._add(this._indicatorMessage = UI.createLabel());

			for (; i < 12; i++) {
				prongs.push(dom.create("div", {
					className: "TiUIActivityIndicatorProng",
					style: {
						transform: "translate(16px,0px) rotate(" + i * 30 + "deg)",
						transformOrigin: "2px 18px",
						opacity: opacity
					}
				}, this._indicatorIndicator.domNode));
			}
		},

		show: function() {
			if (!this._visible) {
				this._contentContainer.show();
				this._timer = setInterval(lang.hitch(this, "_animate"), 100);
				this._visible = 1;
			}
		},

		hide: function() {
			clearTimeout(this._timer);
			if (this._visible) {
				this._contentContainer.hide();
				this._visible = 0;
			}
		},

		_currentProng: 0,

		_animate: function() {
			var prong = this._prongs[this._currentProng];
			++this._currentProng == 12 && (this._currentProng = 0);
			setStyle(prong, "transition", "");
			setTimeout(function() {
				setStyle(prong, "opacity", 1);
				setTimeout(function() {
					setStyle(prong, "transition", "opacity 500ms linear 0ms");
					setTimeout(function() {
						setStyle(prong, "opacity", opacity);
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
			}
		}

	});

});