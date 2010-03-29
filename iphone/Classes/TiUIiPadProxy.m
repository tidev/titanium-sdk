/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef IPAD

#import "TiUIiPadProxy.h"
#import "TiUtils.h"

@implementation TiUIiPadProxy


MAKE_SYSTEM_PROP(POPOVER_ARROW_DIRECTION_UP,UIPopoverArrowDirectionUp);
MAKE_SYSTEM_PROP(POPOVER_ARROW_DIRECTION_DOWN,UIPopoverArrowDirectionDown);
MAKE_SYSTEM_PROP(POPOVER_ARROW_DIRECTION_LEFT,UIPopoverArrowDirectionLeft);
MAKE_SYSTEM_PROP(POPOVER_ARROW_DIRECTION_RIGHT,UIPopoverArrowDirectionRight);
MAKE_SYSTEM_PROP(POPOVER_ARROW_DIRECTION_ANY,UIPopoverArrowDirectionAny);
MAKE_SYSTEM_PROP(POPOVER_ARROW_DIRECTION_UNKNOWN,UIPopoverArrowDirectionUnknown);
				 
-(id)createPopover:(id)args
{
	Class cl = NSClassFromString(@"TiUIiPadPopoverProxy");
	return [[[cl alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

-(id)createSplitWindow:(id)args
{
	Class cl = NSClassFromString(@"TiUIiPadSplitWindowProxy");
	return [[[cl alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}


@end

#endif
