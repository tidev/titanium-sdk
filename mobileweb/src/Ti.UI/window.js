Ti._5.createClass("Ti.UI.Window", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "Window"),
		domStyle = domNode.style,
		_titleid = null,
		_titlepromptid = null,
		_url = null,
		_title;

	function isHTMLPage(){
		return _url != null && (_url.indexOf("htm") != -1 || _url.indexOf("http") != -1);
	}

	// Interfaces
	Ti._5.Screen(obj, args);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
	Ti._5.Clickable(obj);
	Ti._5.Interactable(obj, true);

	// Properties
	Ti._5.prop(obj, {
		backButtonTitle: null,
		backButtonTitleImage: null,
		barColor: null,
		barImage: null,
		exitOnClose: null,
		fullscreen: false,
		leftNavButton: null,
		modal: null,
		navBarHidden: null,
		orientationModes: [],
		rightNavButton: null,
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		softInputMode: null,
		tabBarHidden: null,
		titleControl: null,
		title: {
			get: function() {
				return _title;
			},
			set: function(val) {
				_title = val;
				setTitle();
			}
		},
		titleid: {
			get: function(){return _titleid;},
			set: function(val){obj.title = L(_titleid = val);}
		},
		titleImage: null,
		titlePrompt: null,
		titlepromptid: {
			get: function(){return _titlepromptid;},
			set: function(val){
				obj.titlePrompt = L(_titlepromptid = val);
			}
		},
		toolbar: null,
		translucent: null,
		url: {
			get: function(){return _url;},
			set: function(val){
				_url = val;
				if (isHTMLPage()) {
					window.location.href = Ti._5.getAbsolutePath(_url);
				} else {
					// We need this for proper using window.open in code
					setTimeout(function(){
						var prevWindow = Ti.UI.currentWindow;
						Ti.UI.currentWindow = obj;
						require("include!sandbox!" + _url);
						Ti.UI.currentWindow = prevWindow;
					}, 1);
				}
			}
		}
	});

	var _oldHide = obj.hide; // WARNING: this may cause problems
	obj.hide = function() {
		obj.fireEvent("blur", {source: domNode});
		_oldHide();
	};

	function setTitle() {
		Ti.UI.currentWindow === obj && (document.title = obj.title != null ? obj.title : Ti._5.getArguments().projectName);
	}

	// Methods
	obj.addEventListener("screen_open", function() {
		Ti.UI.currentWindow = obj;
		obj.render(null);
		setTitle();
		obj.fireEvent("open", {source: null});
		obj.fireEvent("focus", {source: domNode});
	});
	obj.addEventListener("screen_close", function() {
		obj.fireEvent("blur", {source: domNode});
		obj.fireEvent("close", {source: null});
		if(!isHTMLPage()){
			// remove script include
			var head = document.getElementsByTagName("head")[0];
			head.removeChild(head.children[head.children.length - 1]);
		}
	});
	obj.open = function(){
		obj.screen_open();
	};

	obj.close = function(){
		obj.screen_close();
	};

	require.mix(obj, args);

	function setMinHeight(oSource) {
		oSource = oSource || obj;
		if (!oSource.dom) {
			return;
		}
		// Set min window height for preventing window heights be smaller then sum of all window children heights  
		var oElOffset = Ti._5._getElementOffset(oSource.dom);
		//domStyle.minHeight = (oElOffset.height - oElOffset.top) + "px";
		domStyle.minHeight = oElOffset.height + "px";
	}

	var _oldRender = obj.render; // WARNING: this may cause problems
	obj.render = function(parent) {
		_oldRender(parent);
		// Get first element margin
		var _maxChildrenHeight = 0;
		if (obj._children) {
			var _padding = 0;
			if (obj._children[0] && obj._children[0].dom) {
				_padding = parseInt(obj._children[0].dom.style.marginTop);
			}
			domStyle.paddingTop = _padding + "px";
			for (var c=0;c<obj._children.length;c++) {
				obj._children[c].render(obj);
			}
		}
		setMinHeight(obj);
	};
	
	obj.addEventListener("html5_child_rendered", function () {
		// Give some time to browser to render the page
		setTimeout(setMinHeight, 100);
	});

	require.on(window, "resize", function() {setMinHeight();});
	require.on(window, "load", function() {setMinHeight();});
});
