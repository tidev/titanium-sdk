Ti._5.createClass('Titanium.UI.Window', function(args){
	var obj = this;
	this._isBack = false;
	// set defaults
	args = Ti._5.extend({}, args);
	args.unselectable = true;

	var _isHTMLPage = function(url){
		return _url != null && (_url.indexOf('htm') != -1 || _url.indexOf('http') != -1);
	};
	
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'Window');
	Ti._5.Screen(this, args);
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	Ti._5.Clickable(this);
	Ti._5.Interactable(this, true);

	// Properties
	this.backButtonTitle = null;
	this.backButtonTitleImage = null;
	this.barColor = null;
	this.barImage = null;
	this.exitOnClose = null;
	this.fullscreen = false;
	this.leftNavButton = null;
	
	Ti._5.member(this, 'modal');

	Ti._5.member(this, 'navBarHidden');

	this.orientationModes = [];

	this.rightNavButton = null;
	this.softInputMode = null;

	Ti._5.member(this, 'tabBarHidden');

	this.titleControl = null;
	this.titleImage = null;
	this.titlePrompt = null;

	var _titleid = null;
	Ti._5.prop(this, 'titleid', {
		get: function(){return _titleid;},
		set: function(val){_titleid = val; return obj.title = L(val);}
	});

	var _titlepromptid = null;
	Ti._5.prop(this, 'titlepromptid', {
		get: function(){return _titlepromptid;},
		set: function(val){
			obj.titlePrompt = L(val);
			return _titlepromptid = val;
		}
	});

	this.toolbar = null;
	this.translucent = null;

	var _url = null;
	Ti._5.prop(this, 'url', {
		get: function(){return _url;},
		set: function(val){
			_url = val;
			if (_isHTMLPage()) {
				window.location.href = Ti._5.getAbsolutePath(_url);
			} else {
				// We need this for proper using window.open in code
				setTimeout(function(){
					var prevWindow = Ti.UI.currentWindow;
					Ti.UI.currentWindow = obj;
					Ti.include(_url);
					Ti.UI.currentWindow = prevWindow;
				}, 0); 
			}
			return _url;
		}
	});

	var _oldShow = this.show;
	this.show = function(){
		_oldShow();
		_setMinHeight();
	};

	var _oldHide = this.hide;
	this.hide = function(){
		obj.fireEvent("blur", {source: obj.dom, type: "blur"});
		_oldHide();
	};
	// Methods
	this.addEventListener('screen_open', function(){
		Ti.UI.currentWindow = obj;
		obj.render(null);
		_setTitle();
		obj.fireEvent("open", {source: null, type: "open"});
		obj.fireEvent("focus", {source: obj.dom, type: "focus"});
	});
	this.addEventListener('screen_close', function(){
		obj.fireEvent("blur", {source: obj.dom, type: "blur"});
		obj.fireEvent("close", {source: null, type: "close"});
		if(!_isHTMLPage()){
			// remove script include
			var head = document.getElementsByTagName('head')[0];
			head.removeChild(head.children[head.children.length - 1]);
		}
	});
	this.open = function(){
		obj.screen_open();
	};

	this.close = function(){
		obj.screen_close();
	};

	Ti._5.prop(this, 'size', {
		get: function() {
			return {
				width	: obj.width,
				height	: obj.height
			}
		},
		set: function(val) {
			if (val.width) {
				obj.width = val.width;
			}
			if (val.height) {
				obj.height = val.height;
			}
			return val;
		}
	});

	var _setTitle = function(){
		if(Ti.UI.currentWindow === obj){
			document.title = obj.title != null ? obj.title : Ti._5.getArguments().projectName;
		}
	};
	
	var _title;
	Ti._5.prop(this, 'title', {
		get: function() {
			return _title;
		},
		set: function(val) {
			_title = val;
			_setTitle();
			return _title;
		}
	});

	require.mix(this, args);
	
	function _setMinHeight(oSource) {
		oSource = oSource || obj;
		if (!oSource.dom) {
			return;
		}
		// Set min window height for preventing window heights be smaller then sum of all window children heights  
		var oElOffset = Ti._5._getElementOffset(oSource.dom);
		//obj.dom.style.minHeight = (oElOffset.height - oElOffset.top) + 'px';
		obj.dom.style.minHeight = oElOffset.height + 'px';
	}

	var _oldRender = obj.render;
	obj.render = function(parent) {
		_oldRender(parent);
		// Get first element margin
		var _maxChildrenHeight = 0;
		if (obj._children) {
			var _padding = 0;
			if (obj._children[0] && obj._children[0].dom) {
				_padding = parseInt(obj._children[0].dom.style.marginTop);
			}
			obj.dom.style.paddingTop = _padding + 'px';
			for (var c=0;c<obj._children.length;c++) {
				obj._children[c].render(obj);
			}
		}
		_setMinHeight(obj);
	};
	
	obj.addEventListener('html5_child_rendered', function () {
		// Give some time to browser to render the page
		setTimeout(_setMinHeight, 100);
	}, false);
	window.addEventListener('resize', function () {_setMinHeight();}, false);
	window.addEventListener('load', function () {_setMinHeight();}, false);
});
