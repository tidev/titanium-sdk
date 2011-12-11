Ti._5.createClass("Titanium.UI.WebView", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(this, "iframe", args, "WebView"),
		_executeWhenLoaded = null,
		_loading = false,
		_url = "";

	// Interfaces
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	Ti._5.Clickable(this);

	// For width & height on iPhone
	domNode.scrolling = "no";

	require.on(domNode, "load", function(evt) {
		if (!domNode.contentWindow) {
			obj.fireEvent("error", {
				message	: "The page couldn`t be found",
				url		: obj.url
			});
		} else {
			obj.fireEvent("load", {
				url: obj.url
			});
		}
		if (require.is(_executeWhenLoaded, "Function")) {
			_executeWhenLoaded(evt);
			_executeWhenLoaded = null;
		}
	});

	require.on(domNode, "error", function(evt) {
		obj.fireEvent("error", {
			message	: "The page couldn't be found",
			url		: obj.url
		});
		if ("function" == typeof _executeWhenLoaded) {
			_executeWhenLoaded(evt);
			_executeWhenLoaded = null;
		}
	});
	
	// Properties
	// NOT IMPLEMENTED
	Ti._5.prop(this, {
		"data": null,
		"html": {
			get: function() {
				try {
					return domNode.contentWindow.document.body.innerHTML;
				} catch (ex) {
					obj.fireEvent("error", {
						message	: ex.description || ex,
						url		: obj.url
					});
					return "";
				} 
			},
			set: function(val) {
				domNode.src = "about:blank";
				_loading = true;
				_executeWhenLoaded = function () {
					// We need some delay, when setting window html from constructor
					setTimeout(function() {
						domNode.contentWindow.document.body.innerHTML = val;
						_loading = false;
					}, 0);
				};
			}
		},
		"scalesPageToFit": null,
		"size": {
			get: function() {
				return {
					width	: obj.width,
					height	: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		"url": {
			get: function(){return _url;},
			set: function(val){
				if (val.substring(0,1) == "/"){
					val = val.substring(1);
				}
				obj.fireEvent("beforeload", {
					url: val
				});
				_loading = true;
				domNode.src = Ti._5.getAbsolutePath(val);
				_executeWhenLoaded = function() {
					_loading = false;
				};
			}
		}
	});

	Ti._5.propReadOnly(this, "loading", {
		get: function(){return _loading;}
	});

	require.mix(this, args);

	// Methods
	this.canGoBack = function() {
		return domNode.contentWindow && domNode.contentWindow.history && !!obj.url;
	};
	this.canGoForward = function() {
		return domNode.contentWindow && domNode.contentWindow.history && !!obj.url;
	};
	this.evalJS = function(sJScript){
		return domNode.contentWindow.eval ? domNode.contentWindow.eval(sJScript) : "";
	};
	this.goBack = function() {
		this.canGoBack() && domNode.contentWindow.history.back();
	};
	this.goForward = function(){
		this.canGoForward() && domNode.contentWindow.history.forward();
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