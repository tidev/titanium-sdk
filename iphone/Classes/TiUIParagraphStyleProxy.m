//
//  TiUIParagraphStyleProxy.m
//  Titanium
//
//  Created by vijay vikram singh on 5/26/17.
//
//

#ifdef USE_TI_UIATTRIBUTEDSTRING

#import "TiUIParagraphStyleProxy.h"
#import "TiUtils.h"

@implementation TiUIParagraphStyleProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
    _paragraphStyle = [[NSMutableParagraphStyle alloc]  init];
    [super _initWithProperties:properties];
}

- (NSString *)apiName
{
    return @"Ti.UI.ParagraphStyle";
}

- (void)dealloc
{
    RELEASE_TO_NIL(_paragraphStyle);
    [super dealloc];
}

- (void)addAttribute:(id)args
{
    ENSURE_SINGLE_ARG(args, NSDictionary)
    
    NSNumber *type = [args valueForKey:@"type"];
    if(!type) {
        DebugLog(@"[WARN] Ti.UI.ParagraphStyle.type not set");
        return;
    }
    
    id value = [args valueForKey:@"value"];
    if(!value) {
        DebugLog(@"[WARN] Ti.UI.ParagraphStyle.value not set");
        return;
    }
    
    switch ([type integerValue]) {
        case ParagraphAttributeHyphenationFactor:
            [_paragraphStyle setHyphenationFactor:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeLineSpacing:
            [_paragraphStyle setLineSpacing:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeParagraphSpacing:
            [_paragraphStyle setParagraphSpacing:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeParagraphSpacingBefore:
            [_paragraphStyle setParagraphSpacingBefore:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeHeadIndent:
            [_paragraphStyle setHeadIndent:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeTailIndent:
            [_paragraphStyle setTailIndent:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeFirstLineHeadIndent:
            [_paragraphStyle setFirstLineHeadIndent:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeMinimumLineHeight:
            [_paragraphStyle setMinimumLineHeight:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeMaximumLineHeight:
            [_paragraphStyle setMaximumLineHeight:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeLineHeightMultiple:
            [_paragraphStyle setLineHeightMultiple:[TiUtils floatValue:value]];
            break;
        case ParagraphAttributeLineBreakMode:
            [_paragraphStyle setLineBreakMode:[TiUtils intValue:value]];
            break;
        case ParagraphAttributeAlignment:
            [_paragraphStyle setAlignment:[TiUtils textAlignmentValue:value]];
            break;
        case ParagraphAttributeBaseWritingDirection:
            [_paragraphStyle setBaseWritingDirection:[TiUtils intValue:value]];
            break;
    }
}

- (void)setAttributes:(id)args
{
    ENSURE_ARRAY(args);
    
    for (id jsAttribute in args) {
        [self addAttribute:jsAttribute];
    }
}

- (NSMutableParagraphStyle *)paragraphStyle
{
    return _paragraphStyle;
}

@end

#endif
