Ti._5.createClass("Ti.Database.ResultSet", function(args){
	var obj = this,
		currentRow = 0,
		results = args,
		aRows = args.rows;

	// Properties
	Ti._5.propReadOnly(obj, {
		rowCount: function() {return aRows.length;},
		validRow: function() {return currentRow < aRows.length;}
	});

	// Methods
	obj.close = function() {
		results.close();
	};
	obj.getRowCount = function() {
		return obj.rowCount;
	};
	obj.field = function(index){
		var v,
			row = aRows.item(currentRow),
			count = 0;
		for (v in row){
			if (count == index) {
				return row[v];
			}
			count++;
		}
	};
	obj.fieldByName = function(name) {
		var row = aRows.item(currentRow);
		return row[name.toUpperCase()];	
	};
	obj.fieldCount = function() {
		var v,
			row = aRows.item(currentRow),
			count = 0;
		for (v in row){
			count++;
		}
		//console.log(row.length, count);
		return count; 
	};
	obj.fieldName = function(index) {
		var v,
			row = aRows.item(currentRow),
			count = 0;
		for (v in row){
			if (count == index) {
				return v;
			}
			count++;
		}
	};
	obj.isValidRow = function() {
		return obj.validRow;
	};
	obj.next = function() {
		currentRow++;
	};
	obj.close = function() {
		delete this;
	}
});