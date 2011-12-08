Ti._5.createClass('Titanium.UI.Window', function(args){
	var obj = this;
	this._isBack = false;
	
	// Set defaults
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	args.width = args.width || '100%';
	args.height = args.height || '100%';

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
	var _modal = null;
	Object.defineProperty(this, 'modal', {
		get: function(){return _modal;},
		set: function(val){return _modal = val;}
	});

	var _navBarHidden = null;
	Object.defineProperty(this, 'navBarHidden', {
		get: function(){return _navBarHidden;},
		set: function(val){return _navBarHidden = val;}
	});

	this.orientationModes = [];

	this.rightNavButton = null;
	this.softInputMode = null;

	var _tabBarHidden = null;
	Object.defineProperty(this, 'tabBarHidden', {
		get: function(){return _tabBarHidden;},
		set: function(val){return _tabBarHidden = val;}
	});

	this.titleControl = null;
	this.titleImage = null;
	this.titlePrompt = null;

	var _titleid = null;
	Object.defineProperty(this, 'titleid', {
		get: function(){return _titleid;},
		set: function(val){_titleid = val; obj.title = L(val);}
	});

	var _titlepromptid = null;
	Object.defineProperty(this, 'titlepromptid', {
		get: function(){return _titlepromptid;},
		set: function(val){
			obj.titlePrompt = L(val);
			return _titlepromptid = val;
		}
	});

	this.toolbar = null;
	this.translucent = null;

	var _url = null;
	Object.defineProperty(this, 'url', {
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
		}
	});

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

	Object.defineProperty(this, 'size', {
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
		}
	});

	var _setTitle = function(){
		if(Ti.UI.currentWindow === obj){
			document.title = obj.title != null ? obj.title : Ti._5.getArguments().projectName;
		}
	};
	
	var _title;
	Object.defineProperty(this, 'title', {
		get: function() {
			return _title;
		},
		set: function(val) {
			_title = val;
			_setTitle();
		}
	});

	Ti._5.preset(this, ["url", "size", "title"], args);
	Ti._5.presetUserDefinedElements(this, args);
});
