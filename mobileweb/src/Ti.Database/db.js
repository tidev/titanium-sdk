Ti._5.createClass('Titanium.Database.DB', function(args){
	var obj = this;
	var isIndexedDB = false, _db = null;
	
	if ("function" == typeof openDatabase) {
		_db = openDatabase(args.name, args.version || "1.0", args.desc || args.name,  args.size || 65536);
	} else {
		isIndexedDB = true;
		window.indexedDB = window.indexedDB || window.mozIndexedDB || window.moz_indexedDB;
		var request = indexedDB.open(args.name);
		request.onsuccess = function(event){
			_db = event.target.result || event.result;
		};
	}

	// Properties
	this.lastInsertRowId = null;
	this.name = args.name;
	this.rowsAffected = null;

	// Methods
	this.close = function() {
		if (isIndexedDB) {
			_db.close();
		}
		_db = null;
	};
	this.execute = function(sql){
		if (!_db || isIndexedDB) {
			return;
		}
		var values = arguments[1] instanceof Array ? arguments[1] : [];
		var callback = null;
		for (var i = 1; i < arguments.length; i++){
			var val = arguments[i];

			if (typeof val == 'function'){
				callback = val;
			} else if(!(val instanceof Array)){
				values.push(val);
			}
		}
		var tiResults = {};
		_db.transaction(function(tx){
			tx.executeSql(sql, values, function(tx, results){
				obj.rowsAffected = results.rowsAffected;
				
				try {
					obj.lastInsertRowId = results.insertId;
				} catch (e) {
					obj.lastInsertRowId = null;
				}
				
				if (callback) {
					callback(new Titanium.Database.ResultSet(results));
				}
			}, 
			// error callback
			function(tx, error){
				if (callback){
					tiResults['error'] = error;
					callback(tiResults);
				}
			});
		});
	};
	this.remove = function(){
		obj.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",  function(rows){
			var str = "";
			while (rows.isValidRow()) {
				if ('__WebKitDatabaseInfoTable__' != rows.field(0)) { // do not delete system table
					obj.execute("DROP TABLE " + rows.field(0));
				}
				rows.next();
			}
			rows.close();
		});
	};
});
