/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIATTRIBUTEDSTRING
#import "TiUIAttributedStringProxy.h"
#import <TitaniumKit/TiProxy.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiUIAttributedStringProxy

- (void)_destroy
{
  RELEASE_TO_NIL(_attributedString)
  RELEASE_TO_NIL(attributes)
  [super _destroy];
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  NSString *text = [properties valueForKey:@"text"];
  if (!text) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.text not set");
  }
  _attributedString = [[NSMutableAttributedString alloc] initWithString:text];
  attributes = [[NSMutableArray alloc] init];
  [super _initWithProperties:properties];
}

- (NSString *)apiName
{
  return @"Ti.UI.AttributedString";
}

- (NSMutableAttributedString *)attributedString
{
  return _attributedString;
}

- (void)addAttribute:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary)

  NSNumber *type = [args valueForKey:@"type"];
  if (!type) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.type not set");
    return;
  }

  id value = [args valueForKey:@"value"];
  if (!value) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.value not set");
    return;
  }

  NSArray *range = [args valueForKey:@"range"];
  if (!range) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.range not set");
    return;
  }
  if ([range count] < 2) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.range must be an array of two numbers");
    return;
  }

  NSString *attrName = nil;
  NSString *errorMessage = nil;
  id attrValue = nil;
  switch ([type integerValue]) {

  case AttributeNameFont:
    attrName = NSFontAttributeName;
    WebFont *strFont = [TiUtils fontValue:value def:[WebFont defaultFont]];
    attrValue = [strFont font];
    break;

  case AttributeNameParagraphStyle:
    ENSURE_DICT(value);
    attrName = NSParagraphStyleAttributeName;
    NSMutableParagraphStyle *paragraphStyle = [[[NSMutableParagraphStyle alloc] init] autorelease];

    for (NSString *key in value) {
      id objectValue = [value objectForKey:key];
      if ([key isEqualToString:@"alignment"]) {
        paragraphStyle.alignment = [[TiUtils numberFromObject:objectValue] unsignedIntegerValue];
      } else if ([key isEqual:@"firstLineHeadIndent"]) {
        paragraphStyle.firstLineHeadIndent = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqual:@"headIndent"]) {
        paragraphStyle.headIndent = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqual:@"tailIndent"]) {
        paragraphStyle.tailIndent = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqual:@"lineBreakMode"]) {
        paragraphStyle.lineBreakMode = [[TiUtils numberFromObject:objectValue] unsignedIntegerValue];
      } else if ([key isEqualToString:@"maximumLineHeight"]) {
        paragraphStyle.maximumLineHeight = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqualToString:@"minimumLineHeight"]) {
        paragraphStyle.minimumLineHeight = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqualToString:@"lineSpacing"]) {
        paragraphStyle.lineSpacing = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqualToString:@"paragraphSpacingAfter"]) {
        paragraphStyle.paragraphSpacing = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqualToString:@"paragraphSpacingBefore"]) {
        paragraphStyle.paragraphSpacingBefore = [TiUtils dimensionValue:objectValue].value;
      } else if ([key isEqualToString:@"lineHeightMultiple"]) {
        paragraphStyle.lineHeightMultiple = [TiUtils floatValue:objectValue];
      } else if ([key isEqualToString:@"hyphenationFactor"]) {
        paragraphStyle.hyphenationFactor = (float)[TiUtils floatValue:objectValue];
      } else if ([TiUtils isIOSVersionOrGreater:@"9.0"] && [key isEqualToString:@"allowsDefaultTighteningForTruncation"]) {
        paragraphStyle.allowsDefaultTighteningForTruncation = [TiUtils boolValue:objectValue];
      } else {
        DebugLog(@"[WARN] Ti.UI.ATTRIBUTE_PARAGRAPH_STYLE - Unsupported property %@", key);
      }
    }
    attrValue = paragraphStyle;
    break;

  case AttributeNameForegroundColor:
    attrName = NSForegroundColorAttributeName;
    attrValue = [[TiUtils colorValue:value] _color];
    break;

  case AttributeNameBackgroundColor:
    attrName = NSBackgroundColorAttributeName;
    attrValue = [[TiUtils colorValue:value] _color];
    break;

  case AttributeNameLigature:
    attrName = NSLigatureAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameKern:
    attrName = NSKernAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameStrikethroughStyle:
    attrName = NSStrikethroughStyleAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameUnderlineStyle:
    attrName = NSUnderlineStyleAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameStrokeColor:
    attrName = NSStrokeColorAttributeName;
    attrValue = [[TiUtils colorValue:value] _color];
    break;

  case AttributeNameStrokeWidth:
    attrName = NSStrokeWidthAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameShadow:
    attrName = NSShadowAttributeName;
    attrValue = [TiUtils shadowValue:value];
    break;

  case AttributeNameVerticalGlyphForm:
    attrName = NSVerticalGlyphFormAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameWritingDirection:
    attrName = NSWritingDirectionAttributeName;
    NSMutableArray *array = [NSMutableArray array];
    [array addObject:[TiUtils numberFromObject:value]];
    attrValue = array;
    break;

  case AttributeNameTextEffect:
    attrName = NSTextEffectAttributeName;
    attrValue = [TiUtils stringValue:value];
    break;

  case AttributeNameAttachment:
    attrName = NSAttachmentAttributeName;
    errorMessage = @"ATTRIBUTE_ATTACHMENT not yet supported";
    break;

  case AttributeNameLink:
    [self setLink:args];
    return;

  case AttributeNameBaselineOffset:
    attrName = NSBaselineOffsetAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameUnderlineColor:
    attrName = NSUnderlineColorAttributeName;
    attrValue = [[TiUtils colorValue:value] _color];
    break;

  case AttributeNameStrikethroughColor:
    attrName = NSStrikethroughColorAttributeName;
    attrValue = [[TiUtils colorValue:value] _color];
    break;

  case AttributeNameObliqueness:
    attrName = NSObliquenessAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameExpansion:
    attrName = NSExpansionAttributeName;
    attrValue = [TiUtils numberFromObject:value];
    break;

  case AttributeNameLineBreak:
    DEPRECATED_REPLACED(@"UI.ATTRIBUTE_LINE_BREAK", @"UI.ATTRIBUTE_PARAGRAPH_STYLE.lineBreakMode", @"7.5.0");
    attrName = NSParagraphStyleAttributeName;
    NSMutableParagraphStyle *paragraphStyleObject = [[[NSMutableParagraphStyle alloc] init] autorelease];
    NSNumber *num = [TiUtils numberFromObject:value];
    [paragraphStyleObject setLineBreakMode:[num unsignedIntegerValue]];
    attrValue = paragraphStyleObject;
    break;
  }
  if (errorMessage != nil) {
    DebugLog(@"[WARN] Ti.UI.%@", errorMessage);
    return;
  }
  if (!attrValue) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.value is null");
    return;
  }
  if (!attrName) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.type is null");
    return;
  }

  NSInteger from = [TiUtils intValue:[range objectAtIndex:0]];
  NSInteger length = [TiUtils intValue:[range objectAtIndex:1]];

  NSRange rangeValue = NSMakeRange(from, length);

  if ((from + length) > [_attributedString length]) {
    DebugLog(@"[WARN] Ti.UI.AttributedString.range must me equal to or smaller than the text length");
    return;
  }
  [attributes addObject:args];
  [_attributedString addAttribute:attrName value:attrValue range:rangeValue];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_urls);
  [super dealloc];
}

- (id)attributes
{
  return attributes;
}

- (void)setLink:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary)

  NSArray *range = [args valueForKey:@"range"];
  NSRange rangeValue = NSMakeRange([TiUtils intValue:[range objectAtIndex:0]], [TiUtils intValue:[range objectAtIndex:1]]);

  [_attributedString addAttribute:NSUnderlineStyleAttributeName value:[NSNumber numberWithInt:NSUnderlineStyleSingle] range:rangeValue];
  [_attributedString addAttribute:NSUnderlineColorAttributeName value:[UIColor blueColor] range:rangeValue];
  [_attributedString addAttribute:NSForegroundColorAttributeName value:[UIColor blueColor] range:rangeValue];

  id temp = [args valueForKey:@"value"];
  if (_urls == nil) {
    _urls = [[NSMutableDictionary alloc] init];
  }
  [_urls setObject:[TiUtils stringValue:temp] forKey:NSStringFromRange(rangeValue)];
  [attributes addObject:args];
}

- (NSString *)getLink:(NSUInteger)arg
{
  float tempIndx = ([[NSNumber numberWithUnsignedInteger:arg] floatValue]);

  for (NSString *key in _urls) {
    NSRange range = NSRangeFromString(key);
    CGFloat tempLenght = range.location + range.length;
    if (range.location <= tempIndx && tempLenght >= tempIndx) {
      return [_urls valueForKey:key];
    }
  }
  return nil;
}

- (void)setAttributes:(id)args
{
  ENSURE_ARRAY(args)

  for (NSDictionary *attr in attributes) {

    NSString *name = [attr valueForKey:@"type"];
    NSArray *range = [attr valueForKey:@"range"];

    NSInteger from = [[range objectAtIndex:0] integerValue];
    NSInteger length = [[range objectAtIndex:1] integerValue];

    NSRange rangeValue = NSMakeRange(from, length);

    [_attributedString removeAttribute:name range:rangeValue];
  }
  [attributes removeAllObjects];

  for (id jsAttribute in args) {
    [self addAttribute:jsAttribute];
  }
}

@end

#endif
