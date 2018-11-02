/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE

#import "TiDatabaseResultSetProxy.h"
#import "DatabaseModule.h"
#import "TiDatabaseProxy.h"
@import TitaniumKit.TiBlob;
@import TitaniumKit.TiUtils;

@implementation TiDatabaseResultSetProxy

- (void)dealloc
{
  [self close];
  [super dealloc];
}

- (id)initWithResults:(PLSqliteResultSet *)results_ database:(TiDatabaseProxy *)database_
{
  if (self = [self init]) {
    results = [results_ retain];
    database = [database_ retain];
    validRow = [results next];
    rowCount = -1;
  }
  return self;
}

// TODO: Need to move this logic to our general int translation... but right now it would screw so much up, we should avoid it.
- (BOOL)isParseableString:(NSString *)str ofType:(DatabaseFieldType)type
{
  NSScanner *scanner = [NSScanner scannerWithString:str];
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

- (id)_transformObject:(id)obj toType:(DatabaseFieldType)type
{

  if (FieldTypeString == type) {
    return [TiUtils stringValue:obj];
  }

  id result = nil;

  if (FieldTypeInt == type) {
    BOOL valid = NO;
    BOOL isString = [obj isKindOfClass:[NSString class]];
    if (!isString || (isString && [self isParseableString:obj ofType:type])) {
      result = NUMINT([TiUtils intValue:obj def:0 valid:&valid]);
    }
    if (!valid) {
      [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"Couldn't cast from %@ to int", [obj class]] location:CODELOCATION];
    }
  }

  if (FieldTypeFloat == type || FieldTypeDouble == type) {
    BOOL valid = NO;
    BOOL isString = [obj isKindOfClass:[NSString class]];
    if (!isString || (isString && [self isParseableString:obj ofType:type])) {
      result = (FieldTypeFloat == type) ? NUMFLOAT([TiUtils floatValue:obj def:0.0 valid:&valid])
                                        : NUMDOUBLE([TiUtils doubleValue:obj def:0.0 valid:&valid]);
    }
    if (!valid) {
      [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"Couldn't cast from %@ to %@", [obj class], (FieldTypeFloat == type) ? @"float" : @"double"] location:CODELOCATION];
    }
  }
  return result;
}

- (NSString *)apiName
{
  return @"Ti.Database.ResultSet";
}

#pragma mark Public API

- (void)close
{
  if (database != nil && results != nil) {
    [database removeStatement:results];
  }
  RELEASE_TO_NIL(database);
  if (results != nil) {
    [results close];
  }
  RELEASE_TO_NIL(results);
  validRow = NO;
}

- (BOOL)next
{
  if (results != nil) {
    validRow = [results next];
    if (!validRow) {
      [self close];
    }
    return validRow;
  }
  return NO;
}

- (JSValue *)field:(NSInteger)index withType:(JSValue *)optionalType
{
  if (results != nil) {
    id result = [results objectForColumnIndex:index];
    if ([result isKindOfClass:[NSData class]]) {
      result = [[[TiBlob alloc] initWithData:result mimetype:@"application/octet-stream"] autorelease];
    }
    // If user specified a type that we can coerce to Number, try and use it
    if ([optionalType isNumber] || [optionalType isString]) {
      DatabaseFieldType type = [optionalType toInt32];
      if (type != FieldTypeUnknown) {
        //cast result on the way out if type constant was passed
        result = [self _transformObject:result toType:type];
      }
    }
    return result;
  }
  return nil;
}

- (JSValue *)fieldByName:(NSString *)name withType:(JSValue *)optionalType
{
  if (results != nil) {
    id result = [results objectForColumn:[TiUtils stringValue:name]];
    if ([result isKindOfClass:[NSData class]]) {
      result = [[[TiBlob alloc] initWithData:result mimetype:@"application/octet-stream"] autorelease];
    }
    // If user specified a type that we can coerce to Number, try and use it
    if ([optionalType isNumber] || [optionalType isString]) {
      DatabaseFieldType type = [optionalType toInt32];
      if (type != FieldTypeUnknown) {
        //cast result on the way out if type constant was passed
        result = [self _transformObject:result toType:type];
      }
    }
    return result;
  }
  return nil;
}

- (NSString *)fieldName:(NSInteger)requestedIndex
{
  if (results != nil) {
    // FIXME: How do we determine if the index was left blank/undefined?
    if (requestedIndex == INT_MAX) {
      [self throwException:TiExceptionInvalidType subreason:nil location:CODELOCATION];
    }

    NSArray *fieldNames = [results fieldNames];
    ENSURE_VALUE_RANGE(requestedIndex, 0, [fieldNames count] - 1);

    return [fieldNames objectAtIndex:requestedIndex];
  }
  return nil;
}

- (NSInteger)fieldCount
{
  if (results != nil) {
    return [[results fieldNames] count];
  }
  return 0;
}

- (NSInteger)rowCount
{
  if (results != nil) {
    BOOL reset = NO;
    if (rowCount < 0) {
      // since we start off at one, we need to include ours by
      // calling reset and then after calcuating the count we
      // need to advance again (below)
      [results reset];
      reset = YES;
    }
    if (!reset) {
      return rowCount;
    }
    // we cache it
    rowCount = [results fullCount];
    [results next];
    return rowCount;
  }
  return 0;
}

- (BOOL)validRow
{
  return validRow;
}
GETTER_IMPL(BOOL, validRow, ValidRow);

- (BOOL)isValidRow
{
  return [self validRow];
}

@end

#endif
