/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <UIKit/UIKit.h>
#import "TiProxy.h"

/**
 The UIColor proxy for cases where you need to return the color
 that was set and you need to return the original value (like #fff) back
 to the user - UIColor doesn't give you a way to get the RGB complements
 so this proxy does it for you.
 */
@interface TiColor : TiProxy {
	UIColor *color;
	NSString *name;
}
/**
 Returns color proxy by name.
 @param name The color name.
 @return The color proxy object.
 */
+(id)colorNamed:(NSString *)name;

/**
 Initializes the color proxy with color and name.
 @param color The color.
 @param name The color name.
 */
-(id)initWithColor:(UIColor*)color name:(NSString*)name;

/**
 Returns the color.
 @return The color.
 */
@property(nonatomic,readonly) UIColor *color;

/**
 Returns the color name.
 @return The color name.
 */
@property(nonatomic,readonly) NSString *name;

#pragma mark Deprecated

-(UIColor*)_color;
-(NSString*)_name;

@end
