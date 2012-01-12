describe("Ti.Database tests", {
	testModuleMethodsAndConstants: function() {
		valueOf(Ti.Database).shouldNotBeNull();
		valueOf(Ti.Database).shouldBeObject();
		valueOf(Ti.Database.open).shouldBeFunction();
		valueOf(Ti.Database.install).shouldBeFunction();
		
		valueOf(Ti.Database.FIELD_TYPE_STRING).shouldNotBeNull();
		valueOf(Ti.Database.FIELD_TYPE_INT).shouldNotBeNull();
		valueOf(Ti.Database.FIELD_TYPE_FLOAT).shouldNotBeNull();
		valueOf(Ti.Database.FIELD_TYPE_DOUBLE).shouldNotBeNull();
	},
	testDatabaseMethods : function() {
		var db = Ti.Database.open("Test");
		try {
			valueOf(db).shouldNotBeNull();
			valueOf(db).shouldBeObject();
			valueOf(db.close).shouldBeFunction();
			valueOf(db.execute).shouldBeFunction();
			valueOf(db.getLastInsertRowId).shouldBeFunction();
			valueOf(db.getName).shouldBeFunction();
			valueOf(db.getRowsAffected).shouldBeFunction();
			valueOf(db.remove).shouldBeFunction();
		
			// Properties
			valueOf(db.lastInsertRowId).shouldBeNumber();
			valueOf(db.name).shouldBeString();
			valueOf(db.name).shouldBe("Test");
			valueOf(db.rowsAffected).shouldBeNumber();
		} finally {
			db.close();
		}
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2147-android-pragma-and-non-select-statements-return-null-from-tidatabasedbexecute-instead-of-resultset
	testDatabaseLH2147 : function() {
		var db = Ti.Database.open("Test");
		try {
			valueOf(db).shouldNotBeNull();
		
			var rs = db.execute("drop table if exists Test");
			valueOf(rs).shouldBeNull();

			rs = db.execute("create table if not exists Test(row text)");
			valueOf(rs).shouldBeNull();
		
			rs = db.execute("pragma table_info(Test)");
			valueOf(rs).shouldNotBeNull();
			valueOf(rs.fieldCount).shouldBeGreaterThan(0);
			rs.close();
		
			rs = db.execute("select * from Test");
			valueOf(rs).shouldNotBeNull();
			valueOf(rs.getFieldCount()).shouldBe(1);
			valueOf(rs.rowCount).shouldBe(0);
			rs.close();
		} finally {
			db.close();
			db.remove();
		}
		
		var f = Ti.Filesystem.getFile("file:///data/data/org.appcelerator.titanium.testharness/databases/Test");
		valueOf(f.exists()).shouldBeFalse();
	},
	testDatabaseInsert : function() {
		var db = Ti.Database.open("Test");
		try {
			valueOf(db).shouldNotBeNull();
		
			var rs = db.execute("drop table if exists Test");
			valueOf(rs).shouldBeNull();

			rs = db.execute("create table if not exists Test(row text)");
			valueOf(rs).shouldBeNull();

			db.execute("insert into Test(row) values(?)", "My TestRow");
		
			rs = db.execute("select * from Test");
			valueOf(rs).shouldNotBeNull();
			valueOf(rs.isValidRow()).shouldBe(true);
			valueOf(rs.getFieldCount()).shouldBe(1);
			valueOf(rs.rowCount).shouldBe(1);
			valueOf(rs.getField(0)).shouldBe("My TestRow");
			rs.close();
		} finally {
			db.close();
			db.remove();
		}
		
		var f = Ti.Filesystem.getFile("file:///data/data/org.appcelerator.titanium.testharness/databases/Test");
		valueOf(f.exists()).shouldBeFalse();
	},
	testDatabaseCount : function() {
		var testRowCount = 100;
		var db = Ti.Database.open('Test');
		try {
			valueOf(db).shouldNotBeNull();
			
			var rs = db.execute("drop table if exists data");
			valueOf(rs).shouldBeNull();
			
			db.execute('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, val TEXT)');
			for (var i = 1; i <= testRowCount; i++) {
			    db.execute('INSERT INTO data (val) VALUES(?)','our value:' + i);
			}

		    rs = db.execute("SELECT * FROM data");
		    var rowCount = rs.rowCount;
		    var realCount = 0;
		    while (rs.isValidRow()) {
		        realCount += 1;
		        rs.next();
		    }
			rs.close();
			
		    valueOf(realCount).shouldBe(testRowCount);
		    valueOf(rowCount).shouldBe(testRowCount);
		    valueOf(rowCount).shouldBe(realCount);
		} finally {
			db.close();
			db.remove();
		}
	},
	testDatabaseRollback : function () {
		var db = Ti.Database.open('Test');
		var testRowCount = 30;
		try {
			valueOf(db).shouldNotBeNull();
			
			var rs = db.execute("drop table if exists data");
			valueOf(rs).shouldBeNull();
			
			db.execute('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, val TEXT)');
			
			db.execute('BEGIN TRANSACTION');
			for (var i = 1; i <= testRowCount; i++) {
			    db.execute('INSERT INTO data (val) VALUES(?)','our value:' + i);
			}
			rs = db.execute("SELECT * FROM data");
		    valueOf(rs.rowCount).shouldBe(testRowCount);
			rs.close();
			
			db.execute('ROLLBACK TRANSACTION');
		
			rs = db.execute("SELECT * FROM data");
			valueOf(rs.rowCount).shouldBe(0);
			rs.close();
		
			db.execute('drop table if exists data');
		} finally {
			db.close();
			db.remove();
		}
	},
	testDatabaseSavepointRollback : function () {
		var db = Ti.Database.open('Test');
		var testRowCount = 30;
		try {
			valueOf(db).shouldNotBeNull();
			
			var rs = db.execute("drop table if exists data");
			valueOf(rs).shouldBeNull();
			
			// Devices with Android API Levels before 8 don't support savepoints causing
			// a false failure on those devices. Try and detect and only do
			// this complex test if savepoints work 
			var savepointSupported = true;
			try {
				db.execute('SAVEPOINT test');
				db.execute('RELEASE SAVEPOINT test');
			} catch (E) {
				savepointSupported = false;
			}
			
			if (savepointSupported) {
				db.execute('BEGIN DEFERRED TRANSACTION');
				db.execute('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, val TEXT)');
				db.execute('SAVEPOINT FOO');
				for (var i = 1; i <= testRowCount; i++) {
				    db.execute('INSERT INTO data (val) VALUES(?)','our value:' + i);
				}
				db.execute('ROLLBACK TRANSACTION TO SAVEPOINT FOO');
				db.execute('COMMIT TRANSACTION');
			
				rs = db.execute("SELECT * FROM data");
				valueOf(rs.rowCount).shouldBe(0);
				rs.close();
			
				db.execute('BEGIN TRANSACTION');
				db.execute('drop table if exists data');
				db.execute('ROLLBACK TRANSACTION');
			
				rs = db.execute("SELECT * FROM data");
				valueOf(rs).shouldNotBeNull();
				rs.close();
			}
		} finally {
			db.close();
			db.remove();
		}
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2917-api-doc-dbexecute
	testDatabaseLH2917: function() {
		var db = Titanium.Database.open('Test'),
		    rowCount = 10,
				resultSet, i, counter;

		
		valueOf(db).shouldBeObject();
		valueOf(resultSet).shouldBeUndefined();
		valueOf(i).shouldBeUndefined();
		valueOf(counter).shouldBeUndefined();

		try {
			db.execute('CREATE TABLE IF NOT EXISTS stuff (id INTEGER, val TEXT)');
			db.execute('DELETE FROM stuff'); //clear table of all existing data

		  //test that the execute method works with and without an array as the second argument

			for(i = 1; i <= rowCount / 2; ++i) {
				 db.execute('INSERT INTO stuff (id, val) VALUES(?, ?)', i, 'our value' + i);
			}

			while(i <= rowCount) {
				 db.execute('INSERT INTO stuff (id, val) VALUES(?, ?)', [i, 'our value' + i]);
				 ++i;
			}

			resultSet = db.execute('SELECT * FROM stuff');
			
			valueOf(resultSet).shouldNotBeNull();
			valueOf(resultSet).shouldBeObject();
			valueOf(resultSet.rowCount).shouldBe(rowCount);

			counter = 1;
			while(resultSet.isValidRow()) {
				valueOf(resultSet.fieldByName('id')).shouldBe(counter);
			  valueOf(resultSet.fieldByName('val')).shouldBe('our value' + counter);
			  ++counter;

				resultSet.next();
			}
			resultSet.close()
		} catch(e) {
			Titanium.API.debug('error occurred: ' + e);
		} finally {
			db.close();
			db.remove();
	 	}
	},
	
	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/3393-db-get-api-extended-to-support-typed-return-value
	testTypedGettersAndSetters: function() {
		var db   = Ti.Database.open('Test'),
		rowCount = 10,
		resultSet = null,
		i, counter, current_float, float_factor = 0.5555;

		var isAndroid = (Ti.Platform.osname === 'android');
		valueOf(db).shouldBeObject();

		try {
			counter = 1;
			i = 1;
			
			db.execute('CREATE TABLE IF NOT EXISTS stuff (id INTEGER, f REAL, val TEXT)');
			db.execute('DELETE FROM stuff;'); //clear table of all existing data
	
			var insert_float;
			while(i <= rowCount) {
			   insert_float = float_factor * i;
				 db.execute('INSERT INTO stuff (id, f, val) VALUES(?, ?, ?)', [i, insert_float, 'our value' + i]);
				 ++i;
			}
			
			resultSet = db.execute('SELECT * FROM stuff');
			
			valueOf(resultSet).shouldNotBeNull();
			valueOf(resultSet).shouldBeObject();
			valueOf(resultSet.rowCount).shouldBe(rowCount);

			while(resultSet.isValidRow()) {
				
				current_float = counter * float_factor;
				
				valueOf(resultSet.fieldByName('id', Ti.Database.FIELD_TYPE_INT)).shouldBe(resultSet.field(0, Ti.Database.FIELD_TYPE_INT));
				valueOf(resultSet.fieldByName('id', Ti.Database.FIELD_TYPE_INT)).shouldBe(counter);
				
			  	valueOf(resultSet.fieldByName('id', Ti.Database.FIELD_TYPE_INT)).shouldBe(counter);
				valueOf(resultSet.fieldByName('id', Ti.Database.FIELD_TYPE_INT)).shouldBe(counter);

				valueOf(resultSet.fieldByName('f', Ti.Database.FIELD_TYPE_INT)).shouldBe(resultSet.field(1, Ti.Database.FIELD_TYPE_INT));
				valueOf(resultSet.fieldByName('f', Ti.Database.FIELD_TYPE_INT)).shouldBe(parseInt(counter * float_factor));
				
				var f_val = resultSet.fieldByName('f', Ti.Database.FIELD_TYPE_FLOAT);
 	  			valueOf(Math.floor(Math.round(f_val * 10000))/10000).shouldBe(current_float);
				valueOf(resultSet.fieldByName('f', Ti.Database.FIELD_TYPE_DOUBLE)).shouldBe(current_float);
				
				valueOf(resultSet.fieldByName('val', Ti.Database.FIELD_TYPE_STRING)).shouldBe('our value' + counter);
				valueOf(resultSet.fieldByName('id', Ti.Database.FIELD_TYPE_STRING)).shouldBe(counter.toString());
				valueOf(resultSet.fieldByName('f', Ti.Database.FIELD_TYPE_STRING)).shouldBe(current_float.toString());
				
				
				// WARNING: On iOS, the following functions throw an uncaught exception - 
				
					valueOf(function() {
						resultSet.fieldByName('val', Ti.Database.FIELD_TYPE_INT);
					}).shouldThrowException();
				
					valueOf(function() {
						resultSet.fieldByName('val', Ti.Database.FIELD_TYPE_DOUBLE);
					}).shouldThrowException();
				
					valueOf(function() {
						resultSet.fieldByName('val', Ti.Database.FIELD_TYPE_FLOAT);
					}).shouldThrowException();
				
					valueOf(function() {
						resultSet.field(2, Ti.Database.FIELD_TYPE_DOUBLE);
					}).shouldThrowException();
				
					valueOf(function() {
						resultSet.field(2, Ti.Database.FIELD_TYPE_FLOAT);
					}).shouldThrowException();
				
					valueOf(function() {
						resultSet.field(2, Ti.Database.FIELD_TYPE_INT);
					}).shouldThrowException();

			  ++counter;

				resultSet.next();
			}
			
		} finally {
			if(null != db) {
				db.close();
			}

			if(null != resultSet) {
				resultSet.close();
			}
		}
	},
	testDatabaseExceptions : function() {
		var isAndroid = (Ti.Platform.osname === 'android');
			valueOf( function() { Ti.Database.open("fred://\\"); }).shouldThrowException();
			var db = null;
			try {
				db = Titanium.Database.open('Test');
			
				valueOf( function() { 
					Ti.Database.execute("select * from notATable"); 
				}).shouldThrowException();
			
				db.execute('CREATE TABLE IF NOT EXISTS stuff (id INTEGER, val TEXT)');
				db.execute('INSERT INTO stuff (id, val) values (1, "One")');
				
				valueOf( function() {
					db.execute('SELECT * FROM idontexist');
				}).shouldThrowException();
				
				var rs = db.execute("SELECT id FROM stuff WHERE id = 1");
				
				valueOf( function() {
					rs.field(2);
				}).shouldThrowException();
	
				valueOf( function() {
					rs.field(2);
				}).shouldThrowException();
			
				valueOf( function() {
					rs.fieldName(2);
				}).shouldThrowException();
			
				if (rs != null) {
					rs.close();
				}
			} finally {
				if (db != null) {
					db.close();
				db.remove();
				}
			}
	}
});