/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <UIKit/UIKit.h>
#import "TiProxy.h"

// this is a UIColor proxy for cases where you need to return the color
// that was set and you need to return the original value (like #fff) back
// to the user - UIColor doesn't give you a way to get the RGB complements
// so this proxy does it for you

@interface TiColor : TiProxy {
	UIColor *color;
	NSString *name;
}

+(id)colorNamed:(NSString *)name;
-(id)initWithColor:(UIColor*)color name:(NSString*)name;
-(UIColor*)_color;
-(NSString*)_name;

@end
