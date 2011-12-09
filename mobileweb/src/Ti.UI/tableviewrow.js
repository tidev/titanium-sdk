Ti._5.createClass('Titanium.UI.TableViewRow', function(args){
	this._rowData = args || {};
	var obj = this;
	
	// Set defaults
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	args.width = args.width || '100%';
	args['backgroundColor'] = args['backgroundColor'] ? args['backgroundColor'] : 'transparent';
	if (!args['font']) {
		args['fontSize'] = args['fontSize'] ? args['fontSize'] : 20;
		args['fontWeight'] = args['fontWeight'] ? args['fontWeight'] : 'bold';
		args['fontFamily'] = args['fontFamily'] ? args['fontFamily'] : 'Helvetica';
	}
		
	// Interfaces
	Ti._5.DOMView(this, 'li', args, 'TableViewRow');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	// Set needed style rules
	//this.dom.style.display = 'table-cell';
	this.dom.style.lineHeight = args['height'] ? args['height'] : '50px';

	// Properties
	var _className = null;
	Object.defineProperty(this, 'className', {
		get: function(){return _className;},
		set: function(val){return _className = val;}
	});

	var _colorRow = '#000000';
	Object.defineProperty(this, 'color', {
		get: function(){return _colorRow;},
		set: function(val){
			_colorRow = val;
			obj.dom.style.color = val;
		}
	});

	// use single DOM element for all row states - this is required to show only one state at a time and avoid creating
	// too many DOM elements
	var _stateObj = document.createElement('div');
	_stateObj.className = '';
	// stack for holding states
	var _statesStack = [];

	// remove given state from stack
	var _removeFromStack = function(state){
		var res = [];
		for(var ii = 0; ii < _statesStack.length; ii++){
			var val = _statesStack[ii];
			if(val != state){
				res.push(val);
			}
		}
		_statesStack = res;
	};
	// add new state - visualize latest available state
	var _addState = function(state){
		if(_stateObj.className == state){
			// do nothing if already in this state
			return;
		}
		if(_stateObj.className != ''){
			_statesStack.push(_stateObj.className);
		}
		_removeFromStack(state);
		_stateObj.className = state;
		obj.dom.appendChild(_stateObj);
	};
	// remove given state
	var _removeState = function(state){
		if(_stateObj.className != ''){
			_statesStack.push(_stateObj.className);
		}
		_removeFromStack(state);
		if(_statesStack.length > 0){
			_stateObj.className = _statesStack[_statesStack.length - 1];
		} else if(_stateObj.parentNode == obj.dom){
			obj.dom.removeChild(_stateObj);
		}
	};

	var _hasCheck = false;
	Object.defineProperty(this, 'hasCheck', {
		get: function(){return _hasCheck;},
		set: function(val){
			_hasCheck = val;
			if(val){
				_addState('hasCheck');
			} else {
				_removeState('hasCheck');
			}
		}
	});

	var _hasChild = false;
	Object.defineProperty(this, 'hasChild', {
		get: function(){return _hasChild;},
		set: function(val){
			_hasChild = val;
			if(val){
				_addState('hasChild');
			} else {
				_removeState('hasChild');
			}
		}
	});

	var _hasDetail = false;
	Object.defineProperty(this, 'hasDetail', {
		get: function(){return _hasDetail;},
		set: function(val){
			_hasDetail = val;
			if(val){
				_addState('hasDetail');
			} else {
				_removeState('hasDetail');
			}
		}
	});

	var _indentionLevel = 0;
	Object.defineProperty(this, 'indentionLevel', {
		get: function(){return _indentionLevel;},
		set: function(val){return _indentionLevel = parseInt(val);}
	});

	var _layout = null;
	Object.defineProperty(this, 'layout', {
		get: function(){return _layout;},
		set: function(val){return _layout = val;}
	});

	var _leftImage = null, _leftImageObj = null;
	Object.defineProperty(this, 'leftImage', {
		get: function(){return _leftImage;},
		set: function(val){
			_leftImage = val;
			var img;
			if(_leftImageObj == null){
				_leftImageObj = document.createElement('div');
				_leftImageObj.className = 'leftImage';
				var inner = document.createElement('div');
				_leftImageObj.appendChild(inner);
				img = document.createElement('img');
				inner.appendChild(img);
			} else {
				img = _leftImageObj.firstChild.firstChild;
			}
			if(_leftImage == "" || _leftImage == null){
				obj.dom.removeChild(_leftImageObj);
			} else {
				img.src = Ti._5.getAbsolutePath(_leftImage);
				obj.dom.appendChild(_leftImageObj);
			}
		}
	});

	var _rightImage = null, _rightImageObj = null;
	Object.defineProperty(this, 'rightImage', {
		get: function(){return _rightImage;},
		set: function(val){
			_rightImage = val;
			var img;
			if(_rightImageObj == null){
				_rightImageObj = document.createElement('div');
				_rightImageObj.className = 'rightImage';
				var inner = document.createElement('div');
				_rightImageObj.appendChild(inner);
				img = document.createElement('img');
				inner.appendChild(img);
			} else {
				img = _rightImageObj.firstChild.firstChild;
			}
			if(_rightImage == "" || _rightImage == null){
				obj.dom.removeChild(_rightImageObj);
				obj.dom.className = obj.dom.className.replace(/\s*hasRightImage/, '');
			} else {
				img .src = Ti._5.getAbsolutePath(_rightImage);
				obj.dom.appendChild(_rightImageObj);
				obj.dom.className += ' hasRightImage';
			}
		}
	});

	var _selectedBackgroundColor = '#cccccc';
	Object.defineProperty(this, 'selectedBackgroundColor', {
		get: function(){return _selectedBackgroundColor;},
		set: function(val){return _selectedBackgroundColor = val;}
	});

	var _selectedBackgroundImage = null;
	Object.defineProperty(this, 'selectedBackgroundImage', {
		get: function(){return _selectedBackgroundImage;},
		set: function(val){return _selectedBackgroundImage = val;}
	});

	var _selectedColor = obj.color;
	Object.defineProperty(this, 'selectedColor', {
		get: function(){return _selectedColor;},
		set: function(val){return _selectedColor = val;}
	});

	var _selectionStyle = null;
	Object.defineProperty(this, 'selectionStyle', {
		get: function(){return _selectionStyle;},
		set: function(val){
			_selectionStyle = val;
			for (var sProp in val) {
				if ("undeined" != typeof obj[sProp]) {
					obj[sProp] = val[sProp];
				}
			}				
		}
	});

	var _title = '';
	var _titleObj = document.createElement('span');
	obj.dom.appendChild(_titleObj);
	Object.defineProperty(this, 'title', {
		get: function(){return _title;},
		set: function(val) {
			_title = val;
			_titleObj.innerHTML = Ti._5._changeTextToHTML(val);
		}
	});
	
	Object.defineProperty(obj, 'top', {
		get: function() {
			return obj.dom.style.paddingTop ? parseInt(obj.dom.style.paddingTop) : '';
		},
		set: function(val) {
			obj.dom.style.paddingBottom = '';
			obj.dom.style.paddingTop = Ti._5.parseLength(val);
		}
	});
	
	Object.defineProperty(obj, 'bottom', {
		get: function() {
			return obj.dom.style.paddingBottom ? parseInt(obj.dom.style.paddingBottom) : '';
		},
		set: function(val) {
			obj.dom.style.paddingTop = '';
			obj.dom.style.paddingBottom = Ti._5.parseLength(val);
		}
	});
	
	Object.defineProperty(obj, 'left', {
		get: function() {
			return obj.dom.style.paddingLeft ? parseInt(obj.dom.style.paddingLeft) : '';
		},
		set: function(val) {
			obj.dom.style.paddingRight = '';
			obj.dom.style.paddingLeft = Ti._5.parseLength(val);
		}
	});
	
	Object.defineProperty(obj, 'right', {
		get: function() {
			return obj.dom.style.paddingRight ? parseInt(obj.dom.style.paddingRight) : '';
		},
		set: function(val) {
			obj.dom.style.paddingLeft = '';
			obj.dom.style.paddingRight = Ti._5.parseLength(val);
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
	
	var _height;
	Object.defineProperty(obj, 'height', {
		get: function() {
			return _height;
		},
		set: function(val) {
			_height = val;
			obj.dom.style.height =  val + (/^\d+$/.test(val) ? 'px' : "");
			obj.dom.style.lineHeight =  obj.dom.style.height;
		}
	});
	
	Object.defineProperty(this, 'header', {
		get: function(){return obj._rowData.header;},
		set: function(val) {
			obj._rowData.header = val;
			if (obj.parent && obj.parent instanceof Ti.UI.TableViewSection) {
				obj.parent.headerTitle = val;
			}
		}
	});
	
	Object.defineProperty(this, 'footer', {
		get: function(){return obj._rowData.footer;},
		set: function(val) {
			obj._rowData.footer = val;
			if (obj.parent && obj.parent instanceof Ti.UI.TableViewSection) {
				obj.parent.footerTitle = val;
			}
		}
	});

	Ti._5.preset(this, [
		"className", "color", "title", "hasCheck", "hasChild", "hasDetail", "top", "bottom", "left",
		"right", "size", "selectedBackgroundColor", "selectedBackgroundImage", "selectedColor", 
		"selectionStyle", "backgroundDisabledImage", "backgroundDisabledColor", "enabled", "height",
		"header", "footer"
	], args);
	Ti._5.presetUserDefinedElements(this, args);
	
	obj.dom._calcHeight = false;
	obj.addEventListener('html5_added', function(){
		obj.dom._calcHeight = false;
	});
	
	function _getLowestPosition(obj) {
		var oSizes = Ti._5._getElementOffset(obj.dom);
		var iMaxPos = oSizes.height + (parseInt(obj.top) || 0) + (parseInt(obj.bottom) || 0);
		//var iMaxPos = oSizes.height + oSizes.top;
		if (obj._children) {
			for (var iCounter = 0; iCounter < obj._children.length; iCounter++) {
				iPos = _getLowestPosition(obj._children[iCounter]);
				iMaxPos = iMaxPos < iPos ? iPos : iMaxPos;
			}
		}
		return iMaxPos;
	}
	
	function _setRowHeight() {
		if (
			('undefined' == typeof obj.height || 'auto' == obj.height) &&
			false === obj.dom._calcHeight &&
			obj._children
		) {
			var iMaxPos = 0;
			for (var iCounter = 0; iCounter < obj._children.length; iCounter++) {
				var iPos = _getLowestPosition(obj._children[iCounter]);
				iMaxPos = iMaxPos < iPos ? iPos : iMaxPos;
			}
			obj.dom._calcHeight = iMaxPos;
			obj.dom.style.height = obj.dom._calcHeight + 'px';
		}
	}
	
	obj.addEventListener('html5_child_rendered', _setRowHeight, false);
	obj.addEventListener('html5_shown', function () {obj.dom._calcHeight = false; _setRowHeight();}, false);
	window.addEventListener('resize', function () {obj.dom._calcHeight = false; _setRowHeight();}, false);
	
	function setColoredStyle() {
		if (_selectedBackgroundImage) {
			obj.dom.style.backgroundImage = 'url("' + Ti._5.getAbsolutePath(_selectedBackgroundImage) + '")';
			obj.dom.style.backgroundRepeat = "no-repeat";
		} else if (_selectedBackgroundColor) {
			obj.dom.style.backgroundColor = _selectedBackgroundColor;
		} else if (_selectedColor){
			obj.dom.style.color = _selectedColor;
		}
	}
	
	function setStatusQuo() {
		if(obj.backgroundImage != null){
			obj.dom.style.backgroundImage = 'url("' + Ti._5.getAbsolutePath(obj.backgroundImage) + '")';
		}
		if(obj.backgroundColor != null){
			obj.dom.style.backgroundColor = obj.backgroundColor;
		}
		if(obj.color != null){
			obj.dom.style.color = obj.color;
		}
		obj.dom.selected = false;
	}
	
	obj._selectRow = function() {
		obj.dom.selected = true;
		setColoredStyle();
	};
	
	obj._deselectRow = function() {
		setStatusQuo();
	};
	
	this.dom.addEventListener('touchstart', function(event) {setColoredStyle();}, false);

	document.addEventListener('touchend', function(event) {setStatusQuo();}, false);
	
	this.dom.addEventListener('mousedown', function(event) {setColoredStyle();}, false);
	
	document.addEventListener('mouseup', function(event) {setStatusQuo();}, false);
	
	this.dom.addEventListener('mouseout', function(event) {
		// If row was selected don`t need to deselect it
		if (!obj.dom.selected) {
			setStatusQuo();
		}
	}, false);
	
	this.dom.addEventListener('click', function(event) {
		var oEl = event.target, row = null;
		while ('LI' != oEl.tagName.toUpperCase() && oEl.parentNode) {
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
			globalPoint	: { x:event.pageX, y:event.pageY }, 
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
		obj.fireEvent('click', oEvent);
		// Fire section event
		if (obj.parent) {
			obj.parent.fireEvent('click', oEvent);
		}
	}, false);
	
	this.dom.addEventListener('dblclick', function(event) {
		var oEvent = {
			globalPoint	: { x:event.pageX, y:event.pageY }, 
			source		: obj,
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		};
		obj.fireEvent('dblclick', oEvent);
		// Fire section event
		if (obj.parent) {
			obj.parent.fireEvent('dblclick', oEvent);
		}
	}, false);
});
