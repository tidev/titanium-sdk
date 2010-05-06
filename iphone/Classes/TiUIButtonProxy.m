/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

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

-(void)setStyle:(id)value
{
	styleCache = [TiUtils intValue:value def:UIButtonTypeCustom];
	[self replaceValue:value forKey:@"style" notification:YES];
}

-(UIBarButtonItem*)barButtonItem
{
    /*
	id backgroundImageValue = [self valueForKey:@"backgroundImage"];
	if (!IS_NULL_OR_NIL(backgroundImageValue))
	{
		return [super barButtonItem];
	}
	*/
    
	if (button==nil)
	{
		isUsingBarButtonItem = YES;
		button = [[TiUINavBarButton alloc] initWithProxy:self];
	}
	return button;
}

-(CGFloat) verifyWidth:(CGFloat)suggestedWidth
{
	switch(styleCache)
	{
		case UITitaniumNativeItemInfoLight:
		case UITitaniumNativeItemInfoDark:
			return 18;
		case UITitaniumNativeItemDisclosure:
			return 29;
	}
	return suggestedWidth;
}

-(CGFloat) verifyHeight:(CGFloat)suggestedHeight
{
	switch(styleCache)
	{
		case UITitaniumNativeItemInfoLight:
		case UITitaniumNativeItemInfoDark:
			return 19;
		case UITitaniumNativeItemDisclosure:
			return 31;
	}
	return suggestedHeight;
}


-(UIViewAutoresizing) verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	switch (styleCache)
	{
		case UITitaniumNativeItemInfoLight:
		case UITitaniumNativeItemInfoDark:
		case UITitaniumNativeItemDisclosure:
			return suggestedResizing & ~(UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
	}
	return suggestedResizing;
}

-(UIView *) parentViewForChild:(TiViewProxy *)child
{
	return [(TiUIButton *)[self view] button];
}

-(void)removeBarButtonView
{
	RELEASE_TO_NIL(button);
}

-(void)setToolbar:(TiToolbar*)toolbar_
{
	RELEASE_TO_NIL(toolbar);
	toolbar = [toolbar_ retain];
}

-(TiToolbar*)toolbar
{
	return toolbar;
}

-(BOOL)attachedToToolbar
{
	return toolbar!=nil;
}


@end

#endif