/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE

#import "TiDatabaseProxy.h"
#import "TiDatabaseResultSetProxy.h"
#import "TiUtils.h"

@implementation TiDatabaseProxy

#pragma mark Internal

-(void)dealloc
{
	[self _destroy];
	RELEASE_TO_NIL(name);
	[super dealloc];
}

-(void)shutdown:(id)sender
{
	if (database!=nil)
	{
		[database close];
		RELEASE_TO_NIL(database);
	}
}

-(void)_destroy
{
	[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiShutdownNotification object:nil];
	[self shutdown:nil];
	[super _destroy];
}

-(void)_configure
{
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shutdown:) name:kTiShutdownNotification object:nil];
	[super _configure];
}

-(NSString*)dbDir
{
	NSString *rootDir = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString *dbPath = [[rootDir stringByAppendingPathComponent:@"database"] retain];
	NSFileManager *fm = [NSFileManager defaultManager];
	
	BOOL isDirectory;
	BOOL exists = [fm fileExistsAtPath:dbPath isDirectory:&isDirectory];
	
	// create folder
	if (!exists) 
	{
		[fm createDirectoryAtPath:dbPath withIntermediateDirectories:YES attributes:nil error:nil];
	}
	
	return [dbPath autorelease];
}

-(NSString*)dbPath:(NSString*)name_
{
	NSString *dbDir = [self dbDir];
	return [[dbDir stringByAppendingPathComponent:name_] stringByAppendingPathExtension:@"sql"];
}

-(void)open:(NSString*)name_
{
	name = [name_ retain];
	NSString *path = [self dbPath:name];
	
	database = [[PLSqliteDatabase alloc] initWithPath:path];
	if (![database open])
	{
		[self throwException:@"couldn't open database" subreason:nil location:CODELOCATION];
	}
}

-(void)install:(NSString*)path name:(NSString*)name_
{
	BOOL isDirectory;
	NSFileManager *fm = [NSFileManager defaultManager];
	NSURL *url = [TiUtils toURL:path proxy:self];
	path = [url path];
	BOOL exists = [fm fileExistsAtPath:path isDirectory:&isDirectory];
	if (!exists)
	{
		[self throwException:@"invalid database install path" subreason:path location:CODELOCATION];
	}
	
	// get the install path
	NSString *installPath = [self dbPath:name_];
	
	// see if we have already installed the DB
	exists = [fm fileExistsAtPath:installPath isDirectory:&isDirectory];
	if (!exists)
	{
		NSError *error = nil;
		// install it by copying it
		[fm copyItemAtPath:path toPath:installPath error:&error];
		if (error!=nil)
		{
			[self throwException:@"couldn't install database" subreason:[error description] location:CODELOCATION];
		}
	}
	
	[self open:name_];
}

-(void)removeStatement:(PLSqliteResultSet*)statement
{
	[statement close];
	if (statements!=nil)
	{
		[statements removeObject:statement];
	}
}

#pragma mark Public APIs

-(id)execute:(id)args
{
	NSString *sql = [[args objectAtIndex:0] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

	NSError *error = nil;
	PLSqlitePreparedStatement * statement = (PLSqlitePreparedStatement *) [database prepareStatement:sql error:&error];
	if (error!=nil)
	{
		[self throwException:@"invalid SQL statement" subreason:[error description] location:CODELOCATION];
	}
	
	if ([args count]>1)
	{
		NSArray *params = [args subarrayWithRange:NSMakeRange(1, [args count]-1)];
		[statement bindParameters:params];				   
	}
	
	PLSqliteResultSet *result = (PLSqliteResultSet*) [statement executeQuery];
	
	if ([[result fieldNames] count]==0)
	{
		[result next]; // we need to do this to make sure lastInsertRowId and rowsAffected work
		[result close];
		return nil;
	}
	
	if (statements==nil)
	{
		statements = [[NSMutableArray alloc] initWithCapacity:5];
	}
	
	[statements addObject:result];
	
	TiDatabaseResultSetProxy *proxy = [[[TiDatabaseResultSetProxy alloc] initWithResults:result database:self pageContext:[self pageContext]] autorelease];

	return proxy;
}

-(void)close:(id)args
{
	if (statements!=nil)
	{
		for (PLSqliteResultSet *result in statements)
		{
			[result close];
		}
		RELEASE_TO_NIL(statements);
	}
	if (database!=nil)
	{
		if ([database goodConnection])
		{
			[database close];
		}
		RELEASE_TO_NIL(database);
	}
}

-(void)remove:(id)args
{
	NSString *dbPath = [self dbPath:name];
	[[NSFileManager defaultManager] removeItemAtPath:dbPath error:nil];
}

-(NSNumber*)lastInsertRowId
{
	if (database!=nil)
	{
		return NUMINT([database lastInsertRowId]);
	}
	return NUMINT(0);
}

-(NSNumber*)rowsAffected
{
	if (database!=nil)
	{
		return NUMINT(sqlite3_changes([database sqliteDB]));
	}
	return NUMINT(0);
}

-(NSString*)name
{
	return name;
}

#pragma mark Internal
-(PLSqliteDatabase*)database
{
	return database;
}

@end

#endif