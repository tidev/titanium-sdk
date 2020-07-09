/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Webcolor.h"
#import "TiApp.h"
#import "TiBase.h"
#import "TiUtils.h"

NSString *const IOS_COLOR_SCROLLVIEW_TEXTURED_BACKGROUND = @"scrollview_textured";
NSString *const IOS_COLOR_VIEW_FLIPSIDE_BACKGROUND = @"view_flipside";
NSString *const IOS_COLOR_GROUP_TABLEVIEW_BACKGROUND = @"group_tableview";
NSString *const IOS_COLOR_UNDER_PAGE_BACKGROUND = @"under_page";

UIColor *checkmarkColor = nil;
NSMutableDictionary *colorLookup = nil;
NSDictionary *semanticColors = nil;

BOOL isASCIIHexDigit(unichar c) { return (c >= '0' && c <= '9') || ((c | 0x20) >= 'a' && (c | 0x20) <= 'f'); }
int toASCIIHexValue(unichar c) { return (c & 0xF) + (c < 'A' ? 0 : 9); }

@implementation Webcolor

+ (UIColor *)checkmarkColor
{
  if (checkmarkColor == nil) {
    checkmarkColor = RGBACOLOR(55.0, 79.0, 130.0, 1);
  }
  return checkmarkColor;
}

+ (UIColor *)semanticColorNamed:(NSString *)colorName
{
  if ([TiUtils isIOSVersionOrGreater:@"11.0"]) {
    return [UIColor colorNamed:colorName]; // FIXME: in xcode dev project, this won't work properly because our xcode build doesn't convert semantic.colors.json
  }

  // Fallback to reading the semantic.colors.json directly for iOS < 11
  if (semanticColors == nil) {
    NSString *colorsPath = [NSBundle.mainBundle pathForResource:@"semantic.colors" ofType:@"json"];
    if (![NSFileManager.defaultManager fileExistsAtPath:colorsPath]) {
      return nil;
    }

    NSData *colors = [NSData dataWithContentsOfFile:colorsPath options:NSDataReadingMappedIfSafe error:nil];
    semanticColors = [[NSJSONSerialization JSONObjectWithData:colors options:NSJSONReadingMutableContainers error:nil] retain];
  }

  NSDictionary *colorMap = semanticColors[colorName];
  if (colorMap == nil) {
    return nil;
  }

  NSString *currentTraitCollection = TiApp.controller.traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark ? @"dark" : @"light";

  return [Webcolor semanticColorEntry:colorMap[currentTraitCollection]];
}

+ (UIColor *)semanticColorEntry:(id)entry
{
  if ([entry isKindOfClass:[NSString class]]) {
    return [Webcolor webColorForString:entry];
  }
  if ([entry isKindOfClass:[NSDictionary class]]) {
    NSDictionary<NSString *, id> *dict = (NSDictionary<NSString *, id> *)entry;
    NSString *hex = (NSString *)dict[@"color"];
    UIColor *result = [Webcolor colorForHex:hex];
    id rawAlpha = dict[@"alpha"];
    if (rawAlpha != nil) {
      float alpha = [rawAlpha floatValue] / 100.0; // may be a number or a string
      result = [result colorWithAlphaComponent:alpha];
    }
    return result;
  }
  return nil;
}

+ (UIColor *)webColorForString:(NSString *)colorName
{
  colorName = [colorName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
  if (colorLookup == nil) {
    colorLookup = [[NSMutableDictionary dictionary] retain];
    [colorLookup addEntriesFromDictionary:@{
      @"black" : UIColor.blackColor,
      @"blue" : UIColor.blueColor,
      @"brown" : UIColor.brownColor,
      @"cyan" : UIColor.cyanColor,
      @"darkgray" : UIColor.darkGrayColor,
      @"gray" : UIColor.grayColor,
      @"green" : UIColor.greenColor,
      @"lightgray" : UIColor.lightGrayColor,
      @"magenta" : UIColor.magentaColor,
      @"orange" : UIColor.orangeColor,
      @"purple" : UIColor.purpleColor,
      @"red" : UIColor.redColor,
      @"white" : UIColor.whiteColor,
      @"yellow" : UIColor.yellowColor,
      @"stripped" : UIColor.groupTableViewBackgroundColor,
      @"transparent" : UIColor.clearColor,
      IOS_COLOR_GROUP_TABLEVIEW_BACKGROUND : UIColor.groupTableViewBackgroundColor,
      IOS_COLOR_SCROLLVIEW_TEXTURED_BACKGROUND : UIColor.clearColor,
      IOS_COLOR_VIEW_FLIPSIDE_BACKGROUND : UIColor.clearColor,
      IOS_COLOR_UNDER_PAGE_BACKGROUND : UIColor.clearColor,
      // these are also defined by the W3C HTML spec so we support them
      @"aqua" : [Webcolor colorForHex:@"0ff"],
      @"fuchsia" : [Webcolor colorForHex:@"f0f"],
      @"lime" : [Webcolor colorForHex:@"0f0"],
      @"maroon" : [Webcolor colorForHex:@"800"],
      @"pink" : [Webcolor colorForHex:@"FFC0CB"],
      @"navy" : [Webcolor colorForHex:@"000080"],
      @"olive" : [Webcolor colorForHex:@"808000"],
      @"silver" : [Webcolor colorForHex:@"c0c0c0"],
      @"teal" : [Webcolor colorForHex:@"008080"],
      // TODO: Remove these hex hacks? Just shorthand to avoid the work for common values?
      @"fff" : UIColor.whiteColor,
      @"ffff" : UIColor.whiteColor,
      @"ffffff" : UIColor.whiteColor,
      @"ffffffff" : UIColor.whiteColor,
      @"000" : UIColor.blackColor,
      @"f000" : UIColor.blackColor,
      @"000000" : UIColor.blackColor,
      @"ff000000" : UIColor.blackColor,
    }];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    // NOTE: We explicitly use lowercase names because we cache using lowercase
    // This basically means color names are case insensitive
    [colorLookup addEntriesFromDictionary:@{
      @"systemredcolor" : UIColor.systemRedColor,
      @"systemgreencolor" : UIColor.systemGreenColor,
      @"systembluecolor" : UIColor.systemBlueColor,
      @"systemorangecolor" : UIColor.systemOrangeColor,
      @"systemyellowcolor" : UIColor.systemYellowColor,
      @"systempinkcolor" : UIColor.systemPinkColor,
      @"systempurplecolor" : UIColor.systemPurpleColor,
      @"systemtealcolor" : UIColor.systemTealColor,
      @"systemgraycolor" : UIColor.systemGrayColor,
      @"lighttextcolor" : UIColor.lightTextColor,
      @"darktextcolor" : UIColor.darkTextColor
    }];

    if ([TiUtils isIOSVersionOrGreater:@"13.0"]) {
      [colorLookup addEntriesFromDictionary:@{
        @"systemindigocolor" : UIColor.systemIndigoColor,
        @"systemgray2color" : UIColor.systemGray2Color,
        @"systemgray3color" : UIColor.systemGray3Color,
        @"systemgray4color" : UIColor.systemGray4Color,
        @"systemgray5color" : UIColor.systemGray5Color,
        @"systemgray6color" : UIColor.systemGray6Color,
        @"labelcolor" : UIColor.labelColor,
        @"secondarylabelcolor" : UIColor.secondaryLabelColor,
        @"tertiarylabelcolor" : UIColor.tertiaryLabelColor,
        @"quaternarylabelcolor" : UIColor.quaternaryLabelColor,
        @"linkcolor" : UIColor.linkColor,
        @"placeholdertextcolor" : UIColor.placeholderTextColor,
        @"separatorcolor" : UIColor.separatorColor,
        @"opaqueseparatorcolor" : UIColor.opaqueSeparatorColor,
        @"systembackgroundcolor" : UIColor.systemBackgroundColor,
        @"secondarysystembackgroundcolor" : UIColor.secondarySystemBackgroundColor,
        @"tertiarysystembackgroundcolor" : UIColor.tertiarySystemBackgroundColor,
        @"systemgroupedbackgroundcolor" : UIColor.systemGroupedBackgroundColor,
        @"secondarysystemgroupedbackgroundcolor" : UIColor.secondarySystemGroupedBackgroundColor,
        @"tertiarysystemgroupedbackgroundcolor" : UIColor.tertiarySystemGroupedBackgroundColor,
        @"systemfillcolor" : UIColor.systemFillColor,
        @"secondarysystemfillcolor" : UIColor.secondarySystemFillColor,
        @"tertiarysystemfillcolor" : UIColor.tertiarySystemFillColor,
        @"quaternarysystemfillcolor" : UIColor.quaternarySystemFillColor
      }];
    }
#endif
  }
  if ([colorName hasPrefix:@"#"]) {
    colorName = [colorName substringFromIndex:1];
  }
  // Check known color lookups (pre-defined color names from CSS/W3C, known system color names)
  // (Also used as a cache once hex/rgb function is converted)
  colorName = [colorName lowercaseString];
  UIColor *result = [colorLookup objectForKey:colorName];
  if (result != nil) {
    return result;
  }

  // Try hex
  result = [Webcolor colorForHex:colorName];
  // Try rgb()/rgba()
  if (result == nil) {
    result = [Webcolor colorForRGBFunction:colorName];
  }
  // TODO: Try hsl()/hsla()
  // Store result in lookup table to cache next access
  if (result != nil) {
    [colorLookup setObject:result forKey:colorName];
  }

  return result;
}

+ (UIColor *)webColorNamed:(NSString *)colorName
{
  if (![colorName isKindOfClass:[NSString class]]) {
    return nil;
  }
  // Check for a named color (either system color, web color, or semantic color)
  UIColor *result = [Webcolor semanticColorNamed:colorName];
  if (result != nil) {
    return result;
  }

  return [Webcolor webColorForString:colorName];
}

+ (UIColor *)colorForRGBFunction:(NSString *)functionString
{
  NSUInteger stringLength = [functionString length];
  NSRange openParensRange = [functionString rangeOfString:@"("];
  if (openParensRange.location == NSNotFound) {
    return nil;
  }

  //Last char must be terminating ).
  if ([functionString characterAtIndex:stringLength - 1] != ')') {
    return nil;
  }

  NSRange searchRange;
  NSRange nextTokenRange;
  NSUInteger segmentLength;

  searchRange.location = openParensRange.location + 1; //Skipping starting (
  searchRange.length = stringLength - searchRange.location - 1; //-1 for terminating ).

  nextTokenRange = [functionString rangeOfString:@"," options:NSLiteralSearch range:searchRange];
  if (nextTokenRange.location == NSNotFound) {
    return nil;
  }

  segmentLength = nextTokenRange.location - searchRange.location; //This does NOT include a comma.
  float firstArg = [[functionString substringWithRange:NSMakeRange(searchRange.location, segmentLength)] floatValue];

  searchRange.location += segmentLength + 1;
  searchRange.length -= segmentLength + 1;

  nextTokenRange = [functionString rangeOfString:@"," options:NSLiteralSearch range:searchRange];
  if (nextTokenRange.location == NSNotFound) {
    return nil;
  }

  segmentLength = nextTokenRange.location - searchRange.location; //This does NOT include a comma.
  float secondArg = [[functionString substringWithRange:NSMakeRange(searchRange.location, segmentLength)] floatValue];

  searchRange.location += segmentLength + 1;
  searchRange.length -= segmentLength + 1;

  nextTokenRange = [functionString rangeOfString:@"," options:NSLiteralSearch range:searchRange];

  float thirdArg, fourthArg = 1.0;
  if (nextTokenRange.location == NSNotFound) {
    thirdArg = [[functionString substringWithRange:searchRange] floatValue];
  } else {
    segmentLength = nextTokenRange.location - searchRange.location;
    thirdArg = [[functionString substringWithRange:NSMakeRange(searchRange.location, segmentLength)] floatValue];
    fourthArg = [[functionString substringWithRange:NSMakeRange(nextTokenRange.location + 1, searchRange.length - segmentLength - 1)] floatValue];
  }

  return RGBACOLOR(firstArg, secondArg, thirdArg, fourthArg);
}

+ (UIColor *)colorForHex:(NSString *)hexCode
{
  NSUInteger length = [hexCode length];
  float alpha = 1.0;
  if ((length != 3) && (length != 4) && (length != 6) && (length != 7) && (length != 8)) {
    if ([hexCode rangeOfString:@"rgb"].location == NSNotFound) {
      DebugLog(@"[WARN] Hex color passed looks invalid: %@", hexCode);
    }
    return nil;
  }
  unsigned value = 0;

  for (size_t i = 0; i < length; ++i) {
    unichar thisChar = [hexCode characterAtIndex:i];
    if (thisChar == '#')
      continue;
    if (!isASCIIHexDigit(thisChar)) {
      return nil;
    }
    value <<= 4;
    value |= toASCIIHexValue(thisChar);
  }

  if (length < 6) {
    value = ((value & 0xF000) << 16) | ((value & 0xFF00) << 12) | ((value & 0xFF0) << 8) | ((value & 0xFF) << 4) | (value & 0xF);
  }

  if ((length % 4) == 0) {
    alpha = ((value >> 24) & 0xFF) / 255.0;
  }

  int red = (value >> 16) & 0xFF;
  int green = (value >> 8) & 0xFF;
  int blue = value & 0xFF;

  return RGBACOLOR(red, green, blue, alpha);
}

+ (void)flushCache
{
  RELEASE_TO_NIL(colorLookup);
  RELEASE_TO_NIL(semanticColors);
  RELEASE_TO_NIL(checkmarkColor);
}

+ (BOOL)isDarkColor:(UIColor *)color
{
  const CGFloat *components = CGColorGetComponents([color CGColor]);
  CGFloat red = components[0];
  CGFloat green = components[1];
  CGFloat blue = components[2];
  CGFloat formula = (red * 299) + (green * 587) + (blue * 114) / 1000;
  return formula < 125;
}

@end
