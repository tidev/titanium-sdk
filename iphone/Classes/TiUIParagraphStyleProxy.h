//
//  TTiUIParagraphStyleProxy.h
//  Titanium
//
//  Created by vijay vikram singh on 5/26/17.
//
//

#import "TiProxy.h"

typedef enum {
    ParagraphAttributeHyphenationFactor,
    ParagraphAttributeLineSpacing,
    ParagraphAttributeParagraphSpacing
} ParagraphAttribute;

@interface TiUIParagraphStyleProxy : TiProxy
{
    NSMutableParagraphStyle *_paragraphStyle;
}

- (NSMutableParagraphStyle *)paragraphStyle;

@end
