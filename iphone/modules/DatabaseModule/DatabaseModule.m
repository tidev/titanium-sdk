/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_DATABASE


#import "DatabaseModule.h"
#import "PlausibleDatabase.h"

@interface DatabaseProxy : NSObject //Dumb wrapper
{
	PLSqliteDatabase * database;
	NSMutableDictionary * preparedStatementDict;
//	NSMutableDictionary * busyStatements;
//	NSMutableDictionary * idleStatements;
}

@property(readwrite,nonatomic,retain)	PLSqliteDatabase * database;
@property(readwrite,nonatomic,retain)	NSMutableDictionary * preparedStatementDict;

@end

@implementation DatabaseProxy
@synthesize database, preparedStatementDict;

- (id) init;
{
	if ((self = [super init])){
	}
	return self;
}

- (void) dealloc
{
	[database release];
	[preparedStatementDict release];
	[super dealloc];
}

@end

@implementation DatabaseModule

- (NSString *) getDBInstallPath
{
	if (databaseFolderPath == nil){
		NSString * supportFolderPath = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
		databaseFolderPath = [[supportFolderPath stringByAppendingPathComponent:@"database"] retain];
		NSFileManager * theFM = [[NSFileManager alloc] init];
		BOOL isDirectory;
		BOOL exists = [theFM fileExistsAtPath:databaseFolderPath isDirectory:&isDirectory];
		
		if (exists && !isDirectory) {
			[theFM release];
			return nil;
		}
		if (!exists) [theFM createDirectoryAtPath:databaseFolderPath withIntermediateDirectories:YES attributes:nil error:nil];
		[theFM release];
	}
	
	return databaseFolderPath;
}

- (NSDictionary*) installDatabase: (NSDictionary*) dict
{
	NSString *urlString = (NSString*)[dict objectForKey:@"path"];
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString *path = [theHost filePathFromURL:[theHost resolveUrlFromString:urlString useFilePath:NO]];
	NSFileManager * theFM = [[NSFileManager alloc] init];
	BOOL isDirectory;
	BOOL exists = [theFM fileExistsAtPath:path isDirectory:&isDirectory];
	if (!exists || isDirectory)
	{
		[theFM release];
		return [NSDictionary dictionaryWithObjectsAndKeys:
					[NSNumber numberWithBool:NO],@"success",
					@"invalid database path",@"error",
					nil];
	}
	NSError *error = nil;
	NSString *databaseName = (NSString*)[dict objectForKey:@"name"];
	NSString * ourDatabasePath = [[[self getDBInstallPath] stringByAppendingPathComponent:databaseName] stringByAppendingPathExtension:@"sql"];
	exists = [theFM fileExistsAtPath:ourDatabasePath isDirectory:&isDirectory];
	if (!exists)
	{
		[theFM copyItemAtPath:path toPath:ourDatabasePath error:&error];
		if (error!=nil)
		{
			[theFM release];
			return [NSDictionary dictionaryWithObjectsAndKeys:
						[NSNumber numberWithBool:NO],@"success",
						[error description],@"error",
						nil];
		}
	}
	[theFM release];
	return [NSDictionary dictionaryWithObjectsAndKeys:
				[NSNumber numberWithBool:YES],@"success",
				nil];
}


- (NSString *) openDatabase: (NSString *) databaseName;
{
	if (![databaseName isKindOfClass:[NSString class]]) return nil;

	if (databaseFolderPath == nil){
		NSString * supportFolderPath = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
		databaseFolderPath = [[supportFolderPath stringByAppendingPathComponent:@"database"] retain];
		NSFileManager * theFM = [[NSFileManager alloc] init];
		BOOL isDirectory;
		BOOL exists = [theFM fileExistsAtPath:databaseFolderPath isDirectory:&isDirectory];
		
		if (exists && !isDirectory) {
			[theFM release];
			return nil;
		}
		if (!exists) [theFM createDirectoryAtPath:databaseFolderPath withIntermediateDirectories:YES attributes:nil error:nil];
		[theFM release];
	}
	
	NSString * ourDatabasePath = [[[self getDBInstallPath] stringByAppendingPathComponent:databaseName] stringByAppendingPathExtension:@"sql"];
	PLSqliteDatabase * newDB = [[PLSqliteDatabase alloc] initWithPath:ourDatabasePath];
	
	if (![newDB open]){
		[newDB release];
		return nil;
	}
	
	DatabaseProxy * newProxy = [[DatabaseProxy alloc] init];
	[newProxy setDatabase:newDB];[newDB release];

	NSString * tokenString = [NSString stringWithFormat:@"DB%d",nextDatabaseToken++];
	[databaseDict setObject:newProxy forKey:tokenString];[newProxy release];
	
	return tokenString;
}

- (void) removeDatabase: (NSString *) databaseName;
{
	if (![databaseName isKindOfClass:[NSString class]]) return;
	DatabaseProxy * ourProxy = [databaseDict objectForKey:databaseName];
	if (ourProxy == nil)return;

	PLSqliteDatabase * ourDB = [ourProxy database];
	NSString * dbPath = [ourDB path];

	[ourDB close];

	NSFileManager * theFM = [[NSFileManager alloc] init];
	BOOL success = [theFM removeItemAtPath:dbPath error:nil];
	if (!success) NSLog(@"[WARN] Failed to wipe %@",dbPath);
	[theFM release];
	
	[ourDB open];
}

- (void) closeDatabase: (NSString *) databaseName;
{
	if (![databaseName isKindOfClass:[NSString class]]) return;
	DatabaseProxy * ourProxy = [databaseDict objectForKey:databaseName];
	if (ourProxy == nil)return;
	
//	[[ourProxy database] close]; The DB closes when released
	[databaseDict removeObjectForKey:databaseName];
}

- (id) runDatabase: (NSString *) databaseName command: (NSString *) commandString arguments: (NSArray *) arguments;
{
	Class NSStringClass = [NSString class];
	if (![databaseName isKindOfClass:NSStringClass] || ![commandString isKindOfClass:NSStringClass]) return nil;
	DatabaseProxy * ourProxy = [databaseDict objectForKey:databaseName];
	if (ourProxy == nil) return nil;

	commandString = [commandString stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

	PLSqliteDatabase * ourDB = [ourProxy database];
	PLSqlitePreparedStatement * commandStatement = (PLSqlitePreparedStatement *) [ourDB prepareStatement:commandString error:nil];
	if (([arguments isKindOfClass:[NSArray class]]) && ([arguments count]>0)) {
		[commandStatement bindParameters:arguments];
	}

	NSString * commandPrefix = [[commandString substringToIndex:6] lowercaseString];
	//TODO: edge cases where select has a side effect?

	PLSqliteResultSet * ourResultSet = (PLSqliteResultSet *)[commandStatement executeQuery];
	int resultsRowCount = 0;
#ifdef EARLY_EVAL
	sqlite3 * actualDB = [ourDB sqliteDB];
	int lastInsertRowID = sqlite3_last_insert_rowid(actualDB);
	int affectedRowCount = sqlite3_changes(actualDB);
#endif

	if ([@"select" isEqualToString:commandPrefix]){
		resultsRowCount = [ourResultSet fullCount];
	}

//TODO: Don't bother with a token when there's no actual result back.
	[ourResultSet next];

	NSString * tokenString = [NSString stringWithFormat:@"DBRS%d",nextDatabaseResultsToken++];
	NSArray * fieldsArray = [ourResultSet fieldNames];
	NSArray * valuesArray = [ourResultSet valuesForRow];

#ifndef EARLY_EVAL
	sqlite3 * actualDB = [ourDB sqliteDB];
	int lastInsertRowID = sqlite3_last_insert_rowid(actualDB);
	int affectedRowCount = sqlite3_changes(actualDB);
#endif
	
	if(ourResultSet == nil){
		//TODO: raise exception?
		return nil;
	}
	[databaseResultsDict setObject:ourResultSet forKey:tokenString];
	
	if (tokenString == nil) tokenString = (id)[NSNull null];
	if (fieldsArray == nil) fieldsArray = (id)[NSNull null];
	if (valuesArray == nil) valuesArray = (id)[NSNull null];
	
	NSDictionary * results = [NSDictionary dictionaryWithObjectsAndKeys:
			tokenString,@"token",
			fieldsArray,@"fields",
			valuesArray,@"values",
			[NSNumber numberWithInt:resultsRowCount],@"rowCount",
			[NSNumber numberWithInt:affectedRowCount],@"rowsAffected",
			[NSNumber numberWithInt:lastInsertRowID],@"lastRow",
			nil];
	return results;
}

- (void) closeResults: (NSString *) resultsName;
{
	if (![resultsName isKindOfClass:[NSString class]]) return;
	PLSqliteResultSet * ourResultSet = [databaseResultsDict objectForKey:resultsName];
	if (ourResultSet == nil) return;
	
	[ourResultSet close];
	[databaseResultsDict removeObjectForKey:resultsName];
}

- (NSArray *) nextResults: (NSString *) resultsName;
{
	if (![resultsName isKindOfClass:[NSString class]]) return nil;
	PLSqliteResultSet * ourResultSet = [databaseResultsDict objectForKey:resultsName];
	if (ourResultSet == nil) return nil;

	BOOL isValidRow = [ourResultSet next];
	if (!isValidRow) return nil;
	NSArray * results = [ourResultSet valuesForRow];
	return results;
}




#pragma mark startModule

- (BOOL) startModule;
{
	sqlite3_enable_shared_cache(TRUE);
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
	[(DatabaseModule *)invocGen openDatabase: nil];
	NSInvocation * openDBInvoc = [invocGen invocation];

	[(DatabaseModule *)invocGen installDatabase: nil];
	NSInvocation * installDBInvoc = [invocGen invocation];
	
	[(DatabaseModule *)invocGen removeDatabase: nil];
	NSInvocation * removeDBInvoc = [invocGen invocation];
	
	[(DatabaseModule *)invocGen closeDatabase: nil];
	NSInvocation * closeDBInvoc = [invocGen invocation];

	[(DatabaseModule *)invocGen runDatabase: nil command: nil arguments:nil];
	NSInvocation * executeDBInvoc = [invocGen invocation];

	[(DatabaseModule *)invocGen closeResults: nil];
	NSInvocation * closeRSInvoc = [invocGen invocation];

	[(DatabaseModule *)invocGen nextResults: nil];
	NSInvocation * nextRSInvoc = [invocGen invocation];

	
	NSString * openDBFunctionString = @"function(arg){var tkn=Ti.Database._OPNDB(arg);"
			"if(tkn==null){return null;}var res={"
				"name:arg,_TOKEN:tkn,"
				"close:function(){Ti.Database._CLSDB(this._TOKEN);},"
				"remove:function(){Ti.Database._RMDB(this._TOKEN);},"
				"execute:function(query){"
					"var args=[];"
					"for(var i=1;i<arguments.length;i++){args.push(arguments[i]);}"
					"var comm=Ti.Database._EXEDB(this._TOKEN,query,args);this.rowsAffected=comm.rowsAffected;this.lastInsertRowId=comm.lastRow;"
					"var res={_TOKEN:comm.token,"
						"fields:comm.fields,rowCount:comm.rowCount,values:comm.values,"
						"close:function(){Ti.Database._CLSRS(this._TOKEN);},"
						"next:function(){this.values=Ti.Database._NXTRS(this._TOKEN);},"
						"field:function(arg){return this.values[arg];},"
						"fieldByName:function(arg){for(i in this.fields){if(arg==this.fields[i]){return this.values[i];}}return undefined;},"
						"getFieldCount:function(){return this.fields.length;},"
						"getFieldName:function(arg){return this.fields[arg];},"
						"getRowCount:function(){return this.rowCount;},"
						"isValidRow:function(){return ((this.values!=null)&&(this.values!=undefined));},"
					"};Ti.Database._DBRES[comm.token]=res;return res;"
				"},"
				"rowsAffected:null,"
				"lastInsertRowId:null,"
				"getRowsAffected:function(){return this.rowsAffected},"
				"getLastInsertRowId:function(){return this.lastInsertRowId},"
			"};"
			"Ti.Database._DB[tkn]=res;return res;}";

	NSString * installDBFunctionString = @"function(path,name){"
		"var r=Ti.Database._INSDB({path:path,name:name});"
		"if (!r.success) throw r.error;"
		"return Ti.Database.open(name);"
		"}";

	databaseDict = [[NSMutableDictionary alloc] init];
	databaseResultsDict = [[NSMutableDictionary alloc] init];
	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			databaseDict,@"_DB",
			databaseResultsDict,@"_DBRES",

			openDBInvoc,@"_OPNDB",
			installDBInvoc,@"_INSDB",
			removeDBInvoc,@"_RMDB",
			closeDBInvoc,@"_CLSDB",
			executeDBInvoc,@"_EXEDB",
			closeRSInvoc,@"_CLSRS",
			nextRSInvoc,@"_NXTRS",
			
			[TitaniumJSCode codeWithString:openDBFunctionString],@"open",
			[TitaniumJSCode codeWithString:installDBFunctionString],@"install",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:moduleDict forKey:@"Database"];
	
	return YES;
}

- (void) dealloc
{
	[databaseDict release];
	[databaseResultsDict release];
	[super dealloc];
}


@end

#endif