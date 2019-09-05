/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

/**
 The class representing a font.
 */
@interface WebFont : NSObject {
  NSString *family;
  CGFloat size;
  BOOL isSemiboldWeight;
  BOOL isBoldWeight;
  BOOL isThinWeight;
  BOOL isLightWeight;
  BOOL isUltraLightWeight;
  BOOL isNormalWeight;
  BOOL isItalicStyle;
  BOOL isNormalStyle;

  UIFont *font;

  NSString *textStyle;
}

/**
 Provides access to the font family which is the official font name.
 @see http://developer.appcelerator.com/apidoc/mobile/latest/Font-object.html
 */
@property (nonatomic, retain) NSString *family;

/**
 Provides access to the font size.
 */
@property (nonatomic) CGFloat size;

/**
 Whether or not the font size is not set.
 @return _YES_ if the font size is not set, _NO_ otherwise.
 */
@property (nonatomic, readonly) BOOL isSizeNotSet;

/**
 Whether or not the font weight is bold.
 */
@property (nonatomic) BOOL isBoldWeight;

/**
 Whether or not the font weight is normal.
 */
@property (nonatomic) BOOL isNormalWeight;

/**
 Whether or not the font weight is thin.
 */
@property (nonatomic) BOOL isThinWeight;

/**
 Whether or not the font weight is light.
 */
@property (nonatomic) BOOL isLightWeight;

/**
 Whether or not the font weight is ultra light.
 */
@property (nonatomic) BOOL isUltraLightWeight;

/**
 Whether or not the font style is italic.
 */
@property (nonatomic) BOOL isItalicStyle;

/**
 Whether or not the font style is normal.
 */
@property (nonatomic) BOOL isNormalStyle;

/**
 Whether or not the font weight is semibold.
 */
@property (nonatomic) BOOL isSemiboldWeight;

/**
 Provides access to the Text Style.
 */
@property (nonatomic, readonly) NSString *textStyle;

/**
 Returns underlying font object.
 @return The font
 */
- (UIFont *)font;

/**
 Tells the font to update its parameters from dictionary.
 @param fontDict The dictionary to update from.
 @param inheritedFont The font to inherit parameters from.
 @return _YES_ if the update operation succeeded, _NO_ otherwise.
 */
- (BOOL)updateWithDict:(NSDictionary *)fontDict inherits:(WebFont *)inheritedFont;

/**
 Returns the default text font.
 @return The default font.
 */
+ (WebFont *)defaultFont;

/**
 Returns the default bold font.
 @return The default bold font.
 */
+ (WebFont *)defaultBoldFont;

/**
 Returns the font by name.
 @param name The web font name.
 @return The web font.
 */
+ (WebFont *)fontWithName:(NSString *)name;

@end
