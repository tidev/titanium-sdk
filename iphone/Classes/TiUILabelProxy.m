/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUILabelProxy.h"
#import "TiUILabel.h"
#import "TiUtils.h"

@implementation TiUILabelProxy

-(CGFloat)autoHeightForWidth:(CGFloat)suggestedWidth
{
	NSString *value = [self valueForKey:@"text"];
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
	CGSize maxSize = CGSizeMake(suggestedWidth, 1000);
	CGSize size = [value sizeWithFont:font constrainedToSize:maxSize lineBreakMode:UILineBreakModeTailTruncation];
	TiDimension top = [TiUtils dimensionValue:[self valueForKey:@"top"]];
	TiDimension bottom = [TiUtils dimensionValue:[self valueForKey:@"bottom"]];
	CGFloat result = size.height + 
			(TiDimensionIsPixels(top) ? top.value : 0) +
			(TiDimensionIsPixels(bottom) ? bottom.value : 0) ;		
	return result;
}

@end
