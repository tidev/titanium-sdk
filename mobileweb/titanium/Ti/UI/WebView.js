/*global define, window*/
define(['Ti/_/declare', 'Ti/UI/View', 'Ti/_/dom', 'Ti/_/event', 'Ti/_/lang', 'Ti/_/text!Ti/_/UI/WebViewBridge.js', 'Ti/App', 'Ti/API', 'Ti/UI', 'Ti/_/style'],
	function(declare, View, dom, event, lang, bridge, App, API, UI, style) {

	var on = require.on;

	return declare('Ti.UI.WebView', View, {

		constructor: function() {
			App.addEventListener(this.widgetId + ':unload', lang.hitch(this, function() {
				this._loading(1);
			}));
			this.backgroundColor = '#fff';
			style.set(this.domNode, {
				overflow: 'auto',
				overflowScrolling: 'touch'
			});
		},

		destroy: function() {
			App.removeEventListener(this.widgetId + ':unload');
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
				var url = this.url || '',
					match = url.match(/(https?)\:\/\/([^\:\/]*)(:?\d*)(.*)/),
					loc = window.location,
					isSameDomain = !match || (match[0] + ':' === loc.protocol && match[1] + match[2] === window.location.host),
					iframe = this._iframe = dom.create('iframe', {
						frameborder: 0,
						marginwidth: 0,
						marginheight: 0,
						hspace: 0,
						vspace: 0,
						scrolling: this.showScrollbars ? 'auto' : 'no',
						src: url || require.toUrl('Ti/_/UI/blank.html'),
						style: {
							width: '100%',
							height: '100%',
							position: 'absolute'
						}
					}, this.domNode);

				this._iframeHandles = [
					on(iframe, 'load', this, function() {
						var i = Math.max(isSameDomain | 0, 0),
							cw = iframe.contentWindow,
							prop,
							url,
							html;

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
							this.evalJS(bridge.replace('WEBVIEW_ID', this.widgetId + ':unload'));
							(html = this.__values__.properties.html) && this._setContent(html);
						} else {
							API.warn('Unable to inject WebView bridge into cross-domain URL, ignore browser security message');
						}

						this._loading();
						this.fireEvent('load', {
							url: url ? (this.__values__.properties.url = url) : this.url
						});
					}),
					on(iframe, 'error', this, function() {
						this._loading();
						this.fireEvent('error', {
							message: 'Page failed to load',
							url: this.url
						});
					})
				];

				return 1;
			}
		},

		_setParent: function() {
			View.prototype._setParent.apply(this, arguments);

			// we are being added to a parent, need to manually fire
			(this.url || this.html) && this._createIFrame();
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
			this.loading || v && this.fireEvent('beforeload', {
				url: this.url
			});
			this.__values__.constants.loading = !!v;
		},

		canGoBack: function() {
			return this.url && !!this._getHistory().length;
		},

		canGoForward: function() {
			return this.url && !!this._getHistory().length;
		},

		evalJS: function(js) {
			var w = this._getWindow(),
				r = null;
			try {
				r = js && w && w.eval && w.eval(js);
			} catch (e) {}
			return r;
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

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		_getContentSize: function() {
			return {
				width: this._iframe ? this._iframe.clientWidth : 0,
				height: this._iframe ? this._iframe.clientHeight : 0
			};
		},

		_setContent: function(value) {
			try {
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
					var data = value;
					switch (data && data.declaredClass) {
						case 'Ti.Filesystem.File':
							data = data.read();
						case 'Ti.Blob':
							data = data.toString();
						default:
							this.html = data;
					}
					return value;
				}
			},

			html: {
				get: function(value) {
					var doc = this._iframe && this._getDoc();
					return value === void 0 && doc ? doc.documentElement.innerHTML : value;
				},
				post: function(value) {
					var values = this.__values__.properties;
					values.data = void 0;
					values.url = void 0;
					this._createIFrame() && this._setContent(value);
				}
			},

			showScrollbars: {
				set: function(value) {
					this._iframe && dom.attr.set(this._iframe, 'scrolling', value ? 'auto' : 'no');
					return value;
				},
				value: true
			},

			url: {
				post: function() {
					var values = this.__values__.properties;
					values.data = void 0;
					values.html = void 0;
					this._createIFrame();
				}
			}
		},

		constants: {
			loading: false
		}

	});

});