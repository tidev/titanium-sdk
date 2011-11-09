Ti._5.createClass('Titanium.UI.WebView', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'iframe', args, 'WebView');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	Ti._5.Clickable(this);
	// For width & height on iPhone
	this.dom.scrolling = "no";
		
	var _executeWhenLoaded = null;
	obj.dom.addEventListener('load', function (event) {
		if (!obj.dom.contentWindow) {
			obj.fireEvent('error', {
				sourse	: obj,
				message	: 'The page couldn`t be found',
				type	: 'error',
				url		: obj.url
			});
		} else {
			obj.fireEvent('load', {
				sourse	: obj,
				type	: 'load',
				url		: obj.url
			});
		}
		if ('function' == typeof _executeWhenLoaded) {
			_executeWhenLoaded(event);
			_executeWhenLoaded = null;
		}
	}, false);
	
	obj.dom.addEventListener('error', function (event) {
		obj.fireEvent('error', {
			sourse	: obj,
			message	: 'The page couldn`t be found',
			type	: 'error',
			url		: obj.url
		});
		if ('function' == typeof _executeWhenLoaded) {
			_executeWhenLoaded(event);
			_executeWhenLoaded = null;
		}
	}, false);
	
	// Properties
	// NOT IMPLEMENTED
	var _data = null;
	Object.defineProperty(this, 'data', {
		get: function(){return _data;},
		set: function(val){return _data = val;}
	});

	Object.defineProperty(this, 'html', {
		get: function() {
			try {
				return obj.dom.contentWindow.document.body.innerHTML;
			} catch (error) {
				obj.fireEvent('error', {
					message	: error.description ? error.description : error,
					sourse	: obj,
					type	: 'error',
					url		: obj.url
				});
				return "";
			} 
		},
		set: function(val) {
			obj.dom.src = 'about:blank';
			_loading = true;
			_executeWhenLoaded = function () {
				// We need some delay, when setting window html from constructor
				setTimeout(function() {
					obj.dom.contentWindow.document.body.innerHTML = val;
					_loading = false;
				}, 0);
			};
		}
	});

	var _loading = false;
	Object.defineProperty(this, 'loading', {
		get: function(){return _loading;},
		set: function(val){return false;}
	});

	// NOT IMPLEMENTED
	Object.defineProperty(this, 'scalesPageToFit', {
		get: function(){return _scalesPageToFit;},
		set: function(val){return _scalesPageToFit = val;}
	});
	
	var _url = "";
	Object.defineProperty(this, 'url', {
		get: function(){return _url;},
		set: function(val){
			if (val.substring(0,1) == '/'){
				val = val.substring(1);
			}
			obj.fireEvent('beforeload', {
				sourse	: obj,
				type	: 'beforeload',
				url		: val
			});
			_loading = true;
			_url
			obj.dom.src = Ti._5.getAbsolutePath(val);
			_executeWhenLoaded = function () {
				_loading = false;
			};
		}
	});
	
	Object.defineProperty(this, 'size', {
		get: function() {
			return {
				width	: obj.width,
				height	: obj.height
			}
		},
		set: function(val) {
			if (val.width) {
				obj.width = Ti._5.parseLength(val.width);
			}
			if (val.height) {
				obj.height = Ti._5.parseLength(val.height);
			}
		}
	});
	
	Ti._5.preset(this, ["url", "loading", "size", "html"], args);
	Ti._5.presetUserDefinedElements(this, args);

	// Methods
	this.canGoBack = function() {
		return obj.dom.contentWindow && obj.dom.contentWindow.history && obj.url ? true : false;
	};
	this.canGoForward = function() {
		return obj.dom.contentWindow && obj.dom.contentWindow.history && obj.url ? true : false;
	};
	this.evalJS = function(sJScript){
		if (obj.dom.contentWindow.eval) {
			return obj.dom.contentWindow.eval(sJScript);
		} else {
			return "";
		}
	};
	this.goBack = function() {
		if (this.canGoBack()) {
			obj.dom.contentWindow.history.back();
		}
	};
	this.goForward = function(){
		if (this.canGoForward()) {
			obj.dom.contentWindow.history.forward();
		}
	};
	this.reload = function(){
		if (obj.url) {
			obj.url = obj.url;
		} else if (obj.html) {
			obj.html = obj.html;
		}
	};
	this.repaint = function() {
		this.reload();
	};
	this.setBasicAuthentication = function(){
		console.debug('Method "Titanium.UI.WebView#.setBasicAuthentication" is not implemented yet.');
	};
	this.stopLoading = function(){
		// we have no permission to stop loading current iframe, so we can only stop loading all frames in window
		window.stop();
	};
});