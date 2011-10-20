/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#include <string.h>
#include <limits.h>
#import "TiDOMCharacterDataProxy.h"
#import "TiUtils.h"

@implementation TiDOMCharacterDataProxy


-(id)text
{
	DEPRECATED_REPLACED(@"XML.CharacterData.text", 1.8, 1.9, @"Ti.XML.CharacterData.data")
	return [self data];
}

-(NSString *)data
{
	return [node stringValue];
}

-(void)setData:(NSString *)data
{
	ENSURE_TYPE(data, NSString);
	[node setStringValue:data];
}

-(NSNumber *)length
{
	xmlNodePtr realNode = [node XMLNode];
	if (realNode == NULL)
	{
		return [NSNumber numberWithInt:0];
	}
	xmlChar * stringData = realNode->content;
	int result = (stringData == NULL) ? 0 : strlen((char *)stringData);
	return [NSNumber numberWithInt:result];
}

-(NSString *) substringData:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	int offsetArg, countArg;
	ENSURE_INT_AT_INDEX(offsetArg, args, 0);
	ENSURE_INT_AT_INDEX(countArg, args, 1);

	NSString * ourData = [self data];
	int dataLength = [ourData length];
	ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
	ENSURE_VALUE_RANGE(countArg, 0, INT_MAX);
	return [ourData substringWithRange:NSMakeRange(offsetArg,MIN(countArg, dataLength-offsetArg))];
}

-(void)	appendData:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * newData;
	ENSURE_ARG_AT_INDEX(newData, args, 0, NSString);

	[node setStringValue:[[node stringValue] stringByAppendingString:newData]];
}

-(void) insertData:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	int offsetArg;
	NSString * newData;
	ENSURE_INT_AT_INDEX(offsetArg, args, 0);
	ENSURE_ARG_AT_INDEX(newData, args, 1, NSString);

	NSString * ourData = [self data];
	int dataLength = [ourData length];
	ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
	
	NSString * result = [ourData stringByReplacingCharactersInRange:
						 NSMakeRange(offsetArg, 0) withString:newData];
	
	[node setStringValue:result];
}

-(void) deleteData:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	int offsetArg, countArg;
	ENSURE_INT_AT_INDEX(offsetArg, args, 0);
	ENSURE_INT_AT_INDEX(countArg, args, 1);
	
	NSString * ourData = [self data];
	int dataLength = [ourData length];
	ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
	ENSURE_VALUE_RANGE(countArg, 0, INT_MAX);

	NSString * result = [ourData stringByReplacingCharactersInRange:
			NSMakeRange(offsetArg, MIN(countArg, dataLength-offsetArg))
			withString:@""];
	
	[node setStringValue:result];

}
-(void) replaceData:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	int offsetArg, countArg;
	NSString * newData;
	ENSURE_INT_AT_INDEX(offsetArg, args, 0);
	ENSURE_INT_AT_INDEX(countArg, args, 1);
	ENSURE_ARG_AT_INDEX(newData, args, 2, NSString);
	
	NSString * ourData = [self data];
	int dataLength = [ourData length];
	ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);
	ENSURE_VALUE_RANGE(countArg, 0, INT_MAX);
	
	NSString * result = [ourData stringByReplacingCharactersInRange:
						 NSMakeRange(offsetArg, MIN(countArg, dataLength-offsetArg))
						 withString:newData];
	
	[node setStringValue:result];

}

@end

#endif
