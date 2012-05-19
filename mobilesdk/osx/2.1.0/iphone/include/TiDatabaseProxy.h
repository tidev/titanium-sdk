/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_DATABASE

#import "PlausibleDatabase.h"

@interface TiDatabaseProxy : TiProxy {
@protected
	NSString *name;
	PLSqliteDatabase *database;
	NSMutableArray *statements;

}

@property(nonatomic,readonly) NSString *name;
@property(nonatomic,readonly) NSNumber *rowsAffected;
@property(nonatomic,readonly) NSNumber *lastInsertRowId;

-(void)open:(NSString*)name;
-(void)install:(NSString*)path name:(NSString*)name;

#pragma mark Internal

-(void)removeStatement:(PLSqliteResultSet*)statement;
-(PLSqliteDatabase*)database;

@end

#endif