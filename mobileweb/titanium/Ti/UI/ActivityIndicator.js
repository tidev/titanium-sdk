define(["Ti/_/declare", "Ti/_/lang", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/style", "Ti/Locale", "Ti/UI"],
	function(declare, lang, FontWidget, dom, style, Locale, UI) {

	var opacity = 0.3,
		setStyle = style.set,
		postMessage = {
			post: "_renderMessage"
		};

	return declare("Ti.UI.ActivityIndicator", FontWidget, {

		constructor: function() {
			var prongs = this._prongs = [],
				container = this._contentContainer = dom.create("div", {
					className: "TiUIActivityIndicatorContentContainer",
					style: {
						boxOrient: "horizontal",
						boxPack: "center",
						boxAlign: "center",
						pointerEvents: "none"
					}
				}, this.domNode),
				indicator = this._indicatorIndicator = dom.create("div", {
					className: "TiUIActivityIndicatorIndicator",
					style: {
						pointerEvents: "none"
					}
				}, container),
				i = 0;

			for (; i < 12; i++) {
				prongs.push(dom.create("div", {
					className: "TiUIActivityIndicatorProng",
					style: {
						transform: "translate(16px,0px) rotate(" + i * 30 + "deg)",
						transformOrigin: "2px 18px",
						opacity: opacity
					}
				}, this._indicatorIndicator));
			}

			this._addStyleableDomNode(this._indicatorMessage = dom.create("div", {
				className: "TiUIActivityIndicatorMessage",
				style: {
					pointerEvents: "none"
				}
			}, container));
		},

		show: function() {
			if (!this._visible) {
				setStyle(this._contentContainer, "display", ["-webkit-box", "-moz-box"]);
				this._timer = setInterval(lang.hitch(this, "_animate"), 100);
				this._visible = 1;
			}
		},

		hide: function() {
			clearTimeout(this._timer);
			if (this._visible) {
				setStyle(this._contentContainer, "display", "none");
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

		_getContentSize: function(width, height) {
			var msg = this._getMessage();
			return {
				width: 36 + this._measureText(msg, this._indicatorMessage).width + this._messagePadding,
				height: Math.max(this._measureText(msg, this._indicatorMessage).height, 36)
			};
		},

		_getMessage: function() {
			return Locale._getString(this.messageid, this.message);
		},

		_renderMessage: function() {
			var msg = this._getMessage();
			this._messagePadding = msg ? 5 : 0;
			setStyle(this._indicatorMessage, "paddingLeft", dom.unitize(this._messagePadding));
			this._indicatorMessage.innerHTML = msg;
			this._hasSizeDimensions() && this._triggerLayout();
		},

		properties: {
			message: postMessage,
			messageid: postMessage
		}

	});

});