Ti._5.createClass("Ti.UI.Picker", function(args){
	args = require.mix({
		unselectable: true
	}, args);

	var obj = this,
		domNode,
		_columnIndex = 0,
		_type = args.type || Ti.UI.PICKER_TYPE_PLAIN,
		_minuteInterval = 1,
		_visibleItems = null,
		_rows = null;

	// Interfaces
	switch (_type) {
		case Ti.UI.PICKER_TYPE_DATE_AND_TIME:
			(domNode = Ti._5.DOMView(obj, "input", args, "Picker")).type = "datetime";
			break;
		case Ti.UI.PICKER_TYPE_DATE:
		case Ti.UI.PICKER_TYPE_COUNT_DOWN_TIMER:
		case Ti.UI.PICKER_TYPE_TIME:
			(domNode = Ti._5.DOMView(obj, "input", args, "Picker")).type = "date";
			break;
		case Ti.UI.PICKER_TYPE_PLAIN:
		default:
			domNode = Ti._5.DOMView(obj, "select", args, "Picker");
	}
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
	
	// Properties
	Ti._5.prop(obj, {
		columns: [],
		countDownDuration: 0,
		locale: null,
		minDate: null,
		minuteInterval: {
			get: function(){return _minuteInterval;},
			set: function(val){_minuteInterval = Math.max(Math.min(val, 30), 1);}
		},
		selectionIndicator: false,
		type: {
			get: function(){return _type;},
			set: function(val){_type = val;}
		},
		useSpinner: null,
		value: null,
		visibleItems: {
			get: function(){return domNode.size;},
			set: function(val){ 
				// We need this for setting "size" property in constructor
				setTimeout(function() {
					domNode.size = parseInt(val);
				}, 1);
			}
		}
	});

	require.mix(obj, args);

	// Methods
	obj.add = function(rows){
		if (-1 == rows.constructor.toString().indexOf("Array")) {
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
	obj.getSelectedRow = function(col){
		return _rows[domNode.selectedIndex];
	};
	obj.reloadColumn = function(){
		console.debug('Method "Ti.UI.Picker#.reloadColumn" is not implemented yet.');
	};
	obj.setSelectedRow = function(col, row, animated){
		if (Ti.UI.PICKER_TYPE_PLAIN != obj.type) {
			return;
		}
		/*
		if (animated) {
			obj.animate({"props": "opacity", "duration": "2s"});
		}
		*/
		domNode.selectedIndex = row;
		// The onchange event does not fire when the selected option of the
		// select object is changed programatically
		obj.fireEvent("change", {
			value			: obj.value,
			column			: obj.columns[_columnIndex], 
			columnIndex		: _columnIndex,
			selectedValue	: _rows[domNode.selectedIndex].title,
			rowIndex		: domNode.selectedIndex,
			row				: _rows[domNode.selectedIndex]
		});
	};

	// Events
	require.on(domNode, "change", function() {
		var selectedRow = _rows[domNode.selectedIndex];
		// Copy some style rules
		if (_rows[domNode.selectedIndex].dom.style.backgroundColor) {
			obj.backgroundColor = _rows[domNode.selectedIndex].backgroundColor;
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

		obj.fireEvent("change", {
			value			: obj.value,
			column			: obj.columns[_columnIndex], 
			columnIndex		: _columnIndex,
			selectedValue	: "undefined" != typeof domNode.selectedIndex ? _rows[domNode.selectedIndex].title : domNode.value,
			rowIndex		: domNode.selectedIndex,
			row				: "undefined" != typeof domNode.selectedIndex ? _rows[domNode.selectedIndex] : null
		});
	});
});
