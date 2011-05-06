/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import <UIKit/UIKit.h>

@interface WebFont : NSObject {
	NSString* family;
	CGFloat size;
    BOOL isSemiboldWeight;
	BOOL isBoldWeight;
	BOOL isNormalWeight;
    BOOL isItalicStyle;
    BOOL isNormalStyle;
	UIFont *font;
}
@property(nonatomic,retain) NSString *family;
@property(nonatomic) CGFloat size;
@property(nonatomic,readonly) BOOL isSizeNotSet;
@property(nonatomic) BOOL isBoldWeight;
@property(nonatomic) BOOL isNormalWeight;
@property(nonatomic) BOOL isItalicStyle;
@property(nonatomic) BOOL isNormalStyle;
@property(nonatomic) BOOL isSemiboldWeight;

-(UIFont*)font;

-(BOOL)updateWithDict:(NSDictionary *)fontDict inherits:(WebFont *)inheritedFont;

+(WebFont *)tableRowFont;
+(WebFont *)defaultFont;
+(WebFont *)defaultBoldFont;
+(WebFont *)fontWithName:(NSString*)name;

@end

