Ti._5.createClass('Titanium.UI.Picker', function(args){
	var obj = this;
	var _columnIndex = 0;
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	// Interfaces
	var _type = args && args.type ? args.type : Titanium.UI.PICKER_TYPE_PLAIN;
	switch (_type) {
		case Titanium.UI.PICKER_TYPE_DATE_AND_TIME:
			Ti._5.DOMView(this, 'input', args, 'Picker');
			this.dom.type = 'datetime';
			break;
		case Titanium.UI.PICKER_TYPE_DATE:
			Ti._5.DOMView(this, 'input', args, 'Picker');
			this.dom.type = 'date';
			break;
		case Titanium.UI.PICKER_TYPE_COUNT_DOWN_TIMER:
		case Titanium.UI.PICKER_TYPE_TIME:
			Ti._5.DOMView(this, 'input', args, 'Picker');
			this.dom.type = 'date';
			break;
		case Titanium.UI.PICKER_TYPE_PLAIN:
		default:
			Ti._5.DOMView(this, 'select', args, 'Picker');
	}
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	
	// Properties
	Object.defineProperty(this, 'type', {
		get: function(){return _type;},
		set: function(val){_type = val;}
	});

	var _columns = [];
	Object.defineProperty(this, 'columns', {
		get: function(){return _columns;},
		set: function(val){return _columns = val;}
	});

	var _countDownDuration = 0;
	Object.defineProperty(this, 'countDownDuration', {
		get: function(){return _countDownDuration;},
		set: function(val){return _countDownDuration = val;}
	});

	var _locale = null;
	Object.defineProperty(this, 'locale', {
		get: function(){return _locale;},
		set: function(val){return _locale = val;}
	});

	var _minDate = null;
	Object.defineProperty(this, 'minDate', {
		get: function(){return _minDate;},
		set: function(val){return _minDate = val;}
	});

	var _minuteInterval = 1;
	Object.defineProperty(this, 'minuteInterval', {
		get: function(){return _minuteInterval;},
		set: function(val){_minuteInterval = 30 < val ? 30 : 1 > val ? 1 : val;}
	});

	var _selectionIndicator = false;
	Object.defineProperty(this, 'selectionIndicator', {
		get: function(){return _selectionIndicator;},
		set: function(val){return _selectionIndicator = val;}
	});

	var _useSpinner = false;
	Object.defineProperty(this, 'useSpinner', {
		get: function(){return _useSpinner;},
		set: function(val){return _useSpinner = val;}
	});

	var _value = null;
	Object.defineProperty(this, 'value', {
		get: function(){return _value;},
		set: function(val){return _value = val;}
	});

	var _visibleItems = null;
	Object.defineProperty(this, 'visibleItems', {
		get: function(){return obj.dom.size;},
		set: function(val){ 
			// We need this for setting 'size' property in constructor
			setTimeout(
				function() {
					obj.dom.size = parseInt(val);
			}, 10);
		}
	});
	
	Ti._5.preset(obj, ["columns", "countDownDuration", "visibleItems"], args);
	Ti._5.presetUserDefinedElements(this, args);
	
	// Methods
	var _rows = null;
	this.add = function(rows){
		if (-1 == rows.constructor.toString().indexOf('Array')) {
			rows = [rows];
		}
		if (!_rows) {
			_rows = [];
		}
		obj._children = obj._children || [];
		for (var iCounter = 0; iCounter < rows.length; iCounter++) {
			obj._children.push(rows[iCounter]);
			_rows.push(rows[iCounter]);
		}

		obj.render(null);
	};
	this.getSelectedRow = function(col){
		return _rows[obj.dom.selectedIndex];
	};
	this.reloadColumn = function(){
		console.debug('Method "Titanium.UI.Picker#.reloadColumn" is not implemented yet.');
	};
	this.setSelectedRow = function(col, row, animated){
		if (Titanium.UI.PICKER_TYPE_PLAIN != obj.type) {
			return;
		}
		/*
		if (animated) {
			obj.animate({"props": "opacity", "duration": "2s"});
		}
		*/
		obj.dom.selectedIndex = row;
		// The onchange event does not fire when the selected option of the
		// select object is changed programatically
		var oEvent = {
			source			: obj,
			type			: "change",
			value			: _value,
			column			: _columns[_columnIndex], 
			columnIndex		: _columnIndex,
			selectedValue	: _rows[obj.dom.selectedIndex].title,
			rowIndex		: obj.dom.selectedIndex,
			row				: _rows[obj.dom.selectedIndex]
		};
		obj.fireEvent('change', oEvent);
	};

	// Events
	obj.dom.addEventListener('change', function(event) {
		var selectedRow = _rows[obj.dom.selectedIndex];
		// Copy some style rules
		//*
		if (_rows[obj.dom.selectedIndex].dom.style.backgroundColor) {
			obj.backgroundColor = _rows[obj.dom.selectedIndex].backgroundColor;
		}
		if (selectedRow.dom.style.color) {
			obj.color = selectedRow.color;
		}
		obj.font = selectedRow.font;
		obj.opacity = selectedRow.opacity;
		obj.borderRadius = selectedRow.borderRadius;
		obj.borderColor = selectedRow.borderColor;
		obj.borderWidth = selectedRow.borderWidth;
		if (selectedRow.dom.style.backgroundImage) {
			obj.backgroundImage = selectedRow.backgroundImage;
		}
		if (selectedRow.dom.style.backgroundGradient) {
			obj.backgroundGradient = selectedRow.backgroundGradient;
		}
		//*/

		var oEvent = {
			source			: obj,
			type			: event.type,
			value			: _value,
			column			: _columns[_columnIndex], 
			columnIndex		: _columnIndex,
			selectedValue	: 'undefined' != typeof obj.dom.selectedIndex ? _rows[obj.dom.selectedIndex].title : obj.dom.value,
			rowIndex		: obj.dom.selectedIndex,
			row				: 'undefined' != typeof obj.dom.selectedIndex ? _rows[obj.dom.selectedIndex] : null
		};
		obj.fireEvent('change', oEvent);
	}, false);
});
