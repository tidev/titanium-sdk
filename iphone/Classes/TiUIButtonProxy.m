/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIButtonProxy.h"
#import "TiUIButton.h"
#import "TiUINavBarButton.h"

@implementation TiUIButtonProxy

-(void)dealloc
{
	RELEASE_TO_NIL(button);
	[super dealloc];
}

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

-(void)removeNavBarButtonView
{
	RELEASE_TO_NIL(button);
}


@end
