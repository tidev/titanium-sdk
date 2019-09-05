/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIATTRIBUTEDSTRING
#import <TitaniumKit/TiProxy.h>

@interface TiUIAttributedStringProxy : TiProxy {
  NSMutableAttributedString *_attributedString;
  NSMutableArray *attributes;
}

- (NSString *)getLink:(NSUInteger)arg;

typedef enum {
  AttributeNameFont,
  AttributeNameParagraphStyle,
  AttributeNameForegroundColor,
  AttributeNameBackgroundColor,
  AttributeNameLigature,
  AttributeNameKern,
  AttributeNameStrikethroughStyle,
  AttributeNameUnderlineStyle,
  AttributeNameStrokeColor,
  AttributeNameStrokeWidth,
  AttributeNameShadow,
  AttributeNameVerticalGlyphForm,
  AttributeNameWritingDirection,
  AttributeNameTextEffect,
  AttributeNameAttachment,
  AttributeNameLink,
  AttributeNameBaselineOffset,
  AttributeNameUnderlineColor,
  AttributeNameStrikethroughColor,
  AttributeNameObliqueness,
  AttributeNameExpansion,
  AttributeNameLineBreak, // deprecated
} AttributeName;

#pragma mark - Not exposed to JS. Internal Use Only.
@property (nonatomic, readonly) NSMutableAttributedString *attributedString;
@property (nonatomic, readonly) NSMutableDictionary *urls;
@end

#endif
