/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILABEL

#import "TiUILabelProxy.h"
#import "TiUILabel.h"
#import "TiUtils.h"

@implementation TiUILabelProxy

USE_VIEW_FOR_AUTO_WIDTH

-(CGFloat)autoHeightForWidth:(CGFloat)suggestedWidth
{
	NSString *value = [TiUtils stringValue:[self valueForKey:@"text"]];
	id fontValue = [self valueForKey:@"font"];
	UIFont *font = nil;
	if (fontValue!=nil)
	{
		font = [[TiUtils fontValue:[self valueForKey:@"font"]] font];
	}
	else 
	{
		font = [UIFont systemFontOfSize:[UIFont labelFontSize]];
	}
	CGSize maxSize = CGSizeMake(suggestedWidth, 1E100);
	CGSize size = [value sizeWithFont:font constrainedToSize:maxSize lineBreakMode:UILineBreakModeTailTruncation];
	return [self verifyHeight:size.height]; //Todo: We need to verifyHeight elsewhere as well.
}

-(CGFloat) verifyWidth:(CGFloat)suggestedWidth
{
	int width = ceil(suggestedWidth);
	if (width & 0x01)
	{
		width ++;
	}
	return width;
}

-(CGFloat) verifyHeight:(CGFloat)suggestedHeight
{
	int height = ceil(suggestedHeight);
	if (height & 0x01)
	{
		height ++;
	}
	return height;
}

@end

#endif