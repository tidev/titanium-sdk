/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMValidator.h"
#import "TiUtils.h"
#import <libxml/tree.h>


@implementation TiDOMValidator

+(BOOL)checkElementName:(NSString*)pName
{
	return (xmlValidateNCName((xmlChar*)[pName UTF8String], 0) == 0);
}

+(BOOL)checkAttributeName:(NSString*)pName
{
	if ([self checkElementName:pName]) {
		if ([[pName lowercaseString] isEqualToString:@"xmlns"])
			return NO;
		
		return YES;
	}
	return NO;
}

+(BOOL)checkNamespacePrefix:(NSString*)pName
{
	//Can be nil or empty
	if ([pName length]==0) {
		return YES;
	}
	
	if (xmlValidateNCName((xmlChar*)[pName UTF8String], 0) == 0) {
		if ([[pName lowercaseString] hasPrefix:@"xml"])
			return NO;

		return YES;
	}
	else
		return NO;
}

+(BOOL)checkNamespaceURI:(NSString*)pName
{
	// Can be nil or empty
	if ([pName length]==0) {
		return YES;
	}
	
	NSURL* url = [NSURL URLWithString:[pName stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
	return (url != nil);
}

@end
#endif