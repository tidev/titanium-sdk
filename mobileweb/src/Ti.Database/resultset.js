Ti._5.createClass('Titanium.Database.ResultSet', function(args){
	var obj = this;
	
	var _currentRow = 0;
	var results = args;
	var aRows = args.rows;
	
	// Properties
	var _rowCount = null;
	Ti._5.prop(this, 'rowCount', {
		get: function() {return aRows.length;},
		set: function(val) {return null;}
	});

	Ti._5.prop(this, 'validRow', {
		get: function() {return _currentRow < aRows.length;},
		set: function(val) {return null;}
	});

	// Methods
	this.close = function(){
		results.close();
	};
	this.getRowCount = function() {
		return obj.rowCount;
	};
	this.field = function(index){
		var row = aRows.item(_currentRow);
		var count = 0;
		for (v in row){
			if (count==index){
				return row[v];
			}
			count++;
		}
	};
	this.fieldByName = function(name) {
		var row = aRows.item(_currentRow);
		return row[name.toUpperCase()];	
	};
	this.fieldCount = function(){
		var row = aRows.item(_currentRow);
		var count = 0;
		for (v in row){
			count++;
		}
		console.log(row.length, count);
		return count; 
	};
	this.fieldName = function(index) {
		var row = aRows.item(_currentRow);
		var count = 0;
		for (v in row){
			if (count==index){
				return v;
			}
			count++;
		}
	};
	this.isValidRow = function(){
		return obj.validRow;
	};
	this.next = function(){
		_currentRow++;
	};
	this.close = function() {
		delete this;
	}
});