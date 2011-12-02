Ti._5.createClass('Titanium.UI.TableViewSection', function(args){
	var obj = this;

	args = Ti._5.extend({}, args);
	// Set some default values
	args['backgroundColor'] = args['backgroundColor'] ? args['backgroundColor'] : 'transparent';
	args['width'] = args['width'] || '100%';
	args.layout = 'vertical';
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'TableViewSection');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
		
	// Create default header & footer
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
	this.add(_oHeader);
	
	var _oRowsArea = {};
	this._oRowsArea = _oRowsArea;
	Ti._5.DOMView(_oRowsArea, 'ul', args, 'TableViewSectionTable');
	Ti._5.Touchable(_oRowsArea, args);
	Ti._5.Styleable(_oRowsArea, args);
	_oRowsArea.dom.style.listStyleType = 'none';
	_oRowsArea.dom.style.paddingLeft = '0';
	_oRowsArea.dom.style.position = '';
	_oRowsArea.dom.style.marginTop = '0';
	_oRowsArea.dom.style.marginBottom = '0';
	_oRowsArea.dom.style.minHeight = '1px';
	_oRowsArea.dom._system = true;
	_oRowsArea.addEventListener('html5_added', function(parent) {
		if (_oRowsArea._children) {
			for (var iCounter = 0; iCounter < _oRowsArea._children.length; iCounter++) {
				if (obj.parent && _oRowsArea._children[iCounter] instanceof Titanium.UI.TableViewRow) {
					_oRowsArea._children[iCounter] = obj.parent._addRowAdditionalData(_oRowsArea._children[iCounter]);
					// Restore parent reference, broke by _addRowAdditionalData function
					_oRowsArea._children[iCounter].parent = _oRowsArea;
				} 
				_oRowsArea._children[iCounter].render(obj);
			}
		}
	});
	_oRowsArea.addEventListener('click', function(oEvent) {
		// If tableviewsection has children they will fire this event 
		if (!obj._children || 0 == obj._children.length) {
			var oEvent = {
				detail		: false,
				globalPoint	: { x:oEvent.pageX, y:oEvent.pageY }, 
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
		obj.fireEvent('click', oEvent);
		// Fire table view event
		if (obj.parent) {
			obj.parent.fireEvent('click', oEvent);
		}
	});
	_oRowsArea.addEventListener('dblclick', function(event) {
		var oEvent = {
			globalPoint	: { x:event.pageX, y:event.pageY }, 
			source		: obj,
			type		: event.type,
			x			: event.pageX,
			y			: event.pageY
		};
		obj.fireEvent('dblclick', oEvent);
		// Fire table view event
		if (obj.parent) {
			obj.parent.fireEvent('dblclick', oEvent);
		}
	});
	this.add(_oRowsArea);
	
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
	this.add(_oFooter);
	
	// Properties
	var _footerTitle = '';
	Ti._5.prop(this, 'footerTitle', {
		get: function(){return _footerTitle;},
		set: function(val){
			_footerTitle = val;
			if ('undefined' != typeof _oFooter.html) {
				_oFooter.html = _footerTitle;
				return;
			}
			if ('undefined' != typeof _oFooter.text) {
				_oFooter.text = _footerTitle;
				return;
			}
			if ('undefined' != typeof _oFooter.title) {
				_oFooter.title = _footerTitle;
				return;
			}
			if ('undefined' != typeof _oFooter.message) {
				_oFooter.message = _footerTitle;
				return;
			}
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
			}
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
				return;
			}
			if ('undefined' != typeof _oHeader.text) {
				_oHeader.text = _headerTitle;
				return;
			}
			if ('undefined' != typeof _oHeader.title) {
				_oHeader.title = _headerTitle;
				return;
			}
			if ('undefined' != typeof _oHeader.message) {
				_oHeader.message = _headerTitle;
				return;
			}
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
			}
		}
	});

	Ti._5.prop(this, 'rowCount', {
		get: function() {
			var _rowCount = 0;
			for (var iCounter = 0; iCounter < _oRowsArea._children.length; iCounter++) {
				if (_oRowsArea._children[iCounter] instanceof Titanium.UI.TableViewRow) {
					_rowCount++;
				}
			}
			return _rowCount;
		},
		set: function(val){return false;}
	});

	
	require.mix(this, args);
	
	var bBlockRender = false;
	var _data = null;
	this.add = function(view) {
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