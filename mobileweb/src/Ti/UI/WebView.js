define("Ti/UI/WebView", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, Widget, dom, css, style) {

	var set = style.set,
        undef;

	return declare("Ti.UI.WebView", Widget, {
		
		constructor: function(args) {
			this._iframe = dom.create("iframe", {
				className: css.clean("TiUIWebViewIFrame")
			});
			this.domNode.appendChild(this._iframe);
			set(this._iframe,"width","100%");
			set(this._iframe,"height","100%");
		},
		
		canGoBack: function(x,y) {
			console.debug('Method "Titanium.UI.WebView#.canGoBack" is not implemented yet.');
		},
		
		canGoForward: function(x,y) {
			console.debug('Method "Titanium.UI.WebView#.canGoForward" is not implemented yet.');
		},
		
		evalJS: function(x,y) {
			console.debug('Method "Titanium.UI.WebView#.evalJS" is not implemented yet.');
		},
		
		goBack: function(x,y) {
			this._iframe.contentWindow.history.go(-1);
		},
		
		goForward: function(x,y) {
			this._iframe.contentWindow.history.go(1);
		},
		
		reload: function(x,y) {
			this._iframe.contentWindow.location.reload(true);
		},
		
		repaint: function(x,y) {
			console.debug('Method "Titanium.UI.WebView#.repaint" is not implemented yet.');
		},
		
		stopLoading: function(x,y) {
			console.debug('Method "Titanium.UI.WebView#.stopLoading" is not implemented yet.');
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",
		_getContentWidth: function() {
			return this._iframe.clientWidth;
		},
		_getContentHeight: function() {
			return this._iframe.clientHeight;
		},
		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this,arguments);
			this.slider && set(this._iframe,"pointerEvents", value ? "auto" : "none");
		},
		
		properties: {
			data: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.WebView#.data" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.WebView#.data" is not implemented yet.');
					return value;
				}
			},
			
			html: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.WebView#.html" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.WebView#.html" is not implemented yet.');
					return value;
				}
			},
			
			loading: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.WebView#.loading" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.WebView#.loading" is not implemented yet.');
					return value;
				}
			},
			
			url: { 
				set: function(value) {
					this._iframe.src = value;
					return value;
				}
			}
		}

	});

});