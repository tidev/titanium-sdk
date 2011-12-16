Ti._5.createClass("Ti.UI.TableViewSection", function(args){
	args = require.mix({
		backgroundColor: "transparent",
		layout: "vertical",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		_headerTitle = "",
		_footerTitle = "";

	// Interfaces
	Ti._5.DOMView(obj, "div", args, "TableViewSection");
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
		
	// Create default header & footer
	var _oHeader = Ti.UI.createLabel({
		isvisible: true,
		textAlign: "left",
		backgroundColor: "#424542",
		color: "#FFFFFF"
	});
	_oHeader.dom.style.paddingLeft = "10px";
	_oHeader.addEventListener("click", function(event) {
		obj.fireEvent("click", {
			x: event.x,
			y: event.y
		});
	});
	obj.add(_oHeader);
	
	var _oRowsArea = {};
	obj._oRowsArea = _oRowsArea;
	Ti._5.DOMView(_oRowsArea, "ul", args, "TableViewSectionTable");
	Ti._5.Touchable(_oRowsArea, args);
	Ti._5.Styleable(_oRowsArea, args);
	_oRowsArea.dom.style.listStyleType = "none";
	_oRowsArea.dom.style.paddingLeft = "0";
	_oRowsArea.dom.style.position = "";
	_oRowsArea.dom.style.marginTop = "0";
	_oRowsArea.dom.style.marginBottom = "0";
	_oRowsArea.dom.style.minHeight = "1px";
	_oRowsArea.dom._system = true;
	_oRowsArea.addEventListener("ti:added", function(parent) {
		if (_oRowsArea._children) {
			for (var iCounter = 0; iCounter < _oRowsArea._children.length; iCounter++) {
				if (obj.parent && _oRowsArea._children[iCounter] instanceof Ti.UI.TableViewRow) {
					_oRowsArea._children[iCounter] = obj.parent._addRowAdditionalData(_oRowsArea._children[iCounter]);
					// Restore parent reference, broke by _addRowAdditionalData function
					_oRowsArea._children[iCounter].parent = _oRowsArea;
				} 
				_oRowsArea._children[iCounter].render(obj);
			}
		}
	});
	_oRowsArea.addEventListener("click", function(oEvent) {
		// If tableviewsection has children they will fire obj event 
		if (!obj._children || 0 == obj._children.length) {
			oEvent = {
				detail		: false,
				index		: null,
				row			: null,
				rowData		: null,
				searchMode	: false,
				section		: obj,
				source		: obj,
				type		: oEvent.type,
				x			: oEvent.pageX,
				y			: oEvent.pageY
			};
		}
		obj.fireEvent("click", oEvent);
		// Fire table view event
		obj.parent && obj.parent.fireEvent("click", oEvent);
	});
	_oRowsArea.addEventListener("dblclick", function(event) {
		var oEvent = {
			x			: event.pageX,
			y			: event.pageY
		};
		obj.fireEvent("dblclick", oEvent);
		// Fire table view event
		obj.parent && obj.parent.fireEvent("dblclick", oEvent);
	});
	obj.add(_oRowsArea);
	
	var _oFooter = Ti.UI.createLabel({
		isvisible:true,
		textAlign:"left",
		backgroundColor:"#424542",
		color:"#FFFFFF"
	});
	_oFooter.dom.style.paddingLeft = "10px";
	_oFooter.addEventListener("click", function(event) {
		obj.fireEvent("click", {
			x: event.x,
			y: event.y
		});
	});
	obj.add(_oFooter);
	
	// Properties
	Ti._5.prop(obj, {
		footerTitle: {
			get: function(){return _footerTitle;},
			set: function(val){
				_footerTitle = val;
				if ("undefined" != typeof _oFooter.html) {
					_oFooter.html = _footerTitle;
				}
				if ("undefined" != typeof _oFooter.text) {
					_oFooter.text = _footerTitle;
				}
				if ("undefined" != typeof _oFooter.title) {
					_oFooter.title = _footerTitle;
				}
				if ("undefined" != typeof _oFooter.message) {
					_oFooter.message = _footerTitle;
				}
			}
		},
		footerView: {
			get: function(){return _oFooter;},
			set: function(val){
				if (val && val.dom) {
					obj._children.splice(2, 1, val);
					_oFooter = val;
					obj.dom.innerHTML = "";
					obj.render(null);
				}
			}
		},
		headerTitle: {
			get: function(){return _headerTitle;},
			set: function(val){
				_headerTitle = val;
				if (_headerTitle) {
					_oHeader.borderColor = "#000000";
				} else {
					_oHeader.borderColor = "";
				}
				_oHeader.dom.style.borderLeftWidth = 0;
				_oHeader.dom.style.borderRightWidth = 0;
				_oHeader.dom.style.borderBottomWidth = 0;
				if ("undefined" != typeof _oHeader.html) {
					_oHeader.html = _headerTitle;
				}
				if ("undefined" != typeof _oHeader.text) {
					_oHeader.text = _headerTitle;
				}
				if ("undefined" != typeof _oHeader.title) {
					_oHeader.title = _headerTitle;
				}
				if ("undefined" != typeof _oHeader.message) {
					_oHeader.message = _headerTitle;
				}
			}
		},
		headerView: {
			get: function(){return _oHeader;},
			set: function(val){
				if (val && val.dom) {
					obj._children.splice(0, 1, val);
					_oHeader = val;
					obj.dom.innerHTML = "";
					obj.render(null);
				}
			}
		}
	});

	Ti._5.propReadOnly(obj, "rowCount", function() {
		var _rowCount = 0;
		for (var iCounter = 0; iCounter < _oRowsArea._children.length; iCounter++) {
			if (_oRowsArea._children[iCounter] instanceof Ti.UI.TableViewRow) {
				_rowCount++;
			}
		}
		return _rowCount;
	});

	require.mix(obj, args);

	var bBlockRender = false,
		_data = null;
	obj.add = function(view) {
		if (view instanceof Ti.UI.TableViewRow) {
			_oRowsArea.add(view);
		} else {
			obj._children = obj._children || [];
			// creating cross-link
			obj._children.push(view);
			view.parent = obj;
		}
		if (!obj.parent || !obj.parent.bBlockRender) {
			obj.render(null);
		}
	};
});