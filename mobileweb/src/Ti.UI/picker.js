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
	Ti._5.prop(this, 'type', {
		get: function(){return _type;},
		set: function(val){return _type = val;}
	});

	Ti._5.member(this, 'columns', []);

	Ti._5.member(this, 'countDownDuration', 0);

	Ti._5.member(this, 'locale');

	Ti._5.member(this, 'minDate');

	var _minuteInterval = 1;
	Ti._5.prop(this, 'minuteInterval', {
		get: function(){return _minuteInterval;},
		set: function(val){return _minuteInterval = 30 < val ? 30 : 1 > val ? 1 : val;}
	});

	Ti._5.member(this, 'selectionIndicator', false);

	Ti._5.member(this, 'useSpinner');

	Ti._5.member(this, 'value');

	// Note: this is relevant only if you set `useSpinner` to `true`
	var _visibleItems = null;
	Ti._5.prop(this, 'visibleItems', {
		get: function(){return obj.dom.size;},
		set: function(val){ 
			// We need this for setting 'size' property in constructor
			setTimeout(
				function() {
					obj.dom.size = parseInt(val);
			}, 10);
			return val;
		}
	});
	
	require.mix(this, args);
	
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
