Ti._5.createClass("Ti.UI.TableViewRow", function(args){
	args = require.mix({
		backgroundColor: "transparent",
		font: require.mix({
			fontFamily: "Helvetica",
			fontSize: 20,
			fontStyle: "normal",
			fontVariant: "normal",
			fontWeight: "bold"
		}, args && args.font),
		unselectable: true,
		width: "100%"
	}, args);

	var undef,
		obj = this,
		domNode = Ti._5.DOMView(obj, "li", args, "TableViewRow"),
		domStyle = domNode.style,
		on = require.on,
		px = Ti._5.px;

	obj._rowData = args || {};

	// Interfaces
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Set needed style rules
	//domStyle.display = "table-cell";
	domStyle.lineHeight = args["height"] ? args["height"] : "50px";

	// use single DOM element for all row states - this is required to show only one state at a time and avoid creating
	// too many DOM elements
	var _stateObj = document.createElement("div"),
		// stack for holding states
		_statesStack = [],
		_colorRow = "#000000",
		_hasCheck,
		_hasChild,
		_hasDetail,
		_indentionLevel = 0,
		_leftImage = null,
		_leftImageObj = null,
		_rightImage = null,
		_rightImageObj = null,
		_selectionStyle = null,
		_title = "",
		_titleObj = document.createElement("span"),
		_height;

	_stateObj.className = "";

	domNode.appendChild(_titleObj);

	// remove given state from stack
	function _removeFromStack(state){
		var res = [];
		for(var ii = 0; ii < _statesStack.length; ii++){
			var val = _statesStack[ii];
			if(val != state){
				res.push(val);
			}
		}
		_statesStack = res;
	}

	// add new state - visualize latest available state
	function _addState(state){
		if(_stateObj.className == state){
			// do nothing if already in this state
			return;
		}
		if(_stateObj.className != ""){
			_statesStack.push(_stateObj.className);
		}
		_removeFromStack(state);
		_stateObj.className = state;
		domNode.appendChild(_stateObj);
	}

	// remove given state
	function _removeState(state){
		if(_stateObj.className != ""){
			_statesStack.push(_stateObj.className);
		}
		_removeFromStack(state);
		if(_statesStack.length > 0){
			_stateObj.className = _statesStack[_statesStack.length - 1];
		} else if(_stateObj.parentNode == domNode){
			domNode.removeChild(_stateObj);
		}
	}

	// Properties
	Ti._5.prop(obj, {
		backgroundDisabledColor: undef,
		backgroundDisabledImage: undef,
		className: undef,
		color: {
			get: function(){return _colorRow;},
			set: function(val){
				domStyle.color = _colorRow = val;
			}
		},
		hasCheck: {
			get: function(){return _hasCheck;},
			set: function(val){
				_hasCheck = val;
				if(val){
					_addState("hasCheck");
				} else {
					_removeState("hasCheck");
				}
			}
		},
		hasChild: {
			get: function(){return _hasChild;},
			set: function(val){
				_hasChild = val;
				if(val){
					_addState("hasChild");
				} else {
					_removeState("hasChild");
				}
			}
		},
		hasDetail: {
			get: function(){return _hasDetail;},
			set: function(val){
				_hasDetail = val;
				if(val){
					_addState("hasDetail");
				} else {
					_removeState("hasDetail");
				}
			}
		},
		indentionLevel: {
			get: function(){return _indentionLevel;},
			set: function(val){_indentionLevel = parseInt(val);}
		},
		layout: undef,
		leftImage: {
			get: function(){return _leftImage;},
			set: function(val){
				var div = _leftImageObj, inner, img;
				if (_leftImage = val) {
					if (div) {
						img = div.firstChild.firstChild;
					} else {
						div = _leftImageObj = document.createElement("div");
						div.className = "leftImage";
						div.appendChild(inner = document.createElement("div"));
						inner.appendChild(img = document.createElement("img"));
						domNode.appendChild(div);
					}
					img.src = Ti._5.getAbsolutePath(val);
				} else {
					if (_leftImageObj) {
						_leftImageObj.parentNode.removeChild(_leftImageObj);
						_leftImageObj = null;
					}
				}
			}
		},
		rightImage: {
			get: function(){return _rightImage;},
			set: function(val){
				var div = _rightImageObj, inner, img;
				if (_rightImage = val) {
					if (div) {
						img = div.firstChild.firstChild;
					} else {
						div = _rightImageObj = document.createElement("div");
						div.className = "rightImage";
						div.appendChild(inner = document.createElement("div"));
						inner.appendChild(img = document.createElement("img"));
						domNode.appendChild(div);
						domNode.className += " hasRightImage";
					}
					img.src = Ti._5.getAbsolutePath(val);
				} else {
					if (_rightImageObj) {
						_rightImageObj.parentNode.removeChild(_rightImageObj);
						_rightImageObj = null;
						domNode.className = domNode.className.replace(/\s*hasRightImage/, "");
					}
				}
			}
		},
		selectedBackgroundColor: "#cccccc",
		selectedBackgroundImage: undef,
		selectedColor: obj.color,
		selectionStyle: {
			get: function(){return _selectionStyle;},
			set: function(val){
				_selectionStyle = val;
				for (var sProp in val) {
					if ("undeined" != typeof obj[sProp]) {
						obj[sProp] = val[sProp];
					}
				}
			}
		},
		title: {
			get: function(){return _title;},
			set: function(val) {
				_titleObj.innerHTML = Ti._5._changeTextToHTML(_title = val);
			}
		},
		top: {
			get: function() {
				return domStyle.paddingTop ? parseInt(domStyle.paddingTop) : "";
			},
			set: function(val) {
				domStyle.paddingBottom = "";
				domStyle.paddingTop = px(val);
			}
		},
		bottom: {
			get: function() {
				return domStyle.paddingBottom ? parseInt(domStyle.paddingBottom) : "";
			},
			set: function(val) {
				domStyle.paddingTop = "";
				domStyle.paddingBottom = px(val);
			}
		},
		left: {
			get: function() {
				return domStyle.paddingLeft ? parseInt(domStyle.paddingLeft) : "";
			},
			set: function(val) {
				domStyle.paddingRight = "";
				domStyle.paddingLeft = px(val);
			}
		},
		right: {
			get: function() {
				return domStyle.paddingRight ? parseInt(domStyle.paddingRight) : "";
			},
			set: function(val) {
				domStyle.paddingLeft = "";
				domStyle.paddingRight = px(val);
			}
		},
		size: {
			get: function() {
				return {
					width	: obj.width,
					height	: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = px(val.width));
				val.height && (obj.height = px(val.height));
			}
		},
		height: {
			get: function() {
				return _height;
			},
			set: function(val) {
				domStyle.lineHeight = domStyle.height = _height = val + (/^\d+$/.test(val) ? "px" : "");
			}
		},
		header: {
			get: function(){return obj._rowData.header;},
			set: function(val) {
				obj._rowData.header = val;
				if (obj.parent && obj.parent instanceof Ti.UI.TableViewSection) {
					obj.parent.headerTitle = val;
				}
			}
		},
		footer: {
			get: function(){return obj._rowData.footer;},
			set: function(val) {
				obj._rowData.footer = val;
				if (obj.parent && obj.parent instanceof Ti.UI.TableViewSection) {
					obj.parent.footerTitle = val;
				}
			}
		}
	});

	require.mix(obj, args);

	domNode._calcHeight = false;
	obj.addEventListener("html5_added", function(){
		domNode._calcHeight = false;
	});

	function getLowestPosition(obj) {
		var i,
			pos,
			maxPos = oSizes.height + (parseInt(obj.top) || 0) + (parseInt(obj.bottom) || 0),
			children = obj._children,
			len = children.length,
			oSizes = Ti._5._getElementOffset(domNode);
		//var maxPos = oSizes.height + oSizes.top;
		for (i = 0; i < len; i++) {
			pos = getLowestPosition(children[i]);
			maxPos = Math.max(maxPos, pos);
		}
		return maxPos;
	}

	function setRowHeight() {
		var i,
			pos,
			maxPos = 0,
			children = obj._children,
			len = children.length;
		if ((obj.height === undef || obj.height === "auto") && domNode._calcHeight === false && len) {
			for (i = 0; i < len; i++) {
				pos = getLowestPosition(children[i]);
				maxPos = Math.max(maxPos, pos);
			}
			domNode._calcHeight = maxPos;
			domStyle.height = domNode._calcHeight + "px";
		}
	}

	obj.addEventListener("html5_child_rendered", setRowHeight);
	obj.addEventListener("html5_shown", function () {domNode._calcHeight = false; setRowHeight();});
	on(window, "resize", function() {
		domNode._calcHeight = false;
		setRowHeight();
	});

	function setColoredStyle() {
		if (obj.selectedBackgroundImage) {
			domStyle.backgroundImage = "url(" + Ti._5.getAbsolutePath(obj.selectedBackgroundImage) + ")";
			domStyle.backgroundRepeat = "no-repeat";
		} else if (obj.selectedBackgroundColor) {
			domStyle.backgroundColor = obj.selectedBackgroundColor;
		} else if (obj.selectedColor){
			domStyle.color = obj.selectedColor;
		}
	}

	function setStatusQuo() {
		if(obj.backgroundImage != null){
			domStyle.backgroundImage = "url(" + Ti._5.getAbsolutePath(obj.backgroundImage) + ")";
		}
		if(obj.backgroundColor != null){
			domStyle.backgroundColor = obj.backgroundColor;
		}
		if(obj.color != null){
			domStyle.color = obj.color;
		}
		domNode.selected = false;
	}

	obj._selectRow = function() {
		domNode.selected = true;
		setColoredStyle();
	};

	obj._deselectRow = function() {
		setStatusQuo();
	};

	on(domNode, "touchstart", function() { setColoredStyle(); });
	on(document, "touchend", function() { setStatusQuo(); });
	on(domNode, "mousedown", function() { setColoredStyle(); });
	on(document, "mouseup", function() { setStatusQuo(); });
	on(domNode, "mouseout", function() {
		// If row was selected don`t need to deselect it
		domNode.selected || setStatusQuo();
	});

	on(domNode, "click", function(event) {
		var oEl = event.target, row = null;
		while ("LI" != oEl.tagName.toUpperCase() && oEl.parentNode) {
			oEl = oEl.parentNode;
		}
		var parent = obj.parent, index = -1;
		for (var iCounter = 0; iCounter < parent._children.length; iCounter++) {
			if (parent._children[iCounter] instanceof Ti.UI.TableViewRow) {
				index++;
				if (parent._children[iCounter].dom == oEl) {
					break;
				}
			}
		}

		var oSource = obj 
		var children = obj._children;
		if (children){
			for (var iCounter = 0; iCounter < children.length; iCounter++) {
				if (children[iCounter].dom == event.target){
					oSource = children[iCounter];
					break;
				}
			}
		} 		
		var oEvent = {
			detail		: event.srcElement == _stateObj || false,
			index		: index,
			row			: obj,
			rowData		: obj._rowData,
			searchMode	: false,
			section		: obj.parent && obj.parent.parent && obj.parent.parent instanceof Ti.UI.TableViewSection ? obj.parent.parent : null,
			source		: oSource,
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		};
		obj.fireEvent("click", oEvent);
		// Fire section event
		obj.parent && obj.parent.fireEvent("click", oEvent);
	});

	on(domNode, "dblclick", function(event) {
		var oEvent = {
			source		: obj,
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		};
		obj.fireEvent("dblclick", oEvent);
		// Fire section event
		obj.parent && obj.parent.fireEvent("dblclick", oEvent);
	});
});
