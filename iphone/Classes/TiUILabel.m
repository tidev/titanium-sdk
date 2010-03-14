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

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	// CoreGraphics renders fonts anti-aliased by drawing text on the 0.5 offset of the 
	// origin. If your origin is on a fraction vs whole number, you'll get blurry text
	// the CGRectIntegral method ensures that the origin is not on the half pixel
	self.frame = CGRectIntegral(self.frame);
	[TiUtils setView:label positionRect:bounds];
}

-(UILabel*)label
{
	if (label==nil)
	{
		label = [[UILabel alloc] initWithFrame:CGRectZero];
		label.backgroundColor = [UIColor clearColor];
		label.numberOfLines = 0;
		[self addSubview:label];
	}
	return label;
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

@end
