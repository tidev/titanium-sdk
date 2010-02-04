/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUILabel.h"
#import "TiUtils.h"
#import <QuartzCore/QuartzCore.h>

@implementation TiUILabel

#pragma mark Internal

-(CGSize)sizeForFont:(CGFloat)suggestedWidth
{
	NSString *value = [label text];
	UIFont *font = [label font];
	CGSize maxSize = CGSizeMake(suggestedWidth, CGFLOAT_MAX);
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
	[TiUtils setView:label positionRect:bounds];
}

-(UILabel*)label
{
	if (label==nil)
	{
		label = [[UILabel alloc] initWithFrame:CGRectZero];
		label.backgroundColor = [UIColor clearColor];
		[self addSubview:label];
	}
	return label;
}

#pragma mark Public APIs

-(void)setText_:(id)text
{
	[[self label] setText:[TiUtils stringValue:text]];
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
}

-(void)setTextAlign_:(id)alignment
{
	[[self label] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
}


@end
