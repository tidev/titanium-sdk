/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_DATABASE

#import "PlausibleDatabase.h"

@class TiDatabaseProxy;

@interface TiDatabaseResultSetProxy : TiProxy {
@private
	TiDatabaseProxy *database;
	PLSqliteResultSet *results;
	BOOL validRow;
	int rowCount;
}

-(id)initWithResults:(PLSqliteResultSet*)results database:(TiDatabaseProxy*)database pageContext:(id<TiEvaluator>)context;

@property(nonatomic,readonly) NSNumber *rowCount;
@property(nonatomic,readonly) NSNumber *validRow;

@end

#endif