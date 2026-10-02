/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * WARNING: This is generated code. Do not modify. Your changes *will* be lost.
 */

#import <Foundation/Foundation.h>
#import "TiUtils.h"
#import "ApplicationDefaults.h"

@implementation ApplicationDefaults

+ (NSMutableDictionary*) copyDefaults
{
	return nil;
}

+ (NSDictionary*) launchUrl {
	static BOOL launched = NO;
	if (!launched) {
		launched = YES;
		<% if (deployType != 'production' && launchUrl) { %>
			return [NSDictionary dictionaryWithObjectsAndKeys:[TiUtils stringValue:@"<%- this.launchUrl %>"], @"application-launch-url", nil];
		<% } else { %>
			return nil;
		<% } %>
	} else {
		return nil;
	}
}

@end
