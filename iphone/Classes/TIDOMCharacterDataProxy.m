/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TIDOMCharacterDataProxy.h"
#import <TitaniumKit/TiUtils.h>
#include <limits.h>
#include <string.h>

@implementation TiDOMCharacterDataProxy

- (NSString *)apiName
{
  return @"Ti.XML.CharacterData";
}

- (NSString *)data
{
  return [node stringValue];
}

- (void)setData:(NSString *)data
{
  ENSURE_TYPE(data, NSString);
  [node setStringValue:data];
}

- (void)setNodeValue:(NSString *)data
{
  [self setData:data];
}

- (NSNumber *)length
{
  xmlNodePtr realNode = [node XMLNode];
  if (realNode == NULL) {
    return [NSNumber numberWithInt:0];
  }
  xmlChar *stringData = realNode->content;
  NSUInteger result = (stringData == NULL) ? 0 : strlen((char *)stringData);
  return NUMUINTEGER(result);
}

- (NSString *)substringData:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  int offsetArg, countArg;
  ENSURE_INT_AT_INDEX(offsetArg, args, 0);
  ENSURE_INT_AT_INDEX(countArg, args, 1);

  NSString *ourData = [self data];
  NSUInteger dataLength = [ourData length];
  ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
  ENSURE_VALUE_RANGE(countArg, 0, INT_MAX);
  return [ourData substringWithRange:NSMakeRange(offsetArg, MIN(countArg, dataLength - offsetArg))];
}

- (void)appendData:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSString *newData = nil;
  ENSURE_ARG_AT_INDEX(newData, args, 0, NSString);

  [node setStringValue:[[node stringValue] stringByAppendingString:newData]];
}

- (void)insertData:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  int offsetArg;
  NSString *newData = nil;
  ENSURE_INT_AT_INDEX(offsetArg, args, 0);
  ENSURE_ARG_AT_INDEX(newData, args, 1, NSString);

  NSString *ourData = [self data];
  NSUInteger dataLength = [ourData length];
  ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
  NSString *result;

  if (offsetArg == dataLength) {
    result = [ourData stringByAppendingString:newData];
  } else if (offsetArg == 0) {
    result = [newData stringByAppendingString:ourData];
  } else {
    result = [ourData stringByReplacingCharactersInRange:NSMakeRange(offsetArg, 0) withString:newData];
  }
  [node setStringValue:result];
}

- (void)deleteData:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  int offsetArg, countArg;
  ENSURE_INT_AT_INDEX(offsetArg, args, 0);
  ENSURE_INT_AT_INDEX(countArg, args, 1);

  NSString *ourData = [self data];
  NSUInteger dataLength = [ourData length];
  ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
  ENSURE_VALUE_RANGE(countArg, 0, INT_MAX);

  NSString *result = [ourData stringByReplacingCharactersInRange:
                                  NSMakeRange(offsetArg, MIN(countArg, dataLength - offsetArg))
                                                      withString:@""];

  [node setStringValue:result];
}
- (void)replaceData:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  int offsetArg, countArg;
  NSString *newData = nil;
  ENSURE_INT_AT_INDEX(offsetArg, args, 0);
  ENSURE_INT_AT_INDEX(countArg, args, 1);
  ENSURE_ARG_AT_INDEX(newData, args, 2, NSString);

  NSString *ourData = [self data];
  NSUInteger dataLength = [ourData length];
  ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
  ENSURE_VALUE_RANGE(countArg, 0, INT_MAX);

  NSString *result = [ourData stringByReplacingCharactersInRange:
                                  NSMakeRange(offsetArg, MIN(countArg, dataLength - offsetArg))
                                                      withString:newData];

  [node setStringValue:result];
}

@end

#endif
