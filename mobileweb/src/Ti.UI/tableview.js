Ti._5.createClass('Titanium.UI.TableView', function(args){
	var obj = this;
	var _data = [];
	var activeSection = null;
	
	// Set defaults
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	args.layout = 'vertical';
	args.width = args.width || '100%';
	args.height = args.height || '100%';
	
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'TableView');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	
	function _createActiveSection(header, footer) {
		activeSection = Titanium.UI.createTableViewSection({
			headerTitle: header || '',
			footerTitle: footer || '',
		});
		activeSection.parent = obj;
		obj._children.splice(obj._children.length - 1, 0, activeSection);
	}
		
	function _clearTopSection() {
		if (!activeSection) {
			return;
		}
		for (var ii = 0; ii < activeSection._children.length; ii++) {
			if (activeSection._children[ii] instanceof Titanium.UI.TableViewSection) {
				activeSection._children.splice(ii, 1);
			}
		}
		activeSection = null;
	}

	// Create default header & footer
	obj._children = obj._children || [];
	var _oHeader = Titanium.UI.createLabel({
		isvisible:true,
		textAlign:'left',
		backgroundColor:'#424542',
		color:'#FFFFFF'
	});
	_oHeader.dom.style.paddingLeft = '10px';
	_oHeader.addEventListener('click', function(event) {
		obj.fireEvent('click', {
			globalPoint: event.globalPoint,
			source: obj,
			type: 'click',
			x: event.x,
			y: event.y
		});
	});
	obj._children.push(_oHeader);
	_oHeader.parent = obj;
	
	var _oFooter = Titanium.UI.createLabel({
		isvisible:true,
		textAlign:'left',
		backgroundColor:'#424542',
		color:'#FFFFFF'
	});
	_oFooter.dom.style.paddingLeft = '10px';
	_oFooter.addEventListener('click', function(event) {
		obj.fireEvent('click', {
			globalPoint: event.globalPoint,
			source: obj,
			type: 'click',
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
			if (obj._children[iCounter] instanceof Titanium.UI.TableViewSection) {
				var oSection = obj._children[iCounter];
				// Search in section children
				if (
					oSection._children[1] &&
					oSection._children[1]._children &&
					oSection._children[1]._children[0] instanceof Titanium.UI.TableViewRow
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
	this.add = function(view) {
		var aData = view instanceof Array ? view : [view];
		for (var ii = 0; ii < aData.length; ii++) {
			var row = aData[ii];
			// creating cross-link
			if (row instanceof Titanium.UI.TableViewRow) {
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
				row instanceof Titanium.UI.TableViewRow ||
				row instanceof Titanium.UI.TableViewSection
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
	
	this._addRowAdditionalData = function (row) {
		if (Titanium.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE == obj.separatorStyle) {
			row.dom.style.borderBottom = '1px solid ' + obj.separatorColor;
		} else {
			row.dom.style.borderBottom = 'none';
		}
		row.dom.style.height = obj.rowHeight ? obj.rowHeight + 'px' : row.dom.style.height;
		row.dom.style.minHeight = obj.minRowHeight + 'px';
		row.dom.style.maxHeight = obj.maxRowHeight + 'px';
		if (activeSection) {
			//_createActiveSection();
			row.parent = activeSection;
		}
		
		return row;
	};

	// Properties
	Ti._5.prop(this, 'allowsSelection', true);

	Ti._5.prop(this, 'allowsSelectionDuringEditing', true);

	// Block rendering rows to improve performance  
	var bBlockRender = false;
	Ti._5.prop(this, 'data', {
		get: function(){return _data;},
		set: function(val){
			// clean all the data we have
			_data = [];
			obj._children = [];
			obj.dom.innerHTML = '';
			_clearTopSection();
			bBlockRender = true;
			val = val instanceof Array ? val : [val];
			for (var ii = 0; ii < val.length; ii++) {
				var row = val[ii];
				if (!(row instanceof Titanium.UI.TableViewRow) && !(row instanceof Titanium.UI.TableViewSection)) {
					row = Titanium.UI.createTableViewRow(row);
				}
				if (row instanceof Titanium.UI.TableViewRow) {
					row = obj._addRowAdditionalData(row);
				}
				obj.add(row);
			}
			bBlockRender = false;
			if (obj._children && obj._children.length) {
				obj.render(null);
			}
			return val;
		}
	});
	
	Ti._5.prop(this, 'editable');

	Ti._5.prop(this, 'editing');

	Ti._5.prop(this, 'filterAttribute');

	Ti._5.prop(this, 'filterCaseInsensitive');

	var _footerTitle = '';
	Ti._5.prop(this, 'footerTitle', {
		get: function(){return _footerTitle;},
		set: function(val){
			_footerTitle = val;
			if ('undefined' != typeof _oFooter.html) {
				_oFooter.html = _footerTitle;
				return _footerTitle;
			}
			if ('undefined' != typeof _oFooter.text) {
				_oFooter.text = _footerTitle;
				return _footerTitle;
			}
			if ('undefined' != typeof _oFooter.title) {
				_oFooter.title = _footerTitle;
				return _footerTitle;
			}
			if ('undefined' != typeof _oFooter.message) {
				_oFooter.message = _footerTitle;
				return _footerTitle;
			}
			return null;
		}
	});

	Ti._5.prop(this, 'footerView', {
		get: function(){return _oFooter;},
		set: function(val){
			if (val && val.dom) {
				obj._children.splice(2, 1, val);
				_oFooter = val;
				obj.dom.innerHTML = '';
				obj.render(null);
				return val;
			}
			return null;
		}
	});

	var _headerTitle = '';
	Ti._5.prop(this, 'headerTitle', {
		get: function(){return _headerTitle;},
		set: function(val){
			_headerTitle = val;
			if (_headerTitle) {
				_oHeader.borderColor = '#000000';
			} else {
				_oHeader.borderColor = '';
			}
			_oHeader.dom.style.borderLeftWidth = 0;
			_oHeader.dom.style.borderRightWidth = 0;
			_oHeader.dom.style.borderBottomWidth = 0;
			if ('undefined' != typeof _oHeader.html) {
				_oHeader.html = _headerTitle;
				return _headerTitle;
			}
			if ('undefined' != typeof _oHeader.text) {
				_oHeader.text = _headerTitle;
				return _headerTitle;
			}
			if ('undefined' != typeof _oHeader.title) {
				_oHeader.title = _headerTitle;
				return _headerTitle;
			}
			if ('undefined' != typeof _oHeader.message) {
				_oHeader.message = _headerTitle;
				return _headerTitle;
			}
			return null;
		}
	});

	Ti._5.prop(this, 'headerView', {
		get: function(){return _oHeader;},
		set: function(val){
			if (val && val.dom) {
				obj._children.splice(0, 1, val);
				_oHeader = val;
				obj.dom.innerHTML = '';
				obj.render(null);
				return val;
			}
			return null;
		}
	});

	Ti._5.prop(this, 'index');

	Ti._5.prop(this, 'maxRowHeight', "");

	Ti._5.prop(this, 'minRowHeight', 1);

	Ti._5.prop(this, 'moving');

	Ti._5.prop(this, 'rowHeight');

	var _scrollable = true;
	Ti._5.prop(this, 'scrollable', {
		get: function(){return _scrollable;},
		set: function(val){
			_scrollable = val;
			this.dom.style.overflow = _scrollable ? "auto" : "hidden";
			return _scrollable;
		}
	});

	Ti._5.prop(this, 'search');

	var _searchHidden = true;
	Ti._5.prop(this, 'searchHidden', {
		get: function(){return _searchHidden;},
		set: function(val){return _searchHidden = !!val;}
	});

	Ti._5.prop(this, 'separatorColor', '#e0e0e0');

	var _separatorStyle = Titanium.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE;
	Ti._5.prop(this, 'separatorStyle', {
		get: function(){return _separatorStyle;},
		set: function(val){
			if (Titanium.UI.iPhone.TableViewSeparatorStyle.NONE == val) {
				_separatorStyle = Titanium.UI.iPhone.TableViewSeparatorStyle.NONE;
			} else {
				_separatorStyle = Titanium.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE;
			}
			if (obj._children && obj._children.length) {
				for (var iCounter = obj._children.length; iCounter >= 0; iCounter--) {
					if (obj._children[iCounter] instanceof Ti.UI.TableViewSection) {
						for (var jCounter = obj._children[iCounter]._children.length; jCounter >= 0; jCounter--) {
							if (obj._children[iCounter]._children[jCounter] instanceof Titanium.UI.TableViewRow) {
								obj._addRowAdditionalData(obj._children[iCounter]._children[jCounter]);
							}  
						}
					}
				}
				return _separatorStyle;
			}
		}
	});

	Ti._5.prop(this, 'style');
	
	Ti._5.prop(this, 'size', {
		get: function() {
			return {
				width	: obj.width,
				height	: obj.height
			}
		},
		set: function(val) {
			val.width && (obj.width = Ti._5.px(val.width));
			val.height && (obj.height = Ti._5.px(val.height));
			return val;
		}
	});
	
	require.mix(this, args);
	
	this.dom.addEventListener('click', function(event) {
		// If tableview has children they will fire this event
		if (obj._children && 0 < obj._children.length) {
			return true;
		}
		var oEvent = {
			detail		: false,
			globalPoint	: { x:event.pageX, y:event.pageY }, 
			index		: null,
			row			: null,
			rowData		: null,
			searchMode	: false,
			section		: null,
			source		: obj,
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		};
		obj.fireEvent('click', oEvent);
	}, false);
	
	this.dom.addEventListener('dblclick', function(event) {
		// If tableview has children they will fire this event 
		if (obj._children && 0 < obj._children.length) {
			return true;
		}
		var oEvent = {
			globalPoint	: { x:event.pageX, y:event.pageY }, 
			source		: obj,
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		};
		obj.fireEvent('dblclick', oEvent);
	}, false);

	// Methods
	this.appendRow = function(row, properties){
		if (row instanceof Ti.UI.TableViewRow) {
			obj.add(obj._addRowAdditionalData(row));
		} else {
			obj.add(obj._addRowAdditionalData(Titanium.UI.createTableViewRow(row)));
		}
	};
	this.deleteRow = function(row, properties){
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
		obj._children[oIndex.x]._children[1].dom.innerHTML = '';
		obj._children[oIndex.x]._children[1].render(null);
		obj.fireEvent('delete', {
			detail		: false,
			index		: row,
			row			: oRow,
			rowData		: oRow._rowData || oRow.args,
			searchMode	: false,
			section		: oRow.parent,
			source		: obj,
			type		: 'delete'
		});
	};
	this.insertRowAfter = function(index, row, properties){
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
	this.insertRowBefore = function(index, row, properties){
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
	this.updateRow = function(index, row, properties){
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
		obj._children[oIndex.x]._children[1].dom.innerHTML = '';
		obj._children[oIndex.x]._children[1].render(null);
	};
	this.scrollToIndex = function(index, properties) {
		var oIndex = _searchForRowByIndex(index);
		// if row was found
		if (0 > oIndex.y) {
			return;
		}
		obj.dom.scrollTop = parseInt(Ti._5._getElementOffset(oIndex.oRow.dom).top);
	};
	this.scrollToTop = function(yCoord, properties) {
		obj.dom.scrollTop = parseFloat(yCoord);
	};
	this.selectRow = function(row){
		if (!obj.allowsSelection) {
			return false;
		}
		for (var iCounter=0; iCounter < obj._children.length; iCounter++) {
			if (obj._children[iCounter] instanceof Titanium.UI.TableViewSection) {
				var oSection = obj._children[iCounter];
				// Search in section children
				if (
					oSection._children[1] &&
					oSection._children[1]._children &&
					oSection._children[1]._children[0] instanceof Titanium.UI.TableViewRow
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
	this.deselectRow = function(row){
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
	this.setData = function(data, properties) {
//		if (data == null || data.length == 0) {
//			_data = [];
//			obj._children = [];
//			obj.dom.innerHTML = '';
//		} else {
			obj.data = data;
//		}
	};

	// Events
	this.addEventListener('delete', function(){
		console.debug('Event "delete" is not implemented yet.');
	});
	this.addEventListener('move', function(){
		console.debug('Event "move" is not implemented yet.');
	});
	
	var _scrollTimer = null;
	this.dom.addEventListener('scroll', function(event) {
		clearTimeout(_scrollTimer);
		var iFirstIndex = 0, bFirstIndexFound = false, iTotal = 0, iVisibleCount = 0;
		var iHeight = obj.dom.offsetHeight;
		var iTop = Ti._5._getElementOffset(obj.dom).top;
		for (var iCounter=0; iCounter < obj._children.length; iCounter++) {
			if (obj._children[iCounter] instanceof Titanium.UI.TableViewSection) {
				var oSection = obj._children[iCounter];
				// Search in section children
				if (
					oSection._children[1] &&
					oSection._children[1]._children &&
					oSection._children[1]._children[0] instanceof Titanium.UI.TableViewRow
				) {
					var oSectionRows = oSection._children[1];
					// Search in section rows
					for (var jCounter = 0; jCounter < oSectionRows._children.length; jCounter++) {
						var oSizes = Ti._5._getElementOffset(oSectionRows._children[jCounter].dom);
						if (!bFirstIndexFound && (oSizes.top + 0.5*oSizes.height) < iTop + obj.dom.scrollTop) {
							iFirstIndex++;
						} else {
							bFirstIndexFound = true;
						}
						if (
							
							((oSizes.top + oSizes.height - obj.dom.scrollTop) >= iTop && 
							(oSizes.top + oSizes.height - obj.dom.scrollTop) <= iTop + iHeight &&
							(oSizes.top + 0.5*oSizes.height - obj.dom.scrollTop) >= iTop &&
							(oSizes.top + 0.5*oSizes.height - obj.dom.scrollTop) <= iTop + iHeight )
							||
							((oSizes.top - obj.dom.scrollTop) >= iTop && 
							(oSizes.top - obj.dom.scrollTop) <= iTop + iHeight &&
							(oSizes.top + 0.5*oSizes.height - obj.dom.scrollTop) >= iTop &&
							(oSizes.top + 0.5*oSizes.height - obj.dom.scrollTop) <= iTop + iHeight)
						) {
							iVisibleCount++;
						}
						iTotal++;
					}
				}
			}
		}
		var oEvent =  {
			contentOffset		: {x: obj.dom.scrollLeft, y:obj.dom.scrollTop},
			contentSize			: {width: obj.dom.scrollWidth, height: obj.dom.scrollHeight},
			firstVisibleItem	: iFirstIndex,
			size				: {width: obj.dom.offsetWidth, height: obj.dom.offsetHeight},
			source				: obj,
			totalItemCount		: iTotal,
			type				: 'scroll',
			visibleItemCount	: iVisibleCount
		};
		_scrollTimer = setTimeout(function() {
			obj.fireEvent('scrollEnd', {
				contentOffset		: oEvent.contentOffset,
				contentSize			: oEvent.contentSize,
				size				: oEvent.size,
				source				: obj,
				type				: 'scrollEnd'
			});
		}, 300);	
		obj.fireEvent('scroll', oEvent);
	}, false);
});
