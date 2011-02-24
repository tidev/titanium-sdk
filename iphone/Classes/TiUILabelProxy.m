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

#define LABEL_TRACKING

#ifdef LABEL_TRACKING
id blessedObject = nil;
#endif

@implementation TiUILabelProxy

#ifdef LABEL_TRACKING
-(void)markProgress:(id)comment
{
	if (blessedObject == self)
	{
		NSLog(@"%X (%@) during %@ is currently at retain count %d",self,self,comment,[self retainCount]);
	}
}

- (id) init
{
	self = [super init];
	if (self != nil)
	{
		if (blessedObject == nil)
		{
			blessedObject = self;
		}
		[self markProgress:@"init"];
	}
	return self;
}

-(id)retain
{
	[self markProgress:@"retain"];
	return [super retain];
}

-(void)release
{
	[self markProgress:@"release"];
	[super release];
}
#endif


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

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObject:@"text" forKey:@"textid"];
}

@end

#endif