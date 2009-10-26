/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef MODULE_TI_DATABASE

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

@interface DatabaseModule : NSObject<TitaniumModule> {
	NSInteger nextDatabaseToken;
	NSInteger nextDatabaseResultsToken;
	NSMutableDictionary * databaseDict;
	NSMutableDictionary * databaseResultsDict;
	
	NSString * databaseFolderPath;
}

@end

/**
 * @tiapi(method=True,name=Database.open,since=0.4) Opens a database
 * @tiarg(for=Database.open,name=name,type=string) database name
 * @tiresult(for=Database.open,type=object) returns a Database.DB proxy object
 *
 * @tiapi(method=True,name=Database.install,since=0.8) Install (if not already installed) and opens a database
 * @tiarg(for=Database.install,name=path,type=string) database path or url
 * @tiarg(for=Database.install,name=name,type=string) database name
 * @tiresult(for=Database.install,type=object) returns a Database.DB proxy object 
 *
 * @tiapi(method=True,name=Database.DB.execute,since=0.4) perform a command on a database
 * @tiarg(for=Database.DB.execute,name=sql,type=string) sql expression
 * @tiarg(for=Database.DB.execute,name=args,type=object) one or more arguments to be inserted in the expression. May be integer, float, string, or data blob
 * @tiresult(for=Database.DB.execute,type=object) returns a Database.ResultSet
 *
 * @tiapi(method=True,name=Database.DB.close,since=0.4) close an open database
 *
 * @tiapi(method=True,name=Database.DB.remove,since=0.4) remove a database
 *
 * @tiapi(property=True,name=Database.DB.lastInsertRowId) the id of the last of rows affected by the last execute
 * @tiapi(method=True,name=Database.DB.getLastInsertRowId,since=0.4) convenience method for lastInsertRowId
 * @tiresult(for=Database.DB.getLastInsertRowId,type=int) returns the id of the last of rows affected by the last execute
 *
 * @tiapi(property=True,name=Database.DB.rowsAffected) the number of rows affected by the last execute
 * @tiapi(method=True,name=Database.DB.getRowsAffected,since=0.4) convenience method for rowsAffected
 * @tiresult(for=Database.DB.getRowsAffected,type=int) returns the number of rows affected by the last execute
 *
 *
 * @tiapi(method=True,name=Database.ResultSet.isValidRow,since=0.4) Checks whether you can call data extraction methods
 * @tiresult(for=Database.ResultSet.isValidRow,type=boolean) true if the row is valid
 *
 * @tiapi(method=True,name=Database.ResultSet.isValidRow,since=0.4) Moves the pointer to the next row of the result set
 *
 * @tiapi(method=True,name=Database.ResultSet.close,since=0.4) Releases the state associated with the result set
 *
 * @tiapi(method=True,name=Database.ResultSet.fieldCount,since=0.4) Returns the number of fields of the result set
 * @tiresult(for=Database.ResultSet.fieldCount,type=integer) the number of fields of the result set
 *
 * @tiapi(method=True,name=Database.ResultSet.rowCount,since=0.4) Returns the number of rows of the result set
 * @tiresult(for=Database.ResultSet.rowCount,type=integer) the number of the rows of the result set
 *
 * @tiapi(method=True,name=Database.ResultSet.fieldName,since=0.4) Returns the name of the specified field in the current result set taken from the SQL statement which was executed
 * @tiarg(for=Database.ResultSet.fieldName,type=integer,name=fieldIndex) the zero-based index of the desired field
 * @tiresult(for=Database.ResultSet.fieldName,type=string) The name of the specified field
 *
 * @tiapi(method=True,name=Database.ResultSet.field,since=0.4) Returns the contents of the specified field in the current row
 * @tiarg(for=Database.ResultSet.field,type=integer,name=fieldIndex) the zero-based index of the desired field
 * @tiresult(for=Database.ResultSet.field,type=object) The content of the specified field in the current row
 *
 * @tiapi(method=True,name=Database.ResultSet.fieldByName,since=0.4) Returns the contents of the specified field in the current row using the name of the field as an identifier
 * @tiarg(for=Database.ResultSet.fieldByName,type=string,name=name) the name of the desired field
 * @tiresult(for=Database.ResultSet.fieldByName,type=object) The content of the specified field in the current row
 */



#endif