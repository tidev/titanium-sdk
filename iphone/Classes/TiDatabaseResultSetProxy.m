/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE

#import "DatabaseModule.h"
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

// TODO: Need to move this logic to our general int translation... but right now it would screw so much up, we should avoid it.
-(BOOL)isParseableString:(NSString*)str ofType:(DatabaseFieldType)type
{
    NSScanner* scanner = [NSScanner scannerWithString:str];
    switch (type) {
        case FieldTypeInt: {
            int v;
            return ([scanner scanInt:&v] && [scanner isAtEnd]);
            break;
        }
        case FieldTypeDouble: {
            double v;
            return ([scanner scanDouble:&v] && [scanner isAtEnd]);
            break;
        }
        case FieldTypeFloat: {
            float v;
            return ([scanner scanFloat:&v] && [scanner isAtEnd]);
            break;
        }
        default:
            return YES;
    }
}

-(id) _transformObject:(id) obj toType:(DatabaseFieldType) type {
	
	if(FieldTypeString == type) {
		return [TiUtils stringValue:obj];		
	}

	id result = nil;
    
	if(FieldTypeInt == type) {
        BOOL valid = NO;
        BOOL isString = [obj isKindOfClass:[NSString class]];
        if (!isString || (isString && [self isParseableString:obj ofType:type])) {
            result = NUMINT([TiUtils intValue:obj def:NSNotFound valid:&valid]);
        }
        if (!valid) {
            [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"Couldn't cast from %@ to int", [obj class]] location:CODELOCATION];
        }
	}
	
	if(FieldTypeFloat == type ||
	   FieldTypeDouble == type) {
		BOOL valid = NO;
        BOOL isString = [obj isKindOfClass:[NSString class]];
        if (!isString || (isString && [self isParseableString:obj ofType:type])) {
            result = (FieldTypeFloat == type) ? NUMFLOAT([TiUtils floatValue:obj def:0.0 valid:&valid]) 
                                              : NUMDOUBLE([TiUtils doubleValue:obj def:0.0 valid:&valid]);
        }
		if(!valid) {
			[self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"Couldn't cast from %@ to %@", [obj class], (FieldTypeFloat == type) ? @"float" : @"double"] location:CODELOCATION];
		}		
	}
	return result;
}

#pragma mark Public API

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
	ENSURE_ARRAY(args);
	if (results!=nil)
	{
	    id result = [results objectForColumnIndex:[TiUtils intValue:[args objectAtIndex:0]]];
		if ([result isKindOfClass:[NSData class]]) {
			result = [[[TiBlob alloc] initWithData:result mimetype:@"application/octet-stream"] autorelease];
		}

		if([args count] > 1) {
			//cast result on the way out if type constant was passed
			NSNumber *type = (NSNumber *) [args objectAtIndex:1];
			result = [self _transformObject:result toType:[type intValue]];
		}
		return result;
	}
	return nil;
}

-(id)fieldByName:(id)args
{
	ENSURE_ARRAY(args);
	if (results!=nil)
	{
		id result = [results objectForColumn:[TiUtils stringValue:[args objectAtIndex:0]]];
		if ([result isKindOfClass:[NSData class]]) {
			result = [[[TiBlob alloc] initWithData:result mimetype:@"application/octet-stream"] autorelease];
		}
 	    if([args count] > 1) {
		   //cast result on the way out if type constant was passed
		   NSNumber *type = (NSNumber *) [args objectAtIndex:1];
		   result = [self _transformObject:result toType:[type intValue]];
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

-(NSNumber*)fieldCount
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

@end

#endif