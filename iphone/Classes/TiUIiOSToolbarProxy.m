/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTOOLBAR) || defined(USE_TI_UITOOLBAR)


#import "TiUIiOSToolbarProxy.h"
#import "TiUIiOSToolbar.h"

@implementation TiUIiOSToolbarProxy

USE_VIEW_FOR_VERIFY_HEIGHT

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~UIViewAutoresizingFlexibleHeight;
}

-(UIToolbar*)toolbar
{
	TiUIiOSToolbar *theview = (TiUIiOSToolbar*) [self view];
	return [theview toolBar];
}

-(void)setItems:(NSArray *)newItems
{
	NSArray * oldItems = [self valueForUndefinedKey:@"items"];
	if (![oldItems isKindOfClass:[NSArray class]])
	{
		oldItems = nil;
	}

	BOOL newItemsIsArray = [newItems isKindOfClass:[NSArray class]];
	if (newItemsIsArray)
	{
		for (TiViewProxy * currentItem in newItems)
		{
			if (![currentItem respondsToSelector:@selector(supportsNavBarPositioning)] || ![currentItem supportsNavBarPositioning])
			{
				NSString * errorString = [NSString stringWithFormat:@"%@ does not support being in a toolbar!",currentItem];
				[self throwException:errorString subreason:nil location:CODELOCATION];
				/*
				 *	Note that this theoretically could mean proxies are improperly remembered
				 *	if a later entry causes this exception to be thrown. However, the javascript
				 *	should NOT be using nonproxy objects and the onus is on the Javascript
				 */
			}

			if (![oldItems containsObject:currentItem])
			{
				[self rememberProxy:currentItem];
			}
		}
	}
	for (TiViewProxy * currentItem in oldItems) {
		if (newItemsIsArray && [newItems containsObject:currentItem]) {
			continue;
		}
		[self forgetProxy:currentItem];
	}
	[self replaceValue:newItems forKey:@"items" notification:YES];
}

@end

#endif