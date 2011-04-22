/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE

#import "DatabaseModule.h"
#import "TiDatabaseProxy.h"


@implementation DatabaseModule

-(void)startup
{
	// enable multi-threading
	sqlite3_enable_shared_cache(TRUE);
}

-(id)open:(id)path
{
	ENSURE_SINGLE_ARG(path,NSString);
	TiDatabaseProxy *db = [[[TiDatabaseProxy alloc] _initWithPageContext:[self executionContext] args:nil] autorelease];
	[db open:path];
	return db;
}

-(id)install:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	TiDatabaseProxy *db = [[[TiDatabaseProxy alloc] _initWithPageContext:[self executionContext] args:nil] autorelease];
	[db install:[args objectAtIndex:0] name:[args objectAtIndex:1]];
	return db;
}

#define DB_CONSTANT(name, num) \
-(id)name {\
return NUMINT(num);\
}

DB_CONSTANT(FIELD_TYPE_UNKNOWN, FieldTypeUnknown)
DB_CONSTANT(FIELD_TYPE_STRING, FieldTypeString)
DB_CONSTANT(FIELD_TYPE_INT, FieldTypeInt)
DB_CONSTANT(FIELD_TYPE_FLOAT, FieldTypeFloat)
DB_CONSTANT(FIELD_TYPE_DOUBLE, FieldTypeDouble);

@end

#endif