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
#import "TiFilesystemFileProxy.h"

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
		[self performSelector:@selector(close:) withObject:nil];
	}
}
 
-(void)_destroy
{
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiShutdownNotification object:nil];
	[self shutdown:nil];
	[super _destroy];
}

-(void)_configure
{
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shutdown:) name:kTiShutdownNotification object:nil];
	[super _configure];
}

-(NSString*)dbDir
{
    // See this apple tech note for why this changed: https://developer.apple.com/library/ios/#qa/qa1719/_index.html
    // Apparently following these guidelines is now required for app submission
    
	NSString *rootDir = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString *dbPath = [rootDir stringByAppendingPathComponent:@"Private Documents"];
	NSFileManager *fm = [NSFileManager defaultManager];
	
	BOOL isDirectory;
	BOOL exists = [fm fileExistsAtPath:dbPath isDirectory:&isDirectory];
	
    // Because of sandboxing, this should never happen, but we still need to handle it.
    if (exists && !isDirectory) {
        NSLog(@"[WARN] Recreating file %@... should be a directory and isn't.", dbPath);
        [fm removeItemAtPath:dbPath error:nil];
        exists = NO;
    }

	// create folder, and migrate the old one if necessary    
	if (!exists) 
	{
        [fm createDirectoryAtPath:dbPath withIntermediateDirectories:YES attributes:nil error:nil];
    }
    
    // Migrate any old data if available
    NSString* oldRoot = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
    NSString* oldPath = [oldRoot stringByAppendingString:@"database"];
    BOOL oldCopyExists = [fm fileExistsAtPath:oldPath isDirectory:&isDirectory];
    if (oldCopyExists && isDirectory) {
        NSDirectoryEnumerator* contents = [fm enumeratorAtPath:oldPath];
        
        for (NSString* oldFile in contents) {
            [fm moveItemAtPath:oldFile toPath:[dbPath stringByAppendingPathComponent:[oldFile lastPathComponent]] error:nil];
        }
        
        // Remove the old copy after migrating everything
        [fm removeItemAtPath:oldPath error:nil];
    }
	
	return dbPath;
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
		[self throwException:@"couldn't open database" subreason:name_ location:CODELOCATION];
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

-(id)execute:(id)args
{
	ENSURE_TYPE(args, NSArray);

	NSString *sql = [[args objectAtIndex:0] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
	
	NSError *error = nil;
	PLSqlitePreparedStatement * statement = (PLSqlitePreparedStatement *) [database prepareStatement:sql error:&error];
	if (error!=nil)
	{
		[self throwException:@"invalid SQL statement" subreason:[error description] location:CODELOCATION];
	}
	
	if([args count] > 1) {
		NSArray *params = [args objectAtIndex:1];

		if(![params isKindOfClass:[NSArray class]]) {
		   params = [args subarrayWithRange:NSMakeRange(1, [args count]-1)];
		}

		[statement bindParameters:params];
	}
	
	PLSqliteResultSet *result = (PLSqliteResultSet*) [statement executeQuery];
	
	if ([[result fieldNames] count]==0)
	{
		[result next]; // we need to do this to make sure lastInsertRowId and rowsAffected work
		[result close];
		return [NSNull null];
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
			@try 
			{
				[database close];
			}
			@catch (NSException * e) 
			{
				NSLog(@"[WARN] attempting to close database, returned error: %@",e);
			}
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
-(TiFilesystemFileProxy*)fullPath
{
	NSString *path = [self dbDir];
	if([path length] != 0)
	{
		return [[TiFilesystemFileProxy alloc] initWithFile:[[path stringByAppendingPathComponent:name] stringByAppendingPathExtension:@"sql"]];
	}
	return NULL;
}

#pragma mark Internal
-(PLSqliteDatabase*)database
{
	return database;
}

@end

#endif