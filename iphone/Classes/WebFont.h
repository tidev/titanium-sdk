/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import <UIKit/UIKit.h>

/**
 The class rrepresenting a font.
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
 Provides access to the font family.
 
 Font support depends on the OS version. Custom TrueType (.ttf) or OpenType (.otf) fonts may be embedded in an application.
 Custom fonts must be placed in the Resources/fonts directory, in that case, font family is the official font name embedded into  the file, not the name of the file.
 @see http://developer.appcelerator.com/apidoc/mobile/latest/Font-object.html
 */
@property(nonatomic,retain) NSString *family;

/**
 Provides access to the font size.
 */
@property(nonatomic) CGFloat size;

/**
 Returns if the font size is not set.
 @return _YES_ if the font size is not set, _NO_ otherwise.
 */
@property(nonatomic,readonly) BOOL isSizeNotSet;

/**
 Returns if the font weight is bold.
 */
@property(nonatomic) BOOL isBoldWeight;

/**
 Returns if the font weight is normal.
 */
@property(nonatomic) BOOL isNormalWeight;

/**
 Returns if the font style is italic.
 */
@property(nonatomic) BOOL isItalicStyle;

/**
 Returns if the font style is normal.
 */
@property(nonatomic) BOOL isNormalStyle;

/**
 Returns if the font weight is semibold.
 */
@property(nonatomic) BOOL isSemiboldWeight;

/**
 Returns underlying font object.
 @return The font
 */
-(UIFont*)font;

/**
 Tells the font to update its parameters from dictionary.
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
 Returns the font by name.
 @param name The web font name.
 @return The web font.
 */
+(WebFont *)fontWithName:(NSString*)name;

@end

