/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPAD

#import "TiUIiPadProxy.h"
#import "TiUtils.h"

@implementation TiUIiPadProxy

-(NSString*)apiName
{
    return @"Ti.UI.iPad";
}


#ifdef USE_TI_UIIPADPOPOVER

MAKE_SYSTEM_PROP_IPAD(POPOVER_ARROW_DIRECTION_UP,UIPopoverArrowDirectionUp);
MAKE_SYSTEM_PROP_IPAD(POPOVER_ARROW_DIRECTION_DOWN,UIPopoverArrowDirectionDown);
MAKE_SYSTEM_PROP_IPAD(POPOVER_ARROW_DIRECTION_LEFT,UIPopoverArrowDirectionLeft);
MAKE_SYSTEM_PROP_IPAD(POPOVER_ARROW_DIRECTION_RIGHT,UIPopoverArrowDirectionRight);
MAKE_SYSTEM_PROP_IPAD(POPOVER_ARROW_DIRECTION_ANY,UIPopoverArrowDirectionAny);
-(NSNumber*)POPOVER_ARROW_DIRECTION_UNKNOWN
{
    if ([TiUtils isIPad]) {
        return NUMUINTEGER(UIPopoverArrowDirectionUnknown);
    }
}
-(id)createPopover:(id)args
{
	if ([TiUtils isIPad])
	{
		return [[[TiUIiPadPopoverProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
	}
	[self throwException:@"this API is not available on non iPad devices" subreason:nil location:CODELOCATION];
}
#endif

#ifdef USE_TI_UIIPADSPLITWINDOW
-(id)createSplitWindow:(id)args
{
	if ([TiUtils isIPad])
	{
        DEPRECATED_REPLACED(@"UI.iPad.createSplitWindow", @"3.6.0", @"Ti.UI.iOS.createSplitWindow()")
		return [[[TiUIiPadSplitWindowProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
	}
	[self throwException:@"this API is not available on non iPad devices" subreason:nil location:CODELOCATION];
}
#endif

#ifdef USE_TI_UIIPADDOCUMENTVIEWER
-(id)createDocumentViewer:(id)args
{
	if ([TiUtils isIPad])
	{
        DEPRECATED_REPLACED(@"UI.iPad.createDocumentViewer", @"2.1.1", @"Ti.UI.iOS.createDocumentViewer()")
        return [[[TiUIiOSDocumentViewerProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
	}
	[self throwException:@"this API is not available on non iPad devices" subreason:nil location:CODELOCATION];
}
#endif

@end

#endif
