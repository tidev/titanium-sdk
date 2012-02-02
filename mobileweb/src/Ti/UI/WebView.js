define("Ti/UI/WebView",
	["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/_/text!Ti/_/UI/WebViewBridge.js"],
	function(declare, Widget, dom, event, lang, bridge) {

	var on = require.on;

	return declare("Ti.UI.WebView", Widget, {

		constructor: function() {
			Ti.App.addEventListener(this.widgetId + ":unload", lang.hitch(this, function() {
				this._loading(1);
			}));
		},

		destroy: function() {
			Ti.App.removeEventListener(this.widgetId + ":unload");
			this._destroy();
			Widget.prototype.destroy.apply(this, arguments);
		},

		_destroy: function() {
			if (this._iframe) {
				event.off(this._iframeHandles);
				dom.destroy(this._iframe);
			}
		},

		_createIFrame: function() {
			if (this._parent) {
				this._destroy();
				this._loading(1);

				var url = this.url,
					match = this.url.match(/(https?)\:\/\/([^\:\/]*)(:?\d*)(.*)/),
					loc = window.location,
					isSameDomain = match && match[0] + ":" === loc.protocol && match[1] + match[2] === window.location.host,
					iframe = this._iframe = dom.create("iframe", {
						frameborder: 0,
						marginwidth: 0,
						marginheight: 0,
						hspace: 0,
						vspace: 0,
						scrolling: this.showScrollbars ? "auto" : "no",
						src: url,
						style: {
							width: "100%",
							height: "100%"
						}
					}, this.domNode);

				this._iframeHandles = [
					require.on(iframe, "load", this, function(evt) {
						var i = Math.max(isSameDomain | 0, 0),
							cw = iframe.contentWindow,
							prop,
							url;

						if (i !== -1) {
							// we can always guarantee that the first load we'll know if it's the same domain
							isSameDomain = -1;
						} else {
							// for every load after the first, we need to try which will throw security errors
							for (prop in cw) {
								i++;
								break;
							}
						}

						if (i > 0) {
							url = cw.location.href;
							this.evalJS(bridge.replace("WEBVIEW_ID", this.widgetId + ":unload"));
						} else {
							Ti.API.warn("Unable to inject WebView bridge into cross-domain URL, ignore browser security message");
						}

						this._loading();
						this.fireEvent("load", {
							url: url ? (this.properties.__values__.url = url) : this.url
						});
					}),
					require.on(iframe, "error", this, function() {
						this._loading();
						this.fireEvent("error", {
							message: "Page failed to load",
							url: this.url
						});
					})
				];
			}
		},

		_setParent: function(view) {
			Widget.prototype._setParent.apply(this, arguments);

			// we are being added to a parent, need to manually fire
			this.url && this._createIFrame();
		},

		_getWindow: function() {
			return this._iframe.contentWindow;
		},

		_getDoc: function() {
			return this._getWindow().document;
		},

		_getHistory: function() {
			return this._getWindow().history;
		},

		_loading: function(v) {
			this.loading || v && this.fireEvent("beforeload", {
				url: this.url
			});
			this.constants.loading = !!v;
		},

		canGoBack: function() {
			return this.url && this._getHistory().length;
		},

		canGoForward: function() {
			return this.url && this._getHistory().length;
		},

		evalJS: function(js) {
			var w = this._getWindow();
			return js && w && w.eval && w.eval(js);
		},

		goBack: function() {
			if (this.canGoBack()) {
				var h = this._getHistory();
				if (h) {
					this._loading(1);
					h.go(-1);
				}
			}
		},

		goForward: function() {
			if (this.canGoForward()) {
				var h = this._getHistory();
				if (h) {
					this._loading(1);
					h.go(1);
				}
			}
		},

		reload: function() {
			var w = this._getWindow();
			this.url && w ? (w.location.href = this.url) : this._createIFrame();
		},

		stopLoading: function(hardStop) {
			try {
				this.loading && hardStop ? this._destroy() : this._getWindow().stop();
			} catch (e) {}
			this._loading();
		},

		_defaultWidth: "100%",

		_defaultHeight: "100%",

		_getContentHeight: function() {
			return this._iframe ? this._iframe.clientHeight : 0;
		},

		_getContentWidth: function() {
			return this._iframe ? this._iframe.clientWidth : 0;
		},

		_setContent: function(value) {
			try {
				this.properties.__values__.url = "";
				this._createIFrame();
				var doc = this._getDoc();
				doc.open();
				doc.write(value);
				doc.close();
			} catch (e) {}
			return value;
		},

		properties: {
			data: {
				set: function(value) {
					return this._setContent(value);
				}
			},

			html: {
				set: function(value) {
					return this._setContent(value);
				}
			},

			showScrollbars: {
				set: function(value) {
					this._iframe && dom.attr.set(this._iframe, "scrolling", value ? "auto" : "no");
					return value;
				},
				value: true
			},

			url: { 
				post: function(value) {
					this._createIFrame();
				}
			}
		},

		constants: {
			loading: false
		}

	});

});