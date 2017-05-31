/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIATTRIBUTEDSTRING
#import "TiProxy.h"

typedef enum {
    ParagraphAttributeHyphenationFactor,
    ParagraphAttributeLineSpacing,
    ParagraphAttributeParagraphSpacing,
    ParagraphAttributeParagraphSpacingBefore,
    ParagraphAttributeHeadIndent,
    ParagraphAttributeTailIndent,
    ParagraphAttributeFirstLineHeadIndent,
    ParagraphAttributeMinimumLineHeight,
    ParagraphAttributeMaximumLineHeight,
    ParagraphAttributeLineHeightMultiple,
    ParagraphAttributeLineBreakMode,
    ParagraphAttributeAlignment,
    ParagraphAttributeBaseWritingDirection
} ParagraphAttribute;

@interface TiUIParagraphStyleProxy : TiProxy
{
    NSMutableParagraphStyle *_paragraphStyle;
}

- (NSMutableParagraphStyle *)paragraphStyle;

@end

#endif
