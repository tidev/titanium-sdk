/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


Titanium.databaseProxy = window.TitaniumDatabase;

function throwIfException(e) {
	if (!isUndefined(e)) {
		throw new Error(e);
	}
}

var ResultSet = function(rs) {
	this.proxy = rs;

	/**
	 * @tiapi(method=True,name=Database.ResultSet.close,since=0.4) Close an open ResultSet.
	 * @tiapi Should be called to prevent resources from leaking.
	 */
	this.close = function() {
		this.proxy.close();
	};
	/**
	 * @tiapi(method=True,name=Database.ResultSet.field,since=0.4) Retrieve the data from a column on the current row.
	 * @tiarg[int,index] The zero-based index of the column to retrieve.
	 * @tiresult[string] The contents of the column.
	 */
	this.field = function(index) {
		return transformObjectValueAsString(this.proxy.getField(index),null);
	};
	/**
	 * @tiapi(method=True,name=Database.ResultSet.fieldByName,since=0.4) Retrieve the contents of a column on the current row using the column name.
	 * @tiarg[string,fieldName] the column name
	 * @tiresult[string] the contents of the column.
	 */
	this.fieldByName = function(fieldName) {
		var name = transformObjectValueAsString(this.proxy.getFieldByName(fieldName),null);
		throwIfException(this.proxy.getLastException());
		return name;
	};
	/**
	 * @tiapi(method=True,name=Database.ResultSet.fieldCount,since=0.4) The number of columns in each row of the current ResultSet
	 * @tiresult[int] the number of columns
	 */
	this.fieldCount = function() {
		return this.proxy.getFieldCount();
	};
	/**
	 * @tiapi(method=True,name=Database.ResultSet.fieldName,since=0.4) The name of the field at the given column position
	 * @tiarg[int,index] the zero-based index
	 * @tiresult[string] the column name
	 */
	this.fieldName = function(index) {
		return transformObjectValueAsString(this.proxy.getFieldName(index),null);
	};
	/**
	 * @tiapi(method=True,name=Database.ResultSet.rowCount,since=0.4) The number of rows in the ResultSet.
	 * @tiresult[int] the row count.
	 */
	this.rowCount = function() {
		return this.proxy.getRowCount();
	};
	this.getRowCount = function() {
		return this.proxy.getRowCount();
	};
	/**
	 * @tiapi(method=True,name=Database.ResultSet.isValidRow,since=04) Used to determine if operations may be peformed on this row.
	 * @tiresult[bool] True, if it is safe to operate on the row.
	 */
	this.isValidRow = function() {
		return this.proxy.isValidRow();
	};
	/**
	 * @tiapi(method=True,name=Database.ResultSet.next,since=0.4) Move to the next row in the ResultSet
	 * @tiresult[boolean] True, if the move was successful.
	 */
	this.next = function() {
		return this.proxy.next();
	};
};

var DB = function(db) {
	this.proxy = db;

	/**
	 * @tiapi(method=True,name=Database.DB.close,since=0.4) close the database.
	 * @tiapi  This should be called to prevent resource leaks.
	 */
	this.close = function() {
		if (!isUndefined(this.proxy)) {
			this.proxy.close();
		}
	};
	/**
	 * @tiapi(method=True,name=Database.DB.execute,since=0.4) Perform an operation on the database.
	 * @tiarg[string,sql] the SQL text. Multiple statements, separated by semi-colons, are not supported on Android.
	 * @tiarg[integer|float|string,args,optional=True] one or more arguments appearing after the sql parameter. Must be integer, float, string, or any data converted to string
	 * @tiresult[Database.ResultSet]
	 */
	this.execute = function(sql) {
		qargs = [];
		for (var i=1; i < arguments.length; i++) {
			qargs.push(String(arguments[i]));
		}
		var rs = this.proxy.execute(sql, qargs);
		throwIfException(this.proxy.getLastException());
		var trs = null;
		if (rs !== null) {
			trs = new ResultSet(rs);
		}
		return trs;
	};
	/**
	 * @tiapi(method=True,name=Database.DB.getLastInsertRowId,since=0.4) the row id of the last insert operation.
	 * @tiresult[int] The id.
	 */
	this.getLastInsertRowId = function() {
		return this.proxy.getLastInsertRowId();
	};
	/**
	 * @tiapi(method=True,name=Database.DB.getRowsAffected,since=0.4) The number of rows affected by the last operation
	 * @tiresult[int] the affected row count.
	 */
	this.getRowsAffected = function() {
		return this.proxy.getRowsAffected();
	};
	/**
	 * @tiapi(method=True,name=Database.DB.remove,since=0.4) Remove this database from the device.
	 * @tiapi This is a destructive operation.
	 */
	this.remove = function() {
		this.proxy.remove();
	};
};
/**
 * @tiapi(method=False,property=True,name=Database.DB.lastInsertRowId,since=0.4) Same as getLastInsertRowId method.
 * @tiresult[int] the row id.
 */
DB.prototype.__defineGetter__("lastInsertRowId", function(){
	return this.getLastInsertRowId();
});
/**
 * @tiapi(method=False,property=True,name=Database.DB.rowsAffected,since=0.4) Same as getRowsAffected method.
 * @tiresult[int] affected row count.
 */
DB.prototype.__defineGetter__("rowsAffected", function(){
	return this.getRowsAffected();
});

Titanium.Database = {
	/**
	 * @tiapi(method=True,name=Database.open,since=0.4) Opens a database
	 * @tiarg[string,name] Name of the database. On Android it must not contain path elements.
	 * @tiresult[Database.DB] a database object, used to interact with the database.
	 */
	open: function(name) {
		db = new DB(Titanium.databaseProxy.open(name));
		throwIfException(Titanium.databaseProxy.getLastException());
		return db;
	}
};
