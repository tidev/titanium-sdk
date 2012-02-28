/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import <UIKit/UIKit.h>

/**
 The class representin a web font.
 */
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

/**
 Provides access to web font family.
 */
@property(nonatomic,retain) NSString *family;

/**
 Provides access to web font size.
 */
@property(nonatomic) CGFloat size;

/**
 Returns if the web font size if set.
 @return _YES_ if font size is set, _NO_ otherwise.
 */
@property(nonatomic,readonly) BOOL isSizeNotSet;

/**
 Returns if the web font weight is bold.
 */
@property(nonatomic) BOOL isBoldWeight;

/**
 Returns if the web font weight is normal.
 */
@property(nonatomic) BOOL isNormalWeight;

/**
 Returns if the web font style is italic.
 */
@property(nonatomic) BOOL isItalicStyle;

/**
 Returns if the web font style is normal.
 */
@property(nonatomic) BOOL isNormalStyle;

/**
 Returns if the web font weight is semibold.
 */
@property(nonatomic) BOOL isSemiboldWeight;

/**
 Returns underlying font object.
 @return The font
 */
-(UIFont*)font;

/**
 Tells the web font to update it's parameters from dictionary.
 @param fontDict The dictionary to update from.
 @param inheritedFont The font to inherit parameters from.
 @return _YES_ if the update operation succeeded, _NO_ otherwise.
 */
-(BOOL)updateWithDict:(NSDictionary *)fontDict inherits:(WebFont *)inheritedFont;

/**
 Returns table row font.
 @return The table row font.
 */
+(WebFont *)tableRowFont;

/**
 Returns the default text font.
 @return The default font.
 */
+(WebFont *)defaultFont;

/**
 Returns the default bold font.
 @return The default bold font.
 */
+(WebFont *)defaultBoldFont;

/**
 Returns a web font by name.
 @param name The web font name.
 @return The web font.
 */
+(WebFont *)fontWithName:(NSString*)name;

@end

