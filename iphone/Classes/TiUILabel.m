/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILABEL

#import "TiUILabel.h"
#import "TiUILabelProxy.h"
#import "TiUtils.h"
#import "UIImage+Resize.h"
#import <CoreText/CoreText.h>

#if defined (USE_TI_UIATTRIBUTEDSTRING) || defined (USE_TI_UIIOSATTRIBUTEDSTRING)
#import "TiUIAttributedStringProxy.h"
#endif
@implementation TiUILabel

#pragma mark Internal

-(id)init
{
    if (self = [super init]) {
        padding = CGRectZero;
        initialLabelFrame = CGRectZero;
        verticalAlign = UIControlContentVerticalAlignmentFill;
    }
    return self;
}

-(void)dealloc
{
    RELEASE_TO_NIL(label);
    RELEASE_TO_NIL(wrapperView);
    [super dealloc];
}


- (BOOL)interactionDefault
{
	// by default, labels don't have any interaction unless you explicitly add
	// it via addEventListener
	return NO;
}


-(CGSize)sizeForFont:(CGFloat)suggestedWidth
{
	NSAttributedString *value = [label attributedText];
	CGSize maxSize = CGSizeMake(suggestedWidth<=0 ? 480 : suggestedWidth, 10000);
	CGSize shadowOffset = [label shadowOffset];
	requiresLayout = YES;
	if ((suggestedWidth > 0) && [[label text] hasSuffix:@" "]) {
		// (CGSize)sizeWithFont:(UIFont *)font constrainedToSize:(CGSize)size lineBreakMode:(UILineBreakMode)lineBreakMode method truncates
		// the string having trailing spaces when given size parameter width is equal to the expected return width, so we adjust it here.
		maxSize.width += 0.00001;
	}
    CGSize returnVal = [value boundingRectWithSize:maxSize
                                           options:NSStringDrawingUsesLineFragmentOrigin
                                           context:nil].size;
    CGSize size = CGSizeMake(ceilf(returnVal.width), ceilf(returnVal.height));
	if (shadowOffset.width > 0)
	{
		// if we have a shadow and auto, we need to adjust to prevent
		// font from clipping
		size.width += shadowOffset.width + 10;
	}

	return size;
}


-(CGFloat)contentWidthForWidth:(CGFloat)suggestedWidth
{
    /*
     Why both? sizeThatFits returns the width with line break mode tail truncation and we like to 
     have atleast enough space to display one word. On the otherhand font measurement is unsuitable for 
     attributed strings till we move to the new measurement API. Hence take both and return MAX.
     */
    CGFloat sizeThatFitsResult = [[self label] sizeThatFits:CGSizeMake(suggestedWidth, 0)].width;
    CGFloat fontMeasurementResult = [self sizeForFont:suggestedWidth].width;
    return (MAX(sizeThatFitsResult, fontMeasurementResult));
}

-(CGFloat)contentHeightForWidth:(CGFloat)width
{
	return [[self label] sizeThatFits:CGSizeMake(width, 0)].height;
}

-(void)padLabel
{
#ifndef TI_USE_AUTOLAYOUT
    CGSize actualLabelSize = [[self label] sizeThatFits:CGSizeMake(initialLabelFrame.size.width, 0)];
    UIControlContentVerticalAlignment alignment = verticalAlign;
    if (alignment == UIControlContentVerticalAlignmentFill) {
        //IOS7 layout issue fix with attributed string.
        if (actualLabelSize.height < initialLabelFrame.size.height) {
            alignment = UIControlContentVerticalAlignmentCenter;
        } else {
            alignment = UIControlContentVerticalAlignmentTop;
        }
    }
    if (alignment != UIControlContentVerticalAlignmentFill && ([label numberOfLines] != 1)) {
        CGFloat originX = 0;
        switch (label.textAlignment) {
            case NSTextAlignmentRight:
                originX = (initialLabelFrame.size.width - actualLabelSize.width);
                break;
            case NSTextAlignmentCenter:
                originX = (initialLabelFrame.size.width - actualLabelSize.width)/2.0;
                break;
            default:
                break;
        }

        if (originX < 0) {
            originX = 0;
        }
        CGRect labelRect = CGRectMake(originX, 0, actualLabelSize.width, actualLabelSize.height);
        switch (alignment) {
            case UIControlContentVerticalAlignmentBottom:
                labelRect.origin.y = initialLabelFrame.size.height - actualLabelSize.height;
                break;
            case UIControlContentVerticalAlignmentCenter:
                labelRect.origin.y = (initialLabelFrame.size.height - actualLabelSize.height)/2;
                if (labelRect.origin.y < 0) {
                    labelRect.size.height = (initialLabelFrame.size.height - labelRect.origin.y);
                }
                break;
            default:
                if (initialLabelFrame.size.height < actualLabelSize.height) {
                    labelRect.size.height = initialLabelFrame.size.height;
                }
                break;
        }

        [label setFrame:CGRectIntegral(labelRect)];
    }
    else {
        [label setFrame:initialLabelFrame];
    }

    if ([self backgroundImageLayer] != nil && !CGRectIsEmpty(initialLabelFrame))
    {
        [self updateBackgroundImageFrameWithPadding];
    }
	return;
#endif
}

// FIXME: This isn't quite true.  But the brilliant soluton wasn't so brilliant, because it screwed with layout in unpredictable ways.
//	Sadly, there was a brilliant solution for fixing the blurring here, but it turns out there's a
//	quicker fix: Make sure the label itself has an even height and width. Everything else is irrelevant.
-(void)setCenter:(CGPoint)newCenter
{
	[super setCenter:CGPointMake(floorf(newCenter.x), floorf(newCenter.y))];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
#ifndef TI_USE_AUTOLAYOUT
    initialLabelFrame = bounds;
    [wrapperView setFrame:initialLabelFrame];
#endif
    [self padLabel];
    [super frameSizeChanged:frame bounds:bounds];
}

-(UILabel*)label
{
	if (label==nil)
	{
        label = [[UILabel alloc] initWithFrame:CGRectZero];
        label.backgroundColor = [UIColor clearColor];
        label.numberOfLines = 0;
#ifndef TI_USE_AUTOLAYOUT
        wrapperView = [[UIView alloc] initWithFrame:[self bounds]];
        [wrapperView addSubview:label];
        wrapperView.clipsToBounds = YES;
        [wrapperView setUserInteractionEnabled:NO];
        [self addSubview:wrapperView];
#else
        [self addSubview:label];
#endif
        minFontSize = 0;
    }
	return label;
}

-(BOOL)proxyHasGestureListeners
{
    return [super proxyHasGestureListeners] || [(TiViewProxy*)[self proxy] _hasListeners:@"link" checkParent:NO];
}

-(void)ensureGestureListeners
{
    if ([(TiViewProxy*)[self proxy] _hasListeners:@"link" checkParent:NO]) {
        [[self gestureRecognizerForEvent:@"singletap"] setEnabled:YES];
    }
    [super ensureGestureListeners];
}

-(void)handleListenerRemovedWithEvent:(NSString *)event
{
	ENSURE_UI_THREAD_1_ARG(event);
	// unfortunately on a remove, we have to check all of them
	// since we might be removing one but we still have others
    if ([event isEqualToString:@"link"] || [event isEqualToString:@"singletap"]) {
        BOOL enableListener = [self.proxy _hasListeners:@"singletap"] || [(TiViewProxy*)[self proxy] _hasListeners:@"link" checkParent:NO];
        [[self gestureRecognizerForEvent:@"singletap"] setEnabled:enableListener];
    } else {
        [super handleListenerRemovedWithEvent:event];
    }
}

-(BOOL)checkLinkAttributeForString:(NSMutableAttributedString*)theString atPoint:(CGPoint)p
{
    CGPoint thePoint = [self convertPoint:p toView:label];
    CGRect drawRect = [label textRectForBounds:[label bounds] limitedToNumberOfLines:label.numberOfLines];
    drawRect.origin.y = (label.bounds.size.height - drawRect.size.height)/2;
    thePoint = CGPointMake(thePoint.x - drawRect.origin.x, thePoint.y - drawRect.origin.y);
    //Convert to CT point;
    thePoint.y = (drawRect.size.height - thePoint.y);
    CTFramesetterRef theRef = CTFramesetterCreateWithAttributedString((__bridge CFAttributedStringRef)theString);
    if (theRef == NULL) {
        return;
    }
    
    CGMutablePathRef path = CGPathCreateMutable();
    
    CGPathAddRect(path, NULL, drawRect);

    CTFrameRef frame = CTFramesetterCreateFrame(theRef, CFRangeMake(0, [theString length]), path, NULL);
    //Don't need this anymore
    CFRelease(theRef);

    if (frame == NULL) {
        CFRelease(path);
        return NO;
    }
    //Get Lines
    CFArrayRef lines = CTFrameGetLines(frame);
    if (lines == NULL) {
        CFRelease(frame);
        CFRelease(path);
        return NO;
    }
    
    NSInteger lineCount = CFArrayGetCount(lines);
    if (lineCount == 0) {
        CFRelease(frame);
        CFRelease(path);
        //CFRelease(lines);
        return NO;
    }
    //Get Line Origins
    CGPoint lineOrigins[lineCount];
    CTFrameGetLineOrigins(frame, CFRangeMake(0, lineCount), lineOrigins);
    
    NSUInteger idx = NSNotFound;
    for (CFIndex lineIndex = 0; (lineIndex < lineCount) && (idx == NSNotFound); lineIndex++) {
        
        CGPoint lineOrigin = lineOrigins[lineIndex];
        CTLineRef line = CFArrayGetValueAtIndex(lines, lineIndex);
        
        // Get bounding information of line
        CGRect lineRect = CTLineGetBoundsWithOptions(line,0);
        CGFloat ymin = lineRect.origin.y + lineOrigin.y;
        CGFloat ymax = ymin + lineRect.size.height;
        
        if (ymin <= thePoint.y && ymax >= thePoint.y) {
            if (thePoint.x >= lineOrigin.x && thePoint.x <= lineOrigin.x + lineRect.size.width) {
                // Convert CT coordinates to line-relative coordinates
                CGPoint relativePoint = CGPointMake(thePoint.x - lineOrigin.x, thePoint.y - lineOrigin.y);
                idx = CTLineGetStringIndexForPosition(line, relativePoint);
            }
        }
    }
    
    //Don't need frame,path or lines now
    CFRelease(frame);
    CFRelease(path);
    //CFRelease(lines);
    
    if (idx != NSNotFound) {
        if(idx > theString.string.length) {
            return NO;
        }
        NSRange theRange = NSMakeRange(0, 0);
        NSString *url = [theString attribute:NSLinkAttributeName atIndex:idx effectiveRange:&theRange];
        if(url != nil && url.length) {
            NSDictionary *eventDict = [NSDictionary dictionaryWithObjectsAndKeys:
                                       url, @"url",
                                       [NSArray arrayWithObjects:NUMUINTEGER(theRange.location), NUMUINTEGER(theRange.length),nil],@"range",
                                       nil];
                                            
            [[self proxy] fireEvent:@"link" withObject:eventDict propagate:NO reportSuccess:NO errorCode:0 message:nil];
            return YES;
        }
    }
    return NO;
}

-(void)recognizedTap:(UITapGestureRecognizer*)recognizer
{
    BOOL testLink = (label != nil) &&([(TiViewProxy*)[self proxy] _hasListeners:@"link" checkParent:NO]);
    CGPoint tapPoint = [recognizer locationInView:self];
    NSDictionary *event = [TiUtils pointToDictionary:tapPoint];
    
    if ([recognizer numberOfTouchesRequired] == 2) {
        [self.proxy fireEvent:@"twofingertap" withObject:event];
    }
    else if ([recognizer numberOfTapsRequired] == 2) {
        //Because double-tap suppresses touchStart and double-click, we must do this:
        if ([self.proxy _hasListeners:@"touchstart"])
        {
            [self.proxy fireEvent:@"touchstart" withObject:event propagate:YES];
        }
        if ([self.proxy _hasListeners:@"dblclick"]) {
            [self.proxy fireEvent:@"dblclick" withObject:event propagate:YES];
        }
        [self.proxy fireEvent:@"doubletap" withObject:event];
    }
    else {
        [self.proxy fireEvent:@"singletap" withObject:event];
        if (testLink) {
            NSMutableAttributedString* optimizedAttributedText = [label.attributedText mutableCopy];
            if (optimizedAttributedText != nil) {
                // use label's font and lineBreakMode properties in case the attributedText does not contain such attributes
                [label.attributedText enumerateAttributesInRange:NSMakeRange(0, [label.attributedText length]) options:0 usingBlock:^(NSDictionary *attrs, NSRange range, BOOL *stop) {
                    if (!attrs[(NSString*)kCTFontAttributeName]) {
                        [optimizedAttributedText addAttribute:(NSString*)kCTFontAttributeName value:label.font range:range];
                    }
                    if (!attrs[(NSString*)kCTParagraphStyleAttributeName]) {
                        NSMutableParagraphStyle *paragraphStyle = [[NSMutableParagraphStyle alloc] init];
                        [paragraphStyle setLineBreakMode:label.lineBreakMode];
                        [optimizedAttributedText addAttribute:(NSString*)kCTParagraphStyleAttributeName value:paragraphStyle range:range];
                        RELEASE_TO_NIL(paragraphStyle);
                    }
                }];
                
                // modify kCTLineBreakByTruncatingTail lineBreakMode to kCTLineBreakByWordWrapping
                [optimizedAttributedText enumerateAttribute:(NSString*)kCTParagraphStyleAttributeName inRange:NSMakeRange(0, [optimizedAttributedText length]) options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
                    NSMutableParagraphStyle* paragraphStyle = [value mutableCopy];
                    if ([paragraphStyle lineBreakMode] == NSLineBreakByTruncatingTail) {
                        [paragraphStyle setLineBreakMode:NSLineBreakByWordWrapping];
                    }
                    [optimizedAttributedText removeAttribute:(NSString*)kCTParagraphStyleAttributeName range:range];
                    [optimizedAttributedText addAttribute:(NSString*)kCTParagraphStyleAttributeName value:paragraphStyle range:range];
                    RELEASE_TO_NIL(paragraphStyle);
                }];
                [self checkLinkAttributeForString:optimizedAttributedText atPoint:tapPoint];
                [optimizedAttributedText release];
            }
        }
    }
}

- (id)accessibilityElement
{
	return [self label];
}

-(void)setHighlighted:(BOOL)newValue
{
	[[self label] setHighlighted:newValue];
}

- (void)didMoveToSuperview
{
	/*
	 *	Because of how we re-use the same cells in both a tableview and its
	 *	search table, there is the chance that the label is transported between
	 *	the two views before a selected search row is deselected. In other
	 *	words, make sure we're not highlighted when changing superviews.
	 */
	[self setHighlighted:NO];
	[super didMoveToSuperview];
}

- (void)didMoveToWindow
{
    /*
     * See above
     */
    [self setHighlighted:NO];
    [super didMoveToWindow];
}

-(BOOL)isHighlighted
{
	return [[self label] isHighlighted];
}

#pragma mark Public APIs

-(void)setVerticalAlign_:(id)value
{
    verticalAlign = [TiUtils intValue:value def:UIControlContentVerticalAlignmentFill];
    if (verticalAlign < UIControlContentVerticalAlignmentCenter || verticalAlign > UIControlContentVerticalAlignmentBottom) {
        verticalAlign = UIControlContentVerticalAlignmentFill;
    }
    if (label != nil) {
        [self padLabel];
    }
}
-(void)setText_:(id)text
{
	[[self label] setText:[TiUtils stringValue:text]];
    [self padLabel];
	[(TiViewProxy *)[self proxy] contentsWillChange];
}

-(void)setColor_:(id)color
{
	UIColor * newColor = [[TiUtils colorValue:color] _color];
	[[self label] setTextColor:(newColor != nil)?newColor:[UIColor darkTextColor]];
}

-(void)setEllipsize_:(id)value
{
	ENSURE_SINGLE_ARG(value, NSNumber);
	//for bool case and parity with android
	if ([TiUtils intValue:value] == 1) {
		[[self label] setLineBreakMode:NSLineBreakByTruncatingTail];
		return;
	}
	[[self label] setLineBreakMode:[TiUtils intValue:value]];
}

-(void)setHighlightedColor_:(id)color
{
	UIColor * newColor = [[TiUtils colorValue:color] _color];
	[[self label] setHighlightedTextColor:(newColor != nil)?newColor:[UIColor lightTextColor]];
}

-(void)setFont_:(id)font
{
    [[self label] setFont:[[TiUtils fontValue:font] font]];
    if (minFontSize > 4) {
        CGFloat ratio = minFontSize/label.font.pointSize;
        [label setMinimumScaleFactor:ratio];
    }
    [(TiViewProxy *)[self proxy] contentsWillChange];
}

-(void)setMinimumFontSize_:(id)size
{
    minFontSize = [TiUtils floatValue:size];
    if (minFontSize < 4) { // Beholden to 'most minimum' font size
        [[self label] setAdjustsFontSizeToFitWidth:NO];
        [label setMinimumScaleFactor:0.0];
        [label setNumberOfLines:0];
    }
    else {
        [[self label] setNumberOfLines:1];
        [label setAdjustsFontSizeToFitWidth:YES];
        CGFloat ratio = minFontSize/label.font.pointSize;
        [label setMinimumScaleFactor:ratio];
    }

}


-(void) updateBackgroundImageFrameWithPadding
{
    CGRect backgroundFrame = CGRectMake(self.bounds.origin.x - padding.origin.x,
               self.bounds.origin.y - padding.origin.y,
               self.bounds.size.width + padding.origin.x + padding.size.width,
                                        self.bounds.size.height + padding.origin.y + padding.size.height);
    [self backgroundImageLayer].frame = backgroundFrame;
}

-(void)setAttributedString_:(id)arg
{
#if defined (USE_TI_UIIOSATTRIBUTEDSTRING) || defined (USE_TI_UIATTRIBUTEDSTRING)
    ENSURE_SINGLE_ARG(arg, TiUIAttributedStringProxy);
    [[self proxy] replaceValue:arg forKey:@"attributedString" notification:NO];
    [[self label] setAttributedText:[arg attributedString]];
    [self padLabel];
    [(TiViewProxy *)[self proxy] contentsWillChange];
#endif
}

-(void)setBackgroundPaddingLeft_:(id)left
{
    padding.origin.x = [TiUtils floatValue:left];
    [self updateBackgroundImageFrameWithPadding];
}

-(void)setBackgroundPaddingRight_:(id)right
{
    padding.size.width = [TiUtils floatValue:right];
    [self updateBackgroundImageFrameWithPadding];
}

-(void)setBackgroundPaddingTop_:(id)top
{
    padding.origin.y = [TiUtils floatValue:top];
    [self updateBackgroundImageFrameWithPadding];
}

-(void)setBackgroundPaddingBottom_:(id)bottom
{
    padding.size.height = [TiUtils floatValue:bottom];
    [self updateBackgroundImageFrameWithPadding];
}

-(void)setTextAlign_:(id)alignment
{
	[[self label] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
    [self padLabel];
}

-(void)setShadowColor_:(id)color
{
	if (color==nil)
	{
		[[self label] setShadowColor:nil];
	}
	else
	{
		color = [TiUtils colorValue:color];
		[[self label] setShadowColor:[color _color]];
	}
}

-(void)setShadowOffset_:(id)value
{
	CGPoint p = [TiUtils pointValue:value];
	CGSize size = {p.x,p.y};
	[[self label] setShadowOffset:size];
}

@end

#endif