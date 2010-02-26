/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIButtonProxy.h"
#import "TiUIButton.h"
#import "TiUINavBarButton.h"
#import "TiUtils.h"

@implementation TiUIButtonProxy

-(void)_destroy
{
	RELEASE_TO_NIL(button);
	[super _destroy];
}

-(void)_configure
{	
	[self replaceValue:NUMBOOL(YES) forKey:@"enabled" notification:NO];
	[super _configure];
}

-(CGFloat)autoHeightForWidth:(CGFloat)suggestedWidth
{
	id style = [self valueForKey:@"style"];
	int type = style!=nil ? [TiUtils intValue:style] : UIButtonTypeCustom;
	switch(type)
	{
		case UITitaniumNativeItemInfoLight:
		case UITitaniumNativeItemInfoDark:
		case UITitaniumNativeItemDisclosure:
		{
			return 20;
		}
	}
	TiDimension size = [TiUtils dimensionValue:[self valueForKey:@"height"]];
	if (TiDimensionIsPixels(size))
	{
		return size.value;
	}
	// reasonable default?
	return 50;
}

-(UIBarButtonItem*)barButtonItem
{
	id backgroundImageValue = [self valueForKey:@"backgroundImage"];
	if (!IS_NULL_OR_NIL(backgroundImageValue))
	{
		return [super barButtonItem];
	}

	if (button==nil)
	{
		button = [[TiUINavBarButton alloc] initWithProxy:self];
	}
	return button;
}

-(void)removeBarButtonView
{
	RELEASE_TO_NIL(button);
}


@end
