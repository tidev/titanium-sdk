/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSATTRIBUTEDSTRING
#import "TiUIiOSAttributedStringProxy.h"
#import "TiUIiOSProxy.h"
#import "TiUtils.h"

@implementation TiUIiOSAttributedStringProxy

@synthesize _attributedString;
@synthesize _text;

-(void)_destroy
{
    RELEASE_TO_NIL(_text)
    RELEASE_TO_NIL(_attributedString)
    [super _destroy];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    _text = [properties valueForKey:@"text"];
    if(!_text)
    {
        DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.text not set");
    }
    _attributedString = [[NSMutableAttributedString alloc]
                         initWithString:_text];
    [super _initWithProperties:properties];
}


-(void)addAttribute:(id)args
{
    ENSURE_SINGLE_ARG(args, NSDictionary)
    
    NSNumber *type = [args valueForKey:@"type"];
    if(!type)
    {
        DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.type not set");
        return;
    }

    id value = [args valueForKey:@"value"];
    if(!value)
    {
        DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.value not set");
        return;
    }
    
    NSArray *range = [args valueForKey:@"range"];
    if(!range)
    {
        DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.range not set");
        return;
    }
    if([range count] < 2)
    {
        DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.range must be an array of two numbers");
        return;
    }

    NSString *attrName = nil;
    NSString *errorMessage = nil;
    id attrValue = nil;
    switch ([type integerValue])
    {
        case AttributeNameFont:
            attrName = NSFontAttributeName;
            attrValue = [TiUtils fontValue:value];
            break;
        case AttributeNameParagraphStyle:
            attrName = NSParagraphStyleAttributeName;
            errorMessage = @"ATTRIBUTE_PARAGRAPH_STYLE not yet supported";
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
            attrValue = [TiUtils textShadowValue:value];
            break;
        case AttributeNameVerticalGlyphForm:
            attrName = NSVerticalGlyphFormAttributeName;
            attrValue = [TiUtils numberFromObject:value];
            break;
    }
    
    
    if (attrName == nil && attrValue == nil && [TiUtils isIOS7OrGreater])
    {
        switch ([type integerValue]) {
            case AttributeNameWritingDirection:
                attrName = NSWritingDirectionAttributeName;
                NSMutableArray *array = [NSMutableArray array];
                [array addObject:[TiUtils numberFromObject: value]];
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
                attrName = NSLinkAttributeName;
                attrValue = [TiUtils stringValue:value];
                break;
                
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
                
        }
    }
    
    if(errorMessage != nil)
    {
        
		DebugLog(@"[WARN] Ti.UI.iOS.%@", errorMessage);
        return;
    }
    if(!attrValue)
    {
		DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.value is null");
        return;
    }
    if(!attrName)
    {
		DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.type is null");
        return;
    }
    
    NSInteger from = [TiUtils intValue:[range objectAtIndex:0]];
    NSInteger to = [TiUtils intValue:[range objectAtIndex:1]];

    NSRange rangeValue = NSMakeRange(from, to);

    if((from + to) > [_text length])
    {
		DebugLog(@"[WARN] Ti.UI.iOS.AttributedString.range must me equal to or smaller than the text length");
        return;
    }

    [_attributedString addAttribute:attrName value:attrValue range:rangeValue];
}

-(void)setAttributes:(id)args
{
    ENSURE_ARRAY(args)
    for (id jsAttribute in args)
    {
        [self addAttribute:jsAttribute];
    }
}

@end

#endif