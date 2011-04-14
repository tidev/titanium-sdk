/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE

#import "TiDatabaseResultSetProxy.h"
#import "TiDatabaseProxy.h"
#import "TiUtils.h"
#import "TiBlob.h"

@implementation TiDatabaseResultSetProxy

-(void)dealloc
{
	if (database!=nil && results!=nil)
	{
		[database removeStatement:results];
	}
	RELEASE_TO_NIL(database);
	if (results!=nil)
	{
		[results close];
	}
	RELEASE_TO_NIL(results);
	[super dealloc];
}

-(void)_destroy
{ 
	if (database!=nil)
	{
		[self performSelector:@selector(close:) withObject:nil];
	}
	[super _destroy];
}

-(id)initWithResults:(PLSqliteResultSet*)results_ database:(TiDatabaseProxy*)database_ pageContext:(id<TiEvaluator>)context
{
	if (self = [self _initWithPageContext:context])
	{
		results = [results_ retain];
		database = [database_ retain];
		validRow = 	[results next];
		rowCount = -1;
	}
	return self;
}

-(void)close:(id)args
{
	if (database!=nil && results!=nil)
	{
		[database removeStatement:results];
	}
	RELEASE_TO_NIL(database);	
	if (results!=nil)
	{
		[results close];
	}
	RELEASE_TO_NIL(results);
	[self _destroy];
	validRow = NO;
}

-(id)next:(id)args
{
	if (results!=nil)
	{
		validRow = [results next];
		if (validRow==NO)
		{
			[self close:nil];
		}
		return NUMBOOL(validRow);
	}
	return NUMBOOL(NO);
}

-(id)field:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	if (results!=nil)
	{
		id result = [results objectForColumnIndex:[TiUtils intValue:args]];
		if ([result isKindOfClass:[NSData class]]) {
			result = [[[TiBlob alloc] initWithData:result mimetype:@"application/octet-stream"] autorelease];
		}
		return result;
	}
	return nil;
}

-(id)fieldByName:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	if (results!=nil)
	{
		id result = [results objectForColumn:[TiUtils stringValue:args]];
		if ([result isKindOfClass:[NSData class]]) {
			result = [[[TiBlob alloc] initWithData:result mimetype:@"application/octet-stream"] autorelease];
		}
		return result;
	}
	return nil;
}

-(id)fieldName:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	if (results != nil)
	{
		int requestedIndex = [TiUtils intValue:args def:NSNotFound];
		if (requestedIndex == NSNotFound)
		{
			[self throwException:TiExceptionInvalidType subreason:nil location:CODELOCATION];
		}
		
		NSArray * fieldNames = [results fieldNames];
		ENSURE_VALUE_RANGE(requestedIndex,0,[fieldNames count]-1);

		return [fieldNames objectAtIndex:requestedIndex];
	}
	return nil;
}

-(id)fieldCount:(id)args
{
	if (results!=nil)
	{
		return NUMINT([[results fieldNames] count]);
	}
	return NUMINT(0);
}

-(NSNumber*)rowCount
{
	if (results!=nil)
	{
		BOOL reset = NO;
		if (rowCount < 0)
		{
			// since we start off at one, we need to include ours by
			// calling reset and then after calcuating the count we 
			// need to advance again (below)
			[results reset];
			reset = YES;
		}
		if (reset == NO)
		{
			return NUMINT(rowCount);
		}
		// we cache it
		rowCount = [results fullCount];
		reset = NO;
		[results next];
		return NUMINT(rowCount); 
	}
	return NUMINT(0);
}

-(NSNumber*)validRow
{
	return NUMBOOL(validRow);
}

-(NSNumber*)isValidRow:(id)args
{
	return [self validRow];
}

- (id) dynamicField:(id) args {
	ENSURE_ARG_COUNT(args, 1)

	id arg = [args objectAtIndex:0],
	   ret = nil;
	
	if([arg isKindOfClass:[NSString class]]) {
		ret = [self fieldByName:arg];
	} else if([arg isKindOfClass:[NSNumber class]]) {
		ret = [self field:arg];
	}
	
	return ret;
}

#define THROW_IF_FAILED_CONVERSION(obj, type, location)\
if(nil == obj) {\
[NSException raise:TiExceptionInvalidType format:@"Conversion to %@ failed%@", type, location];\
}\

- (id) _baseNumericGetter:(NSArray *) args {
	ENSURE_ARG_COUNT(args, 3)
	
	id value   = [self dynamicField:[args objectAtIndex:0]];
	NSNumber *result = [TiUtils numberFromObject:value];
	
	THROW_IF_FAILED_CONVERSION(result, [args objectAtIndex:1], [args objectAtIndex:2])
		
	return result;
}

#pragma mark -
#pragma mark Public API - Typed Getters

- (id) getString:(id) args {
	
	id value = [self dynamicField:args];
	NSString *result = [TiUtils stringValue:value];
	
	THROW_IF_FAILED_CONVERSION(result, @"string", CODELOCATION)

	return result;
}

- (id) getInt:(id) args {
	NSNumber *number = [self _baseNumericGetter:[NSArray arrayWithObjects: args, @"int", CODELOCATION, nil]];
	return NUMLONG([number longValue]);
}

- (id) getFloat: (id) args {
	NSNumber *number = [self _baseNumericGetter:[NSArray arrayWithObjects: args, @"float", CODELOCATION, nil]];
	return NUMFLOAT([number floatValue]);
}

- (id) getDouble: (id) args {
	NSNumber *number = [self _baseNumericGetter:[NSArray arrayWithObjects: args, @"double", CODELOCATION, nil]];
	return NUMDOUBLE([number doubleValue]);
}

@end

#endif