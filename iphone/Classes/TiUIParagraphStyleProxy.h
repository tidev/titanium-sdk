//
//  TTiUIParagraphStyleProxy.h
//  Titanium
//
//  Created by vijay vikram singh on 5/26/17.
//
//

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
