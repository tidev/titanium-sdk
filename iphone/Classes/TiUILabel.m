/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUILabel.h"
#import "TiUILabelProxy.h"
#import "TiUtils.h"

@implementation TiUILabel

#pragma mark Internal

- (BOOL)interactionDefault
{
	// by default, labels don't have any interaction unless you explicitly add
	// it via addEventListener
	return NO;
}

-(CGSize)sizeForFont:(CGFloat)suggestedWidth
{
	NSString *value = [label text];
	UIFont *font = [label font];
	CGSize maxSize = CGSizeMake(suggestedWidth<=0 ? 480 : suggestedWidth, 1000);
	requiresLayout = YES;
	return [value sizeWithFont:font constrainedToSize:maxSize lineBreakMode:UILineBreakModeTailTruncation];
}

-(CGFloat)autoWidthForWidth:(CGFloat)suggestedWidth
{
	return [self sizeForFont:suggestedWidth].width;
}

-(CGFloat)autoHeightForWidth:(CGFloat)width
{
	return [self sizeForFont:width].height;
}

// CoreGraphics renders fonts anti-aliased by drawing text on the 0.5 offset of the 
// origin. If your origin is on a fraction vs whole number, you'll get blurry text
// the CGRectIntegral method ensures that the origin is not on the half pixel,
// and this must be computed in as broad a frame of reference as possible (ideally,
// at the window level).
//
// NOTE: When dequeuing from a table, this gets really ugly... because we HAVE
// no window coordinate system (the cell doesn't belong to a window yet).  So
// this, unfortunately, is the best we can do.

-(UIView*)supermostView
{
    UIView* superView = self;
    while ([superView superview] != nil) {
        superView = [superView superview];
    }
    return superView;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [TiUtils setView:label positionRect:bounds];
    CGRect normalizedFrame = CGRectIntegral(frame);
    CGRect adjustedFrame = CGRectMake(normalizedFrame.origin.x - frame.origin.x,
                                      normalizedFrame.origin.y - frame.origin.y,
                                      normalizedFrame.size.width,
                                      normalizedFrame.size.height);
    
    [label setFrame:adjustedFrame];
}

-(void)setFrame:(CGRect)frame
{
    if (!antialiasOK) {
        UIView* referenceView = [self supermostView];
        CGRect normalizedFrame = CGRectIntegral([self convertRect:frame toView:referenceView]);
        [super setFrame:[self convertRect:normalizedFrame fromView:referenceView]];
        
        // But wait!  There's more!  We now have to INDIVIDUALLY ADJUST the label frame using the same method!
        // The reason?  There is always this awful, degenerate case:
        // - The label frame was placed at a +/-0.5 offset by frameSizeChanged:
        // - But within the REFERENCE VIEW the current frame is being set on a +/-0.5 offset
        // - So the frame is normalized to be on an integer boundary
        // - WHICH PLACES THE LABEL ON A +/-0.5 BOUNDARY.  Provided that the reference view is being
        //   placed on an integer in the global coordinates.  Maybe it won't be!  Fun!
        normalizedFrame = CGRectIntegral([label convertRect:[label frame] toView:referenceView]);
        [label setFrame:[label convertRect:normalizedFrame fromView:referenceView]];
    }
    else {
        [super setFrame:frame];
    }
}

-(void)setBounds:(CGRect)bounds
{
    if (!antialiasOK) {
        UIView* referenceView = [self supermostView];
        CGRect normalizedBounds = CGRectIntegral([self convertRect:bounds toView:referenceView]);
        [super setBounds:[self convertRect:normalizedBounds fromView:referenceView]];
        
        // See above for why we do this ridiculous thing.  Frames are usually only set once though,
        // boundaries can be set up to 6+ times for a deeply nested view.
        normalizedBounds = CGRectIntegral([label convertRect:[label bounds] toView:referenceView]);
        [label setBounds:[label convertRect:normalizedBounds fromView:referenceView]];
    }
    else {
        [super setBounds:bounds];
    }
}

-(UILabel*)label
{
	if (label==nil)
	{
        label = [[UILabel alloc] initWithFrame:CGRectZero];
        label.backgroundColor = [UIColor clearColor];
        label.numberOfLines = 0;
        label.contentMode = UIViewContentModeRedraw;
        [self addSubview:label];
	}
	return label;
}

-(void)setHighlighted:(BOOL)newValue
{
	[[self label] setHighlighted:newValue];
}

-(BOOL)isHighlighted
{
	return [[self label] isHighlighted];
}

#pragma mark Public APIs

-(void)setText_:(id)text
{
	[[self label] setText:[TiUtils stringValue:text]];
	if (requiresLayout)
	{
		[(TiViewProxy *)[self proxy] setNeedsReposition];
	}
	else
	{
		[(TiViewProxy *)[self proxy] setNeedsRepositionIfAutoSized];
	}

}

-(void)setColor_:(id)color
{
	[[self label] setTextColor:[[TiUtils colorValue:color] _color]];
}

-(void)setHighlightedColor_:(id)color
{
	[[self label] setHighlightedTextColor:[[TiUtils colorValue:color] _color]];
}

-(void)setFont_:(id)font
{
	[[self label] setFont:[[TiUtils fontValue:font] font]];
	if (requiresLayout)
	{
		[(TiViewProxy *)[self proxy] setNeedsReposition];
	}
}

-(void)setTextAlign_:(id)alignment
{
	[[self label] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
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

-(void)setAllowAntialiasing_:(id)value
{
    antialiasOK = [TiUtils boolValue:value];
}

@end
