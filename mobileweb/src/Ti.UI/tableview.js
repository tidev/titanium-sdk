Ti._5.createClass("Ti.UI.TableView", function(args){
	args = require.mix({
		height: "100%",
		layout: "vertical",
		unselectable: true,
		width: "100%"
	}, args);

	var undef,
		obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "TableView"),
		on = require.on,
		_data = [],
		activeSection = null;

	// Interfaces
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	function _createActiveSection(header, footer) {
		activeSection = Ti.UI.createTableViewSection({
			headerTitle: header || "",
			footerTitle: footer || "",
		});
		activeSection.parent = obj;
		obj._children.splice(obj._children.length - 1, 0, activeSection);
	}

	function _clearTopSection() {
		if (!activeSection) {
			return;
		}
		for (var ii = 0; ii < activeSection._children.length; ii++) {
			if (activeSection._children[ii] instanceof Ti.UI.TableViewSection) {
				activeSection._children.splice(ii, 1);
			}
		}
		activeSection = null;
	}

	// Create default header & footer
	obj._children = obj._children || [];
	var _oHeader = Ti.UI.createLabel({
		isvisible:true,
		textAlign:"left",
		backgroundColor:"#424542",
		color:"#FFFFFF"
	});
	_oHeader.dom.style.paddingLeft = "10px";
	_oHeader.addEventListener("click", function(event) {
		obj.fireEvent("click", {
			globalPoint: event.globalPoint,
			x: event.x,
			y: event.y
		});
	});
	obj._children.push(_oHeader);
	_oHeader.parent = obj;

	var _oFooter = Ti.UI.createLabel({
		isvisible:true,
		textAlign:"left",
		backgroundColor:"#424542",
		color:"#FFFFFF"
	});
	_oFooter.dom.style.paddingLeft = "10px";
	_oFooter.addEventListener("click", function(event) {
		obj.fireEvent("click", {
			globalPoint: event.globalPoint,
			x: event.x,
			y: event.y
		});
	});
	obj._children.push(_oFooter);
	_oFooter.parent = obj;
	
	function _searchForRowByIndex(iIndex) {
		obj._children = obj._children || [];
		
		var iChildIndex = {x:-1,y:-1,oRow:null,oSection:null}, iRowCounter = -1;
		// Search in sections
		for (var iCounter = 0; iCounter < obj._children.length; iCounter++) {
			if (obj._children[iCounter] instanceof Ti.UI.TableViewSection) {
				var oSection = obj._children[iCounter];
				// Search in section children
				if (
					oSection._children[1] &&
					oSection._children[1]._children &&
					oSection._children[1]._children[0] instanceof Ti.UI.TableViewRow
				) {
					var oSectionRows = oSection._children[1];
					// Search in section rows
					for (var jCounter = 0; jCounter < oSectionRows._children.length; jCounter++) {
						iChildIndex.y++;
						iRowCounter++;
						if (iRowCounter == iIndex) {
							iChildIndex.oRow = oSectionRows._children[jCounter];
							break;
						}
					}
				}
			}
			iChildIndex.x++;
			if (iRowCounter == iIndex) {
				iChildIndex.oSection = oSection;
				break;
			}
			iChildIndex.y = -1;			
		}
		
		return iChildIndex;
	}
	
	var needNewSection = false;
	obj.add = function(view) {
		var aData = view instanceof Array ? view : [view];
		for (var ii = 0; ii < aData.length; ii++) {
			var row = aData[ii];
			// creating cross-link
			if (row instanceof Ti.UI.TableViewRow) {
				if (row.header || needNewSection) {
					_createActiveSection(row.header, row.footer);
				} else if (!activeSection) {
					_createActiveSection();
				}
				if (row.footer) {
					activeSection.footerTitle = row.footer;
					needNewSection = true;
				} else {
					needNewSection = false;
				}
				activeSection.add(row);
			} else {
				activeSection = row;
				needNewSection = false;
				row.parent = obj;
				// Footer must be the last element
				obj._children.splice(obj._children.length - 1, 0, row);
			}
				
			if (
				row instanceof Ti.UI.TableViewRow ||
				row instanceof Ti.UI.TableViewSection
			) {
				_data.push(row._rowData || row.args);
			} else {
				_data.push(row);
			}
		}
		if (!bBlockRender) {
			obj.render(null);
		}
	};
	
	obj._addRowAdditionalData = function (row) {
		row.dom.style.borderBottom = "1px solid " + obj.separatorColor;
		row.dom.style.height = obj.rowHeight ? obj.rowHeight + "px" : row.dom.style.height;
		row.dom.style.minHeight = obj.minRowHeight + "px";
		row.dom.style.maxHeight = obj.maxRowHeight + "px";
		if (activeSection) {
			//_createActiveSection();
			row.parent = activeSection;
		}
		
		return row;
	};

	// Block rendering rows to improve performance  
	var bBlockRender = false,
		_footerTitle = "",
		_headerTitle = "",
		_scrollable = true,
		_searchHidden = true;

	// Properties
	Ti._5.prop(obj, {
		allowsSelection: true,
		allowsSelectionDuringEditing: true,
		data: {
			get: function(){return _data;},
			set: function(val){
				// clean all the data we have
				_data = [];
				obj._children = [];
				domNode.innerHTML = "";
				_clearTopSection();
				bBlockRender = true;
				val = val instanceof Array ? val : [val];
				for (var ii = 0; ii < val.length; ii++) {
					var row = val[ii];
					if (!(row instanceof Ti.UI.TableViewRow) && !(row instanceof Ti.UI.TableViewSection)) {
						row = Ti.UI.createTableViewRow(row);
					}
					if (row instanceof Ti.UI.TableViewRow) {
						row = obj._addRowAdditionalData(row);
					}
					obj.add(row);
				}
				bBlockRender = false;
				if (obj._children && obj._children.length) {
					obj.render(null);
				}
			}
		},
		editable: undef,
		editing: undef,
		filterAttribute: undef,
		filterCaseInsensitive: undef,
		footerTitle: {
			get: function(){return _footerTitle;},
			set: function(val){
				_footerTitle = val;
				_oFooter.html !== undef && (_oFooter.html = _footerTitle);
				_oFooter.text !== undef && (_oFooter.text = _footerTitle);
				_oFooter.title !== undef && (_oFooter.title = _footerTitle);
				_oFooter.message !== undef && (_oFooter.message = _footerTitle);
			}
		},
		footerView: {
			get: function(){return _oFooter;},
			set: function(val){
				if (val && val.dom) {
					obj._children.splice(2, 1, val);
					_oFooter = val;
					domNode.innerHTML = "";
					obj.render(null);
				}
			}
		},
		headerTitle: {
			get: function(){return _headerTitle;},
			set: function(val){
				_headerTitle = val;
				_oHeader.borderColor = _headerTitle ? "#000000" : "";
				var style = _oHeader.dom.style;
				style.borderLeftWidth = 0;
				style.borderRightWidth = 0;
				style.borderBottomWidth = 0;
				_oHeader.html !== undef && (_oHeader.html = _headerTitle);
				_oHeader.text !== undef && (_oHeader.text = _headerTitle);
				_oHeader.title !== undef && (_oHeader.title = _headerTitle);
				_oHeader.message !== undef && (_oHeader.message = _headerTitle);
			}
		},
		headerView: {
			get: function(){return _oHeader;},
			set: function(val){
				if (val && val.dom) {
					obj._children.splice(0, 1, val);
					_oHeader = val;
					domNode.innerHTML = "";
					obj.render(null);
				}
			}
		},
		index: undef,
		maxRowHeight: "",
		minRowHeight: 1,
		moving: undef,
		rowHeight: args.rowHeight,
		scrollable: {
			get: function(){return _scrollable;},
			set: function(val){
				_scrollable = val;
				domNode.style.overflow = _scrollable ? "auto" : "hidden";
			}
		},
		search: undef,
		searchHidden: {
			get: function(){return _searchHidden;},
			set: function(val){_searchHidden = !!val;}
		},
		separatorColor: "#e0e0e0",
		style: undef,
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
		}
	});

	require.mix(obj, args);

	on(domNode, "click", function(event) {
		// If tableview has children they will fire this event
		if (obj._children && 0 < obj._children.length) {
			return true;
		}
		obj.fireEvent("click", {
			detail		: false,
			globalPoint	: { x:event.pageX, y:event.pageY }, 
			index		: null,
			row			: null,
			rowData		: null,
			searchMode	: false,
			section		: null,
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		});
	});
	
	on(domNode, "dblclick", function(event) {
		// If tableview has children they will fire this event 
		if (obj._children && 0 < obj._children.length) {
			return true;
		}
		obj.fireEvent("dblclick", {
			globalPoint	: { x:event.pageX, y:event.pageY }, 
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		});
	});

	// Methods
	obj.appendRow = function(row, properties){
		if (row instanceof Ti.UI.TableViewRow) {
			obj.add(obj._addRowAdditionalData(row));
		} else {
			obj.add(obj._addRowAdditionalData(Ti.UI.createTableViewRow(row)));
		}
	};
	obj.deleteRow = function(row, properties){
		var oIndex = _searchForRowByIndex(row);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		if (0 == oIndex.x && _data && !(_data[0] instanceof Ti.UI.TableViewSection)) {
			_data.splice(oIndex.y, 1);
		}
		var oRow = obj._children[oIndex.x]._children[1]._children.splice(oIndex.y, 1);
		oRow = oRow ? oRow[0] : null;
		obj._children[oIndex.x]._children[1].dom.innerHTML = "";
		obj._children[oIndex.x]._children[1].render(null);
		obj.fireEvent("delete", {
			detail		: false,
			index		: row,
			row			: oRow,
			rowData		: oRow._rowData || oRow.args,
			searchMode	: false,
			section		: oRow.parent,
			source		: obj,
			type		: "delete"
		});
	};
	obj.insertRowAfter = function(index, row, properties){
		var oIndex = _searchForRowByIndex(index);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		var oData = null;
		if (0 == oIndex.x && _data && !(_data[0] instanceof Ti.UI.TableViewSection)) {
			_data.splice(oIndex.y + 1, 0, row._rowData || row.args);
		}
		row = obj._addRowAdditionalData(row);
		obj._children[oIndex.x]._children[1]._children.splice(oIndex.y + 1, 0, row);
		obj.render(null);
	};
	obj.insertRowBefore = function(index, row, properties){
		var oIndex = _searchForRowByIndex(index);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		var oData = null;
		if (0 == oIndex.x && _data && !(_data[0] instanceof Ti.UI.TableViewSection)) {
			_data.splice(oIndex.y, 0, row._rowData || row.args);
		}
		row = obj._addRowAdditionalData(row);
		obj._children[oIndex.x]._children[1]._children.splice(oIndex.y, 0, row);
		obj.render(null);
	};
	obj.updateRow = function(index, row, properties){
		var oIndex = _searchForRowByIndex(index);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		if (0 == oIndex.x && _data && !(_data[0] instanceof Ti.UI.TableViewSection)) {
			_data = _data.splice(oIndex.y, 1, row._rowData || row.args);
		}
		row = obj._addRowAdditionalData(row);
		obj._children[oIndex.x]._children[1]._children.splice(oIndex.y, 1, row);
		obj._children[oIndex.x]._children[1].dom.innerHTML = "";
		obj._children[oIndex.x]._children[1].render(null);
	};
	obj.scrollToIndex = function(index, properties) {
		var oIndex = _searchForRowByIndex(index);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		domNode.scrollTop = parseInt(Ti._5._getElementOffset(oIndex.oRow.dom).top);
	};
	obj.scrollToTop = function(yCoord, properties) {
		domNode.scrollTop = parseFloat(yCoord);
	};
	obj.selectRow = function(row){
		if (!obj.allowsSelection) {
			return false;
		}
		for (var iCounter=0; iCounter < obj._children.length; iCounter++) {
			if (obj._children[iCounter] instanceof Ti.UI.TableViewSection) {
				var oSection = obj._children[iCounter];
				// Search in section children
				if (
					oSection._children[1] &&
					oSection._children[1]._children &&
					oSection._children[1]._children[0] instanceof Ti.UI.TableViewRow
				) {
					var oSectionRows = oSection._children[1];
					// Search in section rows
					for (var jCounter = 0; jCounter < oSectionRows._children.length; jCounter++) {
						oSectionRows._children[jCounter]._deselectRow();
					}
				}
			}
		}
		var oIndex = _searchForRowByIndex(row);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		obj._children[oIndex.x]._children[1]._children[oIndex.y]._selectRow();
	};
	obj.deselectRow = function(row){
		if (!obj.allowsSelection) {
			return false;
		}
		var oIndex = _searchForRowByIndex(row);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		obj._children[oIndex.x]._children[1]._children[oIndex.y]._deselectRow();
	};
	obj.setData = function(data, properties) {
//		if (data == null || data.length == 0) {
//			_data = [];
//			obj._children = [];
//			domNode.innerHTML = "";
//		} else {
			obj.data = data;
//		}
	};

	// Events
	obj.addEventListener("delete", function(){
		console.debug('Event "delete" is not implemented yet.');
	});
	obj.addEventListener("move", function(){
		console.debug('Event "move" is not implemented yet.');
	});
	
	var _scrollTimer = null;
	on(domNode, "scroll", function(event) {
		clearTimeout(_scrollTimer);
		var iFirstIndex = 0, bFirstIndexFound = false, iTotal = 0, iVisibleCount = 0;
		var iHeight = domNode.offsetHeight;
		var iTop = Ti._5._getElementOffset(domNode).top;
		for (var iCounter=0; iCounter < obj._children.length; iCounter++) {
			if (obj._children[iCounter] instanceof Ti.UI.TableViewSection) {
				var oSection = obj._children[iCounter];
				// Search in section children
				if (
					oSection._children[1] &&
					oSection._children[1]._children &&
					oSection._children[1]._children[0] instanceof Ti.UI.TableViewRow
				) {
					var oSectionRows = oSection._children[1];
					// Search in section rows
					for (var jCounter = 0; jCounter < oSectionRows._children.length; jCounter++) {
						var oSizes = Ti._5._getElementOffset(oSectionRows._children[jCounter].dom);
						if (!bFirstIndexFound && (oSizes.top + 0.5*oSizes.height) < iTop + domNode.scrollTop) {
							iFirstIndex++;
						} else {
							bFirstIndexFound = true;
						}
						if (
							
							((oSizes.top + oSizes.height - domNode.scrollTop) >= iTop && 
							(oSizes.top + oSizes.height - domNode.scrollTop) <= iTop + iHeight &&
							(oSizes.top + 0.5*oSizes.height - domNode.scrollTop) >= iTop &&
							(oSizes.top + 0.5*oSizes.height - domNode.scrollTop) <= iTop + iHeight )
							||
							((oSizes.top - domNode.scrollTop) >= iTop && 
							(oSizes.top - domNode.scrollTop) <= iTop + iHeight &&
							(oSizes.top + 0.5*oSizes.height - domNode.scrollTop) >= iTop &&
							(oSizes.top + 0.5*oSizes.height - domNode.scrollTop) <= iTop + iHeight)
						) {
							iVisibleCount++;
						}
						iTotal++;
					}
				}
			}
		}
		var oEvent =  {
			contentOffset		: {x: domNode.scrollLeft, y:domNode.scrollTop},
			contentSize			: {width: domNode.scrollWidth, height: domNode.scrollHeight},
			firstVisibleItem	: iFirstIndex,
			size				: {width: domNode.offsetWidth, height: domNode.offsetHeight},
			totalItemCount		: iTotal,
			visibleItemCount	: iVisibleCount
		};
		_scrollTimer = setTimeout(function() {
			obj.fireEvent("scrollEnd", {
				contentOffset		: oEvent.contentOffset,
				contentSize			: oEvent.contentSize,
				size				: oEvent.size,
				type				: "scrollEnd"
			});
		}, 300);	
		obj.fireEvent("scroll", oEvent);
	});
});
